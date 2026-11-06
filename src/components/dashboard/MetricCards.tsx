import React from 'react';
import { FileText, Clock, CheckCircle2, ArrowUp, ArrowRight } from 'lucide-react';
import { AppState } from '../../services/storage';

interface MetricCardsProps {
  state: AppState;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ state }) => {
  const currency = state.settings.currencySymbol || '₹';

  // 1. Total Outstanding = actual unpaid invoice balances
  const totalOutstanding = state.invoices.reduce(
    (sum, inv) => sum + (inv.status !== 'paid' ? inv.balance : 0),
    0
  );

  // 2. Overdue Amount = actual overdue invoice balances
  const overdueInvoices = state.invoices.filter((inv) => inv.status === 'overdue');
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.balance, 0);

  // 3. Collected This Month = actual confirmed payments received during the current calendar month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const collectedThisMonth = state.payments
    .filter((p) => {
      if (p.status !== 'success') return false;
      const d = new Date(p.paymentDate);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  // 4. Collection Rate = total confirmed payments / total applicable billed value * 100
  const totalBilled = state.invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCollectedAllTime = state.payments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0);

  const collectionRate =
    totalBilled > 0 ? Math.min(100, Math.round((totalCollectedAllTime / totalBilled) * 100)) : 0;

  const totalInvoices = state.invoices.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. Total Outstanding */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e9f5] shadow-[0_4px_20px_rgba(79,70,229,0.03)] hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#ecebfd] text-[#4f46e5] flex items-center justify-center shrink-0">
              <FileText size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Outstanding</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {currency}
                  {totalOutstanding.toLocaleString('en-IN')}
                </h3>
                {totalOutstanding > 0 && (
                  <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    <ArrowUp size={11} className="stroke-[3] mr-0.5" />
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-3 font-medium">
          {totalInvoices === 0 ? 'No invoices yet' : `Across ${totalInvoices} ${totalInvoices === 1 ? 'invoice' : 'invoices'}`}
        </p>
      </div>

      {/* 2. Overdue Amount */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e9f5] shadow-[0_4px_20px_rgba(79,70,229,0.03)] hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#fee2e2] text-[#ef4444] flex items-center justify-center shrink-0">
              <Clock size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Overdue Amount</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {currency}
                  {overdueAmount.toLocaleString('en-IN')}
                </h3>
                {overdueInvoices.length > 0 && (
                  <span className="inline-flex items-center text-xs font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                    {overdueInvoices.length} due
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-3 font-medium">
          {overdueInvoices.length === 0 ? '0 overdue invoices' : `${overdueInvoices.length} overdue ${overdueInvoices.length === 1 ? 'invoice' : 'invoices'}`}
        </p>
      </div>

      {/* 3. Collected This Month */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e9f5] shadow-[0_4px_20px_rgba(79,70,229,0.03)] hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#dcfce7] text-[#16a34a] flex items-center justify-center shrink-0">
              <CheckCircle2 size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Collected This Month</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {currency}
                  {collectedThisMonth.toLocaleString('en-IN')}
                </h3>
              </div>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-3 font-medium">
          {collectedThisMonth > 0 ? 'Confirmed remittances' : 'No payments this month'}
        </p>
      </div>

      {/* 4. Collection Rate with Circular Ring Gauge */}
      <div className="bg-white rounded-2xl p-5 border border-[#e8e9f5] shadow-[0_4px_20px_rgba(79,70,229,0.03)] hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Circular Gauge */}
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                {/* Background Ring */}
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Active Progress Ring */}
                <path
                  className="text-[#4f46e5] transition-all duration-1000 ease-out"
                  strokeDasharray={`${collectionRate}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-black text-slate-900 text-xs">
                {collectionRate}%
              </span>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500">Collection Rate</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs font-bold text-slate-700">
                  {collectionRate >= 70 ? 'On Target' : 'Benchmark'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                Target: &gt; 70%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
