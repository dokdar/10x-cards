import type { APIRoute } from "astro";
import { ZodError } from "zod";

import { FlashcardsService, FlashcardError } from "@/lib/services/flashcards.service";
import {
  createApiError,
  createJsonResponse,
  createValidationError,
  createValidationErrorFromZod,
  HTTP_STATUS,
} from "@/lib/utils/api-response";
import { CreateFlashcardsRequestSchema, FlashcardsListQuerySchema } from "@/lib/validation/flashcards.schema";
import type { CreateFlashcardCommand } from "@/types";
import { requireFeature } from "@/features";

/**
 * GET /api/flashcards
 * Lists flashcards for the authenticated user with optional pagination and search
 */
export const GET: APIRoute = async ({ request, locals }) => {
  // Guard: Check if flashcards feature is enabled
  const featureCheck = requireFeature("flashcards", "Fiszki");
  if (featureCheck) return featureCheck;

  try {
    // Guard: Check if user is authenticated
    if (!locals.user) {
      return createJsonResponse(
        createApiError("unauthorized", "Musisz być zalogowany aby przeglądać fiszki"),
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // 1. Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      search: url.searchParams.get("search"),
    };

    const validationResult = FlashcardsListQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return createJsonResponse(createValidationErrorFromZod(validationResult.error), HTTP_STATUS.BAD_REQUEST);
    }

    // 2. Call service to list flashcards
    const service = new FlashcardsService(locals.supabase);
    const result = await service.listFlashcards(locals.user.id, validationResult.data);

    // 3. Return success response
    return createJsonResponse(result, HTTP_STATUS.OK);
  } catch (error) {
    console.error("[FLASHCARDS API] Error listing flashcards:", error);

    if (error instanceof FlashcardError) {
      const statusCode = error.code === "internal_error" ? HTTP_STATUS.INTERNAL_SERVER_ERROR : HTTP_STATUS.BAD_REQUEST;
      return createJsonResponse(createApiError(error.code, error.message), statusCode);
    }

    return createJsonResponse(
      createApiError("internal_error", "Wystąpił nieoczekiwany błąd serwera"),
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * POST /api/flashcards
 * Creates one or multiple flashcards for the authenticated user
 */
export const POST: APIRoute = async ({ request, locals }) => {
  // Guard: Check if flashcards feature is enabled
  const featureCheck = requireFeature("flashcards", "Fiszki");
  if (featureCheck) return featureCheck;

  try {
    // Guard: Check if user is authenticated
    if (!locals.user) {
      return createJsonResponse(
        createApiError("unauthorized", "Musisz być zalogowany aby utworzyć fiszki"),
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // 1. Parse and validate request body
    const body = await request.json();
    const validationResult = CreateFlashcardsRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return createJsonResponse(createValidationErrorFromZod(validationResult.error), HTTP_STATUS.BAD_REQUEST);
    }

    // 2. Normalize data to array format
    const flashcardsData: CreateFlashcardCommand[] = Array.isArray(validationResult.data)
      ? validationResult.data
      : [validationResult.data];

    // 3. Create flashcards using service
    const service = new FlashcardsService(locals.supabase);
    const createdFlashcards = await service.createFlashcards(locals.user.id, flashcardsData);

    // 4. Return success response (service already returns DTOs without user_id)
    return createJsonResponse(createdFlashcards, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error("[FLASHCARDS API] Error creating flashcards:", error);

    if (error instanceof FlashcardError) {
      const statusCode = error.code === "internal_error" ? HTTP_STATUS.INTERNAL_SERVER_ERROR : HTTP_STATUS.BAD_REQUEST;
      return createJsonResponse(createApiError(error.code, error.message), statusCode);
    }

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
      "Nieprawidłowe dane fiszki",
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
      const apiError = createApiError("Database Error", "Nie udało się zapisać fiszek. Spróbuj ponownie.", {
        message: error.message,
      });

      return createJsonResponse(apiError, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    // Generic error with message
    const apiError = createApiError("Internal Server Error", error.message || "Wystąpił nieoczekiwany błąd serwera.");

    return createJsonResponse(apiError, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  // Unknown error (500 Internal Server Error)
  const apiError = createApiError("Internal Server Error", "Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie.");

  return createJsonResponse(apiError, HTTP_STATUS.INTERNAL_SERVER_ERROR);
}

/**
 * Disable prerendering for this API route
 */
export const prerender = false;
