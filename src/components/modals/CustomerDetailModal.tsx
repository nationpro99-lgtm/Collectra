import React, { useState } from 'react';
import {
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Customer, Invoice, Payment } from '../../types';

interface CustomerDetailModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  payments: Payment[];
  onAddInvoice: (customer: Customer) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onSendReminder: (customer: Customer) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  currencySymbol?: string;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  isOpen,
  onClose,
  invoices,
  payments,
  onAddInvoice,
  onRecordPayment,
  onSendReminder,
  onEditCustomer,
  onDeleteCustomer,
  currencySymbol = '₹',
}) => {
  if (!isOpen || !customer) return null;

  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'details'>('invoices');

  const customerInvoices = invoices.filter((i) => i.customerId === customer.id);
  const customerPayments = payments.filter((p) => p.customerId === customer.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Header Profile Bar */}
        <div className="p-6 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 border-b border-slate-200 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-8">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl font-black text-xl flex items-center justify-center shadow-xs shrink-0 ${
                  customer.avatarColor || 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {customer.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-lg leading-tight">
                    {customer.name}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      customer.status === 'overdue'
                        ? 'bg-rose-100 text-rose-700'
                        : customer.status === 'good'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {customer.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">{customer.company}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Mail size={13} className="text-slate-400" />
                    {customer.email}
                  </span>
                  {customer.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={13} className="text-slate-400" />
                      {customer.phone}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold capitalize">
                    {customer.preferredChannel || 'whatsapp'} Preferred
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onAddInvoice(customer)}
                className="py-1.5 px-3 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                <span>New Invoice</span>
              </button>
              <button
                onClick={() => onSendReminder(customer)}
                className="py-1.5 px-3 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Send size={14} />
                <span>Remind</span>
              </button>
              <button
                onClick={() => onEditCustomer(customer)}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Edit Customer"
              >
                <Edit2 size={14} />
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Billed
              </span>
              <p className="text-sm font-black text-slate-900 mt-0.5">
                {currencySymbol}
                {customer.totalBilled.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Outstanding Balance
              </span>
              <p
                className={`text-sm font-black mt-0.5 ${
                  customer.outstandingBalance > 0 ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {currencySymbol}
                {customer.outstandingBalance.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Last Payment
              </span>
              <p className="text-sm font-black text-emerald-600 mt-0.5">
                {currencySymbol}
                {customer.lastPaymentAmount.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">{customer.lastPaymentDate}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Credit Limit
              </span>
              <p className="text-sm font-black text-slate-900 mt-0.5">
                {currencySymbol}
                {customer.creditLimit.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex items-center gap-6 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'invoices'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Invoices ({customerInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'payments'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Payment Receipts ({customerPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Profile & Notes
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar">
          {activeTab === 'invoices' && (
            <div className="space-y-2.5">
              {customerInvoices.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No invoices found for this customer.
                </div>
              ) : (
                customerInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">
                          {inv.invoiceNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Due: {inv.dueDate} • Issued: {inv.issueDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-extrabold text-slate-900">
                          {currencySymbol}
                          {inv.amount.toLocaleString('en-IN')}
                        </p>
                        {inv.balance > 0 && (
                          <span className="text-[10px] font-bold text-rose-600 block">
                            Bal: {currencySymbol}
                            {inv.balance.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => onRecordPayment(inv)}
                          className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-2.5">
              {customerPayments.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No payment records found for this customer.
                </div>
              ) : (
                customerPayments.map((pay) => (
                  <div
                    key={pay.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {pay.transactionId}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Success
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {pay.paymentDate} • via {pay.paymentMethod}
                      </p>
                      {pay.referenceNote && (
                        <p className="text-[11px] text-slate-400 italic">{pay.referenceNote}</p>
                      )}
                    </div>
                    <span className="text-sm font-black text-emerald-600">
                      +{currencySymbol}
                      {pay.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">GSTIN / Tax ID</span>
                  <p className="font-bold text-slate-800 mt-0.5">{customer.gstin || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">Office Address</span>
                  <p className="font-bold text-slate-800 mt-0.5">{customer.address || 'Not provided'}</p>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-400 block">Internal Notes</span>
                <p className="font-medium text-slate-700 bg-slate-50 p-3 rounded-xl mt-1 border border-slate-200">
                  {customer.notes || 'No internal notes logged yet.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
                      onDeleteCustomer(customer.id);
                      onClose();
                    }
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>Delete Customer Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
