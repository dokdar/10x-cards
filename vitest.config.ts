/// <reference types="vitest" />
/**
 * Uwaga: Przy uruchamianiu testów może pojawić się ostrzeżenie:
 * "close timed out after 10000ms - Tests closed successfully but something prevents Vite server from exiting"
 *
 * To znany problem z Astro + Vite + Vitest (file watchers nie zamykają się prawidłowo).
 * Ostrzeżenie NIE wpływa na poprawność testów - exit code jest 0 i wszystkie testy przechodzą.
 */
import { getViteConfig } from "astro/config";
import react from "@astrojs/react";

export default getViteConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    // Exclude astro.config.test.mjs - to nie jest plik testowy, tylko konfiguracja dla środowiska testowego
    exclude: ["node_modules", "dist", ".astro", "e2e", "astro.config.test.mjs"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", ".astro/", "e2e/"],
    },
  },
});
