import { useState } from 'react';
import type { GenerationResponse, ApiError } from '@/types';

type GenerationStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseFlashcardGenerationResult {
  status: GenerationStatus;
  error: string | null;
  data: GenerationResponse | null;
  generate: (sourceText: string) => Promise<void>;
}

export function useFlashcardGeneration(): UseFlashcardGenerationResult {
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GenerationResponse | null>(null);

  const generate = async (sourceText: string): Promise<void> => {
    setStatus('loading');
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_text: sourceText,
          model: 'openai/gpt-4o-mini',
        }),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.message || 'Wystąpił nieoczekiwany błąd');
      }

      const result: GenerationResponse = await response.json();
      setData(result);
      setStatus('success');
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Błąd połączenia. Sprawdź swoje połączenie z internetem.';
      
      setError(errorMessage);
      setStatus('error');
    }
  };

  return {
    status,
    error,
    data,
    generate,
  };
}

