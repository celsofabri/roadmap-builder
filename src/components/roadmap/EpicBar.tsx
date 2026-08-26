import { useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useRoadmapStore } from '@/store/roadmapStore';
import type { Epic } from '@/types/roadmap.types';
import { addDaysISO, diffInDaysISO, rangeSpanDays } from '@/utils/dateUtils';
import { STATUS_COLORS } from '@/utils/statusOptions';

interface EpicBarProps {
  epic: Epic;
  objectiveId: string;
  color: string;
  dayWidth: number;
  snapDays: number;
  periodStart: string;
  onClick: (epic: Epic) => void;
}

export function EpicBar({
  epic,
  objectiveId,
  color,
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
  const left = diffInDaysISO(periodStart, display.startDate) * dayWidth;
  const width = Math.max(rangeSpanDays(display) * dayWidth, 12);

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
        updateEpic(epic.id, previewRef.current);
      }
      previewRef.current = null;
      setPreview(null);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  return (
    <div
      className="absolute top-1 h-8"
      style={{ left, width }}
    >
      <div
        ref={setNodeRef}
        className="group relative h-full rounded text-white shadow-sm"
        style={{
          backgroundColor: color,
          transform: transform ? CSS.Translate.toString({ ...transform, y: 0 }) : undefined,
          boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.35)' : undefined,
          zIndex: isDragging ? 20 : 1,
          opacity: isDragging ? 0.85 : 1,
        }}
      >
        <button
          type="button"
          {...listeners}
          {...attributes}
          onClick={() => onClick(epic)}
          className="flex h-full w-full cursor-grab items-center overflow-hidden px-2 text-left text-xs font-medium active:cursor-grabbing"
          title={epic.title}
        >
          <span className="truncate">{epic.title}</span>
          {epic.status && (
            <span
              className="ml-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[epic.status] }}
            />
          )}
        </button>
        <div
          onPointerDown={(e) => startResize('start', e)}
          className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize opacity-0 group-hover:opacity-100"
        >
          <div className="mx-auto h-full w-0.5 bg-white/70" />
        </div>
        <div
          onPointerDown={(e) => startResize('end', e)}
          className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize opacity-0 group-hover:opacity-100"
        >
          <div className="mx-auto h-full w-0.5 bg-white/70" />
        </div>
      </div>
    </div>
  );
}
