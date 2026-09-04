import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { epicInputSchema } from '@/schemas/roadmap.schema';
import type { EpicInput } from '@/store/roadmapStore';
import type { DateRange } from '@/utils/dateUtils';
import { formatShortDateLabel, isRangeWithin } from '@/utils/dateUtils';
import { STATUS_OPTIONS } from '@/utils/statusOptions';
import type { Status } from '@/types/roadmap.types';
import { AlertIcon } from '@/components/shared/Icon';
import styles from '@/styles/shared.module.scss';

interface EpicFormProps {
  initial?: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    status?: Status;
    owner?: string;
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
  const [owner, setOwner] = useState(initial?.owner ?? '');
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
      owner: owner.trim() || undefined,
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
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="epic-title">
            Título
          </label>
          <input
            id="epic-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
            placeholder="Ex: Novo fluxo de cadastro"
          />
          {errors.title && <p className={styles.error}>{errors.title}</p>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="epic-description">
            Descrição <span className={styles.hint}>(opcional)</span>
          </label>
          <textarea
            id="epic-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Período do épico</span>
          <DateRangePicker
            mode="day"
            startDate={range.startDate}
            endDate={range.endDate}
            onChange={setRange}
            error={errors['endDate'] ?? errors.startDate}
          />
          {outOfRange && (
            <p className={styles.warning}>
              <AlertIcon size={14} />
              Fora do período do roadmap ({formatShortDateLabel(parentRange.startDate)} –{' '}
              {formatShortDateLabel(parentRange.endDate)}). Você pode salvar mesmo assim.
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="epic-status">
            Status
          </label>
          <select
            id="epic-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className={styles.select}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="epic-owner">
            Responsável <span className={styles.hint}>(opcional)</span>
          </label>
          <input
            id="epic-owner"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className={styles.input}
            placeholder="Nome de quem está à frente"
          />
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={onClose} className={styles.btnSecondary}>
            Cancelar
          </button>
          <button type="submit" className={styles.btnPrimary}>
            {initial ? 'Salvar alterações' : 'Criar épico'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
