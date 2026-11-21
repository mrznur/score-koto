import { FootballMatch } from '../services/api';

// League priority: exact name match (+ country where it matters).
// "2. Bundesliga" or "FKF Premier League" => 99.
// Slots 1-8 = top leagues + UEFA comps. 9+ = internationals / cups.
const LEAGUE_RULES: Array<{ name: string; slot: number; country?: string }> = [
  { name: 'uefa champions league', slot: 1 },
  { name: 'champions league', slot: 1 },
  { name: 'premier league', slot: 2, country: 'england' },
  { name: 'primera division', slot: 3, country: 'spain' },
  { name: 'la liga', slot: 3, country: 'spain' },
  { name: 'bundesliga', slot: 4, country: 'germany' },
  { name: 'serie a', slot: 5, country: 'italy' },
  { name: 'ligue 1', slot: 6, country: 'france' },
  { name: 'uefa europa league', slot: 7 },
  { name: 'europa league', slot: 7 },
  { name: 'uefa conference league', slot: 8 },
  { name: 'conference league', slot: 8 },
  { name: 'fifa world cup', slot: 9 },
  { name: 'world cup', slot: 9 },
  { name: 'copa america', slot: 10 },
  { name: 'uefa nations league', slot: 11 },
  { name: 'nations league', slot: 11 },
  { name: 'mls', slot: 12, country: 'usa' },
  { name: 'fa cup', slot: 13, country: 'england' },
];

export const BIG_MATCH_MAX_SLOT = 8; // top 5 leagues + UCL/UEL/UECL

// One display name per slot, so "Primera Division" and "La Liga" (or "Champions League" and
// "UEFA Champions League") from different providers become the same competition
const SLOT_NAMES: Record<number, string> = {
  1: 'UEFA Champions League',
  2: 'Premier League',
  3: 'La Liga',
  4: 'Bundesliga',
  5: 'Serie A',
  6: 'Ligue 1',
  7: 'UEFA Europa League',
  8: 'UEFA Conference League',
  9: 'FIFA World Cup',
  10: 'Copa America',
  11: 'UEFA Nations League',
  12: 'MLS',
  13: 'FA Cup',
};

export function canonicalCompetition(competition: string, country: string | null): string {
  const slot = getSlot(competition, country);
  return SLOT_NAMES[slot] ?? competition;
}

// Domestic top 5 leagues only (Premier League, La Liga, Bundesliga, Serie A, Ligue 1)
export function isTop5League(m: FootballMatch): boolean {
  const slot = getSlot(m.competition, m.country);
  return slot >= 2 && slot <= 6;
}

// Top 5 domestic leagues + UEFA Champions League — slots 1-6
// (same set FixturesScreen opens by default)
export function isTop5OrUcl(m: FootballMatch): boolean {
  const slot = getSlot(m.competition, m.country);
  return slot >= 1 && slot <= 6;
}

export function getSlot(competition: string, country: string | null): number {
  const low = competition.toLowerCase().trim();
  const countryLow = (country ?? '').toLowerCase();
  for (const rule of LEAGUE_RULES) {
    if (low !== rule.name) continue;
    if (rule.country && !countryLow.includes(rule.country)) continue;
    return rule.slot;
  }
  return 99;
}

// Live list order: top competitions first (by slot), then everything else A-Z by country
export function sortedLive(matches: FootballMatch[]): FootballMatch[] {
  return [...matches].sort((a, b) => {
    const sa = getSlot(a.competition, a.country);
    const sb = getSlot(b.competition, b.country);
    if (sa !== sb) return sa - sb;
    return (a.country ?? '').localeCompare(b.country ?? '');
  });
}

// Top 20 clubs. ORDER = PRIORITY (index 0 is the biggest). Edit freely.
// Aliases are matched EXACTLY after normalising (lowercase, no accents/punctuation)
// so "Real Madrid Castilla" won't match.
const TOP_CLUBS: string[][] = [
  ['Bayern München', 'Bayern Munich', 'FC Bayern München', 'Bayern Munchen'],
  ['Arsenal'],
  ['Paris Saint-Germain', 'Paris Saint Germain', 'Paris SG', 'PSG'],
  ['Barcelona', 'FC Barcelona'],
  ['Real Madrid'],
  ['Inter Milan', 'Inter', 'Internazionale', 'FC Internazionale Milano'],
  ['Manchester City', 'Man City'],
  ['Borussia Dortmund', 'Dortmund', 'BVB'],
  ['Brighton & Hove Albion', 'Brighton and Hove Albion', 'Brighton'],
  ['Como 1907', 'Como'],
  ['AS Roma', 'Roma'],
  ['Aston Villa'],
  ['Liverpool FC', 'Liverpool'],
  ['Benfica', 'SL Benfica'],
  ['AFC Bournemouth', 'Bournemouth'],
  ['Sporting Portugal', 'Sporting CP', 'Sporting Lisbon'],
  ['Atlético Madrid', 'Atletico Madrid', 'Atletico de Madrid', 'Club Atletico de Madrid'],
  ['Lazio', 'SS Lazio'],
  ['Club Brugge', 'Club Brugge KV'],
  ['Real Betis', 'Betis'],
];

export function normTeam(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const CLUB_RANK = new Map<string, number>();
TOP_CLUBS.forEach((aliases, rank) => {
  aliases.forEach(a => CLUB_RANK.set(normTeam(a), rank));
});

export function clubRank(team: string): number {
  return CLUB_RANK.get(normTeam(team)) ?? 99;
}

// Teams the user follows. Matched by id OR normalised name (providers use different ids/names)
export type FollowedTeams = { ids: Set<string>; names: Set<string> };

export function isFollowedMatch(m: FootballMatch, f?: FollowedTeams): boolean {
  if (!f) return false;
  return (
    f.ids.has(String(m.homeTeamId)) || f.ids.has(String(m.awayTeamId)) ||
    f.names.has(normTeam(m.homeTeam)) || f.names.has(normTeam(m.awayTeam))
  );
}

// Lower = bigger. Followed teams rank -1 (above the whole top-20) in any league.
// Returns null if the match isn't "big".
export function bigMatchKey(
  m: FootballMatch,
  followed?: FollowedTeams,
): { rank: number; slot: number } | null {
  const slot = getSlot(m.competition, m.country);
  if (isFollowedMatch(m, followed)) return { rank: -1, slot };
  if (slot > BIG_MATCH_MAX_SLOT) return null;
  const rank = Math.min(clubRank(m.homeTeam), clubRank(m.awayTeam));
  if (rank === 99) return null;
  return { rank, slot };
}