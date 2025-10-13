# API Endpoint Implementation Plan: Generate Flashcard Candidates

## 1. Przegląd punktu końcowego
Ten punkt końcowy inicjuje proces generowania fiszek przy użyciu sztucznej inteligencji. Otrzymuje tekst źródłowy od użytkownika, komunikuje się z zewnętrzną usługą AI w celu wygenerowania propozycji fiszek, loguje metadane dotyczące próby generacji i zwraca listę kandydatów do przejrzenia przez użytkownika.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `POST`
-   **Struktura URL**: `/api/generations`
-   **Ciało Żądania**:
    ```json
    {
      "source_text": "Długi tekst między 1000 a 10000 znaków...",
      "model": "openai/gpt-4o"
    }
    ```
-   **Parametry**:
    -   **Wymagane**: `source_text` (string, min: 1000, max: 10000)
    -   **Opcjonalne**: `model` (string, domyślnie: `openai/gpt-4o`)

## 3. Wykorzystywane typy
-   **Request Command**: `GenerateFlashcardsCommand`
-   **Success Response DTO**: `GenerationResponse`
-   **AI Interaction Candidate**: `FlashcardCandidate`
-   **Database Entities**: `GenerationEntity`, `GenerationErrorLogEntity`
-   **Error Responses**: `ApiError`, `ValidationApiError`

## 4. Szczegóły odpowiedzi
-   **Pomyślna odpowiedź (200 OK)**:
    ```json
    {
      "generation_id": "c3e4b7a1-8e1d-4f2a-8b8a-1e3d4a5b6c7d",
      "model": "openai/gpt-4o",
      "source_text_hash": "md5:a1b2c3d4e5f6...",
      "source_text_length": 5847,
      "generated_count": 2,
      "rejected_count": 0,
      "generation_duration": 15234,
      "created_at": "2024-10-12T14:30:00.000Z",
      "candidates": [
        { "front": "...", "back": "...", "source": "ai-full" },
        { "front": "...", "back": "...", "source": "ai-full" }
      ]
    }
    ```
-   **Odpowiedzi błędów**:
    -   `400 Bad Request`: Nieprawidłowe dane wejściowe.
    -   `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
    -   `500 Internal Server Error`: Wewnętrzny błąd serwera.
    -   `502 Bad Gateway`: Błąd komunikacji z zewnętrzną usługą AI.

## 5. Przepływ danych
1.  Żądanie `POST` trafia do endpointu `/api/generations`.
2.  Middleware Astro (`src/middleware/index.ts`) weryfikuje sesję użytkownika Supabase. Jeśli jest nieprawidłowa, zwraca `401`.
3.  Handler endpointu (`src/pages/api/generations.ts`) parsuje i waliduje ciało żądania przy użyciu schemy Zod (`src/lib/validation/generations.schema.ts`). W przypadku błędu zwraca `400`.
4.  Mierzony jest czas rozpoczęcia operacji.
5.  `HashingService` oblicza hash `md5` z `source_text`.
6.  `AiGenerationService` jest wywoływany z `source_text` i `model`.
    -   Serwis konstruuje odpowiedni prompt systemowy i wysyła zapytanie do zewnętrznego API (np. OpenRouter), ustawiając **timeout na 60 sekund**.
    -   Oczekuje na odpowiedź i parsuje ją do listy obiektów `FlashcardCandidate`.
    -   W przypadku błędu komunikacji lub nieprawidłowego formatu odpowiedzi, serwis rzuca wyjątek.
7.  Mierzony jest czas zakończenia operacji i obliczany jest `generation_duration`.
8.  `GenerationDatabaseService` jest wywoływany w celu zapisania wyniku w tabeli `app.generations`.
9.  Endpoint konstruuje odpowiedź `GenerationResponse` i zwraca ją do klienta z kodem `200 OK`.
10. W przypadku przechwycenia wyjątku (np. z `AiGenerationService`), `GenerationDatabaseService` jest wywoływany w celu zapisania błędu w `app.generation_error_logs`, a do klienta zwracany jest odpowiedni kod błędu (`502` lub `500`).

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Każde żądanie musi być uwierzytelnione. Middleware Astro będzie odpowiedzialne za weryfikację tokenu JWT Supabase i dołączenie `context.locals.user` oraz `context.locals.supabase`.
-   **Autoryzacja**: Każdy uwierzytelniony użytkownik może korzystać z tej funkcji. Dostęp do danych jest ograniczony przez RLS (Row-Level Security) w Supabase, zapewniając, że użytkownicy mogą operować tylko na własnych zasobach.
-   **Walidacja wejścia**: Zod będzie używany do ścisłej walidacji `source_text` i `model`, chroniąc przed nieoczekiwanymi danymi i potencjalnymi atakami.
-   **Zarządzanie sekretami**: Klucze API do usług AI będą przechowywane jako zmienne środowiskowe po stronie serwera (`import.meta.env`) i nigdy nie będą dostępne dla klienta.

## 7. Obsługa błędów
| Scenariusz Błędu                                       | Kod Statusu HTTP | Akcja Logowania                                                                          | Komunikat dla Użytkownika                            |
| ------------------------------------------------------ | ------------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Błąd walidacji `source_text` lub `model`                 | `400 Bad Request`  | Brak logowania w `app.generation_error_logs`.                                          | "Nieprawidłowe dane wejściowe" z szczegółami walidacji. |
| Brak lub nieprawidłowy token uwierzytelniający        | `401 Unauthorized` | Brak logowania (obsługiwane przez middleware).                                         | "Brak autoryzacji."                                  |
| Błąd zewnętrznej usługi AI (np. timeout, błąd 5xx)     | `502 Bad Gateway`  | Zapis do `app.generation_error_logs` z kodem błędu i wiadomością z usługi AI. | "Usługa generowania jest tymczasowo niedostępna."    |
| Nieoczekiwany format odpowiedzi od usługi AI           | `502 Bad Gateway`  | Zapis do `app.generation_error_logs` z informacją o błędzie parsowania.                  | "Wystąpił błąd podczas przetwarzania odpowiedzi AI." |
| Wewnętrzny błąd serwera (np. błąd bazy danych)          | `500 Internal Server Error` | Zapis do `app.generation_error_logs` z pełnym komunikatem błędu.                       | "Wystąpił nieoczekiwany błąd serwera."               |

## 8. Rozważania dotyczące wydajności
-   Głównym wąskim gardłem wydajnościowym będzie czas odpowiedzi zewnętrznej usługi AI, który może wynosić od kilku do kilkunastu sekund.
-   Operacja jest synchroniczna, co oznacza, że klient będzie czekał na pełną odpowiedź.
-   **Strategie optymalizacji (na przyszłość)**:
    -   Rozważenie implementacji asynchronicznej z wykorzystaniem WebSockets lub Server-Sent Events, aby informować klienta o postępie bez blokowania interfejsu.
    -   Implementacja mechanizmu cache'owania po stronie serwera dla zapytań o ten sam `source_text_hash`, aby uniknąć ponownego generowania tych samych fiszek.

## 9. Etapy wdrożenia
1.  **Konfiguracja Zmiennych Środowiskowych**:
    -   Dodaj klucz API dla OpenRouter do zmiennych środowiskowych projektu (`OPENROUTER_API_KEY`).
2.  **Schema Walidacji**:
    -   Utwórz lub zaktualizuj plik `src/lib/validation/generations.schema.ts`, definiując schemę Zod dla `GenerateFlashcardsCommand`.
3.  **Implementacja Serwisów**:
    -   W `src/lib/services/hashing.service.ts` zaimplementuj funkcję do generowania hasha `md5`.
    -   W `src/lib/services/ai-generation.service.ts` stwórz funkcję, która przyjmuje `source_text` i `model`, komunikuje się z API OpenRouter i zwraca `FlashcardCandidate[]`. Należy zaimplementować **60-sekundowy timeout** dla zapytania.
    -   W `src/lib/services/generation-database.service.ts` dodaj dwie metody:
        -   `logSuccessfulGeneration(data: Omit<GenerationEntity, 'id' | 'created_at' | 'updated_at'>)`
        -   `logGenerationError(data: Omit<GenerationErrorLogEntity, 'id' | 'created_at'>)`
4.  **Implementacja API Route**:
    -   W pliku `src/pages/api/generations.ts` utwórz handler `POST`.
    -   Zintegruj middleware do obsługi uwierzytelniania.
    -   Zaimplementuj logikę przepływu danych: walidacja, pomiar czasu, wywołanie serwisów, obsługa błędów i zwracanie odpowiedzi.
