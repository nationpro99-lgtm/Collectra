import React, { useState } from 'react';
import { X, Check, Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { CrownPedestalGraphic } from '../common/Graphics';
import { storageService } from '../../services/storage';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanUpgraded?: (plan: string) => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onPlanUpgraded }) => {
  if (!isOpen) return null;

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedPlan, setSelectedPlan] = useState<'Starter' | 'Pro' | 'Enterprise'>('Pro');

  const plans = [
    {
      name: 'Starter',
      priceMonthly: 2499,
      priceYearly: 1999,
      description: 'Ideal for growing agencies & small business ledgers.',
      features: [
        'Up to 100 invoices/month',
        'Standard Email & SMS reminders',
        'Automated payment tracking',
        'Basic collection reports',
        '2 team seats',
      ],
      popular: false,
    },
    {
      name: 'Pro',
      priceMonthly: 5999,
      priceYearly: 4799,
      description: 'Full AI automation & omnichannel WhatsApp recovery.',
      features: [
        'Unlimited invoices & customers',
        'AI Speech & WhatsApp Business API',
        'Promise to Pay escalation bots',
        'Two-way Google Sheets & ERP sync',
        'Smart aging risk score algorithm',
        '10 team seats with RBAC',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      priceMonthly: 14999,
      priceYearly: 11999,
      description: 'Bespoke reconciliation, custom APIs & dedicated SLA.',
      features: [
        'Unlimited multi-entity business units',
        'Custom ERP & Tally Prime integration',
        'Dedicated collection account manager',
        'Custom legal escalation templates',
        '99.9% uptime SLA & audit trails',
        'Unlimited seats',
      ],
      popular: false,
    },
  ];

  const handleUpgrade = (planName: string) => {
    storageService.updateSettings({
      currentPlan: planName as any,
      trialDaysLeft: 365,
    });

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.5 },
      });
    } catch {
      // Ignored
    }

    onPlanUpgraded?.(planName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Banner */}
        <div className="relative bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-bold mb-3 border border-indigo-400/20">
              <Sparkles size={13} className="text-amber-400" />
              <span>COLLECTIQ PREMIUM TIER</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Accelerate Cash Flow With Autonomous Collections
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 mt-2 leading-relaxed">
              Recover debts 40% faster with automated WhatsApp delivery confirmations, AI tone customization, and instant UPI reconciliation.
            </p>
          </div>

          <CrownPedestalGraphic className="w-28 h-28 shrink-0 relative z-10 drop-shadow-2xl" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Billing cycle toggle */}
        <div className="p-6 pb-2 flex items-center justify-center">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-extrabold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="p-6 pt-3 grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p) => {
            const price = billingCycle === 'yearly' ? p.priceYearly : p.priceMonthly;
            const isSelected = selectedPlan === p.name;

            return (
              <div
                key={p.name}
                onClick={() => setSelectedPlan(p.name as any)}
                className={`relative rounded-2xl p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  p.popular
                    ? 'border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    Recommended
                  </span>
                )}

                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{p.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 min-h-[32px]">{p.description}</p>

                  <div className="my-4 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ month</span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {p.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <Check size={14} className="text-emerald-600 stroke-[2.5] mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpgrade(p.name);
                  }}
                  className={`mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
                    p.popular
                      ? 'bg-[#4f46e5] hover:bg-[#4338ca] text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  <span>Select {p.name}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
