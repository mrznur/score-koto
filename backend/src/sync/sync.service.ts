import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FootballService } from '../football/football.service';
import { CricketService } from '../cricket/cricket.service';
import { LiveGateway } from '../live/live.gateway';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  // Jobs currently running, and when each last ran (in memory, resets on restart)
  private running = new Set<string>();
  private lastRun = new Map<string, number>();

  constructor(
    private football: FootballService,
    private cricket: CricketService,
    private liveGateway: LiveGateway,
  ) {}

  /**
   * Runs a job only if the previous run has finished and at least
   * `minGapMs` has passed since the last run. This stops overlapping runs
   * and lets us run less often when nothing is happening.
   */
  private async runJob(key: string, minGapMs: number, job: () => Promise<void>) {
    if (this.running.has(key)) {
      this.logger.warn(`[CRON] ${key} skipped, previous run still going`);
      return;
    }
    // 5s tolerance so a cron tick slightly early does not skip a whole cycle
    if (Date.now() - (this.lastRun.get(key) ?? 0) < minGapMs - 5000) return;

    this.running.add(key);
    this.lastRun.set(key, Date.now());
    try {
      await job();
    } catch (e) {
      this.logger.error(`[CRON] ${key} failed: ${e.message}`);
    } finally {
      this.running.delete(key);
    }
  }

  // Football live-push timer: every 2 minutes, push the latest live matches
  // straight from Goal API to connected WebSocket clients. No DB writes, no sync.
  @Cron('*/2 * * * *')
  async syncFootballLive() {
    await this.runJob('football-live', 2 * 60_000, async () => {
      const matches = await this.football.getLive();
      this.liveGateway.pushFootballUpdate(matches);
      this.logger.log(`[CRON] Pushed ${matches.length} live football matches`);
    });
  }

  // Cricket: every 5 min when a match is live or about to start, otherwise every 30 min
  @Cron('*/5 * * * *')
  async syncCricket() {
    const active = await this.cricket.hasActivity();
    await this.runJob('cricket', active ? 5 * 60_000 : 30 * 60_000, async () => {
      this.logger.log(`[CRON] Syncing cricket (${active ? 'active' : 'idle'})...`);
      await this.cricket.syncCurrent();
      const matches = await this.cricket.getLive();
      this.liveGateway.pushCricketUpdate(matches);
      this.logger.log(`[CRON] Pushed ${matches.length} live cricket matches via WebSocket`);
    });
  }
}
