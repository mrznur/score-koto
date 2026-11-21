import type { View } from '../types';
import { TopBar } from '../components/layout/TopBar';
import { SectionHead } from '../components/layout/SectionHead';
import { Icon } from '../components/ui/Icon';
import { TeamMark } from '../components/ui/TeamMark';
import { Toggle } from '../components/ui/Toggle';

export function Profile({
  dark,
  setDark,
  navigate,
}: {
  dark: boolean;
  setDark: (x: boolean) => void;
  navigate: (v: View) => void;
}) {
  return (
    <>
      <TopBar
        eyebrow="MEMBER SINCE 2023"
        title="Profile"
        action={
          <button className="icon-button">
            <Icon name="settings" />
          </button>
        }
      />
      <div className="profile-card">
        <div className="profile-avatar">AD</div>
        <div>
          <h2>Alex D.</h2>
          <p>London · GMT +1</p>
        </div>
        <span>EDIT</span>
      </div>
      <div className="profile-stats">
        <div>
          <b>04</b>
          <span>TEAMS</span>
        </div>
        <div>
          <b>07</b>
          <span>LEAGUES</span>
        </div>
        <div>
          <b>08</b>
          <span>FRIENDS</span>
        </div>
      </div>
      <section>
        <SectionHead number="01" title="Favourites" />
        <div className="favourite-teams">
          {['Arsenal', 'India', 'Barcelona'].map((t) => (
            <button key={t}>
              <TeamMark team={t} />
              <span>
                <b>{t}</b>
                <small>{t === 'India' ? 'CRICKET' : 'FOOTBALL'}</small>
              </span>
              <Icon name="chevron" size={16} />
            </button>
          ))}
          <button className="add-team">
            <i>+</i>
            <span>
              <b>Add team</b>
              <small>PERSONALISE SCORES</small>
            </span>
          </button>
        </div>
      </section>
      <section>
        <SectionHead number="02" title="Preferences" />
        <div className="settings-list">
          <div>
            <span>
              <b>Dark appearance</b>
              <small>Use black system surfaces</small>
            </span>
            <button className={`toggle ${dark ? 'on' : ''}`} onClick={() => setDark(!dark)}>
              <i />
            </button>
          </div>
          <div>
            <span>
              <b>Goal alerts</b>
              <small>Favourite teams only</small>
            </span>
            <Toggle defaultOn />
          </div>
          <div>
            <span>
              <b>Match reminders</b>
              <small>15 minutes before start</small>
            </span>
            <Toggle defaultOn />
          </div>
          <div>
            <span>
              <b>AI detail level</b>
              <small>Technical</small>
            </span>
            <Icon name="chevron" size={16} />
          </div>
        </div>
      </section>
      <section>
        <button className="wide-action" onClick={() => navigate('friends')}>
          MANAGE FRIENDS <Icon name="arrow" size={16} />
        </button>
      </section>
      <div className="version">SCORE KOTO · VERSION 1.0.4 · BUILD 204</div>
    </>
  );
}
