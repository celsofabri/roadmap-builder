import type { Roadmap } from '@/types/roadmap.types';

type Loose = Record<string, unknown>;

function isRecord(value: unknown): value is Loose {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Trims, drops blanks and removes case-insensitive duplicates, keeping the first spelling
 * and the original order. Same comparison as `findMemberPhoto` and the objective form.
 */
export function dedupeOwners(list: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of list) {
    const name = entry.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }
  return result;
}

/**
 * Folds the legacy single `owner` into `owners` (legacy first), removes the `owner` key and
 * turns an empty list into an absent field. Pure: never mutates the input.
 *
 * It deliberately does NOT validate types: blank or non-string entries, and an `owners` that
 * is not an array, are kept as they came so the import schema can reject them instead of
 * silently losing data. Only well-formed names are trimmed and de-duplicated.
 */
export function mergeLegacyOwner<T extends object>(item: T): Omit<T, 'owner'> {
  const { owner, owners, ...rest } = item as Loose;
  const base = rest as Omit<T, 'owner'>;

  // A blank legacy string (older exports allowed "   ") means "no owner", not invalid data.
  const hasLegacy =
    owner !== undefined && owner !== null && !(typeof owner === 'string' && owner.trim() === '');
  if (!hasLegacy && owners === undefined) return base;

  // Not an array: leave it untouched for the schema to flag.
  if (owners !== undefined && !Array.isArray(owners)) {
    return { ...base, owners } as Omit<T, 'owner'>;
  }

  const combined: unknown[] = [...(hasLegacy ? [owner] : []), ...((owners as unknown[]) ?? [])];
  const seen = new Set<string>();
  const merged: unknown[] = [];
  for (const entry of combined) {
    if (typeof entry === 'string' && entry.trim()) {
      const name = entry.trim();
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(name);
    } else {
      merged.push(entry);
    }
  }

  return (merged.length > 0 ? { ...base, owners: merged } : base) as Omit<T, 'owner'>;
}

/**
 * Import-time pass: applies `mergeLegacyOwner` to every epic and initiative of a raw roadmap
 * (no sanitizing, so the strict schema still sees and rejects invalid values). Pure.
 */
export function mergeLegacyOwnersDeep(raw: unknown): unknown {
  if (!isRecord(raw) || !Array.isArray(raw.objectives)) return raw;
  return {
    ...raw,
    objectives: raw.objectives.map((objective: unknown) => {
      if (!isRecord(objective) || !Array.isArray(objective.epics)) return objective;
      return {
        ...objective,
        epics: objective.epics.map((epic: unknown) => {
          if (!isRecord(epic)) return epic;
          const merged = mergeLegacyOwner(epic) as Loose;
          return Array.isArray(merged.initiatives)
            ? {
                ...merged,
                initiatives: merged.initiatives.map((i: unknown) =>
                  isRecord(i) ? mergeLegacyOwner(i) : i,
                ),
              }
            : merged;
        }),
      };
    }),
  };
}

export interface OwnersMigrationReport {
  roadmap: Roadmap;
  /** Epics/initiatives that still carried a legacy `owner`. */
  migrated: number;
  /** Blank or non-string entries dropped from `owners`. */
  discarded: number;
}

function migrateItem(item: unknown, report: { migrated: number; discarded: number }): unknown {
  if (!isRecord(item)) return item;
  if ('owner' in item) report.migrated += 1;
  const merged = mergeLegacyOwner(item) as Loose;
  if (!Array.isArray(merged.owners)) {
    // A non-array `owners` is corrupt: drop it rather than crash the UI.
    if ('owners' in merged) {
      report.discarded += 1;
      const { owners: _dropped, ...rest } = merged;
      return rest;
    }
    return merged;
  }
  const valid = merged.owners.filter((o): o is string => typeof o === 'string' && o.trim() !== '');
  report.discarded += merged.owners.length - valid.length;
  const owners = dedupeOwners(valid);
  const { owners: _previous, ...rest } = merged;
  return owners.length > 0 ? { ...rest, owners } : rest;
}

/**
 * Lenient, in-memory migration used when reading from storage: walks
 * objectives -> epics -> initiatives, tolerates unexpected shapes, never mutates the input,
 * is idempotent and does not touch `updatedAt`.
 */
export function migrateRoadmapOwnersWithReport(raw: unknown): OwnersMigrationReport {
  const report = { migrated: 0, discarded: 0 };
  if (!isRecord(raw) || !Array.isArray(raw.objectives)) {
    return { roadmap: raw as Roadmap, ...report };
  }
  const objectives = raw.objectives.map((objective) => {
    if (!isRecord(objective) || !Array.isArray(objective.epics)) return objective;
    const epics = objective.epics.map((epic) => {
      const migratedEpic = migrateItem(epic, report);
      if (!isRecord(migratedEpic) || !Array.isArray(migratedEpic.initiatives)) return migratedEpic;
      return {
        ...migratedEpic,
        initiatives: migratedEpic.initiatives.map((i: unknown) => migrateItem(i, report)),
      };
    });
    return { ...objective, epics };
  });
  return { roadmap: { ...raw, objectives } as unknown as Roadmap, ...report };
}

export function migrateRoadmapOwners(raw: unknown): Roadmap {
  return migrateRoadmapOwnersWithReport(raw).roadmap;
}

/** Tooltip line for a bar/row: "" (none), "Responsável: X" (one) or "Responsáveis: A, B" (2+). */
export function ownersTooltipLine(owners: string[] | undefined): string {
  if (!owners || owners.length === 0) return '';
  return `${owners.length === 1 ? 'Responsável' : 'Responsáveis'}: ${owners.join(', ')}`;
}
