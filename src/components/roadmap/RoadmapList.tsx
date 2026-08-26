import { useEffect, useState } from 'react';
import { useRoadmapStore } from '@/store/roadmapStore';
import { RoadmapForm } from '@/components/roadmap/RoadmapForm';
import { ImportExportButtons } from '@/components/shared/ImportExportButtons';
import { storageService } from '@/services/storageService';
import { exportService } from '@/services/exportService';
import { formatShortDateLabel } from '@/utils/dateUtils';

export function RoadmapList() {
  const roadmaps = useRoadmapStore((s) => s.roadmaps);
  const loadRoadmaps = useRoadmapStore((s) => s.loadRoadmaps);
  const createRoadmap = useRoadmapStore((s) => s.createRoadmap);
  const openRoadmap = useRoadmapStore((s) => s.openRoadmap);
  const renameRoadmap = useRoadmapStore((s) => s.renameRoadmap);
  const deleteRoadmap = useRoadmapStore((s) => s.deleteRoadmap);
  const duplicateRoadmap = useRoadmapStore((s) => s.duplicateRoadmap);
  const importRoadmap = useRoadmapStore((s) => s.importRoadmap);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadRoadmaps();
  }, [loadRoadmaps]);

  function startRename(id: string, currentName: string) {
    setRenamingId(id);
    setRenameValue(currentName);
  }

  function commitRename() {
    if (renamingId && renameValue.trim()) {
      renameRoadmap(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Roadmap Builder</h1>
        <div className="flex items-start gap-2">
          <ImportExportButtons
            exportLabel="Exportar todos"
            onExport={() => exportService.exportAll(storageService.getAllRoadmaps())}
            onImport={(imported) => imported.forEach((r) => importRoadmap(r))}
          />
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="shrink-0 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Novo roadmap
          </button>
        </div>
      </div>

      {roadmaps.length === 0 && (
        <p className="rounded border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          Nenhum roadmap ainda. Crie o primeiro para começar.
        </p>
      )}

      <ul className="space-y-3">
        {roadmaps.map((roadmap) => (
          <li
            key={roadmap.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {renamingId === roadmap.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      className="rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={commitRename}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenamingId(null)}
                      className="text-sm text-slate-500 hover:text-slate-700"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openRoadmap(roadmap.id)}
                    className="truncate text-left text-lg font-medium text-slate-900 hover:text-blue-700"
                  >
                    {roadmap.name}
                  </button>
                )}
                <p className="mt-1 text-sm text-slate-500">
                  {formatShortDateLabel(roadmap.period.startDate)} —{' '}
                  {formatShortDateLabel(roadmap.period.endDate)} · {roadmap.objectiveCount}{' '}
                  objetivo(s) · {roadmap.epicCount} épico(s)
                </p>
              </div>

              {confirmingDeleteId === roadmap.id ? (
                <div className="flex shrink-0 items-center gap-2 text-sm">
                  <span className="text-slate-600">Excluir permanentemente?</span>
                  <button
                    type="button"
                    onClick={() => {
                      deleteRoadmap(roadmap.id);
                      setConfirmingDeleteId(null);
                    }}
                    className="font-medium text-red-600 hover:text-red-800"
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(null)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => openRoadmap(roadmap.id)}
                    className="text-slate-600 hover:text-blue-700"
                  >
                    Abrir
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateRoadmap(roadmap.id)}
                    className="text-slate-600 hover:text-blue-700"
                  >
                    Duplicar
                  </button>
                  <button
                    type="button"
                    onClick={() => startRename(roadmap.id, roadmap.name)}
                    className="text-slate-600 hover:text-blue-700"
                  >
                    Renomear
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(roadmap.id)}
                    className="text-slate-600 hover:text-red-700"
                  >
                    Excluir
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {showCreateForm && (
        <RoadmapForm
          onClose={() => setShowCreateForm(false)}
          onSubmit={(input) => {
            const roadmap = createRoadmap(input);
            setShowCreateForm(false);
            openRoadmap(roadmap.id);
          }}
        />
      )}
    </div>
  );
}
