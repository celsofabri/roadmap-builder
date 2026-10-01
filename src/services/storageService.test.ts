// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeLegacyRoadmap, makeRoadmap } from '@/test/fixtures';

const ROADMAPS_KEY = 'roadmap-builder:roadmaps';
const BACKUP_KEY = 'roadmap-builder:roadmaps:pre-owners-backup';

// The service keeps a module-level "already warned" flag, so load a fresh copy per test.
async function loadService() {
  vi.resetModules();
  return (await import('./storageService')).storageService;
}

function seedLegacy() {
  const raw = JSON.stringify([makeLegacyRoadmap()]);
  localStorage.setItem(ROADMAPS_KEY, raw);
  return raw;
}

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('storageService: legacy owner migration (O9)', () => {
  it('migrates owner to owners in memory when reading', async () => {
    seedLegacy();
    const storage = await loadService();
    const roadmap = storage.getRoadmap('legacy1')!;
    const epic = roadmap.objectives[0].epics[0];
    expect(epic.owners).toEqual(['Ana Souza']);
    expect('owner' in epic).toBe(false);
    expect(epic.initiatives[0].owners).toEqual(['Bruno Lima']);
    expect(roadmap.objectives[0].owners).toEqual(['Carla Nunes']);
    expect(roadmap.updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('never writes the roadmaps key just by reading', async () => {
    const raw = seedLegacy();
    const storage = await loadService();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    storage.getAllRoadmaps();
    storage.listRoadmaps('w1');
    expect(localStorage.getItem(ROADMAPS_KEY)).toBe(raw);
    expect(setItem.mock.calls.some(([key]) => key === ROADMAPS_KEY)).toBe(false);
  });

  it('creates the backup once with the original raw JSON and never overwrites it', async () => {
    const raw = seedLegacy();
    const storage = await loadService();
    storage.getAllRoadmaps();
    expect(localStorage.getItem(BACKUP_KEY)).toBe(raw);

    const other = JSON.stringify([{ ...makeLegacyRoadmap(), id: 'other' }]);
    localStorage.setItem(ROADMAPS_KEY, other);
    storage.getAllRoadmaps();
    expect(localStorage.getItem(BACKUP_KEY)).toBe(raw);
  });

  it('does not create a backup when there is nothing to migrate', async () => {
    localStorage.setItem(ROADMAPS_KEY, JSON.stringify([makeRoadmap()]));
    const storage = await loadService();
    storage.getAllRoadmaps();
    expect(localStorage.getItem(BACKUP_KEY)).toBeNull();
  });

  it('keeps working when the backup cannot be written (quota)', async () => {
    seedLegacy();
    const storage = await loadService();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    expect(storage.getRoadmap('legacy1')!.objectives[0].epics[0].owners).toEqual(['Ana Souza']);
  });

  it('warns once per load, without names (LGPD)', async () => {
    seedLegacy();
    const storage = await loadService();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    storage.getAllRoadmaps();
    storage.getAllRoadmaps();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).not.toMatch(/Ana|Bruno|Carla/);
  });

  it('the first save persists owners and drops owner for every roadmap (O9)', async () => {
    seedLegacy();
    const storage = await loadService();
    const roadmap = storage.getRoadmap('legacy1')!;
    storage.saveRoadmap(roadmap);
    const stored = localStorage.getItem(ROADMAPS_KEY)!;
    expect(stored).not.toContain('"owner"');
    const epic = JSON.parse(stored)[0].objectives[0].epics[0];
    expect(epic.owners).toEqual(['Ana Souza']);
  });

  it('reads current-format data untouched', async () => {
    const roadmap = makeRoadmap();
    localStorage.setItem(ROADMAPS_KEY, JSON.stringify([roadmap]));
    const storage = await loadService();
    expect(storage.getRoadmap('r1')).toEqual(roadmap);
  });

  it('survives corrupt owners values without throwing', async () => {
    const legacy = makeLegacyRoadmap() as { objectives: { epics: Record<string, unknown>[] }[] };
    legacy.objectives[0].epics[0].owners = 'oops';
    localStorage.setItem(ROADMAPS_KEY, JSON.stringify([legacy]));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const storage = await loadService();
    expect(() => storage.getAllRoadmaps()).not.toThrow();
  });
});

describe('storageService: duplicate (O20)', () => {
  it('keeps owners on the copy and the copy is independent of the original', async () => {
    localStorage.setItem(ROADMAPS_KEY, JSON.stringify([makeRoadmap()]));
    const storage = await loadService();
    const copy = storage.duplicateRoadmap('r1')!;
    expect(copy.objectives[0].epics[0].owners).toEqual(['Ana Souza', 'Bruno Lima']);
    expect(copy.objectives[0].epics[0].initiatives[0].owners).toEqual(['Ana Souza', 'Dani Externo']);

    const edited = structuredClone(copy);
    edited.objectives[0].epics[0].owners = ['Só um'];
    storage.saveRoadmap(edited);
    expect(storage.getRoadmap('r1')!.objectives[0].epics[0].owners).toEqual(['Ana Souza', 'Bruno Lima']);
  });
});
