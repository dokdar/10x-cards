import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">10x Cards</span>
          </a>
        </div>

        <nav className="flex items-center gap-4">
          <a
            href="/generate"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Generator
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

