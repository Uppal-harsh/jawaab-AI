import { INotificationProvider } from './index';
import { env } from '../../lib/env';

export class WhatsAppNotificationProvider implements INotificationProvider {
  private apiKey = env.WHATSAPP_API_KEY;
  private phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  async sendWhatsAppNotification(to: string, message: string): Promise<void> {
    const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: {
        preview_url: true,
        body: message,
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
        return;
      } catch (error) {
        attempts--;
        if (attempts <= 0) {
          console.error('[WhatsAppNotificationProvider] Failed to dispatch notification:', error);
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  }
}
