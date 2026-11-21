import { Injectable, NotFoundException } from '@nestjs/common';
import { GoalApiProvider } from '../providers/goal-api.provider';
import { NormalizedFootballMatch } from '../providers/provider.types';

// Goal API pass-through proxy: every read hits Goal API directly on each
// request. No DB match storage, no multi-provider merge/dedup. Each normalized
// match carries `id` equal to the Goal API fixture id (goalApiId), which is what
// the frontend uses for React keys, dedupeMatches, sameMatch and navigation.

@Injectable()
export class FootballService {
  constructor(private goalApi: GoalApiProvider) {}

  // ── Reads (Goal API pass-through) ──────────────────────────────────────────

  async getLive(): Promise<NormalizedFootballMatch[]> {
    // Live first, then today's results. Goal API drops HT/FT matches from
    // /fixtures/live, so merge results back in and dedupe by id (live wins).
    const [live, results] = await Promise.all([
      this.goalApi.getLive().catch(() => []),
      this.goalApi.getResultsToday().catch(() => []),
    ]);
    const seen = new Set<string>();
    const out: NormalizedFootballMatch[] = [];
    for (const m of [...live, ...results]) {
      if (!m?.id || seen.has(m.id)) continue;
      seen.add(m.id);
      out.push(m);
    }
    return out;
  }

  async getFixtures(): Promise<NormalizedFootballMatch[]> {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const matches = await this.goalApi.getByDate(today).catch(() => []);
    return matches
      .filter((m) => m.status === 'NS' && new Date(m.kickoff) >= now)
      .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
      .slice(0, 50);
  }

  async getResults(): Promise<NormalizedFootballMatch[]> {
    return this.goalApi.getResultsToday();
  }

  async getByDate(date: string): Promise<NormalizedFootballMatch[]> {
    return this.goalApi.getByDate(date);
  }

  // :id is the Goal API fixture id (=== normalized match.id).
  async getMatchDetail(id: string) {
    const [match, events, statistics, lineups, commentary] = await Promise.all([
      this.goalApi.getFixtureNormalized(id).catch(() => null),
      this.goalApi.getEvents(id).catch(() => []),
      this.goalApi.getStatistics(id).catch(() => null),
      this.goalApi.getLineups(id).catch(() => null),
      this.goalApi.getCommentary(id).catch(() => []),
    ]);
    if (!match) throw new NotFoundException('Match not found');
    return { match, events, statistics, lineups, commentary, goalApiAvailable: true };
  }

  // ── Standings / teams / leagues ────────────────────────────────────────────

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
    return [this.goalApi.status];
  }
}
