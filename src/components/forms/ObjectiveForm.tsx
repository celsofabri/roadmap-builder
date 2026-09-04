import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { CloseIcon } from '@/components/shared/Icon';
import { objectiveInputSchema } from '@/schemas/roadmap.schema';
import type { ObjectiveInput } from '@/store/roadmapStore';
import { ownerColor } from '@/utils/ownerAvatar';
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
  initial?: { title: string; description?: string; color?: string; owners?: string[] };
  onSubmit: (input: ObjectiveInput) => void;
  onClose: () => void;
}

export function ObjectiveForm({ initial, onSubmit, onClose }: ObjectiveFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR);
  const [owners, setOwners] = useState<string[]>(initial?.owners ?? []);
  const [ownerDraft, setOwnerDraft] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function addOwner() {
    const name = ownerDraft.trim();
    if (!name) return;
    if (!owners.some((o) => o.toLowerCase() === name.toLowerCase())) {
      setOwners((prev) => [...prev, name]);
    }
    setOwnerDraft('');
  }

  function removeOwner(name: string) {
    setOwners((prev) => prev.filter((o) => o !== name));
  }

  function handleOwnerKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addOwner();
    } else if (e.key === 'Backspace' && !ownerDraft && owners.length > 0) {
      setOwners((prev) => prev.slice(0, -1));
    }
  }

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

        <div className={styles.field}>
          <label className={styles.label} htmlFor="objective-owners">
            Responsáveis <span className={styles.hint}>(opcional)</span>
          </label>
          {owners.length > 0 && (
            <div className={formStyles.ownerChips}>
              {owners.map((owner) => {
                const { bg, text } = ownerColor(owner);
                return (
                  <span
                    key={owner}
                    className={formStyles.ownerChip}
                    style={{ backgroundColor: bg, color: text }}
                  >
                    {owner}
                    <button
                      type="button"
                      onClick={() => removeOwner(owner)}
                      aria-label={`Remover ${owner}`}
                      className={formStyles.ownerChipRemove}
                      style={{ color: text }}
                    >
                      <CloseIcon size={11} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <input
            id="objective-owners"
            value={ownerDraft}
            onChange={(e) => setOwnerDraft(e.target.value)}
            onKeyDown={handleOwnerKeyDown}
            onBlur={addOwner}
            className={styles.input}
            placeholder="Nome da pessoa e Enter"
          />
          <p className={styles.hint}>
            Aparecem como labels na timeline e na lista — dá para ocultá-los sem apagar quem é
            responsável.
          </p>
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
