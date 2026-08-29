import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { epicInputSchema } from '@/schemas/roadmap.schema';
import type { EpicInput } from '@/store/roadmapStore';
import type { DateRange } from '@/utils/dateUtils';
import { isRangeWithin } from '@/utils/dateUtils';
import { STATUS_OPTIONS } from '@/utils/statusOptions';
import type { Status } from '@/types/roadmap.types';
import styles from '@/styles/shared.module.scss';

interface EpicFormProps {
  initial?: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    status?: Status;
  };
  /** Roadmap period, used to show a non-blocking out-of-range warning. */
  parentRange: DateRange;
  onSubmit: (input: EpicInput) => void;
  onClose: () => void;
}

export function EpicForm({ initial, parentRange, onSubmit, onClose }: EpicFormProps) {
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
    const result = epicInputSchema.safeParse({
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
    <Modal title={initial ? 'Editar épico' : 'Novo épico'} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.formStack}>
        <label className={styles.formGroup}>
          Título
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
          />
          {errors.title && <p className={styles.error}>{errors.title}</p>}
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
          <p className={styles.formGroup}>Período do épico</p>
          <DateRangePicker
            mode="day"
            startDate={range.startDate}
            endDate={range.endDate}
            onChange={setRange}
            error={errors['endDate'] ?? errors.startDate}
          />
          {outOfRange && (
            <p className={styles.warning}>
              ⚠ Fora do período do roadmap ({parentRange.startDate} a {parentRange.endDate}).
            </p>
          )}
        </div>

        <label className={styles.formGroup}>
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className={styles.input}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

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
