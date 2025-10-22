import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { createFlashcards } from "@/lib/services/flashcard-database.service";
import { createApiError, createJsonResponse, createValidationError, HTTP_STATUS } from "@/lib/utils/api-response";
import { CreateFlashcardsRequestSchema } from "@/lib/validation/flashcards.schema";
import type { CreateFlashcardCommand, FlashcardDTO } from "@/types";

/**
 * POST /api/flashcards
 * Creates one or multiple flashcards for the authenticated user
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Guard: Check if user is authenticated
    if (!locals.user) {
      return createJsonResponse(
        createApiError("Unauthorized", "Musisz być zalogowany aby utworzyć fiszki"),
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // 1. Parse and validate request body
    const body = await request.json();
    const validatedData = CreateFlashcardsRequestSchema.parse(body);

    // 2. Normalize data to array format
    const flashcardsData: CreateFlashcardCommand[] = Array.isArray(validatedData) ? validatedData : [validatedData];

    // 3. Create flashcards in database
    const createdFlashcards = await createFlashcards(locals.supabase, locals.user.id, flashcardsData);

    // 4. Map entities to DTOs (remove user_id)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const flashcardsDTO: FlashcardDTO[] = createdFlashcards.map(({ user_id: _, ...flashcard }) => flashcard);

    // 5. Return success response
    return createJsonResponse(flashcardsDTO, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error("Error creating flashcards:", error);
    return handleErrorResponse(error);
  }
};

/**
 * Handle error and return appropriate HTTP response
 */
function handleErrorResponse(error: unknown): Response {
  // Validation errors (400 Bad Request)
  if (error instanceof ZodError) {
    const validationError = createValidationError(
      "Invalid flashcard data",
      error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }))
    );

    return createJsonResponse(validationError, HTTP_STATUS.BAD_REQUEST);
  }

  // Database errors
  if (error instanceof Error) {
    // Database operation errors (500 Internal Server Error)
    if (error.message.includes("Failed to create") || error.message.includes("database")) {
      const apiError = createApiError("Database Error", "Failed to save flashcards. Please try again.", {
        message: error.message,
      });

      return createJsonResponse(apiError, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    // Generic error with message
    const apiError = createApiError("Internal Server Error", error.message || "An unexpected error occurred.");

    return createJsonResponse(apiError, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  // Unknown error (500 Internal Server Error)
  const apiError = createApiError("Internal Server Error", "An unexpected error occurred. Please try again.");

  return createJsonResponse(apiError, HTTP_STATUS.INTERNAL_SERVER_ERROR);
}

/**
 * Disable prerendering for this API route
 */
export const prerender = false;
