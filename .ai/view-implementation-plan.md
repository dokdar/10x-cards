# API Endpoint Implementation Plan: Generate Flashcard Candidates

## 1. Przegląd punktu końcowego

Endpoint `POST /generations` umożliwia użytkownikom generowanie kandydatów na fiszki przy użyciu sztucznej inteligencji. Użytkownik przesyła tekst źródłowy oraz wybiera model AI, a system zwraca listę wygenerowanych kandydatów na fiszki wraz z metadanymi sesji generowania. Endpoint integruje się z zewnętrzną usługą AI (OpenRouter) i loguje informacje o sesji do celów analitycznych.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/generations`
- **Parametry**:
  - **Wymagane**: 
    - `sourceText` (string): Tekst źródłowy o długości 1000-10000 znaków
    - `model` (string): Identyfikator modelu AI (np. "openai/gpt-4o")
  - **Opcjonalne**: brak
- **Request Body**:
  ```json
  {
    "sourceText": "Długi tekst między 1000 a 10000 znaków...",
    "model": "openai/gpt-4o"
  }
  ```
- **Headers**: 
  - `Content-Type: application/json`
  - Authorization header (zarządzany przez middleware)

## 3. Wykorzystywane typy

### Request Types
- `GenerateFlashcardsCommand`: Struktura danych żądania z polami `source_text` i `model`

### Response Types  
- `GenerationResponse`: **Wymaga rozszerzenia** - aktualnie zawiera tylko `generation_id`, `generated_count`, `generation_duration` i `candidates`, ale powinien zawierać również `model`, `source_text_hash`, `source_text_length`, `rejected_count`, `created_at`
- `FlashcardCandidate`: Pojedynczy kandydat z polami `front`, `back`, `source_fragment`

### Database Types
- `GenerationEntity`: Encja do logowania metadanych pomyślnych generacji
- `GenerationErrorLogEntity`: Encja do logowania błędów generacji

### Error Types
- `ApiError`: Standardowa struktura błędu API
- `ValidationApiError`: Błąd z detalami walidacji

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)
```json
{
  "generation_id": "c3e4b7a1-8e1d-4f2a-8b8a-1e3d4a5b6c7d",
  "model": "openai/gpt-4o",
  "source_text_hash": "sha256:a1b2c3d4e5f6...",
  "source_text_length": 5847,
  "generated_count": 2,
  "rejected_count": 0,
  "generation_duration": 15234,
  "created_at": "2024-10-12T14:30:00.000Z",
  "candidates": [
    {
      "front": "AI Candidate 1 Front",
      "back": "AI Candidate 1 Back", 
      "source_fragment": "...kontekst z tekstu źródłowego dla kandydata 1..."
    }
  ]
}
```

### Błędy
- **400 Bad Request**: Nieprawidłowa walidacja danych wejściowych
- **401 Unauthorized**: Brak autoryzacji użytkownika
- **500 Internal Server Error**: Błędy serwera/bazy danych
- **502 Bad Gateway**: Niedostępność usługi AI

## 5. Przepływ danych

1. **Walidacja żądania**: Sprawdzenie autoryzacji i walidacja danych wejściowych
2. **Przygotowanie danych**: Generowanie hash'a tekstu źródłowego, pomiar czasu rozpoczęcia
3. **Komunikacja z AI**: Wysłanie żądania do OpenRouter API z odpowiednim promptem
4. **Przetwarzanie odpowiedzi**: Parsowanie odpowiedzi AI i wyodrębnienie kandydatów
5. **Logowanie metadanych**: Zapis do `app.generations` (sukces) lub `app.generation_error_logs` (błąd)
6. **Zwrot odpowiedzi**: Przesłanie sformatowanej odpowiedzi do klienta

### Integracje zewnętrzne
- **OpenRouter API**: Komunikacja z wybranymi modelami AI
- **Supabase**: Operacje na bazie danych

## 6. Względy bezpieczeństwa

### Autoryzacja
- Użycie middleware Astro do weryfikacji autoryzacji użytkownika
- Wyodrębnienie `user_id` z `context.locals.supabase` i sesji użytkownika

### Walidacja danych
- Ścisła walidacja długości `source_text` (1000-10000 znaków)
- Sanityzacja danych przed wysłaniem do AI
- Walidacja formatu modelu AI

### Ochrona przed nadużyciami
- Limitowanie rozmiaru request body
- Potencjalne rate limiting (do rozważenia w przyszłości)
- Logowanie wszystkich prób generacji dla audytu

## 7. Obsługa błędów

### Błędy walidacji (400)
- Zbyt krótki lub zbyt długi `source_text`
- Brakujące wymagane pola
- Nieprawidłowy format danych

### Błędy autoryzacji (401)
- Brak tokenu autoryzacji
- Nieważny token użytkownika
- Wygasła sesja użytkownika

### Błędy komunikacji z AI (502)
- Timeout komunikacji z OpenRouter
- Błędy zwracane przez model AI
- Nieprawidłowa odpowiedź AI (brak wymaganej struktury)

### Błędy serwera (500)
- Błędy połączenia z bazą danych
- Błędy podczas logowania metadanych
- Nieoczekiwane błędy aplikacji

### Strategia logowania błędów
- Wszystkie błędy AI → `app.generation_error_logs`
- Błędy aplikacji → standardowe logi serwera
- Zachowanie kontekstu błędu dla diagnostyki

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła
- **Czas odpowiedzi AI**: Modele AI mogą potrzebować 10-30 sekund na generację
- **Rozmiar tekstu źródłowego**: Większe teksty = dłuższe przetwarzanie
- **Równoczesne żądania**: Limity API OpenRouter

### Strategie optymalizacji
- **Timeouty**: Ustawienie 60 sekund na czas oczekiwania dla wywołania AI API, inaczej błąd timeout.
- **Streaming**: Rozważenie streaming response dla długich generacji
- **Caching**: Potencjalne cache'owanie dla identycznych tekstów źródłowych
- **Queue system**: Rozważenie systemu kolejek dla dużego ruchu

### Monitoring wydajności
- Logowanie czasów odpowiedzi AI
- Monitorowanie częstotliwości błędów 502
- Śledzenie wykorzystania limitów API

## 9. Etapy wdrożenia

### Faza 1: Przygotowanie infrastruktury
1. **Rozszerzenie typów w src/types.ts**
   - Rozszerzenie `GenerationResponse` o brakujące pola: `model`, `source_text_hash`, `source_text_length`, `rejected_count`, `created_at`
   - Weryfikacja zgodności z polami NOT NULL z tabeli `app.generations`

2. **Stworzenie struktur danych**
   - Zdefiniowanie validation schema używając Zod
   - Implementacja typów Request/Response

3. **Konfiguracja środowiska**
   - Dodanie zmiennych środowiskowych dla OpenRouter API
   - Konfiguracja limitów czasowych i rozmiarów

### Faza 2: Implementacja core services
4. **AIGenerationService**
   - Implementacja komunikacji z OpenRouter API
   - Obsługa różnych modeli AI
   - Formatowanie promptów i parsowanie odpowiedzi

5. **HashingService**  
   - Implementacja funkcji hash dla tekstów źródłowych
   - Zapewnienie konsystentności hash'owania

6. **DatabaseService extensions**
   - Metody do zapisu `GenerationEntity`
   - Metody do zapisu `GenerationErrorLogEntity`

### Faza 3: Implementacja endpointu
7. **Stworzenie pliku `/src/pages/api/generations.ts`**
   - Implementacja handler'a POST
   - Integracja z utworzonymi services
   - Implementacja walidacji żądań

8. **Middleware integration**
   - Zapewnienie autoryzacji użytkownika
   - Walidacja uprawnień dostępu

### Faza 4: Obsługa błędów i logowanie
9. **Implementacja error handling**
   - Mapowanie błędów AI na odpowiednie kody HTTP
   - Logowanie błędów do `generation_error_logs`
   - User-friendly error messages

10. **Performance monitoring**
   - Dodanie metryk czasów odpowiedzi
   - Logowanie wykorzystania API limits

## 10. Checklisty implementacyjne

### Pre-implementation checklist
- [ ] Zmienne środowiskowe dla OpenRouter API skonfigurowane
- [ ] Zod schemas dla walidacji utworzone
- [ ] Database connection potwierdzone

### Implementation checklist  
- [ ] AIGenerationService implementowany i przetestowany
- [ ] HashingService implementowany
- [ ] Database operations dla Generation entities
- [ ] API endpoint `/api/generations.ts` utworzony
- [ ] Error handling i logging implementowane
- [ ] Authorization middleware zintegrowane
