import React, { useState } from 'react';
import {
  LayoutGrid,
  CheckCircle2,
  Plug,
  ExternalLink,
  Settings as SettingsIcon,
  MessageSquare,
  Mail,
  CreditCard,
  FileSpreadsheet,
  BookOpen,
  Globe,
  Calendar,
  Bell,
  X,
  Lock,
} from 'lucide-react';
import { Integration } from '../../types';
import { AppState, storageService } from '../../services/storage';
import { gmailService } from '../../services/gmail';

interface IntegrationsPageProps {
  state: AppState;
}

export const IntegrationsPage: React.FC<IntegrationsPageProps> = ({ state }) => {
  const [configIntegration, setConfigIntegration] = useState<Integration | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [webhookInput, setWebhookInput] = useState('');
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);

  const getIcon = (id: string) => {
    switch (id) {
      case 'int-whatsapp':
        return <MessageSquare size={24} className="text-emerald-600" />;
      case 'int-gmail':
        return <Mail size={24} className="text-rose-600" />;
      case 'int-razorpay':
        return <CreditCard size={24} className="text-blue-600" />;
      case 'int-sheets':
        return <FileSpreadsheet size={24} className="text-emerald-700" />;
      case 'int-tally':
        return <BookOpen size={24} className="text-amber-600" />;
      case 'int-stripe':
        return <Globe size={24} className="text-indigo-600" />;
      case 'int-calendar':
        return <Calendar size={24} className="text-blue-500" />;
      default:
        return <Bell size={24} className="text-indigo-600" />;
    }
  };

  const handleToggle = (integration: Integration) => {
    if (integration.id === 'int-gmail') {
      if (integration.isConnected) {
        if (confirm(`Disconnect Google Workspace Gmail? Automated reminders using Gmail will revert to default delivery.`)) {
          gmailService.disconnectGmail();
          storageService.toggleIntegration(integration.id, false);
        }
      } else {
        setIsConnectingGmail(true);
        gmailService.connectGmail().then((res) => {
          setIsConnectingGmail(false);
          if (res.success) {
            storageService.toggleIntegration(integration.id, true, {
              connectedEmail: res.email || 'Authorized Workspace Account',
            });
          } else if (res.error) {
            alert(`Google Workspace Authorization: ${res.error}`);
          }
        });
      }
      return;
    }

    if (integration.isConnected) {
      if (confirm(`Disconnect ${integration.name}? Automated reminders using this service will pause.`)) {
        storageService.toggleIntegration(integration.id, false);
      }
    } else {
      setConfigIntegration(integration);
      setApiKeyInput(integration.config.keyId || integration.config.spreadsheetId || '');
      setWebhookInput(integration.config.webhookUrl || '');
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configIntegration) return;

    storageService.toggleIntegration(configIntegration.id, true, {
      ...configIntegration.config,
      apiKey: apiKeyInput,
      webhookUrl: webhookInput,
    });

    setConfigIntegration(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Integrations Marketplace</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Connect payment gateways, communication APIs, and ERP accounting synchronization
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
          <Plug size={14} className="text-indigo-600" />
          <span>
            {state.integrations.filter((i) => i.isConnected).length} of {state.integrations.length} Active Connections
          </span>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {state.integrations.map((item) => {
          return (
            <div
              key={item.id}
              className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                item.isConnected
                  ? 'bg-white border-[#d8dbf4] shadow-[0_4px_20px_rgba(79,70,229,0.03)] ring-1 ring-indigo-500/10'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {getIcon(item.id)}
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      item.isConnected
                        ? 'bg-[#dcfce7] text-[#16a34a]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.isConnected && <CheckCircle2 size={11} />}
                    {item.isConnected ? 'Connected' : 'Available'}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-sm">{item.name}</h3>
                <p className="text-xs text-slate-500 mt-1 min-h-[44px] leading-relaxed">
                  {item.description}
                </p>

                {/* Connected Account Badge if Gmail */}
                {item.id === 'int-gmail' && item.isConnected && item.config?.connectedEmail && (
                  <div className="mt-2 p-2 rounded-xl bg-rose-50/80 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center justify-between">
                    <span className="truncate">Account: {item.config.connectedEmail}</span>
                    <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold uppercase">OAuth</span>
                  </div>
                )}

                {/* Features */}
                <div className="space-y-1.5 my-3.5 pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
                  {item.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-indigo-500" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {item.isConnected ? (
                  <>
                    {item.id !== 'int-gmail' ? (
                      <button
                        onClick={() => {
                          setConfigIntegration(item);
                          setApiKeyInput(item.config.keyId || item.config.spreadsheetId || '');
                          setWebhookInput(item.config.webhookUrl || '');
                        }}
                        className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                      >
                        <SettingsIcon size={13} />
                        <span>Configure</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>Workspace Active</span>
                      </span>
                    )}
                    <button
                      onClick={() => handleToggle(item)}
                      className="py-1 px-3 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleToggle(item)}
                    disabled={item.id === 'int-gmail' && isConnectingGmail}
                    className={`w-full py-2 px-3 rounded-xl text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                      item.id === 'int-gmail'
                        ? 'bg-rose-600 hover:bg-rose-700 disabled:opacity-60'
                        : 'bg-slate-900 hover:bg-slate-800'
                    }`}
                  >
                    <Plug size={13} />
                    <span>
                      {item.id === 'int-gmail'
                        ? isConnectingGmail
                          ? 'Authorizing with Google...'
                          : 'Connect Google Gmail'
                        : 'Connect Integration'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      {configIntegration && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                {getIcon(configIntegration.id)}
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{configIntegration.name}</h3>
                  <p className="text-xs text-slate-500">Configure credentials & webhooks</p>
                </div>
              </div>
              <button
                onClick={() => setConfigIntegration(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  API Key / OAuth Client ID / Account Ref
                </label>
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter production API key or Client Token"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Webhook URL Endpoint</label>
                <input
                  type="text"
                  value={webhookInput}
                  onChange={(e) => setWebhookInput(e.target.value)}
                  placeholder="https://api.collectiq.io/webhooks/listener"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800 outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                <span className="font-bold flex items-center gap-1 mb-0.5">
                  <Lock size={12} /> Secure Storage
                </span>
                Credentials are encrypted using AES-256 with role-restricted access.
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfigIntegration(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold shadow-sm"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
