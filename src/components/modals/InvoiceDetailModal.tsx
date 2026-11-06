import React from 'react';
import { X, Printer, Download, Send, CreditCard, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Invoice, BusinessSettings } from '../../types';
import { CollectIQLogo } from '../common/Graphics';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  settings: BusinessSettings;
  isOpen: boolean;
  onClose: () => void;
  onRecordPayment: (invoice: Invoice) => void;
  onSendReminder: (invoice: Invoice) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  settings,
  isOpen,
  onClose,
  onRecordPayment,
  onSendReminder,
}) => {
  if (!isOpen || !invoice) return null;

  const currency = settings.currencySymbol || '₹';

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate text/csv or trigger print to save as PDF
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
        {/* Top Control Bar (hidden in print) */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                invoice.status === 'paid'
                  ? 'bg-emerald-100 text-emerald-800'
                  : invoice.status === 'overdue'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {invoice.status}
            </span>
            <span className="text-xs text-slate-500 font-medium">#{invoice.invoiceNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-semibold"
              title="Print Invoice"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-semibold"
              title="Download PDF"
            >
              <Download size={16} />
              <span className="hidden sm:inline">PDF</span>
            </button>
            {invoice.status !== 'paid' && (
              <>
                <button
                  onClick={() => onSendReminder(invoice)}
                  className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-semibold"
                  title="Send to Customer"
                >
                  <Send size={16} />
                  <span className="hidden sm:inline">Send</span>
                </button>
                <button
                  onClick={() => onRecordPayment(invoice)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-bold shadow-xs"
                >
                  <CreditCard size={15} />
                  <span>Record Payment</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer ml-2"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-8 bg-white" id="printable-invoice">
          {/* Header */}
          <div className="flex justify-between items-start pb-6 border-b border-slate-200">
            <div>
              <CollectIQLogo size={32} />
              <p className="text-xs text-slate-500 font-medium mt-2">{settings.businessName}</p>
              <p className="text-[11px] text-slate-400">{settings.businessAddress}</p>
              <p className="text-[11px] text-slate-400">
                GSTIN: {settings.gstin} • {settings.businessEmail}
              </p>
            </div>

            <div className="text-right">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">TAX INVOICE</h1>
              <p className="text-xs font-bold text-indigo-600 mt-1">{invoice.invoiceNumber}</p>
              <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
                <p>
                  <span className="font-semibold text-slate-700">Issue Date:</span> {invoice.issueDate}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Due Date:</span> {invoice.dueDate}
                </p>
                <p>
                  <span className="font-semibold text-slate-700">Terms:</span>{' '}
                  {invoice.paymentTerms || 'Net 15 Days'}
                </p>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="grid grid-cols-2 gap-6 py-6 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Billed To
              </span>
              <h3 className="font-extrabold text-slate-900 text-sm mt-1">{invoice.customerName}</h3>
              <p className="text-xs text-slate-600">{invoice.customerCompany}</p>
              <p className="text-xs text-slate-500">{invoice.customerEmail}</p>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Payment Status
              </span>
              <div className="mt-1 flex items-center justify-end gap-1.5">
                {invoice.status === 'paid' ? (
                  <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 size={14} />
                    Paid in Full
                  </span>
                ) : invoice.status === 'overdue' ? (
                  <span className="inline-flex items-center gap-1 font-bold text-xs text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                    <AlertCircle size={14} />
                    Overdue by {invoice.overdueDays || 30} days
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">
                    <Clock size={14} />
                    Pending Payment
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Outstanding Balance:{' '}
                <span className="font-extrabold text-slate-900">
                  {currency}
                  {invoice.balance.toLocaleString('en-IN')}
                </span>
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Item & Description</th>
                  <th className="py-2.5 px-2 text-center w-16">Qty</th>
                  <th className="py-2.5 px-2 text-right w-24">Rate ({currency})</th>
                  <th className="py-2.5 px-2 text-center w-16">Tax %</th>
                  <th className="py-2.5 px-3 text-right w-28">Amount ({currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-3 font-semibold text-slate-800">{item.description}</td>
                    <td className="py-3 px-2 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-3 px-2 text-right text-slate-600">
                      {item.unitPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-2 text-center text-slate-500">{item.taxPercent}%</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {item.total.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary & Bank Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            <div className="bg-[#f8f9fe] border border-[#e2e4f6] rounded-xl p-3.5 text-xs">
              <h4 className="font-bold text-slate-800 mb-1.5">Direct Payment Details</h4>
              <div className="space-y-1 text-slate-600 text-[11px]">
                <p>
                  <span className="font-medium text-slate-500">Bank:</span> {settings.bankName}
                </p>
                <p>
                  <span className="font-medium text-slate-500">A/C Number:</span>{' '}
                  <span className="font-mono font-semibold">{settings.accountNumber}</span>
                </p>
                <p>
                  <span className="font-medium text-slate-500">IFSC Code:</span>{' '}
                  <span className="font-mono font-semibold">{settings.ifscCode}</span>
                </p>
                <p>
                  <span className="font-medium text-slate-500">UPI ID:</span>{' '}
                  <span className="font-semibold text-indigo-700">{settings.upiId}</span>
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">
                  {currency}
                  {invoice.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Amount Paid:</span>
                <span className="font-semibold text-emerald-600">
                  {currency}
                  {invoice.paidAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-base text-slate-900">
                <span>Total Due:</span>
                <span className="text-indigo-600">
                  {currency}
                  {invoice.balance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Notes:</span> {invoice.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
