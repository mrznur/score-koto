import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { FootballProviderManager } from '../providers/football-provider.manager';
import { GoalApiProvider } from '../providers/goal-api.provider';
import { NormalizedFootballMatch } from '../providers/provider.types';
import { MATCH_WINDOW_MS, sameRealMatch } from './match-identity';

const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'P', 'BT'];
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class FootballService implements OnApplicationBootstrap {
  private readonly logger = new Logger(FootballService.name);

  constructor(
    private prisma: PrismaService,
    private providers: FootballProviderManager,
    private goalApi: GoalApiProvider,
  ) {}

  // One-off cleanup of duplicates created before the sync learned to detect them,
  // and of matches wrongly stored as live before they kicked off
  async onApplicationBootstrap() {
    try {
      const fixed = await this.fixEarlyLive();
      if (fixed > 0) this.logger.log(`Reset ${fixed} not-yet-started matches from live to NS`);
      const removed = await this.mergeDuplicates();
      if (removed > 0) this.logger.log(`Merged ${removed} duplicate match rows`);
    } catch (err) {
      this.logger.warn(`Duplicate merge failed: ${err.message}`);
    }
  }

  // ── Activity check (used by the scheduler to avoid wasting quota) ─────────

  /** True if a match is live, or should have started within the last 30 min / starts within 10 min. */
  async hasActivity(): Promise<boolean> {
    const now = Date.now();
    const count = await this.prisma.footballMatch.count({
      where: {
        OR: [
          { status: { in: LIVE_STATUSES } },
          {
            status: 'NS',
            kickoff: {
              gte: new Date(now - 30 * 60_000),
              lte: new Date(now + 10 * 60_000),
            },
          },
        ],
      },
    });
    return count > 0;
  }

  // ── Sync ──────────────────────────────────────────────────────────────────

  async syncLive(): Promise<number> {
    this.logger.log('Syncing live football...');
    try {
      const matches = await this.providers.getLive();
      for (const m of matches) await this.upsert(m);
      await this.logSync('football', 'live', 'success', matches.length);
      return matches.length;
    } catch (err) {
      await this.logSync('football', 'live', 'failed', 0, err.message);
      throw err;
    }
  }

  async syncToday(): Promise<number> {
    return this.syncDate(new Date().toISOString().split('T')[0]);
  }

  async syncGoalApiResults(): Promise<number> {
    try {
      const results = await this.goalApi.getResultsToday();
      for (const m of results) await this.upsert(m);
      await this.logSync('football', 'goalapi-results', 'success', results.length);
      this.logger.log(`Synced ${results.length} Goal API results`);
      return results.length;
    } catch (err) {
      await this.logSync('football', 'goalapi-results', 'failed', 0, err.message);
      return 0;
    }
  }

  async syncDate(date: string): Promise<number> {
    try {
      const matches = await this.providers.getByDate(date);
      for (const m of matches) await this.upsert(m);
      await this.logSync('football', `fixtures-${date}`, 'success', matches.length);
      return matches.length;
    } catch (err) {
      await this.logSync('football', `fixtures-${date}`, 'failed', 0, err.message);
      throw err;
    }
  }

  async syncUpcoming(days = 7): Promise<number> {
    const from = new Date(); from.setDate(from.getDate() + 1);
    const to = new Date(); to.setDate(to.getDate() + days);
    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];
    try {
      const matches = await this.providers.getDateRange(fromStr, toStr);
      for (const m of matches) await this.upsert(m);
      await this.logSync('football', `upcoming`, 'success', matches.length);
      return matches.length;
    } catch (err) {
      await this.logSync('football', 'upcoming', 'failed', 0, err.message);
      throw err;
    }
  }

  // A match cannot be live before kickoff. Some providers mark today's matches 1H early.
  private safeStatus(m: NormalizedFootballMatch): string {
    if (LIVE_STATUSES.includes(m.status)) {
      const t = new Date(m.kickoff).getTime();
      if (Number.isFinite(t) && t - Date.now() > 5 * 60_000) return 'NS';
    }
    return m.status;
  }

  async fixEarlyLive(): Promise<number> {
    const res = await this.prisma.footballMatch.updateMany({
      where: {
        status: { in: LIVE_STATUSES },
        kickoff: { gt: new Date(Date.now() + 5 * 60_000) },
      },
      data: { status: 'NS', elapsed: null },
    });
    return res.count;
  }

  private updateData(m: NormalizedFootballMatch & { goalApiId?: string }) {
    return {
      goalApiId: m.goalApiId ?? undefined,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      status: this.safeStatus(m),
      elapsed: m.elapsed,
      homeTeamLogo: m.homeTeamLogo,
      awayTeamLogo: m.awayTeamLogo,
      competitionLogo: m.competitionLogo,
      country: m.country,
      countryFlag: m.countryFlag,
      lastSyncedAt: new Date(),
    };
  }

  // The same real match can arrive from several providers with different providerIds.
  // Look for an existing row of the same match (other providerId) so we update it
  // instead of inserting a second copy.
  private async findDuplicate(m: NormalizedFootballMatch) {
    const t = new Date(m.kickoff).getTime();
    if (!Number.isFinite(t)) return null;
    const candidates = await this.prisma.footballMatch.findMany({
      where: {
        kickoff: { gte: new Date(t - MATCH_WINDOW_MS), lte: new Date(t + MATCH_WINDOW_MS) },
        providerId: { not: m.providerId },
      },
    });
    return candidates.find(c => sameRealMatch(c, m)) ?? null;
  }

  private async upsert(m: NormalizedFootballMatch & { goalApiId?: string }) {
    const sameProvider = await this.prisma.footballMatch.findUnique({
      where: { providerId: m.providerId },
      select: { id: true },
    });

    if (!sameProvider) {
      const dup = await this.findDuplicate(m);
      if (dup) {
        await this.prisma.footballMatch.update({ where: { id: dup.id }, data: this.updateData(m) });
        return;
      }
    }

    await this.prisma.footballMatch.upsert({
      where: { providerId: m.providerId },
      create: {
        providerId: m.providerId,
        goalApiId: m.goalApiId ?? null,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        homeTeamLogo: m.homeTeamLogo,
        awayTeamLogo: m.awayTeamLogo,
        competitionLogo: m.competitionLogo,
        country: m.country,
        countryFlag: m.countryFlag,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        status: this.safeStatus(m),
        elapsed: m.elapsed,
        competition: m.competition,
        competitionId: m.competitionId,
        season: m.season,
        round: m.round,
        venue: m.venue,
        kickoff: m.kickoff,
        lastSyncedAt: new Date(),
      },
      update: this.updateData(m),
    });
  }

  // Removes duplicate rows already in the DB (recent past + next 2 weeks only).
  // Keeps the Goal API row when there is one (it has the match-detail data), else the newest sync.
  async mergeDuplicates(): Promise<number> {
    const now = Date.now();
    const rows = await this.prisma.footballMatch.findMany({
      where: { kickoff: { gte: new Date(now - 3 * DAY_MS), lte: new Date(now + 14 * DAY_MS) } },
      orderBy: { kickoff: 'asc' },
    });

    const gone = new Set<string>();
    let removed = 0;

    for (let i = 0; i < rows.length; i++) {
      if (gone.has(rows[i].id)) continue;
      const group = [rows[i]];
      for (let j = i + 1; j < rows.length; j++) {
        if (rows[j].kickoff.getTime() - rows[i].kickoff.getTime() > MATCH_WINDOW_MS) break;
        if (gone.has(rows[j].id)) continue;
        if (sameRealMatch(rows[i], rows[j])) group.push(rows[j]);
      }
      if (group.length < 2) continue;

      const score = (r: (typeof rows)[number]) =>
        (r.goalApiId || r.providerId.startsWith('goalapi-') ? 2 : 0);
      group.sort(
        (a, b) => score(b) - score(a) || b.lastSyncedAt.getTime() - a.lastSyncedAt.getTime(),
      );
      const keep = group[0];
      const drop = group.slice(1);

      const goalApiId = keep.goalApiId ?? drop.find(d => d.goalApiId)?.goalApiId ?? null;
      if (goalApiId && !keep.goalApiId) {
        await this.prisma.footballMatch.update({ where: { id: keep.id }, data: { goalApiId } });
      }
      await this.prisma.footballMatch.deleteMany({ where: { id: { in: drop.map(d => d.id) } } });
      drop.forEach(d => gone.add(d.id));
      removed += drop.length;
    }
    return removed;
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  async getLive() {
    return this.prisma.footballMatch.findMany({
      where: {
        status: { in: LIVE_STATUSES },
        // Only show matches that have actual scores — filters out Goal API
        // matches incorrectly marked as 1H before they start
        OR: [
          { homeScore: { not: null } },
          { status: 'HT' },
        ],
      },
      orderBy: { kickoff: 'desc' },
    });
  }

  async getFixtures() {
    const now = new Date();
    return this.prisma.footballMatch.findMany({
      where: { kickoff: { gte: now }, status: 'NS' },
      orderBy: { kickoff: 'asc' },
      take: 50,
    });
  }

  async getResults() {
    return this.prisma.footballMatch.findMany({
      where: { status: 'FT' },
      orderBy: { kickoff: 'desc' },
      take: 30,
    });
  }

  async getByDate(date: string) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    return this.prisma.footballMatch.findMany({
      where: { kickoff: { gte: start, lte: end } },
      orderBy: { kickoff: 'asc' },
    });
  }

  async getMatch(id: string) {
    return this.prisma.footballMatch.findUnique({ where: { id } });
  }

  // ── Match detail — fetch live from Goal API ───────────────────────────────
  // Looks up the Goal API fixture ID, then fetches all detail in parallel.
  // Returns data or { unavailable: true } for each section.

  async getMatchDetail(id: string) {
    const match = await this.prisma.footballMatch.findUnique({ where: { id } });
    if (!match) throw new NotFoundException('Match not found');

    // Resolve Goal API fixture ID
    let goalId = match.goalApiId
      ?? (match.providerId.startsWith('goalapi-') ? match.providerId.replace('goalapi-', '') : null);

    // If no goalApiId, find it from Goal API by date and team names, then persist it
    if (!goalId) {
      try {
        const date = match.kickoff.toISOString().split('T')[0];
        const fixtures = await this.goalApi.getByDate(date);
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        const homeNorm = norm(match.homeTeam);
        const awayNorm = norm(match.awayTeam);
        const found = (fixtures as any[]).find((f: any) => {
          const h = norm(f.homeTeamName ?? '');
          const a = norm(f.awayTeamName ?? '');
          // Both teams must partially match — use 4-char prefix to handle spelling differences
          const homeMatch = h.startsWith(homeNorm.slice(0, 4)) || homeNorm.startsWith(h.slice(0, 4));
          const awayMatch = a.startsWith(awayNorm.slice(0, 4)) || awayNorm.startsWith(a.slice(0, 4));
          return homeMatch && awayMatch;
        });
        if (found?.goalApiId) {
          goalId = found.goalApiId;
          await this.prisma.footballMatch.update({ where: { id }, data: { goalApiId: goalId } });
          this.logger.log(`Resolved goalApiId ${goalId} for match ${match.homeTeam} vs ${match.awayTeam}`);
        }
      } catch (e) {
        this.logger.warn(`Could not resolve goalApiId for match ${id}: ${e.message}`);
      }
    }

    if (!goalId) {
      return { match, events: [], statistics: null, lineups: null, commentary: [], goalApiAvailable: false };
    }

    // Fetch all 4 in parallel
    const [events, statistics, lineups, commentary] = await Promise.all([
      this.goalApi.getEvents(goalId).catch(() => []),
      this.goalApi.getStatistics(goalId).catch(() => null),
      this.goalApi.getLineups(goalId).catch(() => null),
      this.goalApi.getCommentary(goalId).catch(() => []),
    ]);

    return { match, events, statistics, lineups, commentary, goalApiAvailable: true };
  }

  // Mark matches as FT if they've been live for more than 3 hours
  // This catches matches the provider never sent a final update for
  async cleanupStaleMatches(): Promise<void> {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const stale = await this.prisma.footballMatch.findMany({
      where: {
        status: { in: LIVE_STATUSES },
        kickoff: { lte: threeHoursAgo },
      },
    });
    if (stale.length === 0) return;
    await this.prisma.footballMatch.updateMany({
      where: {
        id: { in: stale.map(m => m.id) },
      },
      data: { status: 'FT' },
    });
    this.logger.log(`Cleaned up ${stale.length} stale live matches → FT`);
  }

  async getStandings(leagueId: string) {
    return this.goalApi.getStandings(leagueId);
  }

  async getTeam(teamId: string) {
    return this.goalApi.getTeamDetail(teamId);
  }

  async getTeamSquad(teamId: string) {
    return this.goalApi.getTeamSquad(teamId);
  }

  async getTeamResults(teamId: string) {
    return this.goalApi.getTeamResults(teamId);
  }

  async getTeamFixtures(teamId: string) {
    return this.goalApi.getTeamUpcoming(teamId);
  }

  async getTopLeagues() {
    // Top leagues with their Goal API IDs — hardcoded for reliability
    return [
      { id: 'cmr77dvkr005nrx06lp7rvp49', name: 'Premier League',       country: 'England',  flag: 'https://flagcdn.com/w40/gb-eng.png' },
      { id: 'cmr77dvm3006srx06cqnvqrqc', name: 'La Liga',               country: 'Spain',    flag: 'https://flagcdn.com/w40/es.png' },
      { id: 'cmr77dvmj006yrx06u7f2i7vh', name: 'Bundesliga',            country: 'Germany',  flag: 'https://flagcdn.com/w40/de.png' },
      { id: 'cmr77dvlt005yrx06phnp3xwl', name: 'Serie A',               country: 'Italy',    flag: 'https://flagcdn.com/w40/it.png' },
      { id: 'cmr77dvl50059rx06rwi3zxjt', name: 'Ligue 1',               country: 'France',   flag: 'https://flagcdn.com/w40/fr.png' },
      { id: 'cmr77dvhg001arx06djlhv8en', name: 'UEFA Champions League', country: 'Europe',   flag: 'https://flagcdn.com/w40/eu.png' },
      { id: 'cmr77dvhj001mrx06d7q33eii', name: 'UEFA Europa League',    country: 'Europe',   flag: 'https://flagcdn.com/w40/eu.png' },
      { id: 'cmr77dvhq001yrx06qqjj0uxm', name: 'MLS',                   country: 'USA',      flag: 'https://flagcdn.com/w40/us.png' },
      { id: 'cmr77dvl90063rx06qrndbhxy', name: 'Eredivisie',            country: 'Netherlands', flag: 'https://flagcdn.com/w40/nl.png' },
      { id: 'cmr77dvl20053rx064iqpwbk0', name: 'Primeira Liga',         country: 'Portugal', flag: 'https://flagcdn.com/w40/pt.png' },
    ];
  }

  getProviderStatuses() {
    return this.providers.getProviderStatuses();
  }

  private async logSync(provider: string, job: string, status: string, records: number, error?: string) {
    await this.prisma.syncLog.create({ data: { provider, job, status, records, error } });
  }
}