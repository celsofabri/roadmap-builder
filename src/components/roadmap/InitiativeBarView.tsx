import { OwnerAvatarStack } from '@/components/shared/OwnerAvatarStack';
import type { Initiative, TeamMember } from '@/types/roadmap.types';
import { STATUS_COLORS } from '@/utils/statusOptions';
import styles from './InitiativeBar.module.scss';

interface InitiativeBarViewProps {
  initiative: Pick<Initiative, 'title' | 'status' | 'owners'>;
  showOwner: boolean;
  members: TeamMember[];
}

/** Visual core of an initiative bar; see `EpicBarView`. */
export function InitiativeBarView({ initiative, showOwner, members }: InitiativeBarViewProps) {
  return (
    <>
      {showOwner && initiative.owners && (
        <OwnerAvatarStack
          owners={initiative.owners}
          members={members}
          size={16}
          max={2}
          avatarClassName={styles.ownerAvatar}
        />
      )}
      <span className={styles.label}>{initiative.title}</span>
      {initiative.status && (
        <span
          className={styles.statusDot}
          style={{ backgroundColor: STATUS_COLORS[initiative.status] }}
        />
      )}
    </>
  );
}
