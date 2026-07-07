import { IVoiceProvider } from './index';

export class ExotelVoiceProvider implements IVoiceProvider {
  createResponseXML(text: string, voice: string, language: string, redirectUrl: string): string {
    // Exotel accepts standard TwiML-style gathers and redirects
    return `
<Response>
  <Say voice="${voice}" language="${language}">${this.escapeXml(text)}</Say>
  <Gather input="speech" action="${redirectUrl}" timeout="5" speechTimeout="auto" />
</Response>
    `.trim();
  }

  createResponsePlayXML(audioUrl: string, redirectUrl: string): string {
    return `
<Response>
  <Play>${audioUrl}</Play>
  <Gather input="speech" action="${redirectUrl}" timeout="5" speechTimeout="auto" />
</Response>
    `.trim();
  }

  createErrorXML(voice: string, language: string): string {
    const fallbackText = language.startsWith('hi')
      ? "तकनीकी समस्या के कारण हम आपकी कॉल अभी कनेक्ट नहीं कर पा रहे हैं। हम जल्द ही आपको वापस कॉल करेंगे।"
      : "We are facing technical issues. A representative will call you back shortly.";
    return `
<Response>
  <Say voice="${voice}" language="${language}">${fallbackText}</Say>
  <Hangup />
</Response>
    `.trim();
  }

  private escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }
}
