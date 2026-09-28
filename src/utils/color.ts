/** Fallback lane color for objectives created before colors existed, or left unset. */
export const DEFAULT_LANE_COLOR = '#8b93a7';

/** Quick swatches so lanes/epics get distinguishable colors without opening the picker. */
export const PRESET_COLORS = [
  '#5b5bd6',
  '#0ea5a3',
  '#e0682a',
  '#c2409a',
  '#0f9463',
  '#2f6fdb',
  '#a3562f',
  '#7c3aed',
];

function parseHex(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  const bigint = parseInt(full, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.min(255, Math.max(0, Math.round(n)));
  const channel = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** Blends a hex color toward white by `amount` (0 = unchanged, 1 = white). */
export function lightenColor(hex: string, amount: number): string {
  const { r, g, b } = parseHex(hex);
  const mix = (channel: number) => channel + (255 - channel) * amount;
  return toHex(mix(r), mix(g), mix(b));
}

/** Picks readable text/icon color (light or dark) for a given background hex. */
export function contrastTextColor(hex: string): string {
  const { r, g, b } = parseHex(hex);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 165 ? '#14192b' : '#ffffff';
}
