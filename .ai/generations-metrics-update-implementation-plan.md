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

## 3. Wykorzystywane typy

Do implementacji zostaną wykorzystane następujące, już zdefiniowane, typy z `src/types.ts`:

-   **Command Model (Request DTO)**: `UpdateGenerationCommand`
-   **DTO (Data Transfer Object)**: `GenerationLogDTO`
-   **Entity Model**: `GenerationEntity`
-   **Error Models**: `ApiError`, `ValidationApiError`

## 4. Szczegóły odpowiedzi

-   **Odpowiedź sukcesu (200 OK)**: Zwraca pełny, zaktualizowany obiekt logu generowania w formacie `GenerationLogDTO`.
-   **Odpowiedzi błędów**:
    -   `400 Bad Request`: Błąd walidacji danych wejściowych (np. wartości ujemne, suma liczników niezgodna z `generated_count`).
    -   `401 Unauthorized`: Użytkownik nie jest uwierzytelniony.
    -   `403 Forbidden`: Użytkownik próbuje zaktualizować log, którego nie jest właścicielem.
    -   `404 Not Found`: Log generowania o podanym `id` nie istnieje.

## 5. Przepływ danych

1.  Żądanie `PATCH` trafia do endpointu `/api/generations/[id].ts`.
2.  Middleware Astro weryfikuje sesję użytkownika. W przypadku braku uwierzytelnienia zwraca `401`.
3.  Handler endpointu pobiera `id` z `Astro.params` oraz ciało żądania.
4.  Identyfikator `id` jest walidowany pod kątem formatu UUID. W przypadku błędu zwracane jest `400`.
5.  Ciało żądania jest walidowane przy użyciu schemy Zod (`UpdateGenerationCommandSchema`), która sprawdza, czy wszystkie pola są nieujemnymi liczbami całkowitymi. W przypadku błędu zwracane jest `400`.
6.  Wywoływana jest metoda serwisu, np. `generationService.updateGenerationStats(userId, id, command)`.
7.  **Logika w serwisie**:
    a. Serwis wykonuje zapytanie `SELECT` do tabeli `public.generations`, aby pobrać istniejący rekord na podstawie `id` **oraz** `user_id` zalogowanego użytkownika. Jest to kluczowy krok weryfikacji własności zasobu.
    b. Jeśli zapytanie nie zwróci rekordu, oznacza to, że log nie istnieje lub nie należy do tego użytkownika. Serwis rzuca błąd, który jest mapowany na odpowiedź `404 Not Found`.
    c. **Walidacja biznesowa**: Serwis porównuje sumę liczników z żądania (`accepted_unedited_count + accepted_edited_count + rejected_count`) z wartością `generated_count` w pobranym rekordzie. Jeśli sumy się nie zgadzają, rzucany jest błąd walidacji, mapowany na `400 Bad Request`.
    d. Jeśli wszystkie walidacje przejdą pomyślnie, serwis wykonuje operację `UPDATE` na rekordzie, ustawiając nowe wartości liczników.
    e. Serwis zwraca zaktualizowany rekord.
8.  Handler API mapuje zwrócony rekord na `GenerationLogDTO` i wysyła odpowiedź `200 OK`.
9.  Cała logika w handlerze jest opakowana w blok `try...catch` do obsługi błędów rzucanych przez serwis.

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

## 9. Etapy wdrożenia

1.  **Definicja schemy Zod**:
    -   W pliku `src/lib/validation/generations.ts` (lub podobnym) zdefiniować `UpdateGenerationCommandSchema`, która waliduje trzy pola liczników jako `z.number().int().nonnegative()`.

2.  **Aktualizacja serwisu `GenerationService`**:
    -   W pliku `src/lib/services/generation.service.ts` (lub podobnym) dodać nową metodę asynchroniczną, np. `updateGenerationStats(userId: string, generationId: string, command: UpdateGenerationCommand)`.
    -   Zaimplementować w niej logikę opisaną w sekcji "Przepływ danych".

3.  **Implementacja endpointu API**:
    -   Utworzyć plik `src/pages/api/generations/[id].ts`.
    -   Zaimplementować w nim handler dla metody `PATCH`.
    -   W handlerze dodać logikę:
        -   Sprawdzenie uwierzytelnienia.
        -   Pobranie i walidacja `id` z `Astro.params`.
        -   Pobranie i walidacja ciała żądania przy użyciu schemy Zod.
        -   Wywołanie metody z serwisu w bloku `try...catch`.
        -   Obsługa błędów i zwracanie odpowiednich odpowiedzi HTTP.

4.  **Testy**:
    -   **Testy jednostkowe**: Napisać testy dla nowej metody w `GenerationService`, mockując klienta Supabase i weryfikując logikę (sprawdzanie własności, walidacja sumy).
    -   **Testy integracyjne**: Napisać testy dla endpointu API, które pokryją wszystkie scenariusze:
        -   Pomyślna aktualizacja (status 200).
        -   Próba aktualizacji bez logowania (status 401).
        -   Próba aktualizacji nieistniejącego logu (status 404).
        -   Próba aktualizacji logu innego użytkownika (status 404).
        -   Próba aktualizacji z niepoprawnymi danymi (status 400).
        -   Próba aktualizacji z niezgodną sumą liczników (status 400).