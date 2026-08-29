import { useEffect, useMemo, useRef, useState } from 'react';
import { useRoadmapStore } from '@/store/roadmapStore';
import { RoadmapForm } from '@/components/roadmap/RoadmapForm';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { storageService } from '@/services/storageService';
import { exportService } from '@/services/exportService';
import { importRoadmapsFromFile } from '@/services/importService';
import { formatShortDateLabel } from '@/utils/dateUtils';
import {
  CloseIcon,
  CopyIcon,
  DownloadIcon,
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
}

export function Sidebar({ onClose }: SidebarProps) {
  const roadmaps = useRoadmapStore((s) => s.roadmaps);
  const activeRoadmap = useRoadmapStore((s) => s.activeRoadmap);
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
          className={styles.closeMobile}
          onClick={onClose}
          aria-label="Fechar menu"
        >
          <CloseIcon size={16} />
        </button>
      </div>

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
                onClick={() => {
                  openRoadmap(roadmap.id);
                  onClose();
                }}
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
          onClick={() => exportService.exportAll(storageService.getAllRoadmaps())}
          title="Exportar todos os roadmaps"
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

      {showCreateForm && (
        <RoadmapForm
          onClose={() => setShowCreateForm(false)}
          onSubmit={(input) => {
            const roadmap = createRoadmap(input);
            setShowCreateForm(false);
            openRoadmap(roadmap.id);
            onClose();
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
    </aside>
  );
}
