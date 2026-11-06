import React from 'react';
import { AppState } from '../../services/storage';

interface InvoiceStatusDonutProps {
  state: AppState;
}

export const InvoiceStatusDonut: React.FC<InvoiceStatusDonutProps> = ({ state }) => {
  const total = state.invoices.length;
  const paid = state.invoices.filter((i) => i.status === 'paid').length;
  const overdue = state.invoices.filter((i) => i.status === 'overdue').length;
  const pending = state.invoices.filter((i) => i.status === 'pending').length;

  const paidPct = total > 0 ? Math.round((paid / total) * 100) : 0;
  const overduePct = total > 0 ? Math.round((overdue / total) * 100) : 0;
  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;

  // Donut geometry
  const radius = 46;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // ~289.02

  const paidStroke = (paidPct / 100) * circumference;
  const overdueStroke = (overduePct / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e8e9f5] shadow-[0_4px_20px_rgba(79,70,229,0.03)] flex flex-col justify-between">
      {/* Header */}
      <h3 className="font-bold text-slate-800 text-sm mb-2">Invoice Status</h3>

      <div className="flex items-center justify-between gap-4 my-auto">
        {/* Donut Chart */}
        <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Background ring */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth={strokeWidth}
              opacity="0.3"
            />
            {/* Paid segment (Emerald green) */}
            {paidPct > 0 && (
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#10b981"
                strokeWidth={strokeWidth}
                strokeDasharray={`${paidStroke} ${circumference}`}
                strokeDashoffset={0}
                className="transition-all duration-700 ease-out"
              />
            )}
            {/* Overdue segment (Orange) */}
            {overduePct > 0 && (
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={strokeWidth}
                strokeDasharray={`${overdueStroke} ${circumference}`}
                strokeDashoffset={-paidStroke}
                className="transition-all duration-700 ease-out"
              />
            )}
          </svg>

          {/* Center text */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-xl font-black text-slate-900 leading-none">{total}</span>
            <span className="text-[11px] font-semibold text-slate-400 mt-0.5">Total</span>
          </div>
        </div>

        {/* Legend list */}
        <div className="space-y-2.5 flex-1 pr-1">
          {/* Paid */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] shrink-0" />
              <span>Paid</span>
            </div>
            <span className="text-slate-800">
              {paid} <span className="text-slate-400 text-[11px]">({paidPct}%)</span>
            </span>
          </div>

          {/* Overdue */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shrink-0" />
              <span>Overdue</span>
            </div>
            <span className="text-slate-800">
              {overdue} <span className="text-slate-400 text-[11px]">({overduePct}%)</span>
            </span>
          </div>

          {/* Pending */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#cbd5e1] shrink-0" />
              <span>Pending</span>
            </div>
            <span className="text-slate-800">
              {pending} <span className="text-slate-400 text-[11px]">({pendingPct}%)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
