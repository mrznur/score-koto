import { LiveDot } from '../ui/LiveDot';
import { TeamMark } from '../ui/TeamMark';

export function CricketRow({ onClick }: { onClick?: () => void }) {
  return (
    <div className="cricket-row" role="button" onClick={onClick}>
      <div className="cricket-meta">
        <LiveDot label="2ND INN" />
        <span>12.4 OV</span>
      </div>
      <div className="cricket-team">
        <TeamMark team="India" small />
        <span>INDIA</span>
        <b>164/4</b>
      </div>
      <div className="cricket-team dim">
        <TeamMark team="Australia" small />
        <span>AUSTRALIA</span>
        <b>198/7</b>
      </div>
      <p>India need 35 from 44 balls · RR 7.84</p>
    </div>
  );
}
