import React from 'react';
import { Sparkles, ArrowRight, Gem } from 'lucide-react';
import { CrownPedestalGraphic } from '../common/Graphics';

interface UpgradeCardProps {
  onUpgrade: () => void;
}

export const UpgradeCard: React.FC<UpgradeCardProps> = ({ onUpgrade }) => {
  return (
    <div className="bg-gradient-to-r from-[#f5f3ff] via-[#ede9fe] to-[#e0e7ff] rounded-2xl p-5 border border-[#ddd6fe] shadow-[0_4px_20px_rgba(79,70,229,0.04)] flex items-center justify-between gap-3 relative overflow-hidden">
      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center gap-1.5 mb-1.5 text-indigo-700">
          <Gem size={16} className="stroke-[2.5]" />
          <h3 className="font-extrabold text-slate-900 text-sm tracking-tight leading-snug">
            Upgrade to Unlock Advanced Features
          </h3>
        </div>

        <p className="text-[11px] text-slate-600 font-medium mb-3 leading-relaxed">
          Get AI-powered insights, priority support and more. <span className="text-indigo-600">✦</span>
        </p>

        <button
          onClick={onUpgrade}
          className="py-1.5 px-4 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <span>Upgrade Plan</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* 3D Crown Graphic */}
      <CrownPedestalGraphic className="w-24 h-24 shrink-0 drop-shadow-md z-10" />
    </div>
  );
};
