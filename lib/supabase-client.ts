import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// In Next.js client side, process.env.NEXT_PUBLIC_... is exposed.
// We fallback to standard service role key only for safety if anon key is not defined (for local fallback dev).
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
