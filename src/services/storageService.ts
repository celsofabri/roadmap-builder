import type { Roadmap, RoadmapSummary, Workspace, WorkspaceSummary } from '@/types/roadmap.types';
import { regenerateRoadmapIds } from '@/utils/cloneRoadmap';
import { buildSeedWorkspaces } from '@/utils/seedData';

const STORAGE_KEY = 'roadmap-builder:roadmaps';
const WORKSPACES_KEY = 'roadmap-builder:workspaces';
const ACTIVE_WORKSPACE_KEY = 'roadmap-builder:active-workspace';
const SEEDED_KEY = 'roadmap-builder:seeded';

function readAll(): Roadmap[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Roadmap[]) : [];
  } catch {
    console.error('roadmap-builder: falha ao ler roadmaps do localStorage, dado corrompido ignorado');
    return [];
  }
}

function writeAll(roadmaps: Roadmap[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roadmaps));
}

function readWorkspaces(): Workspace[] {
  const raw = localStorage.getItem(WORKSPACES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Workspace[]) : [];
  } catch {
    console.error('roadmap-builder: falha ao ler workspaces do localStorage, dado corrompido ignorado');
    return [];
  }
}

function writeWorkspaces(workspaces: Workspace[]): void {
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces));
}

function toSummary(roadmap: Roadmap): RoadmapSummary {
  const epicCount = roadmap.objectives.reduce((sum, o) => sum + o.epics.length, 0);
  return {
    id: roadmap.id,
    workspaceId: roadmap.workspaceId,
    name: roadmap.name,
    period: roadmap.period,
    objectiveCount: roadmap.objectives.length,
    epicCount,
    updatedAt: roadmap.updatedAt,
  };
}

function newWorkspace(name: string, description?: string): Workspace {
  const timestamp = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    description,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export const storageService = {
  listRoadmaps(workspaceId: string): RoadmapSummary[] {
    return readAll()
      .filter((r) => r.workspaceId === workspaceId)
      .map(toSummary)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  /** All roadmaps, optionally scoped to a workspace. Unscoped only for export/migration. */
  getAllRoadmaps(workspaceId?: string): Roadmap[] {
    const all = readAll();
    return workspaceId ? all.filter((r) => r.workspaceId === workspaceId) : all;
  },

  getRoadmap(id: string): Roadmap | undefined {
    return readAll().find((r) => r.id === id);
  },

  saveRoadmap(roadmap: Roadmap): void {
    const all = readAll();
    const index = all.findIndex((r) => r.id === roadmap.id);
    if (index === -1) {
      all.push(roadmap);
    } else {
      all[index] = roadmap;
    }
    writeAll(all);
  },

  deleteRoadmap(id: string): void {
    writeAll(readAll().filter((r) => r.id !== id));
  },

  duplicateRoadmap(id: string): Roadmap | undefined {
    const original = this.getRoadmap(id);
    if (!original) return undefined;

    const now = new Date().toISOString();
    const duplicate: Roadmap = {
      ...regenerateRoadmapIds(original),
      name: `${original.name} (cópia)`,
      createdAt: now,
      updatedAt: now,
    };

    const all = readAll();
    all.push(duplicate);
    writeAll(all);
    return duplicate;
  },

  replaceAll(roadmaps: Roadmap[]): void {
    writeAll(roadmaps);
  },

  listWorkspaces(): WorkspaceSummary[] {
    const roadmaps = readAll();
    return readWorkspaces()
      .map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description,
        iconDataUrl: w.iconDataUrl,
        roadmapCount: roadmaps.filter((r) => r.workspaceId === w.id).length,
        updatedAt: w.updatedAt,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  },

  getWorkspace(id: string): Workspace | undefined {
    return readWorkspaces().find((w) => w.id === id);
  },

  saveWorkspace(workspace: Workspace): void {
    const all = readWorkspaces();
    const index = all.findIndex((w) => w.id === workspace.id);
    if (index === -1) {
      all.push(workspace);
    } else {
      all[index] = workspace;
    }
    writeWorkspaces(all);
  },

  /** Deletes a workspace and every roadmap that belongs to it. */
  deleteWorkspace(id: string): void {
    writeWorkspaces(readWorkspaces().filter((w) => w.id !== id));
    writeAll(readAll().filter((r) => r.workspaceId !== id));
  },

  getActiveWorkspaceId(): string | null {
    return localStorage.getItem(ACTIVE_WORKSPACE_KEY);
  },

  setActiveWorkspaceId(id: string): void {
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
  },

  /**
   * Runs once per app load. Seeds demo data on a fresh install, folds any
   * pre-workspaces roadmaps into a default workspace on upgrade, and always
   * guarantees at least one workspace exists with a valid active selection.
   */
  initializeIfNeeded(): void {
    let workspaces = readWorkspaces();

    if (workspaces.length === 0) {
      const roadmaps = readAll();
      if (roadmaps.length === 0 && !localStorage.getItem(SEEDED_KEY)) {
        localStorage.setItem(SEEDED_KEY, '1');
        const seed = buildSeedWorkspaces();
        writeWorkspaces(seed.workspaces);
        writeAll(seed.roadmaps);
        workspaces = seed.workspaces;
      } else if (roadmaps.length > 0) {
        const fallback = newWorkspace('Meu workspace');
        writeWorkspaces([fallback]);
        writeAll(roadmaps.map((r) => ({ ...r, workspaceId: fallback.id })));
        workspaces = [fallback];
      }
    }

    if (workspaces.length === 0) {
      const fallback = newWorkspace('Meu workspace');
      writeWorkspaces([fallback]);
      workspaces = [fallback];
    }

    const activeId = this.getActiveWorkspaceId();
    if (!activeId || !workspaces.some((w) => w.id === activeId)) {
      this.setActiveWorkspaceId(workspaces[0].id);
    }
  },
};
