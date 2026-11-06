/**
 * Google Workspace Gmail API Client Service for CollectIQ
 * Uses official Client-Side OAuth Token Authentication via Firebase Auth.
 * Includes in-memory token caching (never stored in localStorage) and
 * explicit user confirmation for sending emails per Workspace Skill constitution.
 */

import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

export const GMAIL_SCOPES: string[] = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
];

// In-memory token cache (strictly in memory, never in localStorage/sessionStorage per constitution)
let cachedAccessToken: string | null = null;
let cachedGmailProfile: { emailAddress: string; messagesTotal: number } | null = null;

// Clear cached token automatically on sign out
if (auth) {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      cachedAccessToken = null;
      cachedGmailProfile = null;
    }
  });
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface SendGmailParams {
  to: string;
  subject: string;
  body: string;
  customerName?: string;
  invoiceNumber?: string;
  amountFormatted?: string;
}

export interface GmailSendResult {
  success: boolean;
  messageId?: string;
  threadId?: string;
  error?: string;
}

class GmailService {
  /**
   * Retrieves the current in-memory access token.
   */
  public getAccessToken(): string | null {
    return cachedAccessToken;
  }

  /**
   * Sets the in-memory access token.
   */
  public setAccessToken(token: string | null): void {
    cachedAccessToken = token;
  }

  /**
   * Checks whether Gmail is connected with an active in-memory token.
   */
  public isConnected(): boolean {
    return Boolean(cachedAccessToken);
  }

  /**
   * Triggers Google Sign-In with Gmail scopes to obtain an access token.
   */
  public async connectGmail(): Promise<{ success: boolean; email?: string; error?: string }> {
    try {
      if (!auth) {
        throw new Error('Firebase Auth is not initialized');
      }

      const provider = new GoogleAuthProvider();
      // Add all requested Workspace Gmail scopes
      GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));
      provider.setCustomParameters({
        prompt: 'consent',
        access_type: 'offline',
      });

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);

      if (!credential?.accessToken) {
        throw new Error('No OAuth access token was returned by Google authentication.');
      }

      cachedAccessToken = credential.accessToken;

      // Fetch user profile from Gmail API
      const profile = await this.getProfile();
      if (profile?.emailAddress) {
        cachedGmailProfile = {
          emailAddress: profile.emailAddress,
          messagesTotal: profile.messagesTotal,
        };
      }

      return {
        success: true,
        email: profile?.emailAddress || result.user.email || 'Connected',
      };
    } catch (err: any) {
      console.error('Failed to connect Gmail:', err);
      return {
        success: false,
        error: err.message || 'Failed to authorize Gmail account.',
      };
    }
  }

  /**
   * Disconnects the in-memory Gmail session.
   */
  public disconnectGmail(): void {
    cachedAccessToken = null;
    cachedGmailProfile = null;
  }

  /**
   * Retrieves the authenticated user's Gmail profile details.
   */
  public async getProfile(): Promise<GmailProfile | null> {
    if (!cachedAccessToken) {
      return null;
    }

    try {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          cachedAccessToken = null;
        }
        return null;
      }

      const profile: GmailProfile = await res.json();
      return profile;
    } catch (err) {
      console.warn('Error fetching Gmail profile:', err);
      return null;
    }
  }

  /**
   * Helper to encode RFC 2822 email message to base64url.
   */
  private makeRawEmail(to: string, from: string, subject: string, bodyText: string): string {
    const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

    // Convert plain body to HTML formatted paragraphs if not already HTML
    const formattedHtml = bodyText.includes('<p>') || bodyText.includes('<div>')
      ? bodyText
      : `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 12px;">
          <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="color: #4f46e5; margin: 0; font-size: 20px; font-weight: 800;">CollectIQ Billing Reminder</h2>
          </div>
          <div style="font-size: 14px; white-space: pre-wrap;">${bodyText}</div>
          <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
            Sent automatically via CollectIQ Smart Invoices • Secure Payment Collection
          </div>
        </div>
      `;

    const messageParts = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      btoa(unescape(encodeURIComponent(formattedHtml))),
    ];

    const rawMessage = messageParts.join('\r\n');

    // Convert base64 to base64url required by Gmail API
    return btoa(unescape(encodeURIComponent(rawMessage)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Sends an email on behalf of the authenticated user via Gmail API.
   * NOTE: The caller MUST ensure user confirmation was presented first.
   */
  public async sendEmail(params: SendGmailParams): Promise<GmailSendResult> {
    if (!cachedAccessToken) {
      return {
        success: false,
        error: 'Gmail is not connected. Please connect your Google Workspace account first.',
      };
    }

    try {
      // Get the authenticated sender email
      let senderEmail = cachedGmailProfile?.emailAddress;
      if (!senderEmail) {
        const profile = await this.getProfile();
        senderEmail = profile?.emailAddress || 'me';
      }

      const raw = this.makeRawEmail(params.to, senderEmail, params.subject, params.body);

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cachedAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        const errMsg = data.error?.message || 'Gmail API rejected the message dispatch.';
        return {
          success: false,
          error: errMsg,
        };
      }

      return {
        success: true,
        messageId: data.id,
        threadId: data.threadId,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to dispatch email via Gmail API.',
      };
    }
  }

  /**
   * Lists the user's latest messages or search results.
   */
  public async listMessages(query = '', maxResults = 10): Promise<any[]> {
    if (!cachedAccessToken) return [];

    try {
      const q = encodeURIComponent(query);
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${q}`,
        {
          headers: {
            Authorization: `Bearer ${cachedAccessToken}`,
            Accept: 'application/json',
          },
        }
      );

      if (!res.ok) return [];
      const data = await res.json();
      return data.messages || [];
    } catch {
      return [];
    }
  }
}

export const gmailService = new GmailService();
