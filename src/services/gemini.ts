import { AppState } from './storage';

export interface CollectionSummary {
  spokenSummary: string;
  bulletPoints: string[];
  priorityActions: {
    customerName: string;
    amount: number;
    recommendedAction: string;
    urgency: 'high' | 'medium' | 'low';
    channel: 'whatsapp' | 'email' | 'call';
  }[];
  recoveryRiskScore: number; // 0-100
  aiInsight: string;
}

export interface ReminderDraft {
  subject?: string;
  message: string;
  channel: 'whatsapp' | 'email' | 'sms';
  tone: 'gentle' | 'standard' | 'firm' | 'urgent';
}

class GeminiAIService {
  /**
   * Generates a spoken overview and collection intelligence summary
   */
  public async generateCollectionSummary(state: AppState): Promise<CollectionSummary> {
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) return data.summary;
      }
    } catch {
      // Fallback to local intelligent analysis
    }

    return this.getLocalSummary(state);
  }

  /**
   * Generates a payment reminder tailored to tone, channel, customer and overdue days
   */
  public async generateReminder(params: {
    customerName: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    overdueDays?: number;
    channel: 'whatsapp' | 'email' | 'sms';
    tone: 'gentle' | 'standard' | 'firm' | 'urgent';
    currencySymbol: string;
  }): Promise<ReminderDraft> {
    try {
      const res = await fetch('/api/ai/generate-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.draft) return data.draft;
      }
    } catch {
      // Fallback to deterministic high-quality templates
    }

    return this.getLocalReminderDraft(params);
  }

  /**
   * Interactive Q&A chat with AI Collection Advisor
   */
  public async askAdvisor(prompt: string, state: AppState): Promise<string> {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, state }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) return data.reply;
      }
    } catch {
      // Fallback
    }

    return this.getLocalAdvisorAnswer(prompt, state);
  }

  // --- Local intelligent heuristic fallback ---
  private getLocalSummary(state: AppState): CollectionSummary {
    const today = new Date().toISOString().split('T')[0];
    const overdueInvoices = state.invoices.filter(
      (i) => i.status === 'overdue' || (i.dueDate < today && i.balance > 0)
    );
    const overdueTotal = overdueInvoices.reduce((sum, i) => sum + i.balance, 0);
    const totalOutstanding = state.invoices.reduce(
      (sum, i) => sum + (i.status !== 'paid' ? i.balance : 0),
      0
    );
    const totalCollected = state.payments.reduce((sum, p) => sum + p.amount, 0);
    const totalBilled = state.invoices.reduce((sum, i) => sum + i.amount, 0);
    const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;
    const currency = state.settings.currencySymbol || '₹';

    if (state.invoices.length === 0) {
      return {
        spokenSummary:
          'Welcome to CollectIQ. Your collections ledger is clean with no invoices recorded yet. Start by creating an invoice or adding customer debtors.',
        bulletPoints: [
          'No invoices yet. Create your first invoice to get started.',
          'Add customer accounts to begin tracking collection schedules.',
          'Automated reminder workflows will activate once invoices are generated.',
        ],
        priorityActions: [],
        recoveryRiskScore: 0,
        aiInsight:
          'Automated reminders dispatched across WhatsApp and Email help reduce payment delays by up to 40%.',
      };
    }

    const spoken = `Good day. You have ${overdueInvoices.length} overdue invoices worth ${currency}${overdueTotal.toLocaleString('en-IN')}, with total outstanding at ${currency}${totalOutstanding.toLocaleString('en-IN')}. Your collection rate is currently ${collectionRate} percent.`;

    const priorities = overdueInvoices.slice(0, 4).map((inv) => ({
      customerName: inv.customerName,
      amount: inv.balance,
      recommendedAction: `Escalate payment follow-up for invoice ${inv.invoiceNumber}; balance is overdue.`,
      urgency: 'high' as const,
      channel: 'whatsapp' as const,
    }));

    return {
      spokenSummary: spoken,
      bulletPoints: [
        `${overdueInvoices.length} invoices totaling ${currency}${overdueTotal.toLocaleString('en-IN')} require follow-up.`,
        `Current collection efficiency rate is ${collectionRate}%.`,
        `${state.promisesToPay.filter((p) => p.status === 'pending').length} active Promises to Pay are currently recorded.`,
      ],
      priorityActions: priorities,
      recoveryRiskScore: overdueInvoices.length > 3 ? 35 : 10,
      aiInsight:
        'Accounts over 30 days past due have a 40% drop in voluntary settlement. Sending WhatsApp reminders with direct UPI payment links yields a higher same-day response rate.',
    };
  }

  private getLocalReminderDraft(params: {
    customerName: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    overdueDays?: number;
    channel: 'whatsapp' | 'email' | 'sms';
    tone: 'gentle' | 'standard' | 'firm' | 'urgent';
    currencySymbol: string;
  }): ReminderDraft {
    const { customerName, invoiceNumber, amount, dueDate, overdueDays = 0, channel, tone, currencySymbol } = params;
    const formattedAmt = `${currencySymbol}${amount.toLocaleString('en-IN')}`;

    if (channel === 'whatsapp') {
      if (tone === 'gentle') {
        return {
          channel: 'whatsapp',
          tone: 'gentle',
          message: `Hi ${customerName} team! 👋 Hope you're having a productive week.\n\nThis is a gentle reminder regarding invoice *${invoiceNumber}* for *${formattedAmt}*, which is due on *${dueDate}*.\n\nYou can pay quickly via UPI or Bank Transfer using this direct link: https://pay.collectiq.io/i/${invoiceNumber}\n\nLet us know if you need any assistance or another copy of the invoice. Thank you! 🙏`,
        };
      }
      if (tone === 'firm') {
        return {
          channel: 'whatsapp',
          tone: 'firm',
          message: `URGENT: Payment Notice for ${customerName}.\n\nInvoice *${invoiceNumber}* for *${formattedAmt}* is now *${overdueDays || 30} days overdue* (Due date: ${dueDate}).\n\nPlease arrange remittance today to prevent temporary account holds on future orders:\n👉 Immediate Payment: https://pay.collectiq.io/i/${invoiceNumber}\n\nKindly share the transaction UTR once processed. Regards, Accounts Department.`,
        };
      }
      if (tone === 'urgent') {
        return {
          channel: 'whatsapp',
          tone: 'urgent',
          message: `🚨 FINAL PAYMENT DEMAND — ${customerName}.\n\nInvoice *${invoiceNumber}* (*${formattedAmt}*) remains unpaid despite previous notices and is *${overdueDays || 45} days past due*.\n\nFailure to settle within 24 hours will escalate this ledger balance to recovery:\nPay Now: https://pay.collectiq.io/i/${invoiceNumber}\n\nContact accounts immediately.`,
        };
      }
      // Standard
      return {
        channel: 'whatsapp',
        tone: 'standard',
        message: `Hello ${customerName} Accounts Team,\n\nThis is a reminder regarding outstanding invoice *${invoiceNumber}* for *${formattedAmt}* due on *${dueDate}*.\n\nPlease process payment at your earliest convenience:\n💳 Pay Online: https://pay.collectiq.io/i/${invoiceNumber}\n\nIf payment has already been initiated, please share the transaction reference. Thank you!`,
      };
    }

    if (channel === 'email') {
      if (tone === 'gentle') {
        return {
          channel: 'email',
          tone: 'gentle',
          subject: `Courtesy Reminder: Invoice ${invoiceNumber}`,
          message: `Dear ${customerName} Accounts Team,\n\nWe hope this email finds you well.\n\nWe would like to remind you that invoice ${invoiceNumber} for the amount of ${formattedAmt} is scheduled for payment on ${dueDate}.\n\nA copy of the invoice is attached for your review. You can also settle this invoice instantly via our secure payment portal:\nhttps://pay.collectiq.io/i/${invoiceNumber}\n\nIf you have any questions or require updated documentation, please reply directly to this email.\n\nWarm regards,\nFinance & Accounts Team\nCollectIQ Enterprise`,
        };
      }
      if (tone === 'firm' || tone === 'urgent') {
        return {
          channel: 'email',
          tone,
          subject: `OVERDUE NOTICE (${overdueDays || 30} Days): Invoice ${invoiceNumber} - ${formattedAmt}`,
          message: `Dear Accounts Head,\n\nOur records show that invoice ${invoiceNumber} amounting to ${formattedAmt} was due on ${dueDate} and is now overdue by ${overdueDays || 30} days.\n\nDespite previous reminders, we have not yet received payment or confirmation of transfer. Continued delays may affect current services and credit terms.\n\nPlease initiate payment immediately using the payment portal:\nhttps://pay.collectiq.io/i/${invoiceNumber}\n\nPlease provide the UTR / wire confirmation by return email.\n\nSincerely,\nAccounts Receivable Team\nCollectIQ`,
        };
      }
      return {
        channel: 'email',
        tone: 'standard',
        subject: `Payment Reminder: Invoice ${invoiceNumber} (${formattedAmt})`,
        message: `Dear ${customerName} Accounts Team,\n\nThis is a friendly reminder that invoice ${invoiceNumber} in the amount of ${formattedAmt} was due on ${dueDate}.\n\nPlease find the invoice attached. You may pay electronically via:\nhttps://pay.collectiq.io/i/${invoiceNumber}\n\nThank you for your prompt attention to this matter.\n\nBest regards,\nAccounts Receivable Team\nCollectIQ`,
      };
    }

    // SMS
    return {
      channel: 'sms',
      tone,
      message: `CollectIQ Alert: Invoice ${invoiceNumber} for ${formattedAmt} for ${customerName} is due. Settle securely at https://pay.collectiq.io/i/${invoiceNumber}`,
    };
  }

  private getLocalAdvisorAnswer(prompt: string, state: AppState): string {
    const p = prompt.toLowerCase();
    const today = new Date().toISOString().split('T')[0];
    const curr = state.settings.currencySymbol || '₹';
    const overdueInvoices = state.invoices.filter(
      (i) => i.status === 'overdue' || (i.dueDate < today && i.balance > 0)
    );
    const overdueTotal = overdueInvoices.reduce((s, i) => s + i.balance, 0);
    const totalCollected = state.payments.reduce((s, p) => s + p.amount, 0);
    const totalBilled = state.invoices.reduce((s, i) => s + i.amount, 0);
    const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;
    const totalOutstanding = state.invoices.reduce(
      (s, i) => s + (i.status !== 'paid' ? i.balance : 0),
      0
    );

    if (state.invoices.length === 0) {
      return 'Your CollectIQ ledger is currently empty. Create invoices and add customers to begin receiving automated collection intelligence.';
    }

    if (p.includes('overdue') || p.includes('who owes')) {
      if (overdueInvoices.length === 0) {
        return 'Great news! You currently have zero overdue invoices in your ledger.';
      }
      const topList = overdueInvoices
        .slice(0, 3)
        .map((inv, idx) => `${idx + 1}. ${inv.customerName}: ${curr}${inv.balance.toLocaleString('en-IN')}`)
        .join('\n');
      return `You have ${overdueInvoices.length} overdue invoices totaling ${curr}${overdueTotal.toLocaleString('en-IN')}. Top overdue accounts:\n${topList}\nI recommend sending a reminder via WhatsApp or Email.`;
    }

    if (p.includes('collection rate') || p.includes('target') || p.includes('performance')) {
      return `Your collection rate is currently ${collectionRate}%. Total collected is ${curr}${totalCollected.toLocaleString('en-IN')} out of ${curr}${totalBilled.toLocaleString('en-IN')} total billed.`;
    }

    if (p.includes('promise') || p.includes('ptp')) {
      const ptps = state.promisesToPay;
      if (ptps.length === 0) {
        return 'No payment commitments (promises to pay) have been recorded yet.';
      }
      const summary = ptps
        .slice(0, 3)
        .map((ptp) => `• ${ptp.customerName}: ${curr}${ptp.promisedAmount.toLocaleString('en-IN')} (${ptp.status})`)
        .join('\n');
      return `There are currently ${ptps.length} tracked Promises to Pay:\n${summary}`;
    }

    if (p.includes('recommend') || p.includes('priorit') || p.includes('what should i do')) {
      if (overdueInvoices.length === 0) {
        return 'All invoices are currently up to date! Continue to monitor upcoming maturities and maintain communication with key debtors.';
      }
      const topRecs = overdueInvoices
        .slice(0, 3)
        .map(
          (inv, idx) =>
            `${idx + 1}. Escalate ${inv.customerName} for invoice ${inv.invoiceNumber} (${curr}${inv.balance.toLocaleString('en-IN')}).`
        )
        .join('\n');
      return `Here are your recommended collection priorities today:\n${topRecs}`;
    }

    return `Based on your live CollectIQ ledger with ${state.invoices.length} invoices: Total outstanding is ${curr}${totalOutstanding.toLocaleString('en-IN')} and total collected is ${curr}${totalCollected.toLocaleString('en-IN')}. Would you like me to generate tailored reminders, review customer accounts, or schedule automated follow-ups?`;
  }
}

export const geminiAIService = new GeminiAIService();
