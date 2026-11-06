import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { CollectIQLogo } from '../common/Graphics';
import { FinancialAuthIllustration } from '../common/AuthGraphics';
import { useAuth } from '../../context/AuthContext';

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateToRegister,
  onNavigateToForgotPassword,
}) => {
  const { loginWithEmail, loginWithGoogle, error, clearError, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!email.trim()) {
      setValidationError('Please enter your business email address.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setValidationError('Please enter a valid business email address.');
      return;
    }
    if (!password) {
      setValidationError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    const result = await loginWithEmail(email.trim(), password, rememberMe);
    setIsSubmitting(false);

    if (!result.success && result.error) {
      setValidationError(result.error);
    }
  };

  const handleGoogleSignIn = async () => {
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
      <div className="w-full max-w-6xl bg-white/80 backdrop-blur-md rounded-3xl border border-[#e2e4f5] shadow-2xl shadow-indigo-100/70 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
        {/* Left Column: Brand Hero & Illustration */}
        <div className="lg:col-span-6 bg-gradient-to-b from-[#f8f9ff] via-[#f0f2fe] to-[#e8ebfc] p-8 sm:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#e5e7f7] relative overflow-hidden">
          {/* Subtle Ambient Glows */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <CollectIQLogo size={42} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/80 border border-indigo-200/70 text-indigo-700 text-xs font-semibold mb-4">
              <Sparkles size={13} className="text-indigo-600 fill-indigo-300" />
              <span>Smart B2B Debt Collections & Invoice SaaS</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4f46e5] to-[#7c3aed]">CollectIQ</span>
            </h1>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed max-w-md">
              Simplify invoice management. Accelerate payment collections. Grow your business with predictive AI insights.
            </p>
          </div>

          {/* Center Graphic */}
          <div className="my-6 relative z-10 flex items-center justify-center">
            <FinancialAuthIllustration className="w-full max-w-sm drop-shadow-lg" />
          </div>

          {/* Bottom 3 Core Pillars */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-indigo-100/80">
            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/60 border border-indigo-50">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4f46e5] flex items-center justify-center shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">Smart Invoicing</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Real-time status</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/60 border border-indigo-50">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4f46e5] flex items-center justify-center shrink-0">
                <Zap size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">Auto Reminders</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">WhatsApp & UPI</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/60 border border-indigo-50">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4f46e5] flex items-center justify-center shrink-0">
                <TrendingUp size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">Real-time Insights</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Cash flow charts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Form Card */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome Back
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Sign in to your CollectIQ business account to manage your receivables.
              </p>
            </div>

            {/* Error alerts */}
            {(validationError || error) && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                <div className="flex-1">
                  <p className="font-semibold">Sign in notice</p>
                  <p className="mt-0.5 text-red-600">{validationError || error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Business Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail size={17} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={onNavigateToForgotPassword}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={17} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-600">Remember this device</span>
                </label>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  256-bit encrypted
                </span>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#4338ca] hover:from-[#4338ca] hover:to-[#3730a3] text-white font-semibold text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    <span>Signing in to CollectIQ...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-xs font-medium text-slate-400 uppercase tracking-wider shrink-0">
                or sign in with
              </span>
            </div>

            {/* Social & Demo Login */}
            <div className="space-y-2.5">
              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
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
            </div>

            {/* Footer Sign Up Link */}
            <div className="pt-2 text-center">
              <p className="text-xs text-slate-500">
                Don&apos;t have an account yet?{' '}
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                >
                  Create an Account
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
