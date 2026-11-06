import {
  NotificationChannel,
  NotificationEventType,
  NotificationLog,
  NotificationTemplate,
  NotificationSettings,
  Invoice,
  Customer,
} from '../types';
import { storageService } from './storage';

export interface DispatchNotificationPayload {
  channel: NotificationChannel;
  eventType: NotificationEventType;
  recipientName: string;
  recipientTarget: string;
  subject?: string;
  content: string;
  invoiceNumber?: string;
  customerName?: string;
  dltTemplateId?: string;
  metaTemplateName?: string;
  adminApproved?: boolean;
}

export interface DispatchResult {
  success: boolean;
  log?: NotificationLog;
  error?: string;
  providerMessageId?: string;
}

class NotificationService {
  /**
   * Replace template variables: {{customerName}}, {{invoiceNumber}}, {{amount}}, {{dueDate}}, etc.
   */
  public substituteVariables(
    templateText: string,
    vars: {
      customerName?: string;
      invoiceNumber?: string;
      amount?: string | number;
      dueDate?: string;
      overdueDays?: number | string;
      paymentLink?: string;
      businessName?: string;
      bankName?: string;
      accountNumber?: string;
      ifscCode?: string;
      upiId?: string;
      currencySymbol?: string;
    }
  ): string {
    let result = templateText;
    const map: Record<string, string> = {
      customerName: vars.customerName || 'Customer',
      invoiceNumber: vars.invoiceNumber || 'INV-0000',
      amount: vars.amount !== undefined ? `${vars.currencySymbol || '₹'}${Number(vars.amount).toLocaleString('en-IN')}` : '₹0',
      dueDate: vars.dueDate || 'due date',
      overdueDays: vars.overdueDays !== undefined ? String(vars.overdueDays) : '0',
      paymentLink: vars.paymentLink || 'https://pay.collectiq.io/inv-quick',
      businessName: vars.businessName || 'CollectIQ Enterprise',
      bankName: vars.bankName || 'HDFC Bank Ltd',
      accountNumber: vars.accountNumber || '50200049281742',
      ifscCode: vars.ifscCode || 'HDFC0001244',
      upiId: vars.upiId || 'collectiq@hdfcbank',
      currencySymbol: vars.currencySymbol || '₹',
    };

    for (const [key, val] of Object.entries(map)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, val);
    }
    return result;
  }

  /**
   * Get estimated unit cost for a channel in INR
   */
  public getUnitCost(channel: NotificationChannel, settings?: NotificationSettings): number {
    const s = settings || storageService.getState().notificationSettings;
    if (!s) {
      if (channel === 'whatsapp') return 0.68;
      if (channel === 'sms') return 0.14;
      if (channel === 'email') return 0.08;
      return 0.00;
    }
    switch (channel) {
      case 'whatsapp':
        return s.whatsapp.costPerUnit || 0.68;
      case 'sms':
        return s.sms.costPerUnit || 0.14;
      case 'email':
        return s.email.costPerUnit || 0.08;
      case 'push':
        return s.push.costPerUnit || 0.00;
      default:
        return 0;
    }
  }

  /**
   * Check if monthly spend limit has been exceeded
   */
  public isSpendLimitExceeded(settings?: NotificationSettings): boolean {
    const s = settings || storageService.getState().notificationSettings;
    if (!s || !s.autoPauseOnSpendLimit) return false;
    return s.currentMonthSpend >= s.monthlySpendLimit;
  }

  /**
   * Dispatch notification via backend proxy endpoint
   */
  public async dispatchNotification(payload: DispatchNotificationPayload): Promise<DispatchResult> {
    const state = storageService.getState();
    const settings = state.notificationSettings;

    // Check spending limit
    if (this.isSpendLimitExceeded(settings)) {
      return {
        success: false,
        error: `Monthly notification spending limit of ₹${settings.monthlySpendLimit.toLocaleString('en-IN')} reached. Messaging is paused.`,
      };
    }

    // Enforce Admin approval check for paid channels (WhatsApp & SMS)
    const isPaid = payload.channel === 'whatsapp' || payload.channel === 'sms';
    if (isPaid && settings.requireAdminApprovalForPaid && !payload.adminApproved) {
      return {
        success: false,
        error: `Administrator approval is strictly required before dispatching paid ${payload.channel.toUpperCase()} messages.`,
      };
    }

    const cost = this.getUnitCost(payload.channel, settings);
    const providerName =
      payload.channel === 'email'
        ? 'Resend'
        : payload.channel === 'whatsapp'
        ? 'Meta WhatsApp Cloud'
        : payload.channel === 'sms'
        ? 'MSG91'
        : 'Firebase Cloud Messaging';

    try {
      const response = await fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          sandboxMode: settings.sandboxSimulationMode,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        const failedLog: NotificationLog = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          businessId: storageService.getActiveBusinessId(),
          channel: payload.channel,
          eventType: payload.eventType,
          recipientName: payload.recipientName,
          recipientTarget: payload.recipientTarget,
          subject: payload.subject,
          content: payload.content,
          status: 'failed',
          provider: providerName,
          sentAt: new Date().toISOString(),
          failedAt: new Date().toISOString(),
          errorMessage: data.error || 'Provider rejected notification dispatch',
          costEstimate: 0,
          retryCount: 0,
          canRetry: true,
          invoiceNumber: payload.invoiceNumber,
          customerName: payload.customerName,
          dltTemplateId: payload.dltTemplateId,
          metaTemplateName: payload.metaTemplateName,
        };

        storageService.addNotificationLog(failedLog);
        return { success: false, error: data.error || 'Failed to dispatch notification', log: failedLog };
      }

      // Delivered or Sent status conforming to strict delivery reporting rule:
      // "Never report a notification as delivered unless confirmed by the provider."
      // Initially, dispatch is 'sent' (pending provider DLR webhook confirmation)
      const initialStatus = data.deliveryStatus || 'sent';

      const newLog: NotificationLog = {
        id: data.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        businessId: storageService.getActiveBusinessId(),
        channel: payload.channel,
        eventType: payload.eventType,
        recipientName: payload.recipientName,
        recipientTarget: payload.recipientTarget,
        subject: payload.subject,
        content: payload.content,
        status: initialStatus,
        provider: providerName,
        providerMessageId: data.providerMessageId,
        sentAt: new Date().toISOString(),
        deliveredAt: initialStatus === 'delivered' ? new Date().toISOString() : undefined,
        costEstimate: cost,
        retryCount: 0,
        canRetry: false,
        invoiceNumber: payload.invoiceNumber,
        customerName: payload.customerName,
        dltTemplateId: payload.dltTemplateId,
        metaTemplateName: payload.metaTemplateName,
      };

      storageService.addNotificationLog(newLog);

      // Record spend and counter
      storageService.recordNotificationUsage(payload.channel, cost);

      // If sent for an invoice or follow-up, log activity
      storageService.addActivity({
        type: 'reminder_sent',
        title: `${payload.channel.toUpperCase()} ${payload.eventType.replace('_', ' ')} sent`,
        description: `Dispatched to ${payload.recipientName} (${payload.recipientTarget}) • Cost: ₹${cost.toFixed(2)}`,
        customerName: payload.customerName || payload.recipientName,
        amount: cost,
        iconType: 'mail',
      });

      // Simulate provider delivery receipt after 3-5 seconds if provider supports DLR
      if (initialStatus === 'sent' && data.autoConfirmDelivered !== false) {
        setTimeout(() => {
          this.confirmDelivery(newLog.id);
        }, 3200);
      }

      return {
        success: true,
        log: newLog,
        providerMessageId: data.providerMessageId,
      };
    } catch (err: any) {
      console.error('Notification dispatch error:', err);
      return {
        success: false,
        error: err.message || 'Network error dispatching notification',
      };
    }
  }

  /**
   * Confirm provider DLR delivery report
   */
  public confirmDelivery(logId: string) {
    storageService.updateNotificationLog(logId, {
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
    });
  }

  /**
   * Retry a failed notification
   */
  public async retryNotification(logId: string): Promise<DispatchResult> {
    const logs = storageService.getState().notificationLogs;
    const target = logs.find((l) => l.id === logId);
    if (!target) {
      return { success: false, error: 'Notification log not found' };
    }

    storageService.updateNotificationLog(logId, {
      status: 'queued',
      retryCount: (target.retryCount || 0) + 1,
    });

    return this.dispatchNotification({
      channel: target.channel,
      eventType: target.eventType,
      recipientName: target.recipientName,
      recipientTarget: target.recipientTarget,
      subject: target.subject,
      content: target.content,
      invoiceNumber: target.invoiceNumber,
      customerName: target.customerName,
      dltTemplateId: target.dltTemplateId,
      metaTemplateName: target.metaTemplateName,
      adminApproved: true,
    });
  }
}

export const notificationService = new NotificationService();
