import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_to_prevent_build_time_failures';

export const stripe = new Stripe(stripeSecret, {
  apiVersion: '2024-06-20' as any, // Use standard stable api version
  typescript: true,
});
