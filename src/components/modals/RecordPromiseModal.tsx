import React, { useState } from 'react';
import { X, Handshake, CheckCircle2, Calendar } from 'lucide-react';
import { Customer, Invoice, PromiseToPay } from '../../types';
import { storageService } from '../../services/storage';

interface RecordPromiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  invoices: Invoice[];
  onPromiseRecorded?: (ptp: PromiseToPay) => void;
  currencySymbol?: string;
}

export const RecordPromiseModal: React.FC<RecordPromiseModalProps> = ({
  isOpen,
  onClose,
  customers,
  invoices,
  onPromiseRecorded,
  currencySymbol = '₹',
}) => {
  if (!isOpen) return null;

  const defaultCust = customers[0]?.id || '';
  const [customerId, setCustomerId] = useState(defaultCust);
  const custInvoices = invoices.filter((i) => i.customerId === customerId && i.status !== 'paid');
  const [invoiceId, setInvoiceId] = useState(custInvoices[0]?.id || invoices[0]?.id || '');
  const [amount, setAmount] = useState<number>(custInvoices[0]?.balance || 50000);
  const [promisedDate, setPromisedDate] = useState('Jun 30, 2025');
  const [followUpAction, setFollowUpAction] = useState('Send reminder 1 day prior via WhatsApp');
  const [notes, setNotes] = useState('Customer confirmed payment via electronic transfer upon client sign-off.');

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const related = invoices.filter((i) => i.customerId === id && i.status !== 'paid');
    if (related.length > 0) {
      setInvoiceId(related[0].id);
      setAmount(related[0].balance);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === customerId);
    const inv = invoices.find((i) => i.id === invoiceId);

    const ptp = storageService.addPromise({
      customerId,
      customerName: cust?.name || 'Customer',
      invoiceId: inv?.id || 'inv-general',
      invoiceNumber: inv?.invoiceNumber || 'INV-GENERAL',
      promisedAmount: Number(amount),
      promisedDate,
      status: 'pending',
      followUpAction,
      notes,
    });

    onPromiseRecorded?.(ptp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/60 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Handshake size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Record Promise to Pay</h3>
              <p className="text-xs text-slate-500">Track and enforce payment commitments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Customer</label>
            <select
              value={customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Invoice</label>
            <select
              value={invoiceId}
              onChange={(e) => {
                setInvoiceId(e.target.value);
                const inv = invoices.find((i) => i.id === e.target.value);
                if (inv) setAmount(inv.balance);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            >
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} - {inv.customerName} (Bal: {currencySymbol}
                  {inv.balance.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Promised Amount ({currencySymbol})
              </label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Promised Date</label>
              <input
                type="text"
                value={promisedDate}
                onChange={(e) => setPromisedDate(e.target.value)}
                placeholder="e.g. Jun 30, 2025"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Automated Follow-up Action</label>
            <input
              type="text"
              value={followUpAction}
              onChange={(e) => setFollowUpAction(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Commitment Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>Record Commitment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
