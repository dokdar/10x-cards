import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateFlashcardsCommand, FlashcardEntity } from "../../types";

/**
 * Creates one or multiple flashcards in the database
 *
 * @param supabase - Supabase client instance
 * @param userId - ID of the authenticated user
 * @param data - Array of flashcard creation commands
 * @returns Array of created flashcard entities
 * @throws Error if database operation fails
 */
export async function createFlashcards(
  supabase: SupabaseClient,
  userId: string,
  data: CreateFlashcardsCommand
): Promise<FlashcardEntity[]> {
  // Map input data to database records by adding user_id
  const flashcardsToInsert = data.map((flashcard) => ({
    user_id: userId,
    front: flashcard.front,
    back: flashcard.back,
    source: flashcard.source,
    generation_id: flashcard.generation_id ?? null,
  }));

  // Insert flashcards into database
  const { data: insertedFlashcards, error } = await supabase.from("flashcards").insert(flashcardsToInsert).select();

  if (error) {
    throw new Error(`Failed to create flashcards: ${error.message}`);
  }

  if (!insertedFlashcards || insertedFlashcards.length === 0) {
    throw new Error("No flashcards were created");
  }

  return insertedFlashcards as FlashcardEntity[];
}
