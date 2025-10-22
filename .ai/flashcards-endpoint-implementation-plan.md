# API Endpoint Implementation Plan: Create Flashcard(s)

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia uwierzytelnionym użytkownikom tworzenie jednej lub wielu fiszek. Obsługuje zarówno pojedyncze żądania, jak i operacje masowe, co pozwala na efektywne dodawanie danych.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/flashcards`
- **Ciało żądania**: Może to być pojedynczy obiekt JSON lub tablica obiektów JSON, każdy reprezentujący jedną fiszkę.
  - **Parametry obiektu fiszki**:
    - `front`: `string` (Wymagane, min: 1, max: 200 znaków) - Przednia strona fiszki.
    - `back`: `string` (Wymagane, min: 1, max: 500 znaków) - Tylna strona fiszki.
    - `source`: `string` (Wymagane, musi być jedną z wartości: 'ai-full', 'ai-edited', 'manual') - Źródło pochodzenia fiszki.
    - `generation_id`: `string | null` (Opcjonalne, musi być poprawnym UUID) - Identyfikator sesji AI, która wygenerowała fiszkę.

## 3. Wykorzystywane typy

- **Command Models**:
  - `CreateFlashcardCommand`: Reprezentuje dane wejściowe dla pojedynczej fiszki.
  - `CreateFlashcardsCommand`: Typ alias dla `CreateFlashcardCommand[]`, używany w operacjach masowych.
- **DTO (Data Transfer Object)**:
  - `FlashcardDTO`: Reprezentuje dane wyjściowe dla pojedynczej fiszki, z pominięciem `user_id`.

## 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu**:
  - **Kod stanu**: `201 Created`
  - **Ciało odpowiedzi**: Tablica nowo utworzonych obiektów fiszek w formacie `FlashcardDTO[]`.
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Błąd walidacji danych wejściowych.
  - `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
  - `500 Internal Server Error`: Wewnętrzny błąd serwera, np. problem z bazą danych.

## 5. Przepływ danych

1.  Żądanie `POST` trafia do punktu końcowego `/api/flashcards`.
2.  Middleware Astro weryfikuje token JWT i dołącza sesję użytkownika do `context.locals`. Jeśli użytkownik nie jest uwierzytelniony, zwraca `401`.
3.  Handler endpointu odczytuje ciało żądania.
4.  Schemat walidacji Zod jest używany do sprawdzenia poprawności danych wejściowych. Jeśli walidacja się nie powiedzie, zwracany jest błąd `400` ze szczegółami.
5.  Dane wejściowe są normalizowane do formatu tablicy (`CreateFlashcardsCommand`), nawet jeśli przesłano pojedynczy obiekt.
6.  Pobierane jest `user.id` z `context.locals.user`.
7.  Wywoływana jest metoda z serwisu `FlashcardDatabaseService`, przekazując klienta Supabase, ID użytkownika i dane fiszek.
8.  Serwis mapuje dane wejściowe na obiekty do wstawienia do bazy danych, dodając `user_id` do każdego rekordu.
9.  Serwis używa metody `.insert()` klienta Supabase do zapisania danych w tabeli `app.flashcards`. Operacja ta jest atomowa dla całej tablicy.
10. Po pomyślnym zapisie, baza danych zwraca nowo utworzone rekordy.
11. Serwis zwraca te rekordy do handlera.
12. Handler mapuje zwrócone encje na `FlashcardDTO[]` (usuwając `user_id`).
13. Handler wysyła odpowiedź `201 Created` z przetworzonymi danymi.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Dostęp jest ograniczony do uwierzytelnionych użytkowników poprzez middleware Astro, które weryfikuje sesję Supabase.
- **Autoryzacja**: Identyfikator użytkownika (`user_id`) jest pobierany z sesji po stronie serwera, a nie z danych wejściowych klienta, co zapobiega tworzeniu zasobów w imieniu innych użytkowników.
- **Walidacja danych**: Rygorystyczna walidacja za pomocą Zod chroni przed niepoprawnymi danymi i potencjalnymi atakami (np. przepełnienie bufora przez zbyt długie ciągi znaków).
- **Ochrona przed SQL Injection**: Użycie Supabase JS Client zapewnia parametryzację zapytań, co skutecznie chroni przed atakami typu SQL Injection.
- **Polityki RLS (Row-Level Security)**: Baza danych Supabase powinna być skonfigurowana z politykami RLS, aby zapewnić, że użytkownicy mogą wstawiać dane tylko w swoim własnym imieniu.

## 7. Rozważania dotyczące wydajności

- **Operacje masowe**: Projekt endpointu wspiera masowe wstawianie fiszek. Klient Supabase jest zoptymalizowany do obsługi tablicy obiektów w jednej operacji `insert()`, co przekłada się na pojedyncze wywołanie RPC do bazy danych i znacząco redukuje narzut sieciowy w porównaniu do wielu pojedynczych żądań.

## 8. Etapy wdrożenia

1.  **Walidacja**:
    - Utworzyć plik `src/lib/validation/flashcards.schema.ts`.
    - Zdefiniować w nim schemat Zod `CreateFlashcardSchema` dla pojedynczej fiszki, uwzględniając wszystkie ograniczenia (długość pól, enum dla `source`).
    - Zdefiniować główny schemat `CreateFlashcardsRequestSchema` jako `z.union([CreateFlashcardSchema, z.array(CreateFlashcardSchema).min(1)])` do obsługi obu wariantów żądania.

2.  **Serwis bazodanowy**:
    - Utworzyć plik `src/lib/services/flashcard-database.service.ts`.
    - Zaimplementować w nim asynchroniczną funkcję `createFlashcards(supabase: SupabaseClient, userId: string, data: CreateFlashcardsCommand)`.
    - Funkcja ta powinna mapować `data`, dodając do każdego obiektu `user_id`, a następnie wywołać `supabase.from('flashcards').insert(...).select()`.
    - Dodać obsługę błędów Supabase i rzucać wyjątki w razie niepowodzenia.

3.  **Endpoint API**:
    - Utworzyć plik `src/pages/api/flashcards.ts`.
    - Zaimplementować handler `POST` jako `APIRoute`.
    - W handlerze:
      - Pobrać sesję użytkownika z `context.locals`. Jeśli brak, zwrócić `401`.
      - Sparować ciało żądania (`await context.request.json()`).
      - Przeprowadzić walidację przy użyciu `CreateFlashcardsRequestSchema.safeParse()`. W przypadku błędu zwrócić `400` ze szczegółami.
      - Znormalizować dane do tablicy, jeśli jest to pojedynczy obiekt.
      - Wywołać serwis `createFlashcards`, przekazując `context.locals.supabase`, `user.id` i zwalidowane dane.
      - Zamapować wynik z serwisu na `FlashcardDTO[]`.
      - Zwrócić odpowiedź JSON z kodem `201` i danymi DTO.
      - Dodać blok `try...catch` do obsługi błędów z serwisu i zwracania `500`.
