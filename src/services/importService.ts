import { roadmapSchema } from '@/schemas/roadmap.schema';
import type { Roadmap } from '@/types/roadmap.types';
import { regenerateRoadmapIds } from '@/utils/cloneRoadmap';

export interface ImportResult {
  success: boolean;
  roadmaps?: Roadmap[];
  error?: string;
}

export async function importRoadmapsFromFile(file: File): Promise<ImportResult> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return { success: false, error: 'Não foi possível ler o arquivo.' };
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { success: false, error: 'O arquivo não contém um JSON válido.' };
  }

  const candidates = Array.isArray(json) ? json : [json];
  if (candidates.length === 0) {
    return { success: false, error: 'O arquivo não contém nenhum roadmap.' };
  }

  const roadmaps: Roadmap[] = [];
  for (const candidate of candidates) {
    const result = roadmapSchema.safeParse(candidate);
    if (!result.success) {
      const issue = result.error.issues[0];
      const path = issue.path.join('.') || '(raiz)';
      return {
        success: false,
        error: `Roadmap inválido: campo "${path}" — ${issue.message}`,
      };
    }
    // Regenerate every id to avoid collisions with roadmaps already stored locally.
    roadmaps.push(regenerateRoadmapIds(result.data));
  }

  return { success: true, roadmaps };
}
