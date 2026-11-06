import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Volume2,
  Square,
  Send,
  MessageSquare,
  Bot,
  User,
  PhoneCall,
  Mail,
  History,
  Plus,
  MoreVertical,
  Trash2,
  AlertTriangle,
  Loader2,
  Clock,
  Settings,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { RobotAvatar } from '../common/Graphics';
import { AppState } from '../../services/storage';
import { geminiAIService, CollectionSummary } from '../../services/gemini';
import { ttsService } from '../../services/tts';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { ChatConversation, ChatMessage } from '../../types';

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
  const { currentUser, currentBusiness } = useAuth();

  const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');
  const [summary, setSummary] = useState<CollectionSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const curr = state.settings.currencySymbol || '₹';
  const totalBilled = state.invoices.reduce((sum, i) => sum + i.amount, 0);
  const totalCollected = state.payments.reduce((sum, p) => sum + p.amount, 0);
  const liveRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // Conversations & active chat
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversationTitle, setActiveConversationTitle] = useState<string>('Current Session');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Deletion modals state
  const [conversationToDelete, setConversationToDelete] = useState<ChatConversation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getGreetingMessage = () => {
    if (state.invoices.length === 0) {
      return {
        role: 'ai' as const,
        text: "Hello! I'm your CollectIQ Collections Intelligence Advisor. Your ledger is currently clean with no invoices recorded yet. Create your first invoice or add customers to get started.",
        time: 'Just now',
      };
    }
    const today = new Date().toISOString().split('T')[0];
    const overdueInvoices = state.invoices.filter(
      (i) => i.status === 'overdue' || (i.dueDate < today && i.balance > 0)
    );
    const overdueTotal = overdueInvoices.reduce((sum, i) => sum + i.balance, 0);
    return {
      role: 'ai' as const,
      text: `Hello! I'm your CollectIQ Collections Intelligence Advisor. I've audited all ${state.invoices.length} invoices in your ledger. Total overdue amount is ${curr}${overdueTotal.toLocaleString('en-IN')} across ${overdueInvoices.length} overdue invoices. What would you like to review or execute today?`,
      time: 'Just now',
    };
  };

  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string; time: string }[]>([
    getGreetingMessage(),
  ]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to voice TTS
  useEffect(() => {
    const unsub = ttsService.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });

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

  // Subscribe to conversation list for the authenticated user
  useEffect(() => {
    if (!currentUser?.uid) return;

    setIsLoadingHistory(true);
    const unsubscribe = chatService.subscribeConversations(
      currentUser.uid,
      (convs) => {
        setConversations(convs);
        setIsLoadingHistory(false);
      },
      () => {
        setIsLoadingHistory(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser?.uid]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Toast timer
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleToggleAudio = () => {
    if (isSpeaking) {
      ttsService.stop();
    } else if (summary?.spokenSummary) {
      ttsService.speak(summary.spokenSummary);
    }
  };

  const startNewChat = () => {
    setActiveConversationId(null);
    setActiveConversationTitle('New Conversation');
    setMessages([getGreetingMessage()]);
    setActiveTab('chat');
  };

  const loadConversation = async (conv: ChatConversation) => {
    if (!currentUser?.uid) return;
    setActiveConversationId(conv.id);
    setActiveConversationTitle(conv.title);
    setIsLoadingMessages(true);
    setActiveTab('chat');

    try {
      const msgs = await chatService.getMessages(currentUser.uid, conv.id);
      if (msgs.length > 0) {
        setMessages(
          msgs.map((m) => ({
            role: m.role,
            text: m.text,
            time: m.time || new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }))
        );
      } else {
        setMessages([getGreetingMessage()]);
      }
    } catch (e) {
      console.warn('Failed to load conversation messages', e);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      role: 'user' as const,
      text: query,
      time: userTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput('');
    setIsChatSending(true);

    const userId = currentUser?.uid || 'local_user';
    const businessId = currentBusiness?.businessId || currentUser?.businessId || 'biz-default';

    let convId = activeConversationId;

    // Create a new conversation in Firestore if none active
    if (!convId && currentUser?.uid) {
      try {
        const titleSnippet = query.length > 40 ? query.substring(0, 37) + '...' : query;
        const newConv = await chatService.createConversation(userId, businessId, titleSnippet);
        convId = newConv.id;
        setActiveConversationId(convId);
        setActiveConversationTitle(newConv.title);
      } catch (err) {
        console.warn('Could not initialize conversation record in Firestore:', err);
      }
    }

    // Persist user message to Firestore
    if (convId && currentUser?.uid) {
      chatService
        .addMessage({
          userId,
          businessId,
          conversationId: convId,
          role: 'user',
          text: query,
          time: userTime,
        })
        .catch((e) => console.warn('Failed to save user message to Firestore', e));
    }

    try {
      const reply = await geminiAIService.askAdvisor(query, state);
      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text: reply,
          time: aiTime,
        },
      ]);

      // Persist AI message to Firestore
      if (convId && currentUser?.uid) {
        chatService
          .addMessage({
            userId,
            businessId,
            conversationId: convId,
            role: 'ai',
            text: reply,
            time: aiTime,
          })
          .catch((e) => console.warn('Failed to save AI reply to Firestore', e));
      }
    } finally {
      setIsChatSending(false);
    }
  };

  // Confirm delete single conversation
  const handleDeleteConversationConfirm = async () => {
    if (!conversationToDelete || !currentUser?.uid) return;
    setIsDeleting(true);

    try {
      await chatService.deleteConversation(currentUser.uid, conversationToDelete.id);

      // Immediately update local state without requiring a refresh
      setConversations((prev) => prev.filter((c) => c.id !== conversationToDelete.id));

      // If the currently open conversation was deleted, reset to clean session
      if (activeConversationId === conversationToDelete.id) {
        setActiveConversationId(null);
        setActiveConversationTitle('New Conversation');
        setMessages([getGreetingMessage()]);
      }

      setToastMessage('Conversation deleted permanently.');
    } catch (err: any) {
      console.error('Failed to delete conversation:', err);
      setToastMessage('Error deleting conversation: ' + (err.message || 'Permission denied'));
    } finally {
      setIsDeleting(false);
      setConversationToDelete(null);
    }
  };

  // Confirm clear all chat history
  const handleClearAllConfirm = async () => {
    if (!currentUser?.uid) return;
    setIsClearingAll(true);

    try {
      const { deletedCount } = await chatService.deleteAllConversations(currentUser.uid);

      // Immediately clear local state
      setConversations([]);
      setActiveConversationId(null);
      setActiveConversationTitle('New Conversation');
      setMessages([getGreetingMessage()]);

      setToastMessage(`All chat history cleared (${deletedCount} conversations removed).`);
    } catch (err: any) {
      console.error('Failed to clear chat history:', err);
      setToastMessage('Error clearing chat history: ' + (err.message || 'Permission denied'));
    } finally {
      setIsClearingAll(false);
      setIsConfirmingClearAll(false);
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
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200 relative">
        {/* Toast notification banner */}
        {toastMessage && (
          <div className="absolute top-16 left-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center justify-between border border-slate-700 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white ml-2 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Top Header */}
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
            {activeTab === 'chat' && (
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
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Chat vs History) */}
        <div className="px-6 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare size={14} />
              <span>Active Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History size={14} />
              <span>Chat History</span>
              {conversations.length > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700">
                  {conversations.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={startNewChat}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-indigo-200"
              title="Start a new chat session"
            >
              <Plus size={14} />
              <span>New Chat</span>
            </button>
          </div>
        </div>

        {/* ===================== TAB 1: ACTIVE CHAT ===================== */}
        {activeTab === 'chat' && (
          <>
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
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Ask AI Collection Advisor
                    </h4>
                    {activeConversationId && (
                      <span className="text-[10px] text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                        {activeConversationTitle}
                      </span>
                    )}
                  </div>
                  {activeConversationId && (
                    <button
                      onClick={startNewChat}
                      className="text-[11px] text-slate-500 hover:text-indigo-600 font-medium cursor-pointer"
                    >
                      + New Session
                    </button>
                  )}
                </div>

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
                <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[220px] max-h-[340px] overflow-y-auto custom-scrollbar">
                  {isLoadingMessages ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                      <Loader2 size={24} className="animate-spin text-indigo-600" />
                      <span className="text-xs">Loading conversation history...</span>
                    </div>
                  ) : (
                    messages.map((m, idx) => (
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
                    ))
                  )}

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
          </>
        )}

        {/* ===================== TAB 2: CHAT HISTORY ===================== */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar flex flex-col">
            {/* History Management Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Your Chat History</h4>
                <p className="text-xs text-slate-500">
                  {currentUser?.email ? `Saved conversations for ${currentUser.email}` : 'Your saved conversations'}
                </p>
              </div>

              {conversations.length > 0 && (
                <button
                  onClick={() => setIsConfirmingClearAll(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Delete all your conversations"
                >
                  <Trash2 size={13} />
                  <span>Clear All Chat History</span>
                </button>
              )}
            </div>

            {/* Conversation List */}
            {isLoadingHistory ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                <Loader2 size={24} className="animate-spin text-indigo-600" />
                <span className="text-xs">Loading conversations from Firestore...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <MessageSquare size={26} />
                </div>
                <h5 className="text-sm font-bold text-slate-800">No Chat History Found</h5>
                <p className="text-xs text-slate-500 max-w-xs mt-1 mb-4 leading-relaxed">
                  You haven&apos;t saved any AI advisor conversations yet. Start a new chat to ask questions about collections, invoices, or debtor accounts.
                </p>
                <button
                  onClick={startNewChat}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <Plus size={14} />
                  <span>Start New Conversation</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {conversations.map((conv) => {
                  const isActive = activeConversationId === conv.id;
                  const isMenuOpen = openMenuId === conv.id;
                  const dateStr = conv.updatedAt || conv.createdAt;
                  const formattedDate = dateStr
                    ? new Date(dateStr).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Recent';

                  return (
                    <div
                      key={conv.id}
                      className={`group relative p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        isActive
                          ? 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-200'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Left clickable content to load conversation */}
                      <button
                        onClick={() => loadConversation(conv)}
                        className="flex-1 min-w-0 text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {conv.title || 'Conversation Session'}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-600 text-white shrink-0">
                              Active
                            </span>
                          )}
                        </div>

                        {conv.lastMessage && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {conv.lastMessage}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2 text-[10.5px] text-slate-400">
                          <Clock size={11} />
                          <span>{formattedDate}</span>
                        </div>
                      </button>

                      {/* Right Three-Dot Menu */}
                      <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : conv.id);
                          }}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                          title="Conversation actions"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div className="absolute right-0 top-9 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                setConversationToDelete(conv);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} className="text-rose-500 shrink-0" />
                              <span>Delete Chat</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== CONFIRMATION MODAL: DELETE INDIVIDUAL CONVERSATION ===================== */}
        {conversationToDelete && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>

              <h4 className="text-base font-extrabold text-slate-900">Delete Conversation</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Are you sure you want to delete this conversation? This action cannot be undone.
              </p>

              {conversationToDelete.title && (
                <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Conversation: </span>
                  <span className="italic">&ldquo;{conversationToDelete.title}&rdquo;</span>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setConversationToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteConversationConfirm}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== CONFIRMATION MODAL: CLEAR ALL CHAT HISTORY ===================== */}
        {isConfirmingClearAll && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Trash2 size={24} />
              </div>

              <h4 className="text-base font-extrabold text-slate-900">Clear All Chat History</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Are you sure you want to delete all your chat history? All your conversations and messages will be permanently deleted from Firebase. This action cannot be undone.
              </p>

              <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <strong>Scope Notice:</strong> This operation deletes only the conversations created by your logged-in account (<strong>{currentUser?.email || 'Current User'}</strong>). It will not affect other users or any business records.
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isClearingAll}
                  onClick={() => setIsConfirmingClearAll(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isClearingAll}
                  onClick={handleClearAllConfirm}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isClearingAll ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Clearing All...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>Clear All History</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
