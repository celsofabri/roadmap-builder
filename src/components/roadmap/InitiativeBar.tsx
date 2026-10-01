import { useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useRoadmapStore } from '@/store/roadmapStore';
import type { Initiative } from '@/types/roadmap.types';
import {
  addBusinessDaysISO,
  businessDaysBetweenISO,
  rangeSpanBusinessDays,
} from '@/utils/dateUtils';
import { InitiativeBarView } from '@/components/roadmap/InitiativeBarView';
import { contrastTextColor } from '@/utils/color';
import { useTeamMemberStore } from '@/store/teamMemberStore';
import { barTooltip } from '@/utils/barTooltip';
import styles from './InitiativeBar.module.scss';

interface InitiativeBarProps {
  initiative: Initiative;
  epicId: string;
  color: string;
  showOwner: boolean;
  dayWidth: number;
  snapDays: number;
  periodStart: string;
  /** Vertical offset in px, assigned by the lane's overlap packing. */
  top: number;
  /** Highlighted while another initiative is dragged over this one's row, as a reorder target. */
  isRowOver?: boolean;
  onClick: (initiative: Initiative) => void;
}

export function InitiativeBar({
  initiative,
  epicId,
  color,
  showOwner,
  dayWidth,
  snapDays,
  periodStart,
  top,
  isRowOver,
  onClick,
}: InitiativeBarProps) {
  const updateInitiative = useRoadmapStore((s) => s.updateInitiative);
  const members = useTeamMemberStore((s) => s.members);
  const [preview, setPreview] = useState<{ startDate: string; endDate: string } | null>(null);
  const previewRef = useRef<{ startDate: string; endDate: string } | null>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `initiative:${initiative.id}`,
    data: { type: 'initiative' as const, epicId, initiative },
  });

  const display = preview ?? initiative;
  const left = businessDaysBetweenISO(periodStart, display.startDate) * dayWidth;
  const width = Math.max(rangeSpanBusinessDays(display) * dayWidth, 12);
  // Initiative bars use a lightened tint of the epic's color, which can turn
  // pale enough that white text stops being legible — pick dark text then.
  const textColor = contrastTextColor(color);
  const tooltip = barTooltip(initiative, display);

  function startResize(edge: 'start' | 'end', e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const initialStart = initiative.startDate;
    const initialEnd = initiative.endDate;

    function onMove(ev: PointerEvent) {
      const deltaPx = ev.clientX - startX;
      const deltaDays = Math.round(deltaPx / dayWidth / snapDays) * snapDays;
      let next: { startDate: string; endDate: string };
      if (edge === 'start') {
        const newStart = addBusinessDaysISO(initialStart, deltaDays);
        next = { startDate: newStart > initialEnd ? initialEnd : newStart, endDate: initialEnd };
      } else {
        const newEnd = addBusinessDaysISO(initialEnd, deltaDays);
        next = { startDate: initialStart, endDate: newEnd < initialStart ? initialStart : newEnd };
      }
      previewRef.current = next;
      setPreview(next);
    }

    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (previewRef.current) {
        updateInitiative(initiative.id, previewRef.current);
      }
      previewRef.current = null;
      setPreview(null);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  return (
    <div className={styles.slot} style={{ left, width, top }}>
      <div
        ref={setNodeRef}
        className={`${styles.bar} ${isRowOver ? styles.barOver : ''}`}
        style={{
          backgroundColor: color,
          color: textColor,
          transform: transform ? CSS.Translate.toString(transform) : undefined,
          boxShadow: isDragging ? '0 4px 10px rgba(20, 25, 43, 0.3)' : undefined,
          zIndex: isDragging ? 20 : 1,
          opacity: isDragging ? 0.95 : 1,
        }}
      >
        <button
          type="button"
          {...listeners}
          {...attributes}
          onClick={() => onClick(initiative)}
          className={styles.body}
          title={tooltip}
        >
          <InitiativeBarView initiative={initiative} showOwner={showOwner} members={members} />
        </button>
        <div
          onPointerDown={(e) => startResize('start', e)}
          className={`${styles.resizeHandle} ${styles.resizeHandleStart}`}
        >
          <div className={styles.resizeGrip} />
        </div>
        <div
          onPointerDown={(e) => startResize('end', e)}
          className={`${styles.resizeHandle} ${styles.resizeHandleEnd}`}
        >
          <div className={styles.resizeGrip} />
        </div>
      </div>
    </div>
  );
}
