import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Download,
  Search,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Filter,
  FileSpreadsheet,
  Receipt,
} from 'lucide-react';
import { Payment } from '../../types';
import { AppState, storageService } from '../../services/storage';

interface PaymentsPageProps {
  state: AppState;
  onOpenRecordPayment: () => void;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({ state, onOpenRecordPayment }) => {
  const currency = state.settings.currencySymbol || '₹';

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // Metrics
  const totalCollected = state.payments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const receivedToday = state.payments
    .filter((p) => p.paymentDate.toLowerCase().includes('today') || p.paymentDate.includes(todayStr))
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingCount = state.payments.filter((p) => p.status === 'pending').length;
  const reconciledCount = state.payments.filter((p) => p.reconciliationStatus === 'reconciled').length;

  const filtered = state.payments.filter((p) => {
    const matchMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      p.transactionId.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      p.invoiceNumber.toLowerCase().includes(q);
    return matchMethod && matchSearch;
  });

  const handleExportCSV = () => {
    const headers = ['Transaction ID,Customer,Invoice,Date,Method,Amount,Status,Reconciliation\n'];
    const rows = state.payments.map(
      (p) =>
        `"${p.transactionId}","${p.customerName}","${p.invoiceNumber}","${p.paymentDate}","${p.paymentMethod}",${p.amount},"${p.status}","${p.reconciliationStatus}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CollectIQ_Payments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Payments & Reconciliation
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time ledger reconciliation across UPI, NEFT, RTGS and Gateways
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Export Statement</span>
          </button>
          <button
            onClick={onOpenRecordPayment}
            className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>Record Manual Remittance</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Collected
          </span>
          <p className="text-xl font-black text-emerald-600 mt-0.5">
            {currency}
            {totalCollected.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Received Today
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">
            {currency}
            {receivedToday.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Reconciled Transactions
          </span>
          <p className="text-xl font-black text-indigo-600 mt-0.5">{reconciledCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Pending Clearance
          </span>
          <p className="text-xl font-black text-slate-500 mt-0.5">{pendingCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#e8e9f5] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transaction ID, customer or invoice..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Method:</span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">All Methods</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-[#e8e9f5] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fe] border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3.5 px-4">Transaction ID</th>
                <th className="py-3.5 px-4">Customer & Account</th>
                <th className="py-3.5 px-3">Linked Invoice</th>
                <th className="py-3.5 px-3">Remittance Date</th>
                <th className="py-3.5 px-3">Method</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No payments recorded yet.
                  </td>
                </tr>
              ) : (
                filtered.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                    {pay.transactionId}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{pay.customerName}</td>
                  <td className="py-3.5 px-3 font-semibold text-indigo-600">
                    {pay.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 font-medium">{pay.paymentDate}</td>
                  <td className="py-3.5 px-3 text-slate-700 font-semibold">{pay.paymentMethod}</td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                    +{currency}
                    {pay.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#16a34a] inline-block">
                      Reconciled
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedReceipt(pay)}
                      className="py-1 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 cursor-pointer inline-flex items-center gap-1"
                    >
                      <Receipt size={13} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Preview Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Payment Voucher</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {selectedReceipt.transactionId}
              </p>
            </div>

            <div className="py-4 space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Remitted By:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Invoice Cleared:</span>
                <span className="font-bold text-indigo-600">{selectedReceipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date & Time:</span>
                <span className="font-semibold">{selectedReceipt.paymentDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-semibold">{selectedReceipt.paymentMethod}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between font-black text-base text-slate-900">
                <span>Remitted Amount:</span>
                <span className="text-emerald-600">
                  {currency}
                  {selectedReceipt.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white cursor-pointer"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
