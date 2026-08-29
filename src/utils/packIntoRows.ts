interface Range {
  startDate: string;
  endDate: string;
}

export interface RowPlacement<T> {
  item: T;
  row: number;
}

export interface PackResult<T> {
  placements: RowPlacement<T>[];
  rowCount: number;
}

/**
 * Distributes items across as few rows as possible so that no two items on the
 * same row overlap in time.
 *
 * Items are placed in end-date order, so whenever two bars collide the one that
 * finishes later ends up on a lower row — a long bar never hides a short one.
 * Dates are inclusive: an item ending on the same day another starts still
 * counts as an overlap.
 */
export function packIntoRows<T extends Range>(items: T[]): PackResult<T> {
  const sorted = [...items].sort(
    (a, b) => a.endDate.localeCompare(b.endDate) || a.startDate.localeCompare(b.startDate),
  );

  /** Last occupied end date per row; ISO strings compare chronologically. */
  const rowEnds: string[] = [];

  const placements = sorted.map((item) => {
    let row = rowEnds.findIndex((end) => end < item.startDate);
    if (row === -1) {
      row = rowEnds.length;
      rowEnds.push(item.endDate);
    } else {
      // Sorted by end date, so this is always the later of the two.
      rowEnds[row] = item.endDate;
    }
    return { item, row };
  });

  return { placements, rowCount: Math.max(rowEnds.length, 1) };
}
