import { useMemo, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Epic, Initiative, Objective } from '@/types/roadmap.types';
import { EpicBar } from '@/components/roadmap/EpicBar';
import { InitiativeBar } from '@/components/roadmap/InitiativeBar';
import { Modal } from '@/components/shared/Modal';
import { GripIcon, InfoIcon, PlusIcon, TrashIcon } from '@/components/shared/Icon';
import { businessDaysBetweenISO, rangeSpanBusinessDays } from '@/utils/dateUtils';
import { packIntoRows } from '@/utils/packIntoRows';
import { ownerColor } from '@/utils/ownerAvatar';
import { DEFAULT_LANE_COLOR, lightenColor } from '@/utils/color';
import styles from './TimelineLane.module.scss';

/** How much lighter initiative bars are than their epic's own color — keeps the two visually distinct. */
const INITIATIVE_LIGHTEN = 0.42;

/** Kept in sync with `.slot` height in InitiativeBar.module.scss. */
const INITIATIVE_ROW_H = 24;
const INITIATIVE_ROW_GAP = 4;

/** Kept in sync with `.addInitiativeBtn` width in the stylesheet. */
const ADD_BTN_W = 22;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface TimelineLaneProps {
  objective: Objective;
  showOwners: boolean;
  dayWidth: number;
  snapDays: number;
  periodStart: string;
  timelineWidth: number;
  labelWidth: number;
  onEpicClick: (epic: Epic) => void;
  onInitiativeClick: (epic: Epic, initiative: Initiative) => void;
  onAddEpic: (objectiveId: string) => void;
  onAddInitiative: (epic: Epic) => void;
  onDeleteObjective: (objective: Objective) => void;
}

interface InitiativeSlotProps {
  initiative: Initiative;
  epicId: string;
  color: string;
  showOwners: boolean;
  dayWidth: number;
  snapDays: number;
  periodStart: string;
  timelineWidth: number;
  top: number;
  onClick: (initiative: Initiative) => void;
}

/**
 * Wraps each InitiativeBar in a full-width drop target for its own row, so
 * dragging another initiative vertically onto it — regardless of that
 * initiative's own date range — reorders the two within the epic.
 */
function InitiativeSlot({
  initiative,
  epicId,
  color,
  showOwners,
  dayWidth,
  snapDays,
  periodStart,
  timelineWidth,
  top,
  onClick,
}: InitiativeSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `initiative-row:${initiative.id}`,
    data: { type: 'initiative' as const, epicId },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ position: 'absolute', left: 0, top, width: timelineWidth, height: INITIATIVE_ROW_H }}
    >
      <InitiativeBar
        initiative={initiative}
        epicId={epicId}
        color={color}
        showOwner={showOwners}
        dayWidth={dayWidth}
        snapDays={snapDays}
        periodStart={periodStart}
        top={0}
        isRowOver={isOver}
        onClick={onClick}
      />
    </div>
  );
}

interface EpicRowProps {
  epic: Epic;
  objectiveId: string;
  color: string;
  showOwners: boolean;
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
  showOwners,
  dayWidth,
  snapDays,
  periodStart,
  timelineWidth,
  onEpicClick,
  onInitiativeClick,
  onAddInitiative,
}: EpicRowProps) {
  const { setNodeRef: setLaneRef, isOver: isLaneOver } = useDroppable({ id: `epic-lane:${epic.id}` });
  // Full-row drop target — dragging another epic anywhere over this epic's
  // block (bar + its initiatives), regardless of that epic's own date range,
  // reorders the two within the objective.
  const { setNodeRef: setRowRef, isOver: isRowOver } = useDroppable({
    id: `epic-row:${epic.id}`,
    data: { type: 'epic' as const, objectiveId },
  });
  const initiativeColor = useMemo(() => lightenColor(color, INITIATIVE_LIGHTEN), [color]);

  // Overlapping initiatives are stacked instead of drawn on top of each other.
  const { placements, rowCount } = useMemo(() => packIntoRows(epic.initiatives), [epic.initiatives]);

  const hasInitiatives = epic.initiatives.length > 0;
  const laneHeight = hasInitiatives
    ? rowCount * INITIATIVE_ROW_H + (rowCount - 1) * INITIATIVE_ROW_GAP
    : 0;

  // "+" affordance sits just past the epic bar. When the bar reaches the end of
  // the timeline there is no room after it, so it tucks inside the bar's right
  // end instead — inset far enough to clear the resize handle.
  const epicLeft = businessDaysBetweenISO(periodStart, epic.startDate) * dayWidth;
  const epicWidth = Math.max(rangeSpanBusinessDays(epic) * dayWidth, 14);
  const epicRight = epicLeft + epicWidth;
  const fitsAfterBar = epicRight + 6 + ADD_BTN_W <= timelineWidth;
  const preferredLeft = fitsAfterBar ? epicRight + 6 : epicRight - ADD_BTN_W - 10;
  const addLeft = clamp(preferredLeft, 2, Math.max(timelineWidth - ADD_BTN_W - 2, 2));

  return (
    <div ref={setRowRef} className={`${styles.epicRow} ${isRowOver ? styles.epicRowOver : ''}`}>
      <div className={styles.epicBarSlot} style={{ width: timelineWidth }}>
        <EpicBar
          epic={epic}
          objectiveId={objectiveId}
          color={color}
          showOwner={showOwners}
          dayWidth={dayWidth}
          snapDays={snapDays}
          periodStart={periodStart}
          isRowOver={isRowOver}
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
          <PlusIcon size={13} />
        </button>
      </div>

      <div
        ref={setLaneRef}
        className={`${styles.initiativeLane} ${isLaneOver ? styles.initiativeLaneOver : ''}`}
        style={{ width: timelineWidth, height: laneHeight || undefined }}
      >
        {placements.map(({ item, row }) => (
          <InitiativeSlot
            key={item.id}
            initiative={item}
            epicId={epic.id}
            color={initiativeColor}
            showOwners={showOwners}
            dayWidth={dayWidth}
            snapDays={snapDays}
            periodStart={periodStart}
            timelineWidth={timelineWidth}
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
  showOwners,
  dayWidth,
  snapDays,
  periodStart,
  timelineWidth,
  labelWidth,
  onEpicClick,
  onInitiativeClick,
  onAddEpic,
  onAddInitiative,
  onDeleteObjective,
}: TimelineLaneProps) {
  const { setNodeRef: setLaneRef, isOver } = useDroppable({ id: `objective-lane:${objective.id}` });
  // Drag handle reorders the objective's own row among its siblings; the
  // whole lane is the draggable's node so it visually moves as a block.
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: `objective:${objective.id}`,
    data: { type: 'objective' as const, objective },
  });
  const { setNodeRef: setRowRef, isOver: isRowOver } = useDroppable({
    id: `objective-row:${objective.id}`,
    data: { type: 'objective' as const },
  });
  const setNodeRef = (node: HTMLDivElement | null) => {
    setLaneRef(node);
    setDragRef(node);
    setRowRef(node);
  };
  const color = objective.color ?? DEFAULT_LANE_COLOR;
  const initiativeCount = objective.epics.reduce((sum, e) => sum + e.initiatives.length, 0);
  const [showDescription, setShowDescription] = useState(false);

  return (
    <div
      ref={setNodeRef}
      className={`${styles.lane} ${isRowOver ? styles.laneRowOver : ''}`}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        zIndex: isDragging ? 30 : undefined,
        opacity: isDragging ? 0.85 : 1,
      }}
    >
      <div className={styles.laneLabel} style={{ width: labelWidth }}>
        <div className={styles.laneLabelRow}>
          <button
            type="button"
            className={styles.laneDragHandle}
            {...attributes}
            {...listeners}
            aria-label={`Reordenar objetivo ${objective.title}`}
          >
            <GripIcon size={14} />
          </button>
          <span className={styles.laneDot} style={{ backgroundColor: color }} />
          <span className={styles.laneTitle} title={objective.title}>
            {objective.title}
          </span>
          {objective.description && (
            <button
              type="button"
              className={styles.laneInfoButton}
              onClick={() => setShowDescription(true)}
              title="Ver descrição do objetivo"
              aria-label={`Ver descrição de ${objective.title}`}
            >
              <InfoIcon size={13} />
            </button>
          )}
          <button
            type="button"
            className={styles.laneDeleteButton}
            onClick={() => onDeleteObjective(objective)}
            title="Excluir objetivo"
            aria-label={`Excluir objetivo ${objective.title}`}
          >
            <TrashIcon size={13} />
          </button>
        </div>

        {showDescription && objective.description && (
          <Modal title={objective.title} onClose={() => setShowDescription(false)}>
            <p className={styles.descriptionText}>{objective.description}</p>
          </Modal>
        )}
        <div className={styles.laneMeta}>
          {objective.epics.length} épico{objective.epics.length === 1 ? '' : 's'} ·{' '}
          {initiativeCount} iniciativa{initiativeCount === 1 ? '' : 's'}
        </div>
        {showOwners && objective.owners && objective.owners.length > 0 && (
          <div className={styles.laneOwners}>
            {objective.owners.map((owner) => {
              const { bg, text } = ownerColor(owner);
              return (
                <span
                  key={owner}
                  className={styles.laneOwnerChip}
                  style={{ backgroundColor: bg, color: text }}
                >
                  {owner}
                </span>
              );
            })}
          </div>
        )}
        <button type="button" onClick={() => onAddEpic(objective.id)} className={styles.addEpic}>
          <PlusIcon size={12} />
          Épico
        </button>
      </div>

      <div ref={setLaneRef} className={`${styles.laneBody} ${isOver ? styles.laneBodyOver : ''}`}>
        {objective.epics.length === 0 ? (
          <p className={styles.laneEmpty}>Nenhum épico neste objetivo.</p>
        ) : (
          objective.epics.map((epic) => (
            <EpicRow
              key={epic.id}
              epic={epic}
              objectiveId={objective.id}
              color={epic.color ?? color}
              showOwners={showOwners}
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
