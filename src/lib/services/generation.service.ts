import type { UpdateGenerationCommand } from "@/types";
import { GenerationDatabaseService } from "./generation-database.service";
import { SupabaseClient } from "@/db/supabase.client";

export class GenerationService {
  private dbService: GenerationDatabaseService;

  constructor(supabase: SupabaseClient) {
    this.dbService = new GenerationDatabaseService(supabase);
  }

  async updateGenerationStats(userId: string, generationId: string, command: UpdateGenerationCommand) {
    const existingGeneration = await this.dbService.getGenerationById(generationId, userId);

    if (!existingGeneration) {
      // This will be handled as a 404 in the API layer
      throw new Error("Generation not found or user does not have access.");
    }

    const newCountsSum = command.accepted_unedited_count + command.accepted_edited_count + command.rejected_count;

    if (newCountsSum !== existingGeneration.generated_count) {
      // This will be handled as a 400 in the API layer
      const validationError = new Error(
        `The sum of counts (${newCountsSum}) does not match the number of generated flashcards (${existingGeneration.generated_count}).`
      );
      validationError.name = "ValidationError";
      throw validationError;
    }

    const updatedGeneration = await this.dbService.updateGenerationReviewCounts(generationId, userId, command);

    return updatedGeneration;
  }
}
