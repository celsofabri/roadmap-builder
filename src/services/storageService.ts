import type {
  Roadmap,
  RoadmapSummary,
  TeamMember,
  Workspace,
  WorkspaceSummary,
} from '@/types/roadmap.types';
import { regenerateRoadmapIds } from '@/utils/cloneRoadmap';
import { migrateRoadmapOwnersWithReport } from '@/utils/owners';
import { buildSeedWorkspaces } from '@/utils/seedData';

const STORAGE_KEY = 'roadmap-builder:roadmaps';
const WORKSPACES_KEY = 'roadmap-builder:workspaces';
const ACTIVE_WORKSPACE_KEY = 'roadmap-builder:active-workspace';
const TEAM_MEMBERS_KEY = 'roadmap-builder:team-members';
const SEEDED_KEY = 'roadmap-builder:seeded';
/** Verbatim copy of the roadmaps key taken before the first owner -> owners migration. */
export const OWNERS_BACKUP_KEY = 'roadmap-builder:roadmaps:pre-owners-backup';

let migrationWarned = false;

/**
 * Folds the legacy single `owner` of epics/initiatives into `owners`, in memory only: reading
 * never writes the roadmaps key. The first time legacy data is seen, the untouched raw JSON is
 * copied to a backup key (never overwritten, so the oldest legacy copy survives).
 */
function migrateLegacyOwners(raw: string, parsed: unknown[]): Roadmap[] {
  let migrated = 0;
  let discarded = 0;
  const roadmaps = parsed.map((entry) => {
    const report = migrateRoadmapOwnersWithReport(entry);
    migrated += report.migrated;
    discarded += report.discarded;
    return report.roadmap;
  });

  if (migrated > 0) {
    try {
      if (localStorage.getItem(OWNERS_BACKUP_KEY) === null) {
        localStorage.setItem(OWNERS_BACKUP_KEY, raw);
      }
    } catch {
      console.warn('roadmap-builder: não foi possível guardar o backup da migração de responsáveis');
    }
  }
  if ((migrated > 0 || discarded > 0) && !migrationWarned) {
    migrationWarned = true;
    console.warn(
      `roadmap-builder: migrados ${migrated} campos "owner" para "owners"; descartadas ${discarded} entradas inválidas`,
    );
  }
  return roadmaps as Roadmap[];
}

function readAll(): Roadmap[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Cheap pre-check: `"owner"` does not match `"owners"`, so migrated data skips the walk.
    if (!raw.includes('"owner"')) return parsed as Roadmap[];
    return migrateLegacyOwners(raw, parsed);
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

function readTeamMembers(): TeamMember[] {
  const raw = localStorage.getItem(TEAM_MEMBERS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TeamMember[]) : [];
  } catch {
    console.error(
      'roadmap-builder: falha ao ler responsáveis do localStorage, dado corrompido ignorado',
    );
    return [];
  }
}

function writeTeamMembers(members: TeamMember[]): void {
  localStorage.setItem(TEAM_MEMBERS_KEY, JSON.stringify(members));
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

  /** Deletes a workspace and every roadmap/team member that belongs to it. */
  deleteWorkspace(id: string): void {
    writeWorkspaces(readWorkspaces().filter((w) => w.id !== id));
    writeAll(readAll().filter((r) => r.workspaceId !== id));
    writeTeamMembers(readTeamMembers().filter((m) => m.workspaceId !== id));
  },

  listTeamMembers(workspaceId: string): TeamMember[] {
    return readTeamMembers()
      .filter((m) => m.workspaceId === workspaceId)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  },

  getTeamMember(id: string): TeamMember | undefined {
    return readTeamMembers().find((m) => m.id === id);
  },

  saveTeamMember(member: TeamMember): void {
    const all = readTeamMembers();
    const index = all.findIndex((m) => m.id === member.id);
    if (index === -1) {
      all.push(member);
    } else {
      all[index] = member;
    }
    writeTeamMembers(all);
  },

  deleteTeamMember(id: string): void {
    writeTeamMembers(readTeamMembers().filter((m) => m.id !== id));
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
        writeTeamMembers(seed.teamMembers);
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
