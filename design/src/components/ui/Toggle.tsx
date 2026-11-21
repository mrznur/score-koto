import { useState } from 'react';

export function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button className={`toggle ${on ? 'on' : ''}`} onClick={() => setOn(!on)}>
      <i />
    </button>
  );
}
