// Decides whether two DB rows / provider records describe the SAME real match.
// Different providers give different providerIds and often different team names
// ("Man City" vs "Manchester City"), so we compare kickoff time + team names.

const norm = (s: string) =>
  (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

// Exact after normalising
const sameExact = (a: string, b: string) => {
  const x = norm(a), y = norm(b);
  return x.length > 0 && x === y;
};

// Looser: one contains the other ("inter" / "internazionale"), or the first 6 letters match
// ("wolverhampton" / "wolverhamptonwanderers", "brighton" / "brightonhovealbion")
const sameLoose = (a: string, b: string) => {
  const x = norm(a), y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (Math.min(x.length, y.length) >= 4 && (x.includes(y) || y.includes(x))) return true;
  return Math.min(x.length, y.length) >= 6 && x.slice(0, 6) === y.slice(0, 6);
};

export const MATCH_WINDOW_MS = 15 * 60_000;

type MatchLike = { homeTeam: string; awayTeam: string; kickoff: Date | string };

export function sameRealMatch(a: MatchLike, b: MatchLike): boolean {
  const dt = Math.abs(new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
  if (!Number.isFinite(dt) || dt > MATCH_WINDOW_MS) return false;

  // Both teams look the same -> same match
  if (sameLoose(a.homeTeam, b.homeTeam) && sameLoose(a.awayTeam, b.awayTeam)) return true;

  // Same exact kickoff and one team identical: a team cannot play two matches at once
  // (covers "PSG" vs "Paris Saint-Germain" style differences on the other side)
  if (dt === 0 && (sameExact(a.homeTeam, b.homeTeam) || sameExact(a.awayTeam, b.awayTeam))) return true;

  return false;
}