/**
 * Feature Flags Core Module
 *
 * Core functions for checking feature flag status.
 * Can be used in both frontend and backend code.
 */

import type { FeatureName, FeatureCheckResult } from "./types";
import { FEATURE_FLAGS, getCurrentEnvironment } from "./config";

/**
 * Check if a feature is enabled in the current environment
 *
 * @param feature - The feature name to check
 * @returns true if the feature is enabled, false otherwise
 *
 * If environment is null (invalid/unconfigured), returns false for all features (fail-safe).
 *
 * @example
 * ```ts
 * if (isFeatureEnabled('auth')) {
 *   // Auth feature is enabled
 * }
 * ```
 */
export function isFeatureEnabled(feature: FeatureName): boolean {
  const environment = getCurrentEnvironment();

  // Fail-safe: if environment is null (invalid/unconfigured), disable all features
  if (environment === null) {
    return false;
  }

  return FEATURE_FLAGS[environment][feature];
}

/**
 * Get detailed information about a feature flag
 *
 * @param feature - The feature name to check
 * @returns Feature check result with enabled status, feature name, and environment
 *
 * If environment is null (invalid/unconfigured), returns disabled status (fail-safe).
 *
 * @example
 * ```ts
 * const result = getFeatureStatus('flashcards');
 * console.log(`Feature ${result.feature} is ${result.enabled ? 'enabled' : 'disabled'} in ${result.environment}`);
 * ```
 */
export function getFeatureStatus(feature: FeatureName): FeatureCheckResult {
  const environment = getCurrentEnvironment();

  // Fail-safe: if environment is null (invalid/unconfigured), disable all features
  if (environment === null) {
    return {
      enabled: false,
      feature,
      environment: null,
    };
  }

  return {
    enabled: FEATURE_FLAGS[environment][feature],
    feature,
    environment,
  };
}

/**
 * Check if all specified features are enabled
 *
 * @param features - Array of feature names to check
 * @returns true if all features are enabled, false otherwise
 *
 * @example
 * ```ts
 * if (areAllFeaturesEnabled(['auth', 'flashcards'])) {
 *   // Both auth and flashcards are enabled
 * }
 * ```
 */
export function areAllFeaturesEnabled(features: FeatureName[]): boolean {
  return features.every((feature) => isFeatureEnabled(feature));
}

/**
 * Check if any of the specified features is enabled
 *
 * @param features - Array of feature names to check
 * @returns true if at least one feature is enabled, false otherwise
 *
 * @example
 * ```ts
 * if (isAnyFeatureEnabled(['flashcards', 'generations'])) {
 *   // At least one of the features is enabled
 * }
 * ```
 */
export function isAnyFeatureEnabled(features: FeatureName[]): boolean {
  return features.some((feature) => isFeatureEnabled(feature));
}
