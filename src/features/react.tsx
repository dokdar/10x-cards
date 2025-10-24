/**
 * Feature Flags - React Integration
 *
 * React hooks and components for using feature flags in React components.
 */

import { useMemo } from "react";
import type { ReactNode } from "react";
import type { FeatureName } from "./types";
import { isFeatureEnabled, getFeatureStatus } from "./core";

/**
 * React hook to check if a feature is enabled
 *
 * @param feature - The feature name to check
 * @returns true if feature is enabled, false otherwise
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isAuthEnabled = useFeature("auth");
 *
 *   return (
 *     <div>
 *       {isAuthEnabled ? (
 *         <LoginButton />
 *       ) : (
 *         <p>Authentication is currently disabled</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeature(feature: FeatureName): boolean {
  return useMemo(() => isFeatureEnabled(feature), [feature]);
}

/**
 * React hook to get detailed feature status
 *
 * @param feature - The feature name to check
 * @returns Feature check result with enabled status, feature name, and environment
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const status = useFeatureStatus("flashcards");
 *
 *   return (
 *     <div>
 *       <p>Flashcards feature is {status.enabled ? 'enabled' : 'disabled'}</p>
 *       <p>Environment: {status.environment}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFeatureStatus(feature: FeatureName) {
  return useMemo(() => getFeatureStatus(feature), [feature]);
}

/**
 * Props for FeatureGate component
 */
interface FeatureGateProps {
  feature: FeatureName;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component to conditionally render content based on feature flag
 *
 * @param feature - The feature name to check
 * @param children - Content to render if feature is enabled
 * @param fallback - Optional content to render if feature is disabled
 *
 * @example
 * ```tsx
 * <FeatureGate
 *   feature="flashcards"
 *   fallback={<p>Flashcards are currently unavailable</p>}
 * >
 *   <FlashcardsList />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const isEnabled = useFeature(feature);
  return <>{isEnabled ? children : fallback}</>;
}

/**
 * Props for MultiFeatureGate component
 */
interface MultiFeatureGateProps {
  features: FeatureName[];
  mode?: "all" | "any";
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component to conditionally render content based on multiple feature flags
 *
 * @param features - Array of feature names to check
 * @param mode - Check mode: "all" (all features must be enabled) or "any" (at least one enabled)
 * @param children - Content to render if condition is met
 * @param fallback - Optional content to render if condition is not met
 *
 * @example
 * ```tsx
 * <MultiFeatureGate
 *   features={["auth", "flashcards"]}
 *   mode="all"
 *   fallback={<p>Required features are unavailable</p>}
 * >
 *   <AuthenticatedFlashcards />
 * </MultiFeatureGate>
 * ```
 */
export function MultiFeatureGate({ features, mode = "all", children, fallback = null }: MultiFeatureGateProps) {
  const isEnabled = useMemo(() => {
    if (mode === "all") {
      return features.every((feature) => isFeatureEnabled(feature));
    }
    return features.some((feature) => isFeatureEnabled(feature));
  }, [features, mode]);

  return <>{isEnabled ? children : fallback}</>;
}

/**
 * Higher-order component to wrap a component with feature flag check
 *
 * @param feature - The feature name to check
 * @param fallback - Optional fallback component
 * @returns HOC that wraps the component
 *
 * @example
 * ```tsx
 * const FlashcardsList = withFeature("flashcards")(
 *   function FlashcardsList() {
 *     return <div>Flashcards content</div>;
 *   }
 * );
 * ```
 */
export function withFeature<P extends object>(feature: FeatureName, fallback?: ReactNode) {
  return function (Component: React.ComponentType<P>) {
    return function FeatureWrappedComponent(props: P) {
      return (
        <FeatureGate feature={feature} fallback={fallback}>
          <Component {...props} />
        </FeatureGate>
      );
    };
  };
}
