import { ActionIntent } from '../types';
import { INotificationProvider } from '../providers';

export class ActionExecutor {
  private notificationProvider: INotificationProvider;

  constructor(notificationProvider: INotificationProvider) {
    this.notificationProvider = notificationProvider;
  }

  /**
   * Parses LLM text output for intent tags, e.g. [INTENT: EndConversation]
   */
  parseIntent(text: string): ActionIntent | null {
    const match = text.match(/\[INTENT:\s*([A-Za-z]+)\]/);
    if (!match) return null;

    const type = match[1] as any;
    const cleanText = text.replace(/\[INTENT:\s*[A-Za-z]+\]/g, '').trim();

    return {
      type,
      payload: { cleanText }
    };
  }

  /**
   * Executes parsed intents
   */
  async execute(intent: ActionIntent, context: { businessPhone: string; whatsappNumber: string }): Promise<void> {
    console.log(`[ActionExecutor] Executing intent: ${intent.type}`);

    switch (intent.type) {
      case 'SendWhatsApp':
      case 'BookAppointment':
        await this.notificationProvider.sendWhatsAppNotification(
          context.whatsappNumber,
          `📬 *Jawaab AI Intent Alert:* Callback / Appointment requested from call session.`
        );
        break;
      case 'TransferCall':
        // Telephony provider handles the call redirect transfers.
        break;
      case 'RequestHuman':
        await this.notificationProvider.sendWhatsAppNotification(
          context.whatsappNumber,
          `⚠️ *Urgent: Human requested* for in-progress call at +91 ${context.businessPhone}`
        );
        break;
      default:
        break;
    }
  }
}
