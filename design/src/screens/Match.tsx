import { useState } from 'react';
import type { View } from '../types';
import { TopBar } from '../components/layout/TopBar';
import { SectionHead } from '../components/layout/SectionHead';
import { TeamMark } from '../components/ui/TeamMark';
import { LiveDot } from '../components/ui/LiveDot';
import { StatBar } from '../components/match/StatBar';

export function Match({ navigate }: { navigate: (v: View) => void }) {
  const [tab, setTab] = useState('OVERVIEW');
  return (
    <>
      <TopBar
        eyebrow="PREMIER LEAGUE · MD 37"
        title="Match centre"
        onBack={() => navigate('live')}
        action={<LiveDot label="78'" />}
      />
      <section className="scoreboard">
        <div className="score-id">
          PL-2437-09 <span>EMIRATES STADIUM</span>
        </div>
        <div className="big-score">
          <div>
            <TeamMark team="Arsenal" />
            <b>ARSENAL</b>
            <small>HOME</small>
          </div>
          <strong>
            <span>2</span>
            <i>:</i>
            <span>1</span>
          </strong>
          <div>
            <TeamMark team="Liverpool" />
            <b>LIVERPOOL</b>
            <small>AWAY</small>
          </div>
        </div>
        <div className="score-status">
          <i />
          <b>SECOND HALF</b>
          <span>+4 added</span>
        </div>
      </section>
      <div className="tabs">
        {['OVERVIEW', 'STATS', 'LINEUP', 'AI'].map((x) => (
          <button
            className={tab === x ? 'active' : ''}
            onClick={() => {
              setTab(x);
              if (x === 'AI') navigate('ai');
            }}
            key={x}
          >
            {x}
          </button>
        ))}
      </div>
      {tab === 'OVERVIEW' && (
        <>
          <section>
            <SectionHead number="01" title="Momentum" />
            <div className="momentum">
              <div className="momentum-bars">
                {[
                  18, 32, 22, 45, 62, 35, 58, 75, 42, 70, 88, 62, 48, 72, 92, 74, 52, 38, 65, 82,
                ].map((n, i) => (
                  <i key={i} className={i > 12 ? 'away' : ''} style={{ height: `${n}%` }} />
                ))}
              </div>
              <div>
                <span>ARS</span>
                <b>45'</b>
                <span>LIV</span>
              </div>
            </div>
          </section>
          <section>
            <SectionHead number="02" title="Key stats" />
            <div className="stats-surface">
              <StatBar label="POSSESSION %" left="54" right="46" percent={54} />
              <StatBar label="SHOTS" left="14" right="09" percent={61} />
              <StatBar label="ON TARGET" left="06" right="04" percent={60} />
              <StatBar label="XG" left="1.84" right="1.21" percent={60} />
            </div>
          </section>
          <section>
            <SectionHead number="03" title="Timeline" />
            <div className="timeline">
              <div>
                <time>78'</time>
                <i />
                <p>
                  <b>YELLOW CARD</b> Declan Rice · Arsenal
                </p>
              </div>
              <div>
                <time>64'</time>
                <i className="goal" />
                <p>
                  <b>GOAL · 2—1</b> Bukayo Saka · Arsenal
                </p>
              </div>
              <div>
                <time>41'</time>
                <i className="goal away" />
                <p>
                  <b>GOAL · 1—1</b> Mohamed Salah · Liverpool
                </p>
              </div>
              <div>
                <time>18'</time>
                <i className="goal" />
                <p>
                  <b>GOAL · 1—0</b> Martin Ødegaard · Arsenal
                </p>
              </div>
            </div>
          </section>
        </>
      )}
      {tab === 'STATS' && (
        <section>
          <SectionHead number="01" title="Full statistics" />
          <div className="stats-surface">
            <StatBar label="PASSES" left="438" right="391" percent={53} />
            <StatBar label="PASS ACCURACY" left="88%" right="84%" percent={51} />
            <StatBar label="CORNERS" left="07" right="03" percent={70} />
            <StatBar label="FOULS" left="08" right="11" percent={42} />
            <StatBar label="TACKLES" left="12" right="16" percent={43} />
          </div>
        </section>
      )}
      {tab === 'LINEUP' && (
        <section>
          <SectionHead number="01" title="Starting XI" />
          <div className="lineup-grid">
            {[
              'Raya',
              'White',
              'Saliba',
              'Gabriel',
              'Timber',
              'Rice',
              'Ødegaard',
              'Saka',
              'Havertz',
              'Martinelli',
            ].map((p, i) => (
              <div key={p}>
                <span>{i + 2}</span>
                <b>{p}</b>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
