// @ts-check
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";
import dotenv from "dotenv";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import node from "@astrojs/node";

// Detect if running in test mode from command line args
// `astro dev --mode test` sets mode to 'test'
const args = process.argv.slice(2);
const modeIndex = args.indexOf('--mode');
const isTestMode = modeIndex !== -1 && args[modeIndex + 1] === 'test';

// Load .env.test explicitly for E2E tests
if (isTestMode) {
  dotenv.config({ path: '.env.test' });
}

// Load environment variables based on mode
const mode = isTestMode ? 'test' : (process.env.NODE_ENV || 'development');
const env = loadEnv(mode, process.cwd(), '');

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    define: {
      // Make environment variables available to the client
      'import.meta.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'import.meta.env.SUPABASE_KEY': JSON.stringify(env.SUPABASE_KEY),
      'import.meta.env.SUPABASE_SITE_URL': JSON.stringify(env.SUPABASE_SITE_URL),
    },
  },
  adapter: node({
    mode: "standalone",
  }),
});
