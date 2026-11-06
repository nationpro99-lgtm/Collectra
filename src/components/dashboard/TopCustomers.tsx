import React from 'react';
import { Trophy, ArrowRight, UserPlus } from 'lucide-react';
import { Customer } from '../../types';

interface TopCustomersProps {
  customers: Customer[];
  onViewAll: () => void;
  onSelectCustomer?: (customer: Customer) => void;
  currencySymbol?: string;
}

export const TopCustomers: React.FC<TopCustomersProps> = ({
  customers,
  onViewAll,
  onSelectCustomer,
  currencySymbol = '₹',
}) => {
  // Sort by highest outstanding balance
  const topList = [...customers]
    .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
    .slice(0, 5);

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e8e9f5] shadow-[0_4px_20px_rgba(79,70,229,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Trophy size={18} className="stroke-[2.2]" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Top Customers</h3>
        </div>

        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Ranked List or Empty State */}
      {topList.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="w-9 h-9 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-2">
            <UserPlus size={18} />
          </div>
          <p className="text-xs font-semibold text-slate-600">No customers added yet.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Add your first customer.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 my-auto">
          {topList.map((cust, idx) => {
            const isOverdue = cust.overdueDays && cust.overdueDays > 0;
            const badgeText = isOverdue
              ? `Overdue ${cust.overdueDays}d`
              : cust.outstandingBalance > 0
              ? 'Active'
              : 'Settled';

            return (
              <div
                key={cust.id}
                onClick={() => onSelectCustomer?.(cust)}
                className="py-2.5 px-1.5 flex items-center justify-between hover:bg-slate-50/80 rounded-lg transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-slate-400 w-3 text-center group-hover:text-indigo-600">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 truncate max-w-[130px] sm:max-w-[160px]">
                    {cust.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold text-slate-900">
                    {currencySymbol}
                    {cust.outstandingBalance.toLocaleString('en-IN')}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isOverdue
                        ? 'bg-[#fee2e2] text-[#ef4444]'
                        : cust.outstandingBalance > 0
                        ? 'bg-[#e0e7ff] text-[#4f46e5]'
                        : 'bg-[#dcfce7] text-[#16a34a]'
                    }`}
                  >
                    {badgeText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
