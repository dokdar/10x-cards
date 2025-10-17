import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface GenerationStatusIndicatorProps {
  status: "idle" | "loading" | "error";
  errorMessage: string | null;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center space-x-2 py-8" role="status" aria-live="polite">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
        aria-hidden="true"
      />
      <p className="text-lg font-medium">Generowanie fiszek...</p>
      <span className="sr-only">Trwa generowanie fiszek</span>
    </div>
  );
}

export default function GenerationStatusIndicator({ status, errorMessage }: GenerationStatusIndicatorProps) {
  if (status === "loading") {
    return <Spinner />;
  }

  if (status === "error" && errorMessage) {
    return (
      <div role="alert" aria-live="assertive">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Błąd</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return null;
}
