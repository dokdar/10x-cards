# System Feature Flags - Plan Implementacji

## Przegląd

System feature flags umożliwia rozdzielenie deploymentów od release'ów poprzez kontrolowanie dostępności funkcjonalności na poziomie środowiska. Implementacja jest type-safe, uniwersalna (frontend + backend) i oparta na statycznej konfiguracji ładowanej przy starcie aplikacji.

## Cele

- **Rozdzielenie deploymentów od release'ów** - wdrażaj kod z wyłączonymi funkcjami
- **Kontrola per środowisko** - różne funkcje w różnych środowiskach (local, integration, prod)
- **Type-safe konfiguracja** - pełne wsparcie TypeScript z weryfikacją w czasie kompilacji
- **Uniwersalne użycie** - działa w stronach Astro, API routes i komponentach React
- **Prostota i łatwość utrzymania** - minimalna złożoność, brak zewnętrznych zależności
- **Przyjazne komunikaty** - jasne informacje gdy funkcja jest wyłączona

## Architektura

### Konfiguracja Środowiska

Środowisko jest określane przez zmienną `PUBLIC_ENV_NAME`:
- `local` - Środowisko deweloperskie
- `integration` - Środowisko testowe/staging
- `prod` - Środowisko produkcyjne

**WAŻNE - Zachowanie Fail-Safe:**
- Jeśli `PUBLIC_ENV_NAME` **nie jest ustawiony** lub ma **nieprawidłową wartość**, system zwraca środowisko `null`
- Gdy środowisko to `null`, **WSZYSTKIE flagi są wyłączone** (fail-safe)
- Zabezpiecza to przed przypadkowym włączeniem funkcji w źle skonfigurowanym środowisku produkcyjnym

**WAŻNE - Prefiks PUBLIC_:**
- Prefiks `PUBLIC_` jest **wymagany** aby Astro/Vite udostępniło zmienną w kodzie klienta
- Bez tego prefiksu komponenty React nie mają dostępu do zmiennej środowiskowej
- Zapewnia to działanie feature flags zarówno po stronie serwera jak i klienta

```env
# .env
# WYMAGANE: Musi być jedną z wartości: local, integration, prod
# Prefiks PUBLIC_ zapewnia dostępność w kodzie serwera i klienta
PUBLIC_ENV_NAME=local
```

### Dostępne Flagi

Zdefiniowane feature flags:
- **`auth`** - Funkcjonalność autoryzacji (login, register, reset hasła)
- **`flashcards`** - Zarządzanie fiszkami i powtórki
- **`generations`** - Generowanie fiszek przez AI

### Struktura Plików

```
src/features/
├── index.ts          # Główne exporty - pojedynczy punkt wejścia
├── types.ts          # Definicje typów TypeScript
├── config.ts         # Konfiguracja per środowisko
├── core.ts           # Podstawowe funkcje sprawdzania flag
├── astro.ts          # Helpery dla stron Astro (checkFeatureOrRedirect)
├── api.ts            # Middleware/guardy dla API (requireFeature)
├── react.tsx         # Hooki i komponenty React (useFeature, FeatureGate)
├── README.md         # Pełna dokumentacja (EN)
└── EXAMPLES.md       # Przykłady użycia (PL)

src/pages/
└── feature-disabled.astro  # Strona informująca o wyłączonej funkcji
```

## Konfiguracja

### Definicja Flag

```typescript
// src/features/config.ts
export const FEATURE_FLAGS: FeatureFlagsConfig = {
  local: {
    auth: true,
    flashcards: true,
    generations: true,
  },
  integration: {
    auth: true,
    flashcards: true,
    generations: false, // Wyłączone w integration do testów
  },
  prod: {
    auth: true,
    flashcards: true,
    generations: true,
  },
};
```

### Zmienna Środowiskowa

```typescript
// src/env.d.ts
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly PUBLIC_ENV_NAME?: string; // Środowisko dla feature flags (PUBLIC_ dla dostępu w kliencie)
  // ... inne zmienne
}
```

## Wzorce Użycia

### 1. Strony Astro - Ochrona Całej Strony

Zabezpiecz dostęp do strony gdy funkcja jest wyłączona:

```astro
---
// src/pages/login.astro
import { checkFeatureOrRedirect } from "@/features";

export const prerender = false;

// Sprawdź czy auth jest włączony, przekieruj jeśli nie
const redirect = checkFeatureOrRedirect(Astro, "auth", "Autoryzacja");
if (redirect) return redirect;

// Funkcja włączona - kontynuuj logikę strony
const { user } = Astro.locals;
if (user) {
  return Astro.redirect("/");
}
---

<AuthLayout>
  <LoginForm client:load />
</AuthLayout>
```

### 2. Endpointy API - Ochrona Route'ów

Zabezpiecz endpointy API za pomocą flag:

```typescript
// src/pages/api/flashcards/create.ts
import type { APIContext } from "astro";
import { requireFeature } from "@/features";

export async function POST(context: APIContext) {
  // Sprawdź czy flashcards są włączone
  const featureCheck = requireFeature("flashcards", "Fiszki");
  if (featureCheck) return featureCheck; // Zwraca 503 jeśli wyłączone

  // Funkcja włączona - kontynuuj logikę endpointu
  const data = await context.request.json();
  // ... logika tworzenia fiszki

  return new Response(JSON.stringify({ success: true }));
}
```

### 3. Komponenty React - Warunkowe Renderowanie

#### Używając Hooka

```tsx
import { useFeature } from "@/features";

function Navigation() {
  const isFlashcardsEnabled = useFeature("flashcards");
  const isGenerationsEnabled = useFeature("generations");

  return (
    <nav>
      <a href="/">Home</a>
      {isFlashcardsEnabled && <a href="/flashcards">Fiszki</a>}
      {isGenerationsEnabled && <a href="/generate">Generator</a>}
    </nav>
  );
}
```

#### Używając Komponentu

```tsx
import { FeatureGate } from "@/features";

function Dashboard() {
  return (
    <div>
      <FeatureGate
        feature="flashcards"
        fallback={<p>Fiszki są obecnie niedostępne</p>}
      >
        <FlashcardsList />
      </FeatureGate>
    </div>
  );
}
```

### 4. Sprawdzanie Wielu Flag

```astro
---
import { checkFeaturesOrRedirect } from "@/features";

// Wymaga włączenia OBU: flashcards ORAZ generations
const redirect = checkFeaturesOrRedirect(
  Astro,
  ["flashcards", "generations"],
  "Generator AI Fiszek"
);
if (redirect) return redirect;
---
```

## Zachowanie Gdy Funkcja Jest Wyłączona

### Strony Astro
- **Akcja**: Przekierowanie do `/feature-disabled`
- **Parametry**:
  - `?feature=<nazwa>` - Czytelna nazwa funkcji
  - `?from=<ścieżka>` - Oryginalna ścieżka do której próbował wejść użytkownik
- **UX**: Przyjazna strona z wyjaśnieniem i opcjami powrotu

### Endpointy API
- **Status Code**: 503 Service Unavailable
- **Treść Odpowiedzi**:
  ```json
  {
    "error": "Feature is currently disabled",
    "code": "FEATURE_DISABLED",
    "feature": "Fiszki",
    "message": "The Fiszki feature is currently unavailable. Please try again later."
  }
  ```
- **Nagłówki**: `Retry-After: 3600` (sugeruje ponowienie za 1 godzinę)

### Komponenty React
- **Z FeatureGate**: Renderuje komponent fallback
- **Z useFeature**: Zwraca `false`, komponent obsługuje warunkowe renderowanie
- **UX**: Kontekstowy fallback UI lub ukryte elementy nawigacji

## Plan Integracji

### Faza 1: Główne Strony Autoryzacji (Priorytet 1)

**Pliki do aktualizacji:**
- `src/pages/login.astro`
- `src/pages/register.astro`
- `src/pages/reset-password.astro`
- `src/pages/forgot-password.astro`

**Zmiany:**
```astro
---
import { checkFeatureOrRedirect } from "@/features";

const redirect = checkFeatureOrRedirect(Astro, "auth", "Autoryzacja");
if (redirect) return redirect;
---
```

### Faza 2: Endpointy API (Priorytet 1)

**Pliki do aktualizacji:**
- `src/pages/api/auth/login.ts`
- `src/pages/api/auth/register.ts`
- `src/pages/api/auth/logout.ts`
- `src/pages/api/auth/reset-password.ts`
- `src/pages/api/flashcards/**/*.ts`
- `src/pages/api/generations/**/*.ts`

**Zmiany:**
```typescript
import { requireFeature } from "@/features";

export async function POST(context: APIContext) {
  const check = requireFeature("auth", "Autoryzacja");
  if (check) return check;
  // ... logika endpointu
}
```

### Faza 3: Komponenty Nawigacji (Priorytet 2)

**Pliki do aktualizacji:**
- `src/components/Header.tsx`
- `src/components/BottomNavigation.tsx`
- `src/components/MobileMenu.tsx` (jeśli istnieje)

**Zmiany:**
```tsx
import { useFeature } from "@/features";

function Navigation() {
  const isAuthEnabled = useFeature("auth");
  const isFlashcardsEnabled = useFeature("flashcards");
  const isGenerationsEnabled = useFeature("generations");

  return (
    <nav>
      {isAuthEnabled && <a href="/login">Zaloguj się</a>}
      {isFlashcardsEnabled && <a href="/flashcards">Fiszki</a>}
      {isGenerationsEnabled && <a href="/generate">Generator</a>}
    </nav>
  );
}
```

### Faza 4: Główne Widoki Aplikacji (Priorytet 2)

**Pliki do aktualizacji:**
- `src/pages/generate.astro`
- `src/pages/review/[id].astro`
- `src/pages/flashcards/index.astro` (jeśli istnieje)

**Zmiany:**
```astro
---
import { checkFeatureOrRedirect } from "@/features";

const redirect = checkFeatureOrRedirect(Astro, "generations", "Generator AI");
if (redirect) return redirect;
---
```

### Faza 5: Integracja z Mobilną Nawigacją (Priorytet 3)

**Kontekst**: Integracja z specyfikacją mobilnej nawigacji (.ai/mobile-navigation.md)

**Pliki do aktualizacji:**
- `src/components/BottomNavigation.tsx`

**Implementacja:**
```tsx
import { useFeature } from "@/features";

export function BottomNavigation({ currentPath, user }: Props) {
  const isAuthEnabled = useFeature("auth");
  const isFlashcardsEnabled = useFeature("flashcards");
  const isGenerationsEnabled = useFeature("generations");

  const navItems = [
    { id: "home", label: "Home", icon: Home, path: "/", enabled: true },
    {
      id: "generator",
      label: "Generator",
      icon: Zap,
      path: "/generate",
      auth: true,
      enabled: isGenerationsEnabled
    },
    {
      id: "review",
      label: "Powtórki",
      icon: BookOpen,
      path: "/review",
      auth: true,
      enabled: isFlashcardsEnabled
    },
    {
      id: "profile",
      label: "Profil",
      icon: User,
      path: "/profile",
      auth: true,
      enabled: isAuthEnabled
    },
    {
      id: "login",
      label: "Zaloguj",
      icon: LogIn,
      path: "/login",
      auth: false,
      enabled: isAuthEnabled
    },
  ];

  const visibleItems = user
    ? navItems.filter((item) => item.enabled && (item.auth || item.id === "home"))
    : navItems.filter((item) => item.enabled && !item.auth);

  return (
    <nav className="bottom-nav md:hidden">
      {visibleItems.map((item) => (
        <a key={item.id} href={item.path} className="nav-item">
          <item.icon size={20} />
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
```

### Faza 6: Testowanie i Dokumentacja (Priorytet 3)

**Zadania:**
- Przetestować wszystkie trzy środowiska (local, integration, prod)
- Udokumentować procedury rollout
- Stworzyć plan rollback
- Zaktualizować dokumentację zespołu

## Dodawanie Nowych Funkcji

### Krok 1: Aktualizuj Typy

```typescript
// src/features/types.ts
export type FeatureName =
  | "auth"
  | "flashcards"
  | "generations"
  | "nowa-funkcja"; // Dodaj nową funkcję
```

### Krok 2: Skonfiguruj Środowiska

```typescript
// src/features/config.ts
export const FEATURE_FLAGS: FeatureFlagsConfig = {
  local: {
    auth: true,
    flashcards: true,
    generations: true,
    "nowa-funkcja": true, // Włącz w local do developmentu
  },
  integration: {
    auth: true,
    flashcards: true,
    generations: true,
    "nowa-funkcja": false, // Wyłącz w integration
  },
  prod: {
    auth: true,
    flashcards: true,
    generations: true,
    "nowa-funkcja": false, // Wyłącz w prod (nie gotowe)
  },
};
```

### Krok 3: Zaimplementuj Funkcję

Użyj flag w swoim kodzie:

```typescript
import { isFeatureEnabled } from "@/features";

if (isFeatureEnabled("nowa-funkcja")) {
  // Logika nowej funkcji
}
```

### Krok 4: Testuj W Różnych Środowiskach

```bash
# Testuj w local
PUBLIC_ENV_NAME=local npm run dev

# Testuj w integration
PUBLIC_ENV_NAME=integration npm run build
npm run preview

# Deploy do prod (funkcja wyłączona)
PUBLIC_ENV_NAME=prod npm run build
```

### Krok 5: Stopniowy Rollout

1. Deploy do integration z wyłączoną funkcją
2. Włącz funkcję w integration, dokładnie przetestuj
3. Deploy do prod z wyłączoną funkcją
4. Włącz funkcję w konfiguracji prod
5. Deploy zaktualizowanej konfiguracji
6. Monitoruj i weryfikuj

### Krok 6: Sprzątanie

Po pełnym rollout:
1. Usuń sprawdzanie flag z kodu
2. Usuń funkcję z konfiguracji
3. Zaktualizuj dokumentację

## Strategia Testowania

### Testy Jednostkowe

```typescript
import { isFeatureEnabled, getFeatureStatus } from "@/features";

describe("Feature Flags", () => {
  it("powinien zwrócić true dla włączonych funkcji", () => {
    expect(isFeatureEnabled("auth")).toBe(true);
  });

  it("powinien zwrócić status funkcji", () => {
    const status = getFeatureStatus("flashcards");
    expect(status.enabled).toBeDefined();
    expect(status.environment).toMatch(/local|integration|prod/);
  });
});
```

### Testy Integracyjne

```typescript
// Test endpointu API z feature flag
describe("POST /api/flashcards/create", () => {
  it("powinien zwrócić 503 gdy funkcja jest wyłączona", async () => {
    // Mock funkcji jako wyłączonej
    const response = await fetch("/api/flashcards/create", {
      method: "POST",
      body: JSON.stringify({ title: "Test" }),
    });

    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.code).toBe("FEATURE_DISABLED");
  });
});
```

### Testy E2E

```typescript
// Test ochrony strony z feature flag
test("powinien przekierować do feature-disabled gdy auth jest wyłączony", async ({ page }) => {
  // Ustaw ENV_NAME na środowisko z wyłączonym auth
  await page.goto("/login");

  // Powinien przekierować do feature-disabled
  await expect(page).toHaveURL(/\/feature-disabled/);
  await expect(page.locator("h1")).toContainText("Funkcja niedostępna");
});
```

## Strategia Wdrożenia

### Konfiguracja Środowisk

**Local Development:**
```env
PUBLIC_ENV_NAME=local
# Wszystkie funkcje włączone do developmentu
```

**Integration/Staging:**
```env
PUBLIC_ENV_NAME=integration
# Testuj nowe funkcje przed produkcją
```

**Production:**
```env
PUBLIC_ENV_NAME=prod
# Tylko stabilne funkcje włączone
```

### Proces Rollout

1. **Faza Developmentu**
   - Funkcja włączona tylko w `local`
   - Lokalne testowanie i development

2. **Faza Integration**
   - Deploy do integration z funkcją **wyłączoną**
   - Włącz funkcję w konfiguracji integration
   - Kompleksowe testowanie (manualne + automatyczne)

3. **Deployment Produkcyjny**
   - Deploy do produkcji z funkcją **wyłączoną**
   - Monitoruj bazowe metryki
   - Brak zmian widocznych dla użytkowników

4. **Aktywacja Produkcyjna**
   - Włącz funkcję w konfiguracji produkcyjnej
   - Deploy aktualizacji konfiguracji
   - Monitoruj błędy, performance, feedback użytkowników

5. **Faza Sprzątania**
   - Po stabilnym rollout (1-4 tygodnie)
   - Usuń feature flag z kodu
   - Zaktualizuj dokumentację

### Plan Rollback

**Szybki Rollback** (Zmiana Konfiguracji):
```typescript
// src/features/config.ts
prod: {
  auth: true,
  flashcards: true,
  generations: false, // Wyłącz problematyczną funkcję
}
```
Deploy aktualizacji konfiguracji (~5 minut).

**Pełny Rollback** (Revert Kodu):
- Powrót do poprzedniego deploymentu
- Feature flag zapobiega wykonaniu kodu
- Użytkownicy widzą stronę feature-disabled

## Bezpieczeństwo

### Ekspozycja Po Stronie Klienta

Feature flags **NIE SĄ granicami bezpieczeństwa**. Kontrolują:
- Widoczność UI
- Dostępność nawigacji
- Przepływ doświadczenia użytkownika

Zawsze implementuj właściwe sprawdzanie autoryzacji na backendzie.

### Ochrona Backendu

```typescript
// Endpoint API powinien ZAWSZE sprawdzać uprawnienia
export async function POST(context: APIContext) {
  // 1. Sprawdzenie feature flag
  const featureCheck = requireFeature("flashcards");
  if (featureCheck) return featureCheck;

  // 2. Sprawdzenie autentykacji
  const { user } = context.locals;
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // 3. Sprawdzenie autoryzacji
  const canCreate = await checkUserPermission(user, "create_flashcards");
  if (!canCreate) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }

  // 4. Logika biznesowa
  // ...
}
```

## Najlepsze Praktyki

1. **Zacznij od wyłączenia** - Nowe funkcje domyślnie wyłączone w prod
2. **Opisowe nazwy** - Używaj czytelnych nazw funkcji w przekierowaniach/błędach
3. **Sprzątaj stare flagi** - Usuwaj flagi po pełnym rollout
4. **Dokumentuj cel funkcji** - Komentuj dlaczego feature flag istnieje
5. **Testuj wszystkie środowiska** - Weryfikuj zachowanie w local, integration i prod
6. **Monitoruj po włączeniu** - Obserwuj błędy i metryki wydajności
7. **Stopniowy rollout** - Włącz w integration przed prod
8. **Jasna komunikacja** - Informuj zespół o zmianach flag

## Rozwiązywanie Problemów

### Problem: Wszystkie funkcje są wyłączone, mimo że powinny być włączone

**Rozwiązanie**: Sprawdź zmienną środowiskową `PUBLIC_ENV_NAME`. Jeśli nie jest ustawiona lub ma nieprawidłową wartość (nie `local`, `integration`, ani `prod`), system domyślnie wyłącza wszystkie funkcje jako mechanizm fail-safe. Ustaw `PUBLIC_ENV_NAME=local` w pliku `.env`. **WAŻNE**: Prefiks `PUBLIC_` jest wymagany aby zmienna była dostępna w kodzie klienta (React).

```bash
# Sprawdź obecną wartość
echo $PUBLIC_ENV_NAME

# Poprawne wartości: local, integration, prod (case-sensitive)
# MUSI mieć prefiks PUBLIC_ dla dostępu w przeglądarce
```

### Problem: Feature flag się nie aktualizuje

**Rozwiązanie**: Zrestartuj dev server. Flagi są ładowane przy starcie (statyczne).

### Problem: Niewłaściwe zachowanie środowiska

**Rozwiązanie**: Sprawdź zmienną środowiskową `PUBLIC_ENV_NAME`. Upewnij się, że jest to dokładnie `local`, `integration` lub `prod` (wielkość liter ma znaczenie).
```bash
echo $PUBLIC_ENV_NAME  # Powinno być: local, integration, lub prod
```

### Problem: Błędy TypeScript przy nazwach funkcji

**Rozwiązanie**: Dodaj nową funkcję do typu `FeatureName` w `src/features/types.ts`.

### Problem: Build pada z błędami importów

**Rozwiązanie**: Upewnij się, że wszystkie importy używają aliasu `@/features`, nie ścieżek względnych.

### Problem: Strona feature-disabled pokazuje złe info

**Rozwiązanie**: Sprawdź czy parametry URL `?feature=` i `?from=` są poprawnie przekazywane.

## Metryki Sukcesu

- **Pewność deploymentu**: Możliwość wdrożenia bez natychmiastowego release'u
- **Szybkość rollback**: < 5 minut do wyłączenia funkcji przez config
- **Pokrycie testami**: Wszystkie krytyczne ścieżki mają testy E2E z feature flags
- **Sprzątanie kodu**: Stare flagi usunięte w ciągu 4 tygodni od pełnego rollout
- **Dokumentacja**: Wszystkie aktywne flagi udokumentowane z celem i właścicielem

## Referencje

- [Feature Flags README](../src/features/README.md) - Pełna dokumentacja techniczna (EN)
- [Feature Flags Examples](../src/features/EXAMPLES.md) - Przykłady kodu (PL)
- [Mobile Navigation Spec](.ai/mobile-navigation.md) - Powiązana funkcja mobilnego UI
- [Supabase Auth Rule](.cursor/rules/supabase-auth.mdc) - Integracja autoryzacji

## Status Implementacji

**Implementacja**: ✅ Zakończona
- Moduł core zaimplementowany w `src/features/`
- Dokumentacja utworzona
- Build zweryfikowany
- Konfiguracja środowiska ustawiona

**Integracja**: 🔄 W Trakcie
- [ ] Faza 1: Główne Strony Autoryzacji
- [ ] Faza 2: Endpointy API
- [ ] Faza 3: Komponenty Nawigacji
- [ ] Faza 4: Główne Widoki Aplikacji
- [ ] Faza 5: Integracja z Mobilną Nawigacją
- [ ] Faza 6: Testowanie i Dokumentacja

**Następne Kroki**:
1. Zintegrować feature flags ze stronami autoryzacji (login, register, reset-password)
2. Dodać sprawdzanie flag do endpointów API
3. Zaktualizować komponenty nawigacji aby respektowały feature flags
4. Przetestować we wszystkich trzech środowiskach
5. Udokumentować procedury rollout dla zespołu
