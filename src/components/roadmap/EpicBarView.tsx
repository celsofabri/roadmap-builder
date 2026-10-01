import { OwnerAvatarStack } from '@/components/shared/OwnerAvatarStack';
import type { Epic, TeamMember } from '@/types/roadmap.types';
import { STATUS_COLORS } from '@/utils/statusOptions';
import styles from './EpicBar.module.scss';

interface EpicBarViewProps {
  epic: Pick<Epic, 'title' | 'status' | 'owners'>;
  showOwner: boolean;
  members: TeamMember[];
}

/**
 * Visual core of an epic bar — owners, title and status dot. Shared by the interactive
 * `EpicBar` (inside its drag button) and the read-only fullscreen snapshot.
 */
export function EpicBarView({ epic, showOwner, members }: EpicBarViewProps) {
  return (
    <>
      {showOwner && epic.owners && (
        <OwnerAvatarStack
          owners={epic.owners}
          members={members}
          size={18}
          max={3}
          avatarClassName={styles.ownerAvatar}
        />
      )}
      <span className={styles.label}>{epic.title}</span>
      {epic.status && (
        <span className={styles.statusDot} style={{ backgroundColor: STATUS_COLORS[epic.status] }} />
      )}
    </>
  );
}
