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

  // ── Fixtures ───────────────────────────────────────────────────────────────

  async getLive(): Promise<NormalizedFootballMatch[]> {
    const data = await this.get('/fixtures/live');
    return (data.data ?? []).map((f: any) => this.normalize(f));
  }

  async getByDate(date: string): Promise<NormalizedFootballMatch[]> {
    const data = await this.get(`/fixtures/date/${date}`);
    return (data.data ?? []).map((f: any) => this.normalize(f));
  }

  async getResultsToday(): Promise<NormalizedFootballMatch[]> {
    const data = await this.get('/results/today');
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
