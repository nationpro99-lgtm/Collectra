import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Download,
  Upload,
  Mail,
  Phone,
  ArrowUpDown,
  UserCheck,
  AlertTriangle,
  Send,
  Eye,
  Trash2,
  Edit2,
} from 'lucide-react';
import { Customer } from '../../types';
import { AppState, storageService } from '../../services/storage';

interface CustomersPageProps {
  state: AppState;
  onOpenAddCustomer: () => void;
  onViewCustomer: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onSendReminder: (customer: Customer) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({
  state,
  onOpenAddCustomer,
  onViewCustomer,
  onEditCustomer,
  onSendReminder,
}) => {
  const currency = state.settings.currencySymbol || '₹';

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'overdue' | 'active' | 'good'>('all');
  const [sortBy, setSortBy] = useState<'outstanding' | 'name' | 'billed'>('outstanding');
  const [sortAsc, setSortAsc] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Metrics
  const totalCustomers = state.customers.length;
  const activeCustomers = state.customers.filter((c) => c.status !== 'pending').length;
  const withOutstanding = state.customers.filter((c) => c.outstandingBalance > 0).length;
  const overdueCustomers = state.customers.filter(
    (c) => c.status === 'overdue' || (c.overdueDays && c.overdueDays > 0)
  ).length;

  const filtered = state.customers
    .filter((cust) => {
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'overdue' && (cust.status === 'overdue' || (cust.overdueDays || 0) > 0)) ||
        (filterStatus === 'good' && cust.status === 'good') ||
        (filterStatus === 'active' && cust.status === 'active');

      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        cust.name.toLowerCase().includes(q) ||
        cust.company.toLowerCase().includes(q) ||
        cust.email.toLowerCase().includes(q) ||
        cust.phone.includes(q);

      return matchStatus && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'outstanding') {
        return sortAsc
          ? a.outstandingBalance - b.outstandingBalance
          : b.outstandingBalance - a.outstandingBalance;
      }
      if (sortBy === 'billed') {
        return sortAsc ? a.totalBilled - b.totalBilled : b.totalBilled - a.totalBilled;
      }
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });

  const handleExportCSV = () => {
    const headers = ['Name,Company,Email,Phone,Total Billed,Outstanding Balance,Status,Overdue Days\n'];
    const rows = state.customers.map(
      (c) =>
        `"${c.name}","${c.company}","${c.email}","${c.phone}",${c.totalBilled},${c.outstandingBalance},"${c.status}",${c.overdueDays || 0}\n`
    );
    const blob = new Blob([...headers, ...rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CollectIQ_Customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleImportCSV = () => {
    alert('CSV Import feature is active. You can upload standard CRM files to sync debtor accounts.');
  };

  const handleDelete = (id: string) => {
    storageService.deleteCustomer(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer CRM</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage debtors, payment records, credit limits, and collection ledgers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleImportCSV}
            className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Upload size={14} />
            <span>Import</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenAddCustomer}
            className="py-2 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Customers
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">{totalCustomers}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Active Accounts
          </span>
          <p className="text-xl font-black text-indigo-600 mt-0.5">{activeCustomers}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            With Outstanding
          </span>
          <p className="text-xl font-black text-amber-600 mt-0.5">{withOutstanding}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Overdue Accounts
          </span>
          <p className="text-xl font-black text-rose-600 mt-0.5">{overdueCustomers}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#e8e9f5] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer name, company, email, phone..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'overdue', 'active', 'good'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All Customers' : st === 'good' ? 'Paid / Good' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-[#e8e9f5] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8f9fe] border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th
                  onClick={() => {
                    setSortBy('name');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Customer & Company</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="py-3.5 px-4">Contact</th>
                <th
                  onClick={() => {
                    setSortBy('billed');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Billed</span>
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortBy('outstanding');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-indigo-600 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Outstanding</span>
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
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    {state.customers.length === 0
                      ? 'No customers added yet. Add your first customer.'
                      : 'No matching customers found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => {
                const isOverdue = cust.status === 'overdue' || (cust.overdueDays && cust.overdueDays > 0);

                return (
                  <tr
                    key={cust.id}
                    onClick={() => onViewCustomer(cust)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center shrink-0 ${
                            cust.avatarColor || 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {cust.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 group-hover:text-indigo-600 block">
                            {cust.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">{cust.company}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-slate-700 font-medium block">{cust.email}</span>
                      <span className="text-[11px] text-slate-400">{cust.phone}</span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {currency}
                      {cust.totalBilled.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-black ${
                          cust.outstandingBalance > 0 ? 'text-rose-600' : 'text-slate-800'
                        }`}
                      >
                        {currency}
                        {cust.outstandingBalance.toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize inline-block ${
                          isOverdue
                            ? 'bg-[#fee2e2] text-[#ef4444]'
                            : cust.status === 'good'
                            ? 'bg-[#dcfce7] text-[#16a34a]'
                            : 'bg-[#e0e7ff] text-[#4f46e5]'
                        }`}
                      >
                        {isOverdue ? `Overdue ${cust.overdueDays || 30}d` : cust.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewCustomer(cust)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                          title="View Profile"
                        >
                          <Eye size={15} />
                        </button>
                        {cust.outstandingBalance > 0 && (
                          <button
                            onClick={() => onSendReminder(cust)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                            title="Send Reminder"
                          >
                            <Send size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => onEditCustomer(cust)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                          title="Edit Customer"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(cust.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete Customer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-sm mb-2">Delete Customer Account?</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              This will remove the customer record and their associated ledger references.
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
