import React from 'react';
import { CheckSquare, ArrowRight, Check, ListChecks } from 'lucide-react';
import { Task } from '../../types';

interface MyTasksCardProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onViewAll: () => void;
}

export const MyTasksCard: React.FC<MyTasksCardProps> = ({ tasks, onToggleTask, onViewAll }) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e8e9f5] shadow-[0_4px_20px_rgba(79,70,229,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <CheckSquare size={18} className="stroke-[2.2]" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">My Tasks</h3>
        </div>

        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Task List or Empty State */}
      {tasks.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="w-9 h-9 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-2">
            <ListChecks size={18} />
          </div>
          <p className="text-xs font-semibold text-slate-600">No tasks recorded yet.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Tasks created for follow-up reminders will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2.5 my-auto">
          {tasks.slice(0, 3).map((task) => {
            return (
              <div
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                className="flex items-start gap-3 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                {/* Checkbox */}
                <div
                  className={`w-4.5 h-4.5 mt-0.5 rounded-md flex items-center justify-center transition-all ${
                    task.completed
                      ? 'bg-[#4f46e5] text-white'
                      : 'border-2 border-slate-300 group-hover:border-indigo-400 bg-white'
                  }`}
                >
                  {task.completed && <Check size={12} className="stroke-[3]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-bold leading-tight truncate ${
                      task.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                    }`}
                  >
                    {task.title}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {task.timeLabel || task.dueDate}
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
