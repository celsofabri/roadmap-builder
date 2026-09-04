import { useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useRoadmapStore } from '@/store/roadmapStore';
import type { Epic } from '@/types/roadmap.types';
import {
  addBusinessDaysISO,
  businessDaysBetweenISO,
  formatShortDateLabel,
  rangeSpanBusinessDays,
} from '@/utils/dateUtils';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/statusOptions';
import { OwnerAvatar } from '@/components/shared/OwnerAvatar';
import styles from './EpicBar.module.scss';

interface EpicBarProps {
  epic: Epic;
  objectiveId: string;
  color: string;
  showOwner: boolean;
  dayWidth: number;
  snapDays: number;
  periodStart: string;
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
  onClick,
}: EpicBarProps) {
  const updateEpic = useRoadmapStore((s) => s.updateEpic);
  const [preview, setPreview] = useState<{ startDate: string; endDate: string } | null>(null);
  const previewRef = useRef<{ startDate: string; endDate: string } | null>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `epic:${epic.id}`,
    data: { type: 'epic' as const, objectiveId, epic },
  });

  const display = preview ?? epic;
  const left = businessDaysBetweenISO(periodStart, display.startDate) * dayWidth;
  const width = Math.max(rangeSpanBusinessDays(display) * dayWidth, 14);
  const tooltip = [
    epic.title,
    `${formatShortDateLabel(display.startDate)} – ${formatShortDateLabel(display.endDate)}`,
    epic.status ? STATUS_LABELS[epic.status] : null,
    epic.owner ? `Responsável: ${epic.owner}` : null,
  ]
    .filter(Boolean)
    .join('\n');

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
        className={styles.bar}
        style={{
          backgroundColor: color,
          transform: transform ? CSS.Translate.toString({ ...transform, y: 0 }) : undefined,
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
          {showOwner && epic.owner && (
            <OwnerAvatar name={epic.owner} size={16} className={styles.ownerAvatar} />
          )}
          <span className={styles.label}>{epic.title}</span>
          {epic.status && (
            <span
              className={styles.statusDot}
              style={{ backgroundColor: STATUS_COLORS[epic.status] }}
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
