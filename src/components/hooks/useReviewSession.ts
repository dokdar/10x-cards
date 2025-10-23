import { useState, useCallback } from "react";
import type { FlashcardCandidate, ReviewCandidateViewModel, CreateFlashcardCommand } from "@/types";

/**
 * Custom hook for managing review session state
 * Handles candidate list state, user interactions, and API integration
 */
export function useReviewSession(initialCandidates: FlashcardCandidate[]) {
  // Initialize candidates with UI state
  const [candidates, setCandidates] = useState<ReviewCandidateViewModel[]>(() =>
    initialCandidates.map((candidate) => ({
      ...candidate,
      id: crypto.randomUUID(),
      status: "pending" as const,
      originalFront: candidate.front,
      originalBack: candidate.back,
    }))
  );

  const [isSaving, setIsSaving] = useState(false);

  // Computed value: count of accepted/edited flashcards
  const selectedCount = candidates.filter((c) => c.status === "accepted" || c.status === "edited").length;

  /**
   * Update candidate text and mark as edited if content changed
   */
  const updateCandidateText = useCallback((id: string, field: "front" | "back", value: string) => {
    setCandidates((prev) =>
      prev.map((candidate) => {
        if (candidate.id !== id) return candidate;

        const updatedCandidate = {
          ...candidate,
          [field]: value,
        };

        // Determine if content was edited
        const isEdited =
          updatedCandidate.front !== candidate.originalFront || updatedCandidate.back !== candidate.originalBack;

        return {
          ...updatedCandidate,
          status: isEdited ? ("edited" as const) : ("accepted" as const),
        };
      })
    );
  }, []);

  /**
   * Toggle candidate acceptance status
   */
  const toggleCandidateAccept = useCallback((id: string) => {
    setCandidates((prev) =>
      prev.map((candidate) => {
        if (candidate.id !== id) return candidate;

        // Don't allow toggling rejected candidates
        if (candidate.status === "rejected") return candidate;

        // Determine if content was edited
        const isEdited = candidate.front !== candidate.originalFront || candidate.back !== candidate.originalBack;

        // Toggle between pending and accepted/edited
        const newStatus =
          candidate.status === "pending"
            ? isEdited
              ? ("edited" as const)
              : ("accepted" as const)
            : ("pending" as const);

        return {
          ...candidate,
          status: newStatus,
        };
      })
    );
  }, []);

  /**
   * Mark candidate as rejected
   */
  const rejectCandidate = useCallback((id: string) => {
    setCandidates((prev) =>
      prev.map((candidate) => (candidate.id === id ? { ...candidate, status: "rejected" as const } : candidate))
    );
  }, []);

  /**
   * Add a new manual flashcard candidate
   */
  const addManualCandidate = useCallback(() => {
    const newCandidate: ReviewCandidateViewModel = {
      id: crypto.randomUUID(),
      front: "",
      back: "",
      source: "manual",
      status: "accepted", // Auto-accept manual cards
      originalFront: "",
      originalBack: "",
    };

    setCandidates((prev) => [...prev, newCandidate]);
  }, []);

  /**
   * Save accepted flashcards to the API
   */
  const saveAcceptedFlashcards = useCallback(
    async (generationId: string) => {
      // Filter accepted/edited candidates
      const acceptedCandidates = candidates.filter((c) => c.status === "accepted" || c.status === "edited");

      // Validate: at least one flashcard must be selected
      if (acceptedCandidates.length === 0) {
        throw new Error("No flashcards selected for saving");
      }

      // Validate: all flashcards must have non-empty content
      const hasInvalidCards = acceptedCandidates.some((c) => !c.front.trim() || !c.back.trim());
      if (hasInvalidCards) {
        throw new Error("All flashcards must have non-empty front and back content");
      }

      // Transform to CreateFlashcardCommand format
      const commands: CreateFlashcardCommand[] = acceptedCandidates.map((candidate) => {
        // Determine source based on original source and edit status
        let source: "ai-full" | "ai-edited" | "manual";

        if (candidate.source === "manual") {
          // Manual cards stay manual
          source = "manual";
        } else {
          // AI-generated cards: check if edited
          const wasEdited = candidate.front !== candidate.originalFront || candidate.back !== candidate.originalBack;
          source = wasEdited ? "ai-edited" : "ai-full";
        }

        return {
          front: candidate.front,
          back: candidate.back,
          source,
          generation_id: generationId,
        };
      });

      setIsSaving(true);

      try {
        // Call API
        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(commands),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to save flashcards");
        }

        const savedFlashcards = await response.json();
        return savedFlashcards;
      } finally {
        setIsSaving(false);
      }
    },
    [candidates]
  );

  return {
    candidates,
    selectedCount,
    isSaving,
    updateCandidateText,
    toggleCandidateAccept,
    rejectCandidate,
    addManualCandidate,
    saveAcceptedFlashcards,
  };
}
