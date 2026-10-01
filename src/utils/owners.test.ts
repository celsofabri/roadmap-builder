import { describe, expect, it } from 'vitest';
import {
  dedupeOwners,
  mergeLegacyOwner,
  migrateRoadmapOwners,
  migrateRoadmapOwnersWithReport,
  ownersTooltipLine,
} from './owners';

describe('dedupeOwners', () => {
  it('trims, drops blanks and dedupes case-insensitively keeping first spelling and order', () => {
    expect(dedupeOwners([' Ana Souza ', 'ana souza', '', '   ', 'Bruno', 'BRUNO', 'Carla'])).toEqual([
      'Ana Souza',
      'Bruno',
      'Carla',
    ]);
  });

  it('returns an empty list for an empty list', () => {
    expect(dedupeOwners([])).toEqual([]);
  });
});

describe('mergeLegacyOwner', () => {
  it('moves a legacy owner into owners and removes the owner key', () => {
    const result = mergeLegacyOwner({ id: 'e1', owner: 'Ana Souza' });
    expect(result).toEqual({ id: 'e1', owners: ['Ana Souza'] });
    expect('owner' in result).toBe(false);
  });

  it('puts the legacy owner first and does not duplicate it (O12)', () => {
    expect(mergeLegacyOwner({ owner: 'Ana', owners: ['Bruno'] })).toEqual({ owners: ['Ana', 'Bruno'] });
    expect(mergeLegacyOwner({ owner: 'Ana', owners: ['ana', 'Bruno'] })).toEqual({
      owners: ['Ana', 'Bruno'],
    });
  });

  it('leaves new-format items alone', () => {
    expect(mergeLegacyOwner({ id: 'e1', owners: ['A', 'B'] })).toEqual({ id: 'e1', owners: ['A', 'B'] });
  });

  it('turns an empty list or blank legacy owner into an absent field', () => {
    expect(mergeLegacyOwner({ id: 'e1', owners: [] })).toEqual({ id: 'e1' });
    expect(mergeLegacyOwner({ id: 'e1', owner: '' })).toEqual({ id: 'e1' });
    expect('owners' in mergeLegacyOwner({ id: 'e1', owner: '', owners: [] })).toBe(false);
  });

  it('treats a whitespace-only legacy owner as no owner', () => {
    expect(mergeLegacyOwner({ id: 'e1', owner: '   ' })).toEqual({ id: 'e1' });
    expect(mergeLegacyOwner({ id: 'e1', owner: '  ', owners: ['Ana'] })).toEqual({ id: 'e1', owners: ['Ana'] });
  });

  it('does not validate types: invalid values survive for the schema to reject (O13)', () => {
    expect(mergeLegacyOwner({ owners: 'Ana' })).toEqual({ owners: 'Ana' });
    expect(mergeLegacyOwner({ owners: [''] })).toEqual({ owners: [''] });
    expect(mergeLegacyOwner({ owners: [123] })).toEqual({ owners: [123] });
    expect(mergeLegacyOwner({ owner: 123 })).toEqual({ owners: [123] });
  });

  it('does not mutate its input', () => {
    const input = Object.freeze({ owner: 'Ana', owners: Object.freeze(['Bruno']) as string[] });
    expect(() => mergeLegacyOwner(input)).not.toThrow();
    expect(input.owner).toBe('Ana');
    expect(input.owners).toEqual(['Bruno']);
  });

  it('is idempotent', () => {
    const once = mergeLegacyOwner({ owner: 'Ana', owners: ['Bruno'] });
    expect(mergeLegacyOwner(once)).toEqual(once);
  });
});

function legacyRoadmap() {
  return {
    id: 'r1',
    workspaceId: 'w1',
    name: 'R',
    updatedAt: '2026-01-01T00:00:00.000Z',
    objectives: [
      {
        id: 'o1',
        owners: ['Carla'],
        epics: [
          {
            id: 'e1',
            owner: 'Ana Souza',
            initiatives: [
              { id: 'i1', owner: 'Bruno' },
              { id: 'i2' },
              { id: 'i3', owner: 'x', owners: ['X', ''] },
            ],
          },
          { id: 'e2', initiatives: [] },
        ],
      },
    ],
  };
}

describe('migrateRoadmapOwners', () => {
  it('migrates epics and initiatives, leaves objective owners and updatedAt untouched', () => {
    const roadmap = migrateRoadmapOwners(legacyRoadmap()) as unknown as ReturnType<typeof legacyRoadmap>;
    const [objective] = roadmap.objectives;
    expect(roadmap.updatedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(objective.owners).toEqual(['Carla']);
    expect(objective.epics[0]).toMatchObject({ owners: ['Ana Souza'] });
    expect('owner' in objective.epics[0]).toBe(false);
    expect(objective.epics[0].initiatives[0]).toEqual({ id: 'i1', owners: ['Bruno'] });
    expect(objective.epics[0].initiatives[1]).toEqual({ id: 'i2' });
    expect(objective.epics[0].initiatives[2]).toEqual({ id: 'i3', owners: ['x'] });
    expect(objective.epics[1]).toEqual({ id: 'e2', initiatives: [] });
  });

  it('reports what it migrated and discarded', () => {
    const report = migrateRoadmapOwnersWithReport(legacyRoadmap());
    expect(report.migrated).toBe(3);
    expect(report.discarded).toBe(1);
  });

  it('is idempotent', () => {
    const once = migrateRoadmapOwners(legacyRoadmap());
    expect(migrateRoadmapOwners(once)).toEqual(once);
  });

  it('does not mutate the input', () => {
    const input = legacyRoadmap();
    const snapshot = structuredClone(input);
    migrateRoadmapOwners(input);
    expect(input).toEqual(snapshot);
  });

  it('drops corrupt owners values instead of crashing', () => {
    const roadmap = {
      id: 'r',
      objectives: [{ id: 'o', epics: [{ id: 'e', owners: 'Ana', initiatives: [{ id: 'i', owners: [1, null, 'Ok'] }] }] }],
    };
    const result = migrateRoadmapOwners(roadmap) as unknown as typeof roadmap;
    expect(result.objectives[0].epics[0]).toEqual({ id: 'e', initiatives: [{ id: 'i', owners: ['Ok'] }] });
  });

  it('tolerates unexpected shapes', () => {
    expect(migrateRoadmapOwners(null)).toBeNull();
    expect(migrateRoadmapOwners('x')).toBe('x');
    const noObjectives = { id: 'r' };
    expect(migrateRoadmapOwners(noObjectives)).toEqual(noObjectives);
    const odd = { id: 'r', objectives: [null, { id: 'o' }, { id: 'o2', epics: [null, 5, { id: 'e' }] }] };
    expect(() => migrateRoadmapOwners(odd)).not.toThrow();
    expect(migrateRoadmapOwners(odd)).toEqual(odd);
  });
});

describe('ownersTooltipLine', () => {
  it('formats none, one and many', () => {
    expect(ownersTooltipLine(undefined)).toBe('');
    expect(ownersTooltipLine([])).toBe('');
    expect(ownersTooltipLine(['Ana'])).toBe('Responsável: Ana');
    expect(ownersTooltipLine(['Ana', 'Bruno'])).toBe('Responsáveis: Ana, Bruno');
  });
});
