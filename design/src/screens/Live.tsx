import type { View } from '../types';
import { TopBar } from '../components/layout/TopBar';
import { FilterBar } from '../components/match/FilterBar';
import { FootballRow } from '../components/match/FootballRow';
import { CricketRow } from '../components/match/CricketRow';
import { LiveDot } from '../components/ui/LiveDot';

export function Live({ navigate }: { navigate: (v: View) => void }) {
  return (
    <>
      <TopBar
        eyebrow="SPORTS CENTRE"
        title="Live / now"
        action={<span className="live-count">06 LIVE</span>}
      />
      <FilterBar labels={['ALL', 'FOOTBALL', 'CRICKET', 'OTHER']} />
      <div className="ticker">
        <span>DATA SYNC</span>
        <div />
        <b>UPDATED 8 SEC AGO</b>
      </div>
      <section>
        <div className="competition-head">
          <div>
            <span>ENG</span>
            <b>Premier League</b>
          </div>
          <small>2 LIVE</small>
        </div>
        <div className="list-surface">
          <FootballRow
            home="Arsenal"
            away="Liverpool"
            score="2 - 1"
            status="78'"
            onClick={() => navigate('match')}
            favourite
          />
          <FootballRow
            home="Chelsea"
            away="Man City"
            score="0 - 0"
            status="HT"
            onClick={() => navigate('match')}
          />
        </div>
      </section>
      <section>
        <div className="competition-head">
          <div>
            <span>ESP</span>
            <b>La Liga</b>
          </div>
          <small>1 LIVE</small>
        </div>
        <div className="list-surface">
          <FootballRow
            home="Barcelona"
            away="Real Madrid"
            score="1 - 2"
            status="63'"
            onClick={() => navigate('match')}
          />
        </div>
      </section>
      <section>
        <div className="competition-head">
          <div>
            <span>INT</span>
            <b>T20 International</b>
          </div>
          <small>2ND INNINGS</small>
        </div>
        <CricketRow onClick={() => navigate('match')} />
      </section>
      <section>
        <div className="competition-head">
          <div>
            <span>EUR</span>
            <b>Champions League</b>
          </div>
          <small>EXTRA TIME</small>
        </div>
        <div className="list-surface">
          <FootballRow
            home="Man City"
            away="Real Madrid"
            score="3 - 3"
            status="104'"
            onClick={() => navigate('match')}
          />
        </div>
      </section>
    </>
  );
}
