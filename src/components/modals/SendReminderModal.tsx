import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Send,
  Sparkles,
  Copy,
  Check,
  MessageSquare,
  Mail,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  Phone,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Link as LinkIcon,
  Loader2,
} from 'lucide-react';
import { geminiAIService } from '../../services/gemini';
import { storageService } from '../../services/storage';
import { whatsappService, APPROVED_WHATSAPP_TEMPLATES, WhatsAppTemplateKey } from '../../services/whatsapp';
import { normalizeWhatsAppNumber } from '../../utils/phone';
import { gmailService } from '../../services/gmail';
import { paymentLinkService } from '../../services/paymentLinkService';

interface SendReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  overdueDays?: number;
  onSent?: () => void;
  currencySymbol?: string;
  customerPhone?: string;
}

export const SendReminderModal: React.FC<SendReminderModalProps> = ({
  isOpen,
  onClose,
  customerName,
  invoiceNumber,
  amount,
  dueDate,
  overdueDays = 0,
  onSent,
  currencySymbol = '₹',
  customerPhone: propCustomerPhone,
}) => {
  if (!isOpen) return null;

  // Find customer in database for existing phone/email
  const existingCustomer = useMemo(() => {
    const list = storageService.getState().customers || [];
    return list.find(
      (c) =>
        c.name.trim().toLowerCase() === customerName.trim().toLowerCase() ||
        c.company?.trim().toLowerCase() === customerName.trim().toLowerCase()
    );
  }, [customerName]);

  const [channel, setChannel] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [recipientPhone, setRecipientPhone] = useState<string>(() => {
    return propCustomerPhone || existingCustomer?.phone || '';
  });
  const [recipientEmail, setRecipientEmail] = useState<string>(() => {
    return existingCustomer?.email || '';
  });

  const [tone, setTone] = useState<'gentle' | 'standard' | 'firm' | 'urgent'>(
    overdueDays > 30 ? 'firm' : 'standard'
  );

  // Associated invoice and payment link
  const matchingInvoice = useMemo(() => {
    const list = storageService.getState().invoices || [];
    return (
      list.find((i) => i.invoiceNumber === invoiceNumber) ||
      list.find(
        (i) =>
          i.customerName.toLowerCase() === customerName.toLowerCase() &&
          i.status !== 'paid'
      )
    );
  }, [invoiceNumber, customerName]);

  const [includePaymentLink, setIncludePaymentLink] = useState<boolean>(true);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(
    matchingInvoice?.paymentLinkUrl || null
  );
  const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false);

  // Auto-generate or retrieve payment link for this invoice
  useEffect(() => {
    if (matchingInvoice && !paymentLinkUrl && !isGeneratingLink) {
      setIsGeneratingLink(true);
      paymentLinkService.generatePaymentLink(matchingInvoice).then((res) => {
        if (res.success && res.paymentUrl) {
          setPaymentLinkUrl(res.paymentUrl);
        }
        setIsGeneratingLink(false);
      });
    }
  }, [matchingInvoice?.id]);

  // Template vs Custom mode for WhatsApp
  const [useTemplate, setUseTemplate] = useState<boolean>(true);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<WhatsAppTemplateKey>(
    'payment_link_reminder'
  );

  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sending and feedback states
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<{
    messageId?: string;
    recipientPhone?: string;
  } | null>(null);

  // Google Workspace Gmail integration state
  const [emailProvider, setEmailProvider] = useState<'gmail' | 'resend'>('gmail');
  const [isGmailConnected, setIsGmailConnected] = useState<boolean>(() => gmailService.isConnected());
  const [gmailAccountEmail, setGmailAccountEmail] = useState<string | null>(null);
  const [isAuthorizingGmail, setIsAuthorizingGmail] = useState<boolean>(false);
  const [showGmailConfirm, setShowGmailConfirm] = useState<boolean>(false);

  // Check Gmail connection & profile on mount or channel switch
  useEffect(() => {
    const connected = gmailService.isConnected();
    setIsGmailConnected(connected);
    if (connected) {
      gmailService.getProfile().then((p) => {
        if (p?.emailAddress) setGmailAccountEmail(p.emailAddress);
      });
    }
  }, [channel]);

  // Phone normalization & validation
  const phoneValidation = useMemo(() => {
    return normalizeWhatsAppNumber(recipientPhone);
  }, [recipientPhone]);

  // Generate AI draft for custom messages
  const fetchDraft = async (ch = channel, tn = tone) => {
    setIsLoadingAI(true);
    try {
      const draft = await geminiAIService.generateReminder({
        customerName,
        invoiceNumber,
        amount,
        dueDate,
        overdueDays,
        channel: ch,
        tone: tn,
        currencySymbol,
      });
      if (draft?.message) {
        setMessage(draft.message);
        setSubject(draft.subject || '');
      }
    } catch {
      // Handled gracefully with fallback draft inside gemini service
    } finally {
      setIsLoadingAI(false);
    }
  };

  useEffect(() => {
    fetchDraft(channel, tone);
  }, [channel, tone, customerName, invoiceNumber]);

  // Synchronize recipient phone if customer matches later
  useEffect(() => {
    if (!recipientPhone && existingCustomer?.phone) {
      setRecipientPhone(existingCustomer.phone);
    }
    if (!recipientEmail && existingCustomer?.email) {
      setRecipientEmail(existingCustomer.email);
    }
  }, [existingCustomer]);

  const handleCopy = () => {
    const textToCopy =
      channel === 'whatsapp' && useTemplate
        ? getTemplatePreviewText(selectedTemplateKey)
        : message;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build preview for approved template
  const getTemplatePreviewText = (key: WhatsAppTemplateKey) => {
    const tmpl = APPROVED_WHATSAPP_TEMPLATES[key];
    if (!tmpl) return message;
    if (key === 'hello_world') return 'Hello World (Official Meta pre-approved connectivity test template)';
    if (key === 'payment_link_reminder') {
      return `Hello ${customerName}, invoice ${invoiceNumber} for ${currencySymbol}${amount.toLocaleString('en-IN')} is ready. Pay directly via UPI / Cards using this link: ${paymentLinkUrl || '(Generating Smart Link...)'}`;
    }
    if (key === 'overdue_payment') {
      return `Hello ${customerName}, invoice ${invoiceNumber} for ${currencySymbol}${amount.toLocaleString('en-IN')} is overdue. Please contact us if you need assistance with payment.`;
    }
    if (key === 'payment_reminder') {
      return `Hello ${customerName}, this is a friendly reminder that invoice ${invoiceNumber} has an outstanding balance of ${currencySymbol}${amount.toLocaleString('en-IN')}. Please make your payment by ${dueDate}.`;
    }
    if (key === 'promise_reminder') {
      return `Hello ${customerName}, this is a reminder of your promised payment of ${currencySymbol}${amount.toLocaleString('en-IN')} scheduled for ${dueDate}.`;
    }
    return tmpl.bodyPreview;
  };

  const handleSend = async () => {
    setSendError(null);
    setIsSending(true);

    try {
      if (channel === 'whatsapp') {
        if (!phoneValidation.isValid) {
          setSendError(
            phoneValidation.error ||
              'Please enter a valid recipient phone number with country code (e.g. +91 98765 43210).'
          );
          setIsSending(false);
          return;
        }

        const templateConfig = APPROVED_WHATSAPP_TEMPLATES[selectedTemplateKey];

        const payload: any = {
          recipientPhone: phoneValidation.normalized,
          customerName,
          invoiceNumber,
        };

        if (useTemplate && templateConfig) {
          payload.templateKey = selectedTemplateKey;
          payload.templateName = templateConfig.metaTemplateName;
          payload.languageCode = templateConfig.languageCode;
          payload.parameters = {
            customerName,
            invoiceNumber,
            amount: `${currencySymbol}${amount.toLocaleString('en-IN')}`,
            dueDate,
            paymentUrl: paymentLinkUrl || '',
          };
        } else {
          payload.freeformText =
            includePaymentLink && paymentLinkUrl && !message.includes(paymentLinkUrl)
              ? `${message}\n\n👉 Pay directly online (UPI / Cards / Net Banking): ${paymentLinkUrl}`
              : message;
        }

        const result = await whatsappService.sendMessage(payload);

        if (!result.success) {
          setSendError(
            result.error ||
              'Failed to dispatch WhatsApp message. Check your Meta WhatsApp Business Cloud configuration.'
          );
          setIsSending(false);
          return;
        }

        const metaMessageId = result.messageId || `wamid.${Date.now()}`;

        // Register in notification logs
        storageService.addNotificationLog({
          id: `log-wa-${Date.now()}`,
          businessId: storageService.getActiveBusinessId() || 'business-primary',
          channel: 'whatsapp',
          eventType: overdueDays > 0 ? 'overdue_alert' : 'invoice_reminder',
          recipientName: customerName,
          recipientTarget: `+${phoneValidation.normalized}`,
          content: useTemplate ? getTemplatePreviewText(selectedTemplateKey) : message,
          status: 'sent',
          provider: 'Meta WhatsApp Cloud',
          providerMessageId: metaMessageId,
          sentAt: new Date().toISOString(),
          costEstimate: 0.82,
          retryCount: 0,
          canRetry: false,
          invoiceNumber,
          customerName,
          metaTemplateName: useTemplate ? templateConfig?.metaTemplateName : undefined,
        });

        // Record activity log
        storageService.addActivity({
          type: 'reminder_sent',
          title: `WhatsApp reminder dispatched to ${customerName}`,
          description: `Meta Cloud API (${phoneValidation.formatted}) • Ref: ${metaMessageId.slice(0, 18)}...`,
          customerName,
          iconType: 'mail',
        });

        // Update follow-ups if present
        const state = storageService.getState();
        const fol = state.followUps.find(
          (f) =>
            f.customerName.toLowerCase() === customerName.toLowerCase() ||
            f.invoiceNumber === invoiceNumber
        );
        if (fol) {
          storageService.sendFollowUpReminder(fol.id, 'whatsapp');
        }

        setSendSuccess({
          messageId: metaMessageId,
          recipientPhone: phoneValidation.formatted,
        });
        onSent?.();
      } else if (channel === 'email' && emailProvider === 'gmail') {
        // Workspace Gmail flow: Check connection first
        if (!gmailService.isConnected()) {
          const authRes = await handleConnectGmail();
          if (!authRes) {
            setIsSending(false);
            return;
          }
        }

        // MANDATORY PER WORKSPACE SKILL: Present explicit user confirmation dialog
        setIsSending(false);
        setShowGmailConfirm(true);
      } else {
        // Email (Resend) or SMS channel dispatch via backend endpoint
        const finalMessage =
          includePaymentLink && paymentLinkUrl && !message.includes(paymentLinkUrl)
            ? `${message}\n\n👉 Pay directly online (UPI / Cards / Net Banking): ${paymentLinkUrl}`
            : message;

        const response = await fetch('/api/notifications/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel,
            eventType: overdueDays > 0 ? 'overdue_alert' : 'invoice_reminder',
            recipientName: customerName,
            recipientTarget: channel === 'email' ? recipientEmail : phoneValidation.normalized || recipientPhone,
            subject: subject || `Payment Reminder: ${invoiceNumber}`,
            content: finalMessage,
            invoiceNumber,
            customerName,
          }),
        });

        const data = await response.json();

        // Record activity
        storageService.addActivity({
          type: 'reminder_sent',
          title: `Reminder sent to ${customerName}`,
          description: `via ${channel === 'email' ? 'Email' : 'SMS'} • ${invoiceNumber}`,
          customerName,
          iconType: 'mail',
        });

        const state = storageService.getState();
        const fol = state.followUps.find(
          (f) =>
            f.customerName.toLowerCase() === customerName.toLowerCase() ||
            f.invoiceNumber === invoiceNumber
        );
        if (fol) {
          storageService.sendFollowUpReminder(fol.id, channel);
        }

        setSendSuccess({
          messageId: data.log?.providerMessageId || `ref-${Date.now()}`,
          recipientPhone: channel === 'email' ? recipientEmail : recipientPhone,
        });
        onSent?.();
      }
    } catch (err: any) {
      setSendError(err.message || 'An unexpected error occurred during dispatch.');
    } finally {
      setIsSending(false);
    }
  };

  const handleConnectGmail = async (): Promise<boolean> => {
    setIsAuthorizingGmail(true);
    setSendError(null);
    try {
      const res = await gmailService.connectGmail();
      if (res.success && res.email) {
        setIsGmailConnected(true);
        setGmailAccountEmail(res.email);
        return true;
      } else {
        setSendError(res.error || 'Failed to authorize Gmail account.');
        return false;
      }
    } finally {
      setIsAuthorizingGmail(false);
    }
  };

  const executeGmailSend = async () => {
    setShowGmailConfirm(false);
    setIsSending(true);
    setSendError(null);

    try {
      const finalEmailBody =
        includePaymentLink && paymentLinkUrl && !message.includes(paymentLinkUrl)
          ? `${message}\n\n👉 Pay directly online (UPI / Cards / Net Banking): ${paymentLinkUrl}`
          : message;

      const res = await gmailService.sendEmail({
        to: recipientEmail,
        subject: subject || `Payment Reminder: ${invoiceNumber}`,
        body: finalEmailBody,
        customerName,
        invoiceNumber,
      });

      if (!res.success) {
        setSendError(res.error || 'Failed to send email via Gmail API.');
        setIsSending(false);
        return;
      }

      const gmailMsgId = res.messageId || `gmail-${Date.now()}`;

      // Log into CollectIQ notification records
      storageService.addNotificationLog({
        id: `log-gmail-${Date.now()}`,
        businessId: storageService.getActiveBusinessId() || 'business-primary',
        channel: 'email',
        eventType: overdueDays > 0 ? 'overdue_alert' : 'invoice_reminder',
        recipientName: customerName,
        recipientTarget: recipientEmail,
        subject: subject || `Payment Reminder: ${invoiceNumber}`,
        content: message,
        status: 'sent',
        provider: 'Google Workspace Gmail',
        providerMessageId: gmailMsgId,
        sentAt: new Date().toISOString(),
        costEstimate: 0.0,
        retryCount: 0,
        canRetry: false,
        invoiceNumber,
        customerName,
      });

      // Record activity
      storageService.addActivity({
        type: 'reminder_sent',
        title: `Reminder sent to ${customerName}`,
        description: `via Google Workspace Gmail • ${invoiceNumber}`,
        customerName,
        iconType: 'mail',
      });

      // Update follow-up
      const state = storageService.getState();
      const fol = state.followUps.find(
        (f) =>
          f.customerName.toLowerCase() === customerName.toLowerCase() ||
          f.invoiceNumber === invoiceNumber
      );
      if (fol) {
        storageService.sendFollowUpReminder(fol.id, 'email');
      }

      setSendSuccess({
        messageId: gmailMsgId,
        recipientPhone: recipientEmail,
      });
      onSent?.();
    } catch (err: any) {
      setSendError(err.message || 'Error occurred while contacting Gmail API.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-2xs">
              <Send size={18} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Send Payment Reminder</h3>
              <p className="text-xs text-slate-500">
                {customerName} • <span className="font-mono font-semibold text-slate-700">{invoiceNumber}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        {sendSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-lg">
                Reminder Dispatched Successfully!
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Delivered to <strong className="text-slate-800">{sendSuccess.recipientPhone}</strong> via{' '}
                <strong className="text-slate-800">
                  {channel === 'whatsapp' ? 'Meta WhatsApp Business Cloud API' : channel.toUpperCase()}
                </strong>
              </p>
            </div>

            {sendSuccess.messageId && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 max-w-md mx-auto text-left">
                <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider mb-1">
                  Meta Delivery Receipt Reference:
                </span>
                <code className="text-xs font-mono font-bold text-indigo-700 break-all select-all block">
                  {sendSuccess.messageId}
                </code>
              </div>
            )}

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#3730a3] text-white text-xs font-bold shadow-sm cursor-pointer transition-all"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Error Banner */}
            {sendError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-start gap-2 font-bold">
                  <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <span>WhatsApp Cloud API Message Failed:</span>
                </div>
                <p className="text-[12px] text-red-700 pl-6 leading-relaxed whitespace-pre-wrap">
                  {sendError}
                </p>
                {sendError.includes('test numbers') && (
                  <div className="pl-6 pt-1 text-[11px] text-red-600">
                    💡 Tip: If you are using a Meta Developer Sandbox number, open{' '}
                    <span className="font-semibold underline">Meta Developer Console &gt; WhatsApp &gt; API Setup</span> and add this recipient number under "Step 2: Manage phone number list".
                  </div>
                )}
                {sendError.includes('Template') && (
                  <div className="pl-6 pt-1 text-[11px] text-indigo-700">
                    💡 Tip: You can switch to the pre-approved{' '}
                    <button
                      type="button"
                      onClick={() => setSelectedTemplateKey('hello_world')}
                      className="font-bold underline cursor-pointer"
                    >
                      Meta Test (Hello World) template
                    </button>{' '}
                    which is active on all WhatsApp Cloud accounts immediately.
                  </div>
                )}
              </div>
            )}

            {/* Channel Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Dispatch Channel</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('whatsapp')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    channel === 'whatsapp'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare size={15} className="text-emerald-600" />
                  <span>WhatsApp Cloud</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    channel === 'email'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-800 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Mail size={15} className="text-indigo-600" />
                  <span>Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('sms')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    channel === 'sms'
                      ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Smartphone size={15} className="text-blue-600" />
                  <span>SMS Alert</span>
                </button>
              </div>
            </div>

            {/* Recipient Input (Phone for WhatsApp / SMS, Email for Email) */}
            {channel === 'whatsapp' || channel === 'sms' ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Phone size={13} className="text-slate-500" />
                    <span>Recipient WhatsApp Phone Number</span>
                  </label>
                  {phoneValidation.isValid ? (
                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                      <Check size={12} className="stroke-[2.5]" />
                      <span>E.164: +{phoneValidation.normalized}</span>
                    </span>
                  ) : (
                    recipientPhone && (
                      <span className="text-[11px] text-amber-600 font-medium">
                        Format: 10 digits or +91...
                      </span>
                    )
                  )}
                </div>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="e.g. 9876543210 or +91 98765 43210"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-semibold outline-none transition-all ${
                    phoneValidation.isValid
                      ? 'bg-white border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-slate-900'
                      : recipientPhone
                      ? 'bg-amber-50/50 border-amber-300 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Automatically normalized into official Meta E.164 international standard.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recipient Email Address</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="customer@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Google Workspace Gmail Provider Card */}
                <div className="p-3 bg-gradient-to-r from-rose-50/70 to-indigo-50/50 border border-rose-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Mail size={14} className="text-rose-600" />
                      <span>Email Delivery Engine</span>
                    </span>
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setEmailProvider('gmail')}
                        className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition-all ${
                          emailProvider === 'gmail'
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Google Gmail
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailProvider('resend')}
                        className={`px-2 py-0.5 rounded-md font-bold cursor-pointer transition-all ${
                          emailProvider === 'resend'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Default Mailer
                      </button>
                    </div>
                  </div>

                  {emailProvider === 'gmail' && (
                    <div className="pt-1">
                      {isGmailConnected ? (
                        <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-rose-200 text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="truncate">Sender: {gmailAccountEmail || 'Authorized Workspace User'}</span>
                          </div>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md shrink-0">
                            Workspace Linked
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white rounded-xl border border-rose-200 text-[11px]">
                          <span className="text-slate-600">
                            Connect your Google Workspace Gmail to send directly from your business address.
                          </span>
                          <button
                            type="button"
                            onClick={handleConnectGmail}
                            disabled={isAuthorizingGmail}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                          >
                            {isAuthorizingGmail ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <ExternalLink size={12} />
                            )}
                            <span>Authorize Gmail</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Smart Payment Link Notification Integration Pill */}
            <div className="p-3 bg-gradient-to-r from-indigo-50/80 to-purple-50/60 border border-indigo-100 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <LinkIcon size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <span>Smart Payment Link (UPI / Cards)</span>
                      {isGeneratingLink && <Loader2 size={12} className="animate-spin text-indigo-600" />}
                    </div>
                    <div className="text-[11px] text-indigo-800/80 truncate max-w-xs sm:max-w-md">
                      {paymentLinkUrl || 'Generating secure mobile payment link...'}
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 ml-2">
                  <span className="text-[11px] font-bold text-indigo-900 hidden sm:inline">Attach Link</span>
                  <input
                    type="checkbox"
                    checked={includePaymentLink}
                    onChange={(e) => setIncludePaymentLink(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* WhatsApp Template vs Custom message selection */}
            {channel === 'whatsapp' && (
              <div className="space-y-3 p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-emerald-600" />
                    <span>WhatsApp Delivery Mode</span>
                  </span>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-emerald-200 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setUseTemplate(true)}
                      className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-all ${
                        useTemplate
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Approved Template
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseTemplate(false)}
                      className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-all ${
                        !useTemplate
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Custom Draft
                    </button>
                  </div>
                </div>

                {useTemplate ? (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-emerald-900">
                      Select Pre-Approved Meta Template:
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {(
                        [
                          'payment_link_reminder',
                          'payment_reminder',
                          'overdue_payment',
                          'promise_reminder',
                          'hello_world',
                        ] as WhatsAppTemplateKey[]
                      ).map((key) => {
                        const tmpl = APPROVED_WHATSAPP_TEMPLATES[key];
                        const isSelected = selectedTemplateKey === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedTemplateKey(key)}
                            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-white border-emerald-500 shadow-2xs ring-2 ring-emerald-500/20'
                                : 'bg-white/70 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                              <span>{tmpl.displayName}</span>
                              {key === 'hello_world' && (
                                <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-mono font-bold">
                                  Sandbox
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                              {tmpl.metaTemplateName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                    <ShieldAlert size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Meta Policy Rule:</strong> Freeform messages can only be delivered within 24 hours of the customer messaging you first. For cold payment reminders, use an Approved Template.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Tone Selector (when not using rigid template) */}
            {(!useTemplate || channel !== 'whatsapp') && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Tone & Urgency</label>
                  <button
                    onClick={() => fetchDraft()}
                    disabled={isLoadingAI}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={12} />
                    <span>{isLoadingAI ? 'Generating...' : 'AI Re-write'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {(['gentle', 'standard', 'firm', 'urgent'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`py-1.5 px-2 rounded-lg border font-semibold capitalize transition-all cursor-pointer text-center text-[11px] ${
                        tone === t
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Subject (if Email) */}
            {channel === 'email' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>
            )}

            {/* Message Preview */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  {channel === 'whatsapp' && useTemplate ? 'Meta Template Preview (Live Rendered)' : 'Message Body'}
                </label>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {channel === 'whatsapp' && useTemplate ? (
                <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap select-text">
                  {getTemplatePreviewText(selectedTemplateKey)}
                </div>
              ) : (
                <textarea
                  rows={channel === 'whatsapp' ? 5 : 6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none leading-relaxed"
                />
              )}
            </div>

            {/* Settle amount tag */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-center justify-between">
              <span>
                Outstanding Balance:{' '}
                <strong className="text-slate-900 font-bold">
                  {currencySymbol}
                  {amount.toLocaleString('en-IN')}
                </strong>
              </span>
              <span>Due Date: <strong className="text-slate-800">{dueDate}</strong></span>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending}
                className="px-5 py-2.5 rounded-xl bg-[#4338ca] hover:bg-[#3730a3] active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>
                      {channel === 'whatsapp'
                        ? 'Dispatching via Meta Cloud...'
                        : 'Dispatching via Gmail...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>
                      {channel === 'email' && emailProvider === 'gmail'
                        ? 'Send via Gmail'
                        : 'Dispatch Reminder'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MANDATORY USER CONFIRMATION MODAL FOR GMAIL SENDING (PER WORKSPACE CONSTITUTION) */}
      {showGmailConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-rose-50 to-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Mail size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Confirm Email Dispatch via Gmail
                  </h3>
                  <p className="text-[10px] text-slate-500">Google Workspace Permission Required</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGmailConfirm(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <p className="text-slate-700 leading-relaxed">
                You are about to send an official payment reminder email on your behalf using your Google Workspace Gmail account.
              </p>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sender Account:</span>
                  <strong className="text-slate-800">{gmailAccountEmail || 'Your Gmail Account'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Recipient Email:</span>
                  <strong className="text-slate-800">{recipientEmail}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice:</span>
                  <strong className="text-indigo-600">{invoiceNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Subject:</span>
                  <span className="text-slate-700 font-semibold truncate max-w-[200px]">{subject || `Payment Reminder: ${invoiceNumber}`}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                ⚠️ <strong>Note:</strong> This action cannot be undone once dispatched from your Gmail inbox.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowGmailConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeGmailSend}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={13} />
                  <span>Confirm & Send via Gmail</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

