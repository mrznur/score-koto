import type { View } from '../types';
import { TopBar } from '../components/layout/TopBar';
import { SectionHead } from '../components/layout/SectionHead';
import { Icon } from '../components/ui/Icon';
import { LiveDot } from '../components/ui/LiveDot';

export function Friends({ navigate }: { navigate: (v: View) => void }) {
  return (
    <>
      <TopBar
        eyebrow="YOUR CIRCLE · 08"
        title="Friends"
        action={<button className="text-button">+ INVITE</button>}
      />
      <div className="watching-strip">
        <span className="online-person">
          <i>MK</i>
          <b>Maya</b>
          <small>ARS—LIV</small>
        </span>
        <span className="online-person">
          <i>JS</i>
          <b>Jon</b>
          <small>IND—AUS</small>
        </span>
        <span className="online-person">
          <i>RL</i>
          <b>Ravi</b>
          <small>ARS—LIV</small>
        </span>
        <span className="online-person offline">
          <i>+5</i>
          <b>Others</b>
          <small>OFFLINE</small>
        </span>
      </div>
      <section>
        <SectionHead number="01" title="Live room" />
        <button className="room-card" onClick={() => navigate('match')}>
          <div>
            <LiveDot label="3 WATCHING" />
            <small>PREMIER LEAGUE · 78'</small>
          </div>
          <h3>
            ARS <b>2 : 1</b> LIV
          </h3>
          <p>"Saka has been unreal this half."</p>
          <span>
            JOIN DISCUSSION <Icon name="arrow" size={15} />
          </span>
        </button>
      </section>
      <section>
        <SectionHead number="02" title="Predictions" />
        <div className="prediction">
          <div className="activity-person">
            <span>MK</span>
            <p>
              <b>Maya K.</b>
              <small>18 MIN AGO</small>
            </p>
            <em>+120 PTS</em>
          </div>
          <p>Called Arsenal's next goal before the 60th minute.</p>
          <div className="prediction-score">
            <span>ARSENAL</span>
            <b>2—1</b>
            <span>LIVERPOOL</span>
          </div>
        </div>
        <div className="prediction">
          <div className="activity-person">
            <span>JS</span>
            <p>
              <b>Jon S.</b>
              <small>32 MIN AGO</small>
            </p>
            <em>STREAK 04</em>
          </div>
          <p>India to chase 199 with 2 overs remaining.</p>
        </div>
      </section>
      <section>
        <button className="invite-block">
          <span>BUILD YOUR MATCHDAY GROUP</span>
          <b>Invite friends to compare predictions and follow matches together.</b>
          <i>CREATE INVITE LINK →</i>
        </button>
      </section>
    </>
  );
}
