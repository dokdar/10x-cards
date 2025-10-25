// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare(),
  env: {
    schema: {
      // Supabase (server-only secrets)
      SUPABASE_URL: envField.string({ context: "server", access: "secret", url: true }),
      SUPABASE_KEY: envField.string({ context: "server", access: "secret" }),
      SUPABASE_SITE_URL: envField.string({ context: "server", access: "public", optional: true, url: true }),

      // OpenRouter (server-only)
      OPENROUTER_API_KEY: envField.string({ context: "server", access: "secret" }),
      OPENROUTER_API_URL: envField.string({ context: "server", access: "public", optional: true, url: true }),
      OPENROUTER_DEFAULT_MODEL: envField.string({ context: "server", access: "public", optional: true }),

      // AI generation tuning (as strings; cast at usage)
      AI_GENERATION_TIMEOUT: envField.string({ context: "server", access: "public", optional: true }),
      AI_MAX_RETRIES: envField.string({ context: "server", access: "public", optional: true }),

      // Example public env used in UI
      PUBLIC_ENV_NAME: envField.string({ context: "client", access: "public", optional: true }),
    },
  },
});
