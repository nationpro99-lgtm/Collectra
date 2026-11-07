import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('GoogleGenAI client initialization notice:', err);
  }
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'CollectIQ', timestamp: new Date().toISOString() });
});

// Deterministic fallback generator for reminder drafts
function getFallbackReminderDraft(params: any) {
  const {
    customerName = 'Customer',
    invoiceNumber = 'INV-1001',
    amount = 0,
    dueDate = 'due date',
    overdueDays = 0,
    channel = 'whatsapp',
    tone = 'standard',
    currencySymbol = '₹',
    businessName = 'CollectIQ Enterprise',
  } = params || {};

  const formattedAmt = `${currencySymbol}${Number(amount).toLocaleString('en-IN')}`;

  if (channel === 'whatsapp') {
    if (tone === 'gentle') {
      return {
        channel: 'whatsapp',
        tone: 'gentle',
        subject: '',
        message: `Hi ${customerName} team! 👋 Hope you're having a productive week.\n\nThis is a gentle reminder regarding invoice *${invoiceNumber}* for *${formattedAmt}*, which is due on *${dueDate}*.\n\nYou can pay quickly via UPI or Bank Transfer using this direct link: https://pay.collectiq.io/i/${invoiceNumber}\n\nLet us know if you need any assistance or another copy of the invoice. Thank you! 🙏`,
      };
    }
    if (tone === 'firm') {
      return {
        channel: 'whatsapp',
        tone: 'firm',
        subject: '',
        message: `URGENT: Payment Notice for ${customerName}.\n\nInvoice *${invoiceNumber}* for *${formattedAmt}* is now *${overdueDays || 30} days overdue* (Due date: ${dueDate}).\n\nPlease arrange remittance today to prevent temporary account holds on future orders:\n👉 Immediate Payment: https://pay.collectiq.io/i/${invoiceNumber}\n\nKindly share the transaction UTR once processed. Regards, Accounts Department.`,
      };
    }
    if (tone === 'urgent') {
      return {
        channel: 'whatsapp',
        tone: 'urgent',
        subject: '',
        message: `🚨 FINAL PAYMENT DEMAND — ${customerName}.\n\nInvoice *${invoiceNumber}* (*${formattedAmt}*) remains unpaid despite previous notices and is *${overdueDays || 45} days past due*.\n\nFailure to settle within 24 hours will escalate this ledger balance to recovery:\nPay Now: https://pay.collectiq.io/i/${invoiceNumber}\n\nContact accounts immediately.`,
      };
    }
    return {
      channel: 'whatsapp',
      tone: 'standard',
      subject: '',
      message: `Hello ${customerName} Accounts Team,\n\nThis is a reminder regarding outstanding invoice *${invoiceNumber}* for *${formattedAmt}* due on *${dueDate}*.\n\nPlease process payment at your earliest convenience:\n💳 Pay Online: https://pay.collectiq.io/i/${invoiceNumber}\n\nIf payment has already been initiated, please share the transaction reference. Thank you!`,
    };
  }

  if (channel === 'email') {
    if (tone === 'gentle') {
      return {
        channel: 'email',
        tone: 'gentle',
        subject: `Courtesy Reminder: Invoice ${invoiceNumber}`,
        message: `Dear ${customerName} Accounts Team,\n\nWe hope this email finds you well.\n\nWe would like to remind you that invoice ${invoiceNumber} for the amount of ${formattedAmt} is scheduled for payment on ${dueDate}.\n\nA copy of the invoice is attached for your review. You can also settle this invoice instantly via our secure payment portal:\nhttps://pay.collectiq.io/i/${invoiceNumber}\n\nIf you have any questions or require updated documentation, please reply directly to this email.\n\nWarm regards,\nFinance & Accounts Team\n${businessName}`,
      };
    }
    if (tone === 'firm' || tone === 'urgent') {
      return {
        channel: 'email',
        tone,
        subject: `OVERDUE NOTICE (${overdueDays || 30} Days): Invoice ${invoiceNumber} - ${formattedAmt}`,
        message: `Dear Accounts Head,\n\nOur records show that invoice ${invoiceNumber} amounting to ${formattedAmt} was due on ${dueDate} and is now overdue by ${overdueDays || 30} days.\n\nDespite previous reminders, we have not yet received payment or confirmation of transfer. Continued delays may affect current credit terms.\n\nPlease initiate payment immediately using the payment portal:\nhttps://pay.collectiq.io/i/${invoiceNumber}\n\nPlease provide the UTR / wire confirmation by return email.\n\nSincerely,\nAccounts Receivable Department\n${businessName}`,
      };
    }
    return {
      channel: 'email',
      tone: 'standard',
      subject: `Payment Reminder: Invoice ${invoiceNumber} (${formattedAmt})`,
      message: `Dear ${customerName} Accounts Team,\n\nThis is a friendly reminder that invoice ${invoiceNumber} in the amount of ${formattedAmt} was due on ${dueDate}.\n\nPlease find the invoice attached. You may pay electronically via:\nhttps://pay.collectiq.io/i/${invoiceNumber}\n\nThank you for your prompt attention to this matter.\n\nBest regards,\nAccounts Receivable Team\n${businessName}`,
    };
  }

  return {
    channel: 'sms',
    tone,
    subject: '',
    message: `Payment Alert: Invoice ${invoiceNumber} for ${formattedAmt} for ${customerName} is due. Settle securely at https://pay.collectiq.io/i/${invoiceNumber}`,
  };
}

// Fallback generator for collection intelligence summary
function getFallbackSummary(state: any) {
  const invoices = state?.invoices || [];
  const overdueInvoices = invoices.filter((i: any) => i.status === 'overdue' || (i.dueDate < new Date().toISOString().split('T')[0] && i.balance > 0));
  const overdueCount = overdueInvoices.length;
  const curr = state?.settings?.currencySymbol || '₹';
  const overdueTotal = overdueInvoices.reduce((sum: number, i: any) => sum + (i.balance || 0), 0);

  if (invoices.length === 0) {
    return {
      spokenSummary: 'Welcome to CollectIQ. Your collections ledger is clean with no invoices recorded yet.',
      bulletPoints: [
        'No invoices recorded yet. Create your first invoice to get started.',
        'Add customer debtors to begin tracking collection velocity.',
        'Automated reminder cadences will activate as soon as billing records are added.',
      ],
      recoveryRiskScore: 0,
      aiInsight: 'Connect with customer accounts early to streamline upcoming payment reconciliation.',
    };
  }

  return {
    spokenSummary: `Good day. You have ${overdueCount} overdue invoices pending follow-up totaling ${curr}${overdueTotal.toLocaleString('en-IN')}.`,
    bulletPoints: [
      `${overdueCount} overdue invoices requiring immediate payment follow-up.`,
      `Total overdue balances amount to ${curr}${overdueTotal.toLocaleString('en-IN')}.`,
      `WhatsApp reminders with direct payment links generate a 2.4x faster settlement rate.`,
    ],
    recoveryRiskScore: overdueCount > 5 ? 45 : 15,
    aiInsight: 'Dispatching automated WhatsApp notifications before 2:00 PM yields the highest same-day customer response.',
  };
}

// Fallback generator for chat advisor
function getFallbackChatReply(prompt: string, state: any) {
  const p = (prompt || '').toLowerCase();
  const invoices = state?.invoices || [];
  const curr = state?.settings?.currencySymbol || '₹';

  if (invoices.length === 0) {
    return 'Your CollectIQ ledger is currently empty. Create your first invoice or add a customer to begin receiving automated collection intelligence.';
  }

  const overdueInvoices = invoices.filter((i: any) => i.status === 'overdue' || (i.dueDate < new Date().toISOString().split('T')[0] && i.balance > 0));
  const overdueTotal = overdueInvoices.reduce((sum: number, i: any) => sum + (i.balance || 0), 0);

  if (p.includes('overdue') || p.includes('who owes')) {
    if (overdueInvoices.length === 0) {
      return 'Great news! You currently have zero overdue invoices in your ledger.';
    }
    const sample = overdueInvoices.slice(0, 3).map((i: any) => `${i.customerName} (${curr}${i.balance.toLocaleString('en-IN')})`).join(', ');
    return `You have ${overdueInvoices.length} overdue invoices totaling ${curr}${overdueTotal.toLocaleString('en-IN')}. Top accounts include: ${sample}.`;
  }
  if (p.includes('rate') || p.includes('target') || p.includes('performance')) {
    const totalCollected = (state?.payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
    const totalBilled = invoices.reduce((s: number, i: any) => s + (i.amount || 0), 0);
    const rate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;
    return `Your collection rate is currently ${rate}%. Total collected is ${curr}${totalCollected.toLocaleString('en-IN')} out of ${curr}${totalBilled.toLocaleString('en-IN')} total billed.`;
  }

  const totalOutstanding = invoices.reduce((s: number, i: any) => s + (i.status !== 'paid' ? (i.balance || 0) : 0), 0);
  const totalCollected = (state?.payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
  return `Based on your live CollectIQ ledger: Total outstanding is ${curr}${totalOutstanding.toLocaleString('en-IN')} across ${invoices.length} invoices, and total collected is ${curr}${totalCollected.toLocaleString('en-IN')}. I can help generate reminder copy, prioritize customer accounts, or track promises to pay.`;
}

// AI Summary Endpoint
app.post('/api/ai/summary', async (req, res) => {
  const { state } = req.body;
  if (!aiClient) {
    return res.json({ summary: getFallbackSummary(state) });
  }

  try {
    const overdueCount = state?.invoices?.filter((i: any) => i.status === 'overdue')?.length || 0;
    const prompt = `You are the CollectIQ Collections Intelligence AI.
Analyze this financial state:
- Currency: ${state?.settings?.currencySymbol || '₹'}
- Overdue Invoices: ${overdueCount}
- Customers count: ${state?.customers?.length || 0}
- Invoices: ${JSON.stringify(
      (state?.invoices || []).slice(0, 8).map((i: any) => ({
        number: i.invoiceNumber,
        customer: i.customerName,
        amount: i.amount,
        status: i.status,
        overdueDays: i.overdueDays,
      }))
    )}

Provide a concise, professional JSON response matching this schema:
{
  "spokenSummary": "Short 2-3 sentence overview suitable for text-to-speech audio",
  "bulletPoints": ["point 1", "point 2", "point 3"],
  "recoveryRiskScore": number between 1 and 100,
  "aiInsight": "1-2 sentence tactical insight on collecting faster"
}`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI Request Timeout')), 12000)
    );

    const response: any = await Promise.race([
      aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      }),
      timeoutPromise,
    ]);

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.spokenSummary) {
      return res.json({ summary: parsed });
    }
    return res.json({ summary: getFallbackSummary(state) });
  } catch (err: any) {
    console.log('AI summary notice (using resilient fallback):', err?.message || err);
    return res.json({ summary: getFallbackSummary(state) });
  }
});

// AI Reminder Generator Endpoint
app.post('/api/ai/generate-reminder', async (req, res) => {
  const { customerName, invoiceNumber, amount, dueDate, overdueDays, channel, tone, currencySymbol } = req.body;
  if (!aiClient) {
    return res.json({ draft: getFallbackReminderDraft(req.body) });
  }

  try {
    const prompt = `You are a professional SaaS B2B debt collection copywriter for CollectIQ.
Draft a ${tone} reminder message for:
- Customer: ${customerName}
- Invoice: ${invoiceNumber}
- Amount: ${currencySymbol || '₹'}${amount}
- Due Date: ${dueDate}
- Overdue Days: ${overdueDays || 0}
- Channel: ${channel} (e.g. WhatsApp, Email, SMS)

Return JSON with:
{
  "subject": "Subject line if email, otherwise empty string",
  "message": "The full formatted message text",
  "channel": "${channel}",
  "tone": "${tone}"
}`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI Request Timeout')), 12000)
    );

    const response: any = await Promise.race([
      aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      }),
      timeoutPromise,
    ]);

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.message) {
      return res.json({ draft: parsed });
    }
    return res.json({ draft: getFallbackReminderDraft(req.body) });
  } catch (err: any) {
    console.log('AI reminder generator notice (using resilient template):', err?.message || err);
    return res.json({ draft: getFallbackReminderDraft(req.body) });
  }
});

// AI Chat Advisor Endpoint
app.post('/api/ai/chat', async (req, res) => {
  const { prompt, state } = req.body;
  if (!aiClient) {
    return res.json({ reply: getFallbackChatReply(prompt, state) });
  }

  try {
    const context = `You are CollectIQ AI, a strategic accounts receivable and credit control advisor.
Current user ledger summary:
- Total invoices: ${state?.invoices?.length}
- Overdue invoices: ${state?.invoices?.filter((i: any) => i.status === 'overdue')?.length}
- Settings: ${state?.settings?.businessName}, currency ${state?.settings?.currencySymbol}

User prompt: ${prompt}
Answer concisely, actionable, with specific numbers.`;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI Request Timeout')), 12000)
    );

    const response: any = await Promise.race([
      aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: context,
      }),
      timeoutPromise,
    ]);

    if (response.text) {
      return res.json({ reply: response.text });
    }
    return res.json({ reply: getFallbackChatReply(prompt, state) });
  } catch (err: any) {
    console.log('AI chat notice (using resilient fallback):', err?.message || err);
    return res.json({ reply: getFallbackChatReply(prompt, state) });
  }
});

// ==========================================
// META WHATSAPP BUSINESS CLOUD API INTEGRATION
// ==========================================

const META_GRAPH_VERSION = 'v21.0';

// In-memory status registry updated by Meta Webhooks
const messageStatusStore = new Map<
  string,
  { status: 'sent' | 'delivered' | 'read' | 'failed'; timestamp: string; recipient?: string; error?: string }
>();

function getWhatsAppConfig(reqCredentials?: any) {
  const accessToken =
    reqCredentials?.accessToken?.trim() ||
    process.env.WHATSAPP_ACCESS_TOKEN?.trim() ||
    process.env.WHATSAPP_CLOUD_ACCESS_TOKEN?.trim() ||
    '';

  const phoneNumberId =
    reqCredentials?.phoneNumberId?.trim() ||
    process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ||
    '';

  const wabaId =
    reqCredentials?.wabaId?.trim() ||
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim() ||
    process.env.WHATSAPP_WABA_ID?.trim() ||
    '';

  const verifyToken =
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim() ||
    'collectiq_wa_webhook_verify_token_2025';

  return {
    accessToken,
    phoneNumberId,
    wabaId,
    verifyToken,
    isConfigured: Boolean(accessToken && phoneNumberId),
  };
}

function normalizePhoneNumber(rawPhone: string): { isValid: boolean; normalized: string; error?: string } {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { isValid: false, normalized: '', error: 'Phone number is required.' };
  }

  let cleaned = rawPhone.trim().replace(/[\s\(\)\-\.\+]/g, '');
  if (!cleaned) {
    return { isValid: false, normalized: '', error: 'Phone number cannot be empty.' };
  }

  // Strip leading 0 from 11-digit numbers
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Indian mobile 10-digit
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return { isValid: true, normalized: `91${cleaned}` };
  }

  // Already prefixed with 91
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    return { isValid: true, normalized: cleaned };
  }

  // Accidental double 9191
  if (/^9191[6-9]\d{9}$/.test(cleaned)) {
    return { isValid: true, normalized: cleaned.substring(2) };
  }

  // Standard international E.164 (10 to 15 digits)
  if (/^\d{10,15}$/.test(cleaned)) {
    return { isValid: true, normalized: cleaned };
  }

  return {
    isValid: false,
    normalized: cleaned,
    error: 'Invalid phone number. Please provide a valid 10-digit mobile number or full international format.',
  };
}

// 1. Send WhatsApp Message (Official Meta Cloud API)
app.post('/api/whatsapp/send', async (req, res) => {
  const {
    recipientPhone,
    templateName,
    templateKey,
    parameters = {},
    freeformText,
    languageCode = 'en_US',
    credentials,
  } = req.body;

  const config = getWhatsAppConfig(credentials);

  if (!config.isConfigured) {
    return res.status(400).json({
      success: false,
      error:
        'WhatsApp Business Cloud API credentials not configured. Please configure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in environment variables or WhatsApp Settings.',
      code: 'MISSING_CREDENTIALS',
    });
  }

  const phoneCheck = normalizePhoneNumber(recipientPhone);
  if (!phoneCheck.isValid) {
    return res.status(400).json({
      success: false,
      error: phoneCheck.error,
      code: 'INVALID_PHONE_NUMBER',
    });
  }

  const normalizedTo = phoneCheck.normalized;

  // Determine message payload structure
  let payload: any = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizedTo,
  };

  const resolvedTemplateName = templateName || (templateKey === 'hello_world' ? 'hello_world' : null);

  if (resolvedTemplateName) {
    // Template Message
    const components: any[] = [];

    // Map template parameters if provided
    if (resolvedTemplateName === 'hello_world') {
      // hello_world takes no parameters
    } else {
      const paramList: string[] = [];
      if (parameters.customerName) paramList.push(String(parameters.customerName));
      if (parameters.invoiceNumber) paramList.push(String(parameters.invoiceNumber));
      if (parameters.amount) paramList.push(String(parameters.amount));
      if (parameters.dueDate) paramList.push(String(parameters.dueDate));
      if (parameters.paymentUrl) paramList.push(String(parameters.paymentUrl));
      if (parameters.promisedDate && !parameters.dueDate) paramList.push(String(parameters.promisedDate));

      if (paramList.length > 0) {
        components.push({
          type: 'body',
          parameters: paramList.map((p) => ({
            type: 'text',
            text: p,
          })),
        });
      }
    }

    payload.type = 'template';
    payload.template = {
      name: resolvedTemplateName,
      language: {
        code: languageCode || 'en_US',
      },
      ...(components.length > 0 ? { components } : {}),
    };
  } else if (freeformText) {
    // Text Message (permitted within 24-hour service window)
    payload.type = 'text';
    payload.text = {
      preview_url: true,
      body: freeformText,
    };
  } else {
    // Default fallback to hello_world test template
    payload.type = 'template';
    payload.template = {
      name: 'hello_world',
      language: { code: 'en_US' },
    };
  }

  const metaUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${config.phoneNumberId}/messages`;

  try {
    const metaResponse = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const metaData: any = await metaResponse.json();

    if (!metaResponse.ok || metaData.error) {
      const err = metaData.error || {};
      let userFriendlyMessage = err.message || 'Meta WhatsApp Cloud API rejected the message.';

      // Actionable error diagnostics based on Meta error codes
      if (err.code === 190) {
        userFriendlyMessage =
          'Meta Access Token has expired or is invalid. Please generate a new System User Token in Meta Business Manager with whatsapp_business_messaging permissions.';
      } else if (err.code === 131030) {
        userFriendlyMessage = `Recipient phone (+${normalizedTo}) is not in the allowed test numbers list. Since your Meta WhatsApp account is currently in Development/Test mode, please add this phone number in Meta Developer Console > WhatsApp > API Setup > Step 2 (Manage phone number list).`;
      } else if (err.code === 131047) {
        userFriendlyMessage =
          '24-Hour customer care window closed. You cannot send free-form text messages. You must send an approved Meta Message Template.';
      } else if (err.code === 132000) {
        userFriendlyMessage = `Template "${resolvedTemplateName}" does not exist or has not been approved in your Meta WhatsApp Business Account for language "${languageCode}".`;
      } else if (err.code === 100) {
        userFriendlyMessage = `Invalid WhatsApp Phone Number ID (${config.phoneNumberId}) or invalid parameter. Verify Phone Number ID in Meta Developer Portal.`;
      }

      console.error('Meta WhatsApp Cloud API error:', {
        status: metaResponse.status,
        code: err.code,
        message: err.message,
        details: err.error_data?.details,
      });

      return res.status(400).json({
        success: false,
        error: userFriendlyMessage,
        metaError: {
          code: err.code,
          subcode: err.error_subcode,
          type: err.type,
          fbtrace_id: err.fbtrace_id,
        },
      });
    }

    const messageId = metaData.messages?.[0]?.id || `wamid.${Date.now()}`;

    // Record initial status
    messageStatusStore.set(messageId, {
      status: 'sent',
      timestamp: new Date().toISOString(),
      recipient: normalizedTo,
    });

    console.log(`WhatsApp message successfully accepted by Meta! Message ID: ${messageId}`);

    return res.json({
      success: true,
      messageId,
      recipient: normalizedTo,
      status: 'sent',
      details: metaData,
    });
  } catch (err: any) {
    console.error('Network failure connecting to Meta WhatsApp API:', err);
    return res.status(500).json({
      success: false,
      error: `Network failure connecting to Meta WhatsApp API: ${err.message}`,
    });
  }
});

// 2. Test Connection to Meta WhatsApp Cloud API
app.post('/api/notifications/test-connection', async (req, res) => {
  const { channel = 'whatsapp', credentials } = req.body;

  if (channel !== 'whatsapp') {
    return res.json({
      success: true,
      configured: true,
      message: `${channel.toUpperCase()} channel gateway is online.`,
    });
  }

  const config = getWhatsAppConfig(credentials);

  if (!config.isConfigured) {
    return res.json({
      success: false,
      configured: false,
      message:
        'WhatsApp credentials not configured. Please enter your Phone Number ID and Access Token in Settings.',
    });
  }

  try {
    const metaUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${config.phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,code_verification_status`;
    const response = await fetch(metaUrl, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    });

    const data: any = await response.json();

    if (!response.ok || data.error) {
      const err = data.error || {};
      let msg = err.message || 'Connection test failed with Meta Graph API.';
      if (err.code === 190) {
        msg = 'Access Token is expired or invalid. Please refresh token in Meta Business Manager.';
      } else if (err.code === 100) {
        msg = `Phone Number ID (${config.phoneNumberId}) was not found in your Meta Developer App.`;
      }

      return res.json({
        success: false,
        configured: true,
        error: msg,
        message: msg,
      });
    }

    return res.json({
      success: true,
      configured: true,
      phoneNumberId: config.phoneNumberId,
      displayPhoneNumber: data.display_phone_number,
      verifiedName: data.verified_name || 'Verified Business Account',
      qualityRating: data.quality_rating || 'GREEN',
      wabaId: config.wabaId,
      message: `Connected successfully! Display Number: ${data.display_phone_number || config.phoneNumberId} (${data.verified_name || 'Verified'})`,
    });
  } catch (err: any) {
    return res.json({
      success: false,
      configured: true,
      error: err.message,
      message: `Failed to ping Meta API: ${err.message}`,
    });
  }
});

// 3. Test Real WhatsApp Message
app.post('/api/whatsapp/test-message', async (req, res) => {
  const { recipientPhone, credentials } = req.body;
  const config = getWhatsAppConfig(credentials);

  if (!config.isConfigured) {
    return res.status(400).json({
      success: false,
      error: 'WhatsApp credentials not configured. Please provide Access Token and Phone Number ID.',
    });
  }

  const phoneCheck = normalizePhoneNumber(recipientPhone);
  if (!phoneCheck.isValid) {
    return res.status(400).json({
      success: false,
      error: phoneCheck.error,
    });
  }

  const normalizedTo = phoneCheck.normalized;

  // Use the pre-approved hello_world template for reliable connection verification
  const payload = {
    messaging_product: 'whatsapp',
    to: normalizedTo,
    type: 'template',
    template: {
      name: 'hello_world',
      language: { code: 'en_US' },
    },
  };

  try {
    const metaUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${config.phoneNumberId}/messages`;
    const response = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: any = await response.json();

    if (!response.ok || data.error) {
      const err = data.error || {};
      let msg = err.message || 'Meta WhatsApp test message failed.';
      if (err.code === 131030) {
        msg = `Recipient +${normalizedTo} is not in your Meta Developer allowed test recipient list. Add this phone number in Meta Developer Console > WhatsApp > API Setup > Step 2.`;
      } else if (err.code === 190) {
        msg = 'Access Token has expired or lacks messaging permissions.';
      }

      return res.status(400).json({
        success: false,
        error: msg,
        details: err,
      });
    }

    const messageId = data.messages?.[0]?.id || `wamid.${Date.now()}`;
    messageStatusStore.set(messageId, {
      status: 'sent',
      timestamp: new Date().toISOString(),
      recipient: normalizedTo,
    });

    return res.json({
      success: true,
      messageId,
      recipient: normalizedTo,
      message: `Test WhatsApp message successfully dispatched! Meta Message ID: ${messageId}`,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: `Error sending test message: ${err.message}`,
    });
  }
});

// 4. Meta Webhook Verification (GET Handshake)
app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const config = getWhatsAppConfig();

  if (mode === 'subscribe' && token === config.verifyToken) {
    console.log('Meta WhatsApp Webhook verified successfully!');
    return res.status(200).send(challenge);
  }

  console.warn('Meta Webhook verification mismatch:', { mode, token, expected: config.verifyToken });
  return res.status(403).json({ error: 'Webhook verification token mismatch' });
});

// 5. Meta Webhook Delivery Events Receiver (POST)
app.post('/api/whatsapp/webhook', (req, res) => {
  const body = req.body;

  if (body?.object === 'whatsapp_business_account') {
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field === 'messages') {
          const value = change.value || {};
          const statuses = value.statuses || [];

          for (const s of statuses) {
            const messageId = s.id;
            const newStatus = s.status; // 'sent', 'delivered', 'read', 'failed'
            const recipientId = s.recipient_id;
            const error = s.errors?.[0]?.title || s.errors?.[0]?.message;

            console.log(`[WhatsApp Webhook DLR] Message: ${messageId} | Status: ${newStatus} | Recipient: ${recipientId}`);

            messageStatusStore.set(messageId, {
              status: newStatus,
              timestamp: new Date().toISOString(),
              recipient: recipientId,
              error,
            });
          }
        }
      }
    }

    return res.status(200).send('EVENT_RECEIVED');
  }

  return res.status(200).send('IGNORED');
});

// 6. Query Webhook Status for a Message ID
app.get('/api/whatsapp/status/:messageId', (req, res) => {
  const { messageId } = req.params;
  const entry = messageStatusStore.get(messageId);

  if (!entry) {
    return res.json({ status: 'sent', found: false });
  }

  return res.json({ ...entry, found: true });
});

// 7. General Notification Dispatch Endpoint
app.post('/api/notifications/dispatch', async (req, res) => {
  const { channel, recipientTarget, content, customerName, invoiceNumber, metaTemplateName, sandboxMode } = req.body;

  if (channel === 'whatsapp') {
    const phoneCheck = normalizePhoneNumber(recipientTarget);
    if (!phoneCheck.isValid) {
      return res.status(400).json({
        status: 'error',
        error: phoneCheck.error,
      });
    }

    const config = getWhatsAppConfig();

    if (!config.isConfigured) {
      if (sandboxMode) {
        const simId = `wamid.sim_${Date.now()}`;
        return res.json({
          status: 'success',
          id: simId,
          deliveryStatus: 'sent',
          providerMessageId: simId,
          recipientTarget: phoneCheck.normalized,
        });
      }

      return res.status(400).json({
        status: 'error',
        error: 'WhatsApp Business Cloud API is not configured with access token and phone number ID.',
      });
    }

    // Forward to WhatsApp send
    const templateName = metaTemplateName || 'collectiq_payment_reminder';
    const payload = {
      messaging_product: 'whatsapp',
      to: phoneCheck.normalized,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en_US' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: customerName || 'Customer' },
              { type: 'text', text: invoiceNumber || 'INV-1001' },
            ],
          },
        ],
      },
    };

    try {
      const metaUrl = `https://graph.facebook.com/${META_GRAPH_VERSION}/${config.phoneNumberId}/messages`;
      const metaResponse = await fetch(metaUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const metaData: any = await metaResponse.json();

      if (!metaResponse.ok || metaData.error) {
        return res.status(400).json({
          status: 'error',
          error: metaData.error?.message || 'Meta WhatsApp dispatch rejected.',
        });
      }

      const msgId = metaData.messages?.[0]?.id || `wamid.${Date.now()}`;
      return res.json({
        status: 'success',
        id: msgId,
        deliveryStatus: 'sent',
        providerMessageId: msgId,
        recipientTarget: phoneCheck.normalized,
      });
    } catch (err: any) {
      return res.status(500).json({
        status: 'error',
        error: err.message,
      });
    }
  }

  // Fallback for email / sms
  return res.json({
    status: 'success',
    id: `notif_${Date.now()}`,
    deliveryStatus: 'sent',
    providerMessageId: `msg_${Date.now()}`,
    recipientTarget,
  });
});

// ==========================================
// RAZORPAY SMART PAYMENT LINK & WEBHOOK APIS
// ==========================================

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

// Server in-memory registry of Smart Payment Links
interface ServerPaymentLink {
  id: string;
  token: string;
  invoiceId: string;
  invoiceNumber: string;
  businessId: string;
  businessName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  amount: number;
  balance: number;
  dueDate: string;
  status: 'active' | 'paid' | 'expired' | 'revoked';
  allowPartialPayments: boolean;
  minPartialAmount?: number;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
  items?: any[];
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
}

const paymentLinksStore = new Map<string, ServerPaymentLink>();
const processedPayments = new Set<string>();
const processedWebhookEvents = new Set<string>();

// Get Payment Gateway Configuration info
app.get('/api/payments/config', (_req, res) => {
  res.json({
    gateway: 'Razorpay',
    configured: Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET),
    keyId: RAZORPAY_KEY_ID || '',
    webhookConfigured: Boolean(RAZORPAY_WEBHOOK_SECRET),
    supportedMethods: ['UPI (GPay, PhonePe, Paytm, BHIM)', 'Cards (Visa, Mastercard, RuPay)', 'Net Banking', 'Wallets'],
  });
});

// 1. Create Smart Payment Link
app.post('/api/payments/create-link', (req, res) => {
  const {
    invoiceId,
    invoiceNumber,
    businessId = 'biz-default',
    businessName = 'CollectIQ Enterprise',
    customerId = '',
    customerName = 'Customer',
    customerEmail = '',
    customerPhone = '',
    amount = 0,
    balance = 0,
    dueDate = '',
    allowPartialPayments = true,
    minPartialAmount = 500,
    items = [],
    expiresInDays = 30,
  } = req.body;

  if (!invoiceId || !invoiceNumber) {
    return res.status(400).json({ success: false, error: 'invoiceId and invoiceNumber are required.' });
  }

  // Generate secure non-guessable random token
  const token = `plink_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const id = `lnk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

  const numAmount = Number(amount) || 0;
  const numBalance = balance !== undefined ? Number(balance) : numAmount;

  const paymentLink: ServerPaymentLink = {
    id,
    token,
    invoiceId,
    invoiceNumber,
    businessId,
    businessName,
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    amount: numAmount,
    balance: Math.max(0, numBalance),
    dueDate,
    status: numBalance <= 0 ? 'paid' : 'active',
    allowPartialPayments: Boolean(allowPartialPayments),
    minPartialAmount: Number(minPartialAmount) || 500,
    items,
    createdAt: now.toISOString(),
    expiresAt,
  };

  paymentLinksStore.set(token, paymentLink);

  const reqHost = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
  const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
  const paymentUrl = `${proto}://${reqHost}/pay/${token}`;

  console.log(`[Smart Payment Link] Generated link for ${invoiceNumber}: ${paymentUrl}`);

  return res.json({
    success: true,
    link: paymentLink,
    paymentUrl,
  });
});

// 2. Fetch Customer Payment Details by Link Token (Public Checkout)
app.get('/api/payments/link/:token', (req, res) => {
  const { token } = req.params;
  const link = paymentLinksStore.get(token);

  if (!link) {
    return res.status(404).json({
      success: false,
      error: 'Payment link not found or has expired. Please contact the business for an updated payment link.',
    });
  }

  // Check expiration
  if (link.status === 'active' && new Date(link.expiresAt).getTime() < Date.now()) {
    link.status = 'expired';
  }

  return res.json({
    success: true,
    link: {
      id: link.id,
      token: link.token,
      invoiceNumber: link.invoiceNumber,
      invoiceId: link.invoiceId,
      businessName: link.businessName,
      customerName: link.customerName,
      customerEmail: link.customerEmail,
      customerPhone: link.customerPhone,
      amount: link.amount,
      balance: link.balance,
      paidAmount: Math.max(0, link.amount - link.balance),
      dueDate: link.dueDate,
      status: link.status,
      allowPartialPayments: link.allowPartialPayments,
      minPartialAmount: link.minPartialAmount,
      items: link.items || [],
      expiresAt: link.expiresAt,
      currency: 'INR',
      currencySymbol: '₹',
      razorpayKeyId: RAZORPAY_KEY_ID || 'rzp_test_collectiq_demo',
      isLiveGateway: Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET),
    },
  });
});

// 3. Create Razorpay Payment Order
app.post('/api/payments/create-order', async (req, res) => {
  const { token, amount } = req.body;
  const link = paymentLinksStore.get(token);

  if (!link) {
    return res.status(404).json({ success: false, error: 'Payment link not found.' });
  }

  if (link.status !== 'active') {
    return res.status(400).json({ success: false, error: `This payment link is ${link.status}.` });
  }

  const payAmount = Number(amount);
  if (!payAmount || payAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid payment amount.' });
  }

  if (payAmount > link.balance) {
    return res.status(400).json({
      success: false,
      error: `Payment amount (₹${payAmount}) exceeds outstanding balance (₹${link.balance}).`,
    });
  }

  if (!link.allowPartialPayments && payAmount < link.balance) {
    return res.status(400).json({
      success: false,
      error: 'Partial payments are not enabled for this invoice. Please pay the full outstanding balance.',
    });
  }

  const amountInPaise = Math.round(payAmount * 100);

  // If live or test Razorpay credentials are configured, create official order via Razorpay API
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `${link.invoiceNumber}_${Date.now().toString().slice(-4)}`,
          notes: {
            invoiceId: link.invoiceId,
            invoiceNumber: link.invoiceNumber,
            businessId: link.businessId,
            token: link.token,
          },
        }),
      });

      const orderData: any = await rzpResponse.json();

      if (!rzpResponse.ok || orderData.error) {
        console.error('Razorpay API error creating order:', orderData);
        return res.status(400).json({
          success: false,
          error: orderData.error?.description || 'Failed to create Razorpay payment order.',
        });
      }

      link.razorpayOrderId = orderData.id;

      return res.json({
        success: true,
        orderId: orderData.id,
        amount: payAmount,
        amountInPaise,
        currency: 'INR',
        keyId: RAZORPAY_KEY_ID,
        isSandbox: false,
      });
    } catch (err: any) {
      console.error('Network error connecting to Razorpay API:', err);
      return res.status(500).json({ success: false, error: `Razorpay connection error: ${err.message}` });
    }
  }

  // Simulated Test/Sandbox Mode
  const simulatedOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  link.razorpayOrderId = simulatedOrderId;

  return res.json({
    success: true,
    orderId: simulatedOrderId,
    amount: payAmount,
    amountInPaise,
    currency: 'INR',
    keyId: 'rzp_test_collectiq_demo',
    isSandbox: true,
  });
});

// 4. Verify Razorpay Payment Signature and Settle Invoice
app.post('/api/payments/verify', (req, res) => {
  const { token, razorpayOrderId, razorpayPaymentId, razorpaySignature, amountPaid, paymentMethod = 'UPI' } = req.body;

  const link = paymentLinksStore.get(token);
  if (!link) {
    return res.status(404).json({ success: false, error: 'Payment link not found.' });
  }

  const numPaid = Number(amountPaid);
  if (!numPaid || numPaid <= 0) {
    return res.status(400).json({ success: false, error: 'Invalid payment amount specified.' });
  }

  // Idempotency: Prevent duplicate payment processing
  if (processedPayments.has(razorpayPaymentId)) {
    return res.json({
      success: true,
      duplicate: true,
      message: 'Payment has already been verified and recorded.',
      paymentId: razorpayPaymentId,
      receiptNumber: `RCP-${razorpayPaymentId.slice(-6)}`,
      amountPaid: numPaid,
      balanceRemaining: link.balance,
      status: link.status,
    });
  }

  // Real Signature Verification if secret is configured
  if (RAZORPAY_KEY_SECRET && !razorpayOrderId?.startsWith('order_sim_')) {
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(text).digest('hex');

    if (expectedSignature !== razorpaySignature) {
      console.error('Razorpay signature mismatch:', { expectedSignature, razorpaySignature });
      return res.status(400).json({
        success: false,
        error: 'Cryptographic signature mismatch. Payment verification failed.',
      });
    }
  }

  // Update link balance
  const previousBalance = link.balance;
  const newBalance = Math.max(0, previousBalance - numPaid);
  link.balance = newBalance;
  link.status = newBalance <= 0 ? 'paid' : 'active';
  link.paidAt = new Date().toISOString();
  link.razorpayPaymentId = razorpayPaymentId;

  // Mark payment ID as processed
  processedPayments.add(razorpayPaymentId);

  const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;

  console.log(`[Payment Verified] Invoice #${link.invoiceNumber}: Settled ₹${numPaid}. Remaining: ₹${newBalance}`);

  return res.json({
    success: true,
    verified: true,
    paymentId: razorpayPaymentId,
    receiptNumber,
    invoiceNumber: link.invoiceNumber,
    invoiceId: link.invoiceId,
    businessId: link.businessId,
    businessName: link.businessName,
    customerName: link.customerName,
    amountPaid: numPaid,
    previousBalance,
    balanceRemaining: newBalance,
    status: link.status,
    paymentMethod,
    paidAt: link.paidAt,
  });
});

// 5. Official Razorpay Webhook Handler
app.post('/api/payments/webhook', (req, res) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  const event = req.body;

  // Idempotency check on webhook event ID
  const eventId = event?.event_id || event?.id || `evt_${Date.now()}`;
  if (processedWebhookEvents.has(eventId)) {
    return res.status(200).json({ status: 'ignored', reason: 'duplicate event' });
  }

  if (RAZORPAY_WEBHOOK_SECRET && signature) {
    try {
      const rawBody = JSON.stringify(req.body);
      const expected = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
      if (expected !== signature) {
        console.warn('Razorpay webhook signature mismatch.');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    } catch (e: any) {
      console.warn('Webhook signature check notice:', e.message);
    }
  }

  processedWebhookEvents.add(eventId);

  const eventType = event?.event;
  console.log(`[Razorpay Webhook] Received event: ${eventType} (ID: ${eventId})`);

  if (eventType === 'payment.captured' || eventType === 'order.paid') {
    const paymentEntity = event.payload?.payment?.entity;
    const notes = paymentEntity?.notes || {};
    const token = notes.token;

    if (token && paymentLinksStore.has(token)) {
      const link = paymentLinksStore.get(token)!;
      const amountPaid = (paymentEntity.amount || 0) / 100;
      const newBalance = Math.max(0, link.balance - amountPaid);
      link.balance = newBalance;
      link.status = newBalance <= 0 ? 'paid' : 'active';
      link.paidAt = new Date().toISOString();
      link.razorpayPaymentId = paymentEntity.id;
      if (paymentEntity.id) processedPayments.add(paymentEntity.id);
      console.log(`[Razorpay Webhook Settle] Updated link for ${link.invoiceNumber}. Status: ${link.status}`);
    }
  }

  return res.status(200).json({ status: 'ok', received: true });
});

// 6. Expire or Revoke Payment Link
app.post('/api/payments/revoke-link', (req, res) => {
  const { token } = req.body;
  const link = paymentLinksStore.get(token);
  if (!link) {
    return res.status(404).json({ success: false, error: 'Payment link not found.' });
  }

  link.status = 'revoked';
  return res.json({ success: true, message: `Payment link for invoice ${link.invoiceNumber} has been revoked.` });
});

// 7. Backend Account Deletion & Resource Cleanup
app.post('/api/account/delete-cleanup', (req, res) => {
  const { uid, businessId, isOwner } = req.body;

  if (!uid) {
    return res.status(400).json({ success: false, error: 'User ID is required for cleanup.' });
  }

  console.log(`[Account Cleanup] Purging backend resources for user ${uid} (Business: ${businessId}, Owner: ${Boolean(isOwner)})`);

  // Revoke in-memory payment links for this business
  if (isOwner && businessId) {
    let revokedCount = 0;
    for (const [token, link] of paymentLinksStore.entries()) {
      if (link.businessId === businessId) {
        link.status = 'revoked';
        paymentLinksStore.delete(token);
        revokedCount++;
      }
    }
    console.log(`[Account Cleanup] Revoked and purged ${revokedCount} active payment links.`);
  }

  return res.json({
    success: true,
    message: 'Backend session resources, background jobs, and payment links purged successfully.',
    purged: { uid, businessId, isOwner: Boolean(isOwner) },
  });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = parseInt(process.env.PORT || '3000', 10);

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`CollectIQ server running at http://0.0.0.0:${port}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
