import { useEffect, useMemo, useRef, useState } from 'react';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { RoadmapForm } from '@/components/roadmap/RoadmapForm';
import { WorkspaceSwitcher } from '@/components/layout/WorkspaceSwitcher';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { storageService } from '@/services/storageService';
import { exportService } from '@/services/exportService';
import { importRoadmapsFromFile } from '@/services/importService';
import { formatShortDateLabel } from '@/utils/dateUtils';
import {
  CloseIcon,
  CollapseIcon,
  CopyIcon,
  DownloadIcon,
  ExpandIcon,
  MapIcon,
  MoreIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  UploadIcon,
} from '@/components/shared/Icon';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  /** Dismisses the sidebar on narrow screens, where it renders as an overlay. */
  onClose: () => void;
  /** Rail mode — desktop only. */
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

/** Up to two initials, used as the rail's stand-in for the roadmap name. */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function Sidebar({ onClose, collapsed, onToggleCollapsed }: SidebarProps) {
  const roadmaps = useRoadmapStore((s) => s.roadmaps);
  const activeRoadmap = useRoadmapStore((s) => s.activeRoadmap);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const createRoadmap = useRoadmapStore((s) => s.createRoadmap);
  const openRoadmap = useRoadmapStore((s) => s.openRoadmap);
  const renameRoadmap = useRoadmapStore((s) => s.renameRoadmap);
  const deleteRoadmap = useRoadmapStore((s) => s.deleteRoadmap);
  const duplicateRoadmap = useRoadmapStore((s) => s.duplicateRoadmap);
  const importRoadmap = useRoadmapStore((s) => s.importRoadmap);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [query, setQuery] = useState('');
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roadmaps;
    return roadmaps.filter((r) => r.name.toLowerCase().includes(q));
  }, [roadmaps, query]);

  // Any click outside an open row menu dismisses it.
  useEffect(() => {
    if (!menuId) return;
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(`[data-menu-root='true']`)) setMenuId(null);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuId(null);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuId]);

  function selectRoadmap(id: string) {
    openRoadmap(id);
    onClose();
  }

  function startRename(id: string, currentName: string) {
    setMenuId(null);
    setRenamingId(id);
    setRenameValue(currentName);
  }

  function commitRename() {
    if (renamingId && renameValue.trim()) {
      renameRoadmap(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const result = await importRoadmapsFromFile(file);
    if (!result.success || !result.roadmaps) {
      setImportError(result.error ?? 'Falha ao importar o arquivo.');
      return;
    }
    setImportError(null);
    result.roadmaps.forEach((r) => importRoadmap(r));
  }

  const dialogs = (
    <>
      {showCreateForm && (
        <RoadmapForm
          onClose={() => setShowCreateForm(false)}
          onSubmit={(input) => {
            const roadmap = createRoadmap(input);
            setShowCreateForm(false);
            selectRoadmap(roadmap.id);
          }}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Excluir roadmap"
          message={`"${pendingDelete.name}" e todo o seu conteúdo serão removidos permanentemente. Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            deleteRoadmap(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
    </>
  );

  if (collapsed) {
    return (
      <aside className={styles.sidebar}>
        <div className={`${styles.brand} ${styles.brandCollapsed}`}>
          <span className={styles.brandMark}>
            <MapIcon size={18} />
          </span>
        </div>

        <button
          type="button"
          className={styles.expandToggle}
          onClick={onToggleCollapsed}
          title="Expandir menu"
          aria-label="Expandir menu"
        >
          <ExpandIcon size={17} />
        </button>

        <WorkspaceSwitcher collapsed onRequestExpand={onToggleCollapsed} />

        <button
          type="button"
          className={`${styles.newButton} ${styles.newButtonCollapsed}`}
          onClick={() => setShowCreateForm(true)}
          title="Novo roadmap"
          aria-label="Novo roadmap"
        >
          <PlusIcon size={16} />
        </button>

        <div className={styles.railList}>
          {roadmaps.map((roadmap) => (
            <button
              key={roadmap.id}
              type="button"
              className={`${styles.railItem} ${
                activeRoadmap?.id === roadmap.id ? styles.railItemActive : ''
              }`}
              onClick={() => selectRoadmap(roadmap.id)}
              title={roadmap.name}
            >
              {initialsOf(roadmap.name)}
            </button>
          ))}
        </div>

        {importError && (
          <p className={styles.footerError} title={importError}>
            Falha ao importar
          </p>
        )}

        <div className={`${styles.footer} ${styles.footerCollapsed}`}>
          <button
            type="button"
            className={`${styles.footerButton} ${styles.footerButtonCollapsed}`}
            onClick={() =>
              exportService.exportAll(storageService.getAllRoadmaps(activeWorkspaceId ?? undefined))
            }
            title="Exportar roadmaps deste workspace"
            aria-label="Exportar roadmaps deste workspace"
          >
            <DownloadIcon size={14} />
          </button>
          <button
            type="button"
            className={`${styles.footerButton} ${styles.footerButtonCollapsed}`}
            onClick={() => fileInputRef.current?.click()}
            title="Importar roadmaps de um arquivo JSON"
            aria-label="Importar roadmaps"
          >
            <UploadIcon size={14} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            hidden
            onChange={handleFileChange}
          />
        </div>

        {dialogs}
      </aside>
    );
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>
          <MapIcon size={18} />
        </span>
        <div className={styles.brandText}>
          <div className={styles.brandName}>Roadmap Builder</div>
          <div className={styles.brandSub}>Planejamento de time</div>
        </div>
        <button
          type="button"
          className={styles.collapseToggle}
          onClick={onToggleCollapsed}
          title="Reduzir menu"
          aria-label="Reduzir menu"
        >
          <CollapseIcon size={17} />
        </button>
        <button
          type="button"
          className={styles.closeMobile}
          onClick={onClose}
          aria-label="Fechar menu"
        >
          <CloseIcon size={16} />
        </button>
      </div>

      <WorkspaceSwitcher />

      <button type="button" className={styles.newButton} onClick={() => setShowCreateForm(true)}>
        <PlusIcon size={15} />
        Novo roadmap
      </button>

      {roadmaps.length > 4 && (
        <div className={styles.searchWrap}>
          <SearchIcon size={14} className={styles.searchIcon} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar roadmap"
            className={styles.searchInput}
          />
        </div>
      )}

      <div className={styles.listHeader}>
        <span>Roadmaps</span>
        <span className={styles.count}>{filtered.length}</span>
      </div>

      <ul className={styles.list}>
        {filtered.length === 0 && (
          <li className={styles.empty}>
            {roadmaps.length === 0 ? 'Nenhum roadmap ainda.' : 'Nenhum resultado.'}
          </li>
        )}

        {filtered.map((roadmap, index) => {
          const isActive = activeRoadmap?.id === roadmap.id;
          // Flip the menu upwards for the last rows so it never opens off-screen.
          const openUpwards = filtered.length > 5 && index >= filtered.length - 2;

          if (renamingId === roadmap.id) {
            return (
              <li key={roadmap.id} className={styles.item}>
                <div className={styles.renameRow}>
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setRenamingId(null);
                    }}
                    className={styles.renameInput}
                    aria-label="Novo nome do roadmap"
                  />
                </div>
              </li>
            );
          }

          return (
            <li
              key={roadmap.id}
              data-menu-root="true"
              className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
            >
              <button
                type="button"
                className={styles.itemButton}
                onClick={() => selectRoadmap(roadmap.id)}
              >
                <div className={styles.itemName}>{roadmap.name}</div>
                <div className={styles.itemMeta}>
                  {formatShortDateLabel(roadmap.period.startDate)} –{' '}
                  {formatShortDateLabel(roadmap.period.endDate)} · {roadmap.epicCount} épico
                  {roadmap.epicCount === 1 ? '' : 's'}
                </div>
              </button>

              <button
                type="button"
                className={styles.itemMenuButton}
                data-open={menuId === roadmap.id}
                onClick={() => setMenuId(menuId === roadmap.id ? null : roadmap.id)}
                aria-label={`Ações de ${roadmap.name}`}
                aria-haspopup="menu"
                aria-expanded={menuId === roadmap.id}
              >
                <MoreIcon size={15} />
              </button>

              {menuId === roadmap.id && (
                <div className={`${styles.menu} ${openUpwards ? styles.menuUp : ''}`} role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.menuItem}
                    onClick={() => startRename(roadmap.id, roadmap.name)}
                  >
                    <PencilIcon size={14} />
                    Renomear
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.menuItem}
                    onClick={() => {
                      duplicateRoadmap(roadmap.id);
                      setMenuId(null);
                    }}
                  >
                    <CopyIcon size={14} />
                    Duplicar
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.menuItem}
                    onClick={() => {
                      const full = storageService.getRoadmap(roadmap.id);
                      if (full) exportService.exportRoadmap(full);
                      setMenuId(null);
                    }}
                  >
                    <DownloadIcon size={14} />
                    Exportar JSON
                  </button>
                  <div className={styles.menuDivider} />
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.menuItemDanger}
                    onClick={() => {
                      setPendingDelete({ id: roadmap.id, name: roadmap.name });
                      setMenuId(null);
                    }}
                  >
                    <TrashIcon size={14} />
                    Excluir
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {importError && <p className={styles.footerError}>{importError}</p>}

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.footerButton}
          onClick={() =>
            exportService.exportAll(storageService.getAllRoadmaps(activeWorkspaceId ?? undefined))
          }
          title="Exportar roadmaps deste workspace"
        >
          <DownloadIcon size={14} />
          Exportar
        </button>
        <button
          type="button"
          className={styles.footerButton}
          onClick={() => fileInputRef.current?.click()}
          title="Importar roadmaps de um arquivo JSON"
        >
          <UploadIcon size={14} />
          Importar
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={handleFileChange}
        />
      </div>

      {dialogs}
    </aside>
  );
}
