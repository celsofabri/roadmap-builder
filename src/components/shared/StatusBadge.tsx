import type { Status } from '@/types/roadmap.types';
import { STATUS_COLORS, STATUS_LABELS, STATUS_TINTS } from '@/utils/statusOptions';
import styles from '@/styles/shared.module.scss';

interface StatusBadgeProps {
  status?: Status;
  /** When set (e.g. in a legend), appends how many items share this status. */
  count?: number;
}

export function StatusBadge({ status, count }: StatusBadgeProps) {
  if (!status) return null;
  const tint = STATUS_TINTS[status];

  return (
    <span className={styles.badge} style={{ backgroundColor: tint.bg, color: tint.fg }}>
      <span className={styles.badgeDot} style={{ backgroundColor: STATUS_COLORS[status] }} />
      {STATUS_LABELS[status]}
      {count !== undefined && <span className={styles.badgeCount}>{count}</span>}
    </span>
  );
}
