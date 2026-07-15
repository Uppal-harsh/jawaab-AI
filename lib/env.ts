import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(), // Public anon key for client-side Auth
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENROUTER_API_KEY: z.string().min(1),
  WHATSAPP_API_KEY: z.string().min(1),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1),
  // Dashboard admin credentials (simple single-admin config)
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(6),
});

// Validate process.env and throw a clear error immediately if validation fails.
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // Check if we are building or running in local dev / test environments
    if (
      process.env.NEXT_PHASE === 'phase-production-build' || 
      process.env.NODE_ENV === 'development' || 
      process.env.NODE_ENV === 'test'
    ) {
      console.warn('⚠️ Environment validation failed. Using mock fallbacks for local running/compilation.');
      return {
        NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:3000',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock_anon_key',
        SUPABASE_SERVICE_ROLE_KEY: 'mock_service_key',
        OPENROUTER_API_KEY: 'mock_openrouter_key',
        WHATSAPP_API_KEY: 'mock_whatsapp_key',
        WHATSAPP_PHONE_NUMBER_ID: 'mock_phone_id',
        ADMIN_EMAIL: 'admin@example.com',
        ADMIN_PASSWORD: 'mock_password123',
      } as any;
    }
    console.error('❌ Environment validation failed:', JSON.stringify(result.error.format(), null, 2));
    throw new Error('Environment variable configuration is invalid. Please fix .env before starting.');
  }

  return result.data;
};

export const env = parseEnv();
export type EnvType = z.infer<typeof envSchema>;
