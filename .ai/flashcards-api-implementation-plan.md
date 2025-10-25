# API Endpoint Implementation Plan: Flashcards CRUD Operations

## 1. Przegląd punktów końcowych

Ten plan obejmuje implementację pełnego zestawu operacji CRUD dla zarządzania fiszkami (flashcards) w aplikacji 10x-cards. System umożliwia użytkownikom tworzenie, przeglądanie, edycję i usuwanie fiszek, z pełnym wsparciem dla autentykacji, paginacji, wyszukiwania i bulk operations.

### Endpoints do zaimplementowania:
1. **GET /flashcards** - Lista fiszek z paginacją i wyszukiwaniem
2. **POST /flashcards** - Tworzenie pojedynczej fiszki lub wielu fiszek (bulk)
3. **GET /flashcards/{id}** - Pobranie pojedynczej fiszki
4. **PATCH /flashcards/{id}** - Aktualizacja fiszki
5. **DELETE /flashcards/{id}** - Usunięcie fiszki

Wszystkie endpointy wymagają autentykacji użytkownika i implementują mechanizm sprawdzania własności zasobów (Row Level Security).

---

## 2. Szczegóły poszczególnych endpointów

### 2.1. GET /flashcards - Lista fiszek

#### Szczegóły żądania
- **Metoda HTTP**: GET
- **Struktura URL**: `/api/flashcards`
- **Query Parameters**:
  - `page` (opcjonalny, integer, default: 1, min: 1) - numer strony dla paginacji
  - `limit` (opcjonalny, integer, default: 20, min: 1, max: 100) - liczba elementów na stronę
  - `search` (opcjonalny, string, min: 1, max: 200) - fraza wyszukiwania w polach `front` i `back`

#### Szczegóły odpowiedzi
- **Success (200 OK)**:
  ```typescript
  FlashcardsListResponse {
    data: FlashcardDTO[];
    pagination: PaginationInfo;
  }
  ```
- **Error Responses**:
  - `401 Unauthorized` - brak autentykacji
  - `400 Bad Request` - nieprawidłowe parametry query (np. page < 1, limit > 100)

---

### 2.2. POST /flashcards - Tworzenie fiszki/fiszek

#### Szczegóły żądania
- **Metoda HTTP**: POST
- **Struktura URL**: `/api/flashcards`
- **Request Body** (obsługuje dwa formaty):

  **Format 1 - Pojedyncza fiszka**:
  ```typescript
  CreateFlashcardCommand {
    front: string;        // wymagane, max 200 znaków
    back: string;         // wymagane, max 500 znaków
    source: FlashcardSource; // wymagane: "ai-full" | "ai-edited" | "manual"
    generation_id?: string | null; // opcjonalne, UUID
  }
  ```

  **Format 2 - Bulk creation**:
  ```typescript
  CreateFlashcardsCommand = CreateFlashcardCommand[]
  ```

#### Szczegóły odpowiedzi
- **Success (201 Created)**:
  ```typescript
  FlashcardDTO[] // zawsze tablica, nawet dla pojedynczej fiszki
  ```
- **Error Responses**:
  - `400 Bad Request` - walidacja nie powiodła się (z szczegółami ValidationApiError)
  - `401 Unauthorized` - brak autentykacji

---

### 2.3. GET /flashcards/{id} - Pobranie pojedynczej fiszki

#### Szczegóły żądania
- **Metoda HTTP**: GET
- **Struktura URL**: `/api/flashcards/{id}`
- **Path Parameters**:
  - `id` (wymagany, UUID) - identyfikator fiszki

#### Szczegóły odpowiedzi
- **Success (200 OK)**:
  ```typescript
  FlashcardDTO
  ```
- **Error Responses**:
  - `401 Unauthorized` - brak autentykacji
  - `403 Forbidden` - próba dostępu do fiszki innego użytkownika
  - `404 Not Found` - fiszka nie istnieje

---

### 2.4. PATCH /flashcards/{id} - Aktualizacja fiszki

#### Szczegóły żądania
- **Metoda HTTP**: PATCH
- **Struktura URL**: `/api/flashcards/{id}`
- **Path Parameters**:
  - `id` (wymagany, UUID) - identyfikator fiszki
- **Request Body**:
  ```typescript
  UpdateFlashcardCommand {
    front?: string;  // opcjonalne, max 200 znaków
    back?: string;   // opcjonalne, max 500 znaków
  }
  // Wymaga co najmniej jednego pola (front lub back)
  ```

#### Szczegóły odpowiedzi
- **Success (200 OK)**:
  ```typescript
  FlashcardDTO // zaktualizowana fiszka
  ```
- **Error Responses**:
  - `400 Bad Request` - walidacja nie powiodła się lub brak pól do aktualizacji
  - `401 Unauthorized` - brak autentykacji
  - `403 Forbidden` - próba edycji fiszki innego użytkownika
  - `404 Not Found` - fiszka nie istnieje

---

### 2.5. DELETE /flashcards/{id} - Usunięcie fiszki

#### Szczegóły żądania
- **Metoda HTTP**: DELETE
- **Struktura URL**: `/api/flashcards/{id}`
- **Path Parameters**:
  - `id` (wymagany, UUID) - identyfikator fiszki

#### Szczegóły odpowiedzi
- **Success (204 No Content)** - brak body w odpowiedzi
- **Error Responses**:
  - `401 Unauthorized` - brak autentykacji
  - `403 Forbidden` - próba usunięcia fiszki innego użytkownika
  - `404 Not Found` - fiszka nie istnieje

---

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)
```typescript
// Z src/types.ts (już zdefiniowane)
FlashcardDTO = Omit<FlashcardEntity, "user_id">
FlashcardsListResponse { data: FlashcardDTO[]; pagination: PaginationInfo }
PaginationInfo { total_items, total_pages, current_page, limit }
```

### Command Models
```typescript
// Z src/types.ts (już zdefiniowane)
CreateFlashcardCommand { front, back, source, generation_id? }
CreateFlashcardsCommand = CreateFlashcardCommand[]
UpdateFlashcardCommand { front?, back? }
FlashcardsListQuery { page?, limit?, search? }
```

### Error Types
```typescript
// Z src/types.ts (już zdefiniowane)
ApiError { error, message, details? }
ValidationApiError extends ApiError { validation_errors: ValidationError[] }
ValidationError { field, message }
```

### Validation Schemas (do stworzenia)
```typescript
// Nowe Zod schemas w src/lib/validation/flashcards.schemas.ts
FlashcardsListQuerySchema
CreateFlashcardCommandSchema
CreateFlashcardsCommandSchema
UpdateFlashcardCommandSchema
```

---

## 4. Przepływ danych

### 4.1. GET /flashcards - Lista
```
Request (Query Params)
  → Middleware (auth check)
  → API Route Handler
  → Zod Validation (FlashcardsListQuerySchema)
  → FlashcardsService.listFlashcards(userId, query)
  → Supabase Query:
      - Filter by user_id (RLS)
      - Apply search filter (ilike on front/back)
      - Apply pagination (range)
      - Count total items
  → Calculate pagination info
  → Map to FlashcardDTO[]
  → Response 200 (FlashcardsListResponse)
```

### 4.2. POST /flashcards - Create
```
Request (Body: single or array)
  → Middleware (auth check)
  → API Route Handler
  → Detect format (single vs array)
  → Zod Validation (CreateFlashcardCommandSchema)
  → FlashcardsService.createFlashcards(userId, commands)
  → Supabase Insert:
      - Add user_id to each record
      - Bulk insert with .insert()
      - Select inserted records
  → Map to FlashcardDTO[]
  → Response 201 (FlashcardDTO[])
```

### 4.3. GET /flashcards/{id} - Get Single
```
Request (Path Param: id)
  → Middleware (auth check)
  → API Route Handler
  → Validate UUID format
  → FlashcardsService.getFlashcard(userId, id)
  → Supabase Query:
      - Filter by id AND user_id (RLS)
      - Single record
  → Check if exists (404 if not)
  → Check ownership (403 if different user)
  → Map to FlashcardDTO
  → Response 200 (FlashcardDTO)
```

### 4.4. PATCH /flashcards/{id} - Update
```
Request (Path Param: id, Body: UpdateFlashcardCommand)
  → Middleware (auth check)
  → API Route Handler
  → Validate UUID format
  → Zod Validation (UpdateFlashcardCommandSchema)
  → Check at least one field provided
  → FlashcardsService.updateFlashcard(userId, id, command)
  → Supabase Query:
      - First: Check existence and ownership
      - Update record with new values
      - Trigger updates updated_at automatically
      - Select updated record
  → Map to FlashcardDTO
  → Response 200 (FlashcardDTO)
```

### 4.5. DELETE /flashcards/{id} - Delete
```
Request (Path Param: id)
  → Middleware (auth check)
  → API Route Handler
  → Validate UUID format
  → FlashcardsService.deleteFlashcard(userId, id)
  → Supabase Query:
      - First: Check existence and ownership
      - Delete record
  → Response 204 (No Content)
```

---

## 5. Względy bezpieczeństwa

### 5.1. Autentykacja
- Wszystkie endpointy wymagają zalogowanego użytkownika
- Middleware Astro sprawdza `context.locals.supabase.auth.getUser()`
- Brak sesji → natychmiastowy zwrot 401 Unauthorized
- User ID pobierany z sesji, NIGDY z request body

### 5.2. Autoryzacja (Row Level Security)
- **Odczyt**: Użytkownik może widzieć tylko swoje fiszki (WHERE user_id = auth.uid())
- **Zapis**: Automatyczne dodawanie user_id przy tworzeniu
- **Modyfikacja**: Sprawdzanie własności przed update/delete
- **403 Forbidden**: Gdy zasób istnieje ale należy do innego użytkownika
- **404 Not Found**: Gdy zasób nie istnieje lub należy do innego użytkownika (zależnie od przypadku)

### 5.3. Walidacja danych wejściowych
- **XSS Prevention**: Wszystkie dane walidowane przez Zod schemas
- **Length Constraints**:
  - front: max 200 znaków
  - back: max 500 znaków
  - search: max 200 znaków
- **Type Safety**: Sprawdzanie typów UUID, integers, enums
- **SQL Injection**: Supabase SDK automatycznie chroni przed injection
- **Sanitization**: Trim whitespace, validate source enum

### 5.4. Rate Limiting
- Rozważyć implementację w przyszłości (nie w MVP)
- Możliwe przez Cloudflare Pages lub middleware

### 5.5. CORS
- Zarządzane przez Astro/Cloudflare
- Tylko dozwolone origins

---

## 6. Obsługa błędów

### 6.1. Standardowe kody błędów i scenariusze

#### 400 Bad Request
**Kiedy**: Walidacja danych nie powiodła się
**Przykłady**:
- front przekracza 200 znaków
- back przekracza 500 znaków
- source nie jest jednym z: "ai-full", "ai-edited", "manual"
- page < 1 lub limit > 100
- generation_id nie jest prawidłowym UUID
- UpdateFlashcardCommand nie zawiera żadnego pola

**Response**:
```typescript
ValidationApiError {
  error: "validation_error",
  message: "Request validation failed",
  validation_errors: [
    { field: "front", message: "Must be at most 200 characters" },
    { field: "source", message: "Invalid source type" }
  ]
}
```

#### 401 Unauthorized
**Kiedy**: Brak autentykacji lub wygasła sesja
**Response**:
```typescript
ApiError {
  error: "unauthorized",
  message: "Authentication required"
}
```

#### 403 Forbidden
**Kiedy**: Użytkownik próbuje uzyskać dostęp do zasobu innego użytkownika
**Response**:
```typescript
ApiError {
  error: "forbidden",
  message: "You don't have permission to access this resource"
}
```

#### 404 Not Found
**Kiedy**: Zasób nie istnieje lub należy do innego użytkownika
**Response**:
```typescript
ApiError {
  error: "not_found",
  message: "Flashcard not found"
}
```

#### 500 Internal Server Error
**Kiedy**: Nieoczekiwany błąd serwera, błąd bazy danych
**Response**:
```typescript
ApiError {
  error: "internal_error",
  message: "An unexpected error occurred"
}
```

### 6.2. Strategia obsługi błędów

1. **Try-Catch Blocks**: Każda operacja serwisowa w try-catch
2. **Early Returns**: Guard clauses na początku funkcji
3. **Error Logging**: Console.error dla błędów 500 (z pełnym stack trace)
4. **User-Friendly Messages**: Nie ujawniać szczegółów implementacji w production
5. **Validation Errors**: Agregować wszystkie błędy walidacji, nie tylko pierwszy

### 6.3. Helper Functions
```typescript
// Utility functions do stworzenia
function createErrorResponse(status: number, error: string, message: string)
function createValidationErrorResponse(errors: ValidationError[])
function isUUID(value: string): boolean
```

---

## 7. Rozważania dotyczące wydajności

### 7.1. Database Queries
- **Indexes**: Upewnić się że istnieją indexy na:
  - `flashcards.user_id` (dla filtrowania)
  - `flashcards.created_at` (dla sortowania)
  - `flashcards.front`, `flashcards.back` (dla full-text search - opcjonalnie GIN index)
- **Query Optimization**:
  - Używać `.select()` tylko dla potrzebnych kolumn
  - Nie pobierać `user_id` do DTO (bezpieczeństwo + wydajność)
  - Używać `.count()` z `count: 'exact'` tylko gdy potrzebna paginacja

### 7.2. Pagination
- **Default Limit**: 20 elementów (rozsądny balans)
- **Max Limit**: 100 elementów (zapobieganie abuse)
- **Offset-based**: Używać `.range()` w Supabase
- **Total Count**: Tylko jeden query dla count + data (single())

### 7.3. Bulk Operations
- **Batch Insert**: Supabase obsługuje bulk insert natywnie
- **Transaction**: .insert() jest atomowe
- **Validation**: Walidować wszystkie elementy przed insertem
- **Limit**: Rozważyć max limit elementów w bulk (np. 50-100)

### 7.4. Caching
- **Nie implementować w MVP**: Start simple
- **Przyszłość**: Cache invalidation przy create/update/delete
- **Edge Caching**: Cloudflare może cache'ować GET requests

### 7.5. Search Performance
- **ILIKE Query**: Może być wolne dla dużych dataset
- **Optimization**:
  - Rozważyć PostgreSQL Full-Text Search w przyszłości
  - Lub integrację z Algolia/Elasticsearch dla zaawansowanego search
  - Na start: proste `ilike` wystarczy

---

## 8. Etapy implementacji

### Krok 1: Przygotowanie struktury
**Pliki do stworzenia**:
- `src/lib/validation/flashcards.schemas.ts` - Zod schemas
- `src/lib/services/flashcards.service.ts` - Service layer
- `src/lib/utils/errors.ts` - Error helpers (jeśli nie istnieje)
- `src/lib/utils/validation.ts` - Validation helpers (jeśli nie istnieje)

**Zadania**:
- [ ] Stworzyć strukturę folderów jeśli nie istnieje
- [ ] Zdefiniować wszystkie Zod schemas
- [ ] Stworzyć error helper functions
- [ ] Stworzyć validation helper functions (UUID check, etc.)

---

### Krok 2: Implementacja Service Layer
**Plik**: `src/lib/services/flashcards.service.ts`

**Funkcje do zaimplementowania**:
```typescript
export class FlashcardsService {
  constructor(private supabase: SupabaseClient) {}

  async listFlashcards(
    userId: string,
    query: FlashcardsListQuery
  ): Promise<FlashcardsListResponse>

  async createFlashcard(
    userId: string,
    command: CreateFlashcardCommand
  ): Promise<FlashcardDTO>

  async createFlashcards(
    userId: string,
    commands: CreateFlashcardsCommand
  ): Promise<FlashcardDTO[]>

  async getFlashcard(
    userId: string,
    id: string
  ): Promise<FlashcardDTO>

  async updateFlashcard(
    userId: string,
    id: string,
    command: UpdateFlashcardCommand
  ): Promise<FlashcardDTO>

  async deleteFlashcard(
    userId: string,
    id: string
  ): Promise<void>
}
```

**Szczegóły implementacji każdej metody**:

#### listFlashcards
1. Parse i validate query params (page, limit, search)
2. Build Supabase query:
   ```typescript
   let query = supabase
     .from('flashcards')
     .select('*', { count: 'exact' })
     .eq('user_id', userId)
     .order('created_at', { ascending: false });

   if (search) {
     query = query.or(`front.ilike.%${search}%,back.ilike.%${search}%`);
   }

   const from = (page - 1) * limit;
   const to = from + limit - 1;
   query = query.range(from, to);
   ```
3. Execute query
4. Calculate pagination info
5. Map entities to DTOs (exclude user_id)
6. Return FlashcardsListResponse

#### createFlashcards (bulk)
1. Map commands to inserts (add user_id, ensure all required fields)
2. Execute bulk insert:
   ```typescript
   const { data, error } = await supabase
     .from('flashcards')
     .insert(flashcardsToInsert)
     .select();
   ```
3. Handle errors
4. Map to DTOs
5. Return FlashcardDTO[]

#### getFlashcard
1. Validate UUID format
2. Query flashcard:
   ```typescript
   const { data, error } = await supabase
     .from('flashcards')
     .select('*')
     .eq('id', id)
     .eq('user_id', userId)
     .single();
   ```
3. Check if exists → 404 if not
4. Map to DTO
5. Return FlashcardDTO

#### updateFlashcard
1. Validate UUID format
2. Check existence and ownership (reuse getFlashcard)
3. Update:
   ```typescript
   const { data, error } = await supabase
     .from('flashcards')
     .update(updateData)
     .eq('id', id)
     .eq('user_id', userId)
     .select()
     .single();
   ```
4. Map to DTO
5. Return FlashcardDTO

#### deleteFlashcard
1. Validate UUID format
2. Check existence and ownership (reuse getFlashcard)
3. Delete:
   ```typescript
   const { error } = await supabase
     .from('flashcards')
     .delete()
     .eq('id', id)
     .eq('user_id', userId);
   ```
4. Return void

---

### Krok 3: Implementacja GET /flashcards
**Plik**: `src/pages/api/flashcards/index.ts`

**Implementacja GET handler**:
```typescript
export const prerender = false;

export async function GET(context: APIContext) {
  // 1. Check authentication
  const { data: { user }, error: authError } =
    await context.locals.supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({
      error: 'unauthorized',
      message: 'Authentication required'
    }), { status: 401 });
  }

  // 2. Parse and validate query params
  const url = new URL(context.request.url);
  const queryParams = {
    page: url.searchParams.get('page'),
    limit: url.searchParams.get('limit'),
    search: url.searchParams.get('search')
  };

  const validationResult = FlashcardsListQuerySchema.safeParse(queryParams);

  if (!validationResult.success) {
    return new Response(JSON.stringify(
      createValidationErrorResponse(validationResult.error)
    ), { status: 400 });
  }

  // 3. Call service
  try {
    const service = new FlashcardsService(context.locals.supabase);
    const result = await service.listFlashcards(user.id, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error listing flashcards:', error);
    return new Response(JSON.stringify({
      error: 'internal_error',
      message: 'An unexpected error occurred'
    }), { status: 500 });
  }
}
```

---

### Krok 4: Implementacja POST /flashcards
**Plik**: `src/pages/api/flashcards/index.ts` (rozszerzenie)

**Implementacja POST handler**:
```typescript
export async function POST(context: APIContext) {
  // 1. Check authentication
  const { data: { user }, error: authError } =
    await context.locals.supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({
      error: 'unauthorized',
      message: 'Authentication required'
    }), { status: 401 });
  }

  // 2. Parse request body
  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({
      error: 'bad_request',
      message: 'Invalid JSON'
    }), { status: 400 });
  }

  // 3. Detect single vs array format
  const isArray = Array.isArray(body);
  const commands = isArray ? body : [body];

  // 4. Validate
  const validationResult = CreateFlashcardsCommandSchema.safeParse(commands);

  if (!validationResult.success) {
    return new Response(JSON.stringify(
      createValidationErrorResponse(validationResult.error)
    ), { status: 400 });
  }

  // 5. Call service
  try {
    const service = new FlashcardsService(context.locals.supabase);
    const result = await service.createFlashcards(user.id, validationResult.data);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating flashcards:', error);
    return new Response(JSON.stringify({
      error: 'internal_error',
      message: 'An unexpected error occurred'
    }), { status: 500 });
  }
}
```

---

### Krok 5: Implementacja GET /flashcards/[id]
**Plik**: `src/pages/api/flashcards/[id].ts`

**Implementacja GET handler**:
```typescript
export const prerender = false;

export async function GET(context: APIContext) {
  // 1. Check authentication
  const { data: { user }, error: authError } =
    await context.locals.supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({
      error: 'unauthorized',
      message: 'Authentication required'
    }), { status: 401 });
  }

  // 2. Get and validate ID
  const id = context.params.id;

  if (!id || !isUUID(id)) {
    return new Response(JSON.stringify({
      error: 'bad_request',
      message: 'Invalid flashcard ID'
    }), { status: 400 });
  }

  // 3. Call service
  try {
    const service = new FlashcardsService(context.locals.supabase);
    const result = await service.getFlashcard(user.id, id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    if (error.code === 'not_found') {
      return new Response(JSON.stringify({
        error: 'not_found',
        message: 'Flashcard not found'
      }), { status: 404 });
    }

    if (error.code === 'forbidden') {
      return new Response(JSON.stringify({
        error: 'forbidden',
        message: "You don't have permission to access this resource"
      }), { status: 403 });
    }

    console.error('Error getting flashcard:', error);
    return new Response(JSON.stringify({
      error: 'internal_error',
      message: 'An unexpected error occurred'
    }), { status: 500 });
  }
}
```

---

### Krok 6: Implementacja PATCH /flashcards/[id]
**Plik**: `src/pages/api/flashcards/[id].ts` (rozszerzenie)

**Implementacja PATCH handler**:
```typescript
export async function PATCH(context: APIContext) {
  // 1. Check authentication
  const { data: { user }, error: authError } =
    await context.locals.supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({
      error: 'unauthorized',
      message: 'Authentication required'
    }), { status: 401 });
  }

  // 2. Get and validate ID
  const id = context.params.id;

  if (!id || !isUUID(id)) {
    return new Response(JSON.stringify({
      error: 'bad_request',
      message: 'Invalid flashcard ID'
    }), { status: 400 });
  }

  // 3. Parse and validate body
  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({
      error: 'bad_request',
      message: 'Invalid JSON'
    }), { status: 400 });
  }

  const validationResult = UpdateFlashcardCommandSchema.safeParse(body);

  if (!validationResult.success) {
    return new Response(JSON.stringify(
      createValidationErrorResponse(validationResult.error)
    ), { status: 400 });
  }

  // Check at least one field provided
  if (!validationResult.data.front && !validationResult.data.back) {
    return new Response(JSON.stringify({
      error: 'bad_request',
      message: 'At least one field (front or back) must be provided'
    }), { status: 400 });
  }

  // 4. Call service
  try {
    const service = new FlashcardsService(context.locals.supabase);
    const result = await service.updateFlashcard(
      user.id,
      id,
      validationResult.data
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    if (error.code === 'not_found') {
      return new Response(JSON.stringify({
        error: 'not_found',
        message: 'Flashcard not found'
      }), { status: 404 });
    }

    if (error.code === 'forbidden') {
      return new Response(JSON.stringify({
        error: 'forbidden',
        message: "You don't have permission to access this resource"
      }), { status: 403 });
    }

    console.error('Error updating flashcard:', error);
    return new Response(JSON.stringify({
      error: 'internal_error',
      message: 'An unexpected error occurred'
    }), { status: 500 });
  }
}
```

---

### Krok 7: Implementacja DELETE /flashcards/[id]
**Plik**: `src/pages/api/flashcards/[id].ts` (rozszerzenie)

**Implementacja DELETE handler**:
```typescript
export async function DELETE(context: APIContext) {
  // 1. Check authentication
  const { data: { user }, error: authError } =
    await context.locals.supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({
      error: 'unauthorized',
      message: 'Authentication required'
    }), { status: 401 });
  }

  // 2. Get and validate ID
  const id = context.params.id;

  if (!id || !isUUID(id)) {
    return new Response(JSON.stringify({
      error: 'bad_request',
      message: 'Invalid flashcard ID'
    }), { status: 400 });
  }

  // 3. Call service
  try {
    const service = new FlashcardsService(context.locals.supabase);
    await service.deleteFlashcard(user.id, id);

    return new Response(null, { status: 204 });
  } catch (error) {
    if (error.code === 'not_found') {
      return new Response(JSON.stringify({
        error: 'not_found',
        message: 'Flashcard not found'
      }), { status: 404 });
    }

    if (error.code === 'forbidden') {
      return new Response(JSON.stringify({
        error: 'forbidden',
        message: "You don't have permission to access this resource"
      }), { status: 403 });
    }

    console.error('Error deleting flashcard:', error);
    return new Response(JSON.stringify({
      error: 'internal_error',
      message: 'An unexpected error occurred'
    }), { status: 500 });
  }
}
```

---

### Krok 8: Testy
**Zakres testów**:

#### Unit Tests (Vitest)
- `flashcards.service.test.ts`:
  - Test każdej metody serwisu
  - Mock Supabase client
  - Test edge cases (empty results, errors)

- `flashcards.schemas.test.ts`:
  - Test każdego Zod schema
  - Valid inputs
  - Invalid inputs (boundary conditions)

#### Integration Tests (Vitest + MSW)
- `flashcards.api.test.ts`:
  - Test każdego endpointa
  - Mock auth
  - Test success paths
  - Test error scenarios (401, 403, 404, 400)

#### E2E Tests (Playwright)
- `flashcards.e2e.test.ts`:
  - Full flow: create → list → get → update → delete
  - Test paginacji
  - Test wyszukiwania
  - Test bulk creation

---

## 9. Checklist końcowa

### Przed rozpoczęciem implementacji
- [ ] Zrozumieć specyfikację API
- [ ] Zrozumieć strukturę bazy danych
- [ ] Zrozumieć istniejące typy w src/types.ts
- [ ] Zapoznać się z regułami implementacji

### Podczas implementacji
- [ ] Stworzyć wszystkie Zod schemas
- [ ] Zaimplementować FlashcardsService z wszystkimi metodami
- [ ] Zaimplementować GET /flashcards
- [ ] Zaimplementować POST /flashcards (single + bulk)
- [ ] Zaimplementować GET /flashcards/[id]
- [ ] Zaimplementować PATCH /flashcards/[id]
- [ ] Zaimplementować DELETE /flashcards/[id]
- [ ] Dodać error handling we wszystkich miejscach
- [ ] Sprawdzić typy TypeScript (brak błędów kompilacji)

### Po implementacji
- [ ] Napisać unit tests dla service
- [ ] Napisać unit tests dla schemas
- [ ] Napisać integration tests dla API
- [ ] Napisać E2E tests
- [ ] Przetestować manualnie wszystkie endpointy (Postman/curl)
- [ ] Sprawdzić bezpieczeństwo (RLS, auth)
- [ ] Review kodu
- [ ] Aktualizować dokumentację API (jeśli potrzebne)

---

## 10. Dodatkowe uwagi

### Performance Monitoring
- Rozważyć dodanie logowania czasu wykonania queries
- Monitorować slow queries w production
- Setup alertów dla błędów 500

### Future Enhancements
- Full-text search z PostgreSQL
- Advanced filtering (by source, by date range)
- Sorting options (by created_at, updated_at, alphabetically)
- Archiving flashcards (soft delete)
- Flashcard collections/tags
- Export/Import funkcjonalność

### Documentation
- OpenAPI/Swagger spec (opcjonalnie)
- README z przykładami użycia API
- Postman collection dla testowania

---

**Plan stworzony**: 2024-10-24
**Wersja**: 1.0
**Status**: Ready for implementation
