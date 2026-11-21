import type { View } from '../types';
import { TopBar } from '../components/layout/TopBar';
import { Icon } from '../components/ui/Icon';
import { DateStrip } from '../components/match/DateStrip';
import { FilterBar } from '../components/match/FilterBar';
import { FootballRow } from '../components/match/FootballRow';
import { CricketRow } from '../components/match/CricketRow';

export function Fixtures({ navigate }: { navigate: (v: View) => void }) {
  return (
    <>
      <TopBar
        eyebrow="SCHEDULE"
        title="Fixtures"
        onBack={() => navigate('home')}
        action={
          <button className="icon-button">
            <Icon name="calendar" />
          </button>
        }
      />
      <DateStrip />
      <FilterBar labels={['ALL', 'FOOTBALL', 'CRICKET']} />
      <div className="day-marker">
        <span>WEDNESDAY</span>
        <b>14 MAY 2025</b>
      </div>
      <section>
        <div className="competition-head">
          <div>
            <span>ENG</span>
            <b>Premier League</b>
          </div>
          <small>ROUND 37</small>
        </div>
        <div className="list-surface">
          <FootballRow
            home="Arsenal"
            away="Liverpool"
            score="2 - 1"
            status="78'"
            onClick={() => navigate('match')}
          />
          <FootballRow home="Chelsea" away="Man City" score="-" status="20:00" />
        </div>
      </section>
      <section>
        <div className="competition-head">
          <div>
            <span>ESP</span>
            <b>La Liga</b>
          </div>
          <small>ROUND 36</small>
        </div>
        <div className="list-surface">
          <FootballRow home="Barcelona" away="Real Madrid" score="-" status="21:30" />
        </div>
      </section>
      <section>
        <div className="competition-head">
          <div>
            <span>INT</span>
            <b>T20 International</b>
          </div>
          <small>FINAL</small>
        </div>
        <CricketRow />
      </section>
    </>
  );
}
