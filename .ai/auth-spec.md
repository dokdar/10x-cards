# Specyfikacja Techniczna: Moduł Uwierzytelniania

## 1. Architektura Interfejsu Użytkownika

### 1.1. Nowe Strony (Astro)

- `src/pages/login.astro`
  - **Cel**: Wyświetlanie formularza logowania dla niezalogowanych użytkowników.
  - **Zawartość**: Osadzony komponent React `LoginForm`.
  - **Dostęp**: Publiczny. Jeśli zalogowany użytkownik spróbuje uzyskać dostęp, zostanie przekierowany do strony głównej (`/`).
- `src/pages/register.astro`
  - **Cel**: Wyświetlanie formularza rejestracji.
  - **Zawartość**: Osadzony komponent React `RegisterForm`.
  - **Dostęp**: Publiczny. Jeśli zalogowany użytkownik spróbuje uzyskać dostęp, zostanie przekierowany do strony głównej (`/`).
- `src/pages/forgot-password.astro`
  - **Cel**: Wyświetlanie formularza do inicjowania procesu odzyskiwania hasła.
  - **Zawartość**: Osadzony komponent React `ForgotPasswordForm`.
  - **Dostęp**: Publiczny.

### 1.2. Modyfikacja Stron i Layoutów

- `src/layouts/Layout.astro`
  - **Zmiany**: Layout będzie pobierał informacje o sesji użytkownika z `Astro.locals` (dostarczone przez middleware). Na tej podstawie będzie renderował komponent `Header` z odpowiednimi właściwościami (np. `isAuthenticated={true}`).
- `src/pages/index.astro`
  - **Zmiany**: Strona główna będzie warunkowo renderować treść.
    - **Dla niezalogowanych**: Prosty landing page z zachętą do rejestracji i logowania.
    - **Dla zalogowanych**: Główny panel aplikacji (dashboard), np. widok fiszek.
- `src/pages/generate.astro` i `src/pages/review/[id].astro`
  - **Zmiany**: Te strony staną się chronione. Dostęp do nich będzie możliwy tylko dla zalogowanych użytkowników. Logika ochrony zostanie zaimplementowana w middleware.

### 1.3. Nowe Komponenty (React)

Wszystkie nowe komponenty zostaną umieszczone w `src/components/auth/`. Będą one wykorzystywać komponenty UI z biblioteki `shadcn/ui`.

- `LoginForm.tsx`
  - **Odpowiedzialność**: Obsługa logiki formularza logowania.
  - **Pola**: `email`, `password`.
  - **Funkcjonalność**: Walidacja po stronie klienta, wywołanie `supabase.auth.signInWithPassword`, obsługa błędów (np. "Nieprawidłowe dane logowania") i przekierowanie po pomyślnym zalogowaniu.
- `RegisterForm.tsx`
  - **Odpowiedzialność**: Obsługa logiki formularza rejestracji.
  - **Pola**: `email`, `password` (z potwierdzeniem).
  - **Funkcjonalność**: Walidacja (email, siła hasła - min. 8 znaków), wywołanie `supabase.auth.signUp`, obsługa błędów (np. "Użytkownik o tym adresie e-mail już istnieje") i automatyczne zalogowanie/przekierowanie.
- `ForgotPasswordForm.tsx`
  - **Odpowiedzialność**: Obsługa formularza odzyskiwania hasła.
  - **Pola**: `email`.
  - **Funkcjonalność**: Wywołanie `supabase.auth.resetPasswordForEmail`, informowanie użytkownika o wysłaniu linku.

### 1.4. Modyfikacja Komponentów (React)

- `src/components/Header.tsx`
  - **Zmiany**: Komponent zostanie rozbudowany o logikę warunkowego renderowania.
    - **Stan `non-auth`**: Wyświetla przyciski "Zaloguj się" i "Zarejestruj się".
    - **Stan `auth`**: Wyświetla np. awatar użytkownika, jego e-mail oraz przycisk "Wyloguj się", który będzie wywoływał metodę `supabase.auth.signOut`.

## 2. Logika Backendowa i System Uwierzytelniania

### 2.1. Middleware (Astro)

- `src/middleware/index.ts`
  - **Cel**: Centralny punkt zarządzania sesją i autoryzacją po stronie serwera.
  - **Logika**:
    1.  Middleware będzie uruchamiany dla każdego żądania.
    2.  Sprawdzi obecność i ważność cookie sesji Supabase.
    3.  Utworzy serwerowego klienta Supabase na podstawie tokena z ciasteczka.
    4.  Pobierze dane sesji użytkownika.
    5.  Jeśli sesja jest ważna, dane użytkownika zostaną umieszczone w `Astro.locals.user`, dzięki czemu będą dostępne w każdej stronie `.astro`.
    6.  Jeśli sesja jest nieważna (lub jej brak):
        - Dla ścieżek publicznych (np. `/login`): zezwoli na kontynuację.
        - Dla ścieżek chronionych (np. `/generate`): przekieruje użytkownika na stronę logowania (`/login`).
    7.  Jeśli zalogowany użytkownik wejdzie na stronę publiczną (np. `/login`), zostanie przekierowany na stronę główną (`/`).

### 2.2. Integracja z Supabase Auth

- **Klient Supabase**:
  - Konfiguracja klienta Supabase (`src/db/supabase.client.ts`) pozostaje bez zmian, będzie on używany po stronie klienta.
  - W middleware będzie tworzony oddzielny, serwerowy klient Supabase dla każdego żądania w celu bezpiecznego walidowania sesji.
- **Ochrona Danych (Row-Level Security)**:
  - Wszystkie istniejące i przyszłe tabele przechowujące dane użytkownika (np. `flashcards`, `generations`) muszą posiadać kolumnę `user_id` (typu `uuid`), która będzie kluczem obcym do `auth.users.id`.
  - Dla każdej z tych tabel zostaną włączone i skonfigurowane polityki RLS w panelu Supabase.
  - **Przykładowa polityka `SELECT`**:
    ```sql
    CREATE POLICY "Users can view their own flashcards."
    ON public.flashcards FOR SELECT
    USING (auth.uid() = user_id);
    ```
  - Podobne polityki zostaną utworzone dla operacji `INSERT`, `UPDATE` i `DELETE`, aby zapewnić pełną izolację danych.

### 2.3. Kontrakty i Modele Danych

- **Model Użytkownika**: Supabase Auth zarządza tabelą `auth.users`. W naszej aplikacji, obiekt użytkownika (dostępny w `Astro.locals.user` lub przez `supabase.auth.getUser()`) będzie zawierał co najmniej `id`, `email`, i `aud`.
- **Walidacja**:
  - **Frontend**: Użycie biblioteki `zod` w komponentach React do walidacji schematów formularzy (np. format email, długość hasła).
  - **Backend**: Supabase Auth zapewnia wbudowaną walidację po swojej stronie. Dodatkowo, polityki RLS działają jako ostateczna warstwa walidacji uprawnień na poziomie bazy danych.
