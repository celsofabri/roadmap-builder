import { useEffect } from 'react';
import { useRoadmapStore } from '@/store/roadmapStore';
import { storageService } from '@/services/storageService';
import { RoadmapList } from '@/components/roadmap/RoadmapList';
import { RoadmapDetail } from '@/components/roadmap/RoadmapDetail';

function App() {
  const activeRoadmap = useRoadmapStore((s) => s.activeRoadmap);
  const loadRoadmaps = useRoadmapStore((s) => s.loadRoadmaps);

  useEffect(() => {
    storageService.seedIfNeeded();
    loadRoadmaps();
  }, [loadRoadmaps]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {activeRoadmap ? <RoadmapDetail /> : <RoadmapList />}
    </div>
  );
}

export default App;
