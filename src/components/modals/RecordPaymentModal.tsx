import React, { useState } from 'react';
import { X, CreditCard, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Invoice, PaymentMethod } from '../../types';
import { storageService } from '../../services/storage';

interface RecordPaymentModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded?: () => void;
  currencySymbol?: string;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onPaymentRecorded,
  currencySymbol = '₹',
}) => {
  if (!isOpen || !invoice) return null;

  const [amount, setAmount] = useState<number>(invoice.balance || invoice.amount);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [referenceNote, setReferenceNote] = useState(`Ref: ${Math.floor(100000000 + Math.random() * 900000000)}`);
  const [paymentDate, setPaymentDate] = useState(
    new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    setIsSubmitting(true);

    storageService.recordPayment({
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(amount),
      paymentMethod,
      referenceNote,
      paymentDate,
    });

    // Celebratory confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignored
    }

    setIsSubmitting(false);
    onPaymentRecorded?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/60 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CreditCard size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Record Payment</h3>
              <p className="text-xs text-slate-500">Record a full or partial remittance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Invoice Summary Box */}
          <div className="bg-[#f8f9fe] border border-[#e2e4f6] rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Target Invoice
              </span>
              <p className="text-xs font-black text-slate-900 mt-0.5">{invoice.invoiceNumber}</p>
              <p className="text-xs text-slate-500">{invoice.customerName}</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Balance Due
              </span>
              <p className="text-sm font-black text-rose-600 mt-0.5">
                {currencySymbol}
                {invoice.balance.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Payment Amount ({currencySymbol}) <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setAmount(invoice.balance)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Pay Full Balance
              </button>
            </div>
            <input
              type="number"
              min="1"
              max={invoice.balance}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            >
              <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
              <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT / RTGS / IMPS)</option>
              <option value="Credit Card">Credit / Debit Card</option>
              <option value="Cheque">Cheque Deposit</option>
              <option value="Cash">Cash Receipt</option>
              <option value="Stripe">Stripe Gateway</option>
            </select>
          </div>

          {/* Reference & Transaction ID */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              UTR / Transaction Reference
            </label>
            <input
              type="text"
              value={referenceNote}
              onChange={(e) => setReferenceNote(e.target.value)}
              placeholder="e.g. UTR 49201948201 or Cheque #849102"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Date & Time</label>
            <input
              type="text"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Actions */}
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
              disabled={isSubmitting || amount <= 0}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>Confirm & Reconcile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
