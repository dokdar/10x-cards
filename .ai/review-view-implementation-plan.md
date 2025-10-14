# Plan implementacji widoku Recenzja

## 1. Przegląd
Widok "Recenzja" ma na celu umożliwienie użytkownikowi przeglądania, edytowania, akceptowania i odrzucania fiszek wygenerowanych przez AI. Po dokonaniu wyboru, użytkownik może zapisać zaakceptowane fiszki w swojej kolekcji. Widok ten jest kluczowym elementem pętli feedbacku, zapewniając kontrolę jakości nad treściami generowanymi automatycznie.

## 2. Routing widoku
Widok będzie dostępny pod dynamiczną ścieżką:
- **Ścieżka**: `/review/[id]`
- **Plik**: `src/pages/review/[id].astro`
- **Uwaga**: Dane do widoku (`GenerationResponse`) powinny być przekazywane ze strony generowania poprzez stan nawigacji lub tymczasowy magazyn stanu po stronie klienta (np. Zustand), aby uniknąć utraty danych przy odświeżaniu strony.

## 3. Struktura komponentów
Hierarchia komponentów zostanie zaimplementowana w React i osadzona na stronie Astro za pomocą dyrektywy `client:load`.

```
src/pages/review/[id].astro
└── src/components/views/ReviewView.tsx (React Root)
    ├── src/components/review/ReviewControls.tsx
    │   └── components/ui/Button.tsx (Shadcn)
    └── src/components/review/CandidateList.tsx
        └── src/components/review/CandidateCard.tsx (mapowany)
            ├── components/ui/Card.tsx (Shadcn)
            ├── components/ui/Textarea.tsx (Shadcn)
            ├── components/ui/Switch.tsx (Shadcn)
            └── components/ui/Button.tsx (Shadcn)
```

## 4. Szczegóły komponentów

### `ReviewView.tsx` (Komponent Kontener)
- **Opis**: Główny komponent widoku recenzji. Odpowiada za zarządzanie stanem całej sesji recenzji za pomocą hooka `useReviewSession`. Otrzymuje dane z generacji i renderuje interfejs użytkownika.
- **Główne elementy**: `<ReviewControls />`, `<CandidateList />`.
- **Obsługiwane interakcje**:
  - `handleSaveCollection`: Uruchamia proces zapisu zaakceptowanych fiszek.
- **Typy**: `GenerationResponse` (jako props).
- **Propsy**:
  - `generationData: GenerationResponse`

### `ReviewControls.tsx`
- **Opis**: Wyświetla globalne przyciski akcji oraz podsumowanie (np. "Wybrano 3 z 10 fiszek").
- **Główne elementy**: `<Button />` do zapisu, `<p>` do wyświetlania statystyk.
- **Obsługiwane interakcje**:
  - `onSave`: Emituje zdarzenie zapisu do komponentu nadrzędnego.
- **Warunki walidacji**: Przycisk "Zapisz w kolekcji" jest nieaktywny, jeśli liczba wybranych fiszek wynosi 0.
- **Typy**: Brak specyficznych typów.
- **Propsy**:
  - `selectedCount: number`
  - `totalCount: number`
  - `isSaving: boolean`
  - `onSave: () => void`

### `CandidateList.tsx`
- **Opis**: Renderuje listę komponentów `CandidateCard` na podstawie przekazanej tablicy kandydatów.
- **Główne elementy**: Lista zamapowanych komponentów `<CandidateCard />`.
- **Obsługiwane interakcje**: Przekazuje zdarzenia z `CandidateCard` do `ReviewView` w celu aktualizacji stanu.
- **Typy**: `ReviewCandidateViewModel[]`.
- **Propsy**:
  - `candidates: ReviewCandidateViewModel[]`
  - `onUpdateCandidate: (id: string, field: 'front' | 'back', value: string) => void`
  - `onToggleAccept: (id: string) => void`
  - `onReject: (id: string) => void`

### `CandidateCard.tsx`
- **Opis**: Reprezentuje pojedynczą fiszkę-kandydata. Umożliwia edycję treści, akceptację i odrzucenie.
- **Główne elementy**: `<Card>`, dwa `<Textarea>` (dla przodu i tyłu), `<Switch>` (do akceptacji), `<Button>` (do odrzucenia).
- **Obsługiwane interakcje**:
  - `onChange` na `<Textarea>`: Aktualizuje treść fiszki.
  - `onCheckedChange` na `<Switch>`: Zmienia status akceptacji.
  - `onClick` na `<Button>`: Oznacza fiszkę jako odrzuconą.
- **Warunki walidacji**: Pola `front` i `back` nie mogą być puste. Jeśli użytkownik usunie całą treść, fiszka powinna być traktowana jako nieprawidłowa i niemożliwa do zapisania.
- **Typy**: `ReviewCandidateViewModel`.
- **Propsy**:
  - `candidate: ReviewCandidateViewModel`
  - `onUpdate`: Funkcja zwrotna do aktualizacji danych kandydata.
  - `onToggleAccept`: Funkcja zwrotna do zmiany statusu akceptacji.
  - `onReject`: Funkcja zwrotna do odrzucenia kandydata.

## 5. Typy

### `ReviewCandidateViewModel` (ViewModel)
W celu zarządzania stanem interfejsu, rozszerzymy typ `FlashcardCandidate` o dodatkowe pola.

```typescript
import { FlashcardCandidate } from '@/types';

export interface ReviewCandidateViewModel extends FlashcardCandidate {
  id: string; // Unikalny identyfikator po stronie klienta (np. z uuid)
  status: 'pending' | 'accepted' | 'edited' | 'rejected';
  originalFront: string; // Oryginalna treść do śledzenia edycji
  originalBack: string; // Oryginalna treść do śledzenia edycji
}
```
- **`id`**: Kluczowy dla renderowania list w React i efektywnego zarządzania stanem.
- **`status`**: Śledzi decyzję użytkownika dla każdej fiszki.
- **`originalFront` / `originalBack`**: Używane do określenia, czy `source` przy zapisie powinien być `'ai-full'`, `'ai-edited'`, czy `'manual'`.

## 6. Zarządzanie stanem

Logika zarządzania stanem zostanie zamknięta w niestandardowym hooku `useReviewSession`.

### `useReviewSession(initialCandidates: FlashcardCandidate[])`
- **Cel**: Hermetyzacja logiki stanu dla listy kandydatów.
- **Stan wewnętrzny**: `useState<ReviewCandidateViewModel[]>([])` do przechowywania listy kandydatów.
- **Udostępniane wartości**:
  - `candidates: ReviewCandidateViewModel[]`: Aktualna lista fiszek.
  - `selectedCount: number`: Pochodna wartość, liczba zaakceptowanych/edytowanych fiszek.
  - `isSaving: boolean`: Flaga informująca o trwającym procesie zapisu.
- **Udostępniane funkcje**:
  - `updateCandidateText(id, field, value)`: Aktualizuje tekst i status na `'edited'`.
  - `toggleCandidateAccept(id)`: Przełącza status między `'accepted'` a `'pending'`.
  - `rejectCandidate(id)`: Ustawia status na `'rejected'`.
  - `saveAcceptedFlashcards(generationId)`: Filtruje, transformuje dane do `CreateFlashcardCommand[]` i wywołuje API.

## 7. Integracja API

### Pobieranie danych
- Brak dedykowanego endpointu `GET /generations/{id}`. Dane (`GenerationResponse`) muszą zostać przekazane z poprzedniej strony (`/generate`) do widoku recenzji. Zalecane jest użycie biblioteki do zarządzania stanem (np. Zustand), aby przetrwać odświeżenie strony.

### Zapisywanie danych
- **Endpoint**: `POST /api/flashcards`
- **Akcja**: Wywoływany po kliknięciu przycisku "Zapisz w kolekcji".
- **Typ żądania**: `CreateFlashcardCommand[]`
- **Logika**: Hook `useReviewSession` będzie odpowiedzialny za:
  1. Filtrowanie stanu w celu znalezienia fiszek ze statusem `'accepted'` lub `'edited'`.
  2. Mapowanie przefiltrowanych danych do formatu `CreateFlashcardCommand`.
  3. Ustawienie pola `source`: `'ai-edited'`, jeśli treść została zmieniona, w przeciwnym razie `'ai-full'`.
  4. Dołączenie `generation_id` do każdego obiektu.
- **Typ odpowiedzi (sukces)**: `FlashcardDTO[]`
- **Obsługa sukcesu**: Przekierowanie użytkownika do jego kolekcji fiszek z komunikatem o powodzeniu.

## 8. Interakcje użytkownika
- **Edycja treści**: Użytkownik wpisuje tekst w polach `Textarea`. Stan jest aktualizowany na bieżąco, a status fiszki zmienia się na `'edited'`.
- **Akceptacja**: Użytkownik klika `Switch`, co przełącza status fiszki między `'pending'` a `'accepted'`.
- **Odrzucenie**: Użytkownik klika przycisk "Odrzuć". Fiszka jest wizualnie oznaczana jako odrzucona (np. wyszarzona), a jej kontrolki stają się nieaktywne.
- **Zapis**: Użytkownik klika "Zapisz w kolekcji". Przycisk pokazuje stan ładowania, a po pomyślnym zapisie następuje przekierowanie.

## 9. Warunki i walidacja
- **Poziom komponentu**:
  - `CandidateCard`: Pola tekstowe `front` i `back` nie mogą być puste. Jeśli pole jest puste, fiszka nie może być zaakceptowana.
- **Poziom widoku**:
  - `ReviewControls`: Przycisk "Zapisz w kolekcji" jest aktywny tylko wtedy, gdy co najmniej jedna fiszka ma status `'accepted'` lub `'edited'`.

## 10. Obsługa błędów
- **Brak danych początkowych**: Jeśli użytkownik wejdzie na stronę `/review/{id}` bezpośrednio (np. z zakładki), widok powinien wyświetlić komunikat o błędzie "Nie znaleziono danych sesji generowania" i przycisk powrotu na stronę główną.
- **Błąd zapisu API**: W przypadku niepowodzenia wywołania `POST /api/flashcards` (błąd sieci, serwera), użytkownikowi zostanie wyświetlony komunikat (np. w komponencie `Alert` z Shadcn) informujący o problemie i zachęcający do ponownej próby.
- **Ostrzeżenie o niezapisanych zmianach**: Jeśli użytkownik dokonał jakichkolwiek zmian (edycja, akceptacja, odrzucenie) i próbuje opuścić stronę, zostanie mu wyświetlone natywne okno przeglądarki z pytaniem, czy na pewno chce opuścić stronę.

## 11. Kroki implementacji
1.  **Utworzenie struktury plików**: Stworzenie plików dla strony Astro (`src/pages/review/[id].astro`) oraz komponentów React (`ReviewView`, `ReviewControls`, `CandidateList`, `CandidateCard`) w katalogu `src/components/review`.
2.  **Zdefiniowanie typów**: Dodanie typu `ReviewCandidateViewModel` do odpowiedniego pliku z typami.
3.  **Implementacja hooka `useReviewSession`**: Stworzenie całej logiki zarządzania stanem, w tym funkcji do modyfikacji i zapisu danych.
4.  **Budowa komponentów UI**: Implementacja komponentów React z użyciem komponentów z biblioteki Shadcn/ui, zgodnie z opisem w sekcji 4.
5.  **Połączenie stanu z UI**: Wykorzystanie hooka `useReviewSession` w komponencie `ReviewView` i przekazanie stanu oraz funkcji do komponentów podrzędnych.
6.  **Implementacja strony Astro**: Stworzenie strony `[id].astro`, która będzie renderować główny komponent React (`ReviewView`) i implementować logikę pobierania danych początkowych (np. ze stanu globalnego).
7.  **Obsługa nawigacji i przekazywania stanu**: Zmodyfikowanie strony `/generate`, aby po pomyślnym wygenerowaniu fiszek przekierowywała na `/review/{id}` i przekazywała dane `GenerationResponse`.
8.  **Implementacja obsługi błędów**: Dodanie komunikatów o błędach dla scenariuszy opisanych w sekcji 10.
9.  **Testowanie manualne**: Przetestowanie całego przepływu: od generacji, przez recenzję (edycja, akceptacja, odrzucenie), aż po zapis i obsługę błędów.
