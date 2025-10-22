import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/database.types";

// Env variables are loaded via playwright.config.ts from .env.test; names follow .env.example
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const E2E_USERNAME = process.env.E2E_USERNAME;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

teardown("cleanup: remove test data from Supabase (excluding users)", async () => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("[CLEANUP] Missing SUPABASE_URL/SUPABASE_KEY envs; skipping cleanup");
    return;
  }

  // We rely on RLS, so sign in with E2E test user to delete only its data
  if (!E2E_USERNAME || !E2E_PASSWORD) {
    console.warn("[CLEANUP] Missing E2E_USERNAME/E2E_PASSWORD; skipping user-scoped cleanup");
    return;
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: E2E_USERNAME,
    password: E2E_PASSWORD,
  });
  if (signInError) {
    console.warn("[CLEANUP] Sign-in failed; skipping cleanup:", signInError.message);
    return;
  }

  const { data: userData, error: getUserError } = await supabase.auth.getUser();
  if (getUserError || !userData?.user?.id) {
    console.warn("[CLEANUP] Could not retrieve user id; skipping cleanup");
    return;
  }
  const userId = userData.user.id;

  // Clean tables in safe order: flashcards -> generation_error_logs -> generations
  const tables = ["flashcards", "generation_error_logs", "generations"] as const;

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId);
    if (error) {
      console.warn(`[CLEANUP] Error cleaning ${table}:`, error.message);
    } else {
      console.log(`[CLEANUP] Cleaned table ${table} for user ${userId}`);
    }
  }

  console.log("[CLEANUP] Supabase cleanup completed");
});
