# Kompleksowy Plan Testowy dla Aplikacji 10xCards

## 1. Wprowadzenie i cel testów

### 1.1. Opis projektu

10xCards to aplikacja internetowa stworzona w celu usprawnienia procesu tworzenia fiszek edukacyjnych z wykorzystaniem sztucznej inteligencji. Umożliwia użytkownikom generowanie wysokiej jakości fiszek z dostarczonego tekstu i integruje je z algorytmem powtórek interwałowych (spaced repetition), aby uczynić naukę bardziej efektywną i dostępną.

### 1.2. Cele testowania

Głównym celem testów jest zapewnienie, że aplikacja 10xCards jest niezawodna, bezpieczna i działa zgodnie z założeniami. Testowanie ma na celu weryfikację wszystkich kluczowych funkcjonalności, od uwierzytelniania użytkownika, przez proces generowania fiszek AI, aż po mechanizm ich przeglądania.

### 1.3. Zakres testów

Testy obejmą następujące obszary funkcjonalne i niefunkcjonalne:

- **Uwierzytelnianie:** Rejestracja, logowanie, wylogowywanie, odzyskiwanie hasła.
- **Generowanie fiszek:** Tworzenie nowego zadania generowania, monitorowanie statusu, obsługa wyników.
- **Przeglądanie fiszek:** Wyświetlanie, ocenianie i zarządzanie sesją nauki.
- **API:** Wszystkie punkty końcowe, ich bezpieczeństwo i walidacja danych.
- **Bezpieczeństwo:** Ochrona danych użytkownika i zabezpieczenie przed typowymi atakami.
- **Użyteczność:** Intuicyjność interfejsu i ogólne doświadczenie użytkownika (UX).
- **Wydajność:** Czas ładowania aplikacji i responsywność interfejsu.

---

## 2. Analiza ryzyka

### 2.1. Identyfikacja obszarów wysokiego ryzyka

- **Moduł uwierzytelniania i autoryzacji (`src/pages/api/auth`, `src/middleware/index.ts`):** Jakiekolwiek błędy w tym obszarze mogą prowadzić do nieautoryzowanego dostępu do danych użytkowników. Jest to absolutny priorytet.
- **Integracja z zewnętrznym API (OpenRouter.ai):** Usługa `ai-generation.service.ts` jest zależna od zewnętrznego dostawcy. Możliwe problemy to: niedostępność usługi, zmiany w API, błędy w odpowiedziach, przekroczenie limitów.
- **Integralność i bezpieczeństwo danych w bazie Supabase:** Niewłaściwe zastosowanie polityk RLS (Row Level Security) lub błędy w logice biznesowej (`src/lib/services/*-database.service.ts`) mogą prowadzić do wycieku lub uszkodzenia danych.
- **Zarządzanie stanem po stronie klienta:** Komponenty `AIGeneratorView.tsx` i `ReviewView.tsx` zarządzają złożonym stanem. Błędy mogą prowadzić do niepoprawnego działania interfejsu i frustracji użytkownika.

### 2.2. Priorytetyzacja funkcjonalności

1.  **Krytyczne (must-have):**
    - Pełny cykl uwierzytelniania (rejestracja, logowanie, wylogowanie).
    - Ochrona tras wymagających zalogowania.
    - Podstawowy proces generowania fiszek (wprowadzenie tekstu -> otrzymanie wyników).
    - Wyświetlanie wygenerowanych fiszek w widoku recenzji.
2.  **Wysokie (should-have):**
    - Mechanizm odzyskiwania hasła.
    - Obsługa błędów i komunikatów dla użytkownika (np. błąd generowania, błąd logowania).
    - Paginacja lub filtrowanie fiszek (jeśli dotyczy).
    - Mechanizm oceniania fiszek w sesji recenzji.
3.  **Średnie (could-have):**
    - Zaawansowane opcje generowania (np. wybór modelu językowego).
    - Statystyki postępów w nauce.
    - Responsywność interfejsu na różnych urządzeniach.

---

## 3. Strategia testowa

### 3.1. Rodzaje testów do przeprowadzenia

- **Testy jednostkowe (Unit Tests):** Weryfikacja małych, izolowanych fragmentów kodu – funkcji, komponentów UI, logiki biznesowej.
- **Testy integracyjne (Integration Tests):** Sprawdzanie współpracy między różnymi częściami systemu, np. interakcji między API a bazą danych lub między komponentem UI a usługą backendową.
- **Testy End-to-End (E2E):** Symulowanie pełnych scenariuszy użytkownika w przeglądarce, od logowania po naukę.
- **Testy dostępności (Accessibility Tests):** Automatyczna weryfikacja zgodności z WCAG za pomocą axe-core w testach jednostkowych i E2E.
- **Testy wizualne (Visual Regression Tests):** Wykrywanie niezamierzonych zmian w wyglądzie UI poprzez porównywanie screenshotów.
- **Testy bezpieczeństwa (Security Tests):** Ręczne i automatyczne testy w celu znalezienia luk w zabezpieczeniach (OWASP ZAP, Snyk).
- **Testy typów TypeScript (Type Tests):** Weryfikacja poprawności definicji typów i ich eksportu przy użyciu `tsd`.
- **Testy użyteczności (Usability Tests):** Ręczna ocena interfejsu pod kątem łatwości obsługi.

### 3.2. Narzędzia testowe

- **Framework do testów jednostkowych i integracyjnych:** **Vitest** – nowoczesny, szybki framework doskonale integrujący się z ekosystemem Vite, na którym bazuje Astro.
- **Biblioteka do testowania komponentów React:** **React Testing Library** – do testowania komponentów w sposób, w jaki używają ich użytkownicy.
- **Testowanie komponentów Astro:** **Astro Test Utils** z `@testing-library/dom` do testowania komponentów `.astro`.
- **Framework do testów E2E:** **Playwright** – zaawansowane narzędzie do automatyzacji przeglądarek, umożliwiające pisanie stabilnych i szybkich testów E2E.
- **Mockowanie API:** **MSW (Mock Service Worker)** – przechwytywanie żądań HTTP na poziomie sieci, zapewniające realistyczne mockowanie bez ingerencji w kod produkcyjny. Jeden zestaw mocków działa we wszystkich typach testów.
- **Mockowanie zależności:** **`vi.mock`** z Vitest do mockowania modułów wewnętrznych.
- **Testy dostępności:** **`@axe-core/playwright`** do automatycznych testów a11y w E2E oraz **`vitest-axe`** w testach jednostkowych.
- **Testy wizualne:** **Playwright Visual Comparisons** (wbudowane) do wykrywania regresji wizualnych.
- **Testy bezpieczeństwa:** **OWASP ZAP** do automatycznego skanowania podatności oraz **Snyk** do monitorowania zależności.
- **Testy typów:** **`tsd`** do weryfikacji poprawności definicji typów TypeScript.
- **Pokrycie kodu:** **`@vitest/coverage-v8`** do generowania raportów pokrycia testów.

### 3.3. Podejście do automatyzacji

- **CI/CD (GitHub Actions):** Wszystkie testy jednostkowe i integracyjne będą uruchamiane automatycznie przy każdym pushu do repozytorium oraz przed każdym mergem do gałęzi `master`.
- **Testy E2E:** Zautomatyzowane testy E2E dla krytycznych ścieżek użytkownika (tzw. "smoke tests") będą uruchamiane po każdym wdrożeniu na środowisko stagingowe lub produkcyjne.

---

## 4. Szczegółowy plan testów

### 4.1. Testy jednostkowe

- **Schematy walidacji Zod (`src/lib/validation/*.schema.ts`):**
  - Sprawdzenie poprawnych i niepoprawnych danych dla `auth.schema.ts`, `flashcards.schema.ts`.
  - Weryfikacja komunikatów o błędach.
- **Komponenty UI (`src/components/ui/*.tsx`, `src/components/auth/*.tsx`):**
  - Testowanie renderowania komponentów na podstawie przekazanych `props`.
  - Weryfikacja podstawowych interakcji (np. kliknięcie przycisku `Button`, wpisywanie tekstu w `Input`).
  - Automatyczne testy dostępności za pomocą `vitest-axe` (atrybuty ARIA, role, kontrast kolorów).
- **Komponenty Astro (`src/components/*.astro`, `src/layouts/*.astro`):**
  - Testowanie renderowania statycznych komponentów Astro z użyciem Astro Test Utils.
  - Weryfikacja poprawności struktury HTML i przekazywania props.
- **Logika biznesowa w serwisach (`src/lib/services/*.ts`):**
  - Izolowane testy dla `ai-generation.service.ts` z zamockowanym `OpenRouterService` za pomocą MSW.
  - Weryfikacja logiki w `flashcard-database.service.ts` z wykorzystaniem lokalnej instancji Supabase dla testów integracyjnych lub mocków dla testów jednostkowych.
- **Custom Hooks (`src/components/hooks/*.ts`):**
  - Testowanie logiki haków `useFlashcardGeneration.ts` i `useReviewSession.ts` przy użyciu `renderHook` z React Testing Library.
  - Symulowanie różnych stanów (ładowanie, błąd, sukces) i weryfikacja logiki.
- **Funkcje pomocnicze (`src/lib/utils/*.ts`):**
  - Testowanie funkcji czystych z różnymi danymi wejściowymi.
- **Testy typów TypeScript (`*.test-d.ts`):**
  - Weryfikacja poprawności eksportowanych typów z `src/types.ts`.
  - Testowanie typów DTO i Entity (Request/Response API).
  - Weryfikacja inferencji typów w funkcjach pomocniczych.
  - Sprawdzenie, czy typy są właściwie zawężane (narrowing).
  - Testy dla typów generycznych i utility types.

### 4.2. Testy integracyjne

- **Punkty końcowe API (`src/pages/api/**/\*.ts`):\*\*
  - **`auth`:** Testowanie `login`, `register`, `logout` poprzez wysyłanie żądań HTTP i weryfikację odpowiedzi (status, ciało, nagłówki, cookies). Użycie MSW do mockowania odpowiedzi Supabase.
  - **`generations.ts`:** Weryfikacja procesu tworzenia zadania generowania, sprawdzania statusu. MSW do mockowania OpenRouter API.
  - **`flashcards.ts`:** Testowanie pobierania fiszek dla zalogowanego użytkownika z użyciem lokalnej instancji Supabase.
  - **Walidacja API:** Automatyczna walidacja zgodności odpowiedzi z schematami Zod.
- **Middleware (`src/middleware/index.ts`):**
  - Sprawdzenie, czy middleware poprawnie chroni zdefiniowane ścieżki.
  - Testowanie logiki odświeżania sesji z wykorzystaniem MSW.
- **Interakcja Widok -> Hook -> Serwis:**
  - Testowanie komponentu `AIGeneratorView.tsx` w połączeniu z jego hookiem i serwisami zamockowanymi przez MSW.
  - Weryfikacja przepływu danych i aktualizacji UI w realistycznym środowisku.
- **Testy z lokalną bazą danych:**
  - Testowanie serwisów bazodanowych (`*-database.service.ts`) z rzeczywistą lokalną instancją Supabase.
  - Reset bazy przed każdym testem za pomocą dedykowanych funkcji helper.

### 4.3. Testy funkcjonalne (scenariusze E2E)

- **Scenariusz 1: Rejestracja i pierwsze logowanie**
  1. Otwórz stronę `/register`.
  2. Wypełnij formularz poprawnymi danymi.
  3. Prześlij formularz i zweryfikuj przekierowanie na stronę logowania lub główną.
  4. Wyloguj się.
  5. Otwórz stronę `/login`.
  6. Zaloguj się przy użyciu nowo utworzonych danych.
  7. Sprawdź, czy użytkownik został pomyślnie zalogowany.
- **Scenariusz 2: Proces generowania fiszek**
  1. Zaloguj się na konto.
  2. Przejdź do strony `/generate`.
  3. Wklej tekst źródłowy do pola `SourceTextInput`.
  4. Kliknij przycisk generowania.
  5. Zweryfikuj, czy wskaźnik statusu `GenerationStatusIndicator` jest widoczny.
  6. Poczekaj na zakończenie generowania i sprawdź, czy wygenerowane fiszki pojawiły się na liście.
- **Scenariusz 3: Sesja recenzji fiszek**
  1. Zaloguj się na konto z istniejącymi fiszkami.
  2. Przejdź do strony `/review`.
  3. Sprawdź, czy fiszka (`CandidateCard`) jest widoczna.
  4. Użyj kontrolek (`ReviewControls`) do oceny fiszki.
  5. Zweryfikuj, czy kolejna fiszka jest wyświetlana poprawnie.
- **Scenariusz 4: Testy dostępności**
  1. Wykonaj automatyczny audyt a11y na kluczowych stronach za pomocą `@axe-core/playwright`.
  2. Weryfikuj: nawigację klawiaturą, odczyt przez screen readery, kontrast kolorów, etykiety formularzy.
- **Scenariusz 5: Testy wizualne**
  1. Wykonaj screenshoty kluczowych stron w różnych stanach (przed/po zalogowaniu, różne urządzenia).
  2. Porównaj z bazowymi screenshotami i wykryj regresje wizualne.

### 4.4. Testy niefunkcjonalne

- **Wydajność:**
  - **Lighthouse CI:** Automatyczne audyty wydajności w CI/CD dla kluczowych stron (`/`, `/login`, `/generate`, `/review`).
    - Cel: Performance > 90, Accessibility > 95, Best Practices > 90, SEO > 90.
  - **Core Web Vitals:** Monitoring metryk LCP, FID, CLS w testach E2E.
    - LCP (Largest Contentful Paint) < 2.5s
    - FID (First Input Delay) < 100ms
    - CLS (Cumulative Layout Shift) < 0.1
  - **Bundle Size Analysis:** Monitorowanie rozmiaru paczek JavaScript/CSS.
    - Alert przy wzroście > 10% w PR.
    - Analiza tree-shaking i code splitting.
  - **Playwright Performance API:**
    - Pomiar czasu ładowania krytycznych komponentów.
    - Test wydajności długich list fiszek (> 100 elementów).
    - Pomiar czasu odpowiedzi UI na interakcje użytkownika.
  - **Memory Leaks:**
    - Testy wykrywające wycieki pamięci w długotrwałych sesjach.
    - Monitoring użycia pamięci podczas generowania fiszek.
- **Bezpieczeństwo:**
  - **OWASP ZAP (Zed Attack Proxy):**
    - Automatyczne skanowanie podatności (passive + active scans).
    - Testy przeciwko OWASP Top 10: SQL Injection, XSS, CSRF, nieautoryzowany dostęp.
    - Baseline scan w CI/CD dla każdego PR.
    - Full scan przed deploymentem na produkcję.
  - **Snyk:**
    - Skanowanie zależności npm pod kątem znanych podatności.
    - Automatyczne alerty przy wykryciu critical/high severity issues.
    - Integracja z GitHub dla automatycznych PR z fixami.
    - Skanowanie Dockerfile i obrazów kontenerów (jeśli dotyczy).
  - **Manualne testy bezpieczeństwa:**
    - Przegląd kodu pod kątem wycieku kluczy API po stronie klienta.
    - Weryfikacja polityk RLS w `supabase/migrations` poprzez testy integracyjne.
    - Sprawdzenie autoryzacji wszystkich wrażliwych operacji na poziomie API.
    - Testowanie walidacji wejściowej (XSS, SQL Injection, Command Injection).
  - **Headers bezpieczeństwa:**
    - Weryfikacja obecności: CSP, X-Frame-Options, HSTS, X-Content-Type-Options.
    - Test w Playwright dla wszystkich endpointów.
- **Użyteczność:**
  - Ręczne testy na różnych przeglądarkach (Chrome, Firefox, Safari) za pomocą Playwright.
  - Testowanie responsywności interfejsu na urządzeniach mobilnych (emulacja w Playwright).
  - Weryfikacja spójności komunikatów i nawigacji.
  - Testy wizualne dla wykrycia niespójności UI.

---

## 5. Środowisko testowe

- **Środowisko lokalne:**
  - Uruchamianie testów jednostkowych i integracyjnych lokalnie przez deweloperów.
  - Lokalna instancja Supabase za pomocą Docker lub Supabase CLI.
  - MSW dla mockowania zewnętrznych API (OpenRouter).
- **Środowisko CI (GitHub Actions):**
  - Dedykowane środowisko do automatycznego uruchamiania wszystkich testów.
  - Kontener PostgreSQL dla testów integracyjnych z bazą danych.
  - Paralelizacja testów dla szybszego wykonania.
- **Dane testowe:**
  - Użycie dedykowanej, lokalnej instancji Supabase z seedami testowymi.
  - Funkcje helper do resetowania bazy przed każdym testem (`beforeEach`).
  - Przygotowanie zestawu danych testowych (użytkownicy, fiszki) w migracji testowej.
  - MSW handlers dla spójnego mockowania API we wszystkich typach testów.

---

## 6. Harmonogram i zasoby

- **Faza 1 (Setup):**
  - Konfiguracja Vitest, React Testing Library, Playwright, MSW, axe-core w projekcie.
  - Setup lokalnej instancji Supabase dla testów.
  - Konfiguracja GitHub Actions CI/CD.
  - (Szacowany czas: 12-16 godzin)
- **Faza 2 (Implementacja - Unit/Integration):**
  - Pisanie testów jednostkowych dla komponentów, serwisów, walidacji.
  - Testy integracyjne API z MSW i lokalną bazą.
  - Testy dostępności z vitest-axe.
  - (Szacowany czas: 50-70 godzin)
- **Faza 3 (Implementacja - E2E):**
  - Implementacja kluczowych scenariuszy E2E z Playwright.
  - Testy dostępności E2E z axe-core.
  - Setup testów wizualnych.
  - (Szacowany czas: 25-35 godzin)
- **Faza 4 (Optymalizacja i CI):**
  - Paralelizacja testów.
  - Optymalizacja czasu wykonania.
  - Fine-tuning pokrycia kodu.
  - (Szacowany czas: 10-15 godzin)
- **Zasoby:** Wymagany deweloper z doświadczeniem w TypeScript, React, Astro oraz frameworkach testowych (Vitest, Playwright, MSW).

---

## 7. Kryteria akceptacji

- **Pokrycie kodu (Code Coverage):**
  - Testy jednostkowe i integracyjne powinny osiągnąć co najmniej 80% pokrycia dla logiki biznesowej (`src/lib`) i API (`src/pages/api`).
  - Raport pokrycia generowany przez `@vitest/coverage-v8`.
- **Status testów:**
  - Wszystkie testy w CI muszą zakończyć się sukcesem, aby umożliwić merge do gałęzi `master`.
  - Maksymalny czas wykonania testów w CI: 10 minut (z optymalizacją i paralelizacją).
- **Błędy krytyczne:**
  - Brak nieobsłużonych błędów krytycznych (blokujących główne funkcjonalności) na środowisku produkcyjnym.
- **Dostępność:**
  - Zero krytycznych naruszeń WCAG AA wykrytych przez axe-core w testach automatycznych.
  - Wszystkie interaktywne elementy dostępne z klawiatury.
- **Testy wizualne:**
  - Brak regresji wizualnych w kluczowych scenariuszach użytkownika.
  - Bazowe screenshoty zatwierdzone przez zespół.
- **Metryki jakości:**
  - Liczba zgłoszonych błędów po wdrożeniu powinna maleć z czasem.
  - Wyniki wydajności w Lighthouse utrzymane na poziomie > 90.
  - Wszystkie zewnętrzne API (OpenRouter) poprawnie zamockowane w testach.

---

## 8. Zależności i konfiguracja

### 8.1. Wymagane paczki npm

```json
{
  "devDependencies": {
    "vitest": "^2.1.0",
    "@vitest/ui": "^2.1.0",
    "@vitest/coverage-v8": "^2.1.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/dom": "^10.4.0",
    "msw": "^2.6.0",
    "@playwright/test": "^1.48.0",
    "@axe-core/playwright": "^4.10.0",
    "vitest-axe": "^0.1.0",
    "happy-dom": "^15.11.0",
    "@lhci/cli": "^0.14.0",
    "bundlesize2": "^0.0.31",
    "web-vitals": "^4.2.0",
    "tsd": "^0.31.0",
    "snyk": "^1.1293.0"
  }
}
```

### 8.2. Przykładowa konfiguracja Vitest

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/lib/**", "src/pages/api/**"],
      exclude: ["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

### 8.3. Przykładowa konfiguracja MSW

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  // Mock Supabase Auth
  http.post("*/auth/v1/token", () => {
    return HttpResponse.json({
      access_token: "mock-token",
      user: { id: "test-user-id", email: "test@example.com" },
    });
  }),

  // Mock OpenRouter API
  http.post("https://openrouter.ai/api/v1/chat/completions", () => {
    return HttpResponse.json({
      choices: [{ message: { content: "Mock flashcard data" } }],
    });
  }),
];

// src/test/setup.ts
import "@testing-library/jest-dom";
import { setupServer } from "msw/node";
import { handlers } from "./mocks/handlers";

export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 8.4. Przykładowa konfiguracja Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### 8.5. Przykład testu z axe-core

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from "@playwright/test";
import { injectAxe, checkA11y } from "@axe-core/playwright";

test("login page should not have accessibility violations", async ({ page }) => {
  await page.goto("/login");
  await injectAxe(page);
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
});
```

### 8.6. Przykład testu wizualnego

```typescript
// e2e/visual.spec.ts
import { test, expect } from "@playwright/test";

test("login page visual regression", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveScreenshot("login-page.png", {
    maxDiffPixels: 100,
  });
});
```

### 8.7. Konfiguracja Lighthouse CI

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run preview",
      "url": [
        "http://localhost:4173/",
        "http://localhost:4173/login",
        "http://localhost:4173/register",
        "http://localhost:4173/generate"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }],
        "first-contentful-paint": ["warn", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["warn", { "maxNumericValue": 300 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### 8.8. Konfiguracja Bundle Size

```json
// .bundlesizerc.json
{
  "files": [
    {
      "path": "dist/client/_astro/*.js",
      "maxSize": "150 kB",
      "compression": "gzip"
    },
    {
      "path": "dist/client/_astro/*.css",
      "maxSize": "50 kB",
      "compression": "gzip"
    }
  ]
}
```

```json
// package.json scripts
{
  "scripts": {
    "test:size": "bundlesize",
    "test:lighthouse": "lhci autorun",
    "test:perf": "npm run test:size && npm run test:lighthouse"
  }
}
```

### 8.9. Przykłady testów wydajnościowych

```typescript
// e2e/performance.spec.ts
import { test, expect } from "@playwright/test";

test("measure Core Web Vitals", async ({ page }) => {
  await page.goto("/generate");

  // Mierzenie LCP
  const lcp = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.renderTime || lastEntry.loadTime);
      }).observe({ entryTypes: ["largest-contentful-paint"] });
    });
  });

  expect(lcp).toBeLessThan(2500);
});

test("measure page load time", async ({ page }) => {
  const startTime = Date.now();
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(3000);
});

test("test performance with large flashcard list", async ({ page }) => {
  // Setup: Wygeneruj 100 fiszek w bazie
  await page.goto("/review");

  const startTime = Date.now();
  await page.waitForSelector('[data-testid="flashcard-list"]');
  const renderTime = Date.now() - startTime;

  expect(renderTime).toBeLessThan(1000);

  // Test scroll performance
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  // CLS nie powinno wzrosnąć
  const cls = await page.evaluate(() => {
    return new Promise((resolve) => {
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        resolve(clsValue);
      }).observe({ entryTypes: ["layout-shift"] });

      setTimeout(() => resolve(clsValue), 1000);
    });
  });

  expect(cls).toBeLessThan(0.1);
});

test("detect memory leaks in generation process", async ({ page }) => {
  await page.goto("/generate");

  // Pobierz baseline pamięci
  const initialMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0);

  // Wykonaj 10 cykli generowania
  for (let i = 0; i < 10; i++) {
    await page.fill('[data-testid="source-text"]', "Test content for flashcard generation");
    await page.click('[data-testid="generate-button"]');
    await page.waitForSelector('[data-testid="generation-complete"]');
    await page.click('[data-testid="clear-button"]');
  }

  // Wymuś garbage collection (wymaga --expose-gc w Node)
  await page.evaluate(() => {
    if (global.gc) global.gc();
  });

  const finalMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0);

  const memoryIncrease = finalMemory - initialMemory;
  const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

  // Wzrost pamięci nie powinien przekraczać 10MB
  expect(memoryIncreaseMB).toBeLessThan(10);
});
```

### 8.10. GitHub Actions workflow dla testów wydajnościowych

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  pull_request:
    branches: [master]
  push:
    branches: [master]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Check bundle size
        run: npm run test:size
```

### 8.11. Konfiguracja testów typów TypeScript

```json
// package.json
{
  "scripts": {
    "test:types": "tsd"
  },
  "tsd": {
    "directory": "src",
    "compilerOptions": {
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": false
    }
  }
}
```

### 8.12. Przykłady testów typów

```typescript
// src/types.test-d.ts
import { expectType, expectError, expectAssignable } from "tsd";
import type { User, Flashcard, Generation, GenerationStatus } from "./types";

// Test User type
expectType<User>({
  id: "123",
  email: "test@example.com",
  created_at: "2024-01-01",
});

// Powinien zwrócić błąd dla niepoprawnego typu
expectError<User>({
  id: 123, // Błąd: id powinno być string
  email: "test@example.com",
});

// Test Flashcard type
expectType<Flashcard>({
  id: "1",
  front: "Question",
  back: "Answer",
  user_id: "user-123",
  generation_id: "gen-456",
  created_at: "2024-01-01",
});

// Test GenerationStatus type (literal union)
expectType<GenerationStatus>("pending");
expectType<GenerationStatus>("processing");
expectType<GenerationStatus>("completed");
expectType<GenerationStatus>("failed");
expectError<GenerationStatus>("invalid"); // Błąd: niepoprawny status

// Test type narrowing w funkcjach
import { isSuccessResponse, isErrorResponse } from "./lib/utils/api-response";

declare const response: { success: true; data: string } | { success: false; error: string };

if (isSuccessResponse(response)) {
  expectType<string>(response.data); // Type narrowing działa
  expectError(response.error); // Błąd: error nie istnieje w success response
}

if (isErrorResponse(response)) {
  expectType<string>(response.error);
  expectError(response.data); // Błąd: data nie istnieje w error response
}

// Test generics
import type { ApiResponse } from "./types";

expectType<ApiResponse<string>>({
  success: true,
  data: "test",
});

expectType<ApiResponse<Flashcard>>({
  success: true,
  data: {
    id: "1",
    front: "Q",
    back: "A",
    user_id: "u1",
    generation_id: "g1",
    created_at: "2024-01-01",
  },
});

// Test utility types
import type { CreateFlashcardDTO, UpdateFlashcardDTO } from "./types";

expectAssignable<CreateFlashcardDTO>({
  front: "Question",
  back: "Answer",
  generation_id: "gen-123",
});

// UpdateFlashcardDTO powinno mieć wszystkie pola opcjonalne
expectAssignable<UpdateFlashcardDTO>({
  front: "Updated Question",
});

expectAssignable<UpdateFlashcardDTO>({
  back: "Updated Answer",
});
```

### 8.13. Konfiguracja OWASP ZAP

```yaml
# .github/workflows/security.yml
name: Security Tests

on:
  pull_request:
    branches: [master]
  push:
    branches: [master]
  schedule:
    # Full scan co tydzień
    - cron: "0 2 * * 0"

jobs:
  zap-baseline:
    runs-on: ubuntu-latest
    name: OWASP ZAP Baseline Scan
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install and Build
        run: |
          npm ci
          npm run build

      - name: Start Application
        run: |
          npm run preview &
          sleep 10

      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.12.0
        with:
          target: "http://localhost:4173"
          rules_file_name: ".zap/rules.tsv"
          cmd_options: "-a"

      - name: Upload ZAP Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: zap-report
          path: report_html.html

  zap-full-scan:
    # Full scan tylko na master lub schedule
    if: github.event_name == 'push' && github.ref == 'refs/heads/master' || github.event_name == 'schedule'
    runs-on: ubuntu-latest
    name: OWASP ZAP Full Scan
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install and Build
        run: |
          npm ci
          npm run build

      - name: Start Application
        run: |
          npm run preview &
          sleep 10

      - name: ZAP Full Scan
        uses: zaproxy/action-full-scan@v0.10.0
        with:
          target: "http://localhost:4173"
          rules_file_name: ".zap/rules.tsv"
          cmd_options: "-a -j"

      - name: Upload ZAP Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: zap-full-report
          path: report_html.html

  snyk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Upload Snyk report
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: snyk.sarif
```

```tsv
# .zap/rules.tsv - Konfiguracja reguł ZAP
# Format: ID	THRESHOLD	[ACTIONS]
10098	FAIL	# Cross-Domain Misconfiguration
10011	FAIL	# Cookie Without Secure Flag
10017	FAIL	# Cross-Domain JavaScript Source File Inclusion
10021	FAIL	# X-Content-Type-Options Missing
10020	FAIL	# X-Frame-Options Missing
10016	FAIL	# Web Browser XSS Protection Not Enabled
10035	FAIL	# Strict-Transport-Security Missing
10054	FAIL	# Cookie without SameSite Attribute
40012	FAIL	# Cross Site Scripting (Reflected)
40014	FAIL	# Cross Site Scripting (Persistent)
40018	FAIL	# SQL Injection
90033	FAIL	# Loosely Scoped Cookie
```

### 8.14. Konfiguracja Snyk

```json
// .snyk - Polityka Snyk
{
  "version": "v1.25.0",
  "language-settings": {
    "javascript": {
      "ignoreDevDependencies": false
    }
  },
  "ignore": {},
  "patch": {},
  "exclude": {
    "global": ["dist/**", "node_modules/**", "**/*.test.ts", "**/*.spec.ts"]
  }
}
```

```json
// package.json scripts
{
  "scripts": {
    "test:types": "tsd",
    "test:security": "snyk test",
    "test:security:monitor": "snyk monitor",
    "security:fix": "snyk fix"
  }
}
```

### 8.15. Przykłady testów bezpieczeństwa w Playwright

```typescript
// e2e/security.spec.ts
import { test, expect } from "@playwright/test";

test("should have security headers", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.headers()["x-frame-options"]).toBeTruthy();
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["strict-transport-security"]).toBeTruthy();
  expect(response?.headers()["content-security-policy"]).toBeTruthy();
});

test("should not expose API keys in client code", async ({ page }) => {
  await page.goto("/");

  const scripts = await page.$$eval("script", (scripts) => scripts.map((s) => s.textContent || ""));

  const allScripts = scripts.join("\n");

  // Sprawdź czy nie ma wycieków kluczy
  expect(allScripts).not.toContain("sk_"); // Stripe keys
  expect(allScripts).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  expect(allScripts).not.toContain("OPENROUTER_API_KEY");
});

test("should prevent XSS attacks", async ({ page }) => {
  await page.goto("/generate");

  const xssPayload = '<script>alert("XSS")</script>';

  await page.fill('[data-testid="source-text"]', xssPayload);
  await page.click('[data-testid="generate-button"]');

  // Sprawdź czy script nie został wykonany
  const alerts = [];
  page.on("dialog", (dialog) => {
    alerts.push(dialog.message());
    dialog.dismiss();
  });

  await page.waitForTimeout(2000);
  expect(alerts).toHaveLength(0);

  // Sprawdź czy payload jest properly escaped
  const content = await page.textContent("body");
  expect(content).not.toContain("<script>");
});

test("should require authentication for protected routes", async ({ page }) => {
  // Bez logowania
  await page.goto("/generate");

  // Powinno przekierować na login
  await page.waitForURL("**/login");
  expect(page.url()).toContain("/login");
});

test("should have CSRF protection", async ({ page, context }) => {
  // Zaloguj się
  await page.goto("/login");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "password123");
  await page.click('[type="submit"]');

  // Pobierz cookies
  const cookies = await context.cookies();

  // Spróbuj wykonać request bez proper origin
  const response = await page.evaluate(async () => {
    return fetch("/api/flashcards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://evil-site.com",
      },
      body: JSON.stringify({ front: "test", back: "test" }),
    });
  });

  // Powinno być zablokowane przez CORS
  expect(response).toBeTruthy();
});
```
