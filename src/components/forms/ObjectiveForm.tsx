import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { objectiveInputSchema } from '@/schemas/roadmap.schema';
import type { ObjectiveInput } from '@/store/roadmapStore';

const DEFAULT_COLOR = '#2563eb';

interface ObjectiveFormProps {
  initial?: { title: string; description?: string; color?: string };
  onSubmit: (input: ObjectiveInput) => void;
  onClose: () => void;
}

export function ObjectiveForm({ initial, onSubmit, onClose }: ObjectiveFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = objectiveInputSchema.safeParse({
      title,
      description: description || undefined,
      color,
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
    <Modal title={initial ? 'Editar objetivo' : 'Novo objetivo'} onClose={onClose}>
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

        <label className="flex items-center gap-3 text-sm text-slate-600">
          Cor
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-8 w-14 cursor-pointer rounded border border-slate-300"
          />
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
