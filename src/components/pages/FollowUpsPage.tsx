import React, { useState } from 'react';
import {
  BellRing,
  Plus,
  Send,
  CheckCircle2,
  Calendar,
  Clock,
  MessageSquare,
  Mail,
  PhoneCall,
  Smartphone,
  ChevronRight,
  Filter,
  Check,
  X,
} from 'lucide-react';
import { FollowUp, FollowUpChannel } from '../../types';
import { AppState, storageService } from '../../services/storage';

interface FollowUpsPageProps {
  state: AppState;
  onOpenSendReminder: (followUp: FollowUp) => void;
  onViewCustomerHistory: (customerId: string) => void;
}

export const FollowUpsPage: React.FC<FollowUpsPageProps> = ({
  state,
  onOpenSendReminder,
  onViewCustomerHistory,
}) => {
  const currency = state.settings.currencySymbol || '₹';

  const [filterTab, setFilterTab] = useState<'all' | 'dueToday' | 'upcoming' | 'completed'>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New follow up state
  const [newCustId, setNewCustId] = useState(state.customers[0]?.id || '');
  const [newAmount, setNewAmount] = useState(50000);
  const [newDueLabel, setNewDueLabel] = useState('Due tomorrow');
  const [newChannel, setNewChannel] = useState<FollowUpChannel>('whatsapp');

  const dueTodayCount = state.followUps.filter(
    (f) => f.dueLabel.toLowerCase().includes('today') || f.dueLabel.toLowerCase().includes('tomorrow')
  ).length;
  const upcomingCount = state.followUps.filter((f) => f.status === 'pending').length;
  const completedCount = state.followUps.filter((f) => f.status === 'completed').length;
  const overdueCount = state.followUps.filter(
    (f) =>
      f.status === 'pending' &&
      (f.dueLabel.toLowerCase().includes('overdue') ||
        (f.dueDate && f.dueDate < new Date().toISOString().split('T')[0]))
  ).length;

  const filtered = state.followUps.filter((f) => {
    if (filterTab === 'dueToday') {
      return (
        f.dueLabel.toLowerCase().includes('today') || f.dueLabel.toLowerCase().includes('tomorrow')
      );
    }
    if (filterTab === 'upcoming') {
      return f.status === 'pending';
    }
    if (filterTab === 'completed') {
      return f.status === 'completed';
    }
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = state.customers.find((c) => c.id === newCustId);
    if (!cust) return;

    const linkedInv = state.invoices.find((i) => i.customerId === cust.id);
    const invoiceNumber = linkedInv?.invoiceNumber || `${state.settings.invoicePrefix || 'INV-'}${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceId = linkedInv?.id || 'inv-general';

    storageService.addFollowUp({
      customerId: cust.id,
      customerName: cust.name,
      invoiceId,
      invoiceNumber,
      amountDue: Number(newAmount),
      dueDate: new Date().toISOString().split('T')[0],
      dueLabel: newDueLabel,
      status: 'pending',
      channel: newChannel,
      avatarLetter: cust.name.charAt(0),
      avatarColor: 'bg-indigo-100 text-indigo-700',
      priority: 'high',
    });

    setIsAddOpen(false);
  };

  const handleMarkComplete = (id: string) => {
    storageService.completeFollowUp(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Follow-ups</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Automate omnichannel reminders across WhatsApp, Email and Phone
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="py-2 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <Plus size={16} />
          <span>New Follow-up Task</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Due Today & Tomorrow
          </span>
          <p className="text-xl font-black text-amber-600 mt-0.5">{dueTodayCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Upcoming Follow-ups
          </span>
          <p className="text-xl font-black text-indigo-600 mt-0.5">{upcomingCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Overdue Follow-ups
          </span>
          <p className="text-xl font-black text-rose-600 mt-0.5">{overdueCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Completed Reminders
          </span>
          <p className="text-xl font-black text-emerald-600 mt-0.5">{completedCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs w-fit">
        {(
          [
            { id: 'all', label: 'All Follow-ups' },
            { id: 'dueToday', label: 'Due Today / Tomorrow' },
            { id: 'upcoming', label: 'Pending' },
            { id: 'completed', label: 'Completed' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterTab(t.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterTab === t.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Follow-ups List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#e8e9f5] shadow-2xs">
            <p className="text-xs text-slate-400 font-medium">No follow-ups scheduled.</p>
          </div>
        ) : (
          filtered.map((fol) => {
          const isDone = fol.status === 'completed';

          return (
            <div
              key={fol.id}
              className={`p-4 rounded-2xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isDone
                  ? 'bg-slate-50 border-slate-200 opacity-75'
                  : 'bg-white border-[#e8e9f5] hover:shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 ${fol.avatarColor}`}
                >
                  {fol.avatarLetter}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-sm">{fol.customerName}</h3>
                    <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                      {fol.invoiceNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        isDone
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {fol.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-slate-700 font-semibold">
                      <Clock size={13} className="text-slate-400" />
                      {fol.dueLabel}
                    </span>
                    <span className="flex items-center gap-1">
                      {fol.channel === 'whatsapp' ? (
                        <MessageSquare size={13} className="text-emerald-600" />
                      ) : fol.channel === 'email' ? (
                        <Mail size={13} className="text-indigo-600" />
                      ) : (
                        <PhoneCall size={13} className="text-blue-600" />
                      )}
                      via {fol.channel.toUpperCase()}
                    </span>
                    {fol.lastReminderDate && (
                      <span className="text-slate-400">Last dispatched: {fol.lastReminderDate}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Amount Due
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {currency}
                    {fol.amountDue.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!isDone && (
                    <button
                      onClick={() => onOpenSendReminder(fol)}
                      className="py-1.5 px-3.5 rounded-xl bg-[#4338ca] hover:bg-[#3730a3] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Send size={13} />
                      <span>Remind Now</span>
                    </button>
                  )}

                  {!isDone && (
                    <button
                      onClick={() => handleMarkComplete(fol.id)}
                      className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                      title="Mark as Completed"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }))}
      </div>

      {/* Add Follow-up Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-slate-900 text-base">Schedule New Follow-up</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer</label>
                <select
                  value={newCustId}
                  onChange={(e) => setNewCustId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none"
                >
                  {state.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount Due ({currency})
                </label>
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Due Label</label>
                <select
                  value={newDueLabel}
                  onChange={(e) => setNewDueLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none"
                >
                  <option value="Due today">Due today</option>
                  <option value="Due tomorrow">Due tomorrow</option>
                  <option value="Due in 2 days">Due in 2 days</option>
                  <option value="Due in 3 days">Due in 3 days</option>
                  <option value="Due in 7 days">Due in 7 days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred Channel
                </label>
                <select
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value as FollowUpChannel)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 outline-none"
                >
                  <option value="whatsapp">WhatsApp Business</option>
                  <option value="email">Email</option>
                  <option value="call">Phone Call</option>
                  <option value="sms">SMS</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4f46e5] text-white text-xs font-bold shadow-sm"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
