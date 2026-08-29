import type { Status } from '@/types/roadmap.types';

export const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'planned', label: 'Planejado' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'done', label: 'Concluído' },
  { value: 'blocked', label: 'Bloqueado' },
];

export const STATUS_LABELS: Record<Status, string> = {
  planned: 'Planejado',
  in_progress: 'Em andamento',
  done: 'Concluído',
  blocked: 'Bloqueado',
};

/** Solid accent color — used for dots and timeline markers. */
export const STATUS_COLORS: Record<Status, string> = {
  planned: '#8b93a7',
  in_progress: '#5b5bd6',
  done: '#0f9463',
  blocked: '#dc2b47',
};

/** Tinted background + readable foreground, for pill badges. */
export const STATUS_TINTS: Record<Status, { bg: string; fg: string }> = {
  planned: { bg: '#eef1f6', fg: '#5b6479' },
  in_progress: { bg: '#eeeefc', fg: '#4a4ac4' },
  done: { bg: '#e7f6ef', fg: '#0b7a51' },
  blocked: { bg: '#fdeef1', fg: '#b81f38' },
};
