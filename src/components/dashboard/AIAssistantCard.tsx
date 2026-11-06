import React, { useState, useEffect } from 'react';
import { Sparkles, Volume2, VolumeX, Play, Square } from 'lucide-react';
import { RobotAvatar } from '../common/Graphics';
import { ttsService } from '../../services/tts';
import { AppState } from '../../services/storage';

interface AIAssistantCardProps {
  state: AppState;
  onViewDetails: () => void;
  onGenerateReminders?: () => void;
}

export const AIAssistantCard: React.FC<AIAssistantCardProps> = ({
  state,
  onViewDetails,
  onGenerateReminders,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const unsub = ttsService.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
    return unsub;
  }, []);

  const overdueInvoices = state.invoices.filter((i) => i.status === 'overdue');
  const overdueTotal = overdueInvoices.reduce((sum, i) => sum + i.balance, 0);

  const speechText =
    overdueInvoices.length > 0
      ? `You have ${overdueInvoices.length} overdue invoices worth ${state.settings.currencySymbol || '₹'}${overdueTotal.toLocaleString('en-IN')}. Would you like me to generate reminders?`
      : 'Your collection ledger is all clear with 0 overdue invoices. Create an invoice to start tracking your receivables.';

  const handleToggleSpeech = () => {
    if (isMuted) return;
    if (isSpeaking) {
      ttsService.stop();
    } else {
      ttsService.speak(speechText);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#e8e9f5] shadow-[0_4px_20px_rgba(79,70,229,0.03)] flex flex-col justify-between relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles size={18} className="stroke-[2.2]" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">AI Assistant</h3>
        </div>

        <button
          onClick={() => {
            if (isSpeaking) ttsService.stop();
            setIsMuted(!isMuted);
          }}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isMuted ? 'text-slate-400 bg-slate-100' : 'text-indigo-600 hover:bg-indigo-50'
          }`}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          aria-label="Toggle mute"
        >
          {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>
      </div>

      {/* Main Avatar & Bubble Content */}
      <div className="flex items-center gap-3.5 my-auto">
        {/* Robot Avatar */}
        <RobotAvatar className="w-18 h-18 shrink-0" isSpeaking={isSpeaking} />

        {/* Speech Bubble */}
        <div className="relative bg-[#f8f9fe] border border-[#e2e4f6] rounded-2xl p-3.5 text-xs text-slate-700 font-medium leading-relaxed shadow-2xs flex-1">
          {/* Bubble Pointer triangle */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-6 border-t-transparent border-b-6 border-b-transparent border-r-8 border-r-[#e2e4f6]" />
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-5 border-t-transparent border-b-5 border-b-transparent border-r-7 border-r-[#f8f9fe]" />

          {overdueInvoices.length > 0 ? (
            <p>
              You have <span className="font-bold text-slate-900">{overdueInvoices.length} overdue</span> invoices worth{' '}
              <span className="font-bold text-slate-900">
                {state.settings.currencySymbol || '₹'}
                {overdueTotal.toLocaleString('en-IN')}
              </span>
              . Would you like me to generate reminders?
            </p>
          ) : (
            <p>
              Your collection ledger is all clear with <span className="font-bold text-slate-900">0 overdue</span> invoices. Create an invoice to start tracking collections.
            </p>
          )}

          {isSpeaking && (
            <div className="flex items-center gap-1 mt-2 text-indigo-600 font-semibold text-[11px]">
              <span className="w-1 h-3 bg-indigo-500 rounded-full animate-bounce" />
              <span className="w-1 h-4 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1 h-2.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.3s]" />
              <span className="ml-1">Speaking summary...</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5 mt-4 pt-1">
        <button
          onClick={handleToggleSpeech}
          className="w-full py-2.5 px-3 rounded-xl bg-[#4338ca] hover:bg-[#3730a3] active:scale-[0.98] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          {isSpeaking ? (
            <>
              <Square size={13} className="fill-white" />
              <span>Stop Audio</span>
            </>
          ) : (
            <>
              <Play size={13} className="fill-white" />
              <span>Play Summary</span>
            </>
          )}
        </button>

        <button
          onClick={onViewDetails}
          className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#f6f7fd] border border-[#d8dbf4] active:scale-[0.98] text-slate-700 hover:text-indigo-600 text-xs font-semibold flex items-center justify-center transition-all cursor-pointer shadow-2xs"
        >
          View Details
        </button>
      </div>
    </div>
  );
};
