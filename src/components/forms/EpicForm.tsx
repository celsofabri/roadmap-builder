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
import { OwnerCombobox } from '@/components/shared/OwnerCombobox';
import { PRESET_COLORS } from '@/utils/color';
import styles from '@/styles/shared.module.scss';

interface EpicFormProps {
  initial?: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    status?: Status;
    owner?: string;
    color?: string;
  };
  /** Roadmap period, used to show a non-blocking out-of-range warning. */
  parentRange: DateRange;
  /** The objective's own lane color — used as the default when no color is set. */
  objectiveColor: string;
  onSubmit: (input: EpicInput) => void;
  onClose: () => void;
  /** Only offered in edit mode — shows a delete button in the form. */
  onDelete?: () => void;
}

export function EpicForm({
  initial,
  parentRange,
  objectiveColor,
  onSubmit,
  onClose,
  onDelete,
}: EpicFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [range, setRange] = useState<DateRange>({
    startDate: initial?.startDate ?? parentRange.startDate,
    endDate: initial?.endDate ?? parentRange.endDate,
  });
  const [status, setStatus] = useState<Status | ''>(initial?.status ?? 'planned');
  const [owner, setOwner] = useState(initial?.owner ?? '');
  // undefined means "inherit the objective's color" — only set when the user picks their own.
  const [color, setColor] = useState<string | undefined>(initial?.color);
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
          <span className={styles.label}>
            Cor do épico <span className={styles.hint}>(opcional)</span>
          </span>
          <div className={styles.colorField}>
            <input
              type="color"
              value={color ?? objectiveColor}
              onChange={(e) => setColor(e.target.value)}
              className={styles.colorInput}
              aria-label="Cor personalizada"
            />
            <div className={styles.swatches}>
              {PRESET_COLORS.map((preset) => {
                const isActive = color?.toLowerCase() === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setColor(preset)}
                    aria-label={`Usar cor ${preset}`}
                    aria-pressed={isActive}
                    className={`${styles.swatch} ${isActive ? styles.swatchActive : ''}`}
                    style={{ backgroundColor: preset }}
                  />
                );
              })}
            </div>
          </div>
          {color ? (
            <button type="button" onClick={() => setColor(undefined)} className={styles.linkButton}>
              Usar a cor do objetivo
            </button>
          ) : (
            <p className={styles.hint}>Seguindo a cor do objetivo.</p>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="epic-owner">
            Responsável <span className={styles.hint}>(opcional)</span>
          </label>
          <OwnerCombobox
            id="epic-owner"
            value={owner}
            onChange={setOwner}
            placeholder="Nome de quem está à frente"
          />
        </div>

        <div className={`${styles.formActions} ${onDelete ? styles.formActionsSpread : ''}`}>
          {onDelete && (
            <button type="button" onClick={onDelete} className={styles.btnDanger}>
              Excluir épico
            </button>
          )}
          <div className={styles.formActionsGroup}>
            <button type="button" onClick={onClose} className={styles.btnSecondary}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary}>
              {initial ? 'Salvar alterações' : 'Criar épico'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
