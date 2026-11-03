import { createClient } from '@supabase/supabase-js';

// Used only for Realtime (presence + broadcast). Identity comes from Firebase.
export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 30 } },
  }
);