import { z } from 'zod';

export const NOTES_MIN_CHARS = 50;
export const NOTES_MAX_CHARS = 30_000;

export const createDeckSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  text: z
    .string()
    .trim()
    .min(NOTES_MIN_CHARS, `Notes must be at least ${NOTES_MIN_CHARS} characters`)
    .max(NOTES_MAX_CHARS, `Notes must be at most ${NOTES_MAX_CHARS} characters`),
});

export const deckIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateDeckInput = z.infer<typeof createDeckSchema>;
