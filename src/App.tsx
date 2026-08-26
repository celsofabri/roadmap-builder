import { useRoadmapStore } from '@/store/roadmapStore';
import { RoadmapList } from '@/components/roadmap/RoadmapList';
import { RoadmapDetail } from '@/components/roadmap/RoadmapDetail';

function App() {
  const activeRoadmap = useRoadmapStore((s) => s.activeRoadmap);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {activeRoadmap ? <RoadmapDetail /> : <RoadmapList />}
    </div>
  );
}

export default App;
