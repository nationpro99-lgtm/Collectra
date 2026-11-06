import React, { useState, useEffect } from 'react';
import { X, UserPlus, CheckCircle2 } from 'lucide-react';
import { Customer } from '../../types';
import { storageService } from '../../services/storage';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
  onSaved?: (customer: Customer) => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
  onSaved,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(customerToEdit?.name || '');
  const [company, setCompany] = useState(customerToEdit?.company || '');
  const [email, setEmail] = useState(customerToEdit?.email || '');
  const [phone, setPhone] = useState(customerToEdit?.phone || '');
  const [address, setAddress] = useState(customerToEdit?.address || '');
  const [gstin, setGstin] = useState(customerToEdit?.gstin || '');
  const [creditLimit, setCreditLimit] = useState<number>(customerToEdit?.creditLimit || 150000);
  const [notes, setNotes] = useState(customerToEdit?.notes || '');
  const [preferredChannel, setPreferredChannel] = useState<'whatsapp' | 'email' | 'sms' | 'all'>(
    customerToEdit?.preferredChannel || 'whatsapp'
  );
  const [optInWhatsapp, setOptInWhatsapp] = useState(customerToEdit?.optInWhatsapp ?? true);
  const [optInSms, setOptInSms] = useState(customerToEdit?.optInSms ?? true);
  const [optInEmail, setOptInEmail] = useState(customerToEdit?.optInEmail ?? true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setCompany(customerToEdit.company);
      setEmail(customerToEdit.email);
      setPhone(customerToEdit.phone);
      setAddress(customerToEdit.address);
      setGstin(customerToEdit.gstin);
      setCreditLimit(customerToEdit.creditLimit);
      setNotes(customerToEdit.notes || '');
      setPreferredChannel(customerToEdit.preferredChannel || 'whatsapp');
      setOptInWhatsapp(customerToEdit.optInWhatsapp ?? true);
      setOptInSms(customerToEdit.optInSms ?? true);
      setOptInEmail(customerToEdit.optInEmail ?? true);
    } else {
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setAddress('');
      setGstin('');
      setCreditLimit(150000);
      setNotes('');
      setPreferredChannel('whatsapp');
      setOptInWhatsapp(true);
      setOptInSms(true);
      setOptInEmail(true);
    }
  }, [customerToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !company.trim() || !email.trim()) {
      setError('Please provide customer contact name, company name, and email address.');
      return;
    }

    if (customerToEdit) {
      storageService.updateCustomer(customerToEdit.id, {
        name,
        company,
        email,
        phone,
        address,
        gstin,
        creditLimit: Number(creditLimit),
        notes,
        preferredChannel,
        optInWhatsapp,
        optInSms,
        optInEmail,
      });
      onSaved?.({
        ...customerToEdit,
        name,
        company,
        email,
        phone,
        address,
        gstin,
        creditLimit: Number(creditLimit),
        notes,
        preferredChannel,
        optInWhatsapp,
        optInSms,
        optInEmail,
      });
    } else {
      const created = storageService.addCustomer({
        name,
        company,
        email,
        phone,
        address,
        gstin,
        creditLimit: Number(creditLimit),
        notes,
        status: 'active',
        preferredChannel,
        optInWhatsapp,
        optInSms,
        optInEmail,
      });
      onSaved?.(created);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50/50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <UserPlus size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                {customerToEdit ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <p className="text-xs text-slate-500">Maintain corporate debtors and credit limits</p>
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
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Person Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Chandra"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Company / Legal Entity <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Corporation"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Billing Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="accounts@company.com"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN / Tax ID</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                placeholder="07AAACA1234A1Z5"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Credit Limit (₹)</label>
              <input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(Number(e.target.value))}
                min="0"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Office / Billing Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Building, Street, City, State, PIN"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>

          {/* Preferred Channel & Consent Opt-ins */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Preferred Notification Channel
              </label>
              <select
                value={preferredChannel}
                onChange={(e) => setPreferredChannel(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="whatsapp">WhatsApp (Recommended)</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="all">All Channels (Multi-Dispatch)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 block">Compliance & Opt-In Consents</span>
              <div className="flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optInWhatsapp}
                    onChange={(e) => setOptInWhatsapp(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600"
                  />
                  <span className="text-slate-700 text-[11px]">WhatsApp Opt-In</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optInSms}
                    onChange={(e) => setOptInSms(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600"
                  />
                  <span className="text-slate-700 text-[11px]">SMS DLT Consent</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optInEmail}
                    onChange={(e) => setOptInEmail(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-indigo-600"
                  />
                  <span className="text-slate-700 text-[11px]">Email Statements</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Internal Notes & Credit Terms</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Requires manager follow-up for invoices > 50k"
              className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
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
              className="px-5 py-2 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>{customerToEdit ? 'Save Changes' : 'Add Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
