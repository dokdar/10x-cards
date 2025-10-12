import { z } from 'zod';

/**
 * Validation schema for flashcard generation request
 */
export const generateFlashcardsSchema = z.object({
  source_text: z
    .string()
    .min(1000, 'Source text must be at least 1000 characters long')
    .max(10000, 'Source text must not exceed 10000 characters'),
  model: z
    .string()
    .min(1, 'Model identifier is required')
    .regex(/^[\w\/-]+$/, 'Invalid model identifier format'),
});

/**
 * Type inferred from validation schema
 */
export type GenerateFlashcardsInput = z.infer<typeof generateFlashcardsSchema>;

