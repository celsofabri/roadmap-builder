import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Epic, Initiative, Objective } from '@/types/roadmap.types';
import { EpicBar } from '@/components/roadmap/EpicBar';
import { InitiativeBar } from '@/components/roadmap/InitiativeBar';
import { PlusIcon } from '@/components/shared/Icon';
import { diffInDaysISO, rangeSpanDays } from '@/utils/dateUtils';
import { packIntoRows } from '@/utils/packIntoRows';
import styles from './TimelineLane.module.scss';

/** Kept in sync with `.initiativeRow` height / gap in the stylesheet. */
const INITIATIVE_ROW_H = 18;
const INITIATIVE_ROW_GAP = 3;

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
  onAddInitiative: (epic: Epic) => void;
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
  onAddInitiative: (epic: Epic) => void;
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
  onAddInitiative,
}: EpicRowProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `epic-lane:${epic.id}` });

  // Overlapping initiatives are stacked instead of drawn on top of each other.
  const { placements, rowCount } = useMemo(() => packIntoRows(epic.initiatives), [epic.initiatives]);

  const hasInitiatives = epic.initiatives.length > 0;
  const laneHeight = hasInitiatives
    ? rowCount * INITIATIVE_ROW_H + (rowCount - 1) * INITIATIVE_ROW_GAP
    : 0;

  // "+" affordance sits just past the epic bar, clamped so it stays in view.
  const epicLeft = diffInDaysISO(periodStart, epic.startDate) * dayWidth;
  const epicWidth = Math.max(rangeSpanDays(epic) * dayWidth, 14);
  const addLeft = Math.min(epicLeft + epicWidth + 6, Math.max(timelineWidth - 26, 0));

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
        <button
          type="button"
          className={styles.addInitiativeBtn}
          style={{ left: addLeft }}
          onClick={() => onAddInitiative(epic)}
          title={`Adicionar iniciativa em "${epic.title}"`}
          aria-label={`Adicionar iniciativa em ${epic.title}`}
        >
          <PlusIcon size={12} />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`${styles.initiativeLane} ${isOver ? styles.initiativeLaneOver : ''}`}
        style={{ width: timelineWidth, height: laneHeight || undefined }}
      >
        {placements.map(({ item, row }) => (
          <InitiativeBar
            key={item.id}
            initiative={item}
            epicId={epic.id}
            color={color}
            dayWidth={dayWidth}
            snapDays={snapDays}
            periodStart={periodStart}
            top={row * (INITIATIVE_ROW_H + INITIATIVE_ROW_GAP)}
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
  onAddInitiative,
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
              onAddInitiative={onAddInitiative}
            />
          ))
        )}
      </div>
    </div>
  );
}
