import { useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useRoadmapStore } from '@/store/roadmapStore';
import type { Initiative } from '@/types/roadmap.types';
import { addDaysISO, diffInDaysISO, rangeSpanDays } from '@/utils/dateUtils';
import { STATUS_COLORS } from '@/utils/statusOptions';

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
  const width = Math.max(rangeSpanDays(display) * dayWidth, 10);

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
    <div className="absolute top-0.5 h-5" style={{ left, width }}>
      <div
        ref={setNodeRef}
        className="group relative h-full rounded-sm text-white"
        style={{
          backgroundColor: color,
          transform: transform ? CSS.Translate.toString({ ...transform, y: 0 }) : undefined,
          boxShadow: isDragging ? '0 3px 8px rgba(0,0,0,0.3)' : undefined,
          zIndex: isDragging ? 20 : 1,
          opacity: isDragging ? 0.85 : 0.9,
        }}
      >
        <button
          type="button"
          {...listeners}
          {...attributes}
          onClick={() => onClick(initiative)}
          className="flex h-full w-full cursor-grab items-center overflow-hidden px-1.5 text-left text-[10px] font-medium active:cursor-grabbing"
          title={initiative.title}
        >
          <span className="truncate">{initiative.title}</span>
          {initiative.status && (
            <span
              className="ml-1 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[initiative.status] }}
            />
          )}
        </button>
        <div
          onPointerDown={(e) => startResize('start', e)}
          className="absolute inset-y-0 left-0 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100"
        >
          <div className="mx-auto h-full w-px bg-white/70" />
        </div>
        <div
          onPointerDown={(e) => startResize('end', e)}
          className="absolute inset-y-0 right-0 w-1 cursor-ew-resize opacity-0 group-hover:opacity-100"
        >
          <div className="mx-auto h-full w-px bg-white/70" />
        </div>
      </div>
    </div>
  );
}
