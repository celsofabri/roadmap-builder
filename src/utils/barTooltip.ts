import { formatShortDateLabel } from '@/utils/dateUtils';
import { STATUS_LABELS } from '@/utils/statusOptions';
import { ownersTooltipLine } from '@/utils/owners';
import type { Status } from '@/types/roadmap.types';

interface TooltipItem {
  title: string;
  status?: Status;
  owners?: string[];
}

/** Multi-line `title` text for an epic/initiative bar. `range` may be a live drag/resize preview. */
export function barTooltip(
  item: TooltipItem,
  range: { startDate: string; endDate: string },
): string {
  return [
    item.title,
    `${formatShortDateLabel(range.startDate)} – ${formatShortDateLabel(range.endDate)}`,
    item.status ? STATUS_LABELS[item.status] : null,
    ownersTooltipLine(item.owners) || null,
  ]
    .filter(Boolean)
    .join('\n');
}
