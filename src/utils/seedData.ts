import type { Roadmap } from '@/types/roadmap.types';

function uid(): string {
  return crypto.randomUUID();
}

export function buildSeedRoadmaps(): Roadmap[] {
  const timestamp = new Date().toISOString();

  const platformRoadmap: Roadmap = {
    id: uid(),
    name: 'Plataforma',
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
        epics: [
          {
            id: uid(),
            title: 'Observabilidade unificada',
            startDate: '2026-01-01',
            endDate: '2026-03-31',
            status: 'in_progress',
            initiatives: [
              {
                id: uid(),
                title: 'Centralizar logs em um único backend',
                startDate: '2026-01-05',
                endDate: '2026-02-15',
                status: 'in_progress',
              },
              {
                id: uid(),
                title: 'Dashboards de latência por serviço',
                startDate: '2026-02-16',
                endDate: '2026-03-31',
                status: 'planned',
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
    name: 'Growth',
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

  return [platformRoadmap, growthRoadmap];
}
