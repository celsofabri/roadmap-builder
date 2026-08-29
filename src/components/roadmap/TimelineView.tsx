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
import { useElementWidth } from '@/utils/useElementWidth';
import { STATUS_COLORS, STATUS_LABELS, STATUS_OPTIONS } from '@/utils/statusOptions';
import { PlusIcon } from '@/components/shared/Icon';
import sharedStyles from '@/styles/shared.module.scss';
import styles from './TimelineView.module.scss';

interface TimelineViewProps {
  roadmap: Roadmap;
  onEditEpic: (objectiveId: string, epic: Epic) => void;
  onAddEpic: (objectiveId: string) => void;
  onAddObjective: () => void;
  onEditInitiative: (epic: Epic, initiative: Initiative) => void;
}

type DragData =
  | { type: 'epic'; objectiveId: string; epic: Epic }
  | { type: 'initiative'; epicId: string; initiative: Initiative };

const OBJECTIVE_LANE_PREFIX = 'objective-lane:';
const EPIC_LANE_PREFIX = 'epic-lane:';

/** Minimum pixels per day, per granularity — the grid grows beyond this to fill the viewport. */
const MIN_DAY_WIDTH: Record<Granularity, number> = { monthly: 5, weekly: 14 };

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
  onAddObjective,
  onEditInitiative,
}: TimelineViewProps) {
  const [granularity, setGranularity] = useState<Granularity>('monthly');
  const moveEpic = useRoadmapStore((s) => s.moveEpic);
  const updateEpic = useRoadmapStore((s) => s.updateEpic);
  const moveInitiative = useRoadmapStore((s) => s.moveInitiative);
  const updateInitiative = useRoadmapStore((s) => s.updateInitiative);

  const [scrollRef, containerWidth] = useElementWidth<HTMLDivElement>();

  const totalDays = rangeSpanDays(roadmap.period);
  const labelWidth = containerWidth > 0 && containerWidth < 768 ? 150 : 220;

  // Stretch the grid to fill the container, but never below the readable minimum.
  const available = Math.max(containerWidth - labelWidth, 0);
  const dayWidth = Math.max(MIN_DAY_WIDTH[granularity], available / Math.max(totalDays, 1));

  const snapDays = snapUnitDays(granularity);
  const timelineWidth = totalDays * dayWidth;
  const rulerCells = useMemo(
    () => buildRulerCells(roadmap.period, granularity),
    [roadmap.period, granularity],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

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

  // Cumulative x offsets for the vertical grid lines, one per ruler cell boundary.
  const gridOffsets = useMemo(() => {
    const offsets: number[] = [];
    let x = 0;
    for (const cell of rulerCells) {
      x += rangeSpanDays(cell) * dayWidth;
      offsets.push(x);
    }
    return offsets.slice(0, -1);
  }, [rulerCells, dayWidth]);

  const usedStatuses = useMemo(() => {
    const set = new Set<string>();
    for (const objective of roadmap.objectives) {
      for (const epic of objective.epics) {
        if (epic.status) set.add(epic.status);
        for (const initiative of epic.initiatives) {
          if (initiative.status) set.add(initiative.status);
        }
      }
    }
    return STATUS_OPTIONS.filter((o) => set.has(o.value)).map((o) => o.value);
  }, [roadmap.objectives]);

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
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.legend}>
          {usedStatuses.length > 0 ? (
            usedStatuses.map((status) => (
              <span key={status} className={styles.legendItem}>
                <span
                  className={styles.legendDot}
                  style={{ backgroundColor: STATUS_COLORS[status] }}
                />
                {STATUS_LABELS[status]}
              </span>
            ))
          ) : (
            <span className={styles.toolbarLeft}>Arraste as barras para ajustar datas</span>
          )}
        </div>

        <div className={styles.segmented} role="group" aria-label="Granularidade da timeline">
          <button
            type="button"
            onClick={() => setGranularity('monthly')}
            aria-pressed={granularity === 'monthly'}
            className={`${styles.segment} ${granularity === 'monthly' ? styles.segmentActive : ''}`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setGranularity('weekly')}
            aria-pressed={granularity === 'weekly'}
            className={`${styles.segment} ${granularity === 'weekly' ? styles.segmentActive : ''}`}
          >
            Semanal
          </button>
        </div>
      </div>

      {roadmap.objectives.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Timeline vazia</p>
          <p className={styles.emptyText}>
            Adicione um objetivo para criar a primeira raia da timeline.
          </p>
          <button type="button" className={sharedStyles.btnPrimary} onClick={onAddObjective}>
            <PlusIcon size={15} />
            Adicionar objetivo
          </button>
        </div>
      ) : (
        <>
          <div className={styles.scrollArea} ref={scrollRef}>
            <div className={styles.grid} style={{ width: labelWidth + timelineWidth }}>
              <div className={styles.rulerRow}>
                <div className={styles.rulerGutter} style={{ width: labelWidth }}>
                  Objetivo
                </div>
                <div className={styles.rulerCells}>
                  {rulerCells.map((cell, index) => (
                    <div
                      key={cell.startDate}
                      style={{ width: rangeSpanDays(cell) * dayWidth }}
                      className={`${styles.rulerCell} ${index % 2 === 1 ? styles.rulerCellAlt : ''}`}
                      title={cell.label}
                    >
                      {cell.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.lanes}>
                <div className={styles.gridLines} style={{ left: labelWidth }}>
                  {gridOffsets.map((offset) => (
                    <span key={offset} className={styles.gridLine} style={{ left: offset }} />
                  ))}
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
                      labelWidth={labelWidth}
                      onEpicClick={(epic) => onEditEpic(objective.id, epic)}
                      onInitiativeClick={onEditInitiative}
                      onAddEpic={onAddEpic}
                    />
                  ))}
                </DndContext>
              </div>
            </div>
          </div>

          <p className={styles.hint}>
            Arraste uma barra para mover as datas, puxe pelas bordas para redimensionar, ou solte em
            outra raia para reatribuir.
          </p>
        </>
      )}
    </div>
  );
}
