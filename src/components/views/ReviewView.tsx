import { useState, useEffect } from "react";
import { ReviewControls } from "../review/ReviewControls";
import { CandidateList } from "../review/CandidateList";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useReviewSession } from "@/components/hooks/useReviewSession";
import { generationStorage } from "@/lib/utils/generation-storage";
import type { GenerationResponse } from "@/types";

interface ReviewViewProps {
  generationId: string;
}

export function ReviewView({ generationId }: ReviewViewProps) {
  const [generationData, setGenerationData] = useState<GenerationResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load generation data from sessionStorage
  useEffect(() => {
    const data = generationStorage.load(generationId);

    if (!data) {
      setLoadError("Nie znaleziono danych sesji generowania");
      return;
    }

    setGenerationData(data);
  }, [generationId]);

  // Show error state if data not found
  if (loadError) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <div className="container max-w-md">
          <Alert variant="destructive">
            <AlertTitle>Błąd</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => (window.location.href = "/")} data-testid="return-home-button">Powrót do strony głównej</Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (!generationData) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Ładowanie...</p>
      </div>
    );
  }

  return <ReviewViewContent generationData={generationData} />;
}

function ReviewViewContent({ generationData }: { generationData: GenerationResponse }) {
  const {
    candidates,
    selectedCount,
    isSaving,
    updateCandidateText,
    toggleCandidateAccept,
    rejectCandidate,
    addManualCandidate,
    saveAcceptedFlashcards,
  } = useReviewSession(generationData.candidates);

  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track unsaved changes for warning before leaving
  useEffect(() => {
    const hasChanges = candidates.some(
      (c) => c.status === "accepted" || c.status === "edited" || c.status === "rejected"
    );
    setHasUnsavedChanges(hasChanges);
  }, [candidates]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isSaving) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, isSaving]);

  const handleSave = async () => {
    setError(null);

    try {
      await saveAcceptedFlashcards(generationData.generation_id);

      // Clear session storage after successful save
      generationStorage.remove(generationData.generation_id);

      // Redirect to collection on success
      window.location.href = "/";
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił błąd podczas zapisywania fiszek";
      setError(errorMessage);

      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="flex-1 bg-background">
      <ReviewControls
        selectedCount={selectedCount}
        totalCount={candidates.length}
        isSaving={isSaving}
        onSave={handleSave}
      />

      <main className="container py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Błąd zapisu</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <CandidateList
          candidates={candidates}
          onUpdateCandidate={updateCandidateText}
          onToggleAccept={toggleCandidateAccept}
          onReject={rejectCandidate}
          onAddManualCard={addManualCandidate}
        />
      </main>
    </div>
  );
}
