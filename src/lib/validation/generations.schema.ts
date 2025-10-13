import { z } from 'zod';

/**
 * Validation schema for flashcard generation request
 */
export const generateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .min(1000, 'Tekst źródłowy musi mieć co najmniej 1000 znaków')
    .max(10000, 'Tekst źródłowy nie może przekroczyć 10000 znaków'),
  model: z
    .string()
    .min(1, 'Identyfikator modelu nie może być pusty')
    .regex(/^[\w\/-]+$/, 'Nieprawidłowy format identyfikatora modelu')
    .optional()
    .nullable(),
});

/**
 * Type inferred from validation schema
 */
export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;

