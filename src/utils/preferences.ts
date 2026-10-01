/** Persisted view preferences shared between the timeline toolbar and the fullscreen mode. */
export const SHOW_TODAY_LINE_KEY = 'roadmap-builder:show-today-line';

export function readShowTodayLine(): boolean {
  try {
    const stored = localStorage.getItem(SHOW_TODAY_LINE_KEY);
    return stored === null ? true : stored === '1';
  } catch {
    return true;
  }
}
