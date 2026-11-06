import React from 'react';
import { Handshake, ArrowRight, ShieldCheck } from 'lucide-react';
import { PromiseToPay } from '../../types';

interface PromiseToPayCardProps {
  promises: PromiseToPay[];
  onViewAll: () => void;
  onSelectPromise?: (promise: PromiseToPay) => void;
}

export const PromiseToPayCard: React.FC<PromiseToPayCardProps> = ({
  promises,
  onViewAll,
  onSelectPromise,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e8e9f5] shadow-[0_4px_20px_rgba(79,70,229,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Handshake size={18} className="stroke-[2.2]" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Promise-to-Pay Tracker</h3>
        </div>

        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Table or Empty State */}
      {promises.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="w-9 h-9 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-2">
            <ShieldCheck size={18} />
          </div>
          <p className="text-xs font-semibold text-slate-600">No payment commitments yet.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Customer commitments to settle invoices will be tracked here.</p>
        </div>
      ) : (
        <div className="my-auto overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-semibold text-slate-400 border-b border-slate-100">
                <th className="pb-2 font-medium">Customer</th>
                <th className="pb-2 font-medium">Promised Date</th>
                <th className="pb-2 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {promises.slice(0, 2).map((item) => {
                const isOverdue = item.status === 'overdue';
                const isFulfilled = item.status === 'fulfilled';

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectPromise?.(item)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 font-bold text-slate-800 truncate max-w-[140px]">
                      {item.customerName}
                    </td>
                    <td className="py-2.5 text-slate-500 font-medium">{item.promisedDate}</td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isFulfilled
                            ? 'bg-[#dcfce7] text-[#16a34a]'
                            : isOverdue
                            ? 'bg-[#fee2e2] text-[#ef4444]'
                            : 'bg-[#fef3c7] text-[#d97706]'
                        }`}
                      >
                        {item.status === 'pending'
                          ? 'Pending'
                          : item.status === 'fulfilled'
                          ? 'Fulfilled'
                          : 'Overdue'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
