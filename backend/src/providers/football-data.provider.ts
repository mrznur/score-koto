import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NormalizedFootballMatch } from './provider.types';

// Status mapping from football-data.org to our internal format
const STATUS_MAP: Record<string, string> = {
  SCHEDULED: 'NS',
  TIMED: 'NS',
  IN_PLAY: '1H',
  PAUSED: 'HT',
  FINISHED: 'FT',
  POSTPONED: 'PST',
  CANCELLED: 'CANC',
  SUSPENDED: 'SUSP',
  AWARDED: 'AET',
};

// Free tier competition codes → country info
const COMPETITION_META: Record<string, { country: string; flag: string }> = {
  PL:  { country: 'England',  flag: 'https://flagcdn.com/w40/gb-eng.png' },
  SA:  { country: 'Italy',    flag: 'https://flagcdn.com/w40/it.png' },
  PD:  { country: 'Spain',    flag: 'https://flagcdn.com/w40/es.png' },
  BL1: { country: 'Germany',  flag: 'https://flagcdn.com/w40/de.png' },
  FL1: { country: 'France',   flag: 'https://flagcdn.com/w40/fr.png' },
  CL:  { country: 'Europe',   flag: 'https://flagcdn.com/w40/eu.png' },
  ELC: { country: 'England',  flag: 'https://flagcdn.com/w40/gb-eng.png' },
  DED: { country: 'Netherlands', flag: 'https://flagcdn.com/w40/nl.png' },
  PPL: { country: 'Portugal', flag: 'https://flagcdn.com/w40/pt.png' },
  BSA: { country: 'Brazil',   flag: 'https://flagcdn.com/w40/br.png' },
  CLI: { country: 'South America', flag: 'https://flagcdn.com/w40/un.png' },
  WC:  { country: 'World',    flag: 'https://flagcdn.com/w40/un.png' },
};

@Injectable()
export class FootballDataProvider {
  readonly name = 'football-data';
  private readonly logger = new Logger(FootballDataProvider.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.football-data.org/v4';
  // No hard quota but rate limited to 10 req/min — track last request time
  private lastRequestTime = 0;
  private readonly minInterval = 6100; // 6 seconds between requests

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get('FOOTBALL_DATA_KEY');
  }

  get available(): boolean { return true; } // No daily quota

  get status() {
    return { name: this.name, available: true, quotaUsed: 0, quotaLimit: 600, lastError: null };
  }

  private get headers() {
    return { 'X-Auth-Token': this.apiKey };
  }

  private async get(endpoint: string) {
    // Respect rate limit
    const now = Date.now();
    const wait = this.minInterval - (now - this.lastRequestTime);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    this.lastRequestTime = Date.now();
    const res = await axios.get(`${this.baseUrl}${endpoint}`, { headers: this.headers, timeout: 8000 });
    return res.data;
  }

  async getLive(): Promise<NormalizedFootballMatch[]> {
    const data = await this.get('/matches?status=IN_PLAY,PAUSED');
    return (data.matches ?? []).map((m: any) => this.normalize(m));
  }

  async getByDate(date: string): Promise<NormalizedFootballMatch[]> {
    // football-data's global /matches endpoint returns 0 matches when dateFrom === dateTo,
    // so fetch a 2-day window and keep only the requested day's matches.
    const next = new Date(new Date(`${date}T00:00:00Z`).getTime() + 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    const data = await this.get(`/matches?dateFrom=${date}&dateTo=${next}`);
    return (data.matches ?? [])
      .filter((m: any) => new Date(m.utcDate).toISOString().split('T')[0] === date)
      .map((m: any) => this.normalize(m));
  }

  async getDateRange(from: string, to: string): Promise<NormalizedFootballMatch[]> {
    const data = await this.get(`/matches?dateFrom=${from}&dateTo=${to}`);
    return (data.matches ?? []).map((m: any) => this.normalize(m));
  }

  private normalize(m: any): NormalizedFootballMatch {
    const code = m.competition?.code ?? '';
    const meta = COMPETITION_META[code] ?? { country: m.area?.name ?? null, flag: null };
    return {
      providerId: `footballdata-${m.id}`,
      providerName: this.name,
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
      homeTeamId: `footballdata-${m.homeTeam.id}`,
      awayTeamId: `footballdata-${m.awayTeam.id}`,
      homeTeamLogo: m.homeTeam.crest ?? null,
      awayTeamLogo: m.awayTeam.crest ?? null,
      homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? null,
      awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? null,
      status: STATUS_MAP[m.status] ?? 'NS',
      elapsed: m.minute ?? null,
      competition: m.competition?.name ?? '',
      competitionId: `footballdata-${m.competition?.id}`,
      competitionLogo: m.competition?.emblem ?? null,
      country: meta.country,
      countryFlag: meta.flag,
      season: m.season?.startDate ? new Date(m.season.startDate).getFullYear() : new Date().getFullYear(),
      round: m.matchday ? `Matchday ${m.matchday}` : null,
      venue: m.venue ?? null,
      kickoff: new Date(m.utcDate),
    };
  }
}
