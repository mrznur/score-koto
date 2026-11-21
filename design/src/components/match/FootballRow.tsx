import { useState } from 'react';
import { Icon } from '../ui/Icon';
import { LiveDot } from '../ui/LiveDot';
import { TeamMark } from '../ui/TeamMark';

export function FootballRow({
  home,
  away,
  score,
  status,
  onClick,
  favourite = false,
}: {
  home: string;
  away: string;
  score: string;
  status: string;
  onClick?: () => void;
  favourite?: boolean;
}) {
  const [fav, setFav] = useState(favourite);
  return (
    <div
      className="match-row"
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
    >
      <div className="match-time">{status.includes("'") ? <LiveDot label={status} /> : status}</div>
      <div className="match-teams">
        <div>
          <TeamMark team={home} small />
          <span>{home}</span>
        </div>
        <div>
          <TeamMark team={away} small />
          <span>{away}</span>
        </div>
      </div>
      <div className="row-score">
        {score.split('-').map((s, i) => (
          <b key={i}>{s.trim()}</b>
        ))}
      </div>
      <button
        className={`fav ${fav ? 'on' : ''}`}
        aria-label="Favourite"
        onClick={(e) => {
          e.stopPropagation();
          setFav(!fav);
        }}
      >
        <Icon name="star" size={15} />
      </button>
    </div>
  );
}
