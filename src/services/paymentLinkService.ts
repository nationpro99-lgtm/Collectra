import { Invoice, SmartPaymentLink, BusinessSettings } from '../types';
import { storageService } from './storage';

export interface PaymentLinkCreationOptions {
  allowPartialPayments?: boolean;
  minPartialAmount?: number;
  expiresInDays?: number;
}

export interface PaymentOrderResult {
  success: boolean;
  orderId?: string;
  amount?: number;
  amountInPaise?: number;
  currency?: string;
  keyId?: string;
  isSandbox?: boolean;
  error?: string;
}

export interface PaymentVerificationPayload {
  token: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  amountPaid: number;
  paymentMethod?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  verified?: boolean;
  paymentId?: string;
  receiptNumber?: string;
  invoiceNumber?: string;
  invoiceId?: string;
  customerName?: string;
  amountPaid?: number;
  balanceRemaining?: number;
  status?: string;
  paidAt?: string;
  error?: string;
}

export interface PublicPaymentPageData {
  id: string;
  token: string;
  invoiceNumber: string;
  invoiceId: string;
  businessName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amount: number;
  balance: number;
  paidAmount: number;
  dueDate: string;
  status: 'active' | 'paid' | 'expired' | 'revoked';
  allowPartialPayments: boolean;
  minPartialAmount?: number;
  items: any[];
  expiresAt: string;
  currency: string;
  currencySymbol: string;
  razorpayKeyId: string;
  isLiveGateway: boolean;
}

export const paymentLinkService = {
  /**
   * Generates a secure, shareable Smart Payment Link for an invoice
   */
  async generatePaymentLink(
    invoice: Invoice,
    settings?: BusinessSettings,
    options?: PaymentLinkCreationOptions
  ): Promise<{ success: boolean; link?: SmartPaymentLink; paymentUrl?: string; error?: string }> {
    try {
      const state = storageService.getState();
      const bizSettings = settings || state.settings;
      const activeBizId = storageService.getActiveBusinessId() || 'biz-default';

      const allowPartial = options?.allowPartialPayments !== undefined 
        ? options.allowPartialPayments 
        : (invoice.allowPartialPayments !== undefined ? invoice.allowPartialPayments : (bizSettings?.allowPartialPayments ?? true));

      const minPartial = options?.minPartialAmount !== undefined
        ? options.minPartialAmount
        : (invoice.minPartialAmount !== undefined ? invoice.minPartialAmount : (bizSettings?.minPartialAmount ?? 500));

      const payload = {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        businessId: activeBizId,
        businessName: bizSettings?.businessName || 'CollectIQ Enterprise',
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        amount: invoice.amount,
        balance: invoice.balance !== undefined ? invoice.balance : invoice.amount,
        dueDate: invoice.dueDate,
        allowPartialPayments: allowPartial,
        minPartialAmount: minPartial,
        items: invoice.items || [],
        expiresInDays: options?.expiresInDays || 30,
      };

      const response = await fetch('/api/payments/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Failed to create payment link on server.',
        };
      }

      // Update invoice in local/Firestore storage with generated link
      storageService.updateInvoice(invoice.id, {
        paymentLinkId: data.link.id,
        paymentLinkUrl: data.paymentUrl,
        paymentLinkStatus: data.link.status,
        allowPartialPayments: allowPartial,
        minPartialAmount: minPartial,
      });

      storageService.addActivity({
        type: 'reminder_sent',
        title: `Payment link created: ${invoice.invoiceNumber}`,
        description: `Secure link generated for ₹${payload.balance.toLocaleString('en-IN')}`,
        customerName: invoice.customerName,
        iconType: 'check',
      });

      return {
        success: true,
        link: data.link,
        paymentUrl: data.paymentUrl,
      };
    } catch (err: any) {
      console.error('Error generating payment link:', err);
      return {
        success: false,
        error: err.message || 'Network error generating payment link.',
      };
    }
  },

  /**
   * Fetches public checkout info for a customer viewing /pay/:token
   */
  async getPaymentLinkByToken(token: string): Promise<{ success: boolean; data?: PublicPaymentPageData; error?: string }> {
    try {
      const response = await fetch(`/api/payments/link/${encodeURIComponent(token)}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          success: false,
          error: result.error || 'Payment link not found or invalid.',
        };
      }

      return {
        success: true,
        data: result.link,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Unable to connect to payment server.',
      };
    }
  },

  /**
   * Creates an order with Razorpay backend for a given token & payment amount
   */
  async createPaymentOrder(token: string, amount: number): Promise<PaymentOrderResult> {
    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, amount }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Failed to initialize payment gateway order.',
        };
      }

      return data;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network failure communicating with payment gateway.',
      };
    }
  },

  /**
   * Cryptographically verifies the gateway payment signature and settles invoice
   */
  async verifyPayment(payload: PaymentVerificationPayload): Promise<PaymentVerificationResult> {
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Payment verification failed.',
        };
      }

      return data;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network failure verifying payment transaction.',
      };
    }
  },

  /**
   * Revokes or expires an existing payment link
   */
  async revokePaymentLink(token: string, invoiceId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/payments/revoke-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, error: data.error || 'Failed to revoke link.' };
      }

      if (invoiceId) {
        storageService.updateInvoice(invoiceId, {
          paymentLinkStatus: 'revoked',
        });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Fetches gateway configuration details
   */
  async getGatewayConfig(): Promise<{
    gateway: string;
    configured: boolean;
    keyId: string;
    webhookConfigured: boolean;
    supportedMethods: string[];
  }> {
    try {
      const response = await fetch('/api/payments/config');
      return await response.json();
    } catch {
      return {
        gateway: 'Razorpay',
        configured: false,
        keyId: '',
        webhookConfigured: false,
        supportedMethods: ['UPI (GPay, PhonePe, Paytm, BHIM)', 'Cards', 'Net Banking'],
      };
    }
  },
};
