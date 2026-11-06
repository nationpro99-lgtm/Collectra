import React from 'react';
import { Zap, Check, Mail, Plus, ArrowRight, Activity } from 'lucide-react';
import { ActivityLog } from '../../types';

interface RecentActivityProps {
  activities: ActivityLog[];
  onViewAll: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities, onViewAll }) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e8e9f5] shadow-[0_4px_20px_rgba(79,70,229,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Zap size={18} className="stroke-[2.2]" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Recent Activity</h3>
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
      {activities.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="w-9 h-9 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-2">
            <Activity size={18} />
          </div>
          <p className="text-xs font-semibold text-slate-600">No recent activity.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Payments, reminders, and invoice events will appear in real time.</p>
        </div>
      ) : (
        <div className="space-y-3 my-auto">
          {activities.slice(0, 3).map((act) => {
            let icon = <Check size={14} className="stroke-[2.5]" />;
            let iconBg = 'bg-[#dcfce7] text-[#16a34a]';

            if (act.type === 'reminder_sent') {
              icon = <Mail size={14} className="stroke-[2.5]" />;
              iconBg = 'bg-[#e0e7ff] text-[#4f46e5]';
            } else if (act.type === 'invoice_created') {
              icon = <Plus size={14} className="stroke-[2.5]" />;
              iconBg = 'bg-[#e0f2fe] text-[#0284c7]';
            }

            return (
              <div key={act.id} className="flex items-start gap-3 p-1 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate">
                    {act.title}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {act.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
