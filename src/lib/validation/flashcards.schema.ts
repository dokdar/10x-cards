import { z } from 'zod';

/**
 * Schema for a single flashcard creation command
 * Validates all required fields with appropriate constraints
 */
export const CreateFlashcardSchema = z.object({
  front: z
    .string()
    .min(1, 'Front text is required')
    .max(200, 'Front text must not exceed 200 characters'),
  back: z
    .string()
    .min(1, 'Back text is required')
    .max(500, 'Back text must not exceed 500 characters'),
  source: z.enum(['ai-full', 'ai-edited', 'manual'], {
    errorMap: () => ({ message: "Source must be 'ai-full', 'ai-edited', or 'manual'" }),
  }),
  generation_id: z
    .string()
    .uuid('Generation ID must be a valid UUID')
    .nullable()
    .optional(),
});

/**
 * Schema for flashcards creation request
 * Accepts either a single flashcard object or an array of flashcard objects
 */
export const CreateFlashcardsRequestSchema = z.union([
  CreateFlashcardSchema,
  z.array(CreateFlashcardSchema).min(1, 'At least one flashcard is required'),
]);

