import type { Roadmap, RoadmapSummary } from '@/types/roadmap.types';
import { regenerateRoadmapIds } from '@/utils/cloneRoadmap';

const STORAGE_KEY = 'roadmap-builder:roadmaps';

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

function toSummary(roadmap: Roadmap): RoadmapSummary {
  const epicCount = roadmap.objectives.reduce((sum, o) => sum + o.epics.length, 0);
  return {
    id: roadmap.id,
    name: roadmap.name,
    period: roadmap.period,
    objectiveCount: roadmap.objectives.length,
    epicCount,
    updatedAt: roadmap.updatedAt,
  };
}

export const storageService = {
  listRoadmaps(): RoadmapSummary[] {
    return readAll()
      .map(toSummary)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  getAllRoadmaps(): Roadmap[] {
    return readAll();
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
};
