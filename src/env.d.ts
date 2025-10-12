/// <reference types="astro/client" />

import type { SupabaseClient } from './db/supabase.client';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_API_URL?: string;
  readonly AI_GENERATION_TIMEOUT?: string;
  readonly AI_MAX_RETRIES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
