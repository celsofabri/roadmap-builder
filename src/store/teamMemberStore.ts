import { create } from 'zustand';
import { storageService } from '@/services/storageService';
import { useWorkspaceStore } from '@/store/workspaceStore';
import type { TeamMember } from '@/types/roadmap.types';

export interface TeamMemberInput {
  name: string;
  photoDataUrl?: string;
}

interface TeamMemberStoreState {
  members: TeamMember[];

  loadMembers: () => void;
  createMember: (input: TeamMemberInput) => TeamMember;
  updateMember: (id: string, patch: Partial<TeamMemberInput>) => void;
  deleteMember: (id: string) => void;
}

function now(): string {
  return new Date().toISOString();
}

export const useTeamMemberStore = create<TeamMemberStoreState>((set) => ({
  members: [],

  loadMembers: () => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspaceId;
    set({ members: workspaceId ? storageService.listTeamMembers(workspaceId) : [] });
  },

  createMember: (input) => {
    const workspaceId = useWorkspaceStore.getState().activeWorkspaceId;
    if (!workspaceId) throw new Error('Nenhum workspace ativo.');
    const timestamp = now();
    const member: TeamMember = {
      id: crypto.randomUUID(),
      workspaceId,
      name: input.name,
      photoDataUrl: input.photoDataUrl,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    storageService.saveTeamMember(member);
    set({ members: storageService.listTeamMembers(workspaceId) });
    return member;
  },

  updateMember: (id, patch) => {
    const member = storageService.getTeamMember(id);
    if (!member) return;
    storageService.saveTeamMember({ ...member, ...patch, updatedAt: now() });
    set({ members: storageService.listTeamMembers(member.workspaceId) });
  },

  deleteMember: (id) => {
    const member = storageService.getTeamMember(id);
    if (!member) return;
    storageService.deleteTeamMember(id);
    set({ members: storageService.listTeamMembers(member.workspaceId) });
  },
}));

/** Case-insensitive lookup, since owner fields are free-typed names, not IDs. */
export function findMemberPhoto(members: TeamMember[], name: string | undefined): string | undefined {
  if (!name) return undefined;
  const normalized = name.trim().toLowerCase();
  return members.find((m) => m.name.trim().toLowerCase() === normalized)?.photoDataUrl;
}
