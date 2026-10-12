import { z } from 'zod';

export const cardIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateCardSchema = z
  .object({
    front: z.string().trim().min(1).max(500).optional(),
    back: z.string().trim().min(1).max(2000).optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: 'Send front, back, or both',
  });

export type UpdateCardInput = z.infer<typeof updateCardSchema>;
