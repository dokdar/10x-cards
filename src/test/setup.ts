import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "./mocks/handlers";
import { cleanup } from "@testing-library/react";

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
