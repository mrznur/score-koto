import axios from 'axios';

// When Expo uses LAN mode, the emulator reaches the backend via your machine's LAN IP.
// 10.0.2.2 works only in tunnel/localhost mode.
// Using LAN IP directly works for both emulator and physical device on same network.
const BASE_URL = 'http://192.168.0.109:3000/api/v1';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// ── Types ──────────────────────────────────────────────────────────────────

export interface FootballMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  competitionLogo: string | null;
  country: string | null;
  countryFlag: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  elapsed: number | null;
  competition: string;
  round: string | null;
  venue: string | null;
  kickoff: string;
  lastSyncedAt: string;
  goalApiId: string;
}

export interface CricketMatch {
  id: string;
  name: string;
  matchType: string;
  status: string;
  venue: string | null;
  date: string;
  teams: string[];
  teamInfo: Array<{ name: string; shortname: string; img: string }> | null;
  score: Array<{ r: number; w: number; o: number; inning: string }> | null;
  matchStarted: boolean;
  matchEnded: boolean;
  lastSyncedAt: string;
}

// ── Football ───────────────────────────────────────────────────────────────

export const footballApi = {
  getLive: () => client.get<FootballMatch[]>('/football/live').then(r => r.data),
  getFixtures: () => client.get<FootballMatch[]>('/football/fixtures').then(r => r.data),
  getResults: () => client.get<FootballMatch[]>('/football/results').then(r => r.data),
  getMatch: (goalApiId: string) => client.get<any>(`/football/matches/${goalApiId}`).then(r => r.data),
  getByDate: (date: string) => client.get<FootballMatch[]>(`/football/by-date/${date}`).then(r => r.data),
  getStandings: (leagueId: string) => client.get<any[]>(`/football/standings/${leagueId}`).then(r => r.data),
  getTopLeagues: () => client.get<any[]>('/football/leagues/top').then(r => r.data),
  getTeam: (teamId: string) => client.get<any>(`/football/teams/${teamId}`).then(r => r.data),
  getTeamSquad: (teamId: string) => client.get<any[]>(`/football/teams/${teamId}/squad`).then(r => r.data),
  getTeamResults: (teamId: string) => client.get<any[]>(`/football/teams/${teamId}/results`).then(r => r.data),
  getTeamFixtures: (teamId: string) => client.get<any[]>(`/football/teams/${teamId}/fixtures`).then(r => r.data),
};

// ── Cricket ────────────────────────────────────────────────────────────────

export const cricketApi = {
  getLive: () => client.get<CricketMatch[]>('/cricket/live').then(r => r.data),
  getFixtures: () => client.get<CricketMatch[]>('/cricket/fixtures').then(r => r.data),
  getResults: () => client.get<CricketMatch[]>('/cricket/results').then(r => r.data),
  getMatch: (id: string) => client.get<CricketMatch>(`/cricket/matches/${id}`).then(r => r.data),
  getByDate: (date: string) => client.get<CricketMatch[]>(`/cricket/by-date/${date}`).then(r => r.data),
};

// ── Health ─────────────────────────────────────────────────────────────────

export const healthApi = {
  check: () => client.get('/health').then(r => r.data),
};
