/**
 * Feature Flags System
 *
 * Universal TypeScript module for managing feature flags across environments.
 * Works on both frontend and backend (Astro pages, API routes, React components).
 *
 * @module features
 *
 * @example
 * ```ts
 * // In Astro page
 * import { checkFeatureOrRedirect } from "@/features";
 * const redirect = checkFeatureOrRedirect(Astro, "auth");
 * if (redirect) return redirect;
 *
 * // In API route
 * import { requireFeature } from "@/features";
 * const check = requireFeature("flashcards");
 * if (check) return check;
 *
 * // In React component
 * import { useFeature } from "@/features";
 * const isEnabled = useFeature("generations");
 * ```
 */

// Export types
export type { Environment, FeatureName, FeatureConfig, FeatureFlagsConfig, FeatureCheckResult } from "./types";

// Export configuration
export { FEATURE_FLAGS, getCurrentEnvironment } from "./config";

// Export core functions
export { isFeatureEnabled, getFeatureStatus, areAllFeaturesEnabled, isAnyFeatureEnabled } from "./core";

// Export Astro helpers
export { checkFeatureOrRedirect, isFeatureAvailable, checkFeaturesOrRedirect } from "./astro";

// Export API guards
export { requireFeature, requireFeatures, createFeatureGuard } from "./api";

// Export React hooks and components
export { useFeature, useFeatureStatus, FeatureGate, MultiFeatureGate, withFeature } from "./react";
