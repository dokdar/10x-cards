# 10xCards - Database Schema

Niniejszy dokument opisuje schemat bazy danych PostgreSQL dla aplikacji 10xCards w wersji MVP.

## 1. Lista tabel

### Schemat: `app`

Wszystkie tabele, funkcje i typy danych specyficzne dla aplikacji znajdują się w schemacie `app`, aby zapewnić izolację od schematów systemowych i rozszerzeń Supabase.

---

### Tabela: `app.flashcards`

Przechowuje fiszki stworzone przez użytkowników.

| Nazwa kolumny   | Typ danych    | Ograniczenia                                                                    | Opis                                                                                        |
| --------------- | ------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `id`            | `uuid`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                      | Unikalny identyfikator fiszki.                                                              |
| `user_id`       | `uuid`        | `NOT NULL`, `FOREIGN KEY REFERENCES auth.users(id) ON DELETE CASCADE`           | Identyfikator użytkownika, do którego należy fiszka.                                        |
| `generation_id` | `uuid`        | `NULL`, `FOREIGN KEY REFERENCES app.generations(id) ON DELETE SET NULL`         | Opcjonalny identyfikator sesji AI, która wygenerowała fiszkę.                               |
| `front`         | `VARCHAR(200)`| `NOT NULL`                                                                      | Treść przedniej strony fiszki.                                                              |
| `back`          | `VARCHAR(500)`| `NOT NULL`                                                                      | Treść tylnej strony fiszki.                                                                 |
| `source`        | `VARCHAR(20)` | `NOT NULL`, `CHECK (source IN ('ai-full', 'ai-edited', 'manual'))`              | Źródło pochodzenia fiszki.                                                                  |
| `created_at`    | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                                                     | Czas utworzenia rekordu.                                                                    |
| `updated_at`    | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT now()`                                                     | Czas ostatniej aktualizacji rekordu (zarządzany przez trigger).                             |

---

### Tabela: `app.generations`

Loguje metadane pomyślnych sesji generowania fiszek przez AI w celu zbierania metryk.

| Nazwa kolumny                | Typ danych      | Ograniczenia                                                                   | Opis                                                                                                          |
| ---------------------------- | --------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `id`                         | `uuid`          | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                     | Unikalny identyfikator sesji generowania.                                                                     |
| `user_id`                    | `uuid`          | `NOT NULL`, `FOREIGN KEY REFERENCES auth.users(id) ON DELETE CASCADE`          | Identyfikator użytkownika, który zainicjował generowanie.                                                     |
| `model`                      | `VARCHAR(100)`  | `NOT NULL`                                                                     | Nazwa modelu AI użytego do generowania.                                                                       |
| `source_text_hash`           | `VARCHAR(100)`  | `NOT NULL`                                                                     | Skrót (hash) tekstu źródłowego, używany do identyfikacji unikalności tekstu bez przechowywania go.            |
| `source_text_length`         | `INTEGER`       | `NOT NULL, CHECK (source_text_length >= 1000 AND source_text_length <= 10000)` | Długość (liczba znaków) tekstu źródłowego.                                                                    |
| `generated_count`            | `INTEGER`       | `NOT NULL`                                                                     | Całkowita liczba fiszek-kandydatów wygenerowanych przez AI.                                                   |
| `accepted_unedited_count`    | `INTEGER`       | `NULL`                                                                         | Liczba fiszek zaakceptowanych przez użytkownika bez edycji.                                                   |
| `accepted_edited_count`      | `INTEGER`       | `NULL`                                                                         | Liczba fiszek zaakceptowanych przez użytkownika po edycji.                                                    |
| `rejected_count`             | `INTEGER`       | `NOT NULL`                                                                     | Liczba fiszek odrzuconych przez użytkownika.                                                                  |
| `generation_duration`        | `INTEGER`       | `NOT NULL`                                                                     | Czas trwania procesu generowania fiszek (w milisekundach).                                                    |
| `created_at`                 | `TIMESTAMPTZ`   | `NOT NULL`, `DEFAULT now()`                                                    | Czas utworzenia rekordu.                                                                                      |
| `updated_at`                 | `TIMESTAMPTZ`   | `NOT NULL`, `DEFAULT now()`                                                    | Czas ostatniej aktualizacji rekordu (zarządzany przez trigger).                                               |

---

### Tabela: `app.generation_error_logs`

Loguje informacje o nieudanych próbach generowania fiszek przez AI w celach diagnostycznych.

| Nazwa kolumny        | Typ danych      | Ograniczenia                                                               | Opis                                                                  |
| -------------------- | --------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `id`                 | `uuid`          | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`                                 | Unikalny identyfikator logu błędu.                                    |
| `user_id`            | `uuid`          | `NOT NULL`, `FOREIGN KEY REFERENCES auth.users(id) ON DELETE CASCADE`      | Identyfikator użytkownika, którego dotyczył błąd.                     |
| `model`              | `VARCHAR(100)`  | `NULL`                                                                     | Nazwa modelu AI, jeśli była dostępna w momencie błędu.                |
| `source_text_hash`   | `VARCHAR(100)`  | `NULL`                                                                     | Skrót tekstu źródłowego, jeśli był dostępny w momencie błędu.         |
| `source_text_length` | `INTEGER`       | `NULL, CHECK (source_text_length >= 1000 AND source_text_length <= 10000)` | Długość tekstu źródłowego, jeśli była dostępna w momencie błędu.      |
| `error_code`         | `TEXT`          | `NULL`                                                                     | Kod błędu zwrócony przez API lub system.                              |
| `error_message`      | `TEXT`          | `NOT NULL`                                                                 | Pełna treść komunikatu błędu.                                         |
| `created_at`         | `TIMESTAMPTZ`   | `NOT NULL`, `DEFAULT now()`                                                | Czas wystąpienia błędu.                                               |

---

### Funkcje i Triggery

Funkcja pomocnicza i trigger do automatycznej aktualizacji kolumny `updated_at`.

```sql
-- Funkcja aktualizująca kolumnę updated_at
CREATE OR REPLACE FUNCTION app.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger dla tabeli app.flashcards
CREATE TRIGGER on_flashcard_update
BEFORE UPDATE ON app.flashcards
FOR EACH ROW
EXECUTE PROCEDURE app.handle_updated_at();
```

## 2. Relacje między tabelami

-   **`auth.users` <-> `app.flashcards` (Jeden-do-wielu)**: Jeden użytkownik może mieć wiele fiszek. Usunięcie użytkownika powoduje usunięcie wszystkich jego fiszek (`ON DELETE CASCADE`).
-   **`auth.users` <-> `app.generations` (Jeden-do-wielu)**: Jeden użytkownik może mieć wiele logów generacji. Usunięcie użytkownika powoduje usunięcie wszystkich jego logów (`ON DELETE CASCADE`).
-   **`auth.users` <-> `app.generation_error_logs` (Jeden-do-wielu)**: Jeden użytkownik może mieć wiele logów błędów. Usunięcie użytkownika powoduje usunięcie wszystkich jego logów błędów (`ON DELETE CASCADE`).
-   **`app.generations` <-> `app.flashcards` (Jeden-do-wielu)**: Jedna sesja generowania może stworzyć wiele fiszek. Usunięcie logu generacji nie usuwa fiszek, a jedynie zeruje pole `generation_id` w powiązanych fiszkach (`ON DELETE SET NULL`).

## 3. Indeksy

Podstawowe indeksy zostaną utworzone na kluczach obcych w celu poprawy wydajności zapytań typu `JOIN`.

```sql
-- Indeks dla klucza obcego user_id w tabeli flashcards
CREATE INDEX idx_flashcards_user_id ON app.flashcards(user_id);

-- Indeks dla klucza obcego generation_id w tabeli flashcards
CREATE INDEX idx_flashcards_generation_id ON app.flashcards(generation_id);

-- Indeks dla klucza obcego user_id w tabeli generations
CREATE INDEX idx_generations_user_id ON app.generations(user_id);

-- Indeks dla klucza obcego user_id w tabeli generation_error_logs
CREATE INDEX idx_generation_error_logs_user_id ON app.generation_error_logs(user_id);
```

## 4. Zasady bezpieczeństwa (Row-Level Security)

RLS zostanie włączone dla wszystkich tabel w schemacie `app`, aby zapewnić ścisłą izolację danych między użytkownikami. Funkcja `auth.uid()` z Supabase Auth jest używana do identyfikacji zalogowanego użytkownika.

### Tabela `app.flashcards`

```sql
-- Włączenie RLS
ALTER TABLE app.flashcards ENABLE ROW LEVEL SECURITY;

-- Polityka SELECT: Użytkownicy mogą widzieć tylko swoje fiszki.
CREATE POLICY "Allow select for own flashcards" ON app.flashcards
FOR SELECT USING (auth.uid() = user_id);

-- Polityka INSERT: Użytkownicy mogą dodawać fiszki tylko we własnym imieniu.
CREATE POLICY "Allow insert for own flashcards" ON app.flashcards
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Polityka UPDATE: Użytkownicy mogą aktualizować tylko swoje fiszki.
CREATE POLICY "Allow update for own flashcards" ON app.flashcards
FOR UPDATE USING (auth.uid() = user_id);

-- Polityka DELETE: Użytkownicy mogą usuwać tylko swoje fiszki.
CREATE POLICY "Allow delete for own flashcards" ON app.flashcards
FOR DELETE USING (auth.uid() = user_id);
```

### Tabela `app.generations`

```sql
-- Włączenie RLS
ALTER TABLE app.generations ENABLE ROW LEVEL SECURITY;

-- Polityka SELECT: Użytkownicy mogą widzieć tylko swoje logi generacji.
CREATE POLICY "Allow select for own generation logs" ON app.generations
FOR SELECT USING (auth.uid() = user_id);

-- Polityka INSERT: Użytkownicy mogą dodawać logi generacji tylko we własnym imieniu.
CREATE POLICY "Allow insert for own generation logs" ON app.generations
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Polityka UPDATE: Tabela jest "append-only", więc brak polityki UPDATE.

-- Polityka DELETE: Użytkownicy mogą usuwać swoje logi generacji.
CREATE POLICY "Allow delete for own generation logs" ON app.generations
FOR DELETE USING (auth.uid() = user_id);
```

### Tabela `app.generation_error_logs`

```sql
-- Włączenie RLS
ALTER TABLE app.generation_error_logs ENABLE ROW LEVEL SECURITY;

-- Polityka SELECT: Użytkownicy mogą widzieć tylko swoje logi błędów.
CREATE POLICY "Allow select for own error logs" ON app.generation_error_logs
FOR SELECT USING (auth.uid() = user_id);

-- Polityka INSERT: Użytkownicy mogą dodawać logi błędów tylko we własnym imieniu.
CREATE POLICY "Allow insert for own error logs" ON app.generation_error_logs
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Polityka UPDATE: Tabela jest "append-only", więc brak polityki UPDATE.

-- Polityka DELETE: Użytkownicy mogą usuwać swoje logi błędów.
CREATE POLICY "Allow delete for own error logs" ON app.generation_error_logs
FOR DELETE USING (auth.uid() = user_id);
```

## 5. Dodatkowe uwagi

1.  **Normalizacja**: Schemat jest zgodny z trzecią postacią normalną (3NF), co zapewnia integralność danych i minimalizuje redundancję.
2.  **Typy danych**: Wybrane typy danych (np. `uuid`, `TIMESTAMPTZ`, `INTEGER`) są semantycznie odpowiednie i zoptymalizowane pod kątem wymagań PostgreSQL i Supabase.
3.  **Skalowalność**: Podstawowa struktura jest zaprojektowana z myślą o skalowalności. Zaawansowane optymalizacje, takie jak indeksowanie dla wyszukiwania pełnotekstowego, zostały odłożone na etap po MVP, zgodnie z notatkami z sesji planowania.