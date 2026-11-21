import type { View } from '../types';
import { Icon } from '../components/ui/Icon';
import { SectionHead } from '../components/layout/SectionHead';
import { TeamMark } from '../components/ui/TeamMark';
import { LiveDot } from '../components/ui/LiveDot';
import { DateStrip } from '../components/match/DateStrip';
import { FootballRow } from '../components/match/FootballRow';
import { CricketRow } from '../components/match/CricketRow';

export function Home({ navigate }: { navigate: (v: View) => void }) {
  return (
    <>
      <div className="home-head">
        <div className="brand" aria-label="Score Koto">
          <img className="brand-logo brand-logo-light" src="/logo-wordmark.png" alt="" />
          <img className="brand-logo brand-logo-dark" src="/logo-wordmark-dark.png" alt="" />
        </div>
        <button className="icon-button notification" aria-label="Notifications">
          <Icon name="bell" />
          <i />
        </button>
      </div>
      <div className="editorial">
        <div className="eyebrow">WED · 14 MAY</div>
        <h1>
          Good evening,
          <br />
          Alex.
        </h1>
        <p>Three live. Two of yours.</p>
      </div>

      <section>
        <SectionHead
          number="01"
          title="Live now"
          action="VIEW ALL"
          onAction={() => navigate('live')}
        />
        <button className="hero-match" onClick={() => navigate('match')}>
          <div className="hero-meta">
            <LiveDot label="78'" />
            <span>PREMIER LEAGUE · MD 37</span>
          </div>
          <div className="hero-score">
            <div>
              <TeamMark team="Arsenal" />
              <span>ARSENAL</span>
            </div>
            <strong>
              <span>2</span>
              <i>:</i>
              <span>1</span>
            </strong>
            <div>
              <TeamMark team="Liverpool" />
              <span>LIVERPOOL</span>
            </div>
          </div>
          <div className="event-line">
            <span>64' Saka</span>
            <span>41' Salah</span>
          </div>
          <div className="open-match">
            OPEN MATCH CENTRE <Icon name="arrow" size={16} />
          </div>
        </button>
        <CricketRow onClick={() => navigate('match')} />
      </section>

      <section>
        <SectionHead
          number="02"
          title="Next up"
          action="FIXTURES"
          onAction={() => navigate('fixtures')}
        />
        <DateStrip />
        <div className="list-surface">
          <FootballRow home="Chelsea" away="Man City" score="-" status="20:00" favourite />
          <FootballRow home="Barcelona" away="Real Madrid" score="-" status="21:30" />
        </div>
      </section>

      <section>
        <SectionHead number="03" title="Your sports" />
        <div className="sports-grid">
          {['FOOTBALL', 'CRICKET', 'BASKETBALL'].map((sport, i) => (
            <button key={sport}>
              <span>0{i + 1}</span>
              <b>{sport}</b>
              <Icon name="arrow" size={16} />
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionHead number="04" title="AI read" />
        <button className="ai-card" onClick={() => navigate('ai')}>
          <div className="ai-card-head">
            <Icon name="spark" size={17} />
            <span>LIVE ANALYSIS · 19:42</span>
          </div>
          <p>
            Arsenal's left-side overload has produced <strong>42%</strong> of their final-third
            entries. Liverpool are now defending 7.3m deeper.
          </p>
          <div>
            EXPLORE THE NUMBERS <Icon name="arrow" size={15} />
          </div>
        </button>
      </section>

      <section>
        <SectionHead number="05" title="Friends" />
        <button className="friend-row" onClick={() => navigate('friends')}>
          <div className="avatar-stack">
            <span>MK</span>
            <span>JS</span>
            <span>RL</span>
          </div>
          <div>
            <b>3 friends are watching</b>
            <small>Arsenal vs Liverpool</small>
          </div>
          <Icon name="chevron" size={18} />
        </button>
      </section>
    </>
  );
}
