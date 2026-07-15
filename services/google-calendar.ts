import crypto from 'crypto';

export class GoogleCalendarService {
  /**
   * Generates a signed JWT for Google Service Account authentication natively
   */
  private static generateJWT(clientEmail: string, privateKey: string): string {
    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/calendar',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signatureInput = `${base64Header}.${base64Payload}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    // Replace literal '\n' back to actual newlines if service key was formatted single-line
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
    const signature = sign.sign(formattedPrivateKey, 'base64url');

    return `${signatureInput}.${signature}`;
  }

  /**
   * Fetches an access token from Google OAuth2 server natively
   */
  private static async getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
    const jwt = this.generateJWT(clientEmail, privateKey);
    const params = new URLSearchParams();
    params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    params.append('assertion', jwt);

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to fetch Google OAuth token: ${err}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Creates an event in Google Calendar natively via REST API
   */
  static async createEvent(
    summary: string,
    description: string,
    startISOString: string,
    endISOString: string
  ): Promise<{ success: boolean; eventId?: string; simulated?: boolean }> {
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    const serviceAccountKeyString = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!calendarId || !serviceAccountKeyString || serviceAccountKeyString.includes('your-')) {
      console.warn('[GoogleCalendarService] Credentials missing or placeholder. Simulating successful calendar sync.');
      return { success: true, eventId: `sim_event_${Date.now()}`, simulated: true };
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountKeyString);
      const clientEmail = serviceAccount.client_email;
      const privateKey = serviceAccount.private_key;

      if (!clientEmail || !privateKey) {
        throw new Error('Invalid Google service account JSON format');
      }

      const accessToken = await this.getAccessToken(clientEmail, privateKey);

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
      const body = {
        summary,
        description,
        start: {
          dateTime: startISOString,
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: endISOString,
          timeZone: 'Asia/Kolkata',
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Google Calendar Event API returned status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      console.log(`[GoogleCalendarService] Event created: ${data.htmlLink}`);
      return { success: true, eventId: data.id, simulated: false };
    } catch (err: any) {
      console.error('[GoogleCalendarService] Failed to create event:', err);
      // Fail gracefully returning simulated success to keep customer pipeline alive
      return { success: false, simulated: true };
    }
  }
}
