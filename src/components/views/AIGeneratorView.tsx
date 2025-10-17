import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import SourceTextInput from "@/components/generator/SourceTextInput";
import GenerationStatusIndicator from "@/components/generator/GenerationStatusIndicator";
import { useFlashcardGeneration } from "@/components/hooks/useFlashcardGeneration";
import { generationStorage } from "@/lib/utils/generation-storage";

const MIN_LENGTH = 1000;
const MAX_LENGTH = 10000;

type GenerationMode = "ai" | "manual";

export default function AIGeneratorView() {
  const [sourceText, setSourceText] = useState("");
  const [mode, setMode] = useState<GenerationMode>("manual");
  const { status, error, data, generate } = useFlashcardGeneration();

  const isValid = sourceText.length >= MIN_LENGTH && sourceText.length <= MAX_LENGTH;
  const isDisabled = !isValid || status === "loading";

  const handleGenerate = async () => {
    if (!isValid) return;
    await generate(sourceText, mode === "ai");
  };

  // Redirect on success
  useEffect(() => {
    if (status === "success" && data) {
      // Store generation data in sessionStorage for review page
      generationStorage.save(data.generation_id, data);

      // Redirect to review page
      window.location.href = `/review/${data.generation_id}`;
    }
  }, [status, data]);

  return (
    <main className="flex-1 bg-background">
      <div className="container mx-auto max-w-4xl py-6 px-4 sm:py-8 sm:px-6 lg:py-12">
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <header className="space-y-2 sm:space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Generator Fiszek</h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Wklej tekst, a następnie wybierz sposób tworzenia fiszek.
            </p>
          </header>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGenerate();
            }}
            className="space-y-6"
          >
            {/* Source Text Input */}
            <SourceTextInput
              value={sourceText}
              onChange={setSourceText}
              minLength={MIN_LENGTH}
              maxLength={MAX_LENGTH}
              disabled={status === "loading"}
            />

            {/* Generation Mode Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Sposób tworzenia fiszek</Label>
              <RadioGroup
                value={mode}
                onValueChange={(value) => setMode(value as GenerationMode)}
                disabled={status === "loading"}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="manual" id="manual" />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="manual" className="font-medium cursor-pointer">
                      Tworzenie manualne
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Przejdź do edytora i utwórz fiszki samodzielnie na podstawie tekstu
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value="ai" id="ai" />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="ai" className="font-medium cursor-pointer">
                      Generowanie przez AI
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      AI automatycznie wygeneruje propozycje fiszek na podstawie tekstu
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Generate Button */}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-4">
              <Button type="submit" size="lg" disabled={isDisabled} className="w-full sm:w-auto">
                {status === "loading"
                  ? mode === "ai"
                    ? "Generowanie przez AI..."
                    : "Przygotowywanie..."
                  : mode === "ai"
                    ? "Generuj przez AI"
                    : "Utwórz Manualne Fiszki"}
              </Button>
            </div>

            {/* Status Indicator */}
            <GenerationStatusIndicator status={status === "success" ? "idle" : status} errorMessage={error} />
          </form>
        </div>
      </div>
    </main>
  );
}
