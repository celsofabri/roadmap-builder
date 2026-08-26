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

export const STATUS_COLORS: Record<Status, string> = {
  planned: '#94a3b8',
  in_progress: '#2563eb',
  done: '#16a34a',
  blocked: '#dc2626',
};
