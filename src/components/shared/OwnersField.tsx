import { useRef, useState, type ReactNode } from 'react';
import { CloseIcon } from '@/components/shared/Icon';
import { OwnerAvatar } from '@/components/shared/OwnerAvatar';
import { OwnerCombobox } from '@/components/shared/OwnerCombobox';
import { findMemberPhoto, useTeamMemberStore } from '@/store/teamMemberStore';
import { dedupeOwners } from '@/utils/owners';
import { ownerColor } from '@/utils/ownerAvatar';
import sharedStyles from '@/styles/shared.module.scss';
import styles from './OwnersField.module.scss';

interface OwnersFieldProps {
  /** Id of the text input; the parent renders the matching `<label htmlFor>`. */
  id: string;
  value: string[];
  onChange: (owners: string[]) => void;
  placeholder?: string;
  hint?: ReactNode;
}

/**
 * Multi-owner picker: removable chips plus a combobox that suggests team members but also
 * accepts free-typed names. Enter, comma or leaving the field commits the draft; Backspace
 * on an empty draft removes the last chip. Duplicates (case-insensitive) are ignored.
 */
export function OwnersField({
  id,
  value,
  onChange,
  placeholder = 'Nome da pessoa e Enter',
  hint,
}: OwnersFieldProps) {
  const members = useTeamMemberStore((s) => s.members);
  const [draft, setDraft] = useState('');
  const suppressOpenOnFocusRef = useRef(false);

  function addOwner(nameArg?: string) {
    const name = (nameArg ?? draft).trim();
    if (!name) return;
    onChange(dedupeOwners([...value, name]));
    setDraft('');
  }

  function removeOwner(name: string) {
    onChange(value.filter((o) => o !== name));
    // The clicked × unmounts with its chip; send focus to the field instead of <body>.
    suppressOpenOnFocusRef.current = true;
    document.getElementById(id)?.focus();
    suppressOpenOnFocusRef.current = false;
  }

  function handleExtraKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === ',') {
      e.preventDefault();
      addOwner();
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <>
      {value.length > 0 && (
        <ul className={styles.ownerChips} aria-label="Responsáveis selecionados">
          {value.map((owner) => {
            const { bg, text } = ownerColor(owner);
            return (
              <li
                key={owner}
                className={styles.ownerChip}
                style={{ backgroundColor: bg, color: text }}
              >
                <OwnerAvatar
                  name={owner}
                  photoDataUrl={findMemberPhoto(members, owner)}
                  size={16}
                  className={styles.chipAvatar}
                />
                {owner}
                <button
                  type="button"
                  onClick={() => removeOwner(owner)}
                  aria-label={`Remover ${owner}`}
                  className={styles.ownerChipRemove}
                  style={{ color: text }}
                >
                  <CloseIcon size={11} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <OwnerCombobox
        id={id}
        value={draft}
        onChange={setDraft}
        onSelect={(name) => addOwner(name)}
        onExtraKeyDown={handleExtraKeyDown}
        onBlurCommit={() => addOwner()}
        excludeNames={value}
        collapseWhenFilled={false}
        suppressOpenOnFocusRef={suppressOpenOnFocusRef}
        placeholder={placeholder}
      />
      {hint && <p className={sharedStyles.hint}>{hint}</p>}
    </>
  );
}
