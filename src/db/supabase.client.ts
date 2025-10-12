import { createClient } from '@supabase/supabase-js';

import type { Database } from './database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = typeof supabaseClient;

// Mock user ID for development (before authentication is implemented)
export const DEFAULT_USER_ID = 'db5156e8-8a81-4f6c-96a3-949393498804';
