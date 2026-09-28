import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRoadmapStore } from '@/store/roadmapStore';
import type { Epic, Initiative, Objective, TeamMember } from '@/types/roadmap.types';
import { RoadmapForm } from '@/components/roadmap/RoadmapForm';
import { TimelineView } from '@/components/roadmap/TimelineView';
import { ObjectiveForm } from '@/components/forms/ObjectiveForm';
import { EpicForm } from '@/components/forms/EpicForm';
import { InitiativeForm } from '@/components/forms/InitiativeForm';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { formatShortDateLabel } from '@/utils/dateUtils';
import { ownerColor } from '@/utils/ownerAvatar';
import { DEFAULT_LANE_COLOR } from '@/utils/color';
import { OwnerAvatar } from '@/components/shared/OwnerAvatar';
import { findMemberPhoto, useTeamMemberStore } from '@/store/teamMemberStore';
import {
  CalendarIcon,
  EyeIcon,
  EyeOffIcon,
  GripIcon,
  LayersIcon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  TargetIcon,
  TimelineIcon,
  TrashIcon,
} from '@/components/shared/Icon';
import sharedStyles from '@/styles/shared.module.scss';
import styles from './RoadmapDetail.module.scss';

type ObjectiveFormTarget = { mode: 'create' } | { mode: 'edit'; objective: Objective };
type EpicFormTarget =
  | { mode: 'create'; objectiveId: string }
  | { mode: 'edit'; objectiveId: string; epic: Epic };
type EpicRange = { startDate: string; endDate: string };
type InitiativeFormTarget =
  | { mode: 'create'; epicId: string; epicRange: EpicRange }
  | { mode: 'edit'; epicId: string; epicRange: EpicRange; initiative: Initiative };

type DeleteTarget =
  | { kind: 'objective'; id: string; name: string }
  | { kind: 'epic'; id: string; name: string }
  | { kind: 'initiative'; id: string; name: string };

/** Drag metadata attached to each sortable item, so one shared handler can tell them apart. */
type DragItemData =
  | { type: 'objective' }
  | { type: 'epic'; objectiveId: string }
  | { type: 'initiative'; epicId: string };

const SHOW_OWNERS_KEY = 'roadmap-builder:show-owners';

function readShowOwners(): boolean {
  try {
    const stored = localStorage.getItem(SHOW_OWNERS_KEY);
    return stored === null ? true : stored === '1';
  } catch {
    return true;
  }
}

const DELETE_COPY: Record<DeleteTarget['kind'], { title: string; detail: string }> = {
  objective: {
    title: 'Excluir objetivo',
    detail: 'O objetivo e todos os épicos e iniciativas dentro dele serão removidos.',
  },
  epic: { title: 'Excluir épico', detail: 'O épico e todas as suas iniciativas serão removidos.' },
  initiative: { title: 'Excluir iniciativa', detail: 'A iniciativa será removida do épico.' },
};

function findEpic(objectives: Objective[], epicId: string): Epic | undefined {
  for (const objective of objectives) {
    const epic = objective.epics.find((e) => e.id === epicId);
    if (epic) return epic;
  }
  return undefined;
}

interface InitiativeListItemProps {
  initiative: Initiative;
  epicId: string;
  showOwners: boolean;
  members: TeamMember[];
  onEdit: () => void;
  onDelete: () => void;
}

function InitiativeListItem({
  initiative,
  epicId,
  showOwners,
  members,
  onEdit,
  onDelete,
}: InitiativeListItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: initiative.id,
    data: { type: 'initiative', epicId } satisfies DragItemData,
  });

  return (
    <li
      ref={setNodeRef}
      className={styles.initiative}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
    >
      <button
        type="button"
        className={styles.dragHandle}
        {...attributes}
        {...listeners}
        aria-label={`Reordenar iniciativa ${initiative.title}`}
      >
        <GripIcon size={13} />
      </button>

      <div className={styles.initiativeMain}>
        {showOwners && initiative.owner && (
          <OwnerAvatar
            name={initiative.owner}
            photoDataUrl={findMemberPhoto(members, initiative.owner)}
            size={18}
          />
        )}
        <span className={styles.initiativeTitle}>{initiative.title}</span>
        <StatusBadge status={initiative.status} />
        <span className={styles.initiativeDates}>
          {formatShortDateLabel(initiative.startDate)} – {formatShortDateLabel(initiative.endDate)}
        </span>
      </div>

      <div className={styles.rowActions}>
        <button
          type="button"
          className={sharedStyles.iconButton}
          onClick={onEdit}
          aria-label={`Editar iniciativa ${initiative.title}`}
        >
          <PencilIcon size={13} />
        </button>
        <button
          type="button"
          className={sharedStyles.iconButtonDanger}
          onClick={onDelete}
          aria-label={`Excluir iniciativa ${initiative.title}`}
        >
          <TrashIcon size={13} />
        </button>
      </div>
    </li>
  );
}

interface EpicListItemProps {
  epic: Epic;
  objectiveId: string;
  showOwners: boolean;
  members: TeamMember[];
  onEdit: () => void;
  onDelete: () => void;
  onAddInitiative: () => void;
  onEditInitiative: (initiative: Initiative) => void;
  onDeleteInitiative: (initiative: Initiative) => void;
}

function EpicListItem({
  epic,
  objectiveId,
  showOwners,
  members,
  onEdit,
  onDelete,
  onAddInitiative,
  onEditInitiative,
  onDeleteInitiative,
}: EpicListItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: epic.id,
    data: { type: 'epic', objectiveId } satisfies DragItemData,
  });

  return (
    <li
      ref={setNodeRef}
      className={styles.epic}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
    >
      <div className={styles.epicHeader}>
        <button
          type="button"
          className={styles.dragHandle}
          {...attributes}
          {...listeners}
          aria-label={`Reordenar épico ${epic.title}`}
        >
          <GripIcon size={14} />
        </button>

        <div className={styles.epicMain}>
          <div className={styles.epicTitleRow}>
            {showOwners && epic.owner && (
              <OwnerAvatar
                name={epic.owner}
                photoDataUrl={findMemberPhoto(members, epic.owner)}
                size={18}
              />
            )}
            <span className={styles.epicTitle}>{epic.title}</span>
            <StatusBadge status={epic.status} />
          </div>
          <p className={styles.epicDates}>
            {formatShortDateLabel(epic.startDate)} – {formatShortDateLabel(epic.endDate)}
          </p>
        </div>

        <div className={styles.rowActions}>
          <button
            type="button"
            className={sharedStyles.iconButton}
            onClick={onEdit}
            aria-label={`Editar épico ${epic.title}`}
          >
            <PencilIcon size={14} />
          </button>
          <button
            type="button"
            className={sharedStyles.iconButtonDanger}
            onClick={onDelete}
            aria-label={`Excluir épico ${epic.title}`}
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>

      {epic.initiatives.length > 0 && (
        <SortableContext
          items={epic.initiatives.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className={styles.initiatives}>
            {epic.initiatives.map((initiative) => (
              <InitiativeListItem
                key={initiative.id}
                initiative={initiative}
                epicId={epic.id}
                showOwners={showOwners}
                members={members}
                onEdit={() => onEditInitiative(initiative)}
                onDelete={() => onDeleteInitiative(initiative)}
              />
            ))}
          </ul>
        </SortableContext>
      )}

      <button type="button" onClick={onAddInitiative} className={styles.addInline}>
        <PlusIcon size={13} />
        Iniciativa
      </button>
    </li>
  );
}

interface ObjectiveCardProps {
  objective: Objective;
  showOwners: boolean;
  members: TeamMember[];
  onEdit: () => void;
  onDelete: () => void;
  onAddEpic: () => void;
  onEditEpic: (epic: Epic) => void;
  onDeleteEpic: (epic: Epic) => void;
  onAddInitiative: (epic: Epic) => void;
  onEditInitiative: (epic: Epic, initiative: Initiative) => void;
  onDeleteInitiative: (initiative: Initiative) => void;
}

function ObjectiveCard({
  objective,
  showOwners,
  members,
  onEdit,
  onDelete,
  onAddEpic,
  onEditEpic,
  onDeleteEpic,
  onAddInitiative,
  onEditInitiative,
  onDeleteInitiative,
}: ObjectiveCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: objective.id,
    data: { type: 'objective' } satisfies DragItemData,
  });
  const color = objective.color ?? DEFAULT_LANE_COLOR;

  return (
    <section
      ref={setNodeRef}
      className={styles.objective}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
    >
      <span className={styles.objectiveRail} style={{ backgroundColor: color }} />

      <div className={styles.objectiveHeader}>
        <button
          type="button"
          className={styles.dragHandle}
          {...attributes}
          {...listeners}
          aria-label={`Reordenar objetivo ${objective.title}`}
        >
          <GripIcon size={15} />
        </button>

        <div className={styles.objectiveMain}>
          <div className={styles.objectiveTitleRow}>
            <span className={styles.objectiveDot} style={{ backgroundColor: color }} />
            <h2 className={styles.objectiveTitle}>{objective.title}</h2>
          </div>
          {objective.description && (
            <p className={styles.objectiveDescription}>{objective.description}</p>
          )}
          {showOwners && objective.owners && objective.owners.length > 0 && (
            <div className={styles.ownerChips}>
              {objective.owners.map((owner) => {
                const { bg, text } = ownerColor(owner);
                return (
                  <span
                    key={owner}
                    className={styles.ownerChip}
                    style={{ backgroundColor: bg, color: text }}
                  >
                    {owner}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.rowActions}>
          <button
            type="button"
            className={sharedStyles.iconButton}
            onClick={onEdit}
            aria-label={`Editar objetivo ${objective.title}`}
          >
            <PencilIcon size={15} />
          </button>
          <button
            type="button"
            className={sharedStyles.iconButtonDanger}
            onClick={onDelete}
            aria-label={`Excluir objetivo ${objective.title}`}
          >
            <TrashIcon size={15} />
          </button>
        </div>
      </div>

      {objective.epics.length > 0 && (
        <SortableContext
          items={objective.epics.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className={styles.epics}>
            {objective.epics.map((epic) => (
              <EpicListItem
                key={epic.id}
                epic={epic}
                objectiveId={objective.id}
                showOwners={showOwners}
                members={members}
                onEdit={() => onEditEpic(epic)}
                onDelete={() => onDeleteEpic(epic)}
                onAddInitiative={() => onAddInitiative(epic)}
                onEditInitiative={(initiative) => onEditInitiative(epic, initiative)}
                onDeleteInitiative={onDeleteInitiative}
              />
            ))}
          </ul>
        </SortableContext>
      )}

      <div className={styles.addEpicRow}>
        <button type="button" onClick={onAddEpic} className={styles.addInline}>
          <PlusIcon size={14} />
          Épico
        </button>
      </div>
    </section>
  );
}

export function RoadmapDetail() {
  const roadmap = useRoadmapStore((s) => s.activeRoadmap);
  const updateRoadmapMeta = useRoadmapStore((s) => s.updateRoadmapMeta);
  const members = useTeamMemberStore((s) => s.members);

  const addObjective = useRoadmapStore((s) => s.addObjective);
  const updateObjective = useRoadmapStore((s) => s.updateObjective);
  const removeObjective = useRoadmapStore((s) => s.removeObjective);
  const reorderObjectives = useRoadmapStore((s) => s.reorderObjectives);

  const addEpic = useRoadmapStore((s) => s.addEpic);
  const updateEpic = useRoadmapStore((s) => s.updateEpic);
  const removeEpic = useRoadmapStore((s) => s.removeEpic);
  const reorderEpics = useRoadmapStore((s) => s.reorderEpics);

  const addInitiative = useRoadmapStore((s) => s.addInitiative);
  const updateInitiative = useRoadmapStore((s) => s.updateInitiative);
  const removeInitiative = useRoadmapStore((s) => s.removeInitiative);
  const reorderInitiatives = useRoadmapStore((s) => s.reorderInitiatives);

  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('timeline');
  const [showOwners, setShowOwners] = useState(readShowOwners);
  const [showMetaForm, setShowMetaForm] = useState(false);
  const [objectiveFormTarget, setObjectiveFormTarget] = useState<ObjectiveFormTarget | null>(null);
  const [epicFormTarget, setEpicFormTarget] = useState<EpicFormTarget | null>(null);
  const [initiativeFormTarget, setInitiativeFormTarget] = useState<InitiativeFormTarget | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  if (!roadmap) return null;

  const epicCount = roadmap.objectives.reduce((sum, o) => sum + o.epics.length, 0);
  const initiativeCount = roadmap.objectives.reduce(
    (sum, o) => sum + o.epics.reduce((s, e) => s + e.initiatives.length, 0),
    0,
  );

  function toggleShowOwners() {
    setShowOwners((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SHOW_OWNERS_KEY, next ? '1' : '0');
      } catch {
        // Private-mode browsers can reject writes; the toggle still works for this session.
      }
      return next;
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.kind === 'objective') removeObjective(deleteTarget.id);
    if (deleteTarget.kind === 'epic') removeEpic(deleteTarget.id);
    if (deleteTarget.kind === 'initiative') removeInitiative(deleteTarget.id);
    setDeleteTarget(null);
  }

  function handleListDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || !roadmap || active.id === over.id) return;

    const activeData = active.data.current as DragItemData | undefined;
    const overData = over.data.current as DragItemData | undefined;
    if (!activeData) return;

    if (activeData.type === 'objective') {
      if (overData?.type !== 'objective') return;
      const ids = roadmap.objectives.map((o) => o.id);
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;
      reorderObjectives(arrayMove(ids, oldIndex, newIndex));
      return;
    }

    if (activeData.type === 'epic') {
      if (overData?.type !== 'epic' || overData.objectiveId !== activeData.objectiveId) return;
      const objective = roadmap.objectives.find((o) => o.id === activeData.objectiveId);
      if (!objective) return;
      const ids = objective.epics.map((e) => e.id);
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;
      reorderEpics(objective.id, arrayMove(ids, oldIndex, newIndex));
      return;
    }

    if (activeData.type === 'initiative') {
      if (overData?.type !== 'initiative' || overData.epicId !== activeData.epicId) return;
      const epic = findEpic(roadmap.objectives, activeData.epicId);
      if (!epic) return;
      const ids = epic.initiatives.map((i) => i.id);
      const oldIndex = ids.indexOf(String(active.id));
      const newIndex = ids.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) return;
      reorderInitiatives(epic.id, arrayMove(ids, oldIndex, newIndex));
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>{roadmap.name}</h1>
            {roadmap.description && <p className={styles.description}>{roadmap.description}</p>}
            <div className={styles.stats}>
              <span className={styles.stat}>
                <CalendarIcon size={14} className={styles.statIcon} />
                {formatShortDateLabel(roadmap.period.startDate)} –{' '}
                {formatShortDateLabel(roadmap.period.endDate)}
              </span>
              <span className={styles.stat}>
                <TargetIcon size={14} className={styles.statIcon} />
                {roadmap.objectives.length} objetivo{roadmap.objectives.length === 1 ? '' : 's'}
              </span>
              <span className={styles.stat}>
                <LayersIcon size={14} className={styles.statIcon} />
                {epicCount} épico{epicCount === 1 ? '' : 's'}
              </span>
              <span className={styles.stat}>
                <ListIcon size={14} className={styles.statIcon} />
                {initiativeCount} iniciativa{initiativeCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={() => setShowMetaForm(true)}
              className={`${sharedStyles.btnSecondary} ${sharedStyles.btnSm}`}
            >
              <PencilIcon size={14} />
              Editar
            </button>
            <button
              type="button"
              onClick={() => setObjectiveFormTarget({ mode: 'create' })}
              className={`${sharedStyles.btnPrimary} ${sharedStyles.btnSm}`}
            >
              <PlusIcon size={14} />
              Objetivo
            </button>
          </div>
        </div>

        <div className={styles.tabsRow}>
          <div className={styles.tabs} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'timeline'}
              onClick={() => setViewMode('timeline')}
              className={`${styles.tab} ${viewMode === 'timeline' ? styles.tabActive : ''}`}
            >
              <TimelineIcon size={15} />
              Timeline
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className={`${styles.tab} ${viewMode === 'list' ? styles.tabActive : ''}`}
            >
              <ListIcon size={15} />
              Lista
            </button>
          </div>

          <button
            type="button"
            onClick={toggleShowOwners}
            aria-pressed={showOwners}
            title={showOwners ? 'Ocultar responsáveis' : 'Mostrar responsáveis'}
            className={`${styles.ownersToggle} ${showOwners ? styles.ownersToggleActive : ''}`}
          >
            {showOwners ? <EyeIcon size={14} /> : <EyeOffIcon size={14} />}
            Responsáveis
          </button>
        </div>
      </header>

      <div className={styles.body}>
        {viewMode === 'timeline' && (
          <TimelineView
            roadmap={roadmap}
            showOwners={showOwners}
            onEditEpic={(objectiveId, epic) => setEpicFormTarget({ mode: 'edit', objectiveId, epic })}
            onAddEpic={(objectiveId) => setEpicFormTarget({ mode: 'create', objectiveId })}
            onAddObjective={() => setObjectiveFormTarget({ mode: 'create' })}
            onDeleteObjective={(objective) =>
              setDeleteTarget({ kind: 'objective', id: objective.id, name: objective.title })
            }
            onEditInitiative={(epic, initiative) =>
              setInitiativeFormTarget({
                mode: 'edit',
                epicId: epic.id,
                epicRange: { startDate: epic.startDate, endDate: epic.endDate },
                initiative,
              })
            }
            onAddInitiative={(epic) =>
              setInitiativeFormTarget({
                mode: 'create',
                epicId: epic.id,
                epicRange: { startDate: epic.startDate, endDate: epic.endDate },
              })
            }
          />
        )}

        {/* Kept mounted so switching tabs doesn't reset any inline state. */}
        <div className={viewMode === 'list' ? undefined : styles.hidden}>
          {roadmap.objectives.length === 0 && (
            <div className={styles.emptyObjectives}>
              <p className={styles.emptyTitle}>Nenhum objetivo ainda</p>
              <p className={styles.emptyText}>
                Objetivos agrupam os épicos do roadmap e definem a cor de cada raia na timeline.
              </p>
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleListDragEnd}>
            <div className={styles.objectives}>
              <SortableContext
                items={roadmap.objectives.map((o) => o.id)}
                strategy={verticalListSortingStrategy}
              >
                {roadmap.objectives.map((objective) => (
                  <ObjectiveCard
                    key={objective.id}
                    objective={objective}
                    showOwners={showOwners}
                    members={members}
                    onEdit={() => setObjectiveFormTarget({ mode: 'edit', objective })}
                    onDelete={() =>
                      setDeleteTarget({ kind: 'objective', id: objective.id, name: objective.title })
                    }
                    onAddEpic={() => setEpicFormTarget({ mode: 'create', objectiveId: objective.id })}
                    onEditEpic={(epic) =>
                      setEpicFormTarget({ mode: 'edit', objectiveId: objective.id, epic })
                    }
                    onDeleteEpic={(epic) =>
                      setDeleteTarget({ kind: 'epic', id: epic.id, name: epic.title })
                    }
                    onAddInitiative={(epic) =>
                      setInitiativeFormTarget({
                        mode: 'create',
                        epicId: epic.id,
                        epicRange: { startDate: epic.startDate, endDate: epic.endDate },
                      })
                    }
                    onEditInitiative={(epic, initiative) =>
                      setInitiativeFormTarget({
                        mode: 'edit',
                        epicId: epic.id,
                        epicRange: { startDate: epic.startDate, endDate: epic.endDate },
                        initiative,
                      })
                    }
                    onDeleteInitiative={(initiative) =>
                      setDeleteTarget({
                        kind: 'initiative',
                        id: initiative.id,
                        name: initiative.title,
                      })
                    }
                  />
                ))}
              </SortableContext>

              <button
                type="button"
                onClick={() => setObjectiveFormTarget({ mode: 'create' })}
                className={styles.addObjective}
              >
                <PlusIcon size={15} />
                Adicionar objetivo
              </button>
            </div>
          </DndContext>
        </div>
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
          objectiveColor={
            roadmap.objectives.find((o) => o.id === epicFormTarget.objectiveId)?.color ??
            DEFAULT_LANE_COLOR
          }
          onClose={() => setEpicFormTarget(null)}
          onSubmit={(input) => {
            if (epicFormTarget.mode === 'edit') {
              updateEpic(epicFormTarget.epic.id, input);
            } else {
              addEpic(epicFormTarget.objectiveId, input);
            }
            setEpicFormTarget(null);
          }}
          onDelete={
            epicFormTarget.mode === 'edit'
              ? () => {
                  setDeleteTarget({
                    kind: 'epic',
                    id: epicFormTarget.epic.id,
                    name: epicFormTarget.epic.title,
                  });
                  setEpicFormTarget(null);
                }
              : undefined
          }
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
          onDelete={
            initiativeFormTarget.mode === 'edit'
              ? () => {
                  setDeleteTarget({
                    kind: 'initiative',
                    id: initiativeFormTarget.initiative.id,
                    name: initiativeFormTarget.initiative.title,
                  });
                  setInitiativeFormTarget(null);
                }
              : undefined
          }
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={DELETE_COPY[deleteTarget.kind].title}
          message={`"${deleteTarget.name}" será removido. ${DELETE_COPY[deleteTarget.kind].detail} Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
