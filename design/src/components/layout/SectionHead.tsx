import { Icon } from '../ui/Icon';

export function SectionHead({
  number,
  title,
  action,
  onAction,
}: {
  number: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="section-head">
      <div>
        <span>{number}</span>
        <h2>{title}</h2>
      </div>
      {action && (
        <button onClick={onAction}>
          {action} <Icon name="arrow" size={14} />
        </button>
      )}
    </div>
  );
}
