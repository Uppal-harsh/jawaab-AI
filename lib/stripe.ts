import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';

export const stripe = new Stripe(stripeSecret, {
  apiVersion: '2024-06-20' as any, // Use standard stable api version
  typescript: true,
});
