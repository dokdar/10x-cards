import { createClient } from '@supabase/supabase-js';

import type { Database } from './database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = typeof supabaseClient;

// Mock user ID for development (before authentication is implemented)
export const DEFAULT_USER_ID = 'c7261d9f-2ce7-451b-aaad-e81ebb81e2d6';
