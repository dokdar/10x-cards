/**
 * Feature Flags - API Integration
 *
 * Middleware and guards for protecting API endpoints with feature flags.
 */

import type { APIContext } from "astro";
import type { FeatureName } from "./types";
import { isFeatureEnabled } from "./core";

/**
 * API Response for disabled features
 */
interface FeatureDisabledResponse {
  error: string;
  code: "FEATURE_DISABLED";
  feature: string;
  message: string;
}

/**
 * Check if a feature is enabled for an API endpoint
 * Returns 503 Service Unavailable if feature is disabled
 *
 * @param feature - The feature name to check
 * @param featureName - Human-readable feature name for error message (optional)
 * @returns Response with 503 status if feature is disabled, undefined otherwise
 *
 * @example
 * ```ts
 * // In API route: src/pages/api/auth/login.ts
 * import { requireFeature } from "@/features/api";
 *
 * export async function POST(context: APIContext) {
 *   const featureCheck = requireFeature("auth", "Authentication");
 *   if (featureCheck) return featureCheck;
 *
 *   // Feature is enabled, continue with endpoint logic
 *   // ...
 * }
 * ```
 */
export function requireFeature(feature: FeatureName, featureName?: string): Response | undefined {
  if (!isFeatureEnabled(feature)) {
    const response: FeatureDisabledResponse = {
      error: "Feature is currently disabled",
      code: "FEATURE_DISABLED",
      feature: featureName || feature,
      message: `The ${featureName || feature} feature is currently unavailable. Please try again later.`,
    };

    return new Response(JSON.stringify(response), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "3600", // Suggest retry after 1 hour
      },
    });
  }

  return undefined;
}

/**
 * Check if multiple features are enabled for an API endpoint
 * Returns 503 Service Unavailable if any feature is disabled
 *
 * @param features - Array of feature names that must be enabled
 * @param featureName - Human-readable feature name for error message (optional)
 * @returns Response with 503 status if any feature is disabled, undefined otherwise
 *
 * @example
 * ```ts
 * // In API route: src/pages/api/flashcards/generate.ts
 * import { requireFeatures } from "@/features/api";
 *
 * export async function POST(context: APIContext) {
 *   const featureCheck = requireFeatures(
 *     ["flashcards", "generations"],
 *     "AI Flashcard Generation"
 *   );
 *   if (featureCheck) return featureCheck;
 *
 *   // All features are enabled, continue with endpoint logic
 *   // ...
 * }
 * ```
 */
export function requireFeatures(features: FeatureName[], featureName?: string): Response | undefined {
  const disabledFeature = features.find((feature) => !isFeatureEnabled(feature));

  if (disabledFeature) {
    const response: FeatureDisabledResponse = {
      error: "Required feature is currently disabled",
      code: "FEATURE_DISABLED",
      feature: featureName || disabledFeature,
      message: `The ${featureName || disabledFeature} feature is currently unavailable. Please try again later.`,
    };

    return new Response(JSON.stringify(response), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "3600", // Suggest retry after 1 hour
      },
    });
  }

  return undefined;
}

/**
 * Create a feature guard middleware for Astro API routes
 *
 * @param feature - The feature name to check
 * @param featureName - Human-readable feature name (optional)
 * @returns Middleware function for Astro
 *
 * @example
 * ```ts
 * // In src/middleware.ts or API route
 * import { createFeatureGuard } from "@/features/api";
 *
 * export const authGuard = createFeatureGuard("auth", "Authentication");
 *
 * // In API route
 * export const POST = authGuard((context) => {
 *   // Your endpoint logic here
 * });
 * ```
 */
export function createFeatureGuard(feature: FeatureName, featureName?: string) {
  return function guard(handler: (context: APIContext) => Response | Promise<Response>) {
    return async (context: APIContext): Promise<Response> => {
      const featureCheck = requireFeature(feature, featureName);
      if (featureCheck) return featureCheck;

      return handler(context);
    };
  };
}
