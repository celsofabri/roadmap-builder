// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { makeRoadmap } from '@/test/fixtures';
import { storageService } from '@/services/storageService';
import { useRoadmapStore } from './roadmapStore';

function activeEpic(id = 'e1') {
  return useRoadmapStore.getState().activeRoadmap!.objectives.flatMap((o) => o.epics).find((e) => e.id === id)!;
}
function activeInitiative(id: string) {
  return activeEpicInitiatives().find((i) => i.id === id)!;
}
function activeEpicInitiatives() {
  return useRoadmapStore.getState().activeRoadmap!.objectives.flatMap((o) => o.epics.flatMap((e) => e.initiatives));
}

beforeEach(() => {
  localStorage.clear();
  storageService.saveRoadmap(makeRoadmap());
  useRoadmapStore.getState().openRoadmap('r1');
});

describe('owners survive store operations (O20, O21)', () => {
  it('updateEpic with only dates (drag/resize) keeps owners', () => {
    useRoadmapStore.getState().updateEpic('e1', { startDate: '2026-02-02', endDate: '2026-04-30' });
    expect(activeEpic().owners).toEqual(['Ana Souza', 'Bruno Lima']);
    expect(activeEpic().startDate).toBe('2026-02-02');
    expect(storageService.getRoadmap('r1')!.objectives[0].epics[0].owners).toEqual(['Ana Souza', 'Bruno Lima']);
  });

  it('updateInitiative with only dates keeps owners', () => {
    useRoadmapStore.getState().updateInitiative('i1', { startDate: '2026-01-12', endDate: '2026-02-20' });
    expect(activeInitiative('i1').owners).toEqual(['Ana Souza', 'Dani Externo']);
  });

  it('updateEpic can replace owners and clear them with undefined', () => {
    useRoadmapStore.getState().updateEpic('e1', { owners: ['Bruno Lima'] });
    expect(activeEpic().owners).toEqual(['Bruno Lima']);
    useRoadmapStore.getState().updateEpic('e1', { owners: undefined });
    expect(activeEpic().owners).toBeUndefined();
    expect(JSON.stringify(storageService.getRoadmap('r1'))).not.toContain('Bruno Lima');
  });

  it('moveInitiative to another epic keeps its owners', () => {
    useRoadmapStore.getState().moveInitiative('i1', 'e2', 0);
    const moved = activeEpic('e2').initiatives[0];
    expect(moved.id).toBe('i1');
    expect(moved.owners).toEqual(['Ana Souza', 'Dani Externo']);
  });

  it('moveEpic and reorderEpics/reorderInitiatives keep owners', () => {
    const store = useRoadmapStore.getState();
    store.reorderInitiatives('e1', ['i2', 'i1']);
    expect(activeInitiative('i1').owners).toEqual(['Ana Souza', 'Dani Externo']);
    store.reorderEpics('o1', ['e2', 'e1']);
    expect(activeEpic('e1').owners).toEqual(['Ana Souza', 'Bruno Lima']);
    store.addObjective({ title: 'Outro' });
    const otherId = useRoadmapStore.getState().activeRoadmap!.objectives[1].id;
    useRoadmapStore.getState().moveEpic('e1', otherId, 0);
    expect(activeEpic('e1').owners).toEqual(['Ana Souza', 'Bruno Lima']);
  });

  it('addEpic/addInitiative persist owners as given', () => {
    const store = useRoadmapStore.getState();
    store.addEpic('o1', { title: 'Novo', startDate: '2026-07-01', endDate: '2026-07-31', owners: ['A', 'B'] });
    const created = useRoadmapStore.getState().activeRoadmap!.objectives[0].epics.at(-1)!;
    expect(created.owners).toEqual(['A', 'B']);
    expect(storageService.getRoadmap('r1')!.objectives[0].epics.at(-1)!.owners).toEqual(['A', 'B']);
  });

  it('duplicating a roadmap keeps owners and editing the copy leaves the original alone', () => {
    useRoadmapStore.getState().duplicateRoadmap('r1');
    const copy = storageService.getAllRoadmaps().find((r) => r.id !== 'r1')!;
    expect(copy.objectives[0].epics[0].owners).toEqual(['Ana Souza', 'Bruno Lima']);

    useRoadmapStore.getState().openRoadmap(copy.id);
    useRoadmapStore.getState().updateEpic(copy.objectives[0].epics[0].id, { owners: ['Só um'] });
    expect(storageService.getRoadmap('r1')!.objectives[0].epics[0].owners).toEqual(['Ana Souza', 'Bruno Lima']);
  });
});
