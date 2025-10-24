/**
 * Feature Flags - Astro Integration
 *
 * Helpers for using feature flags in Astro pages and components.
 */

import type { AstroGlobal } from "astro";
import type { FeatureName } from "./types";
import { isFeatureEnabled } from "./core";

/**
 * Check if a feature is enabled, redirect to feature-disabled page if not
 *
 * Use this in Astro page frontmatter to protect entire pages.
 *
 * @param Astro - Astro global object
 * @param feature - The feature name to check
 * @param featureName - Human-readable feature name for the disabled page (optional)
 * @returns Redirect response if feature is disabled, undefined otherwise
 *
 * @example
 * ```astro
 * ---
 * import { checkFeatureOrRedirect } from "@/features/astro";
 *
 * const redirect = checkFeatureOrRedirect(Astro, "auth", "Authentication");
 * if (redirect) return redirect;
 * ---
 * ```
 */
export function checkFeatureOrRedirect(Astro: AstroGlobal, feature: FeatureName, featureName?: string) {
  if (!isFeatureEnabled(feature)) {
    const params = new URLSearchParams({
      feature: featureName || feature,
      from: Astro.url.pathname,
    });
    return Astro.redirect(`/feature-disabled?${params.toString()}`);
  }
  return undefined;
}

/**
 * Get feature flag status for use in Astro templates
 *
 * @param feature - The feature name to check
 * @returns true if feature is enabled, false otherwise
 *
 * @example
 * ```astro
 * ---
 * import { isFeatureAvailable } from "@/features/astro";
 * const canUseFlashcards = isFeatureAvailable("flashcards");
 * ---
 *
 * {canUseFlashcards && (
 *   <a href="/flashcards">View Flashcards</a>
 * )}
 * ```
 */
export function isFeatureAvailable(feature: FeatureName): boolean {
  return isFeatureEnabled(feature);
}

/**
 * Check multiple features at once for Astro pages
 *
 * @param Astro - Astro global object
 * @param features - Array of features that must be enabled
 * @param featureName - Human-readable feature name for the disabled page (optional)
 * @returns Redirect response if any feature is disabled, undefined otherwise
 *
 * @example
 * ```astro
 * ---
 * import { checkFeaturesOrRedirect } from "@/features/astro";
 *
 * const redirect = checkFeaturesOrRedirect(
 *   Astro,
 *   ["auth", "flashcards"],
 *   "Flashcards with Authentication"
 * );
 * if (redirect) return redirect;
 * ---
 * ```
 */
export function checkFeaturesOrRedirect(Astro: AstroGlobal, features: FeatureName[], featureName?: string) {
  const disabledFeature = features.find((feature) => !isFeatureEnabled(feature));

  if (disabledFeature) {
    const params = new URLSearchParams({
      feature: featureName || disabledFeature,
      from: Astro.url.pathname,
    });
    return Astro.redirect(`/feature-disabled?${params.toString()}`);
  }

  return undefined;
}
