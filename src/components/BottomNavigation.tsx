import { Home, Zap, BookOpen, User, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { useFeature, type FeatureName } from "@/features";

interface BottomNavigationProps {
  currentPath: string;
  user?: { id: string; email: string; aud: string };
}

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
  requiresAuth?: boolean;
  feature?: FeatureName;
}

// Navigation items - defined outside component since they're constant
const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: Home, path: "/" },
  { id: "generator", label: "Generator", icon: Zap, path: "/generate", requiresAuth: true, feature: "generations" },
  { id: "review", label: "Review", icon: BookOpen, path: "/review", requiresAuth: true, feature: "flashcards" },
  { id: "profile", label: "Profil", icon: User, path: "/profile", requiresAuth: true, feature: "auth" },
  { id: "login", label: "Zaloguj", icon: LogIn, path: "/login", feature: "auth" },
];

export function BottomNavigation({ currentPath, user }: BottomNavigationProps) {
  const [activeView, setActiveView] = useState("home");

  // Check feature flags
  const isAuthEnabled = useFeature("auth");
  const isFlashcardsEnabled = useFeature("flashcards");
  const isGenerationsEnabled = useFeature("generations");

  useEffect(() => {
    // Determine active view based on current path
    const current = NAV_ITEMS.find((item) => {
      if (item.path === "/") {
        return currentPath === "/";
      }
      return currentPath.startsWith(item.path);
    });
    if (current) {
      setActiveView(current.id);
    }
  }, [currentPath]);

  const isAuthenticated = !!user;

  // Helper function to check if feature is enabled for an item
  const isFeatureEnabled = (item: NavItem): boolean => {
    if (!item.feature) return true; // No feature requirement, always enabled

    switch (item.feature) {
      case "auth":
        return isAuthEnabled;
      case "flashcards":
        return isFlashcardsEnabled;
      case "generations":
        return isGenerationsEnabled;
      default:
        return true;
    }
  };

  // Filter items based on authentication and feature flags
  const visibleItems = NAV_ITEMS.filter((item) => {
    // Check if feature is enabled
    if (!isFeatureEnabled(item)) {
      return false;
    }

    // Filter based on authentication
    if (isAuthenticated) {
      return item.id !== "login"; // Hide login for authenticated users
    } else {
      return ["home", "login"].includes(item.id); // Show only home and login for guests
    }
  });

  return (
    <nav className="bottom-nav md:hidden" role="navigation" aria-label="Main navigation">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        const isDisabled = item.requiresAuth && !user;
        const targetPath = isDisabled ? "/login" : item.path;

        return (
          <a
            key={item.id}
            href={targetPath}
            className={`nav-item ${isActive ? "active" : ""} ${isDisabled ? "opacity-50" : ""}`}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            aria-disabled={isDisabled}
          >
            <Icon size={20} />
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
