sequenceDiagram
    autonumber
    participant Przeglądarka
    participant Komponent React
    participant Astro Middleware
    participant Supabase Auth

    rect rgb(230, 245, 255)
        Note over Przeglądarka, Supabase Auth: Przepływ Rejestracji Użytkownika
        Przeglądarka->>Komponent React: Użytkownik wypełnia formularz rejestracji
        activate Komponent React
        Komponent React->>Supabase Auth: signUp(email, hasło)
        activate Supabase Auth
        Supabase Auth-->>Komponent React: Zwraca sesję (automatyczne logowanie)
        deactivate Supabase Auth
        Note right of Supabase Auth: Supabase ustawia HttpOnly cookie
        Komponent React-->>Przeglądarka: Przekierowanie do panelu głównego
        deactivate Komponent React
    end

    rect rgb(240, 240, 240)
        Note over Przeglądarka, Supabase Auth: Przepływ Logowania Użytkownika
        Przeglądarka->>Komponent React: Wypełnia formularz logowania
        activate Komponent React
        Komponent React->>Supabase Auth: signInWithPassword(email, hasło)
        activate Supabase Auth
        Supabase Auth-->>Komponent React: Zwraca sesję (tokeny JWT)
        deactivate Supabase Auth
        Komponent React-->>Przeglądarka: Przekierowanie do chronionej strony
        deactivate Komponent React
    end

    rect rgb(255, 250, 230)
        Note over Przeglądarka, Supabase Auth: Dostęp do Chronionej Strony
        Przeglądarka->>Astro Middleware: GET /generate (z cookie sesji)
        activate Astro Middleware
        Astro Middleware->>Supabase Auth: Weryfikacja sesji na podstawie cookie
        activate Supabase Auth
        Supabase Auth-->>Astro Middleware: Sesja jest ważna, zwraca dane usera
        deactivate Supabase Auth
        alt Sesja poprawna
            Astro Middleware-->>Przeglądarka: Renderuje stronę (200 OK)
        else Sesja niepoprawna
            Astro Middleware-->>Przeglądarka: Przekierowanie na /login (302)
        end
        deactivate Astro Middleware
    end

    rect rgb(255, 230, 230)
        Note over Przeglądarka, Supabase Auth: Odzyskiwanie Hasła
        Przeglądarka->>Komponent React: Podaje adres e-mail
        activate Komponent React
        Komponent React->>Supabase Auth: resetPasswordForEmail(email)
        activate Supabase Auth
        Supabase Auth-->>Komponent React: Potwierdzenie wysłania instrukcji
        deactivate Supabase Auth
        deactivate Komponent React
    end
