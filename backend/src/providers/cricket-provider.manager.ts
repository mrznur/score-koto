import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { NormalizedCricketMatch, ProviderStatus } from './provider.types';

// Single cricket provider class that can hold multiple API keys
// When one key's quota is exhausted, automatically tries the next
@Injectable()
export class CricketProviderManager {
  private readonly logger = new Logger(CricketProviderManager.name);
  private readonly baseUrl = 'https://api.cricapi.com/v1';

  // Multiple keys = multiple 100/day quotas
  private readonly keys: Array<{ key: string; used: number; limit: number; label: string }>;

  constructor(private config: ConfigService) {
    this.keys = [
      { key: this.config.get('CRICKET_API_KEY'),   used: 0, limit: 100, label: 'primary' },
      { key: this.config.get('CRICKET_API_KEY_2') ?? '', used: 0, limit: 100, label: 'secondary' },
    ].filter(k => k.key !== '');
  }

  getProviderStatuses(): ProviderStatus[] {
    return this.keys.map(k => ({
      name: `cricketdata-${k.label}`,
      available: k.used < k.limit,
      quotaUsed: k.used,
      quotaLimit: k.limit,
      lastError: null,
    }));
  }

  private getAvailableKey() {
    return this.keys.find(k => k.used < k.limit && k.key !== '') ?? null;
  }

  get available(): boolean {
    return this.getAvailableKey() !== null;
  }

  private async get(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const key = this.getAvailableKey();
    if (!key) throw new Error('All CricketData API keys exhausted');

    const queryParams = new URLSearchParams({ apikey: key.key, ...params }).toString();
    const res = await axios.get(`${this.baseUrl}/${endpoint}?${queryParams}`, { timeout: 8000 });
    key.used++;
    return res.data;
  }

  async getCurrentMatches(offset = 0): Promise<NormalizedCricketMatch[]> {
    const data = await this.get('currentMatches', { offset: String(offset) });
    if (data.status !== 'success') throw new Error(data.message ?? 'CricketData error');
    return (data.data ?? []).map((m: any) => this.normalize(m));
  }

  async getScorecard(matchId: string): Promise<any> {
    const data = await this.get('match_scorecard', { id: matchId });
    return data;
  }

  private normalize(m: any): NormalizedCricketMatch {
    return {
      providerId: m.id,
      providerName: 'cricketdata',
      name: m.name,
      matchType: m.matchType ?? 'unknown',
      status: m.status,
      venue: m.venue ?? null,
      date: new Date(m.dateTimeGMT),
      teams: m.teams ?? [],
      teamInfo: m.teamInfo ?? [],
      score: m.score ?? null,
      seriesId: m.series_id ?? null,
      matchStarted: m.matchStarted ?? false,
      matchEnded: m.matchEnded ?? false,
    };
  }
}
