import React, { useState } from 'react';
import { Lightbulb, ChevronDown, TrendingUp, CheckCircle } from 'lucide-react';
import { AppState } from '../../services/storage';

interface CollectionInsightsCardProps {
  state: AppState;
}

export const CollectionInsightsCard: React.FC<CollectionInsightsCardProps> = ({ state }) => {
  const [period, setPeriod] = useState<'This Month' | 'All Time'>('This Month');
  const [isOpen, setIsOpen] = useState(false);

  const totalInvoices = state.invoices.length;
  const overdueInvoices = state.invoices.filter((i) => i.status === 'overdue');
  const totalBilled = state.invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCollected = state.payments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0);

  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e8e9f5] shadow-[0_4px_20px_rgba(79,70,229,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Lightbulb size={18} className="stroke-[2.2]" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Collection Insights</h3>
        </div>

        {/* Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span>{period}</span>
            <ChevronDown size={13} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 top-full mt-1 w-28 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20">
              <button
                onClick={() => {
                  setPeriod('This Month');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 cursor-pointer"
              >
                This Month
              </button>
              <button
                onClick={() => {
                  setPeriod('All Time');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 cursor-pointer"
              >
                All Time
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex items-center justify-between gap-4 my-auto">
        {totalInvoices === 0 ? (
          <div className="w-full bg-[#f8fafc] border border-slate-100 rounded-xl p-3 text-center">
            <p className="text-xs font-medium text-slate-500">
              No financial data available yet.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Create invoices and record payments to generate AI collection insights.
            </p>
          </div>
        ) : (
          <>
            {/* Mini 3D bar chart vector */}
            <div className="w-24 h-16 shrink-0 flex items-end">
              <svg viewBox="0 0 100 60" className="w-full h-full">
                <defs>
                  <linearGradient id="miniBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#c7d2fe" />
                  </linearGradient>
                </defs>
                <rect x="5" y="42" width="12" height="18" rx="3" fill="#c7d2fe" />
                <rect x="25" y="32" width="12" height="28" rx="3" fill="#a5b4fc" />
                <rect x="45" y="24" width="12" height="36" rx="3" fill="#818cf8" />
                <rect x="65" y="10" width="12" height="50" rx="3" fill="#4f46e5" />
                <path
                  d="M 5 45 Q 40 38 72 8"
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <polygon points="72,5 77,12 68,11" fill="#4f46e5" />
              </svg>
            </div>

            {/* Highlight text card */}
            <div className="flex-1 bg-[#f8fafc] border border-slate-100 rounded-xl p-3">
              <div className="flex items-start gap-1.5 text-emerald-600 font-bold text-xs mb-1">
                {collectionRate >= 70 ? (
                  <TrendingUp size={14} className="stroke-[2.5] shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle size={14} className="stroke-[2.5] shrink-0 mt-0.5" />
                )}
                <span className="leading-tight">
                  Collection efficiency rate is{' '}
                  <span className="underline decoration-emerald-300">{collectionRate}%</span>.
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                {overdueInvoices.length > 0
                  ? `${overdueInvoices.length} invoices are currently overdue and need follow-up.`
                  : 'All issued invoices are currently settled or within due dates.'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
