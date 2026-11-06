import React from 'react';
import { FilePlus, Send, UserPlus, BarChart2 } from 'lucide-react';

interface QuickActionsProps {
  onAddInvoice: () => void;
  onSendReminder: () => void;
  onAddCustomer: () => void;
  onViewReports: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAddInvoice,
  onSendReminder,
  onAddCustomer,
  onViewReports,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e8e9f5] shadow-[0_4px_20px_rgba(79,70,229,0.03)] flex flex-col justify-between">
      <h3 className="font-bold text-slate-800 text-sm mb-3">Quick Actions</h3>

      <div className="grid grid-cols-2 gap-3 my-auto">
        {/* Add Invoice */}
        <button
          onClick={onAddInvoice}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f0fdf9] hover:bg-[#ccfbf1] border border-[#ccfbf1] text-emerald-800 transition-all duration-150 active:scale-95 group cursor-pointer shadow-2xs"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-100/80 group-hover:bg-emerald-200 flex items-center justify-center mb-1.5 transition-colors">
            <FilePlus size={18} className="text-emerald-700 stroke-[2.2]" />
          </div>
          <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
            Add Invoice
          </span>
        </button>

        {/* Send Reminder */}
        <button
          onClick={onSendReminder}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f5f3ff] hover:bg-[#ede9fe] border border-[#ede9fe] text-indigo-800 transition-all duration-150 active:scale-95 group cursor-pointer shadow-2xs"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-100/80 group-hover:bg-indigo-200 flex items-center justify-center mb-1.5 transition-colors">
            <Send size={18} className="text-indigo-700 stroke-[2.2]" />
          </div>
          <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
            Send Reminder
          </span>
        </button>

        {/* Add Customer */}
        <button
          onClick={onAddCustomer}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f0fdf4] hover:bg-[#dcfce7] border border-[#dcfce7] text-teal-800 transition-all duration-150 active:scale-95 group cursor-pointer shadow-2xs"
        >
          <div className="w-8 h-8 rounded-lg bg-teal-100/80 group-hover:bg-teal-200 flex items-center justify-center mb-1.5 transition-colors">
            <UserPlus size={18} className="text-teal-700 stroke-[2.2]" />
          </div>
          <span className="text-xs font-bold text-slate-800 group-hover:text-teal-900">
            Add Customer
          </span>
        </button>

        {/* View Reports */}
        <button
          onClick={onViewReports}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] text-slate-800 transition-all duration-150 active:scale-95 group cursor-pointer shadow-2xs"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center mb-1.5 transition-colors">
            <BarChart2 size={18} className="text-slate-700 stroke-[2.2]" />
          </div>
          <span className="text-xs font-bold text-slate-800 group-hover:text-slate-900">
            View Reports
          </span>
        </button>
      </div>
    </div>
  );
};
