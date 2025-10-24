/**
 * Feature Flags System - Type Definitions
 *
 * Type-safe feature flag system for controlling feature availability
 * across different environments (local, integration, production).
 */

/**
 * Supported environment names
 * null = unconfigured/invalid environment (all features disabled for safety)
 */
export type Environment = "local" | "integration" | "prod" | null;

/**
 * Available feature flags in the application
 */
export type FeatureName = "auth" | "flashcards" | "generations";

/**
 * Feature flag configuration for a single environment
 */
export type FeatureConfig = Record<FeatureName, boolean>;

/**
 * Complete feature flags configuration across all environments
 */
export type FeatureFlagsConfig = Record<Environment, FeatureConfig>;

/**
 * Feature flag check result
 */
export interface FeatureCheckResult {
  enabled: boolean;
  feature: FeatureName;
  environment: Environment;
}
