import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Trash2,
  Lock,
  X,
  Loader2,
  ShieldAlert,
  Download,
  AlertCircle,
  CheckCircle2,
  Building,
  Users,
  FileText,
  CreditCard,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { accountDeletionService, DeletionImpactSummary } from '../../services/accountDeletionService';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose, onDeleted }) => {
  const { currentUser, currentBusiness, logout } = useAuth();

  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [authMethod, setAuthMethod] = useState<'google' | 'password'>('password');
  const [impact, setImpact] = useState<DeletionImpactSummary | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      setConfirmText('');
      setPassword('');
      setErrorMessage(null);
      setSuccessMessage(null);
      setAuthMethod(accountDeletionService.getAuthMethod());

      accountDeletionService.getDeletionImpact(currentUser, currentBusiness).then((data) => {
        setImpact(data);
      });
    }
  }, [isOpen, currentUser, currentBusiness]);

  if (!isOpen || !currentUser) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === 'DELETE';
  const canSubmit = isConfirmed && (authMethod === 'google' || password.trim().length > 0) && !isDeleting;

  const handleExportBackup = () => {
    const state = storageService.getState();
    const headers = ['Invoice Number,Customer,Company,Issue Date,Due Date,Amount,Paid,Balance,Status\n'];
    const rows = state.invoices.map(
      (i) =>
        `"${i.invoiceNumber}","${i.customerName}","${i.customerCompany}","${i.issueDate}","${i.dueDate}",${i.amount},${i.paidAmount},${i.balance},"${i.status}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CollectIQ_PreDeletion_Backup_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleConfirmDelete = async () => {
    if (!canSubmit) return;

    setErrorMessage(null);
    setIsDeleting(true);

    try {
      const result = await accountDeletionService.executeAccountDeletion({
        currentUser,
        currentBusiness,
        password: authMethod === 'password' ? password : undefined,
      });

      if (result.success) {
        setSuccessMessage(result.message);
        setTimeout(() => {
          logout();
          onDeleted();
        }, 1800);
      }
    } catch (err: any) {
      console.error('Account deletion failure:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while deleting your account.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-rose-200 overflow-hidden my-6">
        {/* Header Banner */}
        <div className="bg-rose-50 border-b border-rose-100 p-6 flex items-start gap-4 relative">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
            <ShieldAlert size={26} />
          </div>
          <div className="flex-1 pr-6">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full inline-block mb-1">
              Danger Zone
            </span>
            <h2 className="text-xl font-black text-slate-900 leading-tight">Permanently Delete Account</h2>
            <p className="text-xs text-rose-800/80 mt-1">
              Irreversible action. Your account and associated business data will be permanently wiped.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-rose-100/50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Deletion Blocked</span>
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block text-sm">Account Deleted</span>
                <p>{successMessage} Redirecting to login...</p>
              </div>
            </div>
          )}

          {/* Scope Explanation */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Data Scheduled For Immediate Deletion:
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2">
                <FileText size={16} className="text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block">
                    {impact?.isOwner ? `${impact.invoicesCount} Invoices` : 'Private Tasks'}
                  </span>
                  <span className="text-[11px] text-slate-500">Tax bills & items</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2">
                <Users size={16} className="text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block">
                    {impact?.isOwner ? `${impact.customersCount} Customers` : 'Profile Data'}
                  </span>
                  <span className="text-[11px] text-slate-500">Contact ledgers</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2">
                <CreditCard size={16} className="text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block">
                    {impact?.isOwner ? `${impact.paymentsCount} Payments` : 'Audit Logs'}
                  </span>
                  <span className="text-[11px] text-slate-500">Payment receipts</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2">
                <MessageSquare size={16} className="text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 block">AI Chat History</span>
                  <span className="text-[11px] text-slate-500">All saved advisor chats</span>
                </div>
              </div>
            </div>

            {/* Ownership Warning */}
            {impact?.isOwner && impact.hasOtherTeamMembers && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                <span className="font-extrabold flex items-center gap-1.5">
                  <AlertTriangle size={15} className="text-amber-600" />
                  Primary Workspace Owner Notice
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  You are the registered owner of <strong>{impact.businessName}</strong>. There are{' '}
                  <strong>{impact.teamCount - 1} other team member(s)</strong> attached to this workspace. Deleting your
                  account will permanently disband and delete this entire business workspace.
                </p>
              </div>
            )}
          </div>

          {/* Statutory Tax Compliance Warning */}
          <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold flex items-center gap-1.5 text-slate-900">
                <HelpCircle size={14} className="text-indigo-600" />
                Statutory Accounting & Tax Notice
              </span>
              <button
                type="button"
                onClick={handleExportBackup}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-800 cursor-pointer bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs"
              >
                <Download size={12} />
                Download CSV Backup
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Under GST and income tax regulations, businesses are legally required to retain commercial tax invoices,
              vouchers, and reconciliation records for a statutory retention period of 6 years. We strongly advise
              exporting your full records before proceeding.
            </p>
          </div>

          {/* Authentication & Re-auth Form */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            {authMethod === 'google' ? (
              <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs space-y-2">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <Lock size={14} className="text-indigo-600" />
                  Google Authentication Required
                </span>
                <p className="text-[11px] text-indigo-900/80">
                  You signed in via Google (<strong>{currentUser.email}</strong>). Clicking "Permanently Delete" will
                  open a Google re-authentication popup to securely verify your identity before deletion.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock size={13} className="text-slate-500" />
                  <span>Re-enter Your Current Password</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  disabled={isDeleting}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
            )}

            {/* Type DELETE to Confirm */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                To confirm, type <span className="font-mono text-rose-600 font-extrabold">DELETE</span> in the box below:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                disabled={isDeleting}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-bold uppercase tracking-wider outline-none transition-all ${
                  isConfirmed
                    ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:border-slate-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleConfirmDelete}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Verifying & Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Permanently Delete Account</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
