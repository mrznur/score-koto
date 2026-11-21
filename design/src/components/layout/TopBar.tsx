import type { ReactNode } from 'react';
import { Icon } from '../ui/Icon';

export function TopBar({
  title,
  eyebrow,
  onBack,
  action,
}: {
  title: string;
  eyebrow?: string;
  onBack?: () => void;
  action?: ReactNode;
}) {
  return (
    <header className="topbar">
      <div className="topbar-copy">
        {onBack && (
          <button className="icon-button back" onClick={onBack} aria-label="Back">
            ←
          </button>
        )}
        <div>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h1>{title}</h1>
        </div>
      </div>
      {action}
    </header>
  );
}
