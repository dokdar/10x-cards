import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "./mocks/handlers";
import { cleanup } from "@testing-library/react";

// Mock dla astro:env/server - moduł dostępny tylko po stronie serwera
vi.mock("astro:env/server", () => ({
  getSecret: vi.fn((key: string) => {
    const secrets: Record<string, string> = {
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_KEY: "test-key",
      OPENROUTER_API_KEY: "test-api-key",
    };
    return secrets[key] || "";
  }),
  OPENROUTER_DEFAULT_MODEL: "test-model",
  SUPABASE_SITE_URL: "http://localhost:3000",
  OPENROUTER_API_URL: "https://openrouter.ai/api/v1",
  AI_GENERATION_TIMEOUT: "30000",
  AI_MAX_RETRIES: "3",
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
