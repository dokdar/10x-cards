import type { APIRoute } from "astro";
import { updateGenerationSchema } from "@/lib/validation/generations.schema";
import { GenerationService, GenerationError } from "@/lib/services/generation.service";
import {
  createApiError,
  createJsonResponse,
  createValidationErrorFromZod,
  HTTP_STATUS,
} from "@/lib/utils/api-response";
import { isUUID } from "@/lib/utils/validation";
import { requireFeature } from "@/features";

export const prerender = false;

/**
 * PATCH /api/generations/[id]
 * Updates a generation log with review session results for the authenticated user
 */
export const PATCH: APIRoute = async ({ request, locals, params }) => {
  // Guard: Check if generations feature is enabled
  const featureCheck = requireFeature("generations", "Generowanie");
  if (featureCheck) return featureCheck;

  try {
    // Guard: Check if user is authenticated
    if (!locals.user) {
      return createJsonResponse(
        createApiError("unauthorized", "Musisz być zalogowany aby aktualizować logi generowania"),
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // 1. Validate ID parameter
    const id = params.id;
    if (!id || !isUUID(id)) {
      return createJsonResponse(
        createApiError("bad_request", "Nieprawidłowe ID logu generowania"),
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validation = updateGenerationSchema.safeParse(body);

    if (!validation.success) {
      return createJsonResponse(createValidationErrorFromZod(validation.error), HTTP_STATUS.BAD_REQUEST);
    }

    // 3. Update generation stats using service
    const service = new GenerationService(locals.supabase);
    const updatedGeneration = await service.updateGenerationStats(locals.user.id, id, validation.data);

    // 4. Convert entity to DTO (removes user_id)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...responseDto } = updatedGeneration;

    // 5. Return success response
    return createJsonResponse(responseDto, HTTP_STATUS.OK);
  } catch (error) {
    console.error("[GENERATIONS API] Error updating generation stats:", error);

    if (error instanceof GenerationError) {
      if (error.code === "not_found") {
        return createJsonResponse(createApiError("not_found", error.message), HTTP_STATUS.NOT_FOUND);
      }
      if (error.code === "validation_error") {
        return createJsonResponse(createApiError("bad_request", error.message), HTTP_STATUS.BAD_REQUEST);
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
