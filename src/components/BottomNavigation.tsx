import { Home, Zap, BookOpen, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BottomNavigationProps {
  currentPath: string;
  user?: any;
}

interface NavItem {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
  requiresAuth?: boolean;
}

export function BottomNavigation({ currentPath, user }: BottomNavigationProps) {
  const [activeView, setActiveView] = useState('home');

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'generator', label: 'Generator', icon: Zap, path: '/generate', requiresAuth: true },
    { id: 'review', label: 'Review', icon: BookOpen, path: '/review', requiresAuth: true },
    { id: 'profile', label: 'Profil', icon: User, path: '/profile', requiresAuth: true },
  ];

  useEffect(() => {
    // Determine active view based on current path
    const current = navItems.find(item => {
      if (item.path === '/') {
        return currentPath === '/';
      }
      return currentPath.startsWith(item.path);
    });
    if (current) {
      setActiveView(current.id);
    }
  }, [currentPath]);

  return (
    <nav 
      className="bottom-nav" 
      role="navigation" 
      aria-label="Main navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;
        const isDisabled = item.requiresAuth && !user;
        const targetPath = isDisabled ? '/login' : item.path;

        return (
          <a
            key={item.id}
            href={targetPath}
            className={`nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'opacity-50' : ''}`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
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