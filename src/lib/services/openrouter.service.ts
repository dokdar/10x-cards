import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type {
  GenerationParams,
  OpenRouterResponse,
  OpenRouterErrorResponse,
} from './openrouter.types';
import {
  ConfigurationError,
  ApiError,
  NetworkError,
  ParsingError,
  ValidationError,
} from './openrouter.errors';

// Schema walidacji zmiennych środowiskowych
const openRouterEnvSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required.'),
  OPENROUTER_DEFAULT_MODEL: z.string().optional(),
});

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly defaultModel?: string;
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor() {
    const env = openRouterEnvSchema.safeParse(import.meta.env);

    if (!env.success) {
      throw new ConfigurationError(
        'Invalid environment variables for OpenRouterService.',
        { cause: env.error.flatten().fieldErrors }
      );
    }

    this.apiKey = env.data.OPENROUTER_API_KEY;
    this.defaultModel = env.data.OPENROUTER_DEFAULT_MODEL;
  }

  /**
   * Main public method to generate structured responses from OpenRouter API
   */
  public async generateStructuredResponse<T extends z.ZodTypeAny>(
    params: GenerationParams<T>
  ): Promise<z.infer<T>> {
    const payload = this.buildRequestPayload(params);
    const apiResponse = await this.sendApiRequest(payload);
    const validatedData = this.parseAndValidateResponse(apiResponse, params.schema);

    return validatedData;
  }

  /**
   * Builds the request payload for OpenRouter API
   */
  private buildRequestPayload<T extends z.ZodTypeAny>(
    params: GenerationParams<T>
  ): object {
    const { systemPrompt, userPrompt, schema, model, params: modelParams } = params;

    // Convert Zod schema to JSON Schema
    const fullJsonSchema = zodToJsonSchema(schema, 'responseSchema');
    
    // Extract the actual schema definition (without $ref, $schema, definitions wrapper)
    const schemaDefinition = fullJsonSchema.definitions?.responseSchema || fullJsonSchema;

    const payload = {
      model: model || this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'structured_response',
          strict: true,
          schema: schemaDefinition,
        },
      },
      ...modelParams,
    };

    return payload;
  }

  /**
   * Sends the API request to OpenRouter
   */
  private async sendApiRequest(payload: object): Promise<OpenRouterResponse> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorData: OpenRouterErrorResponse | undefined;

        try {
          errorData = (await response.json()) as OpenRouterErrorResponse;
        } catch {
          // Jeśli nie można sparsować odpowiedzi, używamy domyślnego komunikatu
        }

        throw new ApiError(
          response.status,
          errorData?.error?.message || response.statusText,
          errorData?.error?.type,
          errorData?.error?.code
        );
      }

      return (await response.json()) as OpenRouterResponse;
    } catch (error) {
      // Jeśli to już ApiError, przekazujemy dalej
      if (error instanceof ApiError) {
        throw error;
      }

      // W przeciwnym razie to błąd sieci
      throw new NetworkError('Network request failed.', { cause: error });
    }
  }

  /**
   * Parses and validates the API response against the provided schema
   */
  private parseAndValidateResponse<T extends z.ZodTypeAny>(
    apiResponse: OpenRouterResponse,
    schema: T
  ): z.infer<T> {
    const content = apiResponse.choices[0]?.message?.content;

    if (!content) {
      throw new ParsingError('No content in API response.');
    }

    try {
      const jsonData = JSON.parse(content);
      const validationResult = schema.safeParse(jsonData);

      if (!validationResult.success) {
        throw new ValidationError(
          'Response validation failed.',
          validationResult.error.flatten().fieldErrors,
          { cause: validationResult.error }
        );
      }

      return validationResult.data;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      if (error instanceof SyntaxError) {
        throw new ParsingError('Failed to parse response as JSON.', content, {
          cause: error,
        });
      }

      throw error;
    }
  }
}

