import type { Status } from '@/types/roadmap.types';
import { STATUS_COLORS, STATUS_LABELS, STATUS_TINTS } from '@/utils/statusOptions';
import styles from '@/styles/shared.module.scss';

export function StatusBadge({ status }: { status?: Status }) {
  if (!status) return null;
  const tint = STATUS_TINTS[status];

  return (
    <span className={styles.badge} style={{ backgroundColor: tint.bg, color: tint.fg }}>
      <span className={styles.badgeDot} style={{ backgroundColor: STATUS_COLORS[status] }} />
      {STATUS_LABELS[status]}
    </span>
  );
}
