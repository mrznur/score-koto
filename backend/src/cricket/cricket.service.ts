import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CricketProviderManager } from '../providers/cricket-provider.manager';
import { NormalizedCricketMatch } from '../providers/provider.types';

@Injectable()
export class CricketService {
  private readonly logger = new Logger(CricketService.name);

  constructor(
    private prisma: PrismaService,
    private providers: CricketProviderManager,
  ) {}

  // ── Activity check (used by the scheduler to avoid wasting quota) ─────────

  /** True if a match is live, or should have started within the last 30 min / starts within 15 min. */
  async hasActivity(): Promise<boolean> {
    const now = Date.now();
    const count = await this.prisma.cricketMatch.count({
      where: {
        OR: [
          { matchStarted: true, matchEnded: false },
          {
            matchStarted: false,
            date: {
              gte: new Date(now - 30 * 60_000),
              lte: new Date(now + 15 * 60_000),
            },
          },
        ],
      },
    });
    return count > 0;
  }

  // ── Sync ───────────────────────────────────────────────────────────────────

  async syncCurrent(): Promise<number> {
    this.logger.log('Syncing current cricket matches...');
    try {
      const matches = await this.providers.getCurrentMatches(0);
      for (const m of matches) await this.upsert(m);
      await this.logSync('cricket', 'current', 'success', matches.length);
      this.logger.log(`Synced ${matches.length} cricket matches`);
      return matches.length;
    } catch (err) {
      await this.logSync('cricket', 'current', 'failed', 0, err.message);
      this.logger.error('Cricket sync failed', err.message);
      throw err;
    }
  }

  async syncScorecard(matchId: string): Promise<number> {
    const match = await this.prisma.cricketMatch.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    const data = await this.providers.getScorecard(match.providerId);
    if (data.status !== 'success' || !data.data?.scorecard) return 0;

    // Delete + recreate inside one transaction so a failure never leaves an empty scorecard
    await this.prisma.$transaction([
      this.prisma.cricketScorecard.deleteMany({ where: { matchId } }),
      ...data.data.scorecard.map((innings: any) =>
        this.prisma.cricketScorecard.create({
          data: {
            matchId,
            inning: innings.inning,
            batting: innings.batting,
            bowling: innings.bowling,
            extras: innings.extras,
            totals: innings.totals,
          },
        }),
      ),
    ]);
    return data.data.scorecard.length;
  }

  private async upsert(m: NormalizedCricketMatch) {
    await this.prisma.cricketMatch.upsert({
      where: { providerId: m.providerId },
      create: {
        providerId: m.providerId,
        name: m.name,
        matchType: m.matchType,
        status: m.status,
        venue: m.venue,
        date: m.date,
        teams: m.teams,
        teamInfo: m.teamInfo,
        score: m.score ?? [],
        seriesId: m.seriesId,
        matchStarted: m.matchStarted,
        matchEnded: m.matchEnded,
        lastSyncedAt: new Date(),
      },
      update: {
        status: m.status,
        score: m.score ?? [],
        teamInfo: m.teamInfo,
        matchStarted: m.matchStarted,
        matchEnded: m.matchEnded,
        lastSyncedAt: new Date(),
      },
    });
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  async getLive() {
    return this.prisma.cricketMatch.findMany({
      where: { matchStarted: true, matchEnded: false },
      orderBy: { date: 'desc' },
    });
  }

  async getFixtures() {
    const now = new Date();
    return this.prisma.cricketMatch.findMany({
      where: { date: { gte: now }, matchStarted: false },
      orderBy: { date: 'asc' },
      take: 30,
    });
  }

  async getResults() {
    return this.prisma.cricketMatch.findMany({
      where: { matchEnded: true },
      orderBy: { date: 'desc' },
      take: 30,
    });
  }

  async getMatch(id: string) {
    return this.prisma.cricketMatch.findUnique({
      where: { id },
      include: { scorecard: true },
    });
  }

  async getByDate(date: string) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    return this.prisma.cricketMatch.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    });
  }

  getProviderStatuses() {
    return this.providers.getProviderStatuses();
  }

  // ── Sync log ───────────────────────────────────────────────────────────────

  private async logSync(provider: string, job: string, status: string, records: number, error?: string) {
    await this.prisma.syncLog.create({ data: { provider, job, status, records, error } });
  }
}
