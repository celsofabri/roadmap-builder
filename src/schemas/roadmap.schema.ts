import { z } from 'zod';

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

const isoDateSchema = z
  .string()
  .regex(isoDateRegex, 'Data deve estar no formato YYYY-MM-DD')
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00`).getTime()), {
    message: 'Data inválida',
  });

function withDateOrder<
  T extends { startDate: string; endDate: string },
>(schema: z.ZodType<T>) {
  return schema.refine((data) => data.startDate <= data.endDate, {
    message: 'Data de início deve ser anterior ou igual à data de fim',
    path: ['endDate'],
  });
}

const statusSchema = z.enum(['planned', 'in_progress', 'done', 'blocked']);

export const initiativeSchema = withDateOrder(
  z.object({
    id: z.string().min(1),
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    status: statusSchema.optional(),
  }),
);

export const epicSchema = withDateOrder(
  z.object({
    id: z.string().min(1),
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
    startDate: isoDateSchema,
    endDate: isoDateSchema,
    status: statusSchema.optional(),
    initiatives: z.array(initiativeSchema),
  }),
);

export const objectiveSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  color: z.string().optional(),
  epics: z.array(epicSchema),
});

export const periodSchema = withDateOrder(
  z.object({
    startDate: isoDateSchema,
    endDate: isoDateSchema,
  }),
);

export const roadmapSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  period: periodSchema,
  objectives: z.array(objectiveSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RoadmapInput = z.infer<typeof roadmapSchema>;
