import { useState } from 'react';

export function FilterBar({ labels }: { labels: string[] }) {
  const [active, setActive] = useState(0);
  return (
    <div className="filter-bar">
      {labels.map((label, index) => (
        <button
          key={label}
          className={active === index ? 'active' : ''}
          onClick={() => setActive(index)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
