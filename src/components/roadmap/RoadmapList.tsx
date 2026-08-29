import { useEffect, useState } from 'react';
import { useRoadmapStore } from '@/store/roadmapStore';
import { RoadmapForm } from '@/components/roadmap/RoadmapForm';
import { ImportExportButtons } from '@/components/shared/ImportExportButtons';
import { storageService } from '@/services/storageService';
import { exportService } from '@/services/exportService';
import { formatShortDateLabel } from '@/utils/dateUtils';
import sharedStyles from '@/styles/shared.module.scss';
import styles from './RoadmapList.module.scss';

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
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Roadmap Builder</h1>
        <div className={styles.headerActions}>
          <ImportExportButtons
            exportLabel="Exportar todos"
            onExport={() => exportService.exportAll(storageService.getAllRoadmaps())}
            onImport={(imported) => imported.forEach((r) => importRoadmap(r))}
          />
          <button type="button" onClick={() => setShowCreateForm(true)} className={styles.newButton}>
            + Novo roadmap
          </button>
        </div>
      </div>

      {roadmaps.length === 0 && (
        <p className={styles.empty}>Nenhum roadmap ainda. Crie o primeiro para começar.</p>
      )}

      <ul className={styles.list}>
        {roadmaps.map((roadmap) => (
          <li key={roadmap.id} className={styles.card}>
            <div className={styles.cardRow}>
              <div className={styles.cardBody}>
                {renamingId === roadmap.id ? (
                  <div className={styles.renameRow}>
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRename();
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      className={styles.renameInput}
                    />
                    <button type="button" onClick={commitRename} className={styles.renameSave}>
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenamingId(null)}
                      className={styles.renameCancel}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openRoadmap(roadmap.id)}
                    className={styles.roadmapName}
                  >
                    {roadmap.name}
                  </button>
                )}
                <p className={styles.meta}>
                  {formatShortDateLabel(roadmap.period.startDate)} —{' '}
                  {formatShortDateLabel(roadmap.period.endDate)} · {roadmap.objectiveCount}{' '}
                  objetivo(s) · {roadmap.epicCount} épico(s)
                </p>
              </div>

              {confirmingDeleteId === roadmap.id ? (
                <div className={sharedStyles.confirmRow}>
                  <span>Excluir permanentemente?</span>
                  <button
                    type="button"
                    onClick={() => {
                      deleteRoadmap(roadmap.id);
                      setConfirmingDeleteId(null);
                    }}
                    className={sharedStyles.confirmConfirm}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(null)}
                    className={sharedStyles.confirmCancel}
                  >
                    Não
                  </button>
                </div>
              ) : (
                <div className={styles.rowActions}>
                  <button
                    type="button"
                    onClick={() => openRoadmap(roadmap.id)}
                    className={sharedStyles.linkAction}
                  >
                    Abrir
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateRoadmap(roadmap.id)}
                    className={sharedStyles.linkAction}
                  >
                    Duplicar
                  </button>
                  <button
                    type="button"
                    onClick={() => startRename(roadmap.id, roadmap.name)}
                    className={sharedStyles.linkAction}
                  >
                    Renomear
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(roadmap.id)}
                    className={sharedStyles.linkDanger}
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
