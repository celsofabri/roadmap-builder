import { hashString } from '@/utils/stringHash';

/** Same vivid palette used for objective lane colors, so icon badges feel consistent with the rest of the app. */
const WORKSPACE_PALETTE = [
  '#5b5bd6',
  '#0ea5a3',
  '#e0682a',
  '#c2409a',
  '#0f9463',
  '#2f6fdb',
  '#a3562f',
  '#7c3aed',
];

/** Deterministic per-workspace color, so the same workspace always gets the same fallback badge. */
export function workspaceColor(name: string): string {
  return WORKSPACE_PALETTE[hashString(name.trim().toLowerCase()) % WORKSPACE_PALETTE.length];
}

/** Up to two initials for the icon fallback. */
export function workspaceInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
