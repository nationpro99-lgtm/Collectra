import React, { useState } from 'react';
import { X, Plus, Trash2, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { Customer, Invoice, InvoiceItem } from '../../types';
import { storageService } from '../../services/storage';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onInvoiceCreated: (invoice: Invoice) => void;
  currencySymbol?: string;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  customers,
  onInvoiceCreated,
  currencySymbol = '₹',
}) => {
  if (!isOpen) return null;

  const defaultInvoiceNum = `INV-${Math.floor(1025 + Math.random() * 200)}`;
  const today = new Date().toISOString().split('T')[0];
  const dueDateDefault = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoiceNum);
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(dueDateDefault);
  const [paymentTerms, setPaymentTerms] = useState('Net 15 Days');
  const [notes, setNotes] = useState('Thank you for your business. Please make payment via UPI or Bank Transfer.');

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 'item-1',
      description: 'Platform Software Subscription & Collection API',
      quantity: 1,
      unitPrice: 45000,
      taxPercent: 18,
      discountPercent: 0,
      total: 53100,
    },
  ]);

  const [formError, setFormError] = useState('');

  // Calculations
  const updateLineItem = (index: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };

    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const taxPct = Number(item.taxPercent) || 0;
    const discPct = Number(item.discountPercent) || 0;

    const base = qty * price;
    const discount = (base * discPct) / 100;
    const discountedBase = Math.max(0, base - discount);
    const tax = (discountedBase * taxPct) / 100;

    item.total = Math.round(discountedBase + tax);
    updated[index] = item;
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxPercent: 18,
        discountPercent: 0,
        total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountTotal = items.reduce(
    (sum, item) => sum + ((item.quantity * item.unitPrice * item.discountPercent) / 100),
    0
  );
  const taxTotal = items.reduce((sum, item) => {
    const base = item.quantity * item.unitPrice - (item.quantity * item.unitPrice * item.discountPercent) / 100;
    return sum + (base * item.taxPercent) / 100;
  }, 0);
  const grandTotal = Math.round(subtotal - discountTotal + taxTotal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (!customer) {
      setFormError('Please select a customer.');
      return;
    }

    if (items.some((i) => !i.description.trim() || i.unitPrice <= 0)) {
      setFormError('Please complete all item descriptions and unit prices.');
      return;
    }

    const created = storageService.addInvoice({
      invoiceNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerCompany: customer.company,
      issueDate,
      dueDate,
      amount: grandTotal,
      paidAmount: 0,
      balance: grandTotal,
      status: 'pending',
      items,
      notes,
      paymentTerms,
    });

    onInvoiceCreated(created);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-indigo-50/50 via-white to-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FileText size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Create New Invoice</h3>
              <p className="text-xs text-slate-500">Generate and dispatch a trackable invoice</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {formError}
            </div>
          )}

          {/* Top Row: Customer, Invoice #, Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Invoice Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              >
                <option value="Net 7 Days">Net 7 Days</option>
                <option value="Net 14 Days">Net 14 Days</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Due on Receipt">Due on Receipt</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800">Line Items</label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Item</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-2 w-16 text-center">Qty</th>
                    <th className="py-2.5 px-2 w-28 text-right">Price ({currencySymbol})</th>
                    <th className="py-2.5 px-2 w-18 text-center">Tax %</th>
                    <th className="py-2.5 px-2 w-18 text-center">Disc %</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total ({currencySymbol})</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                          placeholder="e.g. Software implementation"
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                          className="w-full px-1.5 py-1.5 text-center rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(idx, 'unitPrice', e.target.value)}
                          className="w-full px-2 py-1.5 text-right rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.taxPercent}
                          onChange={(e) => updateLineItem(idx, 'taxPercent', e.target.value)}
                          className="w-full px-1 py-1.5 text-center rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) => updateLineItem(idx, 'discountPercent', e.target.value)}
                          className="w-full px-1 py-1.5 text-center rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-slate-800">
                        {item.total.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Instructions & Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">
                  {currencySymbol}
                  {subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount:</span>
                  <span>
                    -{currencySymbol}
                    {Math.round(discountTotal).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Tax (GST/VAT):</span>
                <span className="font-semibold text-slate-800">
                  +{currencySymbol}
                  {Math.round(taxTotal).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-extrabold text-sm text-slate-900">
                <span>Grand Total:</span>
                <span className="text-indigo-600">
                  {currencySymbol}
                  {grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              <span>Save & Issue Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
