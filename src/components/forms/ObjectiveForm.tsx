import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { objectiveInputSchema } from '@/schemas/roadmap.schema';
import type { ObjectiveInput } from '@/store/roadmapStore';
import styles from '@/styles/shared.module.scss';
import formStyles from './ObjectiveForm.module.scss';

const DEFAULT_COLOR = '#5b5bd6';

/** Quick swatches so lanes get distinguishable colors without opening the picker. */
const PRESET_COLORS = [
  '#5b5bd6',
  '#0ea5a3',
  '#e0682a',
  '#c2409a',
  '#0f9463',
  '#2f6fdb',
  '#a3562f',
  '#7c3aed',
];

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
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="objective-title">
            Título
          </label>
          <input
            id="objective-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.input}
            placeholder="Ex: Reduzir tempo de onboarding"
          />
          {errors.title && <p className={styles.error}>{errors.title}</p>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="objective-description">
            Descrição <span className={styles.hint}>(opcional)</span>
          </label>
          <textarea
            id="objective-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Cor da raia</span>
          <div className={styles.colorField}>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={styles.colorInput}
              aria-label="Cor personalizada"
            />
            <div className={formStyles.swatches}>
              {PRESET_COLORS.map((preset) => {
                const isActive = color.toLowerCase() === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setColor(preset)}
                    aria-label={`Usar cor ${preset}`}
                    aria-pressed={isActive}
                    className={`${formStyles.swatch} ${isActive ? formStyles.swatchActive : ''}`}
                    style={{ backgroundColor: preset }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={onClose} className={styles.btnSecondary}>
            Cancelar
          </button>
          <button type="submit" className={styles.btnPrimary}>
            {initial ? 'Salvar alterações' : 'Criar objetivo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
