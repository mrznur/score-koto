import type { View } from '../types';
import { TopBar } from '../components/layout/TopBar';
import { SectionHead } from '../components/layout/SectionHead';
import { Icon } from '../components/ui/Icon';

export function Explore({ navigate }: { navigate: (v: View) => void }) {
  return (
    <>
      <TopBar
        eyebrow="DISCOVER"
        title="Explore"
        action={
          <button className="icon-button">
            <Icon name="search" />
          </button>
        }
      />
      <button className="search-box">
        <Icon name="search" size={18} />
        <span>SEARCH TEAM, LEAGUE, SPORT</span>
        <kbd>⌘K</kbd>
      </button>
      <section>
        <SectionHead number="01" title="Sports" />
        <div className="explore-sports">
          <button>
            <span>01</span>
            <b>
              FOOT
              <br />
              BALL
            </b>
            <small>42 LIVE</small>
          </button>
          <button>
            <span>02</span>
            <b>
              CRIC
              <br />
              KET
            </b>
            <small>12 LIVE</small>
          </button>
          <button>
            <span>03</span>
            <b>
              BASKET
              <br />
              BALL
            </b>
            <small>08 LIVE</small>
          </button>
          <button>
            <span>04</span>
            <b>TENNIS</b>
            <small>21 LIVE</small>
          </button>
        </div>
      </section>
      <section>
        <SectionHead number="02" title="Your tools" />
        <div className="tool-links">
          <button onClick={() => navigate('fixtures')}>
            <Icon name="calendar" />
            <span>
              <b>Fixtures + results</b>
              <small>Full match calendar</small>
            </span>
            <Icon name="chevron" />
          </button>
          <button onClick={() => navigate('standings')}>
            <Icon name="table" />
            <span>
              <b>League standings</b>
              <small>Tables across competitions</small>
            </span>
            <Icon name="chevron" />
          </button>
          <button onClick={() => navigate('ai')}>
            <Icon name="spark" />
            <span>
              <b>AI sports assistant</b>
              <small>Ask about any match</small>
            </span>
            <Icon name="chevron" />
          </button>
        </div>
      </section>
      <section>
        <SectionHead number="03" title="Popular competitions" />
        <div className="competition-grid">
          {[
            ['PL', 'Premier League', 'ENG'],
            ['UCL', 'Champions League', 'EUR'],
            ['IPL', 'Indian Premier League', 'IND'],
            ['NBA', 'National Basketball', 'USA'],
          ].map((x) => (
            <button key={x[0]}>
              <strong>{x[0]}</strong>
              <span>
                <b>{x[1]}</b>
                <small>{x[2]} · FOLLOWING</small>
              </span>
              <Icon name="chevron" size={16} />
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
