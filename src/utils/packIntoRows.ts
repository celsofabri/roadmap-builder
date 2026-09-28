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
 * Items are placed in the given (array) order rather than sorted by date, so
 * that reordering the underlying list — e.g. dragging one initiative above
 * another — controls which one lands on top when two of them collide. Dates
 * are inclusive: an item ending on the same day another starts still counts
 * as an overlap.
 */
export function packIntoRows<T extends Range>(items: T[]): PackResult<T> {
  /** Last occupied end date per row; ISO strings compare chronologically. */
  const rowEnds: string[] = [];

  const placements = items.map((item) => {
    let row = rowEnds.findIndex((end) => end < item.startDate);
    if (row === -1) {
      row = rowEnds.length;
      rowEnds.push(item.endDate);
    } else {
      rowEnds[row] = item.endDate;
    }
    return { item, row };
  });

  return { placements, rowCount: Math.max(rowEnds.length, 1) };
}
