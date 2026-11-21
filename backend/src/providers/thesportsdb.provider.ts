import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { NormalizedFootballMatch } from './provider.types';

const STATUS_MAP: Record<string, string> = {
  '1H': '1H', 'HT': 'HT', '2H': '2H', 'ET': 'ET',
  'FT': 'FT', 'AET': 'AET', 'PEN': 'PEN',
  'NS': 'NS', 'PST': 'PST', 'CANC': 'CANC',
};

@Injectable()
export class TheSportsDbProvider {
  readonly name = 'thesportsdb';
  private readonly logger = new Logger(TheSportsDbProvider.name);
  private readonly baseUrl = 'https://www.thesportsdb.com/api/v1/json/123';

  get available(): boolean { return true; }

  get status() {
    return { name: this.name, available: true, quotaUsed: 0, quotaLimit: 999999, lastError: null };
  }

  async getLive(): Promise<NormalizedFootballMatch[]> {
    try {
      const res = await axios.get(`${this.baseUrl}/livescore.php?s=Soccer`, { timeout: 8000 });
      const events = res.data?.livescore ?? [];
      return events
        .filter((e: any) => ['1H','HT','2H','ET'].includes(e.strStatus))
        .map((e: any) => this.normalize(e));
    } catch (err) {
      this.logger.error('TheSportsDB getLive failed', err.message);
      return [];
    }
  }

  // TheSportsDB free tier doesn't support date-based fixture queries
  // It's used only for live scores and team badge enrichment
  async getTeamBadge(teamName: string): Promise<string | null> {
    try {
      const res = await axios.get(
        `${this.baseUrl}/searchteams.php?t=${encodeURIComponent(teamName)}`,
        { timeout: 5000 }
      );
      return res.data?.teams?.[0]?.strTeamBadge ?? null;
    } catch {
      return null;
    }
  }

  private normalize(e: any): NormalizedFootballMatch {
    return {
      providerId: `thesportsdb-${e.idEvent}`,
      providerName: this.name,
      homeTeam: e.strHomeTeam,
      awayTeam: e.strAwayTeam,
      homeTeamId: `thesportsdb-${e.idHomeTeam}`,
      awayTeamId: `thesportsdb-${e.idAwayTeam}`,
      homeTeamLogo: e.strHomeTeamBadge ?? null,
      awayTeamLogo: e.strAwayTeamBadge ?? null,
      homeScore: e.intHomeScore != null ? parseInt(e.intHomeScore) : null,
      awayScore: e.intAwayScore != null ? parseInt(e.intAwayScore) : null,
      status: STATUS_MAP[e.strStatus] ?? e.strStatus,
      elapsed: e.strProgress ? parseInt(e.strProgress) : null,
      competition: e.strLeague ?? '',
      competitionId: `thesportsdb-${e.idLeague}`,
      competitionLogo: null,
      country: null,
      countryFlag: null,
      season: new Date().getFullYear(),
      round: null,
      venue: null,
      kickoff: new Date(e.strTimestamp),
    };
  }
}
