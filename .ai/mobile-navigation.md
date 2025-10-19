# Mobile Navigation Specification - 10x Cards

## Overview

This specification outlines the changes required to improve the mobile experience of the **10x Cards** application while maintaining the current desktop behavior. The changes focus on implementing a mobile-first bottom navigation pattern and reorganizing the main views for better accessibility and user experience.

## Current Application Structure

### Main Views
- **Home/Dashboard** (`/`) - Landing page with welcome content
- **Generator** (`/generate`) - AI flashcard generation interface
- **Review** (`/review/[id]`) - Flashcard review and editing interface
- **Authentication** (`/login`, `/register`) - User authentication flows

### Components Affected

- `Header.tsx` (main navigation component)
- `MobileMenu.tsx` (current hamburger menu)
- `Layout.astro` (main layout wrapper)
- `AIGeneratorView.tsx` (generator interface)
- `ReviewView.tsx` (review interface)

## Desktop Behavior (>= md breakpoint)

- Maintain current header-based navigation
- Keep the existing desktop menu in header
- Preserve current page-based routing structure
- No changes to current layout and component distribution
- Continue using `ThemeToggle` in header

## Mobile Behavior (< md breakpoint)

### Layout Changes

- Transform into a single-view layout with bottom navigation
- Replace hamburger menu with bottom navigation bar
- Each main view (Home, Generator, Review) becomes a full-width interface
- Remove the current hamburger menu toggle
- Maintain header for branding and essential actions only

### Bottom Navigation

- Fixed position at the bottom of the viewport
- Four equal-width navigation items:
  1. **Home** (🏠) - Dashboard/Welcome
  2. **Generator** (⚡) - AI flashcard creation
  3. **Review** (📚) - Active review sessions
  4. **Profile** (👤) - User settings and logout
- Active state indication for current view
- Consistent with modern mobile app patterns
- Dark theme by default (matching current design)
- Minimum touch target: 44x44px

### View Transitions

- Smooth transitions between main views (300ms duration)
- Maintain scroll position for each view independently
- No content reflow during transitions
- Preserve form state when switching between views

### Accessibility Requirements

- All navigation items must have a minimum touch target of 44x44px
- Proper ARIA labels for screen readers
- Keyboard navigation support
- High contrast mode compatibility
- Focus indicators for keyboard users
- Support for reduced motion preferences

## Technical Constraints

- **Astro 4.x** with React integration
- **React 18.3** compatibility
- **Tailwind CSS 4** integration
- **TypeScript** strict mode
- **Supabase** authentication integration
- No external dependencies for navigation logic
- Maintain existing routing structure

## Implementation Details

### State Management

- Use React state or lightweight state management for active view
- Integrate with existing Supabase auth state
- Handle view switching with smooth animations
- Preserve authentication state across navigation

### CSS Classes

```css
/* Bottom navigation container */
.bottom-nav {
  @apply fixed bottom-0 left-0 right-0 z-50;
  @apply bg-gray-900 border-t border-gray-700;
  @apply flex items-center justify-around;
  @apply h-16 px-4 safe-area-inset-bottom;
}

/* Navigation item */
.nav-item {
  @apply flex flex-col items-center justify-center;
  @apply min-w-[44px] min-h-[44px];
  @apply text-gray-400 hover:text-white;
  @apply transition-colors duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-blue-400;
}

/* Active navigation item */
.nav-item.active {
  @apply text-blue-400;
}

/* View container */
.view-container {
  @apply pb-20; /* Account for bottom navigation height + safe area */
  @apply min-h-screen;
}

/* Mobile header adjustments */
.mobile-header {
  @apply px-4 py-3;
  @apply flex items-center justify-between;
  @apply bg-gray-900 border-b border-gray-700;
}
```

### Component Structure

```typescript
interface BottomNavProps {
  activeView: 'home' | 'generator' | 'review' | 'profile';
  onViewChange: (view: string) => void;
  user?: User | null;
}

interface NavigationState {
  activeView: string;
  scrollPositions: Record<string, number>;
  isAuthenticated: boolean;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  requiresAuth?: boolean;
}
```

### Integration Points

- **Authentication**: Integrate with existing Supabase auth
- **Routing**: Work with Astro's file-based routing
- **Theme**: Respect existing dark/light theme toggle
- **Forms**: Maintain form state during navigation
- **Error Handling**: Preserve error states across views

### Mobile-Specific Features

- **Generator View**: Optimize form layout for mobile input
- **Review View**: Implement swipe gestures for card navigation
- **Profile View**: Consolidate user settings and logout
- **Home View**: Quick access to recent activities and stats

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Create `BottomNavigation.tsx` component
- Update `Layout.astro` to conditionally render bottom nav on mobile
- Implement basic view switching logic
- Test with existing authentication flow

### Phase 2: View Optimization (Week 2)
- Optimize `AIGeneratorView.tsx` for mobile bottom navigation
- Enhance `ReviewView.tsx` with mobile-specific features
- Create dedicated `ProfileView.tsx` component
- Implement scroll position preservation

### Phase 3: Polish & Testing (Week 3)
- Add smooth transitions and animations
- Implement swipe gestures for review cards
- Comprehensive accessibility testing
- Performance optimization and testing

### Phase 4: Analytics & Refinement (Week 4)
- Implement usage analytics
- A/B test with existing hamburger menu
- Gather user feedback
- Performance monitoring and optimization

## Code Examples

### Bottom Navigation Component

```tsx
// src/components/BottomNavigation.tsx
import { Home, Zap, BookOpen, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BottomNavigationProps {
  currentPath: string;
  user?: any;
}

export default function BottomNavigation({ currentPath, user }: BottomNavigationProps) {
  const [activeView, setActiveView] = useState('home');

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'generator', label: 'Generator', icon: Zap, path: '/generate', requiresAuth: true },
    { id: 'review', label: 'Review', icon: BookOpen, path: '/review', requiresAuth: true },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile', requiresAuth: true },
  ];

  useEffect(() => {
    const current = navItems.find(item => currentPath.startsWith(item.path));
    if (current) setActiveView(current.id);
  }, [currentPath]);

  return (
    <nav className="bottom-nav md:hidden" role="navigation" aria-label="Main navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        const isDisabled = item.requiresAuth && !user;

        return (
          <a
            key={item.id}
            href={isDisabled ? '/login' : item.path}
            className={`nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'opacity-50' : ''}`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} />
            <span className="text-xs mt-1">{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
```

### Layout Integration

```astro
---
// src/layouts/Layout.astro
import BottomNavigation from '../components/BottomNavigation.tsx';

const { user } = Astro.locals;
const currentPath = Astro.url.pathname;
---

<html>
  <body>
    <Header user={user} />
    <main class="view-container">
      <slot />
    </main>
    <BottomNavigation currentPath={currentPath} user={user} client:load />
  </body>
</html>
```

## Success Metrics

- Improved mobile task completion rate (target: +30%)
- Reduced navigation confusion (target: -50%)
- Increased mobile session duration (target: +20%)
- Better accessibility scores (target: 95+ Lighthouse)
- Faster mobile navigation (target: <300ms transitions)
- Higher mobile conversion rate for flashcard creation (target: +25%)

## Testing Strategy

### Functional Testing
- Cross-device compatibility (iOS Safari, Android Chrome)
- Authentication flow with bottom navigation
- Form state preservation during navigation
- Offline behavior and error handling

### Accessibility Testing
- Screen reader compatibility (VoiceOver, TalkBack)
- Keyboard navigation flow
- Color contrast validation
- Touch target size verification

### Performance Testing
- Navigation transition smoothness
- Memory usage during view switching
- Bundle size impact analysis
- Core Web Vitals monitoring

## Rollback Plan

If issues arise during implementation:
1. Feature flag to toggle between hamburger and bottom navigation
2. Gradual rollout to percentage of mobile users
3. Quick revert capability via environment variables
4. Fallback to current hamburger menu implementation
