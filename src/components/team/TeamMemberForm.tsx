import { useRef, useState } from 'react';
import { OwnerAvatar } from '@/components/shared/OwnerAvatar';
import { UploadIcon } from '@/components/shared/Icon';
import { teamMemberInputSchema } from '@/schemas/roadmap.schema';
import type { TeamMemberInput } from '@/store/teamMemberStore';
import { fileToSquareDataUrl } from '@/utils/imageResize';
import styles from '@/styles/shared.module.scss';
import formStyles from './TeamMemberForm.module.scss';

interface TeamMemberFormProps {
  initial?: { name: string; photoDataUrl?: string };
  submitLabel: string;
  onSubmit: (input: TeamMemberInput) => void;
  onCancel: () => void;
}

/**
 * Bare form (no Modal wrapper) — always used inline inside TeamMembersModal,
 * so adding/editing a member never has to open a second, stacked modal.
 */
export function TeamMemberForm({ initial, submitLabel, onSubmit, onCancel }: TeamMemberFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [photoDataUrl, setPhotoDataUrl] = useState(initial?.photoDataUrl);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setPhotoDataUrl(await fileToSquareDataUrl(file));
      setPhotoError(null);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Não foi possível processar a imagem.');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = teamMemberInputSchema.safeParse({ name });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path.join('.') || 'form'] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit({ ...result.data, photoDataUrl });
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <span className={styles.label}>
          Foto <span className={styles.hint}>(opcional)</span>
        </span>
        <div className={formStyles.photoRow}>
          <button
            type="button"
            className={formStyles.photoPreview}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Enviar foto do responsável"
          >
            <OwnerAvatar name={name || '?'} photoDataUrl={photoDataUrl} size={56} />
          </button>
          <div className={formStyles.photoActions}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`${styles.btnSecondary} ${styles.btnSm}`}
            >
              <UploadIcon size={13} />
              {photoDataUrl ? 'Trocar foto' : 'Enviar foto'}
            </button>
            {photoDataUrl && (
              <button
                type="button"
                onClick={() => setPhotoDataUrl(undefined)}
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
              onChange={handlePhotoChange}
            />
          </div>
        </div>
        {photoError && <p className={styles.error}>{photoError}</p>}
        {!photoDataUrl && <p className={styles.hint}>Sem foto, mostramos as iniciais do nome.</p>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="team-member-name">
          Nome
        </label>
        <input
          id="team-member-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
          placeholder="Ex: Ana Souza"
        />
        {errors.name && <p className={styles.error}>{errors.name}</p>}
      </div>

      <div className={styles.formActions}>
        <button type="button" onClick={onCancel} className={styles.btnSecondary}>
          Cancelar
        </button>
        <button type="submit" className={styles.btnPrimary}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
