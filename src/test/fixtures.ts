import type { Roadmap } from '@/types/roadmap.types';

/** Roadmap in the CURRENT format (`owners`), with ids stable for assertions. */
export function makeRoadmap(overrides: Partial<Roadmap> = {}): Roadmap {
  return {
    id: 'r1',
    workspaceId: 'w1',
    name: 'Roadmap de teste',
    period: { startDate: '2026-01-01', endDate: '2026-12-31' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    objectives: [
      {
        id: 'o1',
        title: 'Objetivo',
        owners: ['Carla Nunes'],
        epics: [
          {
            id: 'e1',
            title: 'Épico',
            startDate: '2026-01-05',
            endDate: '2026-03-31',
            status: 'planned',
            owners: ['Ana Souza', 'Bruno Lima'],
            initiatives: [
              {
                id: 'i1',
                title: 'Iniciativa',
                startDate: '2026-01-05',
                endDate: '2026-02-13',
                owners: ['Ana Souza', 'Dani Externo'],
              },
              { id: 'i2', title: 'Outra', startDate: '2026-02-16', endDate: '2026-03-31' },
            ],
          },
          {
            id: 'e2',
            title: 'Épico 2',
            startDate: '2026-04-01',
            endDate: '2026-06-30',
            initiatives: [],
          },
        ],
      },
    ],
    ...overrides,
  };
}

/**
 * Roadmap as saved by the previous version: single `owner` on epics and initiatives.
 * Typed loosely on purpose, since `owner` no longer exists in the model.
 */
export function makeLegacyRoadmap(): Record<string, unknown> {
  return {
    id: 'legacy1',
    workspaceId: 'w1',
    name: 'Legado',
    period: { startDate: '2026-01-01', endDate: '2026-12-31' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    objectives: [
      {
        id: 'o1',
        title: 'Objetivo',
        owners: ['Carla Nunes'],
        epics: [
          {
            id: 'e1',
            title: 'Épico',
            startDate: '2026-01-05',
            endDate: '2026-03-31',
            owner: 'Ana Souza',
            initiatives: [
              {
                id: 'i1',
                title: 'Iniciativa',
                startDate: '2026-01-05',
                endDate: '2026-02-13',
                owner: 'Bruno Lima',
              },
            ],
          },
        ],
      },
    ],
  };
}
