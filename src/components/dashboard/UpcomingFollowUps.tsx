import React from 'react';
import { Calendar, ArrowRight, BellOff } from 'lucide-react';
import { FollowUp } from '../../types';

interface UpcomingFollowUpsProps {
  followUps: FollowUp[];
  onRemind: (followUp: FollowUp) => void;
  onViewAll: () => void;
  currencySymbol?: string;
}

export const UpcomingFollowUps: React.FC<UpcomingFollowUpsProps> = ({
  followUps,
  onRemind,
  onViewAll,
  currencySymbol = '₹',
}) => {
  const activeFollowUps = followUps.filter((f) => f.status !== 'completed').slice(0, 3);

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e8e9f5] shadow-[0_4px_20px_rgba(79,70,229,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Calendar size={18} className="stroke-[2.2]" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Upcoming Follow-ups</h3>
        </div>

        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* List or Empty State */}
      {activeFollowUps.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="w-9 h-9 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-2">
            <BellOff size={18} />
          </div>
          <p className="text-xs font-semibold text-slate-600">No follow-ups scheduled.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Automated reminders and tasks will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3.5 my-auto">
          {activeFollowUps.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Avatar circle */}
                <div
                  className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center shrink-0 ${item.avatarColor || 'bg-indigo-100 text-indigo-700'}`}
                >
                  {item.avatarLetter || item.customerName.charAt(0).toUpperCase()}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-tight">
                    {item.customerName}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {item.dueLabel || `Due ${item.dueDate}`}
                    </span>
                    {item.status === 'overdue' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping inline-block" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-extrabold text-slate-900">
                  {currencySymbol}
                  {item.amountDue.toLocaleString('en-IN')}
                </span>

                <button
                  onClick={() => onRemind(item)}
                  className="py-1.5 px-3.5 rounded-xl bg-[#4338ca] hover:bg-[#3730a3] active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  Remind
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
