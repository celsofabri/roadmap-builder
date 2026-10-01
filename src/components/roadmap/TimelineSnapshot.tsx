import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Epic, Initiative, Objective, Roadmap } from '@/types/roadmap.types';
import { EpicBarView } from '@/components/roadmap/EpicBarView';
import { InitiativeBarView } from '@/components/roadmap/InitiativeBarView';
import {
  INITIATIVE_LIGHTEN,
  INITIATIVE_ROW_GAP,
  INITIATIVE_ROW_H,
} from '@/components/roadmap/layoutConstants';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useTeamMemberStore } from '@/store/teamMemberStore';
import { barTooltip } from '@/utils/barTooltip';
import { DEFAULT_LANE_COLOR, contrastTextColor, lightenColor } from '@/utils/color';
import { computeStatusCounts } from '@/utils/computeStatusCounts';
import {
  buildRulerCells,
  businessDaysBetweenISO,
  formatShortDateLabel,
  rangeSpanBusinessDays,
  todayISO,
} from '@/utils/dateUtils';
import { computeFit, computeGridOffsets, rulerLabelStride } from '@/utils/fullscreenFit';
import { ownerColor } from '@/utils/ownerAvatar';
import { packIntoRows } from '@/utils/packIntoRows';
import { useElementSize } from '@/utils/useElementSize';
import styles from './TimelineSnapshot.module.scss';

/** Minimum on-screen width a ruler label needs before neighbours must give way. */
const MIN_RULER_LABEL_PX = 44;
const MIN_EPIC_W = 14;
const MIN_INITIATIVE_W = 12;

export interface SnapshotViewport {
  width: number;
  height: number;
}

interface TimelineSnapshotProps {
  roadmap: Roadmap;
  showOwners: boolean;
  showTodayLine: boolean;
  /** Box (in real CSS px) the whole roadmap must fit in, without scrolling. */
  viewport: SnapshotViewport;
  /** Real px kept free at the header's right edge for overlay controls (not scaled). */
  reserveRight?: number;
  /** Reports the applied scale, so the overlay can warn when it drops below the legibility floor. */
  onScaleChange?: (scale: number) => void;
}

function formatUpdatedAt(iso: string): string | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : format(date, 'dd/MM/yyyy', { locale: ptBR });
}

interface LaneProps {
  objective: Objective;
  showOwners: boolean;
  periodStart: string;
  dayWidth: number;
  timelineWidth: number;
  labelWidth: number;
}

function SnapshotEpicRow({
  epic,
  color,
  showOwners,
  periodStart,
  dayWidth,
  timelineWidth,
}: Omit<LaneProps, 'objective' | 'labelWidth'> & { epic: Epic; color: string }) {
  const members = useTeamMemberStore((s) => s.members);
  const initiativeColor = useMemo(() => lightenColor(color, INITIATIVE_LIGHTEN), [color]);
  const { placements, rowCount } = useMemo(() => packIntoRows(epic.initiatives), [epic.initiatives]);
  const laneHeight =
    epic.initiatives.length > 0 ? rowCount * INITIATIVE_ROW_H + (rowCount - 1) * INITIATIVE_ROW_GAP : 0;

  return (
    <div className={styles.epicRow} data-testid="snapshot-epic">
      <div className={styles.epicBarSlot} style={{ width: timelineWidth }}>
        <div
          className={styles.epicSlot}
          style={{
            left: businessDaysBetweenISO(periodStart, epic.startDate) * dayWidth,
            width: Math.max(rangeSpanBusinessDays(epic) * dayWidth, MIN_EPIC_W),
          }}
        >
          <div className={styles.epicBar} style={{ backgroundColor: color }} title={barTooltip(epic, epic)}>
            <div className={styles.epicBody}>
              <EpicBarView epic={epic} showOwner={showOwners} members={members} />
            </div>
          </div>
        </div>
      </div>

      <div
        className={styles.initiativeLane}
        style={{ width: timelineWidth, height: laneHeight || undefined }}
      >
        {placements.map(({ item, row }) => (
          <SnapshotInitiative
            key={item.id}
            initiative={item}
            color={initiativeColor}
            showOwners={showOwners}
            periodStart={periodStart}
            dayWidth={dayWidth}
            top={row * (INITIATIVE_ROW_H + INITIATIVE_ROW_GAP)}
          />
        ))}
      </div>
    </div>
  );
}

function SnapshotInitiative({
  initiative,
  color,
  showOwners,
  periodStart,
  dayWidth,
  top,
}: {
  initiative: Initiative;
  color: string;
  showOwners: boolean;
  periodStart: string;
  dayWidth: number;
  top: number;
}) {
  const members = useTeamMemberStore((s) => s.members);
  return (
    <div
      className={styles.initiativeSlot}
      data-testid="snapshot-initiative"
      style={{
        top,
        left: businessDaysBetweenISO(periodStart, initiative.startDate) * dayWidth,
        width: Math.max(rangeSpanBusinessDays(initiative) * dayWidth, MIN_INITIATIVE_W),
      }}
    >
      <div
        className={styles.initiativeBar}
        style={{ backgroundColor: color, color: contrastTextColor(color) }}
        title={barTooltip(initiative, initiative)}
      >
        <div className={styles.initiativeBody}>
          <InitiativeBarView initiative={initiative} showOwner={showOwners} members={members} />
        </div>
      </div>
    </div>
  );
}

function SnapshotLane({ objective, showOwners, periodStart, dayWidth, timelineWidth, labelWidth }: LaneProps) {
  const color = objective.color ?? DEFAULT_LANE_COLOR;
  const initiativeCount = objective.epics.reduce((sum, e) => sum + e.initiatives.length, 0);

  return (
    <div className={styles.lane} data-testid="snapshot-lane">
      <div className={styles.laneLabel} style={{ width: labelWidth }}>
        <div className={styles.laneLabelRow}>
          <span className={styles.laneDot} style={{ backgroundColor: color }} />
          <span className={styles.laneTitle}>{objective.title}</span>
        </div>
        <div className={styles.laneMeta}>
          {objective.epics.length} épico{objective.epics.length === 1 ? '' : 's'} · {initiativeCount}{' '}
          iniciativa{initiativeCount === 1 ? '' : 's'}
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
      </div>

      <div className={styles.laneBody}>
        {objective.epics.length === 0 ? (
          <p className={styles.laneEmpty}>Nenhum épico neste objetivo.</p>
        ) : (
          objective.epics.map((epic) => (
            <SnapshotEpicRow
              key={epic.id}
              epic={epic}
              color={epic.color ?? color}
              showOwners={showOwners}
              periodStart={periodStart}
              dayWidth={dayWidth}
              timelineWidth={timelineWidth}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Read-only picture of the whole roadmap, scaled uniformly so it fits `viewport` with no
 * scrolling (see ADR-0003). Always uses the monthly ruler. It has no buttons, handles or
 * drag-and-drop: those assume unscaled pixels, so the interactive `TimelineView` stays separate.
 */
export function TimelineSnapshot({
  roadmap,
  showOwners,
  showTodayLine,
  viewport,
  reserveRight = 0,
  onScaleChange,
}: TimelineSnapshotProps) {
  const [stageRef, stageSize] = useElementSize<HTMLDivElement>();
  const [lastScale, setLastScale] = useState<number | undefined>(undefined);

  const totalDays = rangeSpanBusinessDays(roadmap.period);
  const fit = computeFit({
    viewportW: viewport.width,
    viewportH: viewport.height,
    naturalH: stageSize.height,
    totalDays,
    previousScale: lastScale,
  });
  const { scale, logicalW, labelWidth, dayWidth } = fit;

  // Remember the applied scale for hysteresis (state derived during render, converges in 1 pass).
  if (lastScale !== scale) setLastScale(scale);

  useEffect(() => {
    onScaleChange?.(scale);
  }, [scale, onScaleChange]);

  const measured = stageSize.height > 0 && viewport.width > 0 && viewport.height > 0;
  const timelineWidth = totalDays * dayWidth;

  const rulerCells = useMemo(() => buildRulerCells(roadmap.period, 'monthly'), [roadmap.period]);
  const cellDays = useMemo(() => rulerCells.map((cell) => rangeSpanBusinessDays(cell)), [rulerCells]);
  const gridOffsets = computeGridOffsets(cellDays, dayWidth);
  const stride = rulerLabelStride(
    cellDays.map((days) => days * dayWidth * scale),
    MIN_RULER_LABEL_PX,
  );

  const statusCounts = useMemo(() => computeStatusCounts(roadmap), [roadmap]);
  const today = todayISO();
  const todayInPeriod = today >= roadmap.period.startDate && today <= roadmap.period.endDate;
  const todayLeft = labelWidth + businessDaysBetweenISO(roadmap.period.startDate, today) * dayWidth;
  const updatedAt = formatUpdatedAt(roadmap.updatedAt);

  return (
    <div
      className={styles.frame}
      data-testid="timeline-snapshot"
      data-fit-scale={scale.toFixed(3)}
      data-measured={measured}
      style={
        measured
          ? { width: logicalW * scale, height: stageSize.height * scale }
          : undefined
      }
    >
      <div
        ref={stageRef}
        className={`${styles.stage} ${measured ? '' : styles.stageUnmeasured}`}
        style={{ width: logicalW, transform: `scale(${scale})` }}
      >
        <header className={styles.header} style={{ paddingRight: 16 + reserveRight / scale }}>
          <h2 className={styles.title}>{roadmap.name}</h2>
          <span className={styles.period}>
            {formatShortDateLabel(roadmap.period.startDate)} –{' '}
            {formatShortDateLabel(roadmap.period.endDate)}
          </span>
          {updatedAt && <span className={styles.updated}>Atualizado em {updatedAt}</span>}
          <div className={styles.legend}>
            {statusCounts.map(({ status, count }) => (
              <StatusBadge key={status} status={status} count={count} />
            ))}
          </div>
        </header>

        <div className={styles.grid}>
          <div className={styles.rulerRow}>
            <div className={styles.rulerGutter} style={{ width: labelWidth }}>
              Objetivo
            </div>
            <div className={styles.rulerCells}>
              {rulerCells.map((cell, index) => (
                <div
                  key={cell.startDate}
                  style={{ width: cellDays[index] * dayWidth }}
                  className={`${styles.rulerCell} ${index % 2 === 1 ? styles.rulerCellAlt : ''}`}
                  title={cell.label}
                >
                  {index % stride === 0 ? cell.label : ''}
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
            {roadmap.objectives.map((objective) => (
              <SnapshotLane
                key={objective.id}
                objective={objective}
                showOwners={showOwners}
                periodStart={roadmap.period.startDate}
                dayWidth={dayWidth}
                timelineWidth={timelineWidth}
                labelWidth={labelWidth}
              />
            ))}
          </div>

          {showTodayLine && todayInPeriod && (
            <div
              className={styles.todayLine}
              data-testid="snapshot-today-line"
              style={{ left: todayLeft }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
