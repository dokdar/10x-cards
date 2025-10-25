import type { UpdateGenerationCommand, GenerationLogDTO, GenerationEntity } from "@/types";
import { GenerationDatabaseService } from "./generation-database.service";
import { SupabaseClient } from "@/db/supabase.client";

/**
 * Custom error class for generation operations
 */
export class GenerationError extends Error {
  constructor(
    message: string,
    public code: "not_found" | "forbidden" | "validation_error" | "internal_error"
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

/**
 * Service for managing generation operations
 * Handles generation log updates with proper error handling and data transformation
 */
export class GenerationService {
  private dbService: GenerationDatabaseService;

  constructor(supabase: SupabaseClient) {
    this.dbService = new GenerationDatabaseService(supabase);
  }

  /**
   * Update generation log with review session results
   * @param userId - ID of the authenticated user
   * @param generationId - ID of the generation to update
   * @param command - Review session statistics
   * @returns Updated generation entity
   */
  async updateGenerationStats(userId: string, generationId: string, command: UpdateGenerationCommand) {
    const existingGeneration = await this.dbService.getGenerationById(generationId, userId);

    if (!existingGeneration) {
      throw new GenerationError("Log generowania nie został znaleziony", "not_found");
    }

    const newCountsSum = command.accepted_unedited_count + command.accepted_edited_count + command.rejected_count;

    if (newCountsSum !== existingGeneration.generated_count) {
      throw new GenerationError(
        `Suma liczników (${newCountsSum}) nie zgadza się z liczbą wygenerowanych fiszek (${existingGeneration.generated_count}).`,
        "validation_error"
      );
    }

    const updatedGeneration = await this.dbService.updateGenerationReviewCounts(generationId, userId, command);

    return updatedGeneration;
  }

  /**
   * Convert GenerationEntity to GenerationLogDTO (removes sensitive user_id)
   * @param entity - Generation entity from database
   * @returns Generation DTO for API response
   */
  private toDTO(entity: GenerationEntity): GenerationLogDTO {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...dto } = entity;
    return dto;
  }

  /**
   * Get generation DTO by ID
   * @param userId - ID of the authenticated user
   * @param generationId - ID of the generation to retrieve
   * @returns Generation DTO
   */
  async getGenerationDTO(userId: string, generationId: string): Promise<GenerationLogDTO> {
    const generation = await this.dbService.getGenerationById(generationId, userId);

    if (!generation) {
      throw new GenerationError("Log generowania nie został znaleziony", "not_found");
    }

    return this.toDTO(generation);
  }
}
