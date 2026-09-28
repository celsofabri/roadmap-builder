import { useEffect, useMemo, useRef, useState } from 'react';
import { OwnerAvatar } from '@/components/shared/OwnerAvatar';
import { CloseIcon, PencilIcon } from '@/components/shared/Icon';
import { findMemberPhoto, useTeamMemberStore } from '@/store/teamMemberStore';
import styles from './OwnerCombobox.module.scss';

interface OwnerComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** Called when a suggestion is clicked or Enter commits a value — defaults to `onChange`. */
  onSelect?: (name: string) => void;
  /** Extra key handling (e.g. comma-to-add, backspace-to-pop) layered on top of the combobox's own. */
  onExtraKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Fires on blur when there's unsaved typed text — e.g. auto-commit a multi-owner draft. */
  onBlurCommit?: () => void;
  /** Registered names to hide from suggestions (already picked elsewhere, e.g. other chips). */
  excludeNames?: string[];
  placeholder?: string;
  /**
   * Whether a filled value collapses into a selected-chip view. Set to false
   * for a multi-select "add next" draft field, which should always look like
   * a plain, ready-to-type input — the picked names live in chips the parent
   * renders separately, not inside this field.
   */
  collapseWhenFilled?: boolean;
}

/**
 * Text input that suggests registered team members (with their avatar) as you
 * type, while still accepting a free-typed name that isn't registered yet.
 * In single-select mode (the default), once a value is picked it collapses
 * into a small avatar+name chip instead of staying a plain text field — click
 * it to change, or the × to clear.
 */
export function OwnerCombobox({
  id,
  value,
  onChange,
  onSelect,
  onExtraKeyDown,
  onBlurCommit,
  excludeNames = [],
  placeholder,
  collapseWhenFilled = true,
}: OwnerComboboxProps) {
  const members = useTeamMemberStore((s) => s.members);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(!value);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Adjusted during render (React's documented pattern for "reset state when
  // a prop changes") rather than in an effect, to avoid an extra render pass.
  // Uses state (not a ref) to track the previous key — refs aren't safe to
  // read during render.
  const trackedKey = `${value}|${open}`;
  const [prevKey, setPrevKey] = useState(trackedKey);
  if (prevKey !== trackedKey) {
    setPrevKey(trackedKey);
    setHighlight(0);
    // A value only ever arrives empty by explicit user action (cleared, or a
    // multi-owner draft reset after being added as a chip) — always show the
    // input then, never a chip for nothing.
    if (!value) setEditing(true);
  }

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  useEffect(() => () => clearTimeout(blurTimeout.current), []);

  const excluded = useMemo(
    () => new Set(excludeNames.map((n) => n.trim().toLowerCase())),
    [excludeNames],
  );

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    return members
      .filter((m) => !excluded.has(m.name.trim().toLowerCase()))
      .filter((m) => !query || m.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [members, value, excluded]);

  const exactMatch = suggestions.some((m) => m.name.trim().toLowerCase() === value.trim().toLowerCase());
  const showFreeTextOption = value.trim().length > 0 && !exactMatch;
  const totalOptions = suggestions.length + (showFreeTextOption ? 1 : 0);

  function select(name: string) {
    if (onSelect) onSelect(name);
    else onChange(name);
    setOpen(false);
    if (collapseWhenFilled) setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    onExtraKeyDown?.(e);
    if (e.defaultPrevented) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, Math.max(totalOptions - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && totalOptions > 0) {
        select(highlight < suggestions.length ? suggestions[highlight].name : value.trim());
      } else if (value.trim()) {
        select(value.trim());
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function handleBlur() {
    // Delayed so a click on a suggestion registers before the dropdown unmounts.
    blurTimeout.current = setTimeout(() => {
      setOpen(false);
      if (collapseWhenFilled && value.trim()) setEditing(false);
      onBlurCommit?.();
    }, 150);
  }

  if (collapseWhenFilled && !editing && value) {
    const photo = findMemberPhoto(members, value);
    return (
      <div className={styles.chipRow}>
        <button
          type="button"
          className={styles.chip}
          onClick={() => {
            setEditing(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
        >
          <OwnerAvatar name={value} photoDataUrl={photo} size={22} />
          <span className={styles.chipName}>{value}</span>
          <PencilIcon size={12} className={styles.chipEditIcon} />
        </button>
        <button
          type="button"
          className={styles.chipClear}
          onClick={() => onChange('')}
          aria-label="Remover responsável"
        >
          <CloseIcon size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={styles.input}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />

      {open && totalOptions > 0 && (
        <ul className={styles.dropdown} role="listbox">
          {suggestions.map((member, index) => (
            <li key={member.id}>
              <button
                type="button"
                role="option"
                aria-selected={highlight === index}
                className={`${styles.option} ${highlight === index ? styles.optionActive : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => select(member.name)}
              >
                <OwnerAvatar name={member.name} photoDataUrl={member.photoDataUrl} size={22} />
                <span className={styles.optionName}>{member.name}</span>
              </button>
            </li>
          ))}
          {showFreeTextOption && (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={highlight === suggestions.length}
                className={`${styles.option} ${styles.optionFreeText} ${
                  highlight === suggestions.length ? styles.optionActive : ''
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlight(suggestions.length)}
                onClick={() => select(value.trim())}
              >
                Usar &ldquo;{value.trim()}&rdquo;
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
