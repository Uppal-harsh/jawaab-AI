import crypto from 'crypto';
import { env } from '../lib/env';

/**
 * Validates Exotel HMAC signatures securely.
 */
export function validateExotelWebhook(rawBody: string, signature: string | null): boolean {
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

/**
 * Validates Twilio signatures securely.
 */
export function validateTwilioWebhook(
  url: string,
  params: Record<string, string>,
  signature: string | null
): boolean {
  const authToken = env.TWILIO_AUTH_TOKEN;
  if (!authToken || !signature) {
    if (!authToken) {
      console.warn('[Twilio Validator] TWILIO_AUTH_TOKEN is not set. Bypassing request validation.');
      return true;
    }
    return false;
  }

  let signatureString = url;
  const sortedKeys = Object.keys(params).sort();
  for (const key of sortedKeys) {
    signatureString += key + params[key];
  }

  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(signatureString)
    .digest('base64');

  const providedBuffer = Buffer.from(signature, 'utf-8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}
