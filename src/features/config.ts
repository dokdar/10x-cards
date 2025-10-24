/**
 * Feature Flags Configuration
 *
 * Defines which features are enabled in each environment.
 * This configuration is loaded at application startup (static).
 */

import type { FeatureFlagsConfig } from "./types";

/**
 * Feature flags configuration for all environments
 *
 * - local: Development environment - all features enabled for testing
 * - integration: Staging/testing environment - controlled rollout
 * - prod: Production environment - stable features only
 */
export const FEATURE_FLAGS: FeatureFlagsConfig = {
  local: {
    auth: true,
    flashcards: true,
    generations: true,
  },
  integration: {
    auth: true,
    flashcards: true,
    generations: true,
  },
  prod: {
    auth: true,
    flashcards: true,
    generations: true,
  },
};

/**
 * Get the current environment from PUBLIC_ENV_NAME environment variable
 * Returns null if not set or invalid (all features disabled for safety)
 *
 * This fail-safe approach ensures that misconfigured environments
 * default to having all features disabled, preventing unintended
 * feature exposure in production.
 *
 * NOTE: Uses PUBLIC_ENV_NAME (not ENV_NAME) to ensure availability
 * in both server-side and client-side code (Astro/Vite requirement).
 */
export function getCurrentEnvironment(): "local" | "integration" | "prod" | null {
  const envName = import.meta.env.PUBLIC_ENV_NAME?.trim();

  if (envName === "local" || envName === "integration" || envName === "prod") {
    return envName;
  }

  // Invalid or missing PUBLIC_ENV_NAME - return null for safety
  // This ensures all features are disabled by default
  return null;
}
