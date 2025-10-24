# Feature Flags - Przykłady użycia

## 1. Ochrona strony logowania (Astro Page)

```astro
---
// src/pages/login.astro
import { checkFeatureOrRedirect } from "@/features";
import AuthLayout from "@/layouts/AuthLayout.astro";
import LoginForm from "@/components/auth/LoginForm";

export const prerender = false;

// Sprawdź czy funkcja auth jest włączona
const redirect = checkFeatureOrRedirect(Astro, "auth", "Autoryzacja");
if (redirect) return redirect;

// Redirect authenticated users to home page
const { user } = Astro.locals;
if (user) {
  return Astro.redirect("/");
}
---

<AuthLayout title="Zaloguj się - 10x Cards">
  <main class="flex-1 flex items-center justify-center">
    <LoginForm client:load />
  </main>
</AuthLayout>
```

## 2. Ochrona endpointu API

```typescript
// src/pages/api/flashcards/create.ts
import type { APIContext } from "astro";
import { requireFeature } from "@/features";

export async function POST(context: APIContext) {
  // Sprawdź czy flashcards są włączone
  const featureCheck = requireFeature("flashcards", "Fiszki");
  if (featureCheck) return featureCheck;

  // Funkcja włączona - kontynuuj logikę
  try {
    const data = await context.request.json();
    // ... tworzenie fiszek

    return new Response(
      JSON.stringify({ success: true, id: "123" }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to create flashcard" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

## 3. Warunkowe renderowanie w React (Hook)

```tsx
// src/components/Navigation.tsx
import { useFeature } from "@/features";
import { Home, BookOpen, Zap, User } from "lucide-react";

export function Navigation() {
  const isFlashcardsEnabled = useFeature("flashcards");
  const isGenerationsEnabled = useFeature("generations");
  const isAuthEnabled = useFeature("auth");

  return (
    <nav className="flex gap-4">
      <a href="/" className="nav-item">
        <Home size={20} />
        <span>Home</span>
      </a>

      {isFlashcardsEnabled && (
        <a href="/flashcards" className="nav-item">
          <BookOpen size={20} />
          <span>Fiszki</span>
        </a>
      )}

      {isGenerationsEnabled && (
        <a href="/generate" className="nav-item">
          <Zap size={20} />
          <span>Generator</span>
        </a>
      )}

      {isAuthEnabled && (
        <a href="/profile" className="nav-item">
          <User size={20} />
          <span>Profil</span>
        </a>
      )}
    </nav>
  );
}
```

## 4. Warunkowe renderowanie w React (Component)

```tsx
// src/components/Dashboard.tsx
import { FeatureGate } from "@/features";
import { FlashcardsList } from "./FlashcardsList";
import { GenerationHistory } from "./GenerationHistory";

export function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>

      {/* Pokaż listę fiszek tylko jeśli funkcja włączona */}
      <FeatureGate
        feature="flashcards"
        fallback={
          <div className="alert alert-warning">
            Fiszki są obecnie niedostępne
          </div>
        }
      >
        <FlashcardsList />
      </FeatureGate>

      {/* Pokaż historię generacji tylko jeśli funkcja włączona */}
      <FeatureGate
        feature="generations"
        fallback={
          <div className="alert alert-info">
            Generator fiszek jest tymczasowo wyłączony
          </div>
        }
      >
        <GenerationHistory />
      </FeatureGate>
    </div>
  );
}
```

## 5. Multiple Features Check (React)

```tsx
// src/components/AIFlashcardsGenerator.tsx
import { MultiFeatureGate } from "@/features";
import { GeneratorForm } from "./GeneratorForm";

export function AIFlashcardsGenerator() {
  return (
    <MultiFeatureGate
      features={["flashcards", "generations"]}
      mode="all"
      fallback={
        <div className="alert alert-error">
          <h3>Funkcja niedostępna</h3>
          <p>
            Generator AI fiszek wymaga włączonych funkcji:
            fiszek i generacji AI.
          </p>
        </div>
      }
    >
      <div className="generator-container">
        <h1>Generator AI Fiszek</h1>
        <GeneratorForm />
      </div>
    </MultiFeatureGate>
  );
}
```

## 6. Higher-Order Component (HOC)

```tsx
// src/components/ProtectedComponent.tsx
import { withFeature } from "@/features";

// Komponent wymaga włączonej funkcji auth
const ProtectedDashboard = withFeature(
  "auth",
  <div>Musisz się zalogować, aby zobaczyć tę zawartość</div>
)(function Dashboard() {
  return (
    <div>
      <h1>Chroniona zawartość</h1>
      <p>To jest widoczne tylko gdy auth jest włączony</p>
    </div>
  );
});

export default ProtectedDashboard;
```

## 7. API Guard Middleware

```typescript
// src/pages/api/auth/login.ts
import { createFeatureGuard } from "@/features";
import type { APIContext } from "astro";

// Stwórz guard dla auth feature
const authGuard = createFeatureGuard("auth", "Autoryzacja");

// Użyj guard'a do ochrony endpointu
export const POST = authGuard(async (context: APIContext) => {
  const { email, password } = await context.request.json();

  // Logika logowania
  // ...

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});
```

## 8. Conditional Visibility in Astro Template

```astro
---
// src/pages/index.astro
import { isFeatureAvailable } from "@/features";
import Layout from "@/layouts/Layout.astro";

const canShowFlashcards = isFeatureAvailable("flashcards");
const canShowGenerations = isFeatureAvailable("generations");
const canShowAuth = isFeatureAvailable("auth");
---

<Layout>
  <main>
    <h1>Witaj w 10x Cards</h1>

    <div class="features-grid">
      {canShowFlashcards && (
        <div class="feature-card">
          <h2>Fiszki</h2>
          <p>Ucz się efektywnie z fiszkami</p>
          <a href="/flashcards">Zobacz fiszki</a>
        </div>
      )}

      {canShowGenerations && (
        <div class="feature-card">
          <h2>Generator AI</h2>
          <p>Generuj fiszki automatycznie</p>
          <a href="/generate">Generuj</a>
        </div>
      )}

      {canShowAuth && (
        <div class="feature-card">
          <h2>Konto</h2>
          <p>Zarządzaj swoim kontem</p>
          <a href="/login">Zaloguj się</a>
        </div>
      )}
    </div>
  </main>
</Layout>
```

## 9. Multiple Features Check (Astro)

```astro
---
// src/pages/advanced-feature.astro
import { checkFeaturesOrRedirect } from "@/features";
import Layout from "@/layouts/Layout.astro";

export const prerender = false;

// Wymaga zarówno flashcards jak i generations
const redirect = checkFeaturesOrRedirect(
  Astro,
  ["flashcards", "generations"],
  "Zaawansowane funkcje fiszek"
);
if (redirect) return redirect;
---

<Layout>
  <main>
    <h1>Zaawansowane funkcje</h1>
    <p>Ta strona wymaga włączonych funkcji: fiszek i generacji</p>
  </main>
</Layout>
```

## 10. Core Functions (Universal)

```typescript
// Można używać w dowolnym pliku TypeScript
import {
  isFeatureEnabled,
  getFeatureStatus,
  areAllFeaturesEnabled,
  isAnyFeatureEnabled
} from "@/features";

// Sprawdź pojedynczą funkcję
if (isFeatureEnabled("auth")) {
  console.log("Auth is enabled");
}

// Pobierz szczegółowe info
const status = getFeatureStatus("flashcards");
console.log(`Flashcards: ${status.enabled} in ${status.environment}`);

// Sprawdź czy wszystkie włączone
if (areAllFeaturesEnabled(["auth", "flashcards", "generations"])) {
  console.log("All features are enabled");
}

// Sprawdź czy jakakolwiek włączona
if (isAnyFeatureEnabled(["flashcards", "generations"])) {
  console.log("At least one feature is enabled");
}
```

## Konfiguracja środowisk

### Przykład 1: Wyłącz generations w integration

```typescript
// src/features/config.ts
export const FEATURE_FLAGS: FeatureFlagsConfig = {
  local: {
    auth: true,
    flashcards: true,
    generations: true, // Włączone lokalnie
  },
  integration: {
    auth: true,
    flashcards: true,
    generations: false, // Wyłączone w integration
  },
  prod: {
    auth: true,
    flashcards: true,
    generations: true,
  },
};
```

### Przykład 2: Testowanie nowej funkcji

```typescript
// Dodaj nowy typ
export type FeatureName = "auth" | "flashcards" | "generations" | "premium";

// Skonfiguruj tylko dla local
export const FEATURE_FLAGS: FeatureFlagsConfig = {
  local: {
    auth: true,
    flashcards: true,
    generations: true,
    premium: true, // Testuj lokalnie
  },
  integration: {
    auth: true,
    flashcards: true,
    generations: true,
    premium: false, // Wyłącz w integration
  },
  prod: {
    auth: true,
    flashcards: true,
    generations: true,
    premium: false, // Wyłącz w produkcji
  },
};
```

## Testowanie

### Zmiana środowiska

```bash
# Local (development)
ENV_NAME=local npm run dev

# Integration (staging)
ENV_NAME=integration npm run dev

# Production
ENV_NAME=prod npm run build
```

### Sprawdzenie stanu flagi

```typescript
import { getFeatureStatus } from "@/features";

const status = getFeatureStatus("flashcards");
console.log(`Feature: ${status.feature}`);
console.log(`Enabled: ${status.enabled}`);
console.log(`Environment: ${status.environment}`);
```
