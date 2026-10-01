import { describe, expect, it } from 'vitest';
import { makeRoadmap } from '@/test/fixtures';
import { epicInputSchema, initiativeInputSchema, roadmapSchema } from './roadmap.schema';

const base = { title: 'T', startDate: '2026-01-01', endDate: '2026-01-31' };

describe('owners in epic/initiative schemas', () => {
  it('keeps the order of multiple owners', () => {
    const result = epicInputSchema.parse({ ...base, owners: ['Ana Souza', 'Bruno Lima'] });
    expect(result.owners).toEqual(['Ana Souza', 'Bruno Lima']);
    expect(initiativeInputSchema.parse({ ...base, owners: ['B', 'A'] }).owners).toEqual(['B', 'A']);
  });

  it('trims and de-duplicates case-insensitively keeping the first spelling (O7)', () => {
    const result = epicInputSchema.parse({ ...base, owners: [' Ana Souza ', 'ana souza', 'Bruno'] });
    expect(result.owners).toEqual(['Ana Souza', 'Bruno']);
  });

  it('turns an empty list into an absent field (O6)', () => {
    expect(epicInputSchema.parse({ ...base, owners: [] }).owners).toBeUndefined();
    expect(epicInputSchema.parse(base).owners).toBeUndefined();
  });

  it.each([
    ['a string', 'Ana'],
    ['a blank entry', ['']],
    ['a whitespace entry', ['   ']],
    ['a non-string entry', [123]],
  ])('rejects %s with the path of the field (O13)', (_label, owners) => {
    const result = epicInputSchema.safeParse({ ...base, owners });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path[0]).toBe('owners');
  });

  it('does not change the objective schema contract', () => {
    const roadmap = makeRoadmap();
    expect(roadmapSchema.parse(roadmap).objectives[0].owners).toEqual(['Carla Nunes']);
  });

  it('parses a whole roadmap keeping epic and initiative owners', () => {
    const parsed = roadmapSchema.parse(makeRoadmap());
    expect(parsed.objectives[0].epics[0].owners).toEqual(['Ana Souza', 'Bruno Lima']);
    expect(parsed.objectives[0].epics[0].initiatives[0].owners).toEqual(['Ana Souza', 'Dani Externo']);
  });
});
