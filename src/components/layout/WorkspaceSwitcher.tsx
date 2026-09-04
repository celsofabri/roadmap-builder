import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { WorkspaceForm } from '@/components/workspace/WorkspaceForm';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  CheckIcon,
  ChevronDownIcon,
  LayersIcon,
  MoreIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '@/components/shared/Icon';
import styles from './WorkspaceSwitcher.module.scss';

interface WorkspaceSwitcherProps {
  /** Rail mode — desktop only. Renders as a single icon that expands the sidebar. */
  collapsed?: boolean;
  onRequestExpand?: () => void;
}

function roadmapLabel(count: number): string {
  return `${count} roadmap${count === 1 ? '' : 's'}`;
}

const ITEM_MENU_WIDTH = 150;
// Two entries plus padding — close enough to size the flip-up decision without measuring the DOM.
const ITEM_MENU_HEIGHT = 84;
const VIEWPORT_MARGIN = 8;

interface ItemMenuPosition {
  workspaceId: string;
  top: number;
  left: number;
}

export function WorkspaceSwitcher({ collapsed, onRequestExpand }: WorkspaceSwitcherProps) {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const switchWorkspace = useWorkspaceStore((s) => s.switchWorkspace);
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace);
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace);

  const [open, setOpen] = useState(false);
  const [itemMenu, setItemMenu] = useState<ItemMenuPosition | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; description?: string } | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const itemMenuRef = useRef<HTMLDivElement>(null);
  const active = workspaces.find((w) => w.id === activeWorkspaceId);
  const canDelete = workspaces.length > 1;

  function toggleItemMenu(workspaceId: string, trigger: HTMLButtonElement) {
    if (itemMenu?.workspaceId === workspaceId) {
      setItemMenu(null);
      return;
    }
    // Rendered in a portal (see below) so it can't be clipped by the scrolling
    // panel list — position it in viewport coordinates instead of relying on CSS.
    const rect = trigger.getBoundingClientRect();
    const openUp = window.innerHeight - rect.bottom < ITEM_MENU_HEIGHT + VIEWPORT_MARGIN;
    const top = openUp ? rect.top - ITEM_MENU_HEIGHT - 4 : rect.bottom + 4;
    const left = Math.min(rect.right - ITEM_MENU_WIDTH, window.innerWidth - ITEM_MENU_WIDTH - VIEWPORT_MARGIN);
    setItemMenu({ workspaceId, top, left: Math.max(left, VIEWPORT_MARGIN) });
  }

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (itemMenuRef.current?.contains(target)) return;
      setOpen(false);
      setItemMenu(null);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setItemMenu(null);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const dialogs = (
    <>
      {showCreateForm && (
        <WorkspaceForm
          onClose={() => setShowCreateForm(false)}
          onSubmit={(input) => {
            createWorkspace(input);
            setShowCreateForm(false);
          }}
        />
      )}

      {editing && (
        <WorkspaceForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(input) => {
            updateWorkspace(editing.id, input);
            setEditing(null);
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Excluir workspace"
          message={`"${pendingDelete.name}" e todos os roadmaps dentro dele serão removidos permanentemente. Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            deleteWorkspace(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
    </>
  );

  if (collapsed) {
    return (
      <button
        type="button"
        className={styles.collapsedTrigger}
        onClick={onRequestExpand}
        title={active ? `Workspace: ${active.name}` : 'Trocar workspace'}
        aria-label="Trocar workspace"
      >
        <LayersIcon size={16} />
      </button>
    );
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => {
          setOpen((v) => !v);
          setItemMenu(null);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.triggerIcon}>
          <LayersIcon size={14} />
        </span>
        <span className={styles.triggerText}>
          <span className={styles.triggerName}>{active?.name ?? 'Workspace'}</span>
          <span className={styles.triggerSub}>
            {active ? roadmapLabel(active.roadmapCount) : 'Nenhum workspace'}
          </span>
        </span>
        <ChevronDownIcon size={15} className={styles.triggerChevron} />
      </button>

      {open && (
        <div className={styles.panel} role="menu">
          <div className={styles.panelHeader}>Workspaces</div>
          <ul
            className={styles.panelList}
            // A menu positioned relative to a scrolled-away trigger would be stale — just close it.
            onScroll={() => setItemMenu(null)}
          >
            {workspaces.map((ws) => (
              <li key={ws.id} className={styles.panelItem} data-menu-root="true">
                <button
                  type="button"
                  className={styles.panelItemButton}
                  onClick={() => {
                    switchWorkspace(ws.id);
                    setOpen(false);
                  }}
                >
                  <span className={styles.panelItemCheck}>
                    {ws.id === activeWorkspaceId && <CheckIcon size={14} />}
                  </span>
                  <span className={styles.panelItemText}>
                    <span className={styles.panelItemName}>{ws.name}</span>
                    <span className={styles.panelItemMeta}>{roadmapLabel(ws.roadmapCount)}</span>
                  </span>
                </button>

                <button
                  type="button"
                  className={styles.panelItemMenuButton}
                  data-open={itemMenu?.workspaceId === ws.id}
                  onClick={(e) => toggleItemMenu(ws.id, e.currentTarget)}
                  aria-label={`Ações de ${ws.name}`}
                  aria-haspopup="menu"
                  aria-expanded={itemMenu?.workspaceId === ws.id}
                >
                  <MoreIcon size={14} />
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className={styles.createButton}
            onClick={() => {
              setShowCreateForm(true);
              setOpen(false);
            }}
          >
            <PlusIcon size={14} />
            Novo workspace
          </button>
        </div>
      )}

      {itemMenu &&
        (() => {
          const ws = workspaces.find((w) => w.id === itemMenu.workspaceId);
          if (!ws) return null;
          return createPortal(
            <div
              ref={itemMenuRef}
              className={styles.itemMenu}
              style={{ top: itemMenu.top, left: itemMenu.left }}
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                className={styles.itemMenuEntry}
                onClick={() => {
                  setEditing({ id: ws.id, name: ws.name, description: ws.description });
                  setItemMenu(null);
                  setOpen(false);
                }}
              >
                <PencilIcon size={13} />
                Editar
              </button>
              <button
                type="button"
                role="menuitem"
                className={styles.itemMenuEntryDanger}
                disabled={!canDelete}
                title={canDelete ? undefined : 'É preciso manter ao menos um workspace'}
                onClick={() => {
                  if (!canDelete) return;
                  setPendingDelete({ id: ws.id, name: ws.name });
                  setItemMenu(null);
                  setOpen(false);
                }}
              >
                <TrashIcon size={13} />
                Excluir
              </button>
            </div>,
            document.body,
          );
        })()}

      {dialogs}
    </div>
  );
}
