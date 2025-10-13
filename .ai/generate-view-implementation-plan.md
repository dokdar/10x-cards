# Plan implementacji widoku Generator AI

## 1. Przegląd
Widok "Generator AI" jest kluczowym elementem aplikacji, umożliwiającym użytkownikom inicjowanie procesu tworzenia fiszek. Jego głównym celem jest dostarczenie prostego interfejsu do wklejenia tekstu źródłowego, zwalidowanie go pod kątem długości, a następnie wysłanie do API w celu wygenerowania propozycji fiszek. Widok zarządza stanami ładowania i błędów, a po pomyślnym zakończeniu operacji przekierowuje użytkownika do widoku recenzji.

## 2. Routing widoku
Widok będzie dostępny pod ścieżką `/generate` dla zalogowanych użytkowników.

## 3. Struktura komponentów
Komponenty zostaną zaimplementowane w React i osadzone na stronie Astro. Hierarchia będzie wyglądać następująco:

```
/src/pages/generate.astro
└── /src/layouts/Layout.astro
    └── /src/components/views/AIGeneratorView.tsx (client:load)
        ├── /src/components/generator/SourceTextInput.tsx
        │   ├── Textarea (z shadcn/ui)
        │   └── <p> (Licznik znaków / Tekst pomocniczy)
        ├── Button (z shadcn/ui)
        └── /src/components/generator/GenerationStatusIndicator.tsx
            ├── <Spinner> (Komponent niestandardowy lub z biblioteki)
            └── Alert (z shadcn/ui)
```

## 4. Szczegóły komponentów

### `AIGeneratorView.tsx`
- **Opis komponentu**: Główny kontener widoku, który zarządza stanem i logiką. Składa się z nagłówka, komponentu do wprowadzania tekstu, przycisku akcji oraz wskaźnika statusu.
- **Główne elementy**: `<h1>`, `<p>`, `SourceTextInput`, `Button`, `GenerationStatusIndicator`.
- **Obsługiwane interakcje**:
  - Przesłanie formularza w celu rozpoczęcia generowania fiszek.
- **Obsługiwana walidacja**:
  - Sprawdza, czy długość tekstu źródłowego mieści się w zakresie 1000-10000 znaków, aby aktywować przycisk "Generuj Fiszki".
- **Typy**: `GenerateFlashcardsCommand`, `GenerationResponse`, `ApiError`.
- **Propsy**: Brak.

### `SourceTextInput.tsx`
- **Opis komponentu**: Kontrolowany komponent do wprowadzania tekstu źródłowego. Zawiera pole `Textarea` oraz licznik znaków.
- **Główne elementy**: `<div>` (wrapper), `Textarea` (z `shadcn/ui`), `<p>` (licznik/helper).
- **Obsługiwane interakcje**:
  - `onChange`: Aktualizuje stan tekstu w komponencie nadrzędnym (`AIGeneratorView`).
- **Obsługiwana walidacja**:
  - Wizualne wskazanie liczby znaków i wymagań (np. "1500 / 10000").
- **Typy**: `string`.
- **Propsy**:
  ```typescript
  interface SourceTextInputProps {
    value: string;
    onChange: (value: string) => void;
    minLength: number;
    maxLength: number;
    disabled: boolean;
  }
  ```

### `GenerationStatusIndicator.tsx`
- **Opis komponentu**: Wyświetla stan operacji generowania. W stanie ładowania pokazuje animowany wskaźnik, a w przypadku błędu – komunikat w komponencie `Alert`.
- **Główne elementy**: `Spinner`, `Alert` (z `shadcn/ui`).
- **Obsługiwane interakcje**: Brak.
- **Obsługiwana walidacja**: Brak.
- **Typy**: `GenerationStatus` (literał: `'idle' | 'loading' | 'error'`), `string | null` (dla komunikatu błędu).
- **Propsy**:
  ```typescript
  interface GenerationStatusIndicatorProps {
    status: 'idle' | 'loading' | 'error';
    errorMessage: string | null;
  }
  ```

## 5. Typy
Do implementacji widoku wykorzystane zostaną istniejące typy DTO z `src/types.ts`. Nie ma potrzeby tworzenia nowych, złożonych typów ViewModel.

- **`GenerateFlashcardsCommand`**: Obiekt wysyłany w ciele żądania `POST /api/generations`.
  ```typescript
  export interface GenerateFlashcardsCommand {
    source_text: string;
    model?: string; // W tym widoku pole opcjonalne, nieustawiane przez UI
  }
  ```
- **`GenerationResponse`**: Obiekt otrzymywany w odpowiedzi na pomyślne żądanie.
  ```typescript
  export interface GenerationResponse {
    generation_id: string;
    // ...pozostałe pola
  }
  ```
- **`ApiError`**: Obiekt błędu zwracany przez API.
  ```typescript
  export interface ApiError {
    error: string;
    message: string;
    details?: Record<string, any>;
  }
  ```
- **`GenerationStatus`**: Typ literalny do zarządzania stanem UI.
  ```typescript
  type GenerationStatus = 'idle' | 'loading' | 'success' | 'error';
  ```

## 6. Zarządzanie stanem
Stan będzie zarządzany lokalnie w komponencie `AIGeneratorView` przy użyciu hooka `useState`. W celu hermetyzacji logiki API i zarządzania stanem, zostanie utworzony niestandardowy hook `useFlashcardGeneration`.

- **Hook `useFlashcardGeneration`**:
  - **Cel**: Abstrakcja komunikacji z API, zarządzanie stanami `loading` i `error`.
  - **Stany wewnętrzne**: `status: GenerationStatus`, `error: string | null`, `data: GenerationResponse | null`.
  - **Funkcje eksportowane**: `generate(sourceText: string)`.
  - **Użycie w `AIGeneratorView`**: Komponent będzie wywoływał `generate` i reagował na zmiany `statusu`, `error` i `data`, aktualizując UI i wykonując przekierowanie.

## 7. Integracja API
- **Endpoint**: `POST /api/generations`
- **Przepływ integracji**:
  1. Użytkownik klika przycisk "Generuj Fiszki".
  2. Wywoływana jest funkcja `generate` z hooka `useFlashcardGeneration`, przekazując tekst źródłowy.
  3. Hook wysyła żądanie `POST` pod adres `/api/generations` z ciałem typu `GenerateFlashcardsCommand`.
  4. **Odpowiedź sukcesu (200 OK)**:
     - Hook aktualizuje swój stan na `status: 'success'` i zapisuje dane odpowiedzi (`GenerationResponse`).
     - Komponent `AIGeneratorView` w `useEffect` (nasłuchującym na `status === 'success'`) wykonuje przekierowanie na stronę `/review/{generation_id}`.
  5. **Odpowiedź błędu (4xx/5xx)**:
     - Hook łapie błąd, parsuje ciało odpowiedzi (`ApiError`) i aktualizuje stan na `status: 'error'`, zapisując komunikat błędu.
     - Komponent `AIGeneratorView` wyświetla `GenerationStatusIndicator` z komunikatem błędu.

## 8. Interakcje użytkownika
- **Wpisywanie tekstu**: Użytkownik wpisuje tekst w `Textarea`. Interfejs na bieżąco aktualizuje licznik znaków i stan walidacji przycisku.
- **Kliknięcie "Generuj Fiszki"**:
  - Jeśli przycisk jest aktywny, UI przechodzi w stan ładowania: formularz zostaje zablokowany, a wskaźnik ładowania (`Spinner`) jest wyświetlany.
  - Po pomyślnym wygenerowaniu, następuje automatyczne przekierowanie.
  - W razie błędu, stan ładowania jest usuwany, a na ekranie pojawia się komunikat błędu.

## 9. Warunki i walidacja
- **Warunek główny**: Długość tekstu źródłowego musi zawierać się w przedziale od 1000 do 10000 znaków.
- **Weryfikacja**:
  - **`AIGeneratorView`**: Oblicza `const isValid = sourceText.length >= 1000 && sourceText.length <= 10000;`.
  - **`Button` "Generuj Fiszki"**: Otrzymuje `disabled={!isValid || status === 'loading'}`.
  - **`SourceTextInput`**: Wyświetla licznik znaków, np. `1234/10000`, aby informować użytkownika o postępie w spełnianiu warunku.

## 10. Obsługa błędów
- **Błąd walidacji (400)**: Wyświetlenie komunikatu, np. "Tekst musi mieć od 1000 do 10000 znaków."
- **Błąd usługi AI (502)**: Wyświetlenie komunikatu z API, np. "Usługa generowania jest tymczasowo niedostępna. Spróbuj ponownie później."
- **Błąd serwera (500)**: Wyświetlenie generycznego komunikatu, np. "Wystąpił nieoczekiwany błąd serwera."
- **Błąd sieci**: Wyświetlenie komunikatu, np. "Błąd połączenia. Sprawdź swoje połączenie z internetem."
Wszystkie błędy będą prezentowane użytkownikowi za pomocą komponentu `GenerationStatusIndicator`, który renderuje `Alert` z odpowiednią wiadomością.

## 11. Kroki implementacji
1.  **Utworzenie plików**: Stworzenie strony `/src/pages/generate.astro` oraz komponentów: `/src/components/views/AIGeneratorView.tsx`, `/src/components/generator/SourceTextInput.tsx`, `/src/components/generator/GenerationStatusIndicator.tsx`.
2.  **Implementacja strony Astro**: W pliku `generate.astro` umieścić `Layout` i zaimportować `AIGeneratorView` z dyrektywą `client:load`.
3.  **Budowa statycznego UI**: Zaimplementować strukturę JSX dla wszystkich komponentów, używając komponentów z `shadcn/ui` (`Textarea`, `Button`, `Alert`) bez logiki stanu.
4.  **Implementacja stanu**: Dodać logikę zarządzania stanem (`useState`) w `AIGeneratorView` dla tekstu źródłowego, statusu generowania i błędów.
5.  **Stworzenie hooka `useFlashcardGeneration`**: Zaimplementować logikę wysyłania żądania `fetch` do API, obsługi odpowiedzi i aktualizacji stanów.
6.  **Połączenie logiki z UI**:
    - Zintegrować hook `useFlashcardGeneration` z `AIGeneratorView`.
    - Podłączyć stan i funkcje do propsów komponentów podrzędnych.
    - Zaimplementować logikę walidacji i dynamicznego blokowania przycisku.
7.  **Implementacja przekierowania**: Dodać `useEffect` w `AIGeneratorView`, który będzie reagował na `status === 'success'` i przekierowywał użytkownika za pomocą `window.location.href`.
8.  **Stylowanie i finalizacja**: Dopracować style za pomocą Tailwind CSS, upewnić się, że komponenty są responsywne i dostępne.
