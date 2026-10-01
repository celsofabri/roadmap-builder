import { useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useRoadmapStore } from '@/store/roadmapStore';
import type { Epic } from '@/types/roadmap.types';
import {
  addBusinessDaysISO,
  businessDaysBetweenISO,
  rangeSpanBusinessDays,
} from '@/utils/dateUtils';
import { EpicBarView } from '@/components/roadmap/EpicBarView';
import { useTeamMemberStore } from '@/store/teamMemberStore';
import { barTooltip } from '@/utils/barTooltip';
import styles from './EpicBar.module.scss';

interface EpicBarProps {
  epic: Epic;
  objectiveId: string;
  color: string;
  showOwner: boolean;
  dayWidth: number;
  snapDays: number;
  periodStart: string;
  /** Highlighted while another epic is dragged over this one's row, as a reorder target. */
  isRowOver?: boolean;
  onClick: (epic: Epic) => void;
}

export function EpicBar({
  epic,
  objectiveId,
  color,
  showOwner,
  dayWidth,
  snapDays,
  periodStart,
  isRowOver,
  onClick,
}: EpicBarProps) {
  const updateEpic = useRoadmapStore((s) => s.updateEpic);
  const members = useTeamMemberStore((s) => s.members);
  const [preview, setPreview] = useState<{ startDate: string; endDate: string } | null>(null);
  const previewRef = useRef<{ startDate: string; endDate: string } | null>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `epic:${epic.id}`,
    data: { type: 'epic' as const, objectiveId, epic },
  });

  const display = preview ?? epic;
  const left = businessDaysBetweenISO(periodStart, display.startDate) * dayWidth;
  const width = Math.max(rangeSpanBusinessDays(display) * dayWidth, 14);
  const tooltip = barTooltip(epic, display);

  function startResize(edge: 'start' | 'end', e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const initialStart = epic.startDate;
    const initialEnd = epic.endDate;

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
        updateEpic(epic.id, previewRef.current);
      }
      previewRef.current = null;
      setPreview(null);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  return (
    <div className={styles.slot} style={{ left, width }}>
      <div
        ref={setNodeRef}
        className={`${styles.bar} ${isRowOver ? styles.barOver : ''}`}
        style={{
          backgroundColor: color,
          transform: transform ? CSS.Translate.toString(transform) : undefined,
          boxShadow: isDragging ? '0 6px 16px rgba(20, 25, 43, 0.35)' : undefined,
          zIndex: isDragging ? 20 : 1,
          opacity: isDragging ? 0.9 : 1,
        }}
      >
        <button
          type="button"
          {...listeners}
          {...attributes}
          onClick={() => onClick(epic)}
          className={styles.body}
          title={tooltip}
        >
          <EpicBarView epic={epic} showOwner={showOwner} members={members} />
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
