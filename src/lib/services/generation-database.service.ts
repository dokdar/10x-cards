import type { SupabaseClient } from '@/db/supabase.client';
import type {
  GenerationEntity,
  GenerationErrorLogEntity,
} from '@/types';

/**
 * Data for creating a new generation record
 */
export interface CreateGenerationData {
  user_id: string;
  model: string | null;
  source_text_hash: string;
  source_text_length: number;
  generated_count: number;
  rejected_count: number;
  generation_duration: number;
}

/**
 * Data for creating a generation error log
 */
export interface CreateGenerationErrorData {
  user_id: string;
  model: string | null;
  source_text_hash: string | null;
  source_text_length: number | null;
  error_code: string | null;
  error_message: string;
}

/**
 * Service for database operations related to flashcard generations
 */
export class GenerationDatabaseService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new generation record after successful AI generation
   */
  async createGeneration(
    data: CreateGenerationData,
  ): Promise<GenerationEntity> {
    const { data: generation, error } = await this.supabase
      .from('generations')
      .insert({
        user_id: data.user_id,
        model: data.model,
        source_text_hash: data.source_text_hash,
        source_text_length: data.source_text_length,
        generated_count: data.generated_count,
        accepted_unedited_count: null,
        accepted_edited_count: null,
        rejected_count: data.rejected_count,
        generation_duration: data.generation_duration,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create generation record: ${error.message}`);
    }

    if (!generation) {
      throw new Error('Failed to create generation record: no data returned');
    }

    return generation;
  }

  /**
   * Create a generation error log when AI generation fails
   */
  async createGenerationErrorLog(
    data: CreateGenerationErrorData,
  ): Promise<GenerationErrorLogEntity> {
    const { data: errorLog, error } = await this.supabase
      .from('generation_error_logs')
      .insert({
        user_id: data.user_id,
        model: data.model,
        source_text_hash: data.source_text_hash,
        source_text_length: data.source_text_length,
        error_code: data.error_code,
        error_message: data.error_message,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create error log: ${error.message}`);
    }

    if (!errorLog) {
      throw new Error('Failed to create error log: no data returned');
    }

    return errorLog;
  }

  /**
   * Get generation by ID
   */
  async getGenerationById(
    generationId: string,
    userId: string,
  ): Promise<GenerationEntity | null> {
    const { data, error } = await this.supabase
      .from('generations')
      .select('*')
      .eq('id', generationId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch generation: ${error.message}`);
    }

    return data;
  }

  /**
   * Update generation with review session results
   */
  async updateGenerationReviewCounts(
    generationId: string,
    userId: string,
    counts: {
      accepted_unedited_count: number;
      accepted_edited_count: number;
      rejected_count: number;
    },
  ): Promise<GenerationEntity> {
    const { data, error } = await this.supabase
      .from('generations')
      .update({
        accepted_unedited_count: counts.accepted_unedited_count,
        accepted_edited_count: counts.accepted_edited_count,
        rejected_count: counts.rejected_count,
      })
      .eq('id', generationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update generation: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to update generation: no data returned');
    }

    return data;
  }
}

