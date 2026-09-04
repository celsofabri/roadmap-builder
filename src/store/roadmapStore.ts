import { create } from 'zustand';
import { storageService } from '@/services/storageService';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type {
  Epic,
  Initiative,
  Objective,
  Period,
  Roadmap,
  RoadmapSummary,
  Status,
} from '@/types/roadmap.types';

export interface RoadmapMetaInput {
  name: string;
  description?: string;
  period: Period;
}

export interface ObjectiveInput {
  title: string;
  description?: string;
  color?: string;
  owners?: string[];
}

export interface EpicInput {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status?: Status;
  owner?: string;
}

export interface InitiativeInput {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status?: Status;
  owner?: string;
}

interface RoadmapStoreState {
  roadmaps: RoadmapSummary[];
  activeRoadmap: Roadmap | null;

  loadRoadmaps: () => void;
  createRoadmap: (input: RoadmapMetaInput) => Roadmap;
  openRoadmap: (id: string) => void;
  closeRoadmap: () => void;
  updateRoadmapMeta: (patch: Partial<RoadmapMetaInput>) => void;
  renameRoadmap: (id: string, name: string) => void;
  deleteRoadmap: (id: string) => void;
  duplicateRoadmap: (id: string) => void;
  importRoadmap: (roadmap: Roadmap) => void;

  addObjective: (input: ObjectiveInput) => void;
  updateObjective: (objectiveId: string, patch: Partial<ObjectiveInput>) => void;
  removeObjective: (objectiveId: string) => void;
  reorderObjectives: (orderedIds: string[]) => void;

  addEpic: (objectiveId: string, input: EpicInput) => void;
  updateEpic: (epicId: string, patch: Partial<EpicInput>) => void;
  removeEpic: (epicId: string) => void;
  moveEpic: (epicId: string, targetObjectiveId: string, targetIndex: number) => void;

  addInitiative: (epicId: string, input: InitiativeInput) => void;
  updateInitiative: (initiativeId: string, patch: Partial<InitiativeInput>) => void;
  removeInitiative: (initiativeId: string) => void;
  moveInitiative: (initiativeId: string, targetEpicId: string, targetIndex: number) => void;
}

function now(): string {
  return new Date().toISOString();
}

function findEpicOwner(roadmap: Roadmap, epicId: string): Objective | undefined {
  return roadmap.objectives.find((o) => o.epics.some((e) => e.id === epicId));
}

function findInitiativeOwner(
  roadmap: Roadmap,
  initiativeId: string,
): { objective: Objective; epic: Epic } | undefined {
  for (const objective of roadmap.objectives) {
    const epic = objective.epics.find((e) => e.initiatives.some((i) => i.id === initiativeId));
    if (epic) return { objective, epic };
  }
  return undefined;
}

export const useRoadmapStore = create<RoadmapStoreState>((set, get) => ({
  roadmaps: [],
  activeRoadmap: null,

  loadRoadmaps: () => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspaceId;
    set({ roadmaps: workspaceId ? storageService.listRoadmaps(workspaceId) : [] });
  },

  createRoadmap: (input) => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspaceId;
    if (!workspaceId) throw new Error('Nenhum workspace ativo.');
    const timestamp = now();
    const roadmap: Roadmap = {
      id: crypto.randomUUID(),
      workspaceId,
      name: input.name,
      description: input.description,
      period: input.period,
      objectives: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    storageService.saveRoadmap(roadmap);
    set({ roadmaps: storageService.listRoadmaps(workspaceId) });
    return roadmap;
  },

  openRoadmap: (id) => {
    set({ activeRoadmap: storageService.getRoadmap(id) ?? null });
  },

  closeRoadmap: () => set({ activeRoadmap: null }),

  updateRoadmapMeta: (patch) => {
    const active = get().activeRoadmap;
    if (!active) return;
    persist(set, { ...active, ...patch, updatedAt: now() });
  },

  renameRoadmap: (id, name) => {
    const roadmap = storageService.getRoadmap(id);
    if (!roadmap) return;
    const updated = { ...roadmap, name, updatedAt: now() };
    storageService.saveRoadmap(updated);
    const active = get().activeRoadmap;
    set({
      roadmaps: storageService.listRoadmaps(updated.workspaceId),
      activeRoadmap: active?.id === id ? updated : active,
    });
  },

  deleteRoadmap: (id) => {
    const roadmap = storageService.getRoadmap(id);
    if (!roadmap) return;
    storageService.deleteRoadmap(id);
    const active = get().activeRoadmap;
    set({
      roadmaps: storageService.listRoadmaps(roadmap.workspaceId),
      activeRoadmap: active?.id === id ? null : active,
    });
  },

  duplicateRoadmap: (id) => {
    const duplicate = storageService.duplicateRoadmap(id);
    if (!duplicate) return;
    set({ roadmaps: storageService.listRoadmaps(duplicate.workspaceId) });
  },

  importRoadmap: (roadmap) => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspaceId;
    if (!workspaceId) return;
    storageService.saveRoadmap({ ...roadmap, workspaceId });
    set({ roadmaps: storageService.listRoadmaps(workspaceId) });
  },

  addObjective: (input) => {
    const active = get().activeRoadmap;
    if (!active) return;
    const objective: Objective = { id: crypto.randomUUID(), epics: [], ...input };
    persist(set, {
      ...active,
      objectives: [...active.objectives, objective],
      updatedAt: now(),
    });
  },

  updateObjective: (objectiveId, patch) => {
    const active = get().activeRoadmap;
    if (!active) return;
    persist(set, {
      ...active,
      objectives: active.objectives.map((o) => (o.id === objectiveId ? { ...o, ...patch } : o)),
      updatedAt: now(),
    });
  },

  removeObjective: (objectiveId) => {
    const active = get().activeRoadmap;
    if (!active) return;
    persist(set, {
      ...active,
      objectives: active.objectives.filter((o) => o.id !== objectiveId),
      updatedAt: now(),
    });
  },

  reorderObjectives: (orderedIds) => {
    const active = get().activeRoadmap;
    if (!active) return;
    const byId = new Map(active.objectives.map((o) => [o.id, o]));
    const reordered = orderedIds.map((id) => byId.get(id)).filter((o): o is Objective => !!o);
    persist(set, { ...active, objectives: reordered, updatedAt: now() });
  },

  addEpic: (objectiveId, input) => {
    const active = get().activeRoadmap;
    if (!active) return;
    const epic: Epic = { id: crypto.randomUUID(), initiatives: [], ...input };
    persist(set, {
      ...active,
      objectives: active.objectives.map((o) =>
        o.id === objectiveId ? { ...o, epics: [...o.epics, epic] } : o,
      ),
      updatedAt: now(),
    });
  },

  updateEpic: (epicId, patch) => {
    const active = get().activeRoadmap;
    if (!active) return;
    persist(set, {
      ...active,
      objectives: active.objectives.map((o) => ({
        ...o,
        epics: o.epics.map((e) => (e.id === epicId ? { ...e, ...patch } : e)),
      })),
      updatedAt: now(),
    });
  },

  removeEpic: (epicId) => {
    const active = get().activeRoadmap;
    if (!active) return;
    persist(set, {
      ...active,
      objectives: active.objectives.map((o) => ({
        ...o,
        epics: o.epics.filter((e) => e.id !== epicId),
      })),
      updatedAt: now(),
    });
  },

  moveEpic: (epicId, targetObjectiveId, targetIndex) => {
    const active = get().activeRoadmap;
    if (!active) return;
    const sourceObjective = findEpicOwner(active, epicId);
    const epic = sourceObjective?.epics.find((e) => e.id === epicId);
    if (!sourceObjective || !epic) return;

    const objectives = active.objectives.map((o) => {
      if (o.id === sourceObjective.id) {
        return { ...o, epics: o.epics.filter((e) => e.id !== epicId) };
      }
      return o;
    });

    persist(set, {
      ...active,
      objectives: objectives.map((o) => {
        if (o.id !== targetObjectiveId) return o;
        const epics = [...o.epics];
        epics.splice(targetIndex, 0, epic);
        return { ...o, epics };
      }),
      updatedAt: now(),
    });
  },

  addInitiative: (epicId, input) => {
    const active = get().activeRoadmap;
    if (!active) return;
    const initiative: Initiative = { id: crypto.randomUUID(), ...input };
    persist(set, {
      ...active,
      objectives: active.objectives.map((o) => ({
        ...o,
        epics: o.epics.map((e) =>
          e.id === epicId ? { ...e, initiatives: [...e.initiatives, initiative] } : e,
        ),
      })),
      updatedAt: now(),
    });
  },

  updateInitiative: (initiativeId, patch) => {
    const active = get().activeRoadmap;
    if (!active) return;
    persist(set, {
      ...active,
      objectives: active.objectives.map((o) => ({
        ...o,
        epics: o.epics.map((e) => ({
          ...e,
          initiatives: e.initiatives.map((i) =>
            i.id === initiativeId ? { ...i, ...patch } : i,
          ),
        })),
      })),
      updatedAt: now(),
    });
  },

  removeInitiative: (initiativeId) => {
    const active = get().activeRoadmap;
    if (!active) return;
    persist(set, {
      ...active,
      objectives: active.objectives.map((o) => ({
        ...o,
        epics: o.epics.map((e) => ({
          ...e,
          initiatives: e.initiatives.filter((i) => i.id !== initiativeId),
        })),
      })),
      updatedAt: now(),
    });
  },

  moveInitiative: (initiativeId, targetEpicId, targetIndex) => {
    const active = get().activeRoadmap;
    if (!active) return;
    const owner = findInitiativeOwner(active, initiativeId);
    const initiative = owner?.epic.initiatives.find((i) => i.id === initiativeId);
    if (!owner || !initiative) return;

    const objectives = active.objectives.map((o) => ({
      ...o,
      epics: o.epics.map((e) =>
        e.id === owner.epic.id
          ? { ...e, initiatives: e.initiatives.filter((i) => i.id !== initiativeId) }
          : e,
      ),
    }));

    persist(set, {
      ...active,
      objectives: objectives.map((o) => ({
        ...o,
        epics: o.epics.map((e) => {
          if (e.id !== targetEpicId) return e;
          const initiatives = [...e.initiatives];
          initiatives.splice(targetIndex, 0, initiative);
          return { ...e, initiatives };
        }),
      })),
      updatedAt: now(),
    });
  },
}));

function persist(set: (partial: Partial<RoadmapStoreState>) => void, roadmap: Roadmap): void {
  storageService.saveRoadmap(roadmap);
  set({ activeRoadmap: roadmap, roadmaps: storageService.listRoadmaps(roadmap.workspaceId) });
}
