import { useState } from 'react';
import type { View } from './types';
import { Shell } from './components/layout/Shell';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [dark, setDark] = useState(false);
  const navigate = (next: View) => {
    setView(next);
    document.querySelector('.app-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <main className={dark ? 'dark app-shell' : 'app-shell'}>
      <div className="ambient-grid" />
      <Shell view={view} dark={dark} setDark={setDark} navigate={navigate} />
    </main>
  );
}
