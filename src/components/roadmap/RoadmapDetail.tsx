import { useState } from 'react';
import { useRoadmapStore } from '@/store/roadmapStore';
import type { Epic, Initiative, Objective } from '@/types/roadmap.types';
import { RoadmapForm } from '@/components/roadmap/RoadmapForm';
import { TimelineView } from '@/components/roadmap/TimelineView';
import { ObjectiveForm } from '@/components/forms/ObjectiveForm';
import { EpicForm } from '@/components/forms/EpicForm';
import { InitiativeForm } from '@/components/forms/InitiativeForm';
import { formatShortDateLabel } from '@/utils/dateUtils';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/statusOptions';

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
    <span
      className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: STATUS_COLORS[status] }}
    >
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
    <div className="mx-auto max-w-4xl p-8">
      <button
        type="button"
        onClick={closeRoadmap}
        className="mb-4 text-sm text-slate-500 hover:text-slate-700"
      >
        ← Todos os roadmaps
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{roadmap.name}</h1>
          {roadmap.description && (
            <p className="mt-1 text-sm text-slate-500">{roadmap.description}</p>
          )}
          <p className="mt-1 text-sm text-slate-500">
            {formatShortDateLabel(roadmap.period.startDate)} —{' '}
            {formatShortDateLabel(roadmap.period.endDate)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowMetaForm(true)}
          className="shrink-0 rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Editar roadmap
        </button>
      </div>

      <div className="mb-4 flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-sm w-fit">
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={`rounded-md px-3 py-1 ${
            viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Lista
        </button>
        <button
          type="button"
          onClick={() => setViewMode('timeline')}
          className={`rounded-md px-3 py-1 ${
            viewMode === 'timeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Timeline
        </button>
      </div>

      {viewMode === 'timeline' && (
        <div className="mb-6">
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

      <div className={viewMode === 'list' ? 'space-y-5' : 'hidden'}>
        {roadmap.objectives.map((objective) => (
          <section
            key={objective.id}
            className="rounded-lg border border-slate-200 bg-white p-4"
            style={{ borderLeft: `4px solid ${objective.color ?? '#94a3b8'}` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{objective.title}</h2>
                {objective.description && (
                  <p className="text-sm text-slate-500">{objective.description}</p>
                )}
              </div>
              {confirmDeleteObjectiveId === objective.id ? (
                <div className="flex shrink-0 items-center gap-2 text-sm">
                  <span className="text-slate-600">Excluir objetivo e todo seu conteúdo?</span>
                  <button
                    type="button"
                    onClick={() => {
                      removeObjective(objective.id);
                      setConfirmDeleteObjectiveId(null);
                    }}
                    className="font-medium text-red-600 hover:text-red-800"
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteObjectiveId(null)}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => setObjectiveFormTarget({ mode: 'edit', objective })}
                    className="text-slate-600 hover:text-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteObjectiveId(objective.id)}
                    className="text-slate-600 hover:text-red-700"
                  >
                    Excluir
                  </button>
                </div>
              )}
            </div>

            <ul className="mt-3 space-y-2">
              {objective.epics.map((epic) => (
                <li key={epic.id} className="rounded border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{epic.title}</span>
                        <StatusBadge status={epic.status} />
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatShortDateLabel(epic.startDate)} — {formatShortDateLabel(epic.endDate)}
                      </p>
                    </div>
                    {confirmDeleteEpicId === epic.id ? (
                      <div className="flex shrink-0 items-center gap-2 text-xs">
                        <span className="text-slate-600">Excluir épico?</span>
                        <button
                          type="button"
                          onClick={() => {
                            removeEpic(epic.id);
                            setConfirmDeleteEpicId(null);
                          }}
                          className="font-medium text-red-600 hover:text-red-800"
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteEpicId(null)}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 items-center gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            setEpicFormTarget({ mode: 'edit', objectiveId: objective.id, epic })
                          }
                          className="text-slate-600 hover:text-blue-700"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteEpicId(epic.id)}
                          className="text-slate-600 hover:text-red-700"
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>

                  <ul className="mt-2 space-y-1 pl-4">
                    {epic.initiatives.map((initiative) => (
                      <li
                        key={initiative.id}
                        className="flex items-start justify-between rounded bg-white px-2 py-1.5"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-800">{initiative.title}</span>
                            <StatusBadge status={initiative.status} />
                          </div>
                          <p className="text-xs text-slate-500">
                            {formatShortDateLabel(initiative.startDate)} —{' '}
                            {formatShortDateLabel(initiative.endDate)}
                          </p>
                        </div>
                        {confirmDeleteInitiativeId === initiative.id ? (
                          <div className="flex shrink-0 items-center gap-2 text-xs">
                            <span className="text-slate-600">Excluir?</span>
                            <button
                              type="button"
                              onClick={() => {
                                removeInitiative(initiative.id);
                                setConfirmDeleteInitiativeId(null);
                              }}
                              className="font-medium text-red-600 hover:text-red-800"
                            >
                              Sim
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteInitiativeId(null)}
                              className="text-slate-500 hover:text-slate-700"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <div className="flex shrink-0 items-center gap-3 text-xs">
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
                              className="text-slate-600 hover:text-blue-700"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteInitiativeId(initiative.id)}
                              className="text-slate-600 hover:text-red-700"
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
                    className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    + Iniciativa
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setEpicFormTarget({ mode: 'create', objectiveId: objective.id })}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              + Épico
            </button>
          </section>
        ))}

        <button
          type="button"
          onClick={() => setObjectiveFormTarget({ mode: 'create' })}
          className="w-full rounded-lg border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-700"
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
