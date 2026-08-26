import type { Epic, Initiative, Objective, Roadmap } from '@/types/roadmap.types';

/** Deep-clones a roadmap, generating fresh ids for it and every nested entity. */
export function regenerateRoadmapIds(roadmap: Roadmap): Roadmap {
  return {
    ...roadmap,
    id: crypto.randomUUID(),
    objectives: roadmap.objectives.map(regenerateObjectiveIds),
  };
}

function regenerateObjectiveIds(objective: Objective): Objective {
  return {
    ...objective,
    id: crypto.randomUUID(),
    epics: objective.epics.map(regenerateEpicIds),
  };
}

function regenerateEpicIds(epic: Epic): Epic {
  return {
    ...epic,
    id: crypto.randomUUID(),
    initiatives: epic.initiatives.map(regenerateInitiativeIds),
  };
}

function regenerateInitiativeIds(initiative: Initiative): Initiative {
  return {
    ...initiative,
    id: crypto.randomUUID(),
  };
}
