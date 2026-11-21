// Normalized internal match models — provider-agnostic

export interface NormalizedFootballMatch {
  id: string; // Goal API fixture id — equals goalApiId; frontend uses it for keys/dedupe/nav
  providerId: string;
  providerName: string; // which API it came from
  homeTeam: string;
  awayTeam: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string; // NS, 1H, HT, 2H, FT, AET, PEN, PST, CANC
  elapsed: number | null;
  competition: string;
  competitionId: string;
  competitionLogo: string | null;
  country: string | null;
  countryFlag: string | null;
  season: number;
  round: string | null;
  venue: string | null;
  kickoff: Date;
  lastSyncedAt: Date; // when Goal API last returned this row
}

export interface NormalizedCricketMatch {
  providerId: string;
  providerName: string;
  name: string;
  matchType: string;
  status: string;
  venue: string | null;
  date: Date;
  teams: string[];
  teamInfo: Array<{ name: string; shortname: string; img: string }>;
  score: Array<{ r: number; w: number; o: number; inning: string }> | null;
  seriesId: string | null;
  matchStarted: boolean;
  matchEnded: boolean;
}

export interface ProviderStatus {
  name: string;
  available: boolean;
  quotaUsed: number;
  quotaLimit: number;
  lastError: string | null;
}
