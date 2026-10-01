// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeLegacyRoadmap, makeRoadmap } from '@/test/fixtures';
import { exportService } from './exportService';
import { importRoadmapsFromFile } from './importService';

function fileOf(data: unknown): File {
  return new File([JSON.stringify(data)], 'roadmap.json', { type: 'application/json' });
}

async function importOk(data: unknown) {
  const result = await importRoadmapsFromFile(fileOf(data));
  expect(result.error).toBeUndefined();
  expect(result.success).toBe(true);
  return result.roadmaps!;
}

/** Captures what exportService would download, without touching the DOM download flow. */
async function captureExport(run: () => void): Promise<string> {
  let blob: Blob | undefined;
  URL.createObjectURL = vi.fn((b: Blob) => {
    blob = b;
    return 'blob:test';
  });
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  run();
  return blob!.text();
}

beforeEach(() => {
  vi.restoreAllMocks();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('import', () => {
  it('accepts an old file with owner and keeps every responsible (O10)', async () => {
    const [roadmap] = await importOk(makeLegacyRoadmap());
    const epic = roadmap.objectives[0].epics[0];
    expect(epic.owners).toEqual(['Ana Souza']);
    expect(epic.initiatives[0].owners).toEqual(['Bruno Lima']);
    expect('owner' in epic).toBe(false);
  });

  it('accepts a new file with owners, keeping order (O11)', async () => {
    const [roadmap] = await importOk(makeRoadmap());
    expect(roadmap.objectives[0].epics[0].owners).toEqual(['Ana Souza', 'Bruno Lima']);
  });

  it('accepts a list mixing old and new roadmaps', async () => {
    const roadmaps = await importOk([makeLegacyRoadmap(), makeRoadmap()]);
    expect(roadmaps).toHaveLength(2);
    expect(roadmaps[0].objectives[0].epics[0].owners).toEqual(['Ana Souza']);
    expect(roadmaps[1].objectives[0].epics[0].owners).toEqual(['Ana Souza', 'Bruno Lima']);
  });

  it('merges owner and owners with the legacy owner first and no duplicates (O12)', async () => {
    const data = makeRoadmap();
    Object.assign(data.objectives[0].epics[0], { owner: 'Ana', owners: ['Bruno', 'ana'] });
    const [roadmap] = await importOk(data);
    expect(roadmap.objectives[0].epics[0].owners).toEqual(['Ana', 'Bruno']);
  });

  it('imports a legacy whitespace-only owner as no owner instead of rejecting the file', async () => {
    const data = makeRoadmap();
    const before = data.objectives[0].epics[0].owners;
    Object.assign(data.objectives[0].epics[0], { owner: '   ' });
    const [roadmap] = await importOk(data);
    expect(roadmap.objectives[0].epics[0].owners).toEqual(before);
  });

  it.each([
    ['a string', 'Ana'],
    ['a blank entry', ['']],
    ['a non-string entry', [123]],
  ])('rejects owners as %s with the standard message (O13)', async (_label, owners) => {
    const data = makeRoadmap();
    Object.assign(data.objectives[0].epics[0], { owners });
    const result = await importRoadmapsFromFile(fileOf(data));
    expect(result.success).toBe(false);
    expect(result.roadmaps).toBeUndefined();
    expect(result.error).toMatch(/^Roadmap inválido: campo "objectives\.0\.epics\.0\.owners(\.0)?" — /);
  });

  it('rejects an invalid legacy owner instead of dropping it silently', async () => {
    const data = makeLegacyRoadmap() as { objectives: { epics: Record<string, unknown>[] }[] };
    data.objectives[0].epics[0].owner = 123;
    const result = await importRoadmapsFromFile(fileOf(data));
    expect(result.success).toBe(false);
    expect(result.error).toContain('objectives.0.epics.0.owners');
  });

  it('does not import partially when a later roadmap is invalid', async () => {
    const bad = makeRoadmap();
    Object.assign(bad.objectives[0].epics[0], { owners: 'Ana' });
    const result = await importRoadmapsFromFile(fileOf([makeRoadmap(), bad]));
    expect(result.success).toBe(false);
    expect(result.roadmaps).toBeUndefined();
  });

  it('removes empty owners lists', async () => {
    const data = makeRoadmap();
    Object.assign(data.objectives[0].epics[0], { owners: [] });
    const [roadmap] = await importOk(data);
    expect('owners' in roadmap.objectives[0].epics[0] && roadmap.objectives[0].epics[0].owners).toBeFalsy();
  });
});

describe('export', () => {
  it('writes owners and never owner (O11)', async () => {
    const text = await captureExport(() => exportService.exportRoadmap(makeRoadmap()));
    expect(text).not.toContain('"owner"');
    expect(JSON.parse(text).objectives[0].epics[0].owners).toEqual(['Ana Souza', 'Bruno Lima']);
  });

  it('round-trips owners and their order through export and import (O11)', async () => {
    const original = makeRoadmap();
    const text = await captureExport(() => exportService.exportRoadmap(original));
    const [imported] = await importOk(JSON.parse(text));
    const [epic] = imported.objectives[0].epics;
    expect(epic.owners).toEqual(original.objectives[0].epics[0].owners);
    expect(epic.initiatives[0].owners).toEqual(original.objectives[0].epics[0].initiatives[0].owners);
    expect(epic.initiatives[1].owners).toBeUndefined();
  });
});
