import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "./mocks/handlers";
import { cleanup } from "@testing-library/react";

// Mock 'astro:env/server' to prevent errors in test environment
vi.mock("astro:env/server", () => ({
  // Add any properties you need to mock here
  // For now, an empty object should suffice
}));

// Konfiguracja MSW (Mock Service Worker)
export const server = setupServer(...handlers);

// Uruchomienie serwera przed wszystkimi testami
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Resetowanie handlerów po każdym teście
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Zamknięcie serwera po wszystkich testach
afterAll(async () => {
  server.close();
  // Daj czas na zamknięcie wszystkich połączeń
  await new Promise((resolve) => setTimeout(resolve, 100));
});
