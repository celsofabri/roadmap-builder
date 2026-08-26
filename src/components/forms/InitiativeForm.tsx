import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { initiativeInputSchema } from '@/schemas/roadmap.schema';
import type { InitiativeInput } from '@/store/roadmapStore';
import type { DateRange } from '@/utils/dateUtils';
import { isRangeWithin } from '@/utils/dateUtils';
import { STATUS_OPTIONS } from '@/utils/statusOptions';
import type { Status } from '@/types/roadmap.types';

interface InitiativeFormProps {
  initial?: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    status?: Status;
  };
  /** Parent epic's date range, used to show a non-blocking out-of-range warning. */
  parentRange: DateRange;
  onSubmit: (input: InitiativeInput) => void;
  onClose: () => void;
}

export function InitiativeForm({ initial, parentRange, onSubmit, onClose }: InitiativeFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [range, setRange] = useState<DateRange>({
    startDate: initial?.startDate ?? parentRange.startDate,
    endDate: initial?.endDate ?? parentRange.endDate,
  });
  const [status, setStatus] = useState<Status | ''>(initial?.status ?? 'planned');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const outOfRange = !isRangeWithin(range, parentRange);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = initiativeInputSchema.safeParse({
      title,
      description: description || undefined,
      startDate: range.startDate,
      endDate: range.endDate,
      status: status || undefined,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path.join('.') || 'form'] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    onSubmit(result.data);
  }

  return (
    <Modal title={initial ? 'Editar iniciativa' : 'Nova iniciativa'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm text-slate-600">
          Título
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </label>

        <label className="block text-sm text-slate-600">
          Descrição (opcional)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
          />
        </label>

        <div>
          <p className="mb-1 text-sm text-slate-600">Período da iniciativa</p>
          <DateRangePicker
            mode="day"
            startDate={range.startDate}
            endDate={range.endDate}
            onChange={setRange}
            error={errors['endDate'] ?? errors.startDate}
          />
          {outOfRange && (
            <p className="mt-1 text-sm text-amber-600">
              ⚠ Fora do período do épico ({parentRange.startDate} a {parentRange.endDate}).
            </p>
          )}
        </div>

        <label className="block text-sm text-slate-600">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  );
}
