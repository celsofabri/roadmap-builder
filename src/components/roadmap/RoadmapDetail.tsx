import { useState } from 'react';
import { useRoadmapStore } from '@/store/roadmapStore';
import type { Epic, Initiative, Objective } from '@/types/roadmap.types';
import { RoadmapForm } from '@/components/roadmap/RoadmapForm';
import { TimelineView } from '@/components/roadmap/TimelineView';
import { ObjectiveForm } from '@/components/forms/ObjectiveForm';
import { EpicForm } from '@/components/forms/EpicForm';
import { InitiativeForm } from '@/components/forms/InitiativeForm';
import { ImportExportButtons } from '@/components/shared/ImportExportButtons';
import { exportService } from '@/services/exportService';
import { formatShortDateLabel } from '@/utils/dateUtils';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/statusOptions';
import sharedStyles from '@/styles/shared.module.scss';
import styles from './RoadmapDetail.module.scss';

type ObjectiveFormTarget = { mode: 'create' } | { mode: 'edit'; objective: Objective };
type EpicFormTarget =
  | { mode: 'create'; objectiveId: string }
  | { mode: 'edit'; objectiveId: string; epic: Epic };
type InitiativeFormTarget =
  | { mode: 'create'; epicId: string; epicRange: { startDate: string; endDate: string } }
  | { mode: 'edit'; epicId: string; epicRange: { startDate: string; endDate: string }; initiative: Initiative };

function StatusBadge({ status }: { status?: Epic['status'] }) {
  if (!status) return null;
  return (
    <span className={styles.statusBadge} style={{ backgroundColor: STATUS_COLORS[status] }}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function RoadmapDetail() {
  const roadmap = useRoadmapStore((s) => s.activeRoadmap);
  const closeRoadmap = useRoadmapStore((s) => s.closeRoadmap);
  const updateRoadmapMeta = useRoadmapStore((s) => s.updateRoadmapMeta);

  const addObjective = useRoadmapStore((s) => s.addObjective);
  const updateObjective = useRoadmapStore((s) => s.updateObjective);
  const removeObjective = useRoadmapStore((s) => s.removeObjective);

  const addEpic = useRoadmapStore((s) => s.addEpic);
  const updateEpic = useRoadmapStore((s) => s.updateEpic);
  const removeEpic = useRoadmapStore((s) => s.removeEpic);

  const addInitiative = useRoadmapStore((s) => s.addInitiative);
  const updateInitiative = useRoadmapStore((s) => s.updateInitiative);
  const removeInitiative = useRoadmapStore((s) => s.removeInitiative);

  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [showMetaForm, setShowMetaForm] = useState(false);
  const [objectiveFormTarget, setObjectiveFormTarget] = useState<ObjectiveFormTarget | null>(null);
  const [epicFormTarget, setEpicFormTarget] = useState<EpicFormTarget | null>(null);
  const [initiativeFormTarget, setInitiativeFormTarget] = useState<InitiativeFormTarget | null>(
    null,
  );

  const [confirmDeleteObjectiveId, setConfirmDeleteObjectiveId] = useState<string | null>(null);
  const [confirmDeleteEpicId, setConfirmDeleteEpicId] = useState<string | null>(null);
  const [confirmDeleteInitiativeId, setConfirmDeleteInitiativeId] = useState<string | null>(null);

  if (!roadmap) return null;

  return (
    <div className={styles.page}>
      <button type="button" onClick={closeRoadmap} className={styles.backLink}>
        ← Todos os roadmaps
      </button>

      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>{roadmap.name}</h1>
          {roadmap.description && <p className={styles.description}>{roadmap.description}</p>}
          <p className={styles.meta}>
            {formatShortDateLabel(roadmap.period.startDate)} —{' '}
            {formatShortDateLabel(roadmap.period.endDate)}
          </p>
        </div>
        <div className={styles.headerActions}>
          <ImportExportButtons
            exportLabel="Exportar"
            onExport={() => exportService.exportRoadmap(roadmap)}
          />
          <button type="button" onClick={() => setShowMetaForm(true)} className={styles.editButton}>
            Editar roadmap
          </button>
        </div>
      </div>

      <div className={styles.viewToggle}>
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={`${styles.viewToggleButton} ${viewMode === 'list' ? styles.viewToggleButtonActive : ''}`}
        >
          Lista
        </button>
        <button
          type="button"
          onClick={() => setViewMode('timeline')}
          className={`${styles.viewToggleButton} ${viewMode === 'timeline' ? styles.viewToggleButtonActive : ''}`}
        >
          Timeline
        </button>
      </div>

      {viewMode === 'timeline' && (
        <div className={styles.timelineWrap}>
          <TimelineView
            roadmap={roadmap}
            onEditEpic={(objectiveId, epic) => setEpicFormTarget({ mode: 'edit', objectiveId, epic })}
            onAddEpic={(objectiveId) => setEpicFormTarget({ mode: 'create', objectiveId })}
            onEditInitiative={(epic, initiative) =>
              setInitiativeFormTarget({
                mode: 'edit',
                epicId: epic.id,
                epicRange: { startDate: epic.startDate, endDate: epic.endDate },
                initiative,
              })
            }
          />
        </div>
      )}

      <div className={viewMode === 'list' ? styles.objectives : styles.objectivesHidden}>
        {roadmap.objectives.map((objective) => (
          <section
            key={objective.id}
            className={styles.objectiveSection}
            style={{ borderLeft: `4px solid ${objective.color ?? '#94a3b8'}` }}
          >
            <div className={styles.objectiveHeaderRow}>
              <div>
                <h2 className={styles.objectiveTitle}>{objective.title}</h2>
                {objective.description && (
                  <p className={styles.objectiveDescription}>{objective.description}</p>
                )}
              </div>
              {confirmDeleteObjectiveId === objective.id ? (
                <div className={styles.confirmRowSm}>
                  <span>Excluir objetivo e todo seu conteúdo?</span>
                  <button
                    type="button"
                    onClick={() => {
                      removeObjective(objective.id);
                      setConfirmDeleteObjectiveId(null);
                    }}
                    className={sharedStyles.confirmConfirm}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteObjectiveId(null)}
                    className={sharedStyles.confirmCancel}
                  >
                    Não
                  </button>
                </div>
              ) : (
                <div className={styles.rowActionsSm}>
                  <button
                    type="button"
                    onClick={() => setObjectiveFormTarget({ mode: 'edit', objective })}
                    className={sharedStyles.linkAction}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteObjectiveId(objective.id)}
                    className={sharedStyles.linkDanger}
                  >
                    Excluir
                  </button>
                </div>
              )}
            </div>

            <ul className={styles.epicsList}>
              {objective.epics.map((epic) => (
                <li key={epic.id} className={styles.epicItem}>
                  <div className={styles.epicHeaderRow}>
                    <div>
                      <div className={styles.epicTitleRow}>
                        <span className={styles.epicTitle}>{epic.title}</span>
                        <StatusBadge status={epic.status} />
                      </div>
                      <p className={styles.epicMeta}>
                        {formatShortDateLabel(epic.startDate)} — {formatShortDateLabel(epic.endDate)}
                      </p>
                    </div>
                    {confirmDeleteEpicId === epic.id ? (
                      <div className={styles.confirmRowXs}>
                        <span>Excluir épico?</span>
                        <button
                          type="button"
                          onClick={() => {
                            removeEpic(epic.id);
                            setConfirmDeleteEpicId(null);
                          }}
                          className={sharedStyles.confirmConfirm}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteEpicId(null)}
                          className={sharedStyles.confirmCancel}
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <div className={styles.rowActionsXs}>
                        <button
                          type="button"
                          onClick={() =>
                            setEpicFormTarget({ mode: 'edit', objectiveId: objective.id, epic })
                          }
                          className={sharedStyles.linkAction}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteEpicId(epic.id)}
                          className={sharedStyles.linkDanger}
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>

                  <ul className={styles.initiativesList}>
                    {epic.initiatives.map((initiative) => (
                      <li key={initiative.id} className={styles.initiativeItem}>
                        <div>
                          <div className={styles.initiativeTitleRow}>
                            <span className={styles.initiativeTitle}>{initiative.title}</span>
                            <StatusBadge status={initiative.status} />
                          </div>
                          <p className={styles.initiativeMeta}>
                            {formatShortDateLabel(initiative.startDate)} —{' '}
                            {formatShortDateLabel(initiative.endDate)}
                          </p>
                        </div>
                        {confirmDeleteInitiativeId === initiative.id ? (
                          <div className={styles.confirmRowXs}>
                            <span>Excluir?</span>
                            <button
                              type="button"
                              onClick={() => {
                                removeInitiative(initiative.id);
                                setConfirmDeleteInitiativeId(null);
                              }}
                              className={sharedStyles.confirmConfirm}
                            >
                              Sim
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteInitiativeId(null)}
                              className={sharedStyles.confirmCancel}
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <div className={styles.rowActionsXs}>
                            <button
                              type="button"
                              onClick={() =>
                                setInitiativeFormTarget({
                                  mode: 'edit',
                                  epicId: epic.id,
                                  epicRange: { startDate: epic.startDate, endDate: epic.endDate },
                                  initiative,
                                })
                              }
                              className={sharedStyles.linkAction}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteInitiativeId(initiative.id)}
                              className={sharedStyles.linkDanger}
                            >
                              Excluir
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() =>
                      setInitiativeFormTarget({
                        mode: 'create',
                        epicId: epic.id,
                        epicRange: { startDate: epic.startDate, endDate: epic.endDate },
                      })
                    }
                    className={styles.addInitiativeButton}
                  >
                    + Iniciativa
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setEpicFormTarget({ mode: 'create', objectiveId: objective.id })}
              className={styles.addEpicButton}
            >
              + Épico
            </button>
          </section>
        ))}

        <button
          type="button"
          onClick={() => setObjectiveFormTarget({ mode: 'create' })}
          className={styles.addObjectiveButton}
        >
          + Objetivo
        </button>
      </div>

      {showMetaForm && (
        <RoadmapForm
          initial={{ name: roadmap.name, description: roadmap.description, period: roadmap.period }}
          onClose={() => setShowMetaForm(false)}
          onSubmit={(input) => {
            updateRoadmapMeta(input);
            setShowMetaForm(false);
          }}
        />
      )}

      {objectiveFormTarget && (
        <ObjectiveForm
          initial={objectiveFormTarget.mode === 'edit' ? objectiveFormTarget.objective : undefined}
          onClose={() => setObjectiveFormTarget(null)}
          onSubmit={(input) => {
            if (objectiveFormTarget.mode === 'edit') {
              updateObjective(objectiveFormTarget.objective.id, input);
            } else {
              addObjective(input);
            }
            setObjectiveFormTarget(null);
          }}
        />
      )}

      {epicFormTarget && (
        <EpicForm
          initial={epicFormTarget.mode === 'edit' ? epicFormTarget.epic : undefined}
          parentRange={roadmap.period}
          onClose={() => setEpicFormTarget(null)}
          onSubmit={(input) => {
            if (epicFormTarget.mode === 'edit') {
              updateEpic(epicFormTarget.epic.id, input);
            } else {
              addEpic(epicFormTarget.objectiveId, input);
            }
            setEpicFormTarget(null);
          }}
        />
      )}

      {initiativeFormTarget && (
        <InitiativeForm
          initial={initiativeFormTarget.mode === 'edit' ? initiativeFormTarget.initiative : undefined}
          parentRange={initiativeFormTarget.epicRange}
          onClose={() => setInitiativeFormTarget(null)}
          onSubmit={(input) => {
            if (initiativeFormTarget.mode === 'edit') {
              updateInitiative(initiativeFormTarget.initiative.id, input);
            } else {
              addInitiative(initiativeFormTarget.epicId, input);
            }
            setInitiativeFormTarget(null);
          }}
        />
      )}
    </div>
  );
}
