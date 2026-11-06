/**
 * Meta WhatsApp Business Cloud API Integration Service for CollectIQ.
 * Handles template formatting, recipient normalization, direct API calls,
 * connection status verification, and error handling for official Meta Graph API v21.0.
 */

import { normalizeWhatsAppNumber } from '../utils/phone';

export type WhatsAppTemplateKey =
  | 'invoice_created'
  | 'payment_reminder'
  | 'overdue_payment'
  | 'payment_received'
  | 'promise_reminder'
  | 'hello_world';

export interface WhatsAppTemplateConfig {
  key: WhatsAppTemplateKey;
  displayName: string;
  metaTemplateName: string;
  languageCode: string;
  category: 'UTILITY' | 'MARKETING';
  description: string;
  bodyPreview: string;
  parameters: string[]; // required parameter names in sequential order
}

/**
 * Standard approved template definitions matching Meta WhatsApp Business guidelines.
 */
export const APPROVED_WHATSAPP_TEMPLATES: Record<WhatsAppTemplateKey, WhatsAppTemplateConfig> = {
  invoice_created: {
    key: 'invoice_created',
    displayName: 'Invoice Created',
    metaTemplateName: 'collectiq_invoice_created',
    languageCode: 'en_US',
    category: 'UTILITY',
    description: 'Notifies customer when a new invoice is generated with due date and balance.',
    bodyPreview: 'Hello {{1}}, your invoice {{2}} for {{3}} is ready. Payment is due on {{4}}. Thank you.',
    parameters: ['customerName', 'invoiceNumber', 'amount', 'dueDate'],
  },
  payment_reminder: {
    key: 'payment_reminder',
    displayName: 'Payment Reminder',
    metaTemplateName: 'collectiq_payment_reminder',
    languageCode: 'en_US',
    category: 'UTILITY',
    description: 'Friendly pre-due courtesy reminder with outstanding balance and maturity date.',
    bodyPreview: 'Hello {{1}}, this is a friendly reminder that invoice {{2}} has an outstanding balance of {{3}}. Please make your payment by {{4}}.',
    parameters: ['customerName', 'invoiceNumber', 'amount', 'dueDate'],
  },
  overdue_payment: {
    key: 'overdue_payment',
    displayName: 'Overdue Payment Notice',
    metaTemplateName: 'collectiq_overdue_payment',
    languageCode: 'en_US',
    category: 'UTILITY',
    description: 'Escalation notice for past-due balances with payment link.',
    bodyPreview: 'Hello {{1}}, invoice {{2}} for {{3}} is overdue. Please contact us if you need assistance with payment.',
    parameters: ['customerName', 'invoiceNumber', 'amount'],
  },
  payment_received: {
    key: 'payment_received',
    displayName: 'Payment Confirmation',
    metaTemplateName: 'collectiq_payment_received',
    languageCode: 'en_US',
    category: 'UTILITY',
    description: 'Instant remittance voucher and payment receipt acknowledgement.',
    bodyPreview: 'Hello {{1}}, we have received your payment of {{2}} for invoice {{3}}. Thank you!',
    parameters: ['customerName', 'amount', 'invoiceNumber'],
  },
  promise_reminder: {
    key: 'promise_reminder',
    displayName: 'Payment Promise Reminder',
    metaTemplateName: 'collectiq_promise_reminder',
    languageCode: 'en_US',
    category: 'UTILITY',
    description: 'Reminder for voluntary settlement commitments scheduled by the debtor.',
    bodyPreview: 'Hello {{1}}, this is a reminder of your promised payment of {{2}} scheduled for {{3}}.',
    parameters: ['customerName', 'amount', 'promisedDate'],
  },
  hello_world: {
    key: 'hello_world',
    displayName: 'Meta Test (Hello World)',
    metaTemplateName: 'hello_world',
    languageCode: 'en_US',
    category: 'UTILITY',
    description: 'Default pre-approved test template provided by Meta on all WhatsApp Cloud accounts.',
    bodyPreview: 'Hello World',
    parameters: [],
  },
};

export interface SendWhatsAppMessageParams {
  recipientPhone: string;
  templateKey?: WhatsAppTemplateKey;
  templateName?: string;
  languageCode?: string;
  parameters?: Record<string, string | number>;
  freeformText?: string;
  customerName?: string;
  invoiceNumber?: string;
  businessId?: string;
  credentials?: {
    phoneNumberId?: string;
    accessToken?: string;
    wabaId?: string;
  };
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  recipientPhone?: string;
  status?: 'sent' | 'delivered' | 'failed';
  error?: string;
  details?: any;
}

export interface WhatsAppConnectionInfo {
  success: boolean;
  configured: boolean;
  phoneNumberId?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  qualityRating?: string;
  wabaId?: string;
  error?: string;
}

class WhatsAppService {
  /**
   * Normalizes any input phone number (e.g. Indian +91, with spaces or local trunk)
   * into clean E.164 digits required by Meta API.
   */
  public normalizeNumber(phone: string) {
    return normalizeWhatsAppNumber(phone);
  }

  /**
   * Sends a real WhatsApp message through the secure backend proxy to Meta Cloud API.
   */
  public async sendMessage(params: SendWhatsAppMessageParams): Promise<WhatsAppSendResult> {
    const phoneCheck = this.normalizeNumber(params.recipientPhone);
    if (!phoneCheck.isValid) {
      return {
        success: false,
        error: phoneCheck.error || 'Invalid recipient phone number format.',
      };
    }

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          recipientPhone: phoneCheck.normalized,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Failed to dispatch WhatsApp message via Meta Cloud API.',
          details: data.details,
        };
      }

      return {
        success: true,
        messageId: data.messageId,
        recipientPhone: phoneCheck.normalized,
        status: data.status || 'sent',
        details: data.details,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error connecting to WhatsApp messaging service.',
      };
    }
  }

  /**
   * Tests connection with Meta Graph API and retrieves live business profile details.
   */
  public async testConnection(credentials?: { phoneNumberId?: string; accessToken?: string }): Promise<WhatsAppConnectionInfo> {
    try {
      const response = await fetch('/api/notifications/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'whatsapp',
          credentials,
        }),
      });

      const data = await response.json();
      return {
        success: data.success === true,
        configured: data.configured !== false,
        phoneNumberId: data.phoneNumberId,
        displayPhoneNumber: data.displayPhoneNumber,
        verifiedName: data.verifiedName,
        qualityRating: data.qualityRating,
        wabaId: data.wabaId,
        error: data.error,
      };
    } catch (err: any) {
      return {
        success: false,
        configured: false,
        error: err.message || 'Failed to ping Meta Graph API.',
      };
    }
  }

  /**
   * Dispatches a real test message to an authorized recipient phone number.
   */
  public async sendTestMessage(recipientPhone: string, credentials?: { phoneNumberId?: string; accessToken?: string }): Promise<WhatsAppSendResult> {
    const phoneCheck = this.normalizeNumber(recipientPhone);
    if (!phoneCheck.isValid) {
      return {
        success: false,
        error: phoneCheck.error || 'Invalid test recipient phone number.',
      };
    }

    try {
      const response = await fetch('/api/whatsapp/test-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: phoneCheck.normalized,
          credentials,
        }),
      });

      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to dispatch test WhatsApp message.',
      };
    }
  }
}

export const whatsappService = new WhatsAppService();
