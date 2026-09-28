import { ownerColor, ownerInitials } from '@/utils/ownerAvatar';
import styles from './OwnerAvatar.module.scss';

interface OwnerAvatarProps {
  name: string;
  /** Registered team member photo, if any — shown instead of the initials fallback. */
  photoDataUrl?: string;
  size?: number;
  className?: string;
}

/** Registered photo if available, otherwise a small colored circle with the person's initials. */
export function OwnerAvatar({ name, photoDataUrl, size = 18, className }: OwnerAvatarProps) {
  if (photoDataUrl) {
    return (
      <img
        src={photoDataUrl}
        alt=""
        className={`${styles.avatar} ${styles.photo} ${className ?? ''}`}
        style={{ width: size, height: size }}
        title={name}
      />
    );
  }

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
