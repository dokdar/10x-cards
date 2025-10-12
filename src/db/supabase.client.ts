import { createClient } from '@supabase/supabase-js';

import type { Database } from './database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = typeof supabaseClient;

// Mock user ID for development (before authentication is implemented)
export const DEFAULT_USER_ID = 'e4824122-fd84-4836-939b-115b5d2e578b';
