/**
 * Supabase client singleton.
 * Reads VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY from environment.
 *
 * IMPORTANT: Set these as GitHub Actions secrets (or a .env.local for dev).
 * Without them the app builds but data calls fail with a clear error.
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    '[MyFollowUp] Supabase env not configured. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder-anon-key');
