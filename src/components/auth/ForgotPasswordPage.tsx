import React, { useState } from 'react';
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { CollectIQLogo } from '../common/Graphics';
import { useAuth } from '../../context/AuthContext';

interface ForgotPasswordPageProps {
  onNavigateToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigateToLogin }) => {
  const { resetPassword, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid business email address.');
      return;
    }

    setIsSubmitting(true);
    const result = await resetPassword(email.trim());
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(
        result.message || `Password recovery instructions have been dispatched to ${email.trim()}.`
      );
    } else {
      setErrorMessage(result.error || 'Failed to dispatch password reset request.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2f2fd] via-[#f7f8fe] to-[#ebeffd] text-slate-800 flex items-center justify-center p-4 sm:p-6 antialiased">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#e2e4f5] shadow-2xl shadow-indigo-100/70 p-8 sm:p-10 relative overflow-hidden">
        {/* Ambient Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <CollectIQLogo size={42} />
          </div>
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#4f46e5] flex items-center justify-center shadow-xs">
            <KeyRound size={22} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Reset Password
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
            Enter your business email address and we&apos;ll send you instructions to reset your account password.
          </p>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
            <p className="flex-1 text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Success Notice */}
        {successMessage ? (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-bold text-emerald-900">Recovery Email Dispatched</p>
                <p className="mt-1 leading-relaxed text-emerald-700">{successMessage}</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Didn&apos;t receive the email?</p>
              <p>Check your spam or junk folder, or verify the email you provided is registered with your CollectIQ account.</p>
            </div>

            <button
              type="button"
              onClick={onNavigateToLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#4338ca] hover:from-[#4338ca] text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={16} />
              <span>Return to Sign In</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Business Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={17} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#4338ca] hover:from-[#4338ca] hover:to-[#3730a3] text-white font-semibold text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>Sending instructions...</span>
                </>
              ) : (
                <>
                  <span>Send Recovery Instructions</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Sign In</span>
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>CollectIQ Secure Authentication Shield</span>
        </div>
      </div>
    </div>
  );
};
