import { describe, expect, it } from 'vitest';
import { packIntoRows } from './packIntoRows';

const item = (id: string, startDate: string, endDate: string) => ({ id, startDate, endDate });

describe('packIntoRows', () => {
  it('returns a single empty row for no items', () => {
    expect(packIntoRows([])).toEqual({ placements: [], rowCount: 1 });
  });

  it('reuses a row when items do not overlap', () => {
    const { placements, rowCount } = packIntoRows([
      item('a', '2026-01-01', '2026-01-10'),
      item('b', '2026-01-11', '2026-01-20'),
    ]);
    expect(placements.map((p) => p.row)).toEqual([0, 0]);
    expect(rowCount).toBe(1);
  });

  it('treats dates as inclusive: sharing an edge day overlaps', () => {
    const { placements, rowCount } = packIntoRows([
      item('a', '2026-01-01', '2026-01-10'),
      item('b', '2026-01-10', '2026-01-20'),
    ]);
    expect(placements.map((p) => p.row)).toEqual([0, 1]);
    expect(rowCount).toBe(2);
  });
});
