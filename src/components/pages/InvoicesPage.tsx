import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  CreditCard,
  Send,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import { Invoice } from '../../types';
import { AppState, storageService } from '../../services/storage';

interface InvoicesPageProps {
  state: AppState;
  onOpenCreateInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onSendReminder: (invoice: Invoice) => void;
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({
  state,
  onOpenCreateInvoice,
  onViewInvoice,
  onRecordPayment,
  onSendReminder,
}) => {
  const currency = state.settings.currencySymbol || '₹';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'overdue' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'amount' | 'invoiceNumber'>('dueDate');
  const [sortAsc, setSortAsc] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Metrics
  const totalInvoices = state.invoices.length;
  const paidInvoices = state.invoices.filter((i) => i.status === 'paid').length;
  const overdueInvoices = state.invoices.filter((i) => i.status === 'overdue').length;
  const pendingInvoices = state.invoices.filter((i) => i.status === 'pending').length;
  const totalValue = state.invoices.reduce((sum, i) => sum + i.amount, 0);

  // Filter & Search
  const filtered = state.invoices
    .filter((inv) => {
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerCompany.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'amount') {
        return sortAsc ? a.amount - b.amount : b.amount - a.amount;
      }
      if (sortBy === 'invoiceNumber') {
        return sortAsc
          ? a.invoiceNumber.localeCompare(b.invoiceNumber)
          : b.invoiceNumber.localeCompare(a.invoiceNumber);
      }
      return sortAsc ? a.dueDate.localeCompare(b.dueDate) : b.dueDate.localeCompare(a.dueDate);
    });

  const handleExportCSV = () => {
    const headers = ['Invoice Number,Customer,Company,Issue Date,Due Date,Amount,Paid,Balance,Status\n'];
    const rows = state.invoices.map(
      (i) =>
        `"${i.invoiceNumber}","${i.customerName}","${i.customerCompany}","${i.issueDate}","${i.dueDate}",${i.amount},${i.paidAmount},${i.balance},"${i.status}"\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CollectIQ_Invoices_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleDelete = (id: string) => {
    storageService.deleteInvoice(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Invoice Management</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Create, track, reconcile, and dispatch customer billing ledgers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenCreateInvoice}
            className="py-2 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* 5 Summary KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Invoices
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">{totalInvoices}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Paid</span>
          <p className="text-xl font-black text-emerald-600 mt-0.5">{paidInvoices}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Overdue
          </span>
          <p className="text-xl font-black text-rose-600 mt-0.5">{overdueInvoices}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Pending
          </span>
          <p className="text-xl font-black text-amber-600 mt-0.5">{pendingInvoices}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Value
          </span>
          <p className="text-xl font-black text-indigo-700 mt-0.5">
            {currency}
            {totalValue.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#e8e9f5] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, client or company..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'paid', 'overdue', 'pending'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Invoices' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-2xl border border-[#e8e9f5] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fe] border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th
                  onClick={() => {
                    setSortBy('invoiceNumber');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Invoice #</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-4">Customer & Company</th>
                <th className="py-3.5 px-3">Issue Date</th>
                <th
                  onClick={() => {
                    setSortBy('dueDate');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3.5 px-3 cursor-pointer hover:text-indigo-600 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Due Date</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortBy('amount');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Amount</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    {state.invoices.length === 0
                      ? 'No invoices yet. Create your first invoice to get started.'
                      : 'No matching invoices found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => {
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => onViewInvoice(inv)}
                    >
                      <td className="py-3.5 px-4 font-bold text-indigo-600">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{inv.customerName}</span>
                        <span className="text-[11px] text-slate-400">{inv.customerCompany}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-medium">{inv.issueDate}</td>
                      <td className="py-3.5 px-3 text-slate-600 font-medium">
                        {inv.dueDate}
                        {inv.status === 'overdue' && inv.overdueDays && (
                          <span className="text-[10px] text-rose-600 font-bold block">
                            +{inv.overdueDays}d overdue
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-black text-slate-900 block">
                          {currency}
                          {inv.amount.toLocaleString('en-IN')}
                        </span>
                        {inv.balance > 0 && inv.status !== 'paid' && (
                          <span className="text-[10px] text-rose-600 font-semibold">
                            Bal: {currency}
                            {inv.balance.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize inline-block ${
                            inv.status === 'paid'
                              ? 'bg-[#dcfce7] text-[#16a34a]'
                              : inv.status === 'overdue'
                              ? 'bg-[#fee2e2] text-[#ef4444]'
                              : 'bg-[#fef3c7] text-[#d97706]'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewInvoice(inv)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                            title="View Invoice"
                          >
                            <Eye size={15} />
                          </button>

                          {inv.status !== 'paid' && (
                            <>
                              <button
                                onClick={() => onSendReminder(inv)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                                title="Send Reminder"
                              >
                                <Send size={15} />
                              </button>
                              <button
                                onClick={() => onRecordPayment(inv)}
                                className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                                title="Record Payment"
                              >
                                Pay
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setDeleteConfirmId(inv.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete Invoice"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertCircle size={22} />
              <h3 className="font-bold text-slate-900 text-sm">Delete Invoice?</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Are you sure you want to delete this invoice? This will recalculate customer balances and remove it from analytics.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
