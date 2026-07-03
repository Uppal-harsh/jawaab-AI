import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(), // Public anon key for client-side Auth
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENROUTER_API_KEY: z.string().min(1),
  SARVAM_API_KEY: z.string().min(1),
  EXOTEL_API_KEY: z.string().min(1),
  EXOTEL_API_TOKEN: z.string().min(1),
  EXOTEL_ACCOUNT_SID: z.string().min(1),
  WHATSAPP_API_KEY: z.string().min(1),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1),
  EXOTEL_WEBHOOK_SECRET: z.string().min(1),
  // Dashboard admin credentials (simple single-admin config)
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(6),
});

// Validate process.env and throw a clear error immediately if validation fails.
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Environment validation failed:', JSON.stringify(result.error.format(), null, 2));
    throw new Error('Environment variable configuration is invalid. Please fix .env before starting.');
  }

  return result.data;
};

export const env = parseEnv();
export type EnvType = z.infer<typeof envSchema>;
