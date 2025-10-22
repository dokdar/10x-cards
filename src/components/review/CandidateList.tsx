import { CandidateCard } from "./CandidateCard";
import { Button } from "@/components/ui/button";
import type { ReviewCandidateViewModel } from "@/types";

interface CandidateListProps {
  candidates: ReviewCandidateViewModel[];
  onUpdateCandidate: (id: string, field: "front" | "back", value: string) => void;
  onToggleAccept: (id: string) => void;
  onReject: (id: string) => void;
  onAddManualCard?: () => void;
}

export function CandidateList({
  candidates,
  onUpdateCandidate,
  onToggleAccept,
  onReject,
  onAddManualCard,
}: CandidateListProps) {
  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4" data-test-id="empty-state">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium" data-test-id="empty-state-title">
            Brak fiszek do recenzji
          </p>
          <p className="text-sm text-muted-foreground" data-test-id="empty-state-description">
            Wybrano tryb manualny - utwórz fiszki samodzielnie
          </p>
        </div>
        {onAddManualCard && (
          <Button onClick={onAddManualCard} size="lg" data-test-id="add-first-flashcard-button">
            Dodaj Pierwszą Fiszkę
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-test-id="candidates-list">
      {candidates.map((candidate) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          onUpdate={onUpdateCandidate}
          onToggleAccept={onToggleAccept}
          onReject={onReject}
        />
      ))}
      {onAddManualCard && (
        <Button
          onClick={onAddManualCard}
          variant="outline"
          className="w-full"
          data-test-id="add-manual-flashcard-button"
        >
          Dodaj Kolejną Fiszkę
        </Button>
      )}
    </div>
  );
}
