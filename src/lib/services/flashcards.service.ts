import type { SupabaseClient } from "@/db/supabase.client";
import type {
  FlashcardDTO,
  FlashcardEntity,
  FlashcardsListQuery,
  FlashcardsListResponse,
  CreateFlashcardCommand,
  CreateFlashcardsCommand,
  UpdateFlashcardCommand,
  PaginationInfo,
} from "@/types";

/**
 * Custom error class for flashcard operations
 */
export class FlashcardError extends Error {
  constructor(
    message: string,
    public code: "not_found" | "forbidden" | "bad_request" | "internal_error"
  ) {
    super(message);
    this.name = "FlashcardError";
  }
}

/**
 * Service for managing flashcard operations
 * Handles all CRUD operations with proper error handling and data transformation
 */
export class FlashcardsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * List flashcards with pagination and optional search
   * @param userId - ID of the authenticated user
   * @param query - Query parameters for pagination and search
   * @returns Paginated list of flashcards
   */
  async listFlashcards(userId: string, query: FlashcardsListQuery): Promise<FlashcardsListResponse> {
    const { page = 1, limit = 20, search } = query;

    // Build base query
    let supabaseQuery = this.supabase
      .from("flashcards")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      supabaseQuery = supabaseQuery.or(`front.ilike.${searchPattern},back.ilike.${searchPattern}`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    supabaseQuery = supabaseQuery.range(from, to);

    // Execute query
    const { data, error, count } = await supabaseQuery;

    if (error) {
      console.error("[FLASHCARDS SERVICE] Error listing flashcards:", error);
      throw new FlashcardError("Nie udało się pobrać listy fiszek", "internal_error");
    }

    // Calculate pagination info
    const totalItems = count ?? 0;
    const totalPages = Math.ceil(totalItems / limit);
    const pagination: PaginationInfo = {
      total_items: totalItems,
      total_pages: totalPages,
      current_page: page,
      limit,
    };

    // Map to DTOs (exclude user_id)
    const flashcards: FlashcardDTO[] = (data ?? []).map((entity) => this.mapToDTO(entity as FlashcardEntity));

    return {
      data: flashcards,
      pagination,
    };
  }

  /**
   * Create multiple flashcards (bulk operation)
   * @param userId - ID of the authenticated user
   * @param commands - Array of flashcard creation commands
   * @returns Array of created flashcards
   */
  async createFlashcards(userId: string, commands: CreateFlashcardsCommand): Promise<FlashcardDTO[]> {
    // Map commands to insert data
    const flashcardsToInsert = commands.map((cmd) => ({
      user_id: userId,
      front: cmd.front.trim(),
      back: cmd.back.trim(),
      source: cmd.source,
      generation_id: cmd.generation_id ?? null,
    }));

    // Insert flashcards
    const { data, error } = await this.supabase.from("flashcards").insert(flashcardsToInsert).select();

    if (error) {
      console.error("[FLASHCARDS SERVICE] Error creating flashcards:", error);
      throw new FlashcardError("Nie udało się utworzyć fiszek", "internal_error");
    }

    if (!data || data.length === 0) {
      throw new FlashcardError("Nie utworzono żadnych fiszek", "internal_error");
    }

    // Map to DTOs
    return data.map((entity) => this.mapToDTO(entity as FlashcardEntity));
  }

  /**
   * Create a single flashcard
   * @param userId - ID of the authenticated user
   * @param command - Flashcard creation command
   * @returns Created flashcard
   */
  async createFlashcard(userId: string, command: CreateFlashcardCommand): Promise<FlashcardDTO> {
    const result = await this.createFlashcards(userId, [command]);
    return result[0];
  }

  /**
   * Get a single flashcard by ID
   * @param userId - ID of the authenticated user
   * @param id - Flashcard ID
   * @returns Flashcard data
   * @throws FlashcardError with code 'not_found' if flashcard doesn't exist
   */
  async getFlashcard(userId: string, id: string): Promise<FlashcardDTO> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        throw new FlashcardError("Fiszka nie została znaleziona", "not_found");
      }
      console.error("[FLASHCARDS SERVICE] Error getting flashcard:", error);
      throw new FlashcardError("Nie udało się pobrać fiszki", "internal_error");
    }

    if (!data) {
      throw new FlashcardError("Fiszka nie została znaleziona", "not_found");
    }

    return this.mapToDTO(data as FlashcardEntity);
  }

  /**
   * Update a flashcard
   * @param userId - ID of the authenticated user
   * @param id - Flashcard ID
   * @param command - Update command with fields to change
   * @returns Updated flashcard
   * @throws FlashcardError with code 'not_found' if flashcard doesn't exist
   */
  async updateFlashcard(userId: string, id: string, command: UpdateFlashcardCommand): Promise<FlashcardDTO> {
    // First check if flashcard exists and belongs to user
    await this.getFlashcard(userId, id);

    // Prepare update data
    const updateData: Partial<FlashcardEntity> = {};
    if (command.front !== undefined) {
      updateData.front = command.front.trim();
    }
    if (command.back !== undefined) {
      updateData.back = command.back.trim();
    }

    // Update flashcard
    const { data, error } = await this.supabase
      .from("flashcards")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("[FLASHCARDS SERVICE] Error updating flashcard:", error);
      throw new FlashcardError("Nie udało się zaktualizować fiszki", "internal_error");
    }

    if (!data) {
      throw new FlashcardError("Fiszka nie została znaleziona", "not_found");
    }

    return this.mapToDTO(data as FlashcardEntity);
  }

  /**
   * Delete a flashcard
   * @param userId - ID of the authenticated user
   * @param id - Flashcard ID
   * @throws FlashcardError with code 'not_found' if flashcard doesn't exist
   */
  async deleteFlashcard(userId: string, id: string): Promise<void> {
    // First check if flashcard exists and belongs to user
    await this.getFlashcard(userId, id);

    // Delete flashcard
    const { error } = await this.supabase.from("flashcards").delete().eq("id", id).eq("user_id", userId);

    if (error) {
      console.error("[FLASHCARDS SERVICE] Error deleting flashcard:", error);
      throw new FlashcardError("Nie udało się usunąć fiszki", "internal_error");
    }
  }

  /**
   * Map FlashcardEntity to FlashcardDTO (exclude user_id for security)
   * @param entity - Flashcard entity from database
   * @returns Flashcard DTO for API response
   */
  private mapToDTO(entity: FlashcardEntity): FlashcardDTO {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user_id, ...dto } = entity;
    return dto;
  }
}
