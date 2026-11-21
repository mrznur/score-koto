import type { View } from '../../types';
import { navItems } from '../../constants/navigation';
import { Icon } from '../ui/Icon';

export function BottomNav({ activeView, navigate }: { activeView: View | ''; navigate: (v: View) => void }) {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.view}
          className={activeView === item.view ? 'active' : ''}
          onClick={() => navigate(item.view)}
        >
          <span>
            <Icon name={item.icon} size={20} />
            {item.view === 'live' && <i />}
          </span>
          <b>{item.label}</b>
        </button>
      ))}
    </nav>
  );
}
