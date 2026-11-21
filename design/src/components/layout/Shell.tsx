import type { View } from '../../types';
import { BottomNav } from './BottomNav';
import { Home } from '../../screens/Home';
import { Live } from '../../screens/Live';
import { Match } from '../../screens/Match';
import { Fixtures } from '../../screens/Fixtures';
import { Standings } from '../../screens/Standings';
import { Explore } from '../../screens/Explore';
import { Friends } from '../../screens/Friends';
import { AI } from '../../screens/AI';
import { Profile } from '../../screens/Profile';

export function Shell({
  view,
  dark,
  setDark,
  navigate,
}: {
  view: View;
  dark: boolean;
  setDark: (x: boolean) => void;
  navigate: (v: View) => void;
}) {
  const navView = (['match', 'fixtures', 'standings', 'ai'] as View[]).includes(view) ? ('' as const) : view;
  return (
    <div className="device">
      <div className="statusbar">
        <span>9:41</span>
        <i />
        <div>
          <b>▮▮▮</b>
          <b>⌁</b>
          <b>▰</b>
        </div>
      </div>
      <div className="app-scroll">
        <div className="screen">
          {view === 'home' && <Home navigate={navigate} />}
          {view === 'live' && <Live navigate={navigate} />}
          {view === 'match' && <Match navigate={navigate} />}
          {view === 'fixtures' && <Fixtures navigate={navigate} />}
          {view === 'standings' && <Standings navigate={navigate} />}
          {view === 'explore' && <Explore navigate={navigate} />}
          {view === 'friends' && <Friends navigate={navigate} />}
          {view === 'ai' && <AI navigate={navigate} />}
          {view === 'profile' && <Profile dark={dark} setDark={setDark} navigate={navigate} />}
        </div>
      </div>
      <BottomNav activeView={navView} navigate={navigate} />
    </div>
  );
}
