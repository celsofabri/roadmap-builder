import { useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useRoadmapStore } from '@/store/roadmapStore';
import type { Initiative } from '@/types/roadmap.types';
import { addDaysISO, diffInDaysISO, formatShortDateLabel, rangeSpanDays } from '@/utils/dateUtils';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/statusOptions';
import styles from './InitiativeBar.module.scss';

interface InitiativeBarProps {
  initiative: Initiative;
  epicId: string;
  color: string;
  dayWidth: number;
  snapDays: number;
  periodStart: string;
  onClick: (initiative: Initiative) => void;
}

export function InitiativeBar({
  initiative,
  epicId,
  color,
  dayWidth,
  snapDays,
  periodStart,
  onClick,
}: InitiativeBarProps) {
  const updateInitiative = useRoadmapStore((s) => s.updateInitiative);
  const [preview, setPreview] = useState<{ startDate: string; endDate: string } | null>(null);
  const previewRef = useRef<{ startDate: string; endDate: string } | null>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `initiative:${initiative.id}`,
    data: { type: 'initiative' as const, epicId, initiative },
  });

  const display = preview ?? initiative;
  const left = diffInDaysISO(periodStart, display.startDate) * dayWidth;
  const width = Math.max(rangeSpanDays(display) * dayWidth, 12);
  const tooltip = [
    initiative.title,
    `${formatShortDateLabel(display.startDate)} – ${formatShortDateLabel(display.endDate)}`,
    initiative.status ? STATUS_LABELS[initiative.status] : null,
  ]
    .filter(Boolean)
    .join('\n');

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
        const newStart = addDaysISO(initialStart, deltaDays);
        next = { startDate: newStart > initialEnd ? initialEnd : newStart, endDate: initialEnd };
      } else {
        const newEnd = addDaysISO(initialEnd, deltaDays);
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
    <div className={styles.slot} style={{ left, width }}>
      <div
        ref={setNodeRef}
        className={styles.bar}
        style={{
          backgroundColor: color,
          transform: transform ? CSS.Translate.toString({ ...transform, y: 0 }) : undefined,
          boxShadow: isDragging ? '0 4px 10px rgba(20, 25, 43, 0.3)' : undefined,
          zIndex: isDragging ? 20 : 1,
          opacity: isDragging ? 0.9 : 0.82,
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
          <span className={styles.label}>{initiative.title}</span>
          {initiative.status && (
            <span
              className={styles.statusDot}
              style={{ backgroundColor: STATUS_COLORS[initiative.status] }}
            />
          )}
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
