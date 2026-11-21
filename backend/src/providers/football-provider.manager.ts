import { Injectable, Logger } from '@nestjs/common';
import { ApiFootballProvider } from './api-football.provider';
import { FootballDataProvider } from './football-data.provider';
import { TheSportsDbProvider } from './thesportsdb.provider';
import { GoalApiProvider } from './goal-api.provider';
import { NormalizedFootballMatch, ProviderStatus } from './provider.types';

@Injectable()
export class FootballProviderManager {
  private readonly logger = new Logger(FootballProviderManager.name);

  constructor(
    private goalApi: GoalApiProvider,
    private apiFootball: ApiFootballProvider,
    private footballData: FootballDataProvider,
    private sportsDb: TheSportsDbProvider,
  ) {}

  getProviderStatuses(): ProviderStatus[] {
    return [
      this.goalApi.status,
      this.apiFootball.status,
      this.footballData.status,
      this.sportsDb.status,
    ];
  }

  async getLive(): Promise<NormalizedFootballMatch[]> {
    const results: NormalizedFootballMatch[] = [];

    // Goal API — primary
    try {
      const matches = await this.goalApi.getLive();
      results.push(...matches);
      this.logger.log(`[goal-api] ${matches.length} live matches`);
    } catch (e) {
      this.logger.warn(`[goal-api] getLive failed: ${e.message}`);
    }

    // Also get today's results from Goal API (finished matches)
    try {
      const finished = await this.goalApi.getResultsToday();
      for (const m of finished) {
        if (!this.isDuplicate(m, results)) results.push(m);
      }
      this.logger.log(`[goal-api] ${finished.length} finished matches today`);
    } catch (e) {
      this.logger.warn(`[goal-api] getResultsToday failed: ${e.message}`);
    }

    // API-Football — additional coverage
    if (this.apiFootball.available) {
      try {
        const matches = await this.apiFootball.getLive();
        this.logger.log(`[api-football] ${matches.length} live matches`);
        for (const m of matches) {
          if (!this.isDuplicate(m, results)) results.push(m);
        }
      } catch (e) {
        this.logger.warn(`[api-football] getLive failed: ${e.message}`);
      }
    }

    // TheSportsDB — fallback
    try {
      const matches = await this.sportsDb.getLive();
      for (const m of matches) {
        if (!this.isDuplicate(m, results)) results.push(m);
      }
    } catch (e) {
      this.logger.warn(`[thesportsdb] getLive failed: ${e.message}`);
    }

    return results;
  }

  async getByDate(date: string): Promise<NormalizedFootballMatch[]> {
    const results: NormalizedFootballMatch[] = [];

    // Goal API — primary
    try {
      const matches = await this.goalApi.getByDate(date);
      results.push(...matches);
      this.logger.log(`[goal-api] ${matches.length} matches for ${date}`);
    } catch (e) {
      this.logger.warn(`[goal-api] getByDate failed: ${e.message}`);
    }

    // Goal API results — finished matches with full data
    try {
      const today = new Date().toISOString().split('T')[0];
      if (date === today) {
        const finished = await this.goalApi.getResultsToday();
        for (const m of finished) {
          if (!this.isDuplicate(m, results)) results.push(m);
        }
        this.logger.log(`[goal-api] ${finished.length} results for ${date}`);
      }
    } catch (e) {
      this.logger.warn(`[goal-api] getResultsToday failed: ${e.message}`);
    }

    // API-Football — fills gaps
    if (this.apiFootball.available) {
      try {
        const matches = await this.apiFootball.getByDate(date);
        for (const m of matches) {
          if (!this.isDuplicate(m, results)) results.push(m);
        }
        this.logger.log(`[api-football] ${matches.length} matches for ${date}`);
      } catch (e) {
        this.logger.warn(`[api-football] getByDate failed: ${e.message}`);
      }
    }

    // football-data.org — always try (covers future dates)
    try {
      const matches = await this.footballData.getByDate(date);
      for (const m of matches) {
        if (!this.isDuplicate(m, results)) results.push(m);
      }
      this.logger.log(`[football-data] ${matches.length} matches for ${date}`);
    } catch (e) {
      this.logger.warn(`[football-data] getByDate failed: ${e.message}`);
    }

    return results;
  }

  async getDateRange(from: string, to: string): Promise<NormalizedFootballMatch[]> {
    this.logger.log(`Fetching fixtures from ${from} to ${to}...`);
    try {
      const matches = await this.footballData.getDateRange(from, to);
      this.logger.log(`[football-data] ${matches.length} matches from ${from} to ${to}`);
      return matches;
    } catch (e) {
      this.logger.warn(`[football-data] getDateRange failed: ${e.message}`);
      return [];
    }
  }

  private isDuplicate(match: NormalizedFootballMatch & { goalApiId?: string }, existing: Array<NormalizedFootballMatch & { goalApiId?: string }>): boolean {
    const h = match.homeTeam.toLowerCase().trim();
    const a = match.awayTeam.toLowerCase().trim();
    const d = match.kickoff.toISOString().split('T')[0];
    for (const e of existing) {
      const eh = e.homeTeam.toLowerCase().trim();
      const ea = e.awayTeam.toLowerCase().trim();
      const ed = e.kickoff.toISOString().split('T')[0];
      if (ed === d &&
        (eh === h || eh.includes(h) || h.includes(eh)) &&
        (ea === a || ea.includes(a) || a.includes(ea))) {
        // If the new match has a goalApiId and existing doesn't, copy it over
        if (match.goalApiId && !e.goalApiId) {
          e.goalApiId = match.goalApiId;
        }
        return true;
      }
    }
    return false;
  }
}
