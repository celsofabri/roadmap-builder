import type { Roadmap } from '@/types/roadmap.types';

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'roadmap'
  );
}

function downloadJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const exportService = {
  exportRoadmap(roadmap: Roadmap): void {
    downloadJSON(roadmap, `${slugify(roadmap.name)}.json`);
  },

  exportAll(roadmaps: Roadmap[]): void {
    downloadJSON(roadmaps, 'roadmaps.json');
  },
};
