import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { roadmapMetaInputSchema } from '@/schemas/roadmap.schema';
import type { Period } from '@/types/roadmap.types';
import { monthEndISO, monthStartISO } from '@/utils/dateUtils';
import type { RoadmapMetaInput } from '@/store/roadmapStore';

interface RoadmapFormProps {
  initial?: { name: string; description?: string; period: Period };
  onSubmit: (input: RoadmapMetaInput) => void;
  onClose: () => void;
}

export function RoadmapForm({ initial, onSubmit, onClose }: RoadmapFormProps) {
  const today = new Date();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [period, setPeriod] = useState<Period>(
    initial?.period ?? {
      startDate: monthStartISO(today),
      endDate: monthEndISO(today),
    },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = roadmapMetaInputSchema.safeParse({
      name,
      description: description || undefined,
      period,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path.join('.') || 'form'] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit(result.data);
  }

  return (
    <Modal title={initial ? 'Editar roadmap' : 'Novo roadmap'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm text-slate-600">
          Nome do time / roadmap
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
            placeholder="Ex: Plataforma"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
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
          <p className="mb-1 text-sm text-slate-600">Período (mês/ano, livre)</p>
          <DateRangePicker
            mode="month"
            startDate={period.startDate}
            endDate={period.endDate}
            onChange={(range) => setPeriod(range)}
            error={errors['period.endDate'] ?? errors.period}
          />
        </div>

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
