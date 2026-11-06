import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { AppState } from '../../services/storage';

interface AnalyticsPageProps {
  state: AppState;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ state }) => {
  const currency = state.settings.currencySymbol || '₹';
  const [timeRange, setTimeRange] = useState<'6m' | '12m' | 'ytd'>('6m');

  const todayStr = new Date().toISOString().split('T')[0];

  // Dynamic calculations
  const totalBilled = state.invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalOutstanding = state.invoices.reduce(
    (sum, i) => sum + (i.status !== 'paid' ? i.balance : 0),
    0
  );
  const totalCollected = state.payments.reduce((sum, p) => sum + p.amount, 0);

  const overdueInvoices = state.invoices.filter(
    (i) => i.status === 'overdue' || (i.dueDate < todayStr && i.balance > 0)
  );
  const overdueTotal = overdueInvoices.reduce((sum, i) => sum + i.balance, 0);

  const cei = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // DSO: (Total Receivables / Total Credit Sales) * 30 days
  const dso = totalBilled > 0 ? Math.round((totalOutstanding / totalBilled) * 30) : 0;

  // Promise Fulfillment Rate
  const totalPromises = state.promisesToPay.length;
  const fulfilledPromises = state.promisesToPay.filter((p) => p.status === 'fulfilled').length;
  const promiseRate = totalPromises > 0 ? Math.round((fulfilledPromises / totalPromises) * 100) : 0;

  // Calculate dynamic aging buckets
  const unpaidInvoices = state.invoices.filter((i) => i.status !== 'paid' && i.balance > 0);

  const buckets = {
    under30: { count: 0, amount: 0 },
    b31_60: { count: 0, amount: 0 },
    b61_90: { count: 0, amount: 0 },
    over90: { count: 0, amount: 0 },
  };

  unpaidInvoices.forEach((inv) => {
    const days = inv.overdueDays || 0;
    if (days <= 30) {
      buckets.under30.count += 1;
      buckets.under30.amount += inv.balance;
    } else if (days <= 60) {
      buckets.b31_60.count += 1;
      buckets.b31_60.amount += inv.balance;
    } else if (days <= 90) {
      buckets.b61_90.count += 1;
      buckets.b61_90.amount += inv.balance;
    } else {
      buckets.over90.count += 1;
      buckets.over90.amount += inv.balance;
    }
  });

  const agingBuckets = [
    {
      label: '< 30 Days',
      amount: buckets.under30.amount,
      count: buckets.under30.count,
      pct: totalOutstanding > 0 ? Math.round((buckets.under30.amount / totalOutstanding) * 100) : 0,
      color: 'bg-emerald-500',
    },
    {
      label: '31 - 60 Days',
      amount: buckets.b31_60.amount,
      count: buckets.b31_60.count,
      pct: totalOutstanding > 0 ? Math.round((buckets.b31_60.amount / totalOutstanding) * 100) : 0,
      color: 'bg-indigo-500',
    },
    {
      label: '61 - 90 Days',
      amount: buckets.b61_90.amount,
      count: buckets.b61_90.count,
      pct: totalOutstanding > 0 ? Math.round((buckets.b61_90.amount / totalOutstanding) * 100) : 0,
      color: 'bg-amber-500',
    },
    {
      label: '90+ Days',
      amount: buckets.over90.amount,
      count: buckets.over90.count,
      pct: totalOutstanding > 0 ? Math.round((buckets.over90.amount / totalOutstanding) * 100) : 0,
      color: 'bg-rose-500',
    },
  ];

  // Dynamic payment methods distribution
  const methodMap: Record<string, number> = {};
  state.payments.forEach((p) => {
    const m = p.paymentMethod || 'Other';
    methodMap[m] = (methodMap[m] || 0) + p.amount;
  });

  const methodColors: Record<string, string> = {
    'UPI': 'bg-indigo-600',
    'Bank Transfer (NEFT/RTGS)': 'bg-emerald-600',
    'Credit Card': 'bg-blue-500',
    'Cheque': 'bg-amber-500',
  };

  const paymentMethodsDist = Object.keys(methodMap).map((method) => {
    const amount = methodMap[method];
    const pct = totalCollected > 0 ? Math.round((amount / totalCollected) * 100) : 0;
    return {
      method,
      amount,
      pct,
      color: methodColors[method] || 'bg-slate-500',
    };
  });

  const highRiskTotal = buckets.b61_90.amount + buckets.over90.amount;

  const handleDownloadReport = (type: string) => {
    const reportData = `CollectIQ Finance Intelligence Report - ${type}\nGenerated: ${new Date().toLocaleString()}\nCurrency: ${currency}\nCollection Efficiency Rate: ${cei}%\nTotal Collected: ${currency}${totalCollected.toLocaleString('en-IN')}\nTotal Outstanding: ${currency}${totalOutstanding.toLocaleString('en-IN')}\nOverdue: ${currency}${overdueTotal.toLocaleString('en-IN')}`;
    const blob = new Blob([reportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CollectIQ_${type.replace(/\s+/g, '_')}_Report.txt`;
    a.click();
  };

  const hasData = state.invoices.length > 0 || state.payments.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Analytics & Collections Reports
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time aging schedules, DSO metrics, recovery velocity, and liquidity insights
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold text-slate-700">
            {(['6m', '12m', 'ytd'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-lg uppercase cursor-pointer transition-all ${
                  timeRange === r ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleDownloadReport('Executive Summary')}
            className="py-2 px-3.5 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white rounded-2xl p-16 border border-[#e8e9f5] shadow-2xs text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <BarChart3 size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No financial data available yet.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once you create invoices and record collections, real-time analytics, aging schedules, and collection efficiency indices will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* 4 Core Financial Health Indices */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* CEI */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Collection Efficiency (CEI)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-black text-slate-900">{cei}%</h3>
                <span className="text-xs font-bold text-emerald-600 flex items-center">
                  <ArrowUpRight size={14} />
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Target benchmark: &gt; 70%</p>
            </div>

            {/* DSO */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Days Sales Outstanding (DSO)
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-black text-slate-900">{dso} Days</h3>
                <span className="text-xs font-bold text-indigo-600 flex items-center">
                  Estimated
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Speed of cash realization</p>
            </div>

            {/* Total Collected */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Remitted
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-black text-emerald-600">
                  {currency}
                  {totalCollected.toLocaleString('en-IN')}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Confirmed settlement inflows</p>
            </div>

            {/* Recovery Success Rate */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Promise Fulfillment Rate
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-black text-indigo-600">{promiseRate}%</h3>
                <span className="text-xs font-bold text-slate-400 flex items-center">
                  {fulfilledPromises}/{totalPromises}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Follow-up conversion accuracy</p>
            </div>
          </div>

          {/* Main Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Aging Schedule Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-[#e8e9f5] shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Aging Schedule Buckets</h3>
                  <p className="text-xs text-slate-500">
                    Distribution of {currency}{totalOutstanding.toLocaleString('en-IN')} outstanding ledger
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadReport('Aging Analysis')}
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Export Aging CSV
                </button>
              </div>

              <div className="space-y-4">
                {agingBuckets.map((b) => (
                  <div key={b.label}>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-700">
                        {b.label} <span className="text-slate-400 font-normal">({b.count} invoices)</span>
                      </span>
                      <span className="text-slate-900">
                        {currency}
                        {b.amount.toLocaleString('en-IN')}{' '}
                        <span className="text-slate-400 font-medium">({b.pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${b.color} rounded-full transition-all duration-700`}
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Critical threshold alert at 60+ days</span>
                <span className="text-rose-600 font-bold">
                  {currency}{highRiskTotal.toLocaleString('en-IN')} in high risk
                </span>
              </div>
            </div>

            {/* Payment Channel Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-[#e8e9f5] shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Payment Method Distribution</h3>
                    <p className="text-xs text-slate-500">
                      Breakdown of {currency}{totalCollected.toLocaleString('en-IN')} collected remittances
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5 my-3">
                  {paymentMethodsDist.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      No payments recorded yet to display channel breakdown.
                    </p>
                  ) : (
                    paymentMethodsDist.map((m) => (
                      <div key={m.method} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                        <div className="flex justify-between items-center text-xs font-bold mb-1">
                          <span className="text-slate-800">{m.method}</span>
                          <span className="text-slate-900">
                            {currency}
                            {m.amount.toLocaleString('en-IN')} ({m.pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
                          <div className={`h-full ${m.color} rounded-full`} style={{ width: `${m.pct}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                <span>Direct reconciliation via Firestore</span>
                <span className="font-bold">Real-time</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
