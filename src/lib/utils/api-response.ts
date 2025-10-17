import type { ApiError, ValidationApiError } from "@/types";

/**
 * Create a standardized API error response
 */
export function createApiError(error: string, message: string, details?: Record<string, any>): ApiError {
  return {
    error,
    message,
    ...(details && { details }),
  };
}

/**
 * Create a validation error response
 */
export function createValidationError(
  message: string,
  validationErrors: { field: string; message: string }[]
): ValidationApiError {
  return {
    error: "Validation Error",
    message,
    validation_errors: validationErrors,
  };
}

/**
 * Create a JSON response with proper headers
 */
export function createJsonResponse(data: any, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * HTTP status codes for common API responses
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;
