# Dokument wymagań produktu (PRD) - 10xCards MVP

## 1. Przegląd produktu
10xCards to aplikacja internetowa zaprojektowana w celu usprawnienia procesu tworzenia fiszek edukacyjnych poprzez wykorzystanie sztucznej inteligencji. Aplikacja umożliwia użytkownikom generowanie wysokiej jakości fiszek na podstawie dostarczonego tekstu, a następnie integruje je z gotowym algorytmem powtórek (spaced repetition). Celem MVP jest zminimalizowanie czasu i wysiłku potrzebnego do tworzenia materiałów do nauki, czyniąc efektywną metodę powtórek bardziej dostępną dla szerokiego grona odbiorców.

## 2. Problem użytkownika
Manualne tworzenie fiszek jest procesem czasochłonnym i pracochłonnym. Użytkownicy, którzy chcą korzystać z metody nauki opartej na powtórkach, często zniechęcają się koniecznością ręcznego przygotowywania dużej liczby materiałów. Ten wysoki próg wejścia stanowi barierę w dostępie do jednej z najskuteczniejszych technik zapamiętywania. 10xCards ma na celu rozwiązanie tego problemu, automatyzując i znacząco przyspieszając etap tworzenia fiszek.

## 3. Wymagania funkcjonalne
- FR-001: System kont użytkowników oparty na uwierzytelnianiu za pomocą adresu e-mail i hasła.
- FR-002: Generator fiszek AI, który przyjmuje tekst o długości od 1000 do 10000 znaków i generuje propozycje fiszek przy użyciu modelu OpenAI GPT-4o.
- FR-003: Proces recenzji wygenerowanych fiszek, umożliwiający użytkownikowi akceptację, edycję lub odrzucenie każdej propozycji przed zapisaniem.
- FR-004: Zapisywanie zaakceptowanych i edytowanych fiszek do bazy danych w jednej operacji (bulk insert) po zakończeniu procesu recenzji.
- FR-005: Możliwość manualnego tworzenia, przeglądania, edycji i usuwania fiszek.
- FR-006: Walidacja pól fiszki ("przód" do 200 znaków, "tył" do 500 znaków) po stronie klienta i serwera.
- FR-007: Widok listy wszystkich zapisanych fiszek z prostą paginacją.
- FR-008: Wyszukiwarka tekstowa przeszukująca jednocześnie oba pola fiszki ("przód" i "tył").
- FR-009: Integracja z gotową biblioteką open-source do obsługi algorytmu powtórek.
- FR-010: Zapewnienie kluczowych elementów UX: wskaźnik ładowania podczas generowania, komunikaty o błędach, stan pusty z CTA oraz walidacja formularzy w czasie rzeczywistym.
- FR-011: Izolacja danych użytkownika, która zapewnia, że użytkownik może widzieć, edytować, usuwać i wyszukiwać tylko swoje fiszki.

## 4. Granice produktu

### W zakresie MVP
- Uwierzytelnianie użytkowników (rejestracja, logowanie) za pomocą e-maila i hasła.
- Generowanie fiszek przez AI na podstawie tekstu wklejonego przez użytkownika.
- Manualne tworzenie, edycja i usuwanie fiszek.
- Przeglądanie kolekcji fiszek z paginacją i wyszukiwaniem.
- Integracja z gotowym algorytmem powtórek (biblioteka open-source).
- Aplikacja dostępna wyłącznie w wersji webowej.

### Poza zakresem MVP
- Zaawansowane algorytmy powtórek (np. własna implementacja w stylu SuperMemo).
- Import plików w formatach takich jak PDF, DOCX, itp.
- Funkcje społecznościowe, takie jak współdzielenie zestawów fiszek.
- Integracje z zewnętrznymi platformami edukacyjnymi.
- Aplikacje mobilne (iOS, Android).
- Systemy monetyzacji i subskrypcji.
- Logowanie za pośrednictwem dostawców zewnętrznych (Google, Facebook, itp.).

## 5. Historyjki użytkowników

### Zarządzanie kontem
- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto za pomocą adresu e-mail i hasła, aby bezpiecznie przechowywać moje fiszki.
- Kryteria akceptacji:
  1. Użytkownik może przejść do formularza rejestracji.
  2. Formularz wymaga podania adresu e-mail i hasła (minimum 8 znaków).
  3. Po pomyślnej walidacji i przesłaniu formularza, konto użytkownika jest tworzone.
  4. Użytkownik jest automatycznie logowany i przekierowywany do głównego panelu aplikacji.
  5. W przypadku, gdy e-mail jest już zajęty, wyświetlany jest odpowiedni komunikat błędu.

- ID: US-002
- Tytuł: Logowanie do aplikacji
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto, aby uzyskać dostęp do moich fiszek.
- Kryteria akceptacji:
  1. Formularz logowania wymaga podania adresu e-mail i hasła.
  2. Po pomyślnym uwierzytelnieniu użytkownik jest przekierowywany do głównego panelu aplikacji.
  3. W przypadku podania błędnych danych, wyświetlany jest odpowiedni komunikat.

### Generowanie fiszek z AI
- ID: US-003
- Tytuł: Inicjowanie generowania fiszek
- Opis: Jako zalogowany użytkownik, chcę wkleić tekst do analizy, aby uruchomić proces generowania fiszek przez AI.
- Kryteria akceptacji:
  1. Na stronie głównej znajduje się pole tekstowe do wklejenia tekstu.
  2. Pole tekstowe ma walidację długości (minimum 1000, maksimum 10000 znaków).
  3. Użytkownik jest informowany o wymaganej długości tekstu.
  4. Po wklejeniu poprawnego tekstu i kliknięciu przycisku "Generuj", rozpoczyna się proces generowania, a na ekranie pojawia się wskaźnik ładowania.

- ID: US-004
- Tytuł: Recenzja wygenerowanych fiszek
- Opis: Jako użytkownik, chcę przejrzeć listę fiszek-kandydatów wygenerowanych przez AI, aby zdecydować, które z nich zapisać.
- Kryteria akceptacji:
  1. Po zakończeniu generowania, użytkownik widzi listę proponowanych fiszek.
  2. Każda fiszka na liście ma opcje: "Akceptuj", "Edytuj", "Odrzuć".
  3. Dla ułatwienia weryfikacji, przy każdej fiszce wyświetlany jest fragment tekstu źródłowego, na podstawie którego została utworzona.
  4. Użytkownik może edytować zawartość pól "przód" i "tył" kandydata na fiszkę.
  5. Po zakończeniu recenzji, użytkownik klika przycisk "Zapisz", aby dodać zaakceptowane i edytowane fiszki do swojej kolekcji.

- ID: US-005
- Tytuł: Obsługa błędów generowania
- Opis: Jako użytkownik, chcę otrzymać jasny komunikat, jeśli proces generowania fiszek przez AI nie powiedzie się.
- Kryteria akceptacji:
  1. Jeśli wystąpi błąd podczas komunikacji z API AI, wskaźnik ładowania znika.
  2. Na ekranie pojawia się czytelny i pomocny komunikat o błędzie, np. "Nie udało się wygenerować fiszek. Spróbuj ponownie później."

### Ręczne zarządzanie fiszkami
- ID: US-006
- Tytuł: Ręczne tworzenie fiszki
- Opis: Jako użytkownik, chcę móc ręcznie dodać nową fiszkę, aby uzupełnić moją kolekcję o własne materiały.
- Kryteria akceptacji:
  1. Użytkownik może otworzyć modal/formularz do tworzenia nowej fiszki.
  2. Formularz zawiera pola "przód" (do 200 znaków) i "tył" (do 500 znaków).
  3. Pola formularza mają walidację w czasie rzeczywistym (np. liczniki znaków).
  4. Po wypełnieniu i zapisaniu formularza, nowa fiszka jest dodawana do kolekcji użytkownika.

- ID: US-007
- Tytuł: Przeglądanie kolekcji fiszek
- Opis: Jako użytkownik, chcę widzieć listę wszystkich moich zapisanych fiszek, aby móc nimi zarządzać.
- Kryteria akceptacji:
  1. Domyślny widok po zalogowaniu (jeśli użytkownik ma już fiszki) to lista jego kolekcji.
  2. Lista jest paginowana, aby zapewnić wydajność przy dużej liczbie fiszek.
  3. Każdy element na liście wyświetla treść z pola "przód" i "tył".
  4. Użytkownik widzi wyłącznie fiszki, które należą do jego konta.

- ID: US-008
- Tytuł: Edycja istniejącej fiszki
- Opis: Jako użytkownik, chcę móc edytować moje istniejące fiszki, aby poprawić lub zaktualizować ich treść.
- Kryteria akceptacji:
  1. Przy każdej fiszce na liście znajduje się przycisk "Edytuj".
  2. Kliknięcie przycisku otwiera ten sam modal/formularz, który jest używany do tworzenia fiszek, wypełniony danymi edytowanej fiszki.
  3. Po zapisaniu zmian, dane fiszki w kolekcji są zaktualizowane.
  4. Użytkownik może edytować tylko fiszki należące do jego konta.

- ID: US-009
- Tytuł: Usuwanie fiszki
- Opis: Jako użytkownik, chcę móc usunąć fiszkę, której już nie potrzebuję.
- Kryteria akceptacji:
  1. Przy każdej fiszce na liście znajduje się przycisk "Usuń".
  2. Po kliknięciu przycisku, użytkownik musi potwierdzić chęć usunięcia.
  3. Po potwierdzeniu, fiszka jest trwale usuwana z kolekcji.
  4. Użytkownik może usunąć tylko fiszki należące do jego konta.

- ID: US-010
- Tytuł: Wyszukiwanie fiszek
- Opis: Jako użytkownik, chcę móc wyszukać konkretną fiszkę w mojej kolekcji, wpisując szukaną frazę.
- Kryteria akceptacji:
  1. Na stronie z listą fiszek znajduje się pole wyszukiwania.
  2. Wyszukiwarka przeszukuje jednocześnie zawartość pól "przód" i "tył".
  3. Lista fiszek jest dynamicznie filtrowana w miarę wpisywania tekstu przez użytkownika.
  4. Jeśli wyszukiwanie nie zwróci żadnych wyników, wyświetlany jest odpowiedni komunikat.
  5. Wyniki wyszukiwania obejmują wyłącznie fiszki należące do zalogowanego użytkownika.

### Doświadczenie użytkownika (UX)
- ID: US-011
- Tytuł: Widok pustego stanu
- Opis: Jako nowy użytkownik, po pierwszym zalogowaniu chcę zobaczyć zachętę do podjęcia działania, zamiast pustego ekranu.
- Kryteria akceptacji:
  1. Jeśli użytkownik nie ma żadnych fiszek, widzi specjalnie zaprojektowany "stan pusty".
  2. Widok ten zawiera wyraźny przycisk "Call to Action" (np. "Stwórz pierwsze fiszki z AI"), który kieruje go na główną ścieżkę aplikacji.

## 6. Metryki sukcesu
Sukces MVP będzie mierzony za pomocą dwóch kluczowych wskaźników, które odzwierciedlają przyjęcie głównej funkcjonalności produktu. Pomiar będzie realizowany poprzez analizę danych gromadzonych w dedykowanej tabeli analitycznej w bazie danych.

- Metryka 1: Jakość generowanych fiszek
  - Cel: 75% fiszek wygenerowanych przez AI jest akceptowanych przez użytkownika (bez edycji lub po edycji).
  - Pomiar: Logowanie w bazie danych liczby fiszek-kandydatów, liczby zaakceptowanych, edytowanych i odrzuconych w każdej sesji recenzji.

- Metryka 2: Przyjęcie generatora AI
  - Cel: Użytkownicy tworzą 75% wszystkich swoich fiszek przy użyciu generatora AI.
  - Pomiar: Porównanie liczby fiszek dodanych do kolekcji za pośrednictwem procesu AI z liczbą fiszek stworzonych manualnie.
