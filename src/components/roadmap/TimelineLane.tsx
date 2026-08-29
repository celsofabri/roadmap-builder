import { useDroppable } from '@dnd-kit/core';
import type { Epic, Initiative, Objective } from '@/types/roadmap.types';
import { EpicBar } from '@/components/roadmap/EpicBar';
import { InitiativeBar } from '@/components/roadmap/InitiativeBar';
import { PlusIcon } from '@/components/shared/Icon';
import styles from './TimelineLane.module.scss';

interface TimelineLaneProps {
  objective: Objective;
  dayWidth: number;
  snapDays: number;
  periodStart: string;
  timelineWidth: number;
  labelWidth: number;
  onEpicClick: (epic: Epic) => void;
  onInitiativeClick: (epic: Epic, initiative: Initiative) => void;
  onAddEpic: (objectiveId: string) => void;
}

interface EpicRowProps {
  epic: Epic;
  objectiveId: string;
  color: string;
  dayWidth: number;
  snapDays: number;
  periodStart: string;
  timelineWidth: number;
  onEpicClick: (epic: Epic) => void;
  onInitiativeClick: (epic: Epic, initiative: Initiative) => void;
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
}: EpicRowProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `epic-lane:${epic.id}` });
  const hasInitiatives = epic.initiatives.length > 0;

  return (
    <div className={styles.epicRow}>
      <div className={styles.epicBarSlot} style={{ width: timelineWidth }}>
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
        className={`${styles.initiativeLane} ${hasInitiatives ? styles.initiativeLaneFilled : ''} ${
          isOver ? styles.initiativeLaneOver : ''
        }`}
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
  labelWidth,
  onEpicClick,
  onInitiativeClick,
  onAddEpic,
}: TimelineLaneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `objective-lane:${objective.id}` });
  const color = objective.color ?? '#8b93a7';
  const initiativeCount = objective.epics.reduce((sum, e) => sum + e.initiatives.length, 0);

  return (
    <div className={styles.lane}>
      <div className={styles.laneLabel} style={{ width: labelWidth }}>
        <div className={styles.laneLabelRow}>
          <span className={styles.laneDot} style={{ backgroundColor: color }} />
          <span className={styles.laneTitle} title={objective.title}>
            {objective.title}
          </span>
        </div>
        <div className={styles.laneMeta}>
          {objective.epics.length} épico{objective.epics.length === 1 ? '' : 's'} ·{' '}
          {initiativeCount} iniciativa{initiativeCount === 1 ? '' : 's'}
        </div>
        <button type="button" onClick={() => onAddEpic(objective.id)} className={styles.addEpic}>
          <PlusIcon size={12} />
          Épico
        </button>
      </div>

      <div ref={setNodeRef} className={`${styles.laneBody} ${isOver ? styles.laneBodyOver : ''}`}>
        {objective.epics.length === 0 ? (
          <p className={styles.laneEmpty}>Nenhum épico neste objetivo.</p>
        ) : (
          objective.epics.map((epic) => (
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
          ))
        )}
      </div>
    </div>
  );
}
