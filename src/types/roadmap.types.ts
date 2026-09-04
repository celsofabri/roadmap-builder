export type Status = 'planned' | 'in_progress' | 'done' | 'blocked';

export type Granularity = 'monthly' | 'weekly';

export interface Period {
  /** ISO "YYYY-MM-DD", always the 1st of the month */
  startDate: string;
  /** ISO "YYYY-MM-DD", always the last day of the month */
  endDate: string;
}

export interface Initiative {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status?: Status;
}

export interface Epic {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status?: Status;
  initiatives: Initiative[];
}

export interface Objective {
  id: string;
  title: string;
  description?: string;
  /** Hex color used to visually distinguish the objective's lane */
  color?: string;
  epics: Epic[];
}

export interface Roadmap {
  id: string;
  /** Workspace (team) this roadmap belongs to. */
  workspaceId: string;
  name: string;
  description?: string;
  period: Period;
  objectives: Objective[];
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapSummary {
  id: string;
  workspaceId: string;
  name: string;
  period: Period;
  objectiveCount: number;
  epicCount: number;
  updatedAt: string;
}

/** A workspace groups the roadmaps of a single team. */
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  description?: string;
  roadmapCount: number;
  updatedAt: string;
}
