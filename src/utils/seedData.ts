import type { Roadmap, Workspace } from '@/types/roadmap.types';

function uid(): string {
  return crypto.randomUUID();
}

export function buildSeedWorkspaces(): { workspaces: Workspace[]; roadmaps: Roadmap[] } {
  const timestamp = new Date().toISOString();

  const platformWorkspace: Workspace = {
    id: uid(),
    name: 'Plataforma',
    description: 'Confiabilidade, escalabilidade e infraestrutura.',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const growthWorkspace: Workspace = {
    id: uid(),
    name: 'Growth',
    description: 'Aquisição e ativação de novos usuários.',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const platformRoadmap: Roadmap = {
    id: uid(),
    workspaceId: platformWorkspace.id,
    name: 'Ano fiscal 2026',
    description: 'Roadmap do time de Plataforma para o ano fiscal.',
    period: { startDate: '2026-01-01', endDate: '2026-12-31' },
    createdAt: timestamp,
    updatedAt: timestamp,
    objectives: [
      {
        id: uid(),
        title: 'Confiabilidade',
        description: 'Reduzir incidentes e melhorar observabilidade.',
        color: '#2563eb',
        owners: ['Ana Souza', 'Bruno Lima'],
        epics: [
          {
            id: uid(),
            title: 'Observabilidade unificada',
            startDate: '2026-01-01',
            endDate: '2026-03-31',
            status: 'in_progress',
            owner: 'Ana Souza',
            initiatives: [
              {
                id: uid(),
                title: 'Centralizar logs em um único backend',
                startDate: '2026-01-05',
                endDate: '2026-02-15',
                status: 'in_progress',
                owner: 'Ana Souza',
              },
              {
                id: uid(),
                title: 'Dashboards de latência por serviço',
                startDate: '2026-02-16',
                endDate: '2026-03-31',
                status: 'planned',
                owner: 'Bruno Lima',
              },
            ],
          },
          {
            id: uid(),
            title: 'Redução de downtime',
            startDate: '2026-04-01',
            endDate: '2026-06-30',
            status: 'planned',
            initiatives: [
              {
                id: uid(),
                title: 'Runbooks automatizados de incidente',
                startDate: '2026-04-01',
                endDate: '2026-05-15',
                status: 'planned',
              },
            ],
          },
        ],
      },
      {
        id: uid(),
        title: 'Escalabilidade',
        description: 'Preparar a plataforma para 10x de crescimento.',
        color: '#16a34a',
        owners: ['Carla Nunes'],
        epics: [
          {
            id: uid(),
            title: 'Migração para arquitetura multi-região',
            startDate: '2026-07-01',
            endDate: '2026-11-30',
            status: 'planned',
            initiatives: [
              {
                id: uid(),
                title: 'PoC de failover automático',
                startDate: '2026-07-01',
                endDate: '2026-08-31',
                status: 'planned',
              },
              {
                id: uid(),
                title: 'Rollout gradual por região',
                startDate: '2026-09-01',
                endDate: '2026-11-30',
                status: 'planned',
              },
            ],
          },
        ],
      },
    ],
  };

  const growthRoadmap: Roadmap = {
    id: uid(),
    workspaceId: growthWorkspace.id,
    name: 'Segundo semestre 2026',
    description: 'Roadmap do time de Growth para o segundo semestre.',
    period: { startDate: '2026-06-01', endDate: '2027-05-31' },
    createdAt: timestamp,
    updatedAt: timestamp,
    objectives: [
      {
        id: uid(),
        title: 'Ativação de novos usuários',
        color: '#d97706',
        epics: [
          {
            id: uid(),
            title: 'Onboarding guiado',
            startDate: '2026-06-01',
            endDate: '2026-08-31',
            status: 'planned',
            initiatives: [
              {
                id: uid(),
                title: 'Checklist interativo de primeiros passos',
                startDate: '2026-06-01',
                endDate: '2026-07-15',
                status: 'planned',
              },
            ],
          },
        ],
      },
    ],
  };

  return {
    workspaces: [platformWorkspace, growthWorkspace],
    roadmaps: [platformRoadmap, growthRoadmap],
  };
}
