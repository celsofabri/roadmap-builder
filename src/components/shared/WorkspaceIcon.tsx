import { workspaceColor, workspaceInitials } from '@/utils/workspaceIcon';
import styles from './WorkspaceIcon.module.scss';

interface WorkspaceIconProps {
  name: string;
  iconDataUrl?: string;
  size?: number;
  className?: string;
}

/** Uploaded square image if the workspace has one, otherwise a colored initials badge. */
export function WorkspaceIcon({ name, iconDataUrl, size = 26, className }: WorkspaceIconProps) {
  if (iconDataUrl) {
    return (
      <img
        src={iconDataUrl}
        alt=""
        className={`${styles.icon} ${className ?? ''}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={`${styles.icon} ${styles.fallback} ${className ?? ''}`}
      style={{ width: size, height: size, fontSize: size * 0.4, backgroundColor: workspaceColor(name) }}
    >
      {workspaceInitials(name)}
    </span>
  );
}
