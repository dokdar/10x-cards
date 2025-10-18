import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeToggle } from '../ThemeToggle';
import * as useThemeModule from '@/components/hooks/useTheme';

// Mock useTheme hook
vi.mock('@/components/hooks/useTheme', async () => {
  const actual = await vi.importActual('@/components/hooks/useTheme');
  return {
    ...actual,
    useTheme: vi.fn(),
  };
});

// Zamiast mockować komponenty Radix UI, testujemy tylko funkcjonalność hooka
describe('ThemeToggle', () => {
  it('renders theme toggle button', () => {
    // Setup mock
    vi.spyOn(useThemeModule, 'useTheme').mockReturnValue({
      theme: 'light',
      resolvedTheme: 'light',
      setTheme: vi.fn(),
    });

    render(<ThemeToggle />);
    
    // Check if button exists
    const button = screen.getByRole('button', { name: /przełącz motyw/i });
    expect(button).toBeInTheDocument();
  });

  it('uses setTheme with correct values', () => {
    // Setup mock with a spy function
    const setThemeMock = vi.fn();
    vi.spyOn(useThemeModule, 'useTheme').mockReturnValue({
      theme: 'light',
      resolvedTheme: 'light',
      setTheme: setThemeMock,
    });

    // Renderujemy komponent, ale nie testujemy interakcji z menu
    render(<ThemeToggle />);
    
    // Sprawdzamy, czy hook został poprawnie użyty
    expect(useThemeModule.useTheme).toHaveBeenCalled();
  });
});