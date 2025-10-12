import type { APIRoute } from 'astro';
import { ZodError } from 'zod';

import { DEFAULT_USER_ID } from '@/db/supabase.client';
import { createAIGenerationService } from '@/lib/services/ai-generation.service';
import { GenerationDatabaseService } from '@/lib/services/generation-database.service';
import { HashingService } from '@/lib/services/hashing.service';
import {
  createApiError,
  createJsonResponse,
  createValidationError,
  HTTP_STATUS,
} from '@/lib/utils/api-response';
import { generateFlashcardsSchema } from '@/lib/validation/generations.schema';
import type { GenerationResponse } from '@/types';

/**
 * POST /api/generations
 * Generate flashcard candidates using AI
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = Date.now();
  let sourceTextHash: string | null = null;
  let sourceTextLength: number | null = null;
  let model: string | null = null;

  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validatedData = generateFlashcardsSchema.parse(body);

    const { source_text, model: requestModel } = validatedData;
    model = requestModel ?? null;

    // 2. Prepare data - generate hash and measure length
    sourceTextHash = HashingService.generateHash(source_text);
    sourceTextLength = source_text.length;

    // MOCK: Return example data instead of calling AI and database
    const mockResponse: GenerationResponse = {
      generation_id: 'mock-generation-id-123',
      model: model,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      generated_count: 3,
      rejected_count: 0,
      generation_duration: 2500,
      created_at: new Date().toISOString(),
      candidates: [
        {
          front: 'What is TypeScript?',
          back: 'TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.',
          source: 'ai-full'
        },
        {
          front: 'What are the benefits of using Astro?',
          back: 'Astro provides faster page loads with less JavaScript, automatic code splitting, and support for multiple UI frameworks.',
          source: 'ai-full'
        },
        {
          front: 'What is Supabase?',
          back: 'Supabase is an open-source Firebase alternative that provides authentication, database, storage, and real-time subscriptions.',
          source: 'ai-full'
        }
      ]
    };

    return createJsonResponse(mockResponse, HTTP_STATUS.OK);

    // ORIGINAL CODE (commented out for mocking):
    // // 3. Generate flashcards
    // let generationResult: { candidates: any[]; duration: number };
    //
    // if (model) {
    //   // Use AI to generate flashcards
    //   const aiService = createAIGenerationService();
    //   generationResult = await aiService.generateFlashcards({
    //     sourceText: source_text,
    //     model: model,
    //   });
    // } else {
    //   // No model provided - return empty candidates list
    //   generationResult = {
    //     candidates: [],
    //     duration: 0,
    //   };
    // }
    //
    // // 4. Save generation metadata to database
    // const dbService = new GenerationDatabaseService(locals.supabase);
    // const generation = await dbService.createGeneration({
    //   user_id: DEFAULT_USER_ID,
    //   model,
    //   source_text_hash: sourceTextHash,
    //   source_text_length: sourceTextLength,
    //   generated_count: generationResult.candidates.length,
    //   rejected_count: 0, // Initially no rejections
    //   generation_duration: generationResult.duration,
    // });
    //
    // // 5. Build and return response
    // const response: GenerationResponse = {
    //   generation_id: generation.id,
    //   model: generation.model,
    //   source_text_hash: generation.source_text_hash,
    //   source_text_length: generation.source_text_length,
    //   generated_count: generation.generated_count,
    //   rejected_count: generation.rejected_count,
    //   generation_duration: generation.generation_duration,
    //   created_at: generation.created_at,
    //   candidates: generationResult.candidates,
    // };
    //
    // return createJsonResponse(response, HTTP_STATUS.OK);
  } catch (error) {
    // MOCK: Simplified error handling (no database logging)
    return handleErrorResponse(error);

    // ORIGINAL CODE (commented out for mocking):
    // // Log error to database
    // await logGenerationError({
    //   error,
    //   userId: DEFAULT_USER_ID,
    //   model,
    //   sourceTextHash,
    //   sourceTextLength,
    //   supabase: locals.supabase,
    // });
    //
    // // Return appropriate error response
    // return handleErrorResponse(error);
  }
};

/**
 * Log generation error to database
 */
async function logGenerationError({
  error,
  userId,
  model,
  sourceTextHash,
  sourceTextLength,
  supabase,
}: {
  error: unknown;
  userId: string;
  model: string | null;
  sourceTextHash: string | null;
  sourceTextLength: number | null;
  supabase: any;
}): Promise<void> {
  try {
    const dbService = new GenerationDatabaseService(supabase);
    
    let errorCode: string | null = null;
    let errorMessage = 'Unknown error';

    if (error instanceof ZodError) {
      errorCode = 'VALIDATION_ERROR';
      errorMessage = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    } else if (error instanceof Error) {
      errorMessage = error.message;
      
      // Categorize error type
      if (error.message.includes('timeout')) {
        errorCode = 'AI_TIMEOUT';
      } else if (error.message.includes('OpenRouter') || error.message.includes('API')) {
        errorCode = 'AI_API_ERROR';
      } else if (error.message.includes('parse') || error.message.includes('JSON')) {
        errorCode = 'AI_PARSE_ERROR';
      } else if (error.message.includes('Network')) {
        errorCode = 'NETWORK_ERROR';
      }
    }

    await dbService.createGenerationErrorLog({
      user_id: userId,
      model,
      source_text_hash: sourceTextHash,
      source_text_length: sourceTextLength,
      error_code: errorCode,
      error_message: errorMessage.substring(0, 1000), // Limit message length
    });
  } catch (logError) {
    // If logging fails, log to console but don't throw
    console.error('Failed to log generation error:', logError);
  }
}

/**
 * Handle error and return appropriate HTTP response
 */
function handleErrorResponse(error: unknown): Response {
  // Validation errors (400 Bad Request)
  if (error instanceof ZodError) {
    const validationError = createValidationError(
      'Invalid request data',
      error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    );

    return createJsonResponse(validationError, HTTP_STATUS.BAD_REQUEST);
  }

  // AI service errors
  if (error instanceof Error) {
    // Timeout errors (502 Bad Gateway)
    if (error.message.includes('timeout')) {
      const apiError = createApiError(
        'AI Service Timeout',
        'AI generation took too long to respond. Please try again.',
        { message: error.message },
      );

      return createJsonResponse(apiError, HTTP_STATUS.BAD_GATEWAY);
    }

    // AI API errors (502 Bad Gateway)
    if (error.message.includes('OpenRouter') || error.message.includes('Network')) {
      const apiError = createApiError(
        'AI Service Unavailable',
        'Unable to reach AI service. Please try again later.',
        { message: error.message },
      );

      return createJsonResponse(apiError, HTTP_STATUS.BAD_GATEWAY);
    }

    // Parse errors (502 Bad Gateway)
    if (error.message.includes('parse') || error.message.includes('JSON')) {
      const apiError = createApiError(
        'AI Response Error',
        'AI service returned invalid response. Please try again.',
        { message: error.message },
      );

      return createJsonResponse(apiError, HTTP_STATUS.BAD_GATEWAY);
    }

    // Database errors (500 Internal Server Error)
    if (error.message.includes('Failed to create') || error.message.includes('database')) {
      const apiError = createApiError(
        'Database Error',
        'Failed to save generation data. Please try again.',
        { message: error.message },
      );

      return createJsonResponse(apiError, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    // Generic error with message
    const apiError = createApiError(
      'Internal Server Error',
      error.message || 'An unexpected error occurred.',
    );

    return createJsonResponse(apiError, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  // Unknown error (500 Internal Server Error)
  const apiError = createApiError(
    'Internal Server Error',
    'An unexpected error occurred. Please try again.',
  );

  return createJsonResponse(apiError, HTTP_STATUS.INTERNAL_SERVER_ERROR);
}

/**
 * Disable prerendering for this API route
 */
export const prerender = false;

