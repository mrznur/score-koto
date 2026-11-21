import type { View } from '../types';
import { TopBar } from '../components/layout/TopBar';
import { Icon } from '../components/ui/Icon';

const tableRows = [
  ['1', 'Liverpool', '37', '27', '8', '2', '+48', '89'],
  ['2', 'Arsenal', '37', '25', '9', '3', '+42', '84'],
  ['3', 'Man City', '37', '23', '8', '6', '+35', '77'],
  ['4', 'Chelsea', '37', '20', '10', '7', '+24', '70'],
  ['5', 'Newcastle', '37', '19', '7', '11', '+19', '64'],
  ['6', 'Aston Villa', '37', '18', '9', '10', '+13', '63'],
  ['7', 'Nottm Forest', '37', '17', '8', '12', '+8', '59'],
];

export function Standings({ navigate }: { navigate: (v: View) => void }) {
  return (
    <>
      <TopBar eyebrow="2024 / 25" title="Standings" onBack={() => navigate('explore')} />
      <button className="select-row">
        <span>
          <small>COMPETITION</small>
          <b>Premier League</b>
        </span>
        <Icon name="chevron" size={16} />
      </button>
      <div className="table-key">
        <span>CHAMPIONS LEAGUE</span>
        <span>EUROPA</span>
        <span>RELEGATION</span>
      </div>
      <div className="league-table">
        <div className="tr th">
          <span>#</span>
          <b>TEAM</b>
          <span>P</span>
          <span>W</span>
          <span>D</span>
          <span>L</span>
          <span>GD</span>
          <strong>PTS</strong>
        </div>
        {tableRows.map((r, i) => (
          <div className={`tr ${i === 1 ? 'favourite-team' : ''}`} key={r[1]}>
            <span>{r[0]}</span>
            <b>
              {r[1]}
              {i === 1 && <i>★</i>}
            </b>
            {r.slice(2, 7).map((v, j) => (
              <span key={j}>{v}</span>
            ))}
            <strong>{r[7]}</strong>
          </div>
        ))}
      </div>
      <div className="updated">TABLE UPDATED · 14 MAY 2025 · 19:40 UTC</div>
    </>
  );
}
