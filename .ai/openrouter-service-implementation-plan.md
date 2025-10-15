# Plan Implementacji Usługi OpenRouter

## 1. Opis Usługi

Usługa `OpenRouterService` będzie hermetyzować logikę komunikacji z API OpenRouter. Jej głównym zadaniem jest ułatwienie wysyłania zapytań do różnych modeli językowych (LLM) i otrzymywania ustrukturyzowanych odpowiedzi w formacie JSON. Usługa będzie odpowiedzialna za konstruowanie zapytań, zarządzanie kluczami API, obsługę odpowiedzi oraz zarządzanie błędami.

## 2. Opis Konstruktora

Konstruktor klasy `OpenRouterService` będzie inicjalizował usługę, wczytując konfigurację z zmiennych środowiskowych.

```typescript
import { z } from 'zod';

// Definicja schematu walidacji zmiennych środowiskowych
const openRouterEnvSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required."),
  // Opcjonalnie można dodać domyślny model
  OPENROUTER_DEFAULT_MODEL: z.string().optional(),
});

class OpenRouterService {
  private apiKey: string;
  private defaultModel?: string;

  constructor() {
    const env = openRouterEnvSchema.safeParse(process.env);

    if (!env.success) {
      throw new Error("Invalid environment variables for OpenRouterService.", {
        cause: env.error.flatten().fieldErrors,
      });
    }

    this.apiKey = env.data.OPENROUTER_API_KEY;
    this.defaultModel = env.data.OPENROUTER_DEFAULT_MODEL;
  }
}
```

## 3. Publiczne Metody i Pola

### `generateStructuredResponse<T extends z.ZodTypeAny>(params: GenerationParams<T>): Promise<z.infer<T>>`

Jest to główna metoda publiczna usługi. Przyjmuje parametry generowania i zwraca obiekt `Promise`, który po rozwiązaniu zawiera odpowiedź z modelu, sparsowaną i zwalidowaną zgodnie z dostarczonym schematem Zod.

#### Parametry (`GenerationParams<T>`)

-   `systemPrompt` (string): Komunikat systemowy, który instruuje model co do jego roli i zadania.
-   `userPrompt` (string): Komunikat użytkownika, czyli właściwe zapytanie.
-   `schema` (T): Schemat Zod definiujący oczekiwaną strukturę odpowiedzi JSON.
-   `model` (string, opcjonalnie): Nazwa modelu do użycia (np. `anthropic/claude-3-haiku`). Zastępuje domyślny model, jeśli jest zdefiniowany.
-   `params` (ModelParams, opcjonalnie): Dodatkowe parametry modelu, takie jak `temperature` czy `max_tokens`.

#### Przykład Użycia

```typescript
import { z } from 'zod';

const flashcardSchema = z.object({
  question: z.string(),
  answer: z.string(),
});
const flashcardsSchema = z.array(flashcardSchema);

const openRouterService = new OpenRouterService();

const flashcards = await openRouterService.generateStructuredResponse({
  systemPrompt: "You are an expert flashcard creator.",
  userPrompt: "Create 3 flashcards about TypeScript.",
  schema: flashcardsSchema,
  model: 'anthropic/claude-3-haiku'
});
// flashcards będzie teraz tablicą obiektów typu { question: string, answer: string }
```

## 4. Prywatne Metody i Pola

-   `private apiKey: string`: Przechowuje klucz API OpenRouter.
-   `private defaultModel?: string`: Przechowuje domyślną nazwę modelu.
-   `private buildRequestPayload(...)`: Metoda pomocnicza do budowania obiektu żądania (payload) na podstawie parametrów przekazanych do metody publicznej. Będzie konwertować schemat Zod na JSON Schema i formatować `messages`.
-   `private sendApiRequest(...)`: Metoda odpowiedzialna za wysyłanie żądania do API OpenRouter przy użyciu `fetch` lub `axios`. Będzie obsługiwać dodawanie nagłówków autoryzacyjnych.
-   `private parseAndValidateResponse<T>(...)`: Metoda, która pobiera odpowiedź z API, próbuje sparsować zawartość jako JSON, a następnie waliduje ją z podanym schematem Zod.

## 5. Obsługa Błędów

Usługa będzie implementować niestandardowe klasy błędów w celu zapewnienia przejrzystej i łatwej w debugowaniu obsługi problemów.

-   `OpenRouterError`: Bazowa klasa błędu.
-   `ConfigurationError`: Rzucany przez konstruktor, gdy brakuje kluczowych zmiennych środowiskowych.
-   `ApiError`: Rzucany, gdy API OpenRouter zwraca błąd (status 4xx lub 5xx). Będzie zawierał status code i wiadomość z API.
-   `NetworkError`: Rzucany w przypadku problemów z połączeniem sieciowym.
-   `ParsingError`: Rzucany, gdy odpowiedź modelu nie jest poprawnym formatem JSON.
-   `ValidationError`: Rzucany, gdy odpowiedź JSON jest poprawna, ale nie przechodzi walidacji zgodnie ze schematem Zod.

Każda metoda publiczna będzie opakowana w blok `try...catch` w celu przechwytywania i ponownego rzucania błędów jako odpowiednie, niestandardowe typy błędów.

## 6. Kwestie Bezpieczeństwa

1.  **Zarządzanie Kluczami API**: Klucz API musi być przechowywany wyłącznie w zmiennych środowiskowych (`.env`) i nigdy nie powinien być umieszczany bezpośrednio w kodzie. Plik `.env` musi być dodany do `.gitignore`.
2.  **Walidacja Danych Wejściowych**: Chociaż usługa jest przeznaczona do użytku wewnętrznego, wszystkie dane wejściowe, takie jak prompt użytkownika, powinny być traktowane jako potencjalnie niezaufane. W kontekście tej usługi, głównym ryzykiem jest `prompt injection`. Należy unikać konstruowania promptów systemowych poprzez prostą konkatenację danych od użytkownika.
3.  **Ograniczone Uprawnienia**: Klucz API OpenRouter powinien mieć skonfigurowane jak najmniejsze możliwe uprawnienia i limity finansowe w panelu OpenRouter, aby zminimalizować potencjalne szkody w przypadku wycieku.

## 7. Plan Wdrożenia Krok po Kroku

### Krok 1: Struktura Plików i Instalacja Zależności

1.  Utwórz plik dla usługi w `src/lib/services/openrouter.service.ts`.
2.  Utwórz plik dla typów i interfejsów w `src/lib/services/openrouter.types.ts`.
3.  Zainstaluj wymagane zależności: `zod` i `zod-to-json-schema`.

    ```bash
    npm install zod zod-to-json-schema
    ```

### Krok 2: Definicja Typów i Interfejsów

W pliku `src/lib/services/openrouter.types.ts` zdefiniuj interfejsy dla parametrów i odpowiedzi.

```typescript
// src/lib/services/openrouter.types.ts
import { z } from 'zod';

export interface ModelParams {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  // ... inne parametry
}

export interface GenerationParams<T extends z.ZodTypeAny> {
  systemPrompt: string;
  userPrompt: string;
  schema: T;
  model?: string;
  params?: ModelParams;
}
```

### Krok 3: Implementacja Konstruktora i Zmiennych Środowiskowych

W pliku `src/lib/services/openrouter.service.ts` zaimplementuj konstruktor zgodnie z opisem w sekcji 2. Wymagane zmienne są juz w pliku `.env` (i `.env.example`).

```
# .env
OPENROUTER_API_KEY="sk-or-..."
OPENROUTER_DEFAULT_MODEL="anthropic/claude-3-haiku"
```

### Krok 4: Implementacja Prywatnej Metody `buildRequestPayload`

Ta metoda będzie kluczowa. Musi poprawnie skonstruować obiekt `response_format`.

```typescript
// wewnątrz klasy OpenRouterService
import { zodToJsonSchema } from 'zod-to-json-schema';

private buildRequestPayload<T extends z.ZodTypeAny>(params: GenerationParams<T>) {
  const { systemPrompt, userPrompt, schema, model, params: modelParams } = params;

  const jsonSchema = zodToJsonSchema(schema, "responseSchema");

  const payload = {
    model: model || this.defaultModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'structured_response',
        strict: true,
        schema: jsonSchema,
      },
    },
    ...modelParams,
  };

  return payload;
}
```

### Krok 5: Implementacja Prywatnej Metody `sendApiRequest`

Użyj `fetch` do wysłania żądania. Dodaj odpowiednie nagłówki.

```typescript
// wewnątrz klasy OpenRouterService
private async sendApiRequest(payload: object) {
  const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Rzucenie ApiError - do zaimplementowania
      const errorData = await response.json();
      throw new Error(`API Error: ${response.status} ${response.statusText}. Details: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    // Rzucenie NetworkError - do zaimplementowania
    throw new Error("Network request failed.", { cause: error });
  }
}
```

### Krok 6: Implementacja Prywatnej Metody `parseAndValidateResponse`

Ta metoda będzie próbowała sparsować i zwalidować odpowiedź.

```typescript
// wewnątrz klasy OpenRouterService
private parseAndValidateResponse<T extends z.ZodTypeAny>(apiResponse: any, schema: T): z.infer<T> {
  const content = apiResponse.choices[0]?.message?.content;

  if (!content) {
    // Rzucenie ParsingError - brak contentu
    throw new Error("No content in API response.");
  }

  try {
    const jsonData = JSON.parse(content);
    const validationResult = schema.safeParse(jsonData);

    if (!validationResult.success) {
      // Rzucenie ValidationError
      throw new Error("Response validation failed.", { cause: validationResult.error });
    }

    return validationResult.data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Rzucenie ParsingError - nieprawidłowy JSON
      throw new Error("Failed to parse response as JSON.", { cause: error });
    }
    throw error;
  }
}
```

### Krok 7: Złożenie Wszystkiego w Metodzie Publicznej

Połącz wszystkie prywatne metody w głównej metodzie `generateStructuredResponse`.

```typescript
// wewnątrz klasy OpenRouterService
public async generateStructuredResponse<T extends z.ZodTypeAny>(params: GenerationParams<T>): Promise<z.infer<T>> {
  const payload = this.buildRequestPayload(params);
  const apiResponse = await this.sendApiRequest(payload);
  const validatedData = this.parseAndValidateResponse(apiResponse, params.schema);

  return validatedData;
}
```

### Krok 8: Implementacja Niestandardowych Błędów i Refaktoryzacja

Zastąp `new Error(...)` instancjami niestandardowych klas błędów zdefiniowanych w sekcji 5. Zapewni to lepszą kontrolę nad przepływem i obsługą błędów w aplikacji.
