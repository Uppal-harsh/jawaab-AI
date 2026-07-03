import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Service role client bypasses RLS for system operations like webhook processing
export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Standard Client for use where standard auth credentials apply
export const supabaseClient = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);
