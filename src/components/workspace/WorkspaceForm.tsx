import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { workspaceInputSchema } from '@/schemas/roadmap.schema';
import type { WorkspaceInput } from '@/store/workspaceStore';
import styles from '@/styles/shared.module.scss';

interface WorkspaceFormProps {
  initial?: { name: string; description?: string };
  onSubmit: (input: WorkspaceInput) => void;
  onClose: () => void;
}

export function WorkspaceForm({ initial, onSubmit, onClose }: WorkspaceFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = workspaceInputSchema.safeParse({
      name,
      description: description || undefined,
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
    <Modal title={initial ? 'Editar workspace' : 'Novo workspace'} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="workspace-name">
            Nome do time / workspace
          </label>
          <input
            id="workspace-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            placeholder="Ex: Time de Plataforma"
          />
          {errors.name && <p className={styles.error}>{errors.name}</p>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="workspace-description">
            Descrição <span className={styles.hint}>(opcional)</span>
          </label>
          <textarea
            id="workspace-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={styles.input}
            placeholder="Do que esse time cuida"
          />
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={onClose} className={styles.btnSecondary}>
            Cancelar
          </button>
          <button type="submit" className={styles.btnPrimary}>
            {initial ? 'Salvar alterações' : 'Criar workspace'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
