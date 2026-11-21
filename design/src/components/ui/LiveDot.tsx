export function LiveDot({ label = 'LIVE' }: { label?: string }) {
  return (
    <span className="live-label">
      <i />
      {label}
    </span>
  );
}
