# Architektura UI dla 10xCards

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji 10xCards została zaprojektowana w celu zapewnienia płynnego i intuicyjnego doświadczenia, koncentrując się na głównym przepływie generowania fiszek przez AI. Struktura opiera się na podejściu komponentowym, wykorzystując bibliotekę `shadcn/ui` w ekosystemie `Astro` i `React`.

Architektura definiuje cztery główne widoki: **Uwierzytelnianie**, **Generator AI**, **Recenzja** oraz **Dashboard**. Całość spina **Główny Układ (Layout)**, który zawiera stałą nawigację dla zalogowanych użytkowników. Kluczowe założenia to responsywność (RWD), dostępność (WCAG AA) oraz ścisła integracja z zaplanowanym REST API, co zapewnia spójność danych i bezpieczeństwo poprzez izolację zasobów na poziomie użytkownika. Zarządzanie stanem opiera się na wbudowanych mechanizmach `React` (Hooks, Context), ze szczególnym uwzględnieniem złożonego stanu sesji recenzji fiszek.

## 2. Lista widoków

### Widok: Uwierzytelnianie

- **Ścieżka widoku**: `/auth` (z wariantami dla logowania i rejestracji, np. `/auth/login`, `/auth/register`)
- **Główny cel**: Umożliwienie nowym użytkownikom rejestracji, a powracającym zalogowania się do aplikacji.
- **Kluczowe informacje do wyświetlenia**: Formularz logowania (e-mail, hasło), formularz rejestracji (e-mail, hasło), komunikaty o błędach walidacji i uwierzytelniania.
- **Kluczowe komponenty widoku**: `Card` (kontener formularza), `Input` (pola tekstowe), `Button` (przycisk akcji), `Alert` (wyświetlanie błędów), Linki do przełączania się między formularzami.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Jasne komunikaty o błędach wyświetlane `inline`. Prosty i czytelny układ.
  - **Dostępność**: Poprawne etykiety (`<label>`) dla pól formularzy, odpowiedni kontrast kolorów.
  - **Bezpieczeństwo**: Przesyłanie danych formularza za pośrednictwem HTTPS.

### Widok: Generator AI

- **Ścieżka widoku**: `/generate`
- **Główny cel**: Umożliwienie zalogowanemu użytkownikowi wklejenia tekstu źródłowego i zainicjowania procesu generowania fiszek przez AI.
- **Kluczowe informacje do wyświetlenia**: Pole tekstowe na tekst źródłowy, licznik znaków informujący o spełnieniu wymagań (1000-10000 znaków), wskaźnik ładowania po rozpoczęciu generowania.
- **Kluczowe komponenty widoku**: `Textarea` (główne pole tekstowe), `Button` ("Generuj Fiszki"), `Progress` lub `Spinner` (wskaźnik ładowania), `Alert` (dla ewentualnych błędów API).
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Przycisk "Generuj Fiszki" jest nieaktywny, dopóki tekst nie spełnia wymogów długości. Wyraźny wskaźnik ładowania blokuje interfejs, aby zapobiec podwójnemu wywołaniu.
  - **Dostępność**: Komunikaty o stanie (np. "Generowanie w toku...") powinny być dostępne dla czytników ekranu (np. przez `aria-live`).
  - **Bezpieczeństwo**: Walidacja długości tekstu po stronie klienta i serwera.

### Widok: Recenzja

- **Ścieżka widoku**: `/review/{generation_id}`
- **Główny cel**: Przedstawienie użytkownikowi propozycji fiszek wygenerowanych przez AI i umożliwienie mu ich przeglądu, edycji, akceptacji lub odrzucenia przed ostatecznym zapisem.
- **Kluczowe informacje do wyświetlenia**: Lista fiszek-kandydatów, każda z polem `front` i `back`. Fragment tekstu źródłowego, na podstawie którego powstała fiszka.
- **Kluczowe komponenty widoku**: Lista komponentów `Card`, `Textarea` (do edycji treści fiszki), `Checkbox` lub `Switch` (do akceptacji), `Button` (do odrzucenia pojedynczej fiszki), globalny `Button` ("Zapisz w kolekcji").
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Wyraźne wizualne oznaczenie statusu każdej propozycji (np. zaakceptowana, edytowana, odrzucona). Monit o potwierdzenie w przypadku próby opuszczenia strony z niezapisanymi zmianami.
  - **Dostępność**: Możliwość nawigacji po liście i wykonywania akcji za pomocą klawiatury.
  - **Bezpieczeństwo**: Identyfikator `generation_id` w URL zapewnia, że użytkownik ma dostęp tylko do swojej sesji recenzji.

### Widok: Dashboard (Lista Fiszek)

- **Ścieżka widoku**: `/dashboard`
- **Główny cel**: Wyświetlenie wszystkich zapisanych fiszek użytkownika oraz umożliwienie mu zarządzania nimi (wyszukiwanie, edycja, usuwanie) i tworzenia nowych ręcznie.
- **Kluczowe informacje do wyświetlenia**: Spaginowana lista fiszek, pole wyszukiwania. W przypadku braku fiszek – widok "stanu pustego" z wezwaniem do działania (CTA).
- **Kluczowe komponenty widoku**: `Table` lub siatka `Card` (lista fiszek), `Input` (wyszukiwarka), `Pagination`, `Button` ("Dodaj fiszkę"), `Dialog` (modal do tworzenia/edycji), `AlertDialog` (potwierdzenie usunięcia).
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Wyszukiwanie filtruje listę dynamicznie. Potwierdzenie usunięcia zapobiega przypadkowej utracie danych. Stan pusty kieruje użytkownika do głównej funkcji aplikacji.
  - **Dostępność**: Poprawna struktura tabeli (`<th>`, `<td>`) lub odpowiednie role ARIA dla listy kart.
  - **Bezpieczeństwo**: Wszystkie operacje (pobieranie, edycja, usuwanie) są autoryzowane i dotyczą wyłącznie fiszek zalogowanego użytkownika.

## 3. Mapa podróży użytkownika

**Główny przepływ dla nowego użytkownika:**

1.  **Rejestracja**: Użytkownik tworzy konto w widoku `/auth`.
2.  **Inicjacja**: Po zalogowaniu jest przekierowywany do widoku `/generate`.
3.  **Generowanie**: Wkleja tekst, klika "Generuj" i obserwuje wskaźnik ładowania.
4.  **Recenzja**: Jest przekierowywany do widoku `/review/{id}`, gdzie zarządza propozycjami.
5.  **Zapis**: Klika "Zapisz", co powoduje zbiorcze dodanie fiszek do jego kolekcji.
6.  **Dashboard**: Jest przekierowywany do `/dashboard`, gdzie widzi swoje nowe fiszki.

**Przepływ dla powracającego użytkownika:**

1.  **Logowanie**: Użytkownik loguje się w widoku `/auth`.
2.  **Dashboard**: Jest przekierowywany do `/dashboard`, gdzie widzi swoją kolekcję fiszek.
3.  **Nawigacja**: Z tego miejsca może przejść do widoku `/generate`, aby stworzyć nowe fiszki, lub zarządzać istniejącymi.

## 4. Układ i struktura nawigacji

Aplikacja będzie korzystać z **Głównego Układu (Layout)** dla wszystkich stron dostępnych po zalogowaniu. Układ ten będzie zawierał stały, górny pasek nawigacyjny (`top bar`).

- **Górny pasek nawigacyjny** będzie zawierał:
  - Logo aplikacji (linkujące do `/dashboard`).
  - Link nawigacyjny "Dashboard" (`/dashboard`).
  - Link nawigacyjny "Generator AI" (`/generate`).
  - Po prawej stronie ikonę/awatar użytkownika z rozwijanym menu, zawierającym opcję "Wyloguj".

Strony uwierzytelniania (`/auth`) będą miały uproszczony układ, bez głównego paska nawigacyjnego, aby skupić użytkownika na zadaniu.

## 5. Kluczowe komponenty

Poniższe komponenty z biblioteki `shadcn/ui` będą fundamentem interfejsu i będą wykorzystywane w wielu widokach w celu zapewnienia spójności:

- **Button**: Standardowy przycisk do wszystkich akcji (generowanie, zapis, usuwanie).
- **Card**: Kontener do grupowania powiązanych informacji, używany do wyświetlania fiszek, propozycji w recenzji oraz jako tło dla formularzy.
- **Input / Textarea**: Pola do wprowadzania tekstu, używane w formularzach, wyszukiwarce i edycji fiszek.
- **Dialog / AlertDialog**: Komponenty modalne używane do tworzenia/edycji fiszek (Dialog) oraz do krytycznych potwierdzeń, jak usunięcie (AlertDialog).
- **Alert**: Do wyświetlania statycznych komunikatów o błędach lub sukcesie.
- **Toast**: Do wyświetlania dynamicznych, krótkotrwałych powiadomień (np. "Fiszki zapisane pomyślnie", "Błąd sieci").
- **Pagination**: Komponent do nawigacji po podzielonych na strony listach fiszek.
- **Progress / Spinner**: Do wizualizacji stanów ładowania podczas operacji asynchronicznych.
