import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Radio,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Send,
  DollarSign,
  ShieldCheck,
  Key,
  ExternalLink,
  Sliders,
  Check,
  Copy,
  Plus,
  Trash2,
  Edit2,
  HelpCircle,
  Info,
  Clock,
  Sparkles,
  ChevronDown,
  Eye,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { AppState, storageService } from '../../services/storage';
import {
  NotificationChannel,
  NotificationEventType,
  NotificationLog,
  NotificationTemplate,
  NotificationSettings,
} from '../../types';
import { notificationService } from '../../services/notifications';
import { gmailService } from '../../services/gmail';

interface NotificationSettingsViewProps {
  state: AppState;
}

export const NotificationSettingsView: React.FC<NotificationSettingsViewProps> = ({ state }) => {
  const [subTab, setSubTab] = useState<'channels' | 'templates' | 'history' | 'spending'>('channels');

  const settings = state.notificationSettings;
  const templates = state.notificationTemplates || [];
  const logs = state.notificationLogs || [];

  // Feedback states
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [testingChannel, setTestingChannel] = useState<NotificationChannel | null>(null);
  const [testResult, setTestResult] = useState<{ channel: string; message: string; success: boolean } | null>(null);
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);

  // Template modal
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Payload view modal
  const [viewingLog, setViewingLog] = useState<NotificationLog | null>(null);

  // Spending limits edit state
  const [spendLimitInput, setSpendLimitInput] = useState(settings.monthlySpendLimit.toString());

  // WhatsApp Credentials & Connection State
  const [waPhoneId, setWaPhoneId] = useState(settings.whatsapp.phoneNumberId || '');
  const [waWabaId, setWaWabaId] = useState(settings.whatsapp.wabaId || '');
  const [waAccessToken, setWaAccessToken] = useState(settings.whatsapp.accessToken || '');
  const [showWaToken, setShowWaToken] = useState(false);
  const [isWaConfigOpen, setIsWaConfigOpen] = useState(false);

  // WhatsApp Test Modal
  const [isTestWaModalOpen, setIsTestWaModalOpen] = useState(false);
  const [testWaPhoneInput, setTestWaPhoneInput] = useState('');
  const [isSendingWaTest, setIsSendingWaTest] = useState(false);
  const [testWaFeedback, setTestWaFeedback] = useState<{
    success: boolean;
    message: string;
    messageId?: string;
  } | null>(null);

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Backend config presence
  const [backendConfig, setBackendConfig] = useState<any>(null);

  // Google Workspace Gmail integration state
  const [isGmailActive, setIsGmailActive] = useState<boolean>(() => gmailService.isConnected());
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [isAuthorizingGmail, setIsAuthorizingGmail] = useState<boolean>(false);

  useEffect(() => {
    const connected = gmailService.isConnected();
    setIsGmailActive(connected);
    if (connected) {
      gmailService.getProfile().then((p) => {
        if (p?.emailAddress) setGmailEmail(p.emailAddress);
      });
    }
  }, []);

  useEffect(() => {
    fetch('/api/notifications/config')
      .then((r) => r.json())
      .then((data) => setBackendConfig(data))
      .catch(() => {});
  }, []);

  // Sync state if settings change externally
  useEffect(() => {
    if (settings.whatsapp.phoneNumberId && !waPhoneId) {
      setWaPhoneId(settings.whatsapp.phoneNumberId);
    }
    if (settings.whatsapp.wabaId && !waWabaId) {
      setWaWabaId(settings.whatsapp.wabaId);
    }
    if (settings.whatsapp.accessToken && !waAccessToken) {
      setWaAccessToken(settings.whatsapp.accessToken);
    }
  }, [settings.whatsapp]);

  const triggerSaveNotice = (msg = 'Notification preferences updated successfully.') => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleToggleChannel = (channel: NotificationChannel, enabled: boolean) => {
    storageService.updateNotificationSettings({
      [channel]: {
        ...settings[channel],
        enabled,
      },
    });
    triggerSaveNotice(`${channel.toUpperCase()} notifications ${enabled ? 'enabled' : 'disabled'}.`);
  };

  const handleSaveWaCredentials = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    storageService.updateNotificationSettings({
      whatsapp: {
        ...settings.whatsapp,
        phoneNumberId: waPhoneId.trim(),
        wabaId: waWabaId.trim(),
        accessToken: waAccessToken.trim(),
        tokenConfigured: Boolean(waAccessToken.trim()),
      },
    });
    triggerSaveNotice('WhatsApp Business Cloud credentials saved to workspace.');
  };

  const handleTestConnection = async (channel: NotificationChannel) => {
    setTestingChannel(channel);
    setTestResult(null);
    try {
      const res = await fetch('/api/notifications/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          credentials:
            channel === 'whatsapp'
              ? {
                  phoneNumberId: waPhoneId.trim() || undefined,
                  wabaId: waWabaId.trim() || undefined,
                  accessToken: waAccessToken.trim() || undefined,
                }
              : undefined,
        }),
      });
      const data = await res.json();

      if (channel === 'whatsapp' && data.success) {
        storageService.updateNotificationSettings({
          whatsapp: {
            ...settings.whatsapp,
            phoneNumberId: waPhoneId.trim() || data.phoneNumberId || settings.whatsapp.phoneNumberId,
            wabaId: waWabaId.trim() || data.wabaId || settings.whatsapp.wabaId,
            accessToken: waAccessToken.trim() || settings.whatsapp.accessToken,
            businessPhoneNumber: data.displayPhoneNumber,
            verifiedName: data.verifiedName,
            qualityRating: data.qualityRating,
            connectionStatus: 'connected',
            lastTestedAt: new Date().toISOString(),
          },
        });
      }

      setTestResult({
        channel,
        message: data.message || (data.success ? 'Connection verified.' : 'Connection failed.'),
        success: data.success,
      });
    } catch (e: any) {
      setTestResult({ channel, message: e.message || 'Connection failed', success: false });
    } finally {
      setTestingChannel(null);
    }
  };

  const handleSendTestWaMessage = async () => {
    if (!testWaPhoneInput.trim()) {
      setTestWaFeedback({ success: false, message: 'Please enter a test recipient mobile number.' });
      return;
    }
    setIsSendingWaTest(true);
    setTestWaFeedback(null);
    try {
      const res = await fetch('/api/whatsapp/test-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: testWaPhoneInput.trim(),
          credentials: {
            phoneNumberId: waPhoneId.trim() || undefined,
            accessToken: waAccessToken.trim() || undefined,
            wabaId: waWabaId.trim() || undefined,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestWaFeedback({
          success: true,
          message: `Official Meta "hello_world" test template delivered!`,
          messageId: data.messageId,
        });
        triggerSaveNotice('Test WhatsApp message delivered to Meta network.');
      } else {
        setTestWaFeedback({
          success: false,
          message: data.error || 'Failed to dispatch test WhatsApp message.',
        });
      }
    } catch (err: any) {
      setTestWaFeedback({
        success: false,
        message: err.message || 'Network error sending test WhatsApp message.',
      });
    } finally {
      setIsSendingWaTest(false);
    }
  };

  const handleRetryNotification = async (logId: string) => {
    setRetryingLogId(logId);
    try {
      const res = await notificationService.retryNotification(logId);
      if (res.success) {
        triggerSaveNotice('Notification queued for retry delivery.');
      } else {
        alert(res.error || 'Retry failed');
      }
    } finally {
      setRetryingLogId(null);
    }
  };

  const handleSaveSpendSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = Math.max(100, Number(spendLimitInput) || 1000);
    storageService.updateNotificationSettings({
      monthlySpendLimit: limit,
    });
    triggerSaveNotice('Monthly spending limit updated.');
  };

  // Spending calculations
  const spendPct = Math.min(100, Math.round((settings.currentMonthSpend / settings.monthlySpendLimit) * 100));
  const isNearLimit = spendPct >= settings.alertThresholdPercent;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert / Notice */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Main Subtabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 border-b border-slate-200">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 w-fit">
          <button
            onClick={() => setSubTab('channels')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'channels'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders size={14} />
            <span>Notification Channels</span>
          </button>

          <button
            onClick={() => setSubTab('templates')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'templates'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck size={14} />
            <span>Message Templates</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[10px]">
              {templates.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('history')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'history'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock size={14} />
            <span>Delivery History</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('spending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'spending'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign size={14} />
            <span>Spending & Usage</span>
            {isNearLimit && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </button>
        </div>

        {/* Sandbox Indicator */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 cursor-pointer text-xs font-semibold text-indigo-900 select-none">
            <input
              type="checkbox"
              checked={settings.sandboxSimulationMode}
              onChange={(e) => {
                storageService.updateNotificationSettings({
                  sandboxSimulationMode: e.target.checked,
                });
                triggerSaveNotice(
                  e.target.checked
                    ? 'Sandbox Mode enabled: notifications will simulate delivery without consuming live balances.'
                    : 'Live Mode enabled: notifications will dispatch through live provider APIs.'
                );
              }}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>Sandbox Mode (Safe Testing)</span>
          </label>
        </div>
      </div>

      {/* --- TAB 1: CHANNELS CONFIGURATION --- */}
      {subTab === 'channels' && (
        <div className="space-y-6">
          {/* Admin Policy Callout */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-3">
            <ShieldCheck size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-950">Administrator Approval & Compliance Mandate</p>
              <p className="text-amber-800 leading-relaxed">
                To prevent accidental costs, CollectIQ strictly enforces administrator confirmation before sending paid WhatsApp or SMS messages. All WhatsApp messages must adhere to approved Meta templates, and Indian SMS must comply with TRAI DLT registration regulations.
              </p>
            </div>
          </div>

          {/* Test connection result banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <AlertCircle size={16} className="text-red-600" />
                )}
                <span>
                  <strong>{testResult.channel.toUpperCase()} Test:</strong> {testResult.message}
                </span>
              </div>
              <button
                onClick={() => setTestResult(null)}
                className="text-xs font-bold hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Channels Grid (4 Channels) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. EMAIL (Resend + Google Workspace Gmail) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Mail size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <span>Email Invoicing & Alerts</span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-[10px] font-bold text-rose-800">
                          Gmail OAuth
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">Google Workspace Gmail API & HTML reminders</p>
                    </div>
                  </div>

                  {/* Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email.enabled}
                      onChange={(e) => handleToggleChannel('email', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Gmail Workspace Status Banner */}
                <div className="p-3 bg-gradient-to-r from-rose-50/70 via-white to-slate-50 rounded-xl border border-rose-200/80 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Mail size={13} className="text-rose-600" />
                      <span>Google Workspace Gmail:</span>
                    </span>
                    {isGmailActive ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={11} />
                        <span>Connected</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        <span>Available</span>
                      </span>
                    )}
                  </div>

                  {isGmailActive ? (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-600 font-mono truncate max-w-[200px]">
                        {gmailEmail || 'Authorized Account'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Disconnect Google Workspace Gmail?')) {
                            gmailService.disconnectGmail();
                            setIsGmailActive(false);
                            setGmailEmail(null);
                            storageService.toggleIntegration('int-gmail', false);
                            triggerSaveNotice('Gmail session disconnected.');
                          }
                        }}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <div className="pt-1">
                      <button
                        type="button"
                        disabled={isAuthorizingGmail}
                        onClick={async () => {
                          setIsAuthorizingGmail(true);
                          const res = await gmailService.connectGmail();
                          setIsAuthorizingGmail(false);
                          if (res.success) {
                            setIsGmailActive(true);
                            setGmailEmail(res.email || 'Authorized');
                            storageService.toggleIntegration('int-gmail', true, {
                              connectedEmail: res.email || 'Authorized Account',
                            });
                            triggerSaveNotice('Google Workspace Gmail connected successfully!');
                          } else if (res.error) {
                            alert(`Gmail connection failed: ${res.error}`);
                          }
                        }}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        {isAuthorizingGmail ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <ExternalLink size={12} />
                        )}
                        <span>Connect Google Workspace Gmail</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Sender Name:</span>
                    <strong className="text-slate-800 font-semibold">{settings.email.fromName}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Default From Email:</span>
                    <strong className="text-slate-800 font-semibold">{isGmailActive && gmailEmail ? gmailEmail : settings.email.fromEmail}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Est. Unit Cost:</span>
                    <span className="text-emerald-700 font-bold">₹0.00 (Google Workspace OAuth)</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Daily limit: {settings.email.dailyLimit} msgs</span>
                <button
                  type="button"
                  disabled={testingChannel === 'email'}
                  onClick={() => handleTestConnection('email')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw size={12} className={testingChannel === 'email' ? 'animate-spin' : ''} />
                  <span>Test Connection</span>
                </button>
              </div>
            </div>

            {/* 2. WHATSAPP (Meta WhatsApp Business Cloud API) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <MessageSquare size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <span>WhatsApp Business Cloud</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 text-[10px] font-bold text-emerald-800">
                          Meta Graph API v21.0
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">Official Cloud API, automated payment reminders & UPI</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.whatsapp.enabled}
                      onChange={(e) => handleToggleChannel('whatsapp', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Connection Status Badge */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        settings.whatsapp.connectionStatus === 'connected'
                          ? 'bg-emerald-500 animate-pulse'
                          : settings.whatsapp.tokenConfigured || waAccessToken
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                    />
                    <span className="font-bold text-slate-800">
                      {settings.whatsapp.connectionStatus === 'connected'
                        ? 'Meta Cloud Connected'
                        : settings.whatsapp.tokenConfigured || waAccessToken
                        ? 'Credentials Ready (Untested)'
                        : 'Credentials Required'}
                    </span>
                  </div>

                  {settings.whatsapp.qualityRating && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Quality: {settings.whatsapp.qualityRating}
                    </span>
                  )}
                </div>

                {/* Verified Account Details (if connected) */}
                {settings.whatsapp.businessPhoneNumber && (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between text-emerald-950 font-semibold">
                      <span>Verified Phone:</span>
                      <strong className="font-mono">{settings.whatsapp.businessPhoneNumber}</strong>
                    </div>
                    {settings.whatsapp.verifiedName && (
                      <div className="flex items-center justify-between text-emerald-800 text-[11px]">
                        <span>Verified Name:</span>
                        <span>{settings.whatsapp.verifiedName}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Config Details / Credentials Viewer */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Phone Number ID:</span>
                    <strong className="text-slate-800 font-mono text-[11px] truncate max-w-[180px]">
                      {waPhoneId || settings.whatsapp.phoneNumberId || 'Not set'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>WABA Account ID:</span>
                    <strong className="text-slate-800 font-mono text-[11px] truncate max-w-[180px]">
                      {waWabaId || settings.whatsapp.wabaId || 'Not set'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Access Token:</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                      <Key size={11} />
                      <span>{waAccessToken || settings.whatsapp.accessToken ? 'Configured' : 'Missing'}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Est. Unit Cost:</span>
                    <span className="text-slate-700 font-bold">~₹{settings.whatsapp.costPerUnit.toFixed(2)} / conversation</span>
                  </div>
                </div>

                {/* Expandable Credentials Configuration Form */}
                <div>
                  <button
                    type="button"
                    onClick={() => setIsWaConfigOpen(!isWaConfigOpen)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isWaConfigOpen ? '▼ Hide API Credentials' : '▶ Configure Meta API Credentials'}</span>
                  </button>

                  {isWaConfigOpen && (
                    <form onSubmit={handleSaveWaCredentials} className="mt-3 p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-3 text-xs animate-in fade-in">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Phone Number ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={waPhoneId}
                          onChange={(e) => setWaPhoneId(e.target.value)}
                          placeholder="e.g. 1098421859341"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 font-mono text-[11px] text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          WhatsApp Business Account ID (WABA ID)
                        </label>
                        <input
                          type="text"
                          value={waWabaId}
                          onChange={(e) => setWaWabaId(e.target.value)}
                          placeholder="e.g. 94102941829"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 font-mono text-[11px] text-slate-800 outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-700">
                            Meta Cloud Access Token (System User Token) <span className="text-red-500">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowWaToken(!showWaToken)}
                            className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold"
                          >
                            {showWaToken ? 'Hide' : 'Show'}
                          </button>
                        </div>
                        <input
                          type={showWaToken ? 'text' : 'password'}
                          value={waAccessToken}
                          onChange={(e) => setWaAccessToken(e.target.value)}
                          placeholder="EAABw..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 font-mono text-[11px] text-slate-800 outline-none focus:border-indigo-500"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Requires <code>whatsapp_business_messaging</code> permissions in Meta Business Manager.
                        </p>
                      </div>

                      <div className="pt-1 flex items-center justify-end gap-2">
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs cursor-pointer"
                        >
                          Save Credentials
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70 text-[11px] text-amber-900 flex items-center justify-between">
                  <span>Require Admin Approval for each send:</span>
                  <input
                    type="checkbox"
                    checked={settings.whatsapp.requireAdminApproval}
                    onChange={(e) => {
                      storageService.updateNotificationSettings({
                        whatsapp: {
                          ...settings.whatsapp,
                          requireAdminApproval: e.target.checked,
                        },
                      });
                      triggerSaveNotice('WhatsApp approval policy updated.');
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setIsTestWaModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Send size={12} />
                  <span>Send Real Test Message</span>
                </button>

                <button
                  type="button"
                  disabled={testingChannel === 'whatsapp'}
                  onClick={() => handleTestConnection('whatsapp')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw size={12} className={testingChannel === 'whatsapp' ? 'animate-spin' : ''} />
                  <span>Test WhatsApp API</span>
                </button>
              </div>
            </div>

            {/* 3. SMS (Indian MSG91 with DLT) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <span>Indian SMS Gateway</span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-100/80 text-[10px] font-bold text-blue-800">
                          MSG91 • DLT
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">TRAI DLT compliant sender headers & templates</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.sms.enabled}
                      onChange={(e) => handleToggleChannel('sms', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Sender ID / Header:</span>
                    <strong className="text-slate-800 font-mono tracking-widest bg-white px-2 py-0.5 rounded border border-slate-200 text-xs font-bold">
                      {settings.sms.senderId}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>TRAI DLT Entity ID:</span>
                    <strong className="text-slate-800 font-mono text-[11px]">{settings.sms.dltEntityId}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>DLT Registration Status:</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                      <CheckCircle2 size={11} />
                      <span>Verified Active</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Est. Unit Cost:</span>
                    <span className="text-slate-700 font-bold">~₹{settings.sms.costPerUnit.toFixed(2)} / SMS</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70 text-[11px] text-amber-900 flex items-center justify-between">
                  <span>Require Admin Approval for each send:</span>
                  <input
                    type="checkbox"
                    checked={settings.sms.requireAdminApproval}
                    onChange={(e) => {
                      storageService.updateNotificationSettings({
                        sms: {
                          ...settings.sms,
                          requireAdminApproval: e.target.checked,
                        },
                      });
                      triggerSaveNotice('SMS approval policy updated.');
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Route: {settings.sms.route.toUpperCase()}</span>
                <button
                  type="button"
                  disabled={testingChannel === 'sms'}
                  onClick={() => handleTestConnection('sms')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw size={12} className={testingChannel === 'sms' ? 'animate-spin' : ''} />
                  <span>Test MSG91 Route</span>
                </button>
              </div>
            </div>

            {/* 4. PUSH (Firebase Cloud Messaging) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <Radio size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <span>Push Notifications</span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-[10px] font-bold text-amber-800">
                          Firebase FCM
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">In-browser and native OS collection alert pings</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.push.enabled}
                      onChange={(e) => handleToggleChannel('push', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>FCM Server Status:</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      <span>Linked (inner-network-s83d0)</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>VAPID Web Key:</span>
                    <strong className="text-slate-800 font-mono text-[11px] truncate max-w-[200px]">
                      {settings.push.vapidKey || 'Active Key'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Delivery Latency:</span>
                    <strong className="text-slate-800 font-semibold">&lt; 1.2s</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Est. Unit Cost:</span>
                    <span className="text-emerald-700 font-bold">₹0.00 (Unlimited Free Tier)</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Web Push Standard</span>
                <button
                  type="button"
                  disabled={testingChannel === 'push'}
                  onClick={() => handleTestConnection('push')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw size={12} className={testingChannel === 'push' ? 'animate-spin' : ''} />
                  <span>Send Test Push Ping</span>
                </button>
              </div>
            </div>
          </div>

          {/* Meta WhatsApp Cloud API Webhooks & Production Setup Guide */}
          <div className="bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 rounded-2xl border border-emerald-200/90 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    Meta WhatsApp Business Cloud API & Webhooks Setup
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Real-time message delivery receipts (Sent, Delivered, Read, Failed) via Meta Webhooks.
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] w-fit">
                Graph API v21.0 Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Webhook Endpoint Info */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-2.5">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                  1. Meta Webhook Configuration
                </span>
                
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">Callback URL:</span>
                  <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px]">
                    <span className="text-slate-800 truncate">
                      {typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : 'https://your-domain.com/api/whatsapp/webhook'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          `${typeof window !== 'undefined' ? window.location.origin : ''}/api/whatsapp/webhook`,
                          'webhook-url'
                        )
                      }
                      className="text-indigo-600 hover:text-indigo-800 font-semibold shrink-0 cursor-pointer text-[10px]"
                    >
                      {copiedKey === 'webhook-url' ? 'Copied!' : 'Copy URL'}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">Verify Token:</span>
                  <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px]">
                    <span className="text-slate-800 font-bold">collectiq_wa_webhook_verify_token_2025</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText('collectiq_wa_webhook_verify_token_2025', 'verify-token')
                      }
                      className="text-indigo-600 hover:text-indigo-800 font-semibold shrink-0 cursor-pointer text-[10px]"
                    >
                      {copiedKey === 'verify-token' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1">
                  <span>Subscribed Webhook Field:</span>
                  <code className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    messages
                  </code>
                </div>
              </div>

              {/* Developer Sandbox vs Production Rules */}
              <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 space-y-2.5">
                <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                  2. Meta Production vs Developer Sandbox
                </span>

                <div className="space-y-1.5 text-[11px] text-slate-600">
                  <p>
                    • <strong>Sandbox Mode:</strong> If using Meta's free test phone number, messages can <em>only</em> be delivered to numbers added to the test allowlist under <strong>WhatsApp &gt; API Setup &gt; Step 2</strong> in Meta Developer Console.
                  </p>
                  <p>
                    • <strong>24-Hour Rule:</strong> Meta enforces approved Message Templates when initiating contact outside 24h. CollectIQ automatically chooses approved templates for payment reminders.
                  </p>
                  <p>
                    • <strong>Permanent Token:</strong> In Meta Business Manager, create a System User and assign an access token with <code>whatsapp_business_messaging</code> and <code>whatsapp_business_management</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: MESSAGE TEMPLATES --- */}
      {subTab === 'templates' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Customizable Message Templates</h3>
              <p className="text-xs text-slate-500">
                Pre-approved templates for invoice reminders, overdue alerts, payment receipts, and follow-ups.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  storageService.resetNotificationTemplates();
                  triggerSaveNotice('Templates reset to factory defaults.');
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer"
              >
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingTemplate({
                    id: `tmpl-custom-${Date.now()}`,
                    name: 'New Custom Template',
                    eventType: 'invoice_reminder',
                    channel: 'whatsapp',
                    body: 'Hello {{customerName}}, your payment of {{amount}} is due on {{dueDate}}. Pay here: {{paymentLink}}',
                    variables: ['customerName', 'amount', 'dueDate', 'paymentLink'],
                    isDefault: false,
                  });
                  setIsTemplateModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus size={14} />
                <span>Create Template</span>
              </button>
            </div>
          </div>

          {/* Placeholders cheat sheet */}
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs space-y-1.5">
            <span className="font-bold text-indigo-950 flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-600" />
              <span>Available Dynamic Variables:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'customerName',
                'invoiceNumber',
                'amount',
                'dueDate',
                'overdueDays',
                'paymentLink',
                'businessName',
                'bankName',
                'accountNumber',
                'ifscCode',
                'upiId',
              ].map((v) => (
                <code key={v} className="px-2 py-0.5 rounded bg-white border border-indigo-200 font-mono text-[11px] text-indigo-800">
                  {`{{${v}}}`}
                </code>
              ))}
            </div>
          </div>

          {/* Templates List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          tmpl.channel === 'whatsapp'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tmpl.channel === 'email'
                            ? 'bg-indigo-100 text-indigo-800'
                            : tmpl.channel === 'sms'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tmpl.channel === 'whatsapp' ? 'WA' : tmpl.channel === 'email' ? 'EM' : tmpl.channel === 'sms' ? 'SM' : 'PS'}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{tmpl.name}</h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {tmpl.metaStatus && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                          Meta: {tmpl.metaStatus}
                        </span>
                      )}
                      {tmpl.dltTemplateId && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                          DLT: {tmpl.dltTemplateId}
                        </span>
                      )}
                    </div>
                  </div>

                  {tmpl.subject && (
                    <div className="text-[11px] text-slate-500 font-medium">
                      Subject: <strong className="text-slate-700">{tmpl.subject}</strong>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 font-mono text-xs text-slate-700 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                    {tmpl.body}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 capitalize">
                    Event: {tmpl.eventType.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplate(tmpl);
                        setIsTemplateModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </button>
                    {!tmpl.isDefault && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete this custom template?')) {
                            storageService.deleteNotificationTemplate(tmpl.id);
                            triggerSaveNotice('Template removed.');
                          }
                        }}
                        className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: DELIVERY HISTORY & DLR AUDIT TRAIL --- */}
      {subTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Notification Delivery History</h3>
              <p className="text-xs text-slate-500">
                Audited delivery logs with provider DLR confirmation, message IDs, and retry handling.
              </p>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Showing {logs.length} logged dispatches
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Channel & Event</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Provider Ref / DLT</th>
                    <th className="py-3 px-4">Status & DLR</th>
                    <th className="py-3 px-4">Cost</th>
                    <th className="py-3 px-4">Sent At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        No notifications dispatched yet in this workspace.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const isDelivered = log.status === 'delivered';
                      const isFailed = log.status === 'failed';
                      const isSent = log.status === 'sent';

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                  log.channel === 'whatsapp'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : log.channel === 'email'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : log.channel === 'sms'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {log.channel[0].toUpperCase()}
                              </span>
                              <div>
                                <span className="font-bold text-slate-800 block capitalize">
                                  {log.channel}
                                </span>
                                <span className="text-[10px] text-slate-500 capitalize">
                                  {log.eventType.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 block">{log.recipientName}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{log.recipientTarget}</span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-mono text-[11px] text-slate-600 block truncate max-w-[150px]">
                              {log.providerMessageId || 'Pending'}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{log.provider}</span>
                          </td>

                          <td className="py-3 px-4">
                            {isDelivered && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={11} />
                                <span>Delivered</span>
                              </span>
                            )}
                            {isSent && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <Clock size={11} className="animate-spin" />
                                <span>Sent (Awaiting DLR)</span>
                              </span>
                            )}
                            {isFailed && (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                                  <XCircle size={11} />
                                  <span>Failed</span>
                                </span>
                                {log.errorMessage && (
                                  <p className="text-[10px] text-red-600 truncate max-w-[180px]" title={log.errorMessage}>
                                    {log.errorMessage}
                                  </p>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-700">
                            ₹{log.costEstimate.toFixed(2)}
                          </td>

                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {new Date(log.sentAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setViewingLog(log)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                                title="View Payload"
                              >
                                <Eye size={14} />
                              </button>

                              {isFailed && (
                                <button
                                  type="button"
                                  disabled={retryingLogId === log.id}
                                  onClick={() => handleRetryNotification(log.id)}
                                  className="px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-60"
                                >
                                  <RefreshCw size={11} className={retryingLogId === log.id ? 'animate-spin' : ''} />
                                  <span>Retry</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: SPENDING & USAGE LIMITS --- */}
      {subTab === 'spending' && (
        <div className="space-y-6 max-w-4xl">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Monthly Usage & Budget Limits</h3>
            <p className="text-xs text-slate-500">
              Control notification costs, set automated spending caps, and prevent unexpected charges.
            </p>
          </div>

          {/* Spend progress card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                  Current Billing Cycle Spend
                </span>
                <div className="text-3xl font-extrabold text-slate-900 mt-1">
                  ₹{settings.currentMonthSpend.toFixed(2)}
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    of ₹{settings.monthlySpendLimit.toLocaleString('en-IN')} limit
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isNearLimit
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {spendPct}% of Monthly Budget Used
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  spendPct >= 90
                    ? 'bg-red-500'
                    : spendPct >= 70
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                }`}
                style={{ width: `${spendPct}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 block text-[11px]">Resend Email</span>
                <strong className="text-slate-900 text-sm font-bold">
                  {settings.currentMonthCount.email} sent
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">₹0.08 / msg</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 block text-[11px]">WhatsApp Cloud</span>
                <strong className="text-slate-900 text-sm font-bold">
                  {settings.currentMonthCount.whatsapp} sent
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">₹0.68 / conv</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 block text-[11px]">MSG91 SMS</span>
                <strong className="text-slate-900 text-sm font-bold">
                  {settings.currentMonthCount.sms} sent
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">₹0.14 / msg</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 block text-[11px]">Firebase Push</span>
                <strong className="text-slate-900 text-sm font-bold">
                  {settings.currentMonthCount.push} sent
                </strong>
                <span className="text-[10px] text-emerald-600 block mt-0.5">₹0.00 (Free)</span>
              </div>
            </div>
          </div>

          {/* Controls form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h4 className="font-bold text-slate-900 text-sm">Budget Guardrails & Auto-Pause</h4>

            <form onSubmit={handleSaveSpendSettings} className="space-y-4">
              <div className="max-w-xs">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Monthly Budget Limit (INR ₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={spendLimitInput}
                    onChange={(e) => setSpendLimitInput(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.autoPauseOnSpendLimit}
                    onChange={(e) => {
                      storageService.updateNotificationSettings({
                        autoPauseOnSpendLimit: e.target.checked,
                      });
                      triggerSaveNotice('Spend policy updated.');
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Auto-pause messaging when monthly limit is reached
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Prevents any additional paid WhatsApp or SMS messages until the limit is raised or next billing cycle begins.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.requireAdminApprovalForPaid}
                    onChange={(e) => {
                      storageService.updateNotificationSettings({
                        requireAdminApprovalForPaid: e.target.checked,
                      });
                      triggerSaveNotice('Admin confirmation requirement updated.');
                    }}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Require administrator confirmation before dispatching paid WhatsApp & SMS
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Standard collection team members must have an administrator confirm the dispatch dialog.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Save Spending Guardrails
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- TEMPLATE EDIT / CREATE MODAL --- */}
      {isTemplateModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {editingTemplate.isDefault ? 'Edit Template' : 'Create Custom Template'}
              </h3>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                storageService.updateNotificationTemplate(editingTemplate);
                setIsTemplateModalOpen(false);
                triggerSaveNotice('Template saved.');
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Channel</label>
                  <select
                    value={editingTemplate.channel}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, channel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push Notification</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Event Category</label>
                  <select
                    value={editingTemplate.eventType}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, eventType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="invoice_reminder">Invoice Reminder</option>
                    <option value="overdue_alert">Overdue Alert</option>
                    <option value="payment_confirmation">Payment Confirmation</option>
                    <option value="followup_reminder">Follow-up Reminder</option>
                  </select>
                </div>
              </div>

              {editingTemplate.channel === 'email' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Subject Line</label>
                  <input
                    type="text"
                    value={editingTemplate.subject || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white outline-none"
                  />
                </div>
              )}

              {editingTemplate.channel === 'sms' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">TRAI DLT Template ID</label>
                  <input
                    type="text"
                    placeholder="1407168..."
                    value={editingTemplate.dltTemplateId || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, dltTemplateId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white outline-none"
                  />
                </div>
              )}

              {editingTemplate.channel === 'whatsapp' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Meta WhatsApp Template Name</label>
                  <input
                    type="text"
                    placeholder="collectiq_inv_..."
                    value={editingTemplate.metaTemplateName || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, metaTemplateName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message Body</label>
                <textarea
                  rows={5}
                  required
                  value={editingTemplate.body}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, body: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer shadow-sm"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW LOG MODAL --- */}
      {viewingLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-sm">Notification Audit Payload</h4>
              <button
                onClick={() => setViewingLog(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Provider Message ID:</span>
                <strong className="font-mono text-slate-800">{viewingLog.providerMessageId || 'N/A'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Status:</span>
                <span className="font-bold text-slate-800 uppercase">{viewingLog.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient:</span>
                <span className="font-semibold text-slate-800">{viewingLog.recipientName} ({viewingLog.recipientTarget})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Channel & Provider:</span>
                <span className="text-slate-800">{viewingLog.channel.toUpperCase()} via {viewingLog.provider}</span>
              </div>
              {viewingLog.dltTemplateId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">DLT Template ID:</span>
                  <span className="font-mono text-slate-800">{viewingLog.dltTemplateId}</span>
                </div>
              )}
              {viewingLog.errorMessage && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[11px]">
                  <strong>Error:</strong> {viewingLog.errorMessage}
                </div>
              )}
              <div>
                <span className="text-slate-500 block mb-1">Delivered Content:</span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 whitespace-pre-wrap">
                  {viewingLog.content}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewingLog(null)}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* --- SEND REAL TEST WHATSAPP MESSAGE MODAL --- */}
      {isTestWaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/70 to-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Send size={15} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Send Real Test WhatsApp Message
                  </h3>
                  <p className="text-[10px] text-slate-500">Official Meta Cloud API Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTestWaModalOpen(false);
                  setTestWaFeedback(null);
                }}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-emerald-900 text-[11px] leading-relaxed">
                Dispatches the official Meta pre-approved <code>hello_world</code> template via Graph API v21.0 to verify your access token, phone ID, and connectivity.
              </div>

              {testWaFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    testWaFeedback.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {testWaFeedback.success ? (
                      <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle size={15} className="text-red-600 shrink-0" />
                    )}
                    <span>{testWaFeedback.success ? 'Success!' : 'Meta API Error'}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed whitespace-pre-wrap">{testWaFeedback.message}</p>
                  {testWaFeedback.messageId && (
                    <div className="pt-1">
                      <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Meta Message ID:</span>
                      <code className="text-[11px] font-mono font-bold text-indigo-700 break-all block">
                        {testWaFeedback.messageId}
                      </code>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Recipient Mobile Number (Indian or International) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={testWaPhoneInput}
                  onChange={(e) => setTestWaPhoneInput(e.target.value)}
                  placeholder="e.g. 9876543210 or +91 98765 43210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Note: If using Meta Sandbox / Development mode, ensure this number has been added to your allowlist under <strong>WhatsApp &gt; API Setup &gt; Step 2</strong> in Meta Developer Console.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsTestWaModalOpen(false);
                    setTestWaFeedback(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isSendingWaTest || !testWaPhoneInput.trim()}
                  onClick={handleSendTestWaMessage}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSendingWaTest ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Send Test Message</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
