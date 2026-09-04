import { hashString } from '@/utils/stringHash';

/** Deterministic per-person badge color, so the same name always renders the same everywhere. */
const OWNER_PALETTE: { bg: string; text: string }[] = [
  { bg: '#e0e7ff', text: '#4338ca' },
  { bg: '#fce7f3', text: '#be185d' },
  { bg: '#dcfce7', text: '#15803d' },
  { bg: '#fef3c7', text: '#b45309' },
  { bg: '#cffafe', text: '#0e7490' },
  { bg: '#fee2e2', text: '#b91c1c' },
  { bg: '#ede9fe', text: '#6d28d9' },
  { bg: '#e0f2fe', text: '#0369a1' },
];

export function ownerColor(name: string): { bg: string; text: string } {
  return OWNER_PALETTE[hashString(name.trim().toLowerCase()) % OWNER_PALETTE.length];
}

/** Up to two initials for the avatar bubble. */
export function ownerInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
