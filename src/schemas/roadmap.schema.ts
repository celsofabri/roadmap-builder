import { z } from 'zod';
import { dedupeOwners } from '@/utils/owners';

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

// Epic/initiative owners: trimmed, non-blank names, de-duplicated case-insensitively
// (first spelling and order kept). An empty list is normalized to "absent".
const ownersSchema = z
  .array(z.string().trim().min(1))
  .transform(dedupeOwners)
  .transform((list) => (list.length > 0 ? list : undefined))
  .optional();

const statusSchema = z.enum(['planned', 'in_progress', 'overdue', 'done', 'blocked']);

// Base object shapes (no id / no children), reused for both persisted
// entities and form-input validation.
const initiativeBaseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  status: statusSchema.optional(),
  owners: ownersSchema,
});

const epicBaseSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  status: statusSchema.optional(),
  owners: ownersSchema,
  /** Overrides the objective's lane color for this epic; unset means "inherit". */
  color: z.string().optional(),
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

export const teamMemberInputSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
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
