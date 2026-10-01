import type { Roadmap, Status } from '@/types/roadmap.types';
import { STATUS_OPTIONS } from '@/utils/statusOptions';

export interface StatusCount {
  status: Status;
  count: number;
}

/** How many epics and initiatives carry each status, in the canonical status order; zeros omitted. */
export function computeStatusCounts(roadmap: Pick<Roadmap, 'objectives'>): StatusCount[] {
  const counts = new Map<Status, number>();
  for (const objective of roadmap.objectives) {
    for (const epic of objective.epics) {
      if (epic.status) counts.set(epic.status, (counts.get(epic.status) ?? 0) + 1);
      for (const initiative of epic.initiatives) {
        if (initiative.status) {
          counts.set(initiative.status, (counts.get(initiative.status) ?? 0) + 1);
        }
      }
    }
  }
  return STATUS_OPTIONS.filter((o) => counts.has(o.value)).map((o) => ({
    status: o.value,
    count: counts.get(o.value) as number,
  }));
}
