import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import SourceTextInput from '@/components/generator/SourceTextInput';
import GenerationStatusIndicator from '@/components/generator/GenerationStatusIndicator';
import { useFlashcardGeneration } from '@/components/hooks/useFlashcardGeneration';

const MIN_LENGTH = 1000;
const MAX_LENGTH = 10000;

export default function AIGeneratorView() {
  const [sourceText, setSourceText] = useState('');
  const { status, error, data, generate } = useFlashcardGeneration();

  const isValid = sourceText.length >= MIN_LENGTH && sourceText.length <= MAX_LENGTH;
  const isDisabled = !isValid || status === 'loading';

  const handleGenerate = async () => {
    if (!isValid) return;
    await generate(sourceText);
  };

  // Redirect on success
  useEffect(() => {
    if (status === 'success' && data) {
      window.location.href = `/review/${data.generation_id}`;
    }
  }, [status, data]);

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl py-6 px-4 sm:py-8 sm:px-6 lg:py-12">
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <header className="space-y-2 sm:space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Generator AI
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              Wklej tekst, a AI wygeneruje dla Ciebie propozycje fiszek do nauki.
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
              disabled={status === 'loading'}
            />

            {/* Generate Button */}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-4">
              <Button
                type="submit"
                size="lg"
                disabled={isDisabled}
                className="w-full sm:w-auto"
              >
                {status === 'loading' ? 'Generowanie...' : 'Generuj Fiszki'}
              </Button>
            </div>

            {/* Status Indicator */}
            <GenerationStatusIndicator
              status={status === 'success' ? 'idle' : status}
              errorMessage={error}
            />
          </form>
        </div>
      </div>
    </main>
  );
}

