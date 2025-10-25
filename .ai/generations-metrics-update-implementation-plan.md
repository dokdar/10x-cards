# API Endpoint Implementation Plan: Update Generation Log

## 1. Przegląd punktu końcowego

Ten dokument opisuje plan wdrożenia dla punktu końcowego `PATCH /generations/{id}`. Jego jedynym celem jest aktualizacja istniejącego logu generowania o statystyki z sesji recenzji przeprowadzonej przez użytkownika. Punkt końcowy ten jest wywoływany po stronie klienta po zakończeniu procesu recenzji i zapisaniu fiszek, aby spełnić wymagania dotyczące zbierania metryk.

Plan ten uzupełnia istniejącą funkcjonalność `POST /generations`, która jest już zaimplementowana.

## 2. Szczegóły żądania

-   **Metoda HTTP**: `PATCH`
-   **Struktura URL**: `/api/generations/{id}`
-   **Parametry URL**:
    -   `id` (string, UUID): Unikalny identyfikator logu generowania (`generation_id`), który ma zostać zaktualizowany.
-   **Request Body**:
    ```json
    {
      "accepted_unedited_count": 10,
      "accepted_edited_count": 5,
      "rejected_count": 3
    }
    ```
-   **Parametry Ciała Żądania**:
    -   **Wymagane**:
        -   `accepted_unedited_count` (integer): Liczba zaakceptowanych fiszek bez edycji (musi być >= 0).
        -   `accepted_edited_count` (integer): Liczba zaakceptowanych fiszek po edycji (musi być >= 0).
        -   `rejected_count` (integer): Liczba odrzuconych fiszek (musi być >= 0).

## 3. Wykorzystywane typy i narzędzia

### Typy (z `src/types.ts`):
-   **Command Model (Request DTO)**: `UpdateGenerationCommand`
-   **DTO (Data Transfer Object)**: `GenerationLogDTO`
-   **Entity Model**: `GenerationEntity`
-   **Error Models**: `ApiError`, `ValidationApiError`

### Custom Error Classes:
-   **GenerationError**: Typ-bezpieczna klasa błędów z kodami: `not_found`, `forbidden`, `validation_error`, `internal_error`

### Helper Functions (z `src/lib/utils/`):
-   **`createJsonResponse()`**: Standaryzowane odpowiedzi JSON
-   **`createApiError()`**: Generowanie błędów API
-   **`createValidationErrorFromZod()`**: Konwersja błędów Zod
-   **`HTTP_STATUS`**: Konstanty kodów HTTP
-   **`isUUID()`**: Walidacja formatu UUID

### Feature Flags:
-   **`requireFeature()`**: Sprawdzanie czy funkcja jest włączona

## 4. Szczegóły odpowiedzi

-   **Odpowiedź sukcesu (200 OK)**: Zwraca pełny, zaktualizowany obiekt logu generowania w formacie `GenerationLogDTO`.
-   **Odpowiedzi błędów**:
    -   `400 Bad Request`: Błąd walidacji danych wejściowych (np. wartości ujemne, suma liczników niezgodna z `generated_count`).
    -   `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
    -   `403 Forbidden`: Użytkownik próbuje zaktualizować log, którego nie jest właścicielem.
    -   `404 Not Found`: Log generowania o podanym `id` nie istnieje.

## 5. Przepływ danych

### Handler API (`src/pages/api/generations/[id].ts`):

1.  **Feature Flag Check**: Handler sprawdza czy funkcja `generations` jest włączona używając `requireFeature("generations", "Generowanie")`. Jeśli wyłączona, zwraca odpowiedni błąd.

2.  **Uwierzytelnianie**: Handler sprawdza `locals.user` (ustawiane przez middleware Astro). Jeśli użytkownik nie jest zalogowany, zwraca `401 Unauthorized` używając `createJsonResponse()` i `createApiError()`.

3.  **Walidacja UUID**: Identyfikator `id` z `params.id` jest walidowany przy użyciu helpera `isUUID(id)`. W przypadku niepoprawnego formatu zwracane jest `400 Bad Request`.

4.  **Walidacja Body**: Ciało żądania jest parsowane i walidowane przy użyciu `updateGenerationSchema.safeParse(body)`. Schema Zod sprawdza, czy wszystkie pola są nieujemnymi liczbami całkowitymi. Błędy są konwertowane używając `createValidationErrorFromZod()` i zwracane jako `400 Bad Request`.

5.  **Wywołanie Serwisu**: Handler tworzy instancję `GenerationService(locals.supabase)` i wywołuje `updateGenerationStats(locals.user.id, id, validation.data)`.

6.  **Logika w serwisie** (`GenerationService.updateGenerationStats`):
    - a. Serwis wywołuje `getGenerationById(generationId, userId)` z database service, który wykonuje `SELECT * FROM generations WHERE id = :id AND user_id = :userId`. Warunek `AND user_id` zapewnia Row-Level Security.
    - b. Jeśli rekord nie istnieje, serwis rzuca `GenerationError("Log generowania nie został znaleziony", "not_found")`.
    - c. **Walidacja biznesowa**: Serwis oblicza sumę liczników i porównuje z `generated_count`. Jeśli się nie zgadzają, rzuca `GenerationError` z kodem `validation_error` i polskim komunikatem.
    - d. Jeśli walidacja przejdzie, serwis wywołuje `updateGenerationReviewCounts()`, który wykonuje `UPDATE generations SET ... WHERE id = :id AND user_id = :userId`.
    - e. Serwis zwraca zaktualizowany `GenerationEntity`.

7.  **Mapowanie DTO**: Handler konwertuje `GenerationEntity` na `GenerationLogDTO` używając destrukturyzacji: `const { user_id, ...responseDto } = updatedGeneration` (usuwa wrażliwe pole `user_id`).

8.  **Odpowiedź sukcesu**: Handler zwraca `200 OK` z DTO używając `createJsonResponse(responseDto, HTTP_STATUS.OK)`.

9.  **Obsługa błędów**: Cała logika jest w bloku `try...catch`. Błędy `GenerationError` są mapowane na odpowiednie kody HTTP:
    - `not_found` → `404 Not Found`
    - `validation_error` → `400 Bad Request`
    - `forbidden` → `403 Forbidden`
    - inne → `500 Internal Server Error`

## 6. Względy bezpieczeństwa

-   **Uwierzytelnianie**: Dostęp do endpointu jest bezwzględnie wymagany i zapewniany przez middleware Astro.
-   **Autoryzacja**: Najważniejszym mechanizmem bezpieczeństwa jest weryfikacja własności zasobu. Zapytanie do bazy danych musi zawierać warunek `WHERE id = :id AND user_id = :current_user_id`. Zapobiega to możliwości modyfikacji logów innych użytkowników przez odgadnięcie `generation_id`.
-   **Walidacja danych wejściowych**: Użycie Zod do walidacji typów i zakresu danych (`z.number().int().nonnegative()`) chroni przed niepoprawnymi danymi w bazie.

## 7. Obsługa błędów

-   **400 Bad Request**: Zwracany, gdy:
    -   `id` w URL nie jest poprawnym UUID.
    -   Ciało żądania nie pasuje do schemy (np. brakujące pola, wartości niebędące liczbami, wartości ujemne).
    -   Suma liczników z żądania nie zgadza się z `generated_count` w bazie danych.
-   **401 Unauthorized**: Standardowa odpowiedź dla niezalogowanych użytkowników.
-   **404 Not Found**: Zwracany, gdy log o podanym `id` nie istnieje w bazie danych lub nie należy do uwierzytelnionego użytkownika (celowo nie rozróżniamy tych przypadków, aby nie ujawniać informacji o istnieniu zasobów).
-   **500 Internal Server Error**: W przypadku nieoczekiwanych problemów z bazą danych lub innych błędów serwera.

## 8. Rozważania dotyczące wydajności

-   Operacja jest bardzo wydajna. Obejmuje jedno zapytanie `SELECT` i jedno `UPDATE` na indeksowanych kolumnach (`id` jako klucz główny, `user_id` jako klucz obcy z indeksem).
-   Nie przewiduje się żadnych wąskich gardeł wydajnościowych. Czas odpowiedzi powinien być bardzo krótki.

## 9. Etapy wdrożenia (faktyczna implementacja)

### 9.1. Definicja schemy Zod
**Plik**: `src/lib/validation/generations.schema.ts`

```typescript
export const updateGenerationSchema = z.object({
  accepted_unedited_count: z.number().int().nonnegative(),
  accepted_edited_count: z.number().int().nonnegative(),
  rejected_count: z.number().int().nonnegative(),
});
```

### 9.2. Custom Error Class
**Plik**: `src/lib/services/generation.service.ts`

```typescript
/**
 * Custom error class for generation operations
 */
export class GenerationError extends Error {
  constructor(
    message: string,
    public code: "not_found" | "forbidden" | "validation_error" | "internal_error"
  ) {
    super(message);
    this.name = "GenerationError";
  }
}
```

**Uzasadnienie**: Spójność z `FlashcardError`, type-safe error handling, łatwiejsze mapowanie błędów na kody HTTP.

### 9.3. Rozbudowa `GenerationService`
**Plik**: `src/lib/services/generation.service.ts`

**Dodane metody**:

1. **`updateGenerationStats()`**:
   - JSDoc dokumentacja z parametrami i return type
   - Rzuca `GenerationError` zamiast zwykłego `Error`
   - Polskie komunikaty błędów
   - Walidacja biznesowa sumy liczników

2. **`toDTO()`** (private):
   - Konwertuje `GenerationEntity` → `GenerationLogDTO`
   - Usuwa wrażliwe pole `user_id`
   - Używa destrukturyzacji

3. **`getGenerationDTO()`**:
   - Metoda pomocnicza dla przyszłych potrzeb (np. GET endpoint)
   - Zwraca bezpośrednio DTO zamiast Entity

**Wzorce zastosowane**:
- Dependency Injection (Supabase client w konstruktorze)
- Single Responsibility (każda metoda ma jedno zadanie)
- Error handling przez custom exceptions

### 9.4. Implementacja endpointu API
**Plik**: `src/pages/api/generations/[id].ts`

**Import statements**:
```typescript
import { updateGenerationSchema } from "@/lib/validation/generations.schema";
import { GenerationService, GenerationError } from "@/lib/services/generation.service";
import {
  createApiError,
  createJsonResponse,
  createValidationErrorFromZod,
  HTTP_STATUS,
} from "@/lib/utils/api-response";
import { isUUID } from "@/lib/utils/validation";
import { requireFeature } from "@/features";
```

**Handler structure** (zgodny ze standardami projektu):
1. **JSDoc** dokumentacja handlera
2. **Feature flag** check jako pierwszy guard
3. **Authentication** guard (`locals.user`)
4. **UUID validation** używając `isUUID()` helper
5. **Body validation** z `createValidationErrorFromZod()`
6. **Service call** w try-catch
7. **DTO conversion** przez destrukturyzację
8. **Standardized responses** używając helperów
9. **Error mapping** dla `GenerationError` codes

**Konsekwencja**:
- Prefiks `[GENERATIONS API]` w console.error dla logowania
- Spójny format błędów z resztą API
- Polskie komunikaty błędów

### 9.5. Testy

#### Testy jednostkowe serwisu
**Plik**: `src/lib/services/__tests__/generation.service.test.ts`
**Liczba testów**: 3

1. Should throw error if generation is not found
2. Should throw validation error if sum of counts does not match
3. Should call updateGenerationReviewCounts with correct parameters

**Mocki**:
- `GenerationDatabaseService` - pełny mock
- Weryfikacja wywołań metod db service
- Testowanie polskich komunikatów błędów

#### Testy integracyjne API
**Plik**: `src/pages/api/__tests__/generations.api.test.ts`
**Liczba testów**: 6

1. Should return 401 if user is not authenticated
2. Should return 400 for an invalid UUID
3. Should return 400 for an invalid request body
4. Should return 404 if generation is not found
5. Should return 400 if sum of counts does not match
6. Should return 200 and the updated generation on success

**Mocki**:
- `GenerationDatabaseService` - mock konstruktora
- `@/features` - requireFeature zwraca null (feature enabled)
- `astro:env/server` - mock dla env variables (dodany w setup.ts)

**Konfiguracja testów**:
- `locals.user` zamiast `locals.auth.getSession()`
- Weryfikacja struktury błędów (error code + message)
- Test coverage: wszystkie scenariusze z sekcji 4

#### Test setup
**Plik**: `src/test/setup.ts`

Dodano mock dla `astro:env/server`:
```typescript
vi.mock("astro:env/server", () => ({
  getSecret: vi.fn((key: string) => { /* ... */ }),
  OPENROUTER_DEFAULT_MODEL: "test-model",
  // ...
}));
```

**Uzasadnienie**: Moduł `astro:env/server` jest dostępny tylko server-side, więc wymaga mockowania w testach.

---

## 10. Standardy projektu i refaktoryzacja

### 10.1. Wzorce zastosowane (zgodność z `flashcards/[id].ts`)

Endpoint został zaimplementowany zgodnie z wzorcami używanymi w projekcie, szczególnie w `src/pages/api/flashcards/[id].ts`:

| Wzorzec | Implementacja | Uzasadnienie |
|---------|---------------|--------------|
| **Feature Flags** | `requireFeature("generations")` | Spójność z resztą API, łatwe włączanie/wyłączanie funkcji |
| **Autoryzacja** | `locals.user` | Zgodność z middleware, prostsze niż `locals.auth.getSession()` |
| **Walidacja UUID** | `isUUID(id)` helper | Reużywalny kod, spójność z flashcards API |
| **HTTP Status** | `HTTP_STATUS` const | Type-safe, brak magic numbers, łatwiejsze utrzymanie |
| **Responses** | `createJsonResponse()` | DRY principle, standardowe headery |
| **Errors** | `createApiError()` | Standaryzowana struktura błędów |
| **Validation Errors** | `createValidationErrorFromZod()` | Spójne formatowanie błędów Zod |
| **Custom Errors** | `GenerationError` | Type-safe codes, łatwiejsze mapowanie na HTTP |
| **JSDoc** | Pełna dokumentacja | Lepsza DX, wsparcie IDE |
| **Logging** | `[GENERATIONS API]` prefix | Łatwiejsze debugowanie, spójność z flashcards |

### 10.2. Korzyści z refaktoryzacji

**Przed refaktoryzacją** (pierwotna implementacja):
- ❌ Manual `new Response()` objects
- ❌ Magic numbers dla HTTP status (`401`, `400`, `404`)
- ❌ Różne wzorce autoryzacji (`locals.auth` vs `locals.user`)
- ❌ Walidacja UUID przez Zod schema
- ❌ Brak feature flags
- ❌ Zwykłe `Error` zamiast custom class
- ❌ Brak JSDoc
- ❌ 13 linii manualnego mapowania DTO

**Po refaktoryzacji**:
- ✅ Helpersy `createJsonResponse()`, `createApiError()`
- ✅ `HTTP_STATUS` const zamiast magic numbers
- ✅ Spójne `locals.user` (zgodnie z middleware)
- ✅ `isUUID()` helper (zgodnie z flashcards API)
- ✅ `requireFeature()` integration
- ✅ `GenerationError` z type-safe codes
- ✅ Pełna JSDoc dokumentacja
- ✅ 1-liner destrukturyzacja dla DTO

**Rezultat**:
- 📊 **Maintainability**: Łatwiejsze utrzymanie dzięki reużywalnym helperom
- 🔄 **Consistency**: Spójność z resztą projektu (flashcards API)
- 🛡️ **Type Safety**: `GenerationError` codes, `HTTP_STATUS` const
- 📚 **Documentation**: JSDoc dla lepszego DX
- 🧹 **Code Quality**: Mniej duplikacji (DRY principle)

### 10.3. Spójność z architekturą projektu

Implementacja zgodna z warstwową architekturą projektu:

```
┌─────────────────────────────────────┐
│  API Layer (generations/[id].ts)   │
│  - Feature flags                    │
│  - Authentication guards            │
│  - Request validation               │
│  - Response formatting              │
│  - Error handling                   │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  Service Layer (GenerationService)  │
│  - Business logic                   │
│  - Data validation                  │
│  - Custom errors                    │
│  - DTO conversion                   │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  Database Layer (GenerationDB)      │
│  - SQL queries                      │
│  - Row-level security               │
│  - Data persistence                 │
└─────────────────────────────────────┘
```

**Separation of Concerns**:
- API layer: HTTP, validation, routing
- Service layer: Business logic, authorization
- Database layer: Persistence, queries

### 10.4. Checklisty dla przyszłych endpointów

Implementując nowe endpointy API w tym projekcie, upewnij się że:

**Must-have** ✅:
- [ ] Feature flag check jako pierwszy guard
- [ ] Authentication przez `locals.user`
- [ ] UUID validation przez `isUUID()` helper
- [ ] Body validation z Zod + `createValidationErrorFromZod()`
- [ ] Responses przez `createJsonResponse()` + `HTTP_STATUS`
- [ ] Errors przez `createApiError()`
- [ ] Custom error class dla serwisu (np. `XxxError`)
- [ ] JSDoc dla handlera i metod serwisu
- [ ] Logging z prefiksem `[XXX API]`
- [ ] Testy jednostkowe + integracyjne

**Nice-to-have** 🎯:
- [ ] `toDTO()` method w serwisie
- [ ] Polskie komunikaty błędów (spójność z UI)
- [ ] Guard clauses (early returns)
- [ ] Destrukturyzacja zamiast manualnego mapowania

**Anti-patterns** ❌:
- Manual `new Response()` objects
- Magic numbers dla HTTP status
- `locals.auth.getSession()` (używaj `locals.user`)
- Walidacja UUID przez Zod (używaj `isUUID()`)
- Zwykłe `Error` (używaj custom class)
- Brak JSDoc
- Długie if-else chains (używaj guard clauses)