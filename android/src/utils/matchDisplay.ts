import { FootballMatch } from '../services/api';
import { isFinishedStatus, isLiveStatus, kickoffTime } from './featured';

// Score text for a match row: real score once started, "-" before kickoff
export function matchScore(m: FootballMatch): string {
  return isLiveStatus(m.status) || isFinishedStatus(m.status)
    ? `${m.homeScore ?? '-'} - ${m.awayScore ?? '-'}`
    : '-';
}

// Status text for a match row: elapsed minute while live, FT/AET/PEN when finished,
// kickoff time before the match. Set showDateWhenNotToday to false on screens that
// are already filtered to one day (Fixtures).
export function matchStatus(m: FootballMatch, showDateWhenNotToday = true): string {
  if (isLiveStatus(m.status)) return m.elapsed ? `${m.elapsed}'` : m.status;
  if (isFinishedStatus(m.status)) return m.status;
  if (!showDateWhenNotToday) return kickoffTime(m);
  const d = new Date(m.kickoff);
  return d.toDateString() === new Date().toDateString()
    ? kickoffTime(m)
    : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase();
}