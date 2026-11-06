import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Volume2,
  Square,
  Play,
  Send,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Bot,
  User,
  PhoneCall,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { RobotAvatar } from '../common/Graphics';
import { AppState } from '../../services/storage';
import { geminiAIService, CollectionSummary } from '../../services/gemini';
import { ttsService } from '../../services/tts';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onActionClick?: (action: any) => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  state,
  onActionClick,
}) => {
  if (!isOpen) return null;

  const [summary, setSummary] = useState<CollectionSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const curr = state.settings.currencySymbol || '₹';
  const totalBilled = state.invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalCollected = state.payments.reduce((sum, p) => sum + p.amount, 0);
  const liveRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string; time: string }[]>(() => {
    if (state.invoices.length === 0) {
      return [
        {
          role: 'ai',
          text: "Hello! I'm your CollectIQ Collections Intelligence Advisor. Your ledger is currently clean with no invoices recorded yet. Create your first invoice or add customers to get started.",
          time: 'Just now',
        },
      ];
    }
    const today = new Date().toISOString().split('T')[0];
    const overdueInvoices = state.invoices.filter(
      (i) => i.status === 'overdue' || (i.dueDate < today && i.balance > 0)
    );
    const overdueTotal = overdueInvoices.reduce((sum, i) => sum + i.balance, 0);
    return [
      {
        role: 'ai',
        text: `Hello! I'm your CollectIQ Collections Intelligence Advisor. I've audited all ${state.invoices.length} invoices in your ledger. Total overdue amount is ${curr}${overdueTotal.toLocaleString('en-IN')} across ${overdueInvoices.length} overdue invoices. What would you like to review or execute today?`,
        time: 'Just now',
      },
    ];
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = ttsService.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });

    // Load AI summary
    const load = async () => {
      setLoadingSummary(true);
      try {
        const s = await geminiAIService.generateCollectionSummary(state);
        setSummary(s);
      } finally {
        setLoadingSummary(false);
      }
    };
    load();

    return () => {
      unsub();
      ttsService.stop();
    };
  }, [state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleToggleAudio = () => {
    if (isSpeaking) {
      ttsService.stop();
    } else if (summary?.spokenSummary) {
      ttsService.speak(summary.spokenSummary);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    const userMsg = {
      role: 'user' as const,
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput('');
    setIsChatSending(true);

    try {
      const reply = await geminiAIService.askAdvisor(query, state);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  const quickPrompts = [
    'Who has the highest overdue balance?',
    'What is our collection rate target?',
    'Status of Promises to Pay?',
    'Top 3 priorities today',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <RobotAvatar className="w-10 h-10 shrink-0" isSpeaking={isSpeaking} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">CollectIQ AI Advisor</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-xs text-slate-500">Autonomous Collections Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAudio}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Voice Summary"
            >
              {isSpeaking ? (
                <>
                  <Square size={13} className="fill-rose-700" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 size={15} />
                  <span>Listen</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Audio Wave Visualizer when speaking */}
          {isSpeaking && (
            <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2 text-indigo-800 text-xs font-semibold">
                <div className="flex items-center gap-1">
                  <span className="w-1 h-3 bg-indigo-600 rounded-full animate-bounce" />
                  <span className="w-1 h-5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1 h-4 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.3s]" />
                  <span className="w-1 h-2.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.45s]" />
                </div>
                <span>Playing Spoken Collection Audit...</span>
              </div>
              <button
                onClick={() => ttsService.stop()}
                className="text-[11px] font-bold text-indigo-700 hover:underline cursor-pointer"
              >
                Mute
              </button>
            </div>
          )}

          {/* AI Executive Summary Card */}
          <div className="bg-[#f8f9fe] border border-[#e2e4f6] rounded-2xl p-4.5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-600" />
                Live Collection Audit
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                Efficiency {liveRate}%
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
              {(summary?.bulletPoints || (state.invoices.length === 0 ? [
                'No invoices yet. Create your first invoice to get started.',
                'Add customer debtors to begin tracking collection schedules.',
              ] : [
                `${state.invoices.filter((i) => i.status === 'overdue').length} overdue invoices require follow-up.`,
                `Collection rate is currently ${liveRate}%.`,
              ])).map((pt, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>{pt}</span>
                </div>
              ))}
            </div>

            {summary?.aiInsight && (
              <div className="mt-3.5 pt-3 border-t border-[#e5e7f7] text-[11px] text-indigo-900 bg-indigo-50/60 rounded-xl p-2.5">
                <strong>AI Tactical Insight:</strong> {summary.aiInsight}
              </div>
            )}
          </div>

          {/* Priority Follow-up Actions */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 mb-2.5 uppercase tracking-wider">
              Priority Actions Today
            </h4>
            <div className="space-y-2">
              {(summary?.priorityActions || []).map((action, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {action.customerName}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600">
                        ₹{action.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {action.recommendedAction}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {action.channel === 'whatsapp' ? (
                      <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600" title="WhatsApp">
                        <MessageSquare size={14} />
                      </span>
                    ) : action.channel === 'call' ? (
                      <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600" title="Call">
                        <PhoneCall size={14} />
                      </span>
                    ) : (
                      <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600" title="Email">
                        <Mail size={14} />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Chat Stream */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 mb-2.5 uppercase tracking-wider">
              Ask AI Collection Advisor
            </h4>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {quickPrompts.map((qp) => (
                <button
                  key={qp}
                  onClick={() => handleSendMessage(qp)}
                  className="text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Messages box */}
            <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[200px] max-h-[300px] overflow-y-auto custom-scrollbar">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'ai' && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                      <Bot size={13} />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <span
                      className={`text-[9.5px] block mt-1 ${
                        m.role === 'user' ? 'text-indigo-200 text-right' : 'text-slate-400'
                      }`}
                    >
                      {m.time}
                    </span>
                  </div>

                  {m.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                      <User size={13} />
                    </div>
                  )}
                </div>
              ))}

              {isChatSending && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  <span>AI Advisor is analyzing data...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything about invoices, customers, recovery..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
            <button
              type="submit"
              disabled={isChatSending || !chatInput.trim()}
              className="w-10 h-10 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-50 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
