import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  User,
  FileText,
  Bell,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  KeyRound,
  Lock,
} from 'lucide-react';
import { AppState, storageService } from '../../services/storage';
import { NotificationSettingsView } from '../notifications/NotificationSettingsView';
import { useAuth } from '../../context/AuthContext';

interface SettingsPageProps {
  state: AppState;
  onOpenUpgrade: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ state, onOpenUpgrade }) => {
  const { currentUser, currentBusiness } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'general' | 'profile' | 'invoice' | 'notifications' | 'billing' | 'security'
  >('general');

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [businessName, setBusinessName] = useState(state.settings.businessName);
  const [businessEmail, setBusinessEmail] = useState(state.settings.businessEmail);
  const [businessPhone, setBusinessPhone] = useState(state.settings.businessPhone);
  const [businessAddress, setBusinessAddress] = useState(state.settings.businessAddress);
  const [currencySymbol, setCurrencySymbol] = useState(state.settings.currencySymbol || '₹');
  const [timezone, setTimezone] = useState(state.settings.timezone);

  // Invoice & Bank states
  const [invoicePrefix, setInvoicePrefix] = useState(state.settings.invoicePrefix || 'INV-');
  const [defaultPaymentTermsDays, setDefaultPaymentTermsDays] = useState(
    state.settings.defaultPaymentTermsDays || 15
  );
  const [bankName, setBankName] = useState(state.settings.bankName);
  const [accountNumber, setAccountNumber] = useState(state.settings.accountNumber);
  const [ifscCode, setIfscCode] = useState(state.settings.ifscCode);
  const [upiId, setUpiId] = useState(state.settings.upiId);

  // Notification states
  const [emailNotif, setEmailNotif] = useState(state.settings.emailNotifications);
  const [whatsappNotif, setWhatsappNotif] = useState(state.settings.whatsappNotifications);
  const [dailyDigest, setDailyDigest] = useState(state.settings.dailyDigest);

  // Security
  const [twoFactor, setTwoFactor] = useState(state.settings.twoFactorEnabled);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateSettings({
      businessName,
      businessEmail,
      businessPhone,
      businessAddress,
      currencySymbol,
      timezone,
    });
    showSuccess();
  };

  const handleSaveInvoiceSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateSettings({
      invoicePrefix,
      defaultPaymentTermsDays: Number(defaultPaymentTermsDays),
      bankName,
      accountNumber,
      ifscCode,
      upiId,
    });
    showSuccess();
  };

  const handleSaveNotifications = () => {
    storageService.updateSettings({
      emailNotifications: emailNotif,
      whatsappNotifications: whatsappNotif,
      dailyDigest,
    });
    showSuccess();
  };

  const showSuccess = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetData = () => {
    if (confirm('Reset application ledger back to reference demo data? All modifications will be restored to initial state.')) {
      storageService.resetToDefault();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Configure business details, invoice defaults, banking instructions, and account security
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
        {[
          { id: 'general', label: 'General', icon: Building },
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'invoice', label: 'Invoice & Banking', icon: FileText },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
          { id: 'security', label: 'Security & Backup', icon: ShieldCheck },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon size={14} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} />
          <span>Settings successfully updated and saved!</span>
        </div>
      )}

      {/* Tab 1: General */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-2xl border border-[#e8e9f5] shadow-2xs p-6">
          <h3 className="font-extrabold text-slate-900 text-base mb-1">Company Information</h3>
          <p className="text-xs text-slate-500 mb-6">
            Details printed on customer tax invoices and legal notices
          </p>

          <form onSubmit={handleSaveGeneral} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Registered Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Billing Email</label>
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Currency</label>
                <select
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 outline-none"
                >
                  <option value="₹">₹ - Indian Rupee (INR)</option>
                  <option value="$">$ - US Dollar (USD)</option>
                  <option value="€">€ - Euro (EUR)</option>
                  <option value="£">£ - British Pound (GBP)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Business Address</label>
              <input
                type="text"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 outline-none"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold shadow-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Profile */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-[#e8e9f5] shadow-2xs p-6 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'Profile'}
                className="w-16 h-16 rounded-2xl object-cover ring-4 ring-indigo-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center ring-4 ring-indigo-100">
                {(currentUser?.displayName || 'U').substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                {currentUser?.displayName || 'User Profile'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {currentUser?.role || 'Finance Manager'} • {currentBusiness?.businessName || 'CollectIQ'}
              </p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 inline-block mt-1">
                {currentUser?.role || 'Admin'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                defaultValue={currentUser?.displayName || ''}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Login Email</label>
              <input
                type="email"
                defaultValue={currentUser?.email || ''}
                disabled
                className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-semibold text-slate-500 outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={showSuccess}
              className="px-5 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Update Profile
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Invoice & Banking */}
      {activeTab === 'invoice' && (
        <div className="bg-white rounded-2xl border border-[#e8e9f5] shadow-2xs p-6">
          <h3 className="font-extrabold text-slate-900 text-base mb-1">Invoice & Bank Reconciliation</h3>
          <p className="text-xs text-slate-500 mb-6">
            Default payment instructions included on tax invoice slips and UPI payment links
          </p>

          <form onSubmit={handleSaveInvoiceSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Invoice Number Prefix</label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Default Payment Due Days</label>
                <input
                  type="number"
                  value={defaultPaymentTermsDays}
                  onChange={(e) => setDefaultPaymentTermsDays(Number(e.target.value))}
                  min="1"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-semibold text-slate-800 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">IFSC / Routing Code</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-semibold text-slate-800 outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">UPI VPA ID for Quick QR</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-indigo-700 outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#4f46e5] text-white font-bold shadow-xs cursor-pointer"
              >
                Save Banking Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: Notifications Hub */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl border border-[#e8e9f5] shadow-xs p-6 sm:p-8">
          <NotificationSettingsView state={state} />
        </div>
      )}

      {/* Tab 5: Plan & Billing */}
      {activeTab === 'billing' && (
        <div className="bg-white rounded-2xl border border-[#e8e9f5] shadow-2xs p-6 space-y-6">
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Active Subscription
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {state.settings.currentPlan}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                {state.settings.currentPlan === 'Free Trial'
                  ? '7 Days Trial Remaining'
                  : `${state.settings.currentPlan} Plan Activated`}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full access to AI Speech, WhatsApp Automation & Unlimited Invoices
              </p>
            </div>

            <button
              onClick={onOpenUpgrade}
              className="py-2.5 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <Sparkles size={14} className="text-amber-300" />
              <span>Upgrade Plan</span>
            </button>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-3">Billing History</h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between font-bold text-slate-700">
                <span>Invoice #</span>
                <span>Date</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              <div className="p-3 flex justify-between font-medium text-slate-600">
                <span className="font-bold text-indigo-600">INV-SUB-2025-01</span>
                <span>Jun 01, 2025</span>
                <span className="font-bold">₹0.00 (Trial)</span>
                <span className="text-emerald-600 font-bold">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Security & Reset */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-[#e8e9f5] shadow-2xs p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Account Security & Sessions</h3>

            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Two-Factor Authentication (2FA)</span>
                <span className="text-[11px] text-slate-500">
                  Require an authenticator code or SMS OTP on team member sign-ins
                </span>
              </div>
              <input
                type="checkbox"
                checked={twoFactor}
                onChange={(e) => {
                  setTwoFactor(e.target.checked);
                  storageService.updateSettings({ twoFactorEnabled: e.target.checked });
                  showSuccess();
                }}
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Active Login Sessions</span>
                <span className="text-[11px] text-slate-500">Current browser: Chrome on Linux / macOS</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Active Now
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm mb-1 text-rose-600 flex items-center gap-1.5">
              <RotateCcw size={16} />
              <span>Reset Application Ledger</span>
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Reset all invoices, customers, and payments back to the exact initial CollectIQ reference state.
            </p>
            <button
              onClick={handleResetData}
              className="py-2 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer"
            >
              Reset to Reference Seed Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
