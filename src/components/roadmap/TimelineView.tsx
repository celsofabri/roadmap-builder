import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import { useRoadmapStore } from '@/store/roadmapStore';
import type { Epic, Granularity, Initiative, Roadmap } from '@/types/roadmap.types';
import { TimelineLane } from '@/components/roadmap/TimelineLane';
import { addDaysISO, buildRulerCells, rangeSpanDays, snapUnitDays } from '@/utils/dateUtils';

interface TimelineViewProps {
  roadmap: Roadmap;
  onEditEpic: (objectiveId: string, epic: Epic) => void;
  onAddEpic: (objectiveId: string) => void;
  onEditInitiative: (epic: Epic, initiative: Initiative) => void;
}

type DragData =
  | { type: 'epic'; objectiveId: string; epic: Epic }
  | { type: 'initiative'; epicId: string; initiative: Initiative };

const OBJECTIVE_LANE_PREFIX = 'objective-lane:';
const EPIC_LANE_PREFIX = 'epic-lane:';

function findEpicById(roadmap: Roadmap, epicId: string): Epic | undefined {
  for (const objective of roadmap.objectives) {
    const epic = objective.epics.find((e) => e.id === epicId);
    if (epic) return epic;
  }
  return undefined;
}

export function TimelineView({
  roadmap,
  onEditEpic,
  onAddEpic,
  onEditInitiative,
}: TimelineViewProps) {
  const [granularity, setGranularity] = useState<Granularity>('monthly');
  const moveEpic = useRoadmapStore((s) => s.moveEpic);
  const updateEpic = useRoadmapStore((s) => s.updateEpic);
  const moveInitiative = useRoadmapStore((s) => s.moveInitiative);
  const updateInitiative = useRoadmapStore((s) => s.updateInitiative);

  const dayWidth = granularity === 'weekly' ? 14 : 5;
  const snapDays = snapUnitDays(granularity);
  const timelineWidth = rangeSpanDays(roadmap.period) * dayWidth;
  const rulerCells = useMemo(
    () => buildRulerCells(roadmap.period, granularity),
    [roadmap.period, granularity],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const modifiers: Modifier[] = useMemo(() => {
    const step = dayWidth * snapDays;
    return [
      ({ transform }) => ({
        ...transform,
        x: Math.round(transform.x / step) * step,
        y: 0,
      }),
    ];
  }, [dayWidth, snapDays]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over, delta } = event;
    const data = active.data.current as DragData | undefined;
    if (!data) return;

    const step = dayWidth * snapDays;
    const dayDelta = Math.round(delta.x / step) * snapDays;
    const overId = over ? String(over.id) : null;

    if (data.type === 'epic') {
      const { epic, objectiveId } = data;
      const targetObjectiveId = overId?.startsWith(OBJECTIVE_LANE_PREFIX)
        ? overId.slice(OBJECTIVE_LANE_PREFIX.length)
        : objectiveId;

      if (targetObjectiveId !== objectiveId) {
        const targetObjective = roadmap.objectives.find((o) => o.id === targetObjectiveId);
        if (targetObjective) {
          moveEpic(epic.id, targetObjectiveId, targetObjective.epics.length);
        }
      }
      if (dayDelta !== 0) {
        updateEpic(epic.id, {
          startDate: addDaysISO(epic.startDate, dayDelta),
          endDate: addDaysISO(epic.endDate, dayDelta),
        });
      }
    } else {
      const { initiative, epicId } = data;
      const targetEpicId = overId?.startsWith(EPIC_LANE_PREFIX)
        ? overId.slice(EPIC_LANE_PREFIX.length)
        : epicId;

      if (targetEpicId !== epicId) {
        const targetEpic = findEpicById(roadmap, targetEpicId);
        if (targetEpic) {
          moveInitiative(initiative.id, targetEpicId, targetEpic.initiatives.length);
        }
      }
      if (dayDelta !== 0) {
        updateInitiative(initiative.id, {
          startDate: addDaysISO(initiative.startDate, dayDelta),
          endDate: addDaysISO(initiative.endDate, dayDelta),
        });
      }
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 p-3">
        <h2 className="text-sm font-medium text-slate-700">Timeline</h2>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-sm">
          <button
            type="button"
            onClick={() => setGranularity('monthly')}
            className={`rounded-md px-3 py-1 ${
              granularity === 'monthly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setGranularity('weekly')}
            className={`rounded-md px-3 py-1 ${
              granularity === 'weekly' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
            }`}
          >
            Semanal
          </button>
        </div>
      </div>

      {roadmap.objectives.length === 0 ? (
        <p className="p-6 text-center text-sm text-slate-400">
          Nenhum objetivo ainda. Adicione um na visão de lista.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <div style={{ width: 192 + timelineWidth }}>
            <div className="flex border-b border-slate-200 bg-slate-50">
              <div className="sticky left-0 z-10 w-48 shrink-0 border-r border-slate-200 bg-slate-50" />
              <div className="flex">
                {rulerCells.map((cell) => (
                  <div
                    key={cell.startDate}
                    style={{ width: rangeSpanDays(cell) * dayWidth }}
                    className="shrink-0 truncate border-r border-slate-200 px-2 py-1.5 text-xs text-slate-500"
                  >
                    {cell.label}
                  </div>
                ))}
              </div>
            </div>

            <DndContext sensors={sensors} modifiers={modifiers} onDragEnd={handleDragEnd}>
              {roadmap.objectives.map((objective) => (
                <TimelineLane
                  key={objective.id}
                  objective={objective}
                  dayWidth={dayWidth}
                  snapDays={snapDays}
                  periodStart={roadmap.period.startDate}
                  timelineWidth={timelineWidth}
                  onEpicClick={(epic) => onEditEpic(objective.id, epic)}
                  onInitiativeClick={onEditInitiative}
                  onAddEpic={onAddEpic}
                />
              ))}
            </DndContext>
          </div>
        </div>
      )}
    </div>
  );
}
