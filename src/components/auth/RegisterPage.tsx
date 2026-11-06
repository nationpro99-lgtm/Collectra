import React, { useState } from 'react';
import {
  User,
  Building2,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { CollectIQLogo } from '../common/Graphics';
import { FinancialAuthIllustration } from '../common/AuthGraphics';
import { useAuth } from '../../context/AuthContext';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
  const { registerBusiness, loginWithGoogle, error, clearError, isLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!fullName.trim()) {
      setValidationError('Please enter your full name.');
      return;
    }
    if (!businessName.trim()) {
      setValidationError('Please enter your business or company name.');
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setValidationError('Please enter a valid business email address.');
      return;
    }
    if (!phone.trim()) {
      setValidationError('Please enter your contact phone number.');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match. Please re-type your password.');
      return;
    }
    if (!agreeTerms) {
      setValidationError('You must agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setIsSubmitting(true);
    const result = await registerBusiness({
      fullName: fullName.trim(),
      businessName: businessName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
    });
    setIsSubmitting(false);

    if (!result.success && result.error) {
      setValidationError(result.error);
    }
  };

  const handleGoogleRegister = async () => {
    setValidationError(null);
    clearError();
    setIsGoogleSubmitting(true);
    const res = await loginWithGoogle();
    setIsGoogleSubmitting(false);
    if (!res.success && res.error) {
      setValidationError(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2f2fd] via-[#f7f8fe] to-[#ebeffd] text-slate-800 flex items-center justify-center p-4 sm:p-6 lg:p-8 antialiased">
      <div className="w-full max-w-6xl bg-white/80 backdrop-blur-md rounded-3xl border border-[#e2e4f5] shadow-2xl shadow-indigo-100/70 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[720px]">
        {/* Left Column: SaaS Value & Illustration */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#f8f9ff] via-[#f0f2fe] to-[#e8ebfc] p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#e5e7f7] relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <CollectIQLogo size={40} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/80 border border-indigo-200/70 text-indigo-700 text-xs font-semibold mb-3">
              <Sparkles size={13} className="text-indigo-600 fill-indigo-300" />
              <span>Multi-Tenant Business Setup</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Create your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]">
                CollectIQ Business Account
              </span>
            </h1>
            <p className="mt-2 text-slate-600 text-xs sm:text-sm leading-relaxed">
              Every business gets an isolated workspace with dedicated invoice ledgers, customer tracking, and automated reminders.
            </p>
          </div>

          <div className="my-6 relative z-10 flex items-center justify-center">
            <FinancialAuthIllustration className="w-full max-w-xs drop-shadow-md" />
          </div>

          <div className="relative z-10 space-y-2 pt-3 border-t border-indigo-100/80">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>Independent tenant data & enterprise security</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>Free 7-day trial with all premium AI features</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
              <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
              <span>No credit card required to start</span>
            </div>
          </div>
        </div>

        {/* Right Column: Registration Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white overflow-y-auto">
          <div className="max-w-lg w-full mx-auto space-y-5">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Get Started with CollectIQ
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Enter your details to create your company workspace.
              </p>
            </div>

            {/* Error banner */}
            {(validationError || error) && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                <div className="flex-1">
                  <p className="font-semibold">Registration notice</p>
                  <p className="mt-0.5 text-red-600">{validationError || error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User size={15} />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Priya Nair"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Business Name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Business / Company Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 size={15} />
                    </div>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Acme Tech Solutions"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Business Email */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Business Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={15} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="accounts@acme.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone size={15} />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={15} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={15} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 leading-snug">
                    I agree to the <span className="text-indigo-600 font-semibold underline">Terms and Conditions</span> and{' '}
                    <span className="text-indigo-600 font-semibold underline">Privacy Policy</span>.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#4338ca] hover:from-[#4338ca] hover:to-[#3730a3] text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating your business account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0">
                or sign up with
              </span>
            </div>

            {/* Google Signup */}
            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={isGoogleSubmitting || isLoading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 shadow-xs transition-colors cursor-pointer"
            >
              {isGoogleSubmitting ? (
                <Loader2 size={16} className="animate-spin text-slate-500" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* Back to Sign In */}
            <div className="pt-2 text-center">
              <p className="text-xs text-slate-500">
                Already have a CollectIQ account?{' '}
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
