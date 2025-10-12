import type { FlashcardCandidate } from '../../types';

/**
 * Configuration for AI generation service
 */
interface AIServiceConfig {
  apiKey: string;
  apiUrl: string;
  timeout: number;
  maxRetries: number;
}

/**
 * Response from OpenRouter API
 */
interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * Parameters for flashcard generation
 */
export interface GenerateFlashcardsParams {
  sourceText: string;
  model?: string;
}

/**
 * Result of flashcard generation
 */
export interface GenerationResult {
  candidates: FlashcardCandidate[];
  duration: number;
}

/**
 * Service for AI-powered flashcard generation using OpenRouter
 */
export class AIGenerationService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = config;
  }

  /**
   * Generate flashcard candidates from source text using AI
   */
  async generateFlashcards(
    params: GenerateFlashcardsParams,
  ): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      // Use default model if not provided
      const model = params.model ?? 'openai/gpt-4o';
      
      const prompt = this.buildPrompt(params.sourceText);
      const response = await this.callOpenRouter(model, prompt);
      const candidates = this.parseAIResponse(response);

      const duration = Date.now() - startTime;

      return {
        candidates,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      throw this.handleError(error, duration);
    }
  }

  /**
   * Build prompt for AI model
   */
  private buildPrompt(sourceText: string): string {
    return `You are an expert at creating educational flashcards. Your task is to analyze the provided text and generate high-quality flashcard candidates.

REQUIREMENTS:
1. Create 5-10 flashcards from the given text
2. Each flashcard must have:
   - front: A clear, concise question or prompt (max 200 characters)
   - back: A detailed, accurate answer (max 500 characters)
   - source: Always set to "ai-full" (indicating AI-generated content)
3. Focus on key concepts, definitions, and important facts
4. Questions should test understanding, not just memorization
5. Answers must be self-contained and clear

OUTPUT FORMAT:
Return a valid JSON array with the following structure:
[
  {
    "front": "Question or prompt here",
    "back": "Detailed answer here",
    "source": "ai-full"
  }
]

SOURCE TEXT:
${sourceText}

Generate the flashcards now. Return ONLY the JSON array, no additional text.`;
  }

  /**
   * Call OpenRouter API with retry logic
   */
  private async callOpenRouter(
    model: string,
    prompt: string,
  ): Promise<OpenRouterResponse> {
    // Check if API key is available
    if (!this.config.apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required for AI generation');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
          'HTTP-Referer': 'https://10x-cards.app',
          'X-Title': '10xCards',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Parse AI response and extract flashcard candidates
   */
  private parseAIResponse(response: OpenRouterResponse): FlashcardCandidate[] {
    if (!response.choices || response.choices.length === 0) {
      throw new Error('Invalid AI response: no choices returned');
    }

    const content = response.choices[0].message.content;

    try {
      // Extract JSON from response (may contain markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in AI response');
      }

      const candidates = JSON.parse(jsonMatch[0]) as FlashcardCandidate[];

      // Validate candidates structure
      if (!Array.isArray(candidates) || candidates.length === 0) {
        throw new Error('Invalid candidates format: expected non-empty array');
      }

      // Validate each candidate has required fields
      for (const candidate of candidates) {
        if (!candidate.front || !candidate.back || !candidate.source) {
          throw new Error('Invalid candidate: missing required fields');
        }
      }

      return candidates;
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown, duration: number): Error {
    if (error instanceof Error) {
      // Timeout error
      if (error.name === 'AbortError') {
        return new Error(
          `AI generation timeout after ${duration}ms (limit: ${this.config.timeout}ms)`,
        );
      }

      // Network error
      if (error.message.includes('fetch')) {
        return new Error('Network error: Unable to reach OpenRouter API');
      }

      return error;
    }

    return new Error('Unknown error during AI generation');
  }
}

/**
 * Factory function to create AI generation service with environment config
 */
export function createAIGenerationService(): AIGenerationService {
  const apiKey = import.meta.env.OPENROUTER_API_KEY || '';
  const apiUrl =
    import.meta.env.OPENROUTER_API_URL ||
    'https://openrouter.ai/api/v1/chat/completions';
  const timeout = Number(import.meta.env.AI_GENERATION_TIMEOUT) || 60000;
  const maxRetries = Number(import.meta.env.AI_MAX_RETRIES) || 3;

  return new AIGenerationService({
    apiKey,
    apiUrl,
    timeout,
    maxRetries,
  });
}

