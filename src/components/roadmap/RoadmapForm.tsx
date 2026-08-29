import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { roadmapMetaInputSchema } from '@/schemas/roadmap.schema';
import type { Period } from '@/types/roadmap.types';
import { monthEndISO, monthStartISO } from '@/utils/dateUtils';
import type { RoadmapMetaInput } from '@/store/roadmapStore';
import styles from '@/styles/shared.module.scss';

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
      <form onSubmit={handleSubmit} className={styles.formStack}>
        <label className={styles.formGroup}>
          Nome do time / roadmap
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            placeholder="Ex: Plataforma"
          />
          {errors.name && <p className={styles.error}>{errors.name}</p>}
        </label>

        <label className={styles.formGroup}>
          Descrição (opcional)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={styles.input}
          />
        </label>

        <div>
          <p className={styles.formGroup}>Período (mês/ano, livre)</p>
          <DateRangePicker
            mode="month"
            startDate={period.startDate}
            endDate={period.endDate}
            onChange={(range) => setPeriod(range)}
            error={errors['period.endDate'] ?? errors.period}
          />
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={onClose} className={styles.btnGhost}>
            Cancelar
          </button>
          <button type="submit" className={styles.btnPrimary}>
            Salvar
          </button>
        </div>
      </form>
    </Modal>
  );
}
