import { CricketMatch } from '../services/api';

export function isTopCricketMatch(m: CricketMatch): boolean {
  const name = m.name.toLowerCase();
  return (
    m.matchType === 'test' ||
    m.matchType === 'odi' ||
    name.includes('world cup') ||
    name.includes('ipl') ||
    name.includes('big bash') ||
    name.includes('champions trophy') ||
    name.includes('t20 world') ||
    name.includes('asia cup')
  );
}

// Lets one failed request not hide the results of the others
export type Settled<T> = { ok: true; v: T } | { ok: false; e: any };
export function settle<T>(p: Promise<T>): Promise<Settled<T>> {
  return p.then(
    (v) => ({ ok: true as const, v }),
    (e) => ({ ok: false as const, e }),
  );
}

// The newest sync time among the matches, so "UPDATED" shows when the DATA was synced,
// not just when the phone asked for it
export function latestSync(items: { lastSyncedAt: string }[]): Date | null {
  let max = 0;
  for (const it of items) {
    const t = new Date(it.lastSyncedAt).getTime();
    if (Number.isFinite(t) && t > max) max = t;
  }
  return max > 0 ? new Date(max) : null;
}

export function errorMessage(e: any): string {
  if (!e?.response) {
    return 'Cannot reach the backend. Check that it is running and your phone is on the same Wi-Fi.';
  }
  return `Server error (${e.response.status})`;
}

// Matches a score to a team by the innings label (e.g. "India Inning 1") instead of by position
export function cricketScore(match: CricketMatch, team: string, index: number) {
  const scores = match.score ?? [];
  const lower = team.toLowerCase();
  const matching = scores.filter((s) => s.inning?.toLowerCase().includes(lower));
  if (matching.length > 0) return matching[matching.length - 1];
  // If no label names ANY team, fall back to position. Otherwise this team has not batted yet.
  const labelsNameATeam = scores.some((s) =>
    match.teams.some((t) => s.inning?.toLowerCase().includes(t.toLowerCase())),
  );
  return labelsNameATeam ? null : scores[index] ?? null;
}