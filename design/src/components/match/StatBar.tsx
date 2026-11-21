export function StatBar({
  label,
  left,
  right,
  percent,
}: {
  label: string;
  left: string;
  right: string;
  percent: number;
}) {
  return (
    <div className="stat-bar">
      <div>
        <b>{left}</b>
        <span>{label}</span>
        <b>{right}</b>
      </div>
      <div className="bar">
        <i style={{ width: `${percent}%` }} />
        <i style={{ width: `${100 - percent}%` }} />
      </div>
    </div>
  );
}
