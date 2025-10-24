# Feature Flags System

Universal TypeScript module for managing feature flags across different environments (local, integration, production).

## Overview

This system allows you to:
- **Separate deployments from releases** - deploy code with features disabled
- **Control feature availability** per environment (local, integration, prod)
- **Type-safe configuration** with full TypeScript support
- **Universal usage** - works in Astro pages, API routes, and React components

## Environment Configuration

The system uses the `PUBLIC_ENV_NAME` environment variable to determine the current environment:
- `local` - Development environment
- `integration` - Staging/testing environment
- `prod` - Production environment

**IMPORTANT - Fail-Safe Behavior:**
- If `PUBLIC_ENV_NAME` is **not set** or has an **invalid value**, the system returns `null` environment
- When environment is `null`, **ALL features are disabled** by default (fail-safe)
- This prevents accidentally enabling features in misconfigured production environments

**IMPORTANT - PUBLIC_ Prefix:**
- The `PUBLIC_` prefix is **required** for Astro/Vite to expose the variable to client-side code
- Without this prefix, React components cannot access the environment variable
- This ensures feature flags work in both server-side and client-side contexts

Set the environment variable in your `.env` file:
```env
# REQUIRED: Must be one of: local, integration, prod
# PUBLIC_ prefix makes it available in both server and client code
PUBLIC_ENV_NAME=local
```

## Available Features

Current feature flags:
- `auth` - Authentication functionality
- `flashcards` - Flashcards management
- `generations` - AI generation features

## Configuration

Edit feature availability in `src/features/config.ts`:

```typescript
export const FEATURE_FLAGS: FeatureFlagsConfig = {
  local: {
    auth: true,
    flashcards: true,
    generations: true,
  },
  integration: {
    auth: true,
    flashcards: true,
    generations: false, // Disabled in integration
  },
  prod: {
    auth: true,
    flashcards: true,
    generations: true,
  },
};
```

## Usage Examples

### 1. Astro Pages

Protect entire pages from access when feature is disabled:

```astro
---
// src/pages/login.astro
import { checkFeatureOrRedirect } from "@/features";

export const prerender = false;

// Check if auth feature is enabled, redirect if not
const redirect = checkFeatureOrRedirect(Astro, "auth", "Authentication");
if (redirect) return redirect;
---

<h1>Login Page</h1>
```

### 2. API Endpoints

Protect API routes with feature flags:

```typescript
// src/pages/api/flashcards/create.ts
import type { APIContext } from "astro";
import { requireFeature } from "@/features";

export async function POST(context: APIContext) {
  // Check if flashcards feature is enabled
  const featureCheck = requireFeature("flashcards", "Flashcards");
  if (featureCheck) return featureCheck;

  // Feature is enabled, continue with logic
  // ...
  return new Response(JSON.stringify({ success: true }));
}
```

### 3. React Components

Conditionally render UI based on feature flags:

```tsx
import { useFeature, FeatureGate } from "@/features";

function MyComponent() {
  // Option 1: Using hook
  const isGenerationsEnabled = useFeature("generations");

  return (
    <div>
      {isGenerationsEnabled && (
        <button>Generate Flashcards</button>
      )}

      {/* Option 2: Using component */}
      <FeatureGate
        feature="flashcards"
        fallback={<p>Flashcards are currently unavailable</p>}
      >
        <FlashcardsList />
      </FeatureGate>
    </div>
  );
}
```

### 4. Conditional Navigation

Hide navigation items when features are disabled:

```tsx
import { useFeature } from "@/features";

function Navigation() {
  const isFlashcardsEnabled = useFeature("flashcards");
  const isGenerationsEnabled = useFeature("generations");

  return (
    <nav>
      <a href="/">Home</a>
      {isFlashcardsEnabled && <a href="/flashcards">Flashcards</a>}
      {isGenerationsEnabled && <a href="/generate">Generate</a>}
    </nav>
  );
}
```

## API Reference

### Core Functions

#### `isFeatureEnabled(feature: FeatureName): boolean`
Check if a feature is enabled in the current environment.

```typescript
import { isFeatureEnabled } from "@/features";

if (isFeatureEnabled("auth")) {
  // Auth is enabled
}
```

#### `getFeatureStatus(feature: FeatureName): FeatureCheckResult`
Get detailed information about a feature flag.

```typescript
import { getFeatureStatus } from "@/features";

const status = getFeatureStatus("flashcards");
console.log(status.enabled); // true/false
console.log(status.environment); // "local" | "integration" | "prod"
```

### Astro Helpers

#### `checkFeatureOrRedirect(Astro, feature, featureName?)`
Redirect to `/feature-disabled` page if feature is not enabled.

```astro
---
import { checkFeatureOrRedirect } from "@/features";

const redirect = checkFeatureOrRedirect(Astro, "auth", "Authentication");
if (redirect) return redirect;
---
```

#### `isFeatureAvailable(feature: FeatureName): boolean`
Check feature status in Astro templates.

```astro
---
import { isFeatureAvailable } from "@/features";
const canUseFlashcards = isFeatureAvailable("flashcards");
---

{canUseFlashcards && <a href="/flashcards">Flashcards</a>}
```

### API Guards

#### `requireFeature(feature, featureName?): Response | undefined`
Return 503 response if feature is disabled, undefined otherwise.

```typescript
import { requireFeature } from "@/features";

export async function POST() {
  const check = requireFeature("generations", "AI Generation");
  if (check) return check; // Returns 503 if disabled

  // Continue with endpoint logic
}
```

#### `createFeatureGuard(feature, featureName?)`
Create a middleware function that guards an endpoint.

```typescript
import { createFeatureGuard } from "@/features";

const authGuard = createFeatureGuard("auth", "Authentication");

export const POST = authGuard(async (context) => {
  // Your endpoint logic here
  return new Response(JSON.stringify({ success: true }));
});
```

### React Hooks & Components

#### `useFeature(feature: FeatureName): boolean`
Hook to check if a feature is enabled.

```tsx
import { useFeature } from "@/features";

function MyComponent() {
  const isEnabled = useFeature("flashcards");
  return isEnabled ? <Content /> : <Disabled />;
}
```

#### `<FeatureGate>`
Component to conditionally render content.

```tsx
import { FeatureGate } from "@/features";

<FeatureGate
  feature="generations"
  fallback={<p>Feature unavailable</p>}
>
  <GenerationForm />
</FeatureGate>
```

#### `withFeature(feature, fallback?)`
Higher-order component for feature gating.

```tsx
import { withFeature } from "@/features";

const ProtectedComponent = withFeature("auth")(
  function AuthComponent() {
    return <div>Protected content</div>;
  }
);
```

## Behavior When Feature is Disabled

- **Astro Pages**: Redirect to `/feature-disabled` with feature name and origin path
- **API Endpoints**: Return 503 Service Unavailable with JSON error response
- **React Components**: Render fallback content or hide component

## Feature Disabled Page

When a user accesses a disabled feature, they are redirected to `/feature-disabled` with:
- Feature name (from URL param `?feature=`)
- Origin path (from URL param `?from=`)
- User-friendly message explaining the situation
- Options to return or go to home page

## Adding New Features

1. Add new feature name to `FeatureName` type in `types.ts`:
```typescript
export type FeatureName = "auth" | "flashcards" | "generations" | "new-feature";
```

2. Add configuration for all environments in `config.ts`:
```typescript
export const FEATURE_FLAGS: FeatureFlagsConfig = {
  local: {
    auth: true,
    flashcards: true,
    generations: true,
    "new-feature": true, // Enable in local
  },
  integration: {
    auth: true,
    flashcards: true,
    generations: true,
    "new-feature": false, // Disabled in integration
  },
  prod: {
    auth: true,
    flashcards: true,
    generations: true,
    "new-feature": false, // Disabled in prod
  },
};
```

3. Use the new feature flag in your code:
```typescript
import { isFeatureEnabled } from "@/features";

if (isFeatureEnabled("new-feature")) {
  // Feature logic
}
```

## Best Practices

1. **Always use type-safe feature names** - TypeScript will catch typos
2. **Provide human-readable names** when redirecting or returning errors
3. **Default to disabled in production** for new features
4. **Test all environments** before releasing
5. **Document feature purpose** in comments when adding new flags
6. **Clean up old flags** after full rollout

## Architecture

```
src/features/
├── index.ts       # Main exports
├── types.ts       # TypeScript type definitions
├── config.ts      # Environment configurations
├── core.ts        # Core feature checking logic
├── astro.ts       # Astro-specific helpers
├── api.ts         # API middleware/guards
├── react.tsx      # React hooks & components
└── README.md      # This documentation
```

## Migration Guide

When integrating with existing code:

1. Import the appropriate helper for your use case
2. Add feature check at the entry point (page/route/component)
3. Handle the disabled state (redirect/error/fallback)
4. Test with different `ENV_NAME` values

## Troubleshooting

**Q: All features are disabled, even though they should be enabled?**
A: Check your `PUBLIC_ENV_NAME` environment variable. If it's not set or has an invalid value (not `local`, `integration`, or `prod`), the system defaults to disabling all features as a fail-safe mechanism. Set `PUBLIC_ENV_NAME=local` in your `.env` file. Remember: the `PUBLIC_` prefix is **required** for client-side access.

**Q: Feature flags don't work in React components?**
A: Ensure you're using `PUBLIC_ENV_NAME` (not `ENV_NAME`). Variables without the `PUBLIC_` prefix are not available in client-side code in Astro/Vite projects.

**Q: Feature flag is not updating?**
A: Restart your dev server. Flags are loaded at startup (static configuration).

**Q: Getting redirected to feature-disabled but flag is enabled?**
A: Check your `PUBLIC_ENV_NAME` environment variable value. Ensure it's exactly `local`, `integration`, or `prod` (case-sensitive).

**Q: TypeScript errors on feature names?**
A: Ensure you've added the new feature to `FeatureName` type in `types.ts`.

**Q: How to override flags for testing?**
A: Change `PUBLIC_ENV_NAME` to `local` or modify the configuration in `config.ts`.
