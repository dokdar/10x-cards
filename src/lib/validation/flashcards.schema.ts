import { z } from "zod";

/**
 * Schema for a single flashcard creation command
 * Validates all required fields with appropriate constraints
 */
export const CreateFlashcardSchema = z.object({
  front: z.string().min(1, "Pole 'front' jest wymagane").max(200, "Pole 'front' nie może przekraczać 200 znaków"),
  back: z.string().min(1, "Pole 'back' jest wymagane").max(500, "Pole 'back' nie może przekraczać 500 znaków"),
  source: z.enum(["ai-full", "ai-edited", "manual"], {
    errorMap: () => ({ message: "Pole 'source' musi być 'ai-full', 'ai-edited' lub 'manual'" }),
  }),
  generation_id: z.string().uuid("Pole 'generation_id' musi być prawidłowym UUID").nullable().optional(),
});

/**
 * Schema for flashcards creation request
 * Accepts either a single flashcard object or an array of flashcard objects
 */
export const CreateFlashcardsRequestSchema = z.union([
  CreateFlashcardSchema,
  z.array(CreateFlashcardSchema).min(1, "Wymagana jest co najmniej jedna fiszka"),
]);

/**
 * Schema for updating a flashcard
 * At least one field (front or back) must be provided
 */
export const UpdateFlashcardCommandSchema = z.object({
  front: z
    .string()
    .min(1, "Pole 'front' nie może być puste")
    .max(200, "Pole 'front' nie może przekraczać 200 znaków")
    .optional(),
  back: z
    .string()
    .min(1, "Pole 'back' nie może być puste")
    .max(500, "Pole 'back' nie może przekraczać 500 znaków")
    .optional(),
});

/**
 * Schema for flashcards list query parameters
 * Provides validation for pagination and search
 */
export const FlashcardsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1, "Numer strony musi być co najmniej 1").optional().default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit musi być co najmniej 1")
    .max(100, "Limit nie może przekraczać 100")
    .optional()
    .default(20),
  search: z.string().min(1).max(200, "Zapytanie wyszukiwania nie może przekraczać 200 znaków").optional(),
});
