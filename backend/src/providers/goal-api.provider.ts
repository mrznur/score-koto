import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NormalizedFootballMatch } from './provider.types';

// Goal API status → internal status
const STATUS_MAP: Record<string, string> = {
  'Not Started': 'NS',
  'First Half': '1H',
  'Half Time': 'HT',
  'Second Half': '2H',
  'Extra Time': 'ET',
  'Penalty In Progress': 'P',
  'Full Time': 'FT',
  'After Extra Time': 'AET',
  'Penalty Shootout': 'PEN',
  'Postponed': 'PST',
  'Cancelled': 'CANC',
  'Abandoned': 'CANC',
  'Suspended': 'SUSP',
};

@Injectable()
export class GoalApiProvider {
  readonly name = 'goal-api';
  private readonly logger = new Logger(GoalApiProvider.name);
  private readonly baseUrl = 'https://api.goal-api.com/v1';
  private readonly apiKey: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get('GOAL_API_KEY');
  }

  get available(): boolean { return true; }

  get status() {
    return { name: this.name, available: true, quotaUsed: 0, quotaLimit: 999999, lastError: null };
  }

  private get headers() {
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  private async get(endpoint: string) {
    const res = await axios.get(`${this.baseUrl}${endpoint}`, {
      headers: this.headers,
      timeout: 10000,
    });
    return res.data;
  }

  // ── In-memory cache ───────────────────────────────────────────────────────
  // Prevents rate-limit 429s when multiple screens/polls hit the same endpoint
  // within the same window. TTLs are short enough that data stays fresh.
  private readonly cache = new Map<string, { data: any; expiresAt: number }>();

  private async getCached(endpoint: string, ttlMs: number): Promise<any> {
    const now = Date.now();
    const hit = this.cache.get(endpoint);
    if (hit && hit.expiresAt > now) return hit.data;
    try {
      const data = await this.get(endpoint);
      this.cache.set(endpoint, { data, expiresAt: now + ttlMs });
      return data;
    } catch (err: any) {
      // On 429 or any network error, serve stale cache rather than crashing the request.
      // The cache entry stays in place so the next caller also gets the stale value
      // until the rate-limit window resets and a fresh fetch succeeds.
      if (hit) {
        this.logger.warn(`Goal API ${endpoint} failed (${err?.response?.status ?? err?.message}), serving stale cache`);
        return hit.data;
      }
      throw err;
    }
  }

  // ── Fixtures ───────────────────────────────────────────────────────────────

  async getLive(): Promise<NormalizedFootballMatch[]> {
    // 2 min TTL matches the cron interval — only 1 real API call per cron tick
    const data = await this.getCached('/fixtures/live', 2 * 60_000);
    return (data.data ?? []).map((f: any) => this.normalize(f));
  }

  async getByDate(date: string): Promise<NormalizedFootballMatch[]> {
    // 5 min for today (scores update slowly), 60 min for past/future (static)
    const isToday = date === new Date().toISOString().split('T')[0];
    const ttl = isToday ? 5 * 60_000 : 60 * 60_000;
    const data = await this.getCached(`/fixtures/date/${date}`, ttl);
    return (data.data ?? []).map((f: any) => this.normalize(f));
  }

  async getResultsToday(): Promise<NormalizedFootballMatch[]> {
    // 2 min TTL — results don't change that fast
    const data = await this.getCached('/results/today', 2 * 60_000);
    return (data.data ?? []).map((f: any) => this.normalize(f));
  }

  // ── Match detail endpoints (new capabilities) ──────────────────────────────

  async getEvents(fixtureId: string) {
    const data = await this.get(`/fixtures/${fixtureId}/events`);
    return data.data ?? [];
  }

  async getLineups(fixtureId: string) {
    const data = await this.get(`/fixtures/${fixtureId}/lineups`);
    return data.data ?? null;
  }

  async getStatistics(fixtureId: string) {
    const data = await this.get(`/fixtures/${fixtureId}/statistics`);
    return data.data ?? null;
  }

  async getCommentary(fixtureId: string) {
    const data = await this.get(`/fixtures/${fixtureId}/commentary`);
    return data.data ?? [];
  }

  async getFixtureDetail(fixtureId: string) {
    const data = await this.get(`/fixtures/${fixtureId}`);
    return data.data ?? null;
  }

  // Normalized fixture detail — used by match detail so the header reflects the
  // live score/status straight from Goal API, with `id === goalApiId`.
  async getFixtureNormalized(fixtureId: string) {
    const f = await this.getFixtureDetail(fixtureId);
    return f ? this.normalize(f) : null;
  }

  // ── Standings ──────────────────────────────────────────────────────────────

  async getStandings(leagueId: string) {
    const data = await this.get(`/standings/${leagueId}`);
    return data.data ?? [];
  }

  async getTeamDetail(teamId: string) {
    const data = await this.get(`/teams/${teamId}`);
    return data.data ?? null;
  }

  async getTeamSquad(teamId: string) {
    const data = await this.get(`/teams/${teamId}/players`);
    return data.data ?? [];
  }

  async getTeamResults(teamId: string) {
    const data = await this.get(`/teams/${teamId}/results`);
    return data.data ?? [];
  }

  async getTeamUpcoming(teamId: string) {
    const data = await this.get(`/teams/${teamId}/upcoming`);
    return data.data ?? [];
  }

  // ── Normalize ──────────────────────────────────────────────────────────────

  private normalize(f: any): NormalizedFootballMatch & { goalApiId: string } {
    const status = STATUS_MAP[f.matchStatus] ?? (f.matchLive ? '1H' : 'NS');
    const homeScore = f.homeTeamFtScore != null ? Number(f.homeTeamFtScore)
      : f.homeTeamScore != null ? Number(f.homeTeamScore) : null;
    const awayScore = f.awayTeamFtScore != null ? Number(f.awayTeamFtScore)
      : f.awayTeamScore != null ? Number(f.awayTeamScore) : null;
    return {
      providerId: `goalapi-${f.id}`,
      goalApiId: f.id,
      id: f.id,
      lastSyncedAt: new Date(),
      providerName: this.name,
      homeTeam: f.homeTeamName,
      awayTeam: f.awayTeamName,
      homeTeamId: `goalapi-${f.homeTeamId}`,
      awayTeamId: `goalapi-${f.awayTeamId}`,
      homeTeamLogo: f.teamHomeBadge ?? null,
      awayTeamLogo: f.teamAwayBadge ?? null,
      homeScore: isNaN(homeScore) ? null : homeScore,
      awayScore: isNaN(awayScore) ? null : awayScore,
      status,
      elapsed: f.matchMinute != null && !isNaN(Number(f.matchMinute)) ? Number(f.matchMinute) : null,
      competition: f.leagueName ?? '',
      competitionId: `goalapi-${f.leagueId}`,
      competitionLogo: f.leagueLogo ?? null,
      country: f.countryName ?? null,
      countryFlag: f.countryLogo ?? null,
      season: (f.leagueYear && !isNaN(Number(f.leagueYear))) ? Number(f.leagueYear) : new Date().getFullYear(),
      round: f.matchRound ?? null,
      venue: f.matchStadium ?? null,
      kickoff: new Date(f.kickoffUtc ?? f.matchDate),
    };
  }
}
