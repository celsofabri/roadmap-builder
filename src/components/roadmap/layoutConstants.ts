/**
 * Layout constants shared by the interactive timeline and the read-only fullscreen snapshot,
 * so the two can never drift apart.
 */

/** Kept in sync with `.slot` height in InitiativeBar.module.scss. */
export const INITIATIVE_ROW_H = 24;
export const INITIATIVE_ROW_GAP = 4;

/** How much lighter initiative bars are than their epic's own color — keeps the two visually distinct. */
export const INITIATIVE_LIGHTEN = 0.42;

/** Below this container width the lane label column shrinks (matches `$bp-md`). */
export const LABEL_BREAKPOINT = 768;
export const LABEL_WIDTH = 220;
export const LABEL_WIDTH_SM = 150;

/** Width of the lane label column for a given container width (0 = not measured yet). */
export function labelWidthFor(containerWidth: number): number {
  return containerWidth > 0 && containerWidth < LABEL_BREAKPOINT ? LABEL_WIDTH_SM : LABEL_WIDTH;
}
