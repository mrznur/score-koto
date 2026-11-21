import { useState } from 'react';

export function DateStrip() {
  const [selected, setSelected] = useState(2);
  const dates = [
    ['MON', '12'],
    ['TUE', '13'],
    ['WED', '14'],
    ['THU', '15'],
    ['FRI', '16'],
  ];
  return (
    <div className="date-strip">
      {dates.map(([day, date], i) => (
        <button
          key={date}
          onClick={() => setSelected(i)}
          className={selected === i ? 'active' : ''}
        >
          <span>{day}</span>
          <b>{date}</b>
        </button>
      ))}
    </div>
  );
}
