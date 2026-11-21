import { FootballMatch } from '../services/api';
import { bigMatchKey, clubRank, FollowedTeams, normTeam } from './footballRanking';

export const DAY_MS = 24 * 60 * 60 * 1000;

const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'P', 'BT'];
const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];
export const isLiveStatus = (s: string) => LIVE_STATUSES.includes(s);
export const isFinishedStatus = (s: string) => FINISHED_STATUSES.includes(s);

// Not started yet: anything that is not live, finished, postponed, cancelled or abandoned
const NOT_PLAYING = ['PST', 'CANC', 'ABD', 'AWD', 'WO', 'SUSP', 'INT'];
export const isUpcomingStatus = (s: string) =>
  !isLiveStatus(s) && !isFinishedStatus(s) && !NOT_PLAYING.includes(s);

// A match cannot be live before its kickoff. Some providers mark today's matches "1H" early,
// so a live status with a kickoff still in the future is really "not started".
const START_GRACE_MS = 5 * 60_000;
export function fixEarlyLive(list: FootballMatch[], now = Date.now()): FootballMatch[] {
  return list.map(m => {
    if (!isLiveStatus(m.status)) return m;
    const t = new Date(m.kickoff).getTime();
    return Number.isFinite(t) && t - now > START_GRACE_MS
      ? { ...m, status: 'NS', elapsed: null }
      : m;
  });
}

// For lists that must contain only matches that are really live
export function cleanLive(list: FootballMatch[]): FootballMatch[] {
  return fixEarlyLive(list).filter(m => isLiveStatus(m.status));
}

export type CardMode = 'live' | 'result' | 'upcoming';
export type FeaturedItem = { match: FootballMatch; mode: CardMode };

// The same real match from two providers has different ids and often different team names
// ("Man City" / "Manchester City"). A team cannot play two matches at the same moment, so:
// same kickoff minute + same team on either side = same match.
const canonCache = new Map<string, string>();
function canonTeam(name: string): string {
  let c = canonCache.get(name);
  if (c === undefined) {
    const r = clubRank(name);
    c = r !== 99 ? `#${r}` : normTeam(name); // top clubs: all aliases collapse to one value
    canonCache.set(name, c);
  }
  return c;
}

const kickoffMinute = (m: FootballMatch) => Math.round(new Date(m.kickoff).getTime() / 60000);

export function sameMatch(a: FootballMatch, b: FootballMatch): boolean {
  if (a.id === b.id) return true;
  const ta = kickoffMinute(a);
  if (!Number.isFinite(ta) || ta !== kickoffMinute(b)) return false;
  return (
    canonTeam(a.homeTeam) === canonTeam(b.homeTeam) ||
    canonTeam(a.awayTeam) === canonTeam(b.awayTeam)
  );
}

// Keeps the most recently synced row for each real match
export function dedupeMatches(list: FootballMatch[]): FootballMatch[] {
  const kept: FootballMatch[] = [];
  const byMinute = new Map<number, number[]>(); // kickoff minute -> indexes in kept
  for (const m of list) {
    const t = kickoffMinute(m);
    const bucket = Number.isFinite(t) ? byMinute.get(t) : undefined;
    const idx = bucket?.find(i => sameMatch(kept[i], m));
    if (idx === undefined) {
      kept.push(m);
      if (Number.isFinite(t)) {
        if (bucket) bucket.push(kept.length - 1);
        else byMinute.set(t, [kept.length - 1]);
      }
    } else if (new Date(m.lastSyncedAt).getTime() > new Date(kept[idx].lastSyncedAt).getTime()) {
      kept[idx] = m;
    }
  }
  return kept;
}

// Carousel logic:
//   1. any live big match  -> only live big matches (biggest club first, then league)
//   2. otherwise           -> big matches within +-24h (nearest in time first)
export function buildFeatured(
  liveIn: FootballMatch[],
  nearbyIn: FootballMatch[],
  now: number,
  followed?: FollowedTeams,
): FeaturedItem[] {
  const live = dedupeMatches(liveIn);
  const nearby = dedupeMatches(nearbyIn);

  const liveBig = live
    .map(m => ({ m, k: bigMatchKey(m, followed) }))
    .filter((x): x is { m: FootballMatch; k: { rank: number; slot: number } } => x.k !== null)
    .sort((a, b) => a.k.rank - b.k.rank || a.k.slot - b.k.slot)
    .map(x => x.m);

  if (liveBig.length > 0) {
    return liveBig.slice(0, 8).map(match => ({ match, mode: 'live' as CardMode }));
  }

  const seen = new Set<string>();
  const items: FeaturedItem[] = [];
  for (const m of nearby) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    if (!bigMatchKey(m, followed)) continue;
    const t = new Date(m.kickoff).getTime();
    if (!Number.isFinite(t) || Math.abs(t - now) > DAY_MS) continue;
    if (isFinishedStatus(m.status)) items.push({ match: m, mode: 'result' });
    else if (isLiveStatus(m.status)) items.push({ match: m, mode: 'live' });
    else if (m.status === 'NS') items.push({ match: m, mode: 'upcoming' });
  }
  items.sort(
    (a, b) =>
      Math.abs(new Date(a.match.kickoff).getTime() - now) -
      Math.abs(new Date(b.match.kickoff).getTime() - now),
  );
  return items.slice(0, 8);
}

export function kickoffTime(m: FootballMatch): string {
  return new Date(m.kickoff).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

// UTC date strings (same format FixturesScreen sends to getByDate) for yesterday / today / tomorrow
export function nearbyDates(): string[] {
  const now = Date.now();
  return [now - DAY_MS, now, now + DAY_MS].map(t => new Date(t).toISOString().split('T')[0]);
}