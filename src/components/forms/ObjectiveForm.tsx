import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { objectiveInputSchema } from '@/schemas/roadmap.schema';
import type { ObjectiveInput } from '@/store/roadmapStore';
import styles from '@/styles/shared.module.scss';

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

        <label className={styles.formGroupRow}>
          Cor
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className={styles.colorInput}
          />
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
