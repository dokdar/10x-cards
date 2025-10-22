# OpenRouter Service

Serwis do komunikacji z API OpenRouter, umożliwiający generowanie ustrukturyzowanych odpowiedzi z różnych modeli językowych (LLM).

## Konfiguracja

### Zmienne Środowiskowe

Wymagane zmienne w pliku `.env`:

```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_DEFAULT_MODEL=openai/gpt-4o-mini
```

- `OPENROUTER_API_KEY` - Klucz API z [OpenRouter](https://openrouter.ai/)
- `OPENROUTER_DEFAULT_MODEL` - Domyślny model (opcjonalnie, domyślnie: `openai/gpt-4o-mini`)

## Użycie

### Podstawowy Przykład

```typescript
import { z } from "zod";
import { OpenRouterService } from "@/lib/services/openrouter.service";

// Definicja schematu odpowiedzi
const flashcardSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const flashcardsSchema = z.array(flashcardSchema);

// Inicjalizacja serwisu
const openRouter = new OpenRouterService();

// Generowanie odpowiedzi
const flashcards = await openRouter.generateStructuredResponse({
  systemPrompt: "You are an expert flashcard creator.",
  userPrompt: "Create 3 flashcards about TypeScript.",
  schema: flashcardsSchema,
});

console.log(flashcards);
// [
//   { question: "What is TypeScript?", answer: "A typed superset of JavaScript..." },
//   { question: "What are interfaces?", answer: "Contracts for object shapes..." },
//   ...
// ]
```

### Użycie Niestandardowego Modelu

```typescript
const result = await openRouter.generateStructuredResponse({
  systemPrompt: "You are a helpful assistant.",
  userPrompt: "Explain quantum computing.",
  schema: z.object({
    summary: z.string(),
    complexity: z.enum(["beginner", "intermediate", "advanced"]),
  }),
  model: "anthropic/claude-3-opus", // Nadpisuje domyślny model
});
```

### Parametry Modelu

```typescript
const result = await openRouter.generateStructuredResponse({
  systemPrompt: "You are a creative writer.",
  userPrompt: "Write a short story.",
  schema: z.object({ story: z.string() }),
  params: {
    temperature: 0.8, // Większa kreatywność
    max_tokens: 500, // Limit tokenów
    top_p: 0.9,
  },
});
```

## API

### `OpenRouterService`

#### Konstruktor

```typescript
constructor();
```

Inicjalizuje serwis, wczytując i walidując zmienne środowiskowe.

**Rzuca:** `ConfigurationError` - gdy brakuje wymaganych zmiennych środowiskowych.

#### `generateStructuredResponse<T>(params: GenerationParams<T>): Promise<z.infer<T>>`

Główna metoda generująca ustrukturyzowaną odpowiedź z API.

**Parametry:**

- `systemPrompt` (string) - Instrukcja systemowa dla modelu
- `userPrompt` (string) - Zapytanie użytkownika
- `schema` (ZodSchema) - Schemat Zod definiujący strukturę odpowiedzi
- `model` (string, opcjonalnie) - Nazwa modelu (np. `openai/gpt-4o-mini`)
- `params` (ModelParams, opcjonalnie) - Dodatkowe parametry:
  - `temperature` (number) - Kontrola losowości (0-2)
  - `max_tokens` (number) - Maksymalna liczba tokenów
  - `top_p` (number) - Nucleus sampling
  - `top_k` (number) - Top-K sampling
  - `frequency_penalty` (number) - Kara za powtarzanie
  - `presence_penalty` (number) - Kara za obecność tokenów
  - `repetition_penalty` (number) - Kara za repetycję

**Zwraca:** `Promise<T>` - Zwalidowana odpowiedź zgodna ze schematem

**Rzuca:**

- `ConfigurationError` - błędna konfiguracja
- `ApiError` - błąd API (4xx, 5xx)
- `NetworkError` - błąd sieci
- `ParsingError` - odpowiedź nie jest JSON
- `ValidationError` - odpowiedź nie pasuje do schematu

## Obsługa Błędów

```typescript
import {
  ConfigurationError,
  ApiError,
  NetworkError,
  ParsingError,
  ValidationError,
} from '@/lib/services/openrouter.errors';

try {
  const result = await openRouter.generateStructuredResponse({...});
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.statusCode}: ${error.apiMessage}`);
  } else if (error instanceof NetworkError) {
    console.error('Network issue:', error.message);
  } else if (error instanceof ValidationError) {
    console.error('Invalid response format:', error.validationErrors);
  } else if (error instanceof ParsingError) {
    console.error('Failed to parse JSON:', error.rawContent);
  }
}
```

## Dostępne Modele

Popularne modele wspierane przez OpenRouter:

- `openai/gpt-4o-mini` - Szybki, ekonomiczny model GPT-4
- `openai/gpt-4o` - Najnowszy model GPT-4
- `anthropic/claude-3-haiku` - Szybki model Claude
- `anthropic/claude-3-sonnet` - Zbalansowany Claude
- `anthropic/claude-3-opus` - Najpotężniejszy Claude
- `google/gemini-pro` - Google Gemini Pro

Pełna lista: [OpenRouter Models](https://openrouter.ai/models)

## Bezpieczeństwo

1. **Klucze API**: Nigdy nie commituj pliku `.env` do repozytorium
2. **Limity**: Skonfiguruj limity wydatków w panelu OpenRouter
3. **Walidacja**: Wszystkie dane wejściowe są walidowane
4. **Prompt Injection**: Unikaj bezpośredniego wklejania danych użytkownika do system prompt

## Przykłady Użycia w Projekcie

### W API Endpoint (Astro)

```typescript
// src/pages/api/generate.ts
import type { APIRoute } from "astro";
import { OpenRouterService } from "@/lib/services/openrouter.service";
import { flashcardsSchema } from "@/lib/validation/flashcards.schema";

export const POST: APIRoute = async ({ request }) => {
  try {
    const { text } = await request.json();

    const openRouter = new OpenRouterService();
    const flashcards = await openRouter.generateStructuredResponse({
      systemPrompt: "You are an expert flashcard creator.",
      userPrompt: `Generate flashcards from: ${text}`,
      schema: flashcardsSchema,
    });

    return new Response(JSON.stringify(flashcards), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generation failed:", error);
    return new Response(JSON.stringify({ error: "Generation failed" }), {
      status: 500,
    });
  }
};
```

### W Service Layer

```typescript
// src/lib/services/flashcard-generation.service.ts
import { OpenRouterService } from "./openrouter.service";
import { flashcardsSchema } from "@/lib/validation/flashcards.schema";

export class FlashcardGenerationService {
  private openRouter: OpenRouterService;

  constructor() {
    this.openRouter = new OpenRouterService();
  }

  async generateFromText(text: string) {
    return this.openRouter.generateStructuredResponse({
      systemPrompt: "You are an expert flashcard creator...",
      userPrompt: `Create flashcards from: ${text}`,
      schema: flashcardsSchema,
      params: {
        temperature: 0.7,
        max_tokens: 2000,
      },
    });
  }
}
```
