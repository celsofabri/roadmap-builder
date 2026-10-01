import { labelWidthFor } from '@/components/roadmap/layoutConstants';

/** Never scale below this, even for absurdly tall roadmaps (keeps `logicalW` finite). */
export const MIN_SCALE = 0.05;
/** Below this the text is considered hard to read; the UI shows a non-blocking notice. */
export const LEGIBILITY_FLOOR = 0.5;
/** Ignore scale changes smaller than this, to avoid resize-observer ping-pong. */
export const SCALE_HYSTERESIS = 0.005;
/** Fraction of the logical width the label column may take in a tiny window. */
const MAX_LABEL_FRACTION = 0.4;
/** Used when the viewport has not been measured yet (jsdom, first render). */
const FALLBACK_VIEWPORT_W = 1280;

export interface FitInput {
  /** Usable width/height of the overlay, in real CSS px. */
  viewportW: number;
  viewportH: number;
  /** Height of the snapshot at scale 1 (unaffected by CSS transforms). */
  naturalH: number;
  /** Business days spanned by the roadmap period. */
  totalDays: number;
  /** Scale applied last time; used only to damp tiny oscillations (never causes overflow). */
  previousScale?: number;
}

export interface FitResult {
  /** Uniform scale in (0, 1]; never enlarges. */
  scale: number;
  /** Width of the stage before scaling: `logicalW * scale == viewportW`. */
  logicalW: number;
  labelWidth: number;
  /** Pixels per business day in logical space; always > 0, with no minimum floor. */
  dayWidth: number;
  /** True when `scale < LEGIBILITY_FLOOR` (the UI shows a notice; nothing is blocked). */
  belowFloor: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Fits the whole roadmap in the viewport with no scrolling: the height decides one uniform
 * scale (never above 1), the width is then solved by stretching `dayWidth` in the larger
 * "logical" space. Unmeasured sizes (<= 0) degrade to scale 1 instead of throwing.
 */
export function computeFit({
  viewportW,
  viewportH,
  naturalH,
  totalDays,
  previousScale,
}: FitInput): FitResult {
  const w = viewportW > 0 ? viewportW : FALLBACK_VIEWPORT_W;
  const measured = viewportH > 0 && naturalH > 0;
  let scale = measured ? clamp(viewportH / naturalH, MIN_SCALE, 1) : 1;

  // Keep the previous scale only if it is slightly SMALLER: that still fits, so no overflow.
  if (
    previousScale !== undefined &&
    previousScale <= scale &&
    scale - previousScale <= SCALE_HYSTERESIS
  ) {
    scale = previousScale;
  }

  const logicalW = w / scale;
  const labelWidth = Math.min(labelWidthFor(w), logicalW * MAX_LABEL_FRACTION);
  const dayWidth = (logicalW - labelWidth) / Math.max(totalDays, 1);

  return { scale, logicalW, labelWidth, dayWidth, belowFloor: scale < LEGIBILITY_FLOOR };
}

/**
 * Which ruler cells get a text label so labels never overlap: every Nth cell, where N is the
 * smallest stride that gives the typical (median) cell at least `minLabelPx` of room.
 * `effectiveCellWidths` are on-screen widths (logical width * scale).
 */
export function rulerLabelStride(effectiveCellWidths: number[], minLabelPx: number): number {
  const widths = effectiveCellWidths.filter((w) => Number.isFinite(w) && w > 0).sort((a, b) => a - b);
  if (widths.length === 0 || minLabelPx <= 0) return 1;
  const median = widths[Math.floor(widths.length / 2)];
  return Math.max(1, Math.ceil(minLabelPx / median));
}

/**
 * x offset of every internal ruler cell boundary (the last cell's right edge is the grid edge,
 * so it is omitted). `cellDays` are the business days spanned by each cell.
 */
export function computeGridOffsets(cellDays: number[], dayWidth: number): number[] {
  const offsets: number[] = [];
  let x = 0;
  for (const days of cellDays) {
    x += days * dayWidth;
    offsets.push(x);
  }
  return offsets.slice(0, -1);
}
