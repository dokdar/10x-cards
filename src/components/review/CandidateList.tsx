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
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">Brak fiszek do recenzji</p>
          <p className="text-sm text-muted-foreground">Wybrano tryb manualny - utwórz fiszki samodzielnie</p>
        </div>
        {onAddManualCard && (
          <Button onClick={onAddManualCard} size="lg">
            Dodaj Pierwszą Fiszkę
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
        <Button onClick={onAddManualCard} variant="outline" className="w-full">
          Dodaj Kolejną Fiszkę
        </Button>
      )}
    </div>
  );
}
