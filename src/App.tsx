import { useEffect, useState } from 'react';
import { useRoadmapStore } from '@/store/roadmapStore';
import { storageService } from '@/services/storageService';
import { Sidebar } from '@/components/layout/Sidebar';
import { RoadmapDetail } from '@/components/roadmap/RoadmapDetail';
import { EmptyWorkspace } from '@/components/layout/EmptyWorkspace';
import { MenuIcon } from '@/components/shared/Icon';
import sharedStyles from '@/styles/shared.module.scss';
import styles from './App.module.scss';

function App() {
  const activeRoadmap = useRoadmapStore((s) => s.activeRoadmap);
  const loadRoadmaps = useRoadmapStore((s) => s.loadRoadmaps);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    storageService.seedIfNeeded();
    loadRoadmaps();
  }, [loadRoadmaps]);

  return (
    <div className={styles.shell}>
      <div className={`${styles.sidebarSlot} ${sidebarOpen ? styles.sidebarSlotOpen : ''}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
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
          <span className={styles.mobileBarTitle}>
            {activeRoadmap?.name ?? 'Roadmap Builder'}
          </span>
        </div>

        <div className={styles.content}>
          {activeRoadmap ? <RoadmapDetail /> : <EmptyWorkspace />}
        </div>
      </main>
    </div>
  );
}

export default App;
