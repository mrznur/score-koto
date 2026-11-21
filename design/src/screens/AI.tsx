import { useState } from 'react';
import type { View } from '../types';
import { TopBar } from '../components/layout/TopBar';
import { Icon } from '../components/ui/Icon';

export function AI({ navigate }: { navigate: (v: View) => void }) {
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState(false);
  const submit = () => {
    if (question.trim()) {
      setAsked(true);
      setQuestion('');
    }
  };
  return (
    <>
      <TopBar
        eyebrow="CONTEXT · ARS vs LIV"
        title="Analysis / AI"
        onBack={() => navigate('match')}
        action={<Icon name="spark" />}
      />
      <div className="ai-notice">
        <span>AI GENERATED</span>
        <p>Analysis may contain uncertainty. Match data is factual and timestamped.</p>
      </div>
      <div className="chat">
        <div className="user-message">
          <span>YOU · 19:42</span>
          <p>Why are Arsenal winning this match?</p>
        </div>
        <div className="ai-message">
          <div className="ai-source">
            <Icon name="spark" size={16} />
            <b>SCORE KOTO / AI</b>
            <span>19:42</span>
          </div>
          <p>
            Arsenal are winning because they have created higher-quality chances and are controlling
            the left half-space.
          </p>
          <div className="analysis-data">
            <div>
              <span>EXPECTED GOALS</span>
              <b>
                1.84 <i>/ 1.21</i>
              </b>
            </div>
            <div>
              <span>FINAL ⅓ ENTRIES</span>
              <b>
                38 <i>/ 25</i>
              </b>
            </div>
            <div>
              <span>HIGH TURNOVERS</span>
              <b>
                09 <i>/ 04</i>
              </b>
            </div>
          </div>
          <ol>
            <li>
              <b>01</b>
              <p>
                <strong>Left-side overload</strong>Saka and Ødegaard have combined for 11
                progressive actions.
              </p>
            </li>
            <li>
              <b>02</b>
              <p>
                <strong>Better shot selection</strong>Six of Arsenal's 14 attempts came from central
                positions.
              </p>
            </li>
          </ol>
          <small>DATA THROUGH 78:12 · OPTA MATCH FEED</small>
        </div>
        {asked && (
          <div className="ai-message compact">
            <div className="ai-source">
              <Icon name="spark" size={16} />
              <b>SCORE KOTO / AI</b>
              <span>NOW</span>
            </div>
            <p>
              The latest match data reinforces the pattern: Arsenal are progressing most effectively
              through their right-sided triangle, while Liverpool's press has dropped by 12% since
              half-time.
            </p>
            <small>DATA THROUGH 78:24 · LIVE MATCH FEED</small>
          </div>
        )}
      </div>
      <div className="suggestions">
        <span>ASK NEXT</span>
        {['What changed at half-time?', 'Compare both midfields', 'Summarise in 3 points'].map(
          (q) => (
            <button key={q} onClick={() => setQuestion(q)}>
              {q}
            </button>
          ),
        )}
      </div>
      <div className="chat-input">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Ask about this match…"
        />
        <button onClick={submit}>
          <Icon name="send" size={18} />
        </button>
      </div>
    </>
  );
}
