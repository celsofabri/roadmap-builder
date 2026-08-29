import { useRef, useState } from 'react';
import type { Roadmap } from '@/types/roadmap.types';
import { importRoadmapsFromFile } from '@/services/importService';
import sharedStyles from '@/styles/shared.module.scss';
import styles from './ImportExportButtons.module.scss';

interface ImportExportButtonsProps {
  exportLabel: string;
  onExport: () => void;
  /** Only shown when provided — pass to enable the "Importar JSON" action. */
  onImport?: (roadmaps: Roadmap[]) => void;
}

export function ImportExportButtons({ exportLabel, onExport, onImport }: ImportExportButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const result = await importRoadmapsFromFile(file);
    if (!result.success || !result.roadmaps) {
      setError(result.error ?? 'Falha ao importar o arquivo.');
      return;
    }
    setError(null);
    onImport?.(result.roadmaps);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.actions}>
        <button type="button" onClick={onExport} className={sharedStyles.btnOutline}>
          {exportLabel}
        </button>
        {onImport && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={sharedStyles.btnOutline}
            >
              Importar JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className={styles.hiddenInput}
              onChange={handleFileChange}
            />
          </>
        )}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
