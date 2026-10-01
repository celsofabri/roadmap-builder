import { describe, expect, it } from 'vitest';
import { makeRoadmap } from '@/test/fixtures';
import { computeStatusCounts } from './computeStatusCounts';

describe('computeStatusCounts', () => {
  it('returns nothing when no item has a status', () => {
    expect(computeStatusCounts(makeRoadmap({ objectives: [] }))).toEqual([]);
  });

  it('counts epics and initiatives, in canonical status order, omitting zeros', () => {
    const roadmap = makeRoadmap();
    const epics = roadmap.objectives[0].epics;
    epics[0].status = 'done'; // replaces 'planned'
    epics[0].initiatives[0].status = 'planned';
    epics[0].initiatives[1].status = 'done';
    epics[1].status = 'blocked';
    expect(computeStatusCounts(roadmap)).toEqual([
      { status: 'planned', count: 1 },
      { status: 'done', count: 2 },
      { status: 'blocked', count: 1 },
    ]);
  });

  it('does not mutate the roadmap', () => {
    const roadmap = makeRoadmap();
    const snapshot = JSON.stringify(roadmap);
    computeStatusCounts(roadmap);
    expect(JSON.stringify(roadmap)).toBe(snapshot);
  });
});
