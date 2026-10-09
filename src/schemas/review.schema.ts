import { z } from 'zod';

export const dueQuerySchema = z.object({
  deckId: z.coerce.number().int().positive().optional(),
});

export const cardIdSchema = z.object({
  cardId: z.coerce.number().int().positive(),
});

// 0 Again, 1 Hard, 2 Good, 3 Easy
export const reviewSchema = z.object({
  grade: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)], {
    error: 'Grade must be 0 (Again), 1 (Hard), 2 (Good) or 3 (Easy)',
  }),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
