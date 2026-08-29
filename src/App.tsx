import { useEffect } from 'react';
import { useRoadmapStore } from '@/store/roadmapStore';
import { storageService } from '@/services/storageService';
import { RoadmapList } from '@/components/roadmap/RoadmapList';
import { RoadmapDetail } from '@/components/roadmap/RoadmapDetail';
import styles from './App.module.scss';

function App() {
  const activeRoadmap = useRoadmapStore((s) => s.activeRoadmap);
  const loadRoadmaps = useRoadmapStore((s) => s.loadRoadmaps);

  useEffect(() => {
    storageService.seedIfNeeded();
    loadRoadmaps();
  }, [loadRoadmaps]);

  return (
    <div className={styles.app}>
      {activeRoadmap ? <RoadmapDetail /> : <RoadmapList />}
    </div>
  );
}

export default App;
