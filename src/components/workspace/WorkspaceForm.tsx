import { useRef, useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { WorkspaceIcon } from '@/components/shared/WorkspaceIcon';
import { UploadIcon } from '@/components/shared/Icon';
import { workspaceInputSchema } from '@/schemas/roadmap.schema';
import type { WorkspaceInput } from '@/store/workspaceStore';
import { fileToSquareDataUrl } from '@/utils/imageResize';
import styles from '@/styles/shared.module.scss';
import formStyles from './WorkspaceForm.module.scss';

interface WorkspaceFormProps {
  initial?: { name: string; description?: string; iconDataUrl?: string };
  onSubmit: (input: WorkspaceInput) => void;
  onClose: () => void;
}

export function WorkspaceForm({ initial, onSubmit, onClose }: WorkspaceFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [iconDataUrl, setIconDataUrl] = useState(initial?.iconDataUrl);
  const [iconError, setIconError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleIconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setIconDataUrl(await fileToSquareDataUrl(file));
      setIconError(null);
    } catch (err) {
      setIconError(err instanceof Error ? err.message : 'Não foi possível processar a imagem.');
    }
  }

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
    onSubmit({ ...result.data, iconDataUrl });
  }

  return (
    <Modal title={initial ? 'Editar workspace' : 'Novo workspace'} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <span className={styles.label}>
            Ícone <span className={styles.hint}>(opcional)</span>
          </span>
          <div className={formStyles.iconRow}>
            <button
              type="button"
              className={formStyles.iconPreview}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Enviar imagem do workspace"
            >
              <WorkspaceIcon name={name || 'Workspace'} iconDataUrl={iconDataUrl} size={56} />
            </button>
            <div className={formStyles.iconActions}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`${styles.btnSecondary} ${styles.btnSm}`}
              >
                <UploadIcon size={13} />
                {iconDataUrl ? 'Trocar imagem' : 'Enviar imagem'}
              </button>
              {iconDataUrl && (
                <button
                  type="button"
                  onClick={() => setIconDataUrl(undefined)}
                  className={`${styles.btnGhost} ${styles.btnSm}`}
                >
                  Remover
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleIconChange}
              />
            </div>
          </div>
          {iconError && <p className={styles.error}>{iconError}</p>}
          {!iconDataUrl && (
            <p className={styles.hint}>Sem imagem, mostramos as iniciais do nome.</p>
          )}
        </div>

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
