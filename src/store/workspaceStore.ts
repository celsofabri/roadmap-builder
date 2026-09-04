import { create } from 'zustand';
import { storageService } from '@/services/storageService';
import type { Workspace, WorkspaceSummary } from '@/types/roadmap.types';

export interface WorkspaceInput {
  name: string;
  description?: string;
  iconDataUrl?: string;
}

interface WorkspaceStoreState {
  workspaces: WorkspaceSummary[];
  activeWorkspaceId: string | null;

  loadWorkspaces: () => void;
  createWorkspace: (input: WorkspaceInput) => Workspace;
  updateWorkspace: (id: string, patch: Partial<WorkspaceInput>) => void;
  deleteWorkspace: (id: string) => void;
  switchWorkspace: (id: string) => void;
}

function now(): string {
  return new Date().toISOString();
}

export const useWorkspaceStore = create<WorkspaceStoreState>((set, get) => ({
  workspaces: [],
  activeWorkspaceId: null,

  loadWorkspaces: () => {
    storageService.initializeIfNeeded();
    set({
      workspaces: storageService.listWorkspaces(),
      activeWorkspaceId: storageService.getActiveWorkspaceId(),
    });
  },

  createWorkspace: (input) => {
    const timestamp = now();
    const workspace: Workspace = {
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description,
      iconDataUrl: input.iconDataUrl,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    storageService.saveWorkspace(workspace);
    storageService.setActiveWorkspaceId(workspace.id);
    set({ workspaces: storageService.listWorkspaces(), activeWorkspaceId: workspace.id });
    return workspace;
  },

  updateWorkspace: (id, patch) => {
    const workspace = storageService.getWorkspace(id);
    if (!workspace) return;
    storageService.saveWorkspace({ ...workspace, ...patch, updatedAt: now() });
    set({ workspaces: storageService.listWorkspaces() });
  },

  deleteWorkspace: (id) => {
    // Always keep at least one workspace — the roadmap list assumes an active one exists.
    if (get().workspaces.length <= 1) return;
    const remaining = get().workspaces.filter((w) => w.id !== id);
    storageService.deleteWorkspace(id);

    let activeWorkspaceId = get().activeWorkspaceId;
    if (activeWorkspaceId === id) {
      activeWorkspaceId = remaining[0].id;
      storageService.setActiveWorkspaceId(activeWorkspaceId);
    }
    set({ workspaces: storageService.listWorkspaces(), activeWorkspaceId });
  },

  switchWorkspace: (id) => {
    if (get().activeWorkspaceId === id) return;
    storageService.setActiveWorkspaceId(id);
    set({ activeWorkspaceId: id });
  },
}));
