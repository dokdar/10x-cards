sequenceDiagram
    autonumber
    participant Przeglądarka
    participant Komponent React
    participant Astro Middleware
    participant Supabase Auth

    rect rgb(240, 240, 240)
        Note over Przeglądarka, Supabase Auth: Przepływ logowania użytkownika

        Przeglądarka->>Komponent React: Użytkownik wypełnia formularz logowania
        activate Komponent React

        Komponent React->>Supabase Auth: signInWithPassword(email, hasło)
        activate Supabase Auth

        Supabase Auth-->>Komponent React: Zwraca sesję (tokeny JWT)
        deactivate Supabase Auth
        Note right of Supabase Auth: Supabase ustawia HttpOnly cookie w przeglądarce

        Komponent React-->>Przeglądarka: Przekierowanie do chronionej strony (np. /generate)
        deactivate Komponent React
    end

    rect rgb(230, 245, 255)
        Note over Przeglądarka, Supabase Auth: Dostęp do chronionej strony

        Przeglądarka->>Astro Middleware: GET /generate (z cookie sesji)
        activate Astro Middleware

        Astro Middleware->>Supabase Auth: Weryfikacja sesji na podstawie cookie
        activate Supabase Auth
        Supabase Auth-->>Astro Middleware: Sesja jest ważna, zwraca dane użytkownika
        deactivate Supabase Auth

        alt Sesja poprawna
            Astro Middleware-->>Przeglądarka: Renderuje chronioną stronę (200 OK)
        else Sesja niepoprawna lub brak
            Astro Middleware-->>Przeglądarka: Przekierowanie na /login (302 Found)
        end
        deactivate Astro Middleware
    end

    rect rgb(255, 245, 230)
        Note over Przeglądarka, Supabase Auth: Odświeżanie sesji (automatyczne)
        Note over Komponent React, Supabase Auth: Supabase SDK w tle automatycznie<br/>odświeża token, gdy ten wygasa.<br/>Proces jest transparentny dla użytkownika.
    end
