import { teams } from '../../constants/teams';

export function TeamMark({ team, small = false }: { team: string; small?: boolean }) {
  const data = teams[team] || { short: team.slice(0, 3).toUpperCase(), color: '#151515' };
  return (
    <span
      className={`team-mark ${small ? 'small' : ''}`}
      style={{ '--team': data.color } as React.CSSProperties}
    >
      {data.short.slice(0, 1)}
    </span>
  );
}
