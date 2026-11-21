import { FollowedItem } from '../hooks/useFollowing';
import { FootballMatch } from '../services/api';
import { FollowedTeams, isFollowedMatch, normTeam } from './footballRanking';
import { dedupeMatches, isFinishedStatus, isLiveStatus, sameMatch } from './featured';

export function buildFollowedTeams(items: FollowedItem[]): FollowedTeams {
  const ids = new Set<string>();
  const names = new Set<string>();
  for (const it of items) {
    if (it.type !== 'team') continue;
    ids.add(String(it.id));
    names.add(normTeam(it.name));
  }
  return { ids, names };
}

// One match per followed team: live now > nearest in time of (latest result, next fixture).
// Uses data Home already loads (live + yesterday/today/tomorrow), so no extra requests.
export function pickYourTeamsMatches(
  items: FollowedItem[],
  pool: FootballMatch[],
  now: number,
  max = 5,
): FootballMatch[] {
  const all = dedupeMatches(pool);
  const picked: FootballMatch[] = [];

  for (const it of items) {
    if (it.type !== 'team') continue;
    const one = buildFollowedTeams([it]);
    const mine = all.filter(m => isFollowedMatch(m, one));
    if (mine.length === 0) continue;

    const time = (m: FootballMatch) => new Date(m.kickoff).getTime();
    const live = mine.find(m => isLiveStatus(m.status));
    let best: FootballMatch | undefined = live;

    if (!best) {
      const finished = mine.filter(m => isFinishedStatus(m.status)).sort((a, b) => time(b) - time(a))[0];
      const upcoming = mine.filter(m => m.status === 'NS').sort((a, b) => time(a) - time(b))[0];
      if (finished && upcoming) {
        best = Math.abs(time(finished) - now) <= Math.abs(time(upcoming) - now) ? finished : upcoming;
      } else {
        best = finished ?? upcoming;
      }
    }
    if (best && !picked.some(p => sameMatch(p, best!))) picked.push(best); // two followed teams meeting = one row
  }
  return picked.slice(0, max);
}

// Row text helpers now live in matchDisplay.ts (shared with the Fixtures screen)
export { matchStatus as rowStatus, matchScore as rowScore } from './matchDisplay';