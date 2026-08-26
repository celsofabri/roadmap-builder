import { useDroppable } from '@dnd-kit/core';
import type { Epic, Initiative, Objective } from '@/types/roadmap.types';
import { EpicBar } from '@/components/roadmap/EpicBar';
import { InitiativeBar } from '@/components/roadmap/InitiativeBar';

interface TimelineLaneProps {
  objective: Objective;
  dayWidth: number;
  snapDays: number;
  periodStart: string;
  timelineWidth: number;
  onEpicClick: (epic: Epic) => void;
  onInitiativeClick: (epic: Epic, initiative: Initiative) => void;
  onAddEpic: (objectiveId: string) => void;
}

function EpicRow({
  epic,
  objectiveId,
  color,
  dayWidth,
  snapDays,
  periodStart,
  timelineWidth,
  onEpicClick,
  onInitiativeClick,
}: {
  epic: Epic;
  objectiveId: string;
  color: string;
  dayWidth: number;
  snapDays: number;
  periodStart: string;
  timelineWidth: number;
  onEpicClick: (epic: Epic) => void;
  onInitiativeClick: (epic: Epic, initiative: Initiative) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `epic-lane:${epic.id}` });

  return (
    <div className="mb-1">
      <div className="relative h-10" style={{ width: timelineWidth }}>
        <EpicBar
          epic={epic}
          objectiveId={objectiveId}
          color={color}
          dayWidth={dayWidth}
          snapDays={snapDays}
          periodStart={periodStart}
          onClick={onEpicClick}
        />
      </div>
      <div
        ref={setNodeRef}
        className={`relative h-6 rounded ${isOver ? 'bg-blue-50 ring-1 ring-blue-300' : ''}`}
        style={{ width: timelineWidth }}
      >
        {epic.initiatives.map((initiative) => (
          <InitiativeBar
            key={initiative.id}
            initiative={initiative}
            epicId={epic.id}
            color={color}
            dayWidth={dayWidth}
            snapDays={snapDays}
            periodStart={periodStart}
            onClick={(i) => onInitiativeClick(epic, i)}
          />
        ))}
      </div>
    </div>
  );
}

export function TimelineLane({
  objective,
  dayWidth,
  snapDays,
  periodStart,
  timelineWidth,
  onEpicClick,
  onInitiativeClick,
  onAddEpic,
}: TimelineLaneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `objective-lane:${objective.id}` });
  const color = objective.color ?? '#64748b';

  return (
    <div className="flex border-b border-slate-100">
      <div className="sticky left-0 z-10 w-48 shrink-0 border-r border-slate-200 bg-white p-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <span className="truncate text-sm font-medium text-slate-800">{objective.title}</span>
        </div>
        <button
          type="button"
          onClick={() => onAddEpic(objective.id)}
          className="mt-1 text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          + Épico
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-hidden py-2 ${isOver ? 'bg-blue-50/50' : ''}`}
      >
        {objective.epics.length === 0 && (
          <p className="px-2 text-xs text-slate-400">Nenhum épico neste objetivo.</p>
        )}
        {objective.epics.map((epic) => (
          <EpicRow
            key={epic.id}
            epic={epic}
            objectiveId={objective.id}
            color={color}
            dayWidth={dayWidth}
            snapDays={snapDays}
            periodStart={periodStart}
            timelineWidth={timelineWidth}
            onEpicClick={onEpicClick}
            onInitiativeClick={onInitiativeClick}
          />
        ))}
      </div>
    </div>
  );
}
