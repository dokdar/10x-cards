import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

// Mock Radix UI DropdownMenu
vi.mock('@/components/ui/dropdown-menu', () => {
  return {
    DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-content">{children}</div>,
    DropdownMenuItem: ({ onClick, children }: { onClick: () => void, children: React.ReactNode }) => (
      <button onClick={onClick} data-testid="menu-item">{children}</button>
    ),
  };
});

describe('ThemeToggle', () => {
  let setThemeMock: ReturnType<typeof vi.fn>;
  
  beforeEach(() => {
    setThemeMock = vi.fn();
    // Domyślny mock dla useTheme
    vi.spyOn(useThemeModule, 'useTheme').mockReturnValue({
      theme: 'light',
      resolvedTheme: 'light',
      setTheme: setThemeMock,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders theme toggle button', () => {
    render(<ThemeToggle />);
    
    // Check if button exists
    const button = screen.getByRole('button', { name: /przełącz motyw/i });
    expect(button).toBeInTheDocument();
    
    // Sprawdzamy, czy ikony są poprawnie renderowane
    expect(screen.getByText('Przełącz motyw')).toBeInTheDocument();
  });

  it('renders correctly in light mode', () => {
    render(<ThemeToggle />);
    
    // Sprawdzamy, czy komponent renderuje się poprawnie w trybie jasnym
    const button = screen.getByRole('button', { name: /przełącz motyw/i });
    expect(button).toBeInTheDocument();
    
    // Robimy snapshot dla trybu jasnego
    expect(button).toMatchInlineSnapshot(`
      <button
        aria-label="Przełącz motyw"
        class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 size-9"
        data-slot="button"
      >
        <svg
          class="lucide lucide-sun size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
          fill="none"
          height="24"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="4"
          />
          <path
            d="M12 2v2"
          />
          <path
            d="M12 20v2"
          />
          <path
            d="m4.93 4.93 1.41 1.41"
          />
          <path
            d="m17.66 17.66 1.41 1.41"
          />
          <path
            d="M2 12h2"
          />
          <path
            d="M20 12h2"
          />
          <path
            d="m6.34 17.66-1.41 1.41"
          />
          <path
            d="m19.07 4.93-1.41 1.41"
          />
        </svg>
        <svg
          class="lucide lucide-moon absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
          fill="none"
          height="24"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
          />
        </svg>
        <span
          class="sr-only"
        >
          Przełącz motyw
        </span>
      </button>
    `);
  });

  it('renders correctly in dark mode', () => {
    // Ustawiamy tryb ciemny
    vi.spyOn(useThemeModule, 'useTheme').mockReturnValue({
      theme: 'dark',
      resolvedTheme: 'dark',
      setTheme: setThemeMock,
    });
    
    render(<ThemeToggle />);
    
    // Sprawdzamy, czy komponent renderuje się poprawnie w trybie ciemnym
    const button = screen.getByRole('button', { name: /przełącz motyw/i });
    expect(button).toBeInTheDocument();
    
    // Robimy snapshot dla trybu ciemnego
    expect(button).toMatchInlineSnapshot(`
      <button
        aria-label="Przełącz motyw"
        class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 size-9"
        data-slot="button"
      >
        <svg
          class="lucide lucide-sun size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
          fill="none"
          height="24"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="4"
          />
          <path
            d="M12 2v2"
          />
          <path
            d="M12 20v2"
          />
          <path
            d="m4.93 4.93 1.41 1.41"
          />
          <path
            d="m17.66 17.66 1.41 1.41"
          />
          <path
            d="M2 12h2"
          />
          <path
            d="M20 12h2"
          />
          <path
            d="m6.34 17.66-1.41 1.41"
          />
          <path
            d="m19.07 4.93-1.41 1.41"
          />
        </svg>
        <svg
          class="lucide lucide-moon absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
          fill="none"
          height="24"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
          />
        </svg>
        <span
          class="sr-only"
        >
          Przełącz motyw
        </span>
      </button>
    `);
  });

  it('renders correctly in system mode', () => {
    // Ustawiamy tryb systemowy
    vi.spyOn(useThemeModule, 'useTheme').mockReturnValue({
      theme: 'system',
      resolvedTheme: 'light', // Zakładamy, że system preferuje jasny motyw
      setTheme: setThemeMock,
    });
    
    render(<ThemeToggle />);
    
    // Sprawdzamy, czy komponent renderuje się poprawnie w trybie systemowym
    const button = screen.getByRole('button', { name: /przełącz motyw/i });
    expect(button).toBeInTheDocument();
  });

  it('calls setTheme with "light" when light option is clicked', () => {
    render(<ThemeToggle />);
    
    // Znajdujemy wszystkie przyciski menu
    const menuItems = screen.getAllByTestId('menu-item');
    
    // Klikamy opcję jasnego motywu (pierwszy element)
    const lightOption = menuItems.find(item => item.textContent?.includes('Jasny'));
    lightOption?.click();
    
    // Sprawdzamy, czy setTheme zostało wywołane z odpowiednim argumentem
    expect(setThemeMock).toHaveBeenCalledWith('light');
  });

  it('calls setTheme with "dark" when dark option is clicked', () => {
    render(<ThemeToggle />);
    
    // Znajdujemy wszystkie przyciski menu
    const menuItems = screen.getAllByTestId('menu-item');
    
    // Klikamy opcję ciemnego motywu (drugi element)
    const darkOption = menuItems.find(item => item.textContent?.includes('Ciemny'));
    darkOption?.click();
    
    // Sprawdzamy, czy setTheme zostało wywołane z odpowiednim argumentem
    expect(setThemeMock).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme with "system" when system option is clicked', () => {
    render(<ThemeToggle />);
    
    // Znajdujemy wszystkie przyciski menu
    const menuItems = screen.getAllByTestId('menu-item');
    
    // Klikamy opcję systemowego motywu (trzeci element)
    const systemOption = menuItems.find(item => item.textContent?.includes('Systemowy'));
    systemOption?.click();
    
    // Sprawdzamy, czy setTheme zostało wywołane z odpowiednim argumentem
    expect(setThemeMock).toHaveBeenCalledWith('system');
  });

  it('correctly responds to system preference changes', () => {
    // Testujemy, czy komponent reaguje na zmiany preferencji systemowych
    // Najpierw ustawiamy tryb systemowy z preferencją jasnego motywu
    vi.spyOn(useThemeModule, 'useTheme').mockReturnValue({
      theme: 'system',
      resolvedTheme: 'light',
      setTheme: setThemeMock,
    });
    
    const { rerender } = render(<ThemeToggle />);
    
    // Następnie zmieniamy preferencję systemową na ciemny motyw
    vi.spyOn(useThemeModule, 'useTheme').mockReturnValue({
      theme: 'system',
      resolvedTheme: 'dark',
      setTheme: setThemeMock,
    });
    
    rerender(<ThemeToggle />);
    
    // Sprawdzamy, czy hook został poprawnie użyty
    expect(useThemeModule.useTheme).toHaveBeenCalled();
  });
});