import type { APIRoute } from "astro";

import { FlashcardsService, FlashcardError } from "@/lib/services/flashcards.service";
import {
  createApiError,
  createJsonResponse,
  createValidationErrorFromZod,
  HTTP_STATUS,
} from "@/lib/utils/api-response";
import { UpdateFlashcardCommandSchema } from "@/lib/validation/flashcards.schema";
import { isUUID } from "@/lib/utils/validation";
import { requireFeature } from "@/features";

/**
 * GET /api/flashcards/[id]
 * Gets a single flashcard by ID for the authenticated user
 */
export const GET: APIRoute = async ({ params, locals }) => {
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

    // 1. Validate ID parameter
    const id = params.id;
    if (!id || !isUUID(id)) {
      return createJsonResponse(createApiError("bad_request", "Nieprawidłowe ID fiszki"), HTTP_STATUS.BAD_REQUEST);
    }

    // 2. Get flashcard using service
    const service = new FlashcardsService(locals.supabase);
    const flashcard = await service.getFlashcard(locals.user.id, id);

    // 3. Return success response
    return createJsonResponse(flashcard, HTTP_STATUS.OK);
  } catch (error) {
    console.error("[FLASHCARDS API] Error getting flashcard:", error);

    if (error instanceof FlashcardError) {
      if (error.code === "not_found") {
        return createJsonResponse(createApiError("not_found", error.message), HTTP_STATUS.NOT_FOUND);
      }
      if (error.code === "forbidden") {
        return createJsonResponse(createApiError("forbidden", error.message), HTTP_STATUS.FORBIDDEN);
      }
      return createJsonResponse(createApiError(error.code, error.message), HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return createJsonResponse(
      createApiError("internal_error", "Wystąpił nieoczekiwany błąd serwera"),
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * PATCH /api/flashcards/[id]
 * Updates a flashcard for the authenticated user
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  // Guard: Check if flashcards feature is enabled
  const featureCheck = requireFeature("flashcards", "Fiszki");
  if (featureCheck) return featureCheck;

  try {
    // Guard: Check if user is authenticated
    if (!locals.user) {
      return createJsonResponse(
        createApiError("unauthorized", "Musisz być zalogowany aby edytować fiszki"),
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // 1. Validate ID parameter
    const id = params.id;
    if (!id || !isUUID(id)) {
      return createJsonResponse(createApiError("bad_request", "Nieprawidłowe ID fiszki"), HTTP_STATUS.BAD_REQUEST);
    }

    // 2. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return createJsonResponse(createApiError("bad_request", "Nieprawidłowy format JSON"), HTTP_STATUS.BAD_REQUEST);
    }

    const validationResult = UpdateFlashcardCommandSchema.safeParse(body);

    if (!validationResult.success) {
      return createJsonResponse(createValidationErrorFromZod(validationResult.error), HTTP_STATUS.BAD_REQUEST);
    }

    // 3. Check if at least one field is provided
    if (!validationResult.data.front && !validationResult.data.back) {
      return createJsonResponse(
        createApiError("bad_request", "Wymagane jest co najmniej jedno pole (front lub back)"),
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // 4. Update flashcard using service
    const service = new FlashcardsService(locals.supabase);
    const updatedFlashcard = await service.updateFlashcard(locals.user.id, id, validationResult.data);

    // 5. Return success response
    return createJsonResponse(updatedFlashcard, HTTP_STATUS.OK);
  } catch (error) {
    console.error("[FLASHCARDS API] Error updating flashcard:", error);

    if (error instanceof FlashcardError) {
      if (error.code === "not_found") {
        return createJsonResponse(createApiError("not_found", error.message), HTTP_STATUS.NOT_FOUND);
      }
      if (error.code === "forbidden") {
        return createJsonResponse(createApiError("forbidden", error.message), HTTP_STATUS.FORBIDDEN);
      }
      return createJsonResponse(createApiError(error.code, error.message), HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return createJsonResponse(
      createApiError("internal_error", "Wystąpił nieoczekiwany błąd serwera"),
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * DELETE /api/flashcards/[id]
 * Deletes a flashcard for the authenticated user
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  // Guard: Check if flashcards feature is enabled
  const featureCheck = requireFeature("flashcards", "Fiszki");
  if (featureCheck) return featureCheck;

  try {
    // Guard: Check if user is authenticated
    if (!locals.user) {
      return createJsonResponse(
        createApiError("unauthorized", "Musisz być zalogowany aby usuwać fiszki"),
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // 1. Validate ID parameter
    const id = params.id;
    if (!id || !isUUID(id)) {
      return createJsonResponse(createApiError("bad_request", "Nieprawidłowe ID fiszki"), HTTP_STATUS.BAD_REQUEST);
    }

    // 2. Delete flashcard using service
    const service = new FlashcardsService(locals.supabase);
    await service.deleteFlashcard(locals.user.id, id);

    // 3. Return success response (204 No Content)
    return new Response(null, { status: HTTP_STATUS.NO_CONTENT });
  } catch (error) {
    console.error("[FLASHCARDS API] Error deleting flashcard:", error);

    if (error instanceof FlashcardError) {
      if (error.code === "not_found") {
        return createJsonResponse(createApiError("not_found", error.message), HTTP_STATUS.NOT_FOUND);
      }
      if (error.code === "forbidden") {
        return createJsonResponse(createApiError("forbidden", error.message), HTTP_STATUS.FORBIDDEN);
      }
      return createJsonResponse(createApiError(error.code, error.message), HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return createJsonResponse(
      createApiError("internal_error", "Wystąpił nieoczekiwany błąd serwera"),
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Disable prerendering for this API route
 */
export const prerender = false;
