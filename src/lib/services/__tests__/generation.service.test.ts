import { describe, it, expect, vi, beforeEach } from "vitest";
import { GenerationService } from "../generation.service";
import { GenerationDatabaseService } from "../generation-database.service";
import type { GenerationEntity } from "@/types";
import type { SupabaseClient } from "@/db/supabase.client";

// Mock the entire module
vi.mock("../generation-database.service");

describe("GenerationService", () => {
  let generationService: GenerationService;
  let mockDbServiceInstance: vi.Mocked<GenerationDatabaseService>;

  const mockSupabase = {} as unknown as SupabaseClient;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    vi.mocked(GenerationDatabaseService).mockClear();

    // Create a controlled mock instance
    mockDbServiceInstance = new (vi.mocked(GenerationDatabaseService))() as vi.Mocked<GenerationDatabaseService>;

    // Tell the mocked constructor to return our controlled instance
    vi.mocked(GenerationDatabaseService).mockImplementation(() => mockDbServiceInstance);

    // Now, the GenerationService constructor will receive our mock instance
    generationService = new GenerationService(mockSupabase);
  });

  const userId = "user-123";
  const generationId = "gen-456";
  const mockGeneration: GenerationEntity = {
    id: generationId,
    user_id: userId,
    generated_count: 20,
    // other fields are not relevant for this test
  } as GenerationEntity;

  it("should throw an error if generation is not found", async () => {
    // Arrange: mock the db call to return null
    mockDbServiceInstance.getGenerationById.mockResolvedValue(null);

    const command = {
      accepted_unedited_count: 10,
      accepted_edited_count: 5,
      rejected_count: 5,
    };

    // Act & Assert
    await expect(generationService.updateGenerationStats(userId, generationId, command)).rejects.toThrow(
      "Generation not found or user does not have access."
    );
  });

  it("should throw a validation error if the sum of counts does not match generated_count", async () => {
    // Arrange: mock the db call to return the generation
    mockDbServiceInstance.getGenerationById.mockResolvedValue(mockGeneration);

    const command = {
      accepted_unedited_count: 10,
      accepted_edited_count: 5,
      rejected_count: 4, // 10 + 5 + 4 = 19 != 20
    };

    // Act & Assert
    await expect(generationService.updateGenerationStats(userId, generationId, command)).rejects.toThrow(
      "The sum of counts (19) does not match the number of generated flashcards (20)."
    );
  });

  it("should call updateGenerationReviewCounts with correct parameters on success", async () => {
    // Arrange
    mockDbServiceInstance.getGenerationById.mockResolvedValue(mockGeneration);
    const updatedGeneration = { ...mockGeneration, rejected_count: 5 };
    mockDbServiceInstance.updateGenerationReviewCounts.mockResolvedValue(updatedGeneration);

    const command = {
      accepted_unedited_count: 10,
      accepted_edited_count: 5,
      rejected_count: 5, // 10 + 5 + 5 = 20
    };

    // Act
    const result = await generationService.updateGenerationStats(userId, generationId, command);

    // Assert
    expect(mockDbServiceInstance.getGenerationById).toHaveBeenCalledWith(generationId, userId);
    expect(mockDbServiceInstance.updateGenerationReviewCounts).toHaveBeenCalledWith(generationId, userId, command);
    expect(result).toEqual(updatedGeneration);
  });
});
