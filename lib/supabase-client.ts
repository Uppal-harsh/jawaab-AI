import { createClient } from '@supabase/supabase-js';
import { env } from './env';

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY || 'mock_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
