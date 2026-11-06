import React, { useState } from 'react';
import {
  Handshake,
  Plus,
  CheckCircle2,
  Calendar,
  AlertCircle,
  CreditCard,
  Edit2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { PromiseToPay, PromiseStatus } from '../../types';
import { AppState, storageService } from '../../services/storage';

interface PromisesToPayPageProps {
  state: AppState;
  onOpenRecordPromise: () => void;
  onRecordPayment: (ptp: PromiseToPay) => void;
}

export const PromisesToPayPage: React.FC<PromisesToPayPageProps> = ({
  state,
  onOpenRecordPromise,
  onRecordPayment,
}) => {
  const currency = state.settings.currencySymbol || '₹';

  const [filter, setFilter] = useState<'all' | 'pending' | 'fulfilled' | 'overdue'>('all');

  const totalPromised = state.promisesToPay.reduce((sum, p) => sum + p.promisedAmount, 0);
  const pendingCount = state.promisesToPay.filter((p) => p.status === 'pending').length;
  const fulfilledCount = state.promisesToPay.filter((p) => p.status === 'fulfilled').length;
  const brokenCount = state.promisesToPay.filter((p) => p.status === 'overdue').length;

  const filtered = state.promisesToPay.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const handleMarkBroken = (id: string) => {
    storageService.updatePromise(id, { status: 'overdue' });
  };

  const handleMarkFulfilled = (ptp: PromiseToPay) => {
    onRecordPayment(ptp);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Promise-to-Pay (PTP) Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Track voluntary settlement commitments and eliminate broken payment cycles
          </p>
        </div>

        <button
          onClick={onOpenRecordPromise}
          className="py-2 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <Plus size={16} />
          <span>Record New Commitment</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Committed
          </span>
          <p className="text-xl font-black text-indigo-700 mt-0.5">
            {currency}
            {totalPromised.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Pending Commitments
          </span>
          <p className="text-xl font-black text-amber-600 mt-0.5">{pendingCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Fulfilled & Paid
          </span>
          <p className="text-xl font-black text-emerald-600 mt-0.5">{fulfilledCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Broken Promises
          </span>
          <p className="text-xl font-black text-rose-600 mt-0.5">{brokenCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {(['all', 'pending', 'fulfilled', 'overdue'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
              filter === st
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st === 'all' ? 'All Promises' : st === 'overdue' ? 'Broken Promises' : st}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e8e9f5] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fe] border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Linked Invoice</th>
                <th className="py-3.5 px-4 text-right">Promised Amount</th>
                <th className="py-3.5 px-3">Promised Date</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4">Notes & Follow-up</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No payment commitments yet.
                  </td>
                </tr>
              ) : (
                filtered.map((ptp) => {
                const isFulfilled = ptp.status === 'fulfilled';
                const isOverdue = ptp.status === 'overdue';

                return (
                  <tr key={ptp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{ptp.customerName}</td>
                    <td className="py-3.5 px-4 text-indigo-600 font-semibold">{ptp.invoiceNumber}</td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {currency}
                      {ptp.promisedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-700">{ptp.promisedDate}</td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize inline-block ${
                          isFulfilled
                            ? 'bg-[#dcfce7] text-[#16a34a]'
                            : isOverdue
                            ? 'bg-[#fee2e2] text-[#ef4444]'
                            : 'bg-[#fef3c7] text-[#d97706]'
                        }`}
                      >
                        {ptp.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs text-slate-500 truncate font-medium">
                      {ptp.notes || ptp.followUpAction || 'No notes'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isFulfilled && (
                          <button
                            onClick={() => handleMarkFulfilled(ptp)}
                            className="py-1 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <CreditCard size={13} />
                            <span>Remitted</span>
                          </button>
                        )}
                        {ptp.status === 'pending' && (
                          <button
                            onClick={() => handleMarkBroken(ptp.id)}
                            className="py-1 px-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-[11px] font-semibold cursor-pointer"
                          >
                            Mark Broken
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
