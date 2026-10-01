import type { CSSProperties } from 'react';
import { OwnerAvatar } from '@/components/shared/OwnerAvatar';
import { findMemberPhoto } from '@/store/teamMemberStore';
import type { TeamMember } from '@/types/roadmap.types';
import styles from './OwnerAvatarStack.module.scss';

interface OwnerAvatarStackProps {
  owners: string[];
  members: TeamMember[];
  /** Avatar diameter in px: 18 for epics, 16 for initiatives. */
  size?: number;
  /** Avatars shown before collapsing the rest into a "+N" badge. Default: all. */
  max?: number;
  /** Lay avatars out in a wrapping row (list view) instead of overlapping them (bars). */
  wrap?: boolean;
  /** Extra class for each avatar, e.g. the ring used on colored bars. */
  avatarClassName?: string;
}

/**
 * Owners as a row of avatars with a "+N" overflow badge. The whole group carries an
 * accessible name listing every owner, so the hidden ones are still announced. Whether
 * owners are shown at all (`showOwners`) is the caller's decision.
 */
export function OwnerAvatarStack({
  owners,
  members,
  size = 18,
  max = Infinity,
  wrap = false,
  avatarClassName,
}: OwnerAvatarStackProps) {
  if (owners.length === 0) return null;

  const limit = Math.max(Math.floor(max), 1);
  const visible = owners.slice(0, limit);
  const hidden = owners.length - visible.length;

  return (
    <span
      role="group"
      aria-label={`Responsáveis: ${owners.join(', ')}`}
      className={`${styles.stack} ${wrap ? styles.wrap : styles.overlap}`}
      style={{ '--avatar-size': `${size}px` } as CSSProperties}
    >
      {visible.map((name) => (
        <OwnerAvatar
          key={name}
          name={name}
          photoDataUrl={findMemberPhoto(members, name)}
          size={size}
          className={avatarClassName}
        />
      ))}
      {hidden > 0 && (
        <span className={styles.more} aria-hidden="true">
          +{hidden}
        </span>
      )}
    </span>
  );
}
