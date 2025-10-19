import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { ReviewCandidateViewModel } from "@/types";

interface CandidateCardProps {
  candidate: ReviewCandidateViewModel;
  onUpdate: (id: string, field: "front" | "back", value: string) => void;
  onToggleAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function CandidateCard({ candidate, onUpdate, onToggleAccept, onReject }: CandidateCardProps) {
  const isRejected = candidate.status === "rejected";
  const isAccepted = candidate.status === "accepted" || candidate.status === "edited";
  const isEmpty = !candidate.front.trim() || !candidate.back.trim();

  return (
    <Card
      className={`transition-all ${isRejected ? "opacity-50 bg-muted/50" : ""} ${
        isAccepted && !isEmpty ? "border-primary/50 bg-primary/5" : ""
      }`}
      data-test-id="candidate-card"
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Switch
            checked={isAccepted}
            onCheckedChange={() => onToggleAccept(candidate.id)}
            disabled={isRejected || isEmpty}
            aria-label="Accept flashcard"
            data-test-id="accept-candidate-switch"
          />
          <span className="text-sm font-medium">{isAccepted ? "Zaakceptowana" : "Oczekująca"}</span>
        </div>
        {candidate.status === "edited" && <span className="text-xs text-muted-foreground">Edytowana</span>}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor={`front-${candidate.id}`} className="text-sm font-medium">
            Przód fiszki
          </label>
          <Textarea
            id={`front-${candidate.id}`}
            value={candidate.front}
            onChange={(e) => onUpdate(candidate.id, "front", e.target.value)}
            disabled={isRejected}
            placeholder="Treść na przodzie fiszki"
            className="min-h-20"
            aria-invalid={!candidate.front.trim()}
            data-test-id="flashcard-front-textarea"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor={`back-${candidate.id}`} className="text-sm font-medium">
            Tył fiszki
          </label>
          <Textarea
            id={`back-${candidate.id}`}
            value={candidate.back}
            onChange={(e) => onUpdate(candidate.id, "back", e.target.value)}
            disabled={isRejected}
            placeholder="Treść na tyle fiszki"
            className="min-h-20"
            aria-invalid={!candidate.back.trim()}
            data-test-id="flashcard-back-textarea"
          />
        </div>

        {isEmpty && !isRejected && <p className="text-sm text-destructive">Oba pola muszą zawierać tekst</p>}
      </CardContent>

      <CardFooter className="flex justify-end">
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => onReject(candidate.id)} 
          disabled={isRejected}
          data-test-id="reject-candidate-button"
        >
          {isRejected ? "Odrzucona" : "Odrzuć"}
        </Button>
      </CardFooter>
    </Card>
  );
}
