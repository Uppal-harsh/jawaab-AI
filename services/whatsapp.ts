import { env } from '../lib/env';
import { WhatsAppNotificationPayload } from '../types';

export class WhatsAppService {
  private static apiKey = env.WHATSAPP_API_KEY;
  private static phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  private static baseUrl = 'https://graph.facebook.com/v18.0';

  /**
   * Sends a structured summary notification to the business owner
   */
  static async sendCallSummaryNotification(
    targetWhatsAppNumber: string,
    payload: WhatsAppNotificationPayload
  ): Promise<boolean> {
    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
    
    // Construct rich text notification body
    const alertBody = `🔔 *New Lead Captured by Jawaab AI!*

*Caller:* ${payload.callerName || 'Unknown Caller'} (${payload.callerPhone})
*Reason:* ${payload.reason}
*Urgency:* ${payload.urgency.toUpperCase()}
*Callback Request:* ${payload.callbackRequested ? '⚠️ YES' : 'NO'}
*Duration:* ${payload.durationSeconds} seconds

*Summary:* ${payload.summary}
${payload.recordingUrl ? `*Recording Link:* ${payload.recordingUrl}` : ''}

_Action: Click the number to callback immediately._`;

    // Meta API JSON payload
    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: targetWhatsAppNumber,
      type: 'text',
      text: {
        preview_url: true,
        body: alertBody,
      },
    };

    let attempts = 3;
    let delay = 1000;

    while (attempts > 0) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`WhatsApp API returned HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json();
        console.log(`[WhatsAppService] Notification sent successfully to ${targetWhatsAppNumber}:`, data);
        return true;
      } catch (error) {
        attempts--;
        if (attempts <= 0) {
          console.error('[WhatsAppService] Max retries exhausted. Failed to send WhatsApp message:', error);
          return false;
        }
        console.warn(`[WhatsAppService] Send failed. Retrying in ${delay}ms... Error: ${error instanceof Error ? error.message : String(error)}`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    return false;
  }
}
