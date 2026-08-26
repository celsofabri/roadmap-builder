import { useRef, useState } from 'react';
import type { Roadmap } from '@/types/roadmap.types';
import { importRoadmapsFromFile } from '@/services/importService';

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
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExport}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          {exportLabel}
        </button>
        {onImport && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Importar JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>
      {error && <p className="max-w-xs text-right text-sm text-red-600">{error}</p>}
    </div>
  );
}
