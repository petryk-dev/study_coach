import { z } from 'zod';

export const deckIdParamSchema = z.object({
  deckId: z.coerce.number().int().positive(),
});

export const quizIdParamSchema = z.object({
  quizId: z.coerce.number().int().positive(),
});

export const submitQuizSchema = z.object({
  answers: z
    .array(z.number().int().min(0).max(3), { error: 'answers must be an array of numbers from 0 to 3' })
    .min(1)
    .max(20),
});
