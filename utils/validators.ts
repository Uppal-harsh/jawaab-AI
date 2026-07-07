import crypto from 'crypto';
import { env } from '../lib/env';

/**
 * Validates Exotel HMAC signatures securely.
 */
export function validateExotelWebhook(rawBody: string, signature: string | null): boolean {
  if (process.env.NODE_ENV === 'development' || env.EXOTEL_WEBHOOK_SECRET === 'bypass') {
    console.warn('[Telephony Validator] Bypassing Exotel signature validation in development mode.');
    return true;
  }

  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', env.EXOTEL_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  const providedBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  // Prevent RangeError crash (Denial of Service) if lengths differ
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

