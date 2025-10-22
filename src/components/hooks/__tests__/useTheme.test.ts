import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "../useTheme";

describe("useTheme", () => {
  // Zapisujemy oryginalne metody, aby przywrócić je po testach
  const originalMatchMedia = window.matchMedia;
  const originalLocalStorage = {
    getItem: localStorage.getItem,
    setItem: localStorage.setItem,
  };

  beforeEach(() => {
    // Resetujemy mocki przed każdym testem
    vi.resetAllMocks();

    // Mockujemy localStorage
    Storage.prototype.getItem = vi.fn();
    Storage.prototype.setItem = vi.fn();

    // Mockujemy matchMedia
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Mockujemy document.documentElement
    Object.defineProperty(document, "documentElement", {
      value: {
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      },
      writable: true,
    });
  });

  // Przywracamy oryginalne metody po testach
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    Storage.prototype.getItem = originalLocalStorage.getItem;
    Storage.prototype.setItem = originalLocalStorage.setItem;
  });

  it("powinien używać motywu z localStorage, jeśli jest dostępny", () => {
    // Mockujemy localStorage, aby zwracał "dark"
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("dark");

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("powinien używać motywu systemowego, jeśli nie ma zapisanego motywu", () => {
    // Mockujemy localStorage, aby zwracał null (brak zapisanego motywu)
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);

    // Mockujemy preferencje systemowe na "dark"
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("powinien zmieniać motyw po wywołaniu setTheme", () => {
    // Mockujemy localStorage
    vi.spyOn(Storage.prototype, "getItem").mockReturnValue("light");

    const { result } = renderHook(() => useTheme());

    // Początkowy motyw powinien być "light"
    expect(result.current.theme).toBe("light");

    // Zmieniamy motyw na "dark"
    act(() => {
      result.current.setTheme("dark");
    });

    // Motyw powinien zostać zmieniony na "dark"
    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");

    // Sprawdzamy, czy localStorage został zaktualizowany
    expect(localStorage.setItem).toHaveBeenCalledWith("theme", "dark");
  });
});
