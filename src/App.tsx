import { useEffect, useState } from 'react';
import { useRoadmapStore } from '@/store/roadmapStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoadmapDetail } from '@/components/roadmap/RoadmapDetail';
import { EmptyWorkspace } from '@/components/layout/EmptyWorkspace';
import { MenuIcon } from '@/components/shared/Icon';
import sharedStyles from '@/styles/shared.module.scss';
import styles from './App.module.scss';

const COLLAPSED_KEY = 'roadmap-builder:sidebar-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function App() {
  const activeRoadmap = useRoadmapStore((s) => s.activeRoadmap);
  const loadRoadmaps = useRoadmapStore((s) => s.loadRoadmaps);
  const closeRoadmap = useRoadmapStore((s) => s.closeRoadmap);
  const loadWorkspaces = useWorkspaceStore((s) => s.loadWorkspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  // Re-scope the roadmap list (and drop whatever was open) whenever the
  // active workspace changes, including on the very first load.
  useEffect(() => {
    if (!activeWorkspaceId) return;
    loadRoadmaps();
    closeRoadmap();
  }, [activeWorkspaceId, loadRoadmaps, closeRoadmap]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        // Private-mode browsers can reject writes; the toggle still works for this session.
      }
      return next;
    });
  }

  return (
    <div className={styles.shell}>
      <div
        className={`${styles.sidebarSlot} ${collapsed ? styles.sidebarSlotCollapsed : ''} ${
          sidebarOpen ? styles.sidebarSlotOpen : ''
        }`}
      >
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          // The drawer always shows the full sidebar; the rail is a desktop affordance.
          collapsed={collapsed && !sidebarOpen}
          onToggleCollapsed={toggleCollapsed}
        />
      </div>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className={styles.backdrop}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className={styles.main}>
        <div className={styles.mobileBar}>
          <button
            type="button"
            className={sharedStyles.iconButton}
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu de roadmaps"
          >
            <MenuIcon />
          </button>
          <span className={styles.mobileBarTitle}>{activeRoadmap?.name ?? 'Roadmap Builder'}</span>
        </div>

        <div className={styles.content}>
          {activeRoadmap ? <RoadmapDetail /> : <EmptyWorkspace />}
        </div>
      </main>
    </div>
  );
}

export default App;
