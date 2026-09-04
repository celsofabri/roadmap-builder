import { z } from 'zod';

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const isoDateSchema = z
  .string()
  .regex(isoDateRegex, 'Data deve estar no formato YYYY-MM-DD')
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()), {
    message: 'Data inválida',
  });

function withDateOrder<T extends { startDate: string; endDate: string }>(
  schema: z.ZodType<T>,
) {
  return schema.refine((data) => data.startDate <= data.endDate, {
    message: 'Data de início deve ser anterior ou igual à data de fim',
    path: ['endDate'],
  });
}

const statusSchema = z.enum(['planned', 'in_progress', 'done', 'blocked']);

// Base object shapes (no id / no children), reused for both persisted
// entities and form-input validation.
const initiativeBaseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  status: statusSchema.optional(),
  owner: z.string().min(1).optional(),
});

const epicBaseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  status: statusSchema.optional(),
  owner: z.string().min(1).optional(),
});

const objectiveBaseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  color: z.string().optional(),
  owners: z.array(z.string().min(1)).optional(),
});

// Form-input schemas (what the create/edit forms validate against).
export const initiativeInputSchema = withDateOrder(initiativeBaseSchema);
export const epicInputSchema = withDateOrder(epicBaseSchema);
export const objectiveInputSchema = objectiveBaseSchema;

export const periodSchema = withDateOrder(
  z.object({
    startDate: isoDateSchema,
    endDate: isoDateSchema,
  }),
);

export const roadmapMetaInputSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  period: periodSchema,
});

export const workspaceInputSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
});

// Persisted-entity schemas (include id / children), used for JSON import.
export const initiativeSchema = withDateOrder(
  initiativeBaseSchema.extend({ id: z.string().min(1) }),
);

export const epicSchema = withDateOrder(
  epicBaseSchema.extend({
    id: z.string().min(1),
    initiatives: z.array(initiativeSchema),
  }),
);

export const objectiveSchema = objectiveBaseSchema.extend({
  id: z.string().min(1),
  epics: z.array(epicSchema),
});

export const roadmapSchema = z.object({
  id: z.string().min(1),
  // Optional so JSON exported before workspaces existed can still be imported —
  // importRoadmap() always reassigns it to the currently active workspace anyway.
  workspaceId: z.string().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  period: periodSchema,
  objectives: z.array(objectiveSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RoadmapInput = z.infer<typeof roadmapSchema>;
