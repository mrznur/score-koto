import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { QuotaService } from '../common/quota.service';
import { NormalizedFootballMatch } from './provider.types';

@Injectable()
export class ApiFootballProvider implements OnModuleInit {
  readonly name = 'api-football';
  private readonly logger = new Logger(ApiFootballProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://v3.football.api-sports.io';
  private readonly quotaLimit = 100;
  private quotaUsed = 0;
  private quotaDate = '';
  private lastError: string | null = null;

  constructor(
    private config: ConfigService,
    private quota: QuotaService,
  ) {
    this.apiKey = this.config.get('FOOTBALL_API_KEY');
  }

  async onModuleInit() {
    if (!this.apiKey) this.logger.warn('FOOTBALL_API_KEY is not set, API-Football will fail');
    this.quotaDate = this.todayUtc();
    this.quotaUsed = await this.quota.getUsed(this.name);
    this.logger.log(`API-Football usage today: ${this.quotaUsed}/${this.quotaLimit}`);
  }

  private todayUtc(): string {
    return new Date().toISOString().split('T')[0];
  }

  get available(): boolean {
    // Reset the in-memory counter when the UTC day changes
    if (this.quotaDate !== this.todayUtc()) {
      this.quotaDate = this.todayUtc();
      this.quotaUsed = 0;
    }
    return this.quotaUsed < this.quotaLimit;
  }

  get status() {
    return {
      name: this.name,
      available: this.available,
      quotaUsed: this.quotaUsed,
      quotaLimit: this.quotaLimit,
      lastError: this.lastError,
    };
  }

  private get headers() {
    return { 'x-apisports-key': this.apiKey };
  }

  private async get(endpoint: string) {
    if (!this.available) throw new Error('API-Football quota exhausted');
    try {
      const res = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: this.headers,
        timeout: 8000,
      });
      // API-Football can report errors (bad key, rate limit) inside a 200 response
      const errors = res.data?.errors;
      if (errors && Object.keys(errors).length > 0) {
        throw new Error(`API-Football error: ${JSON.stringify(errors)}`);
      }
      this.lastError = null;
      return res.data.response ?? [];
    } catch (e) {
      this.lastError = e.message;
      throw e;
    } finally {
      // Count every attempt, even failed ones, so usage is never under-counted
      try {
        this.quotaUsed = await this.quota.record(this.name, this.quotaLimit);
      } catch (dbErr) {
        this.quotaUsed++;
        this.logger.warn(`Could not persist API usage: ${dbErr.message}`);
      }
    }
  }

  async getLive(): Promise<NormalizedFootballMatch[]> {
    const data = await this.get('/fixtures?live=all');
    return data.map((f: any) => this.normalize(f));
  }

  async getByDate(date: string): Promise<NormalizedFootballMatch[]> {
    const data = await this.get(`/fixtures?date=${date}`);
    return data.map((f: any) => this.normalize(f));
  }

  private normalize(f: any): NormalizedFootballMatch {
    return {
      providerId: `apifootball-${f.fixture.id}`,
      providerName: this.name,
      homeTeam: f.teams.home.name,
      awayTeam: f.teams.away.name,
      homeTeamId: String(f.teams.home.id),
      awayTeamId: String(f.teams.away.id),
      homeTeamLogo: f.teams.home.logo,
      awayTeamLogo: f.teams.away.logo,
      homeScore: f.goals.home,
      awayScore: f.goals.away,
      status: f.fixture.status.short,
      elapsed: f.fixture.status.elapsed,
      competition: f.league.name,
      competitionId: `apifootball-${f.league.id}`,
      competitionLogo: f.league.logo,
      country: f.league.country,
      countryFlag: f.league.flag,
      season: f.league.season,
      round: f.league.round,
      venue: f.fixture.venue?.name ?? null,
      kickoff: new Date(f.fixture.date),
    };
  }
}
