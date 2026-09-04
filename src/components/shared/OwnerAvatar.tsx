import { ownerColor, ownerInitials } from '@/utils/ownerAvatar';
import styles from './OwnerAvatar.module.scss';

interface OwnerAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

/** Small colored circle with a person's initials — used wherever a single owner is shown compactly. */
export function OwnerAvatar({ name, size = 18, className }: OwnerAvatarProps) {
  const { bg, text } = ownerColor(name);
  return (
    <span
      className={`${styles.avatar} ${className ?? ''}`}
      style={{ width: size, height: size, fontSize: size * 0.42, backgroundColor: bg, color: text }}
      title={name}
    >
      {ownerInitials(name)}
    </span>
  );
}
