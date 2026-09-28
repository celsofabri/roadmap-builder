import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { DateRangePicker } from '@/components/shared/DateRangePicker';
import { initiativeInputSchema } from '@/schemas/roadmap.schema';
import type { InitiativeInput } from '@/store/roadmapStore';
import type { DateRange } from '@/utils/dateUtils';
import { formatShortDateLabel, isRangeWithin } from '@/utils/dateUtils';
import { STATUS_OPTIONS } from '@/utils/statusOptions';
import type { Status } from '@/types/roadmap.types';
import { AlertIcon } from '@/components/shared/Icon';
import { OwnerCombobox } from '@/components/shared/OwnerCombobox';
import styles from '@/styles/shared.module.scss';

interface InitiativeFormProps {
  initial?: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    status?: Status;
    owner?: string;
  };
  /** Parent epic's date range, used to show a non-blocking out-of-range warning. */
  parentRange: DateRange;
  onSubmit: (input: InitiativeInput) => void;
  onClose: () => void;
  /** Only offered in edit mode — shows a delete button in the form. */
  onDelete?: () => void;
}

export function InitiativeForm({
  initial,
  parentRange,
  onSubmit,
  onClose,
  onDelete,
}: InitiativeFormProps) {
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
    const result = initiativeInputSchema.safeParse({
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
    <Modal title={initial ? 'Editar iniciativa' : 'Nova iniciativa'} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="initiative-title">
            Título
          </label>
          <input
            id="initiative-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
            placeholder="Ex: Integrar provedor de e-mail"
          />
          {errors.title && <p className={styles.error}>{errors.title}</p>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="initiative-description">
            Descrição <span className={styles.hint}>(opcional)</span>
          </label>
          <textarea
            id="initiative-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Período da iniciativa</span>
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
              Fora do período do épico ({formatShortDateLabel(parentRange.startDate)} –{' '}
              {formatShortDateLabel(parentRange.endDate)}). Você pode salvar mesmo assim.
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="initiative-status">
            Status
          </label>
          <select
            id="initiative-status"
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
          <label className={styles.label} htmlFor="initiative-owner">
            Responsável <span className={styles.hint}>(opcional)</span>
          </label>
          <OwnerCombobox
            id="initiative-owner"
            value={owner}
            onChange={setOwner}
            placeholder="Nome de quem está à frente"
          />
        </div>

        <div className={`${styles.formActions} ${onDelete ? styles.formActionsSpread : ''}`}>
          {onDelete && (
            <button type="button" onClick={onDelete} className={styles.btnDanger}>
              Excluir iniciativa
            </button>
          )}
          <div className={styles.formActionsGroup}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary}>
              {initial ? 'Salvar alterações' : 'Criar iniciativa'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
