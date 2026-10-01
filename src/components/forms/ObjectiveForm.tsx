import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { OwnersField } from '@/components/shared/OwnersField';
import { objectiveInputSchema } from '@/schemas/roadmap.schema';
import type { ObjectiveInput } from '@/store/roadmapStore';
import { PRESET_COLORS } from '@/utils/color';
import styles from '@/styles/shared.module.scss';

const DEFAULT_COLOR = PRESET_COLORS[0];

interface ObjectiveFormProps {
  initial?: { title: string; description?: string; color?: string; owners?: string[] };
  onSubmit: (input: ObjectiveInput) => void;
  onClose: () => void;
}

export function ObjectiveForm({ initial, onSubmit, onClose }: ObjectiveFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR);
  const [owners, setOwners] = useState<string[]>(initial?.owners ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = objectiveInputSchema.safeParse({
      title,
      description: description || undefined,
      color,
      owners: owners.length > 0 ? owners : undefined,
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
            <div className={styles.swatches}>
              {PRESET_COLORS.map((preset) => {
                const isActive = color.toLowerCase() === preset;
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
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="objective-owners">
            Responsáveis <span className={styles.hint}>(opcional)</span>
          </label>
          <OwnersField
            id="objective-owners"
            value={owners}
            onChange={setOwners}
            hint="Aparecem como labels na timeline e na lista — dá para ocultá-los sem apagar quem é responsável."
          />
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
