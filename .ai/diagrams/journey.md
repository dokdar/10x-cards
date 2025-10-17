<mermaid_diagram>
```mermaid
stateDiagram-v2
    [*] --> Niezalogowany

    state "Użytkownik Niezalogowany" as Niezalogowany {
        [*] --> StronaGlowna
        StronaGlowna: Landing Page
        StronaGlowna --> Logowanie: Klika "Zaloguj"
        StronaGlowna --> Rejestracja: Klika "Zarejestruj"
        StronaGlowna --> PróbaDostępu: Próbuje wejść na /generate
    }

    state "Proces Uwierzytelniania" as Auth {
        PróbaDostępu --> Logowanie
        
        state Logowanie {
            note right of Logowanie
                Użytkownik podaje email i hasło.
                Błędne dane powodują powrót do formularza.
            end note
            [*] --> FormularzLogowania
            FormularzLogowania --> Zalogowany : Dane poprawne
            FormularzLogowania --> FormularzLogowania : Dane niepoprawne
            FormularzLogowania --> OdzyskiwanieHasla : Klika "Zapomniałem hasła"
        }

        state Rejestracja {
            note right of Rejestracja
                Po udanej rejestracji, użytkownik
                jest automatycznie logowany.
            end note
            [*] --> FormularzRejestracji
            FormularzRejestracji --> Zalogowany : Sukces
            FormularzRejestracji --> FormularzRejestracji : Błąd (np. email zajęty)
        }
        
        state OdzyskiwanieHasla {
            [*] --> FormularzOdzyskiwania
            FormularzOdzyskiwania --> EmailWyslany: Podaje poprawny email
            EmailWyslany: Użytkownik otrzymuje instrukcje
            EmailWyslany --> Logowanie: Wraca do logowania
        }
    }

    state "Użytkownik Zalogowany" as Zalogowany {
        [*] --> PanelGłówny
        PanelGłówny: Dostęp do generatora i fiszek
        PanelGłówny --> Wylogowanie: Klika "Wyloguj"
    }

    Wylogowanie --> Niezalogowany
    Zalogowany --> [*]
```
</mermaid_diagram>
