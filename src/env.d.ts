/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client";

/**
 * User object available in Astro.locals after authentication
 * Contains only essential user information from Supabase Auth
 */
interface AppUser {
  id: string;
  email: string;
  aud?: string;
}

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      user?: AppUser;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_API_URL?: string;
  readonly OPENROUTER_DEFAULT_MODEL?: string;
  readonly AI_GENERATION_TIMEOUT?: string;
  readonly AI_MAX_RETRIES?: string;
  readonly SUPABASE_SITE_URL: string;
  readonly PUBLIC_ENV_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
