'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getPresetAnswer } from '@/lib/ai-assistant-presets';
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Sparkles,
  Calculator,
  FileText,
  Scale,
  Loader2,
  LogIn,
  MessageSquarePlus,
  History,
  Trash2,
  X,
  PanelLeftOpen,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const SUGGESTED_QUESTIONS = [
  { icon: Calculator, label: '오피스텔 매매 중개보수', question: '오피스텔 매매 시 중개보수 상한요율은 얼마이고, 부가세를 별도로 청구할 수 있나요?', color: 'text-emerald-400' },
  { icon: FileText, label: '전세 필수 특약 추천', question: '선순위 근저당 말소 조건이 있는 전세 계약 시, 임차인 보호를 위한 필수 특약사항을 추천해주세요.', color: 'text-blue-400' },
  { icon: Scale, label: '경매 명도 실무', question: '경매 낙찰 후 선순위 임차인이 배당금을 수령하고도 명도를 거부하면, 어떤 절차로 대응해야 하나요?', color: 'text-amber-400' },
  { icon: Calculator, label: '상가 권리금 중개보수', question: '상가 임대차에서 권리금 양도양수 계약을 별도로 중개한 경우, 중개보수를 따로 받을 수 있나요? 관련 판례가 있나요?', color: 'text-violet-400' },
  { icon: Calculator, label: '2주택 비과세 요건', question: '일시적 2주택자의 취득세 중과 면제 요건과 양도세 비과세 요건을 각각 알려주세요. 처분 기한은 어떻게 되나요?', color: 'text-cyan-400' },
  { icon: FileText, label: '분양권 손피 특약', question: '분양권 전매 시 양도세를 매수인이 대납하는 "손피" 거래에서, 계약서에 어떤 특약을 넣어야 하나요? 주의할 점은?', color: 'text-rose-400' },
  { icon: Scale, label: '임대차 계약 갱신 사례', question: '주택임대차보호법상 계약갱신요구권의 행사 요건, 갱신 거절 사유, 묵시적 갱신의 차이점을 실무 사례와 함께 자세히 설명해주세요.', color: 'text-orange-400' },
  { icon: FileText, label: '공동중개 서류 및 범위', question: '타 지역 중개사와 공동중개 시 필요한 서류 목록과 업무 범위를 알려주세요. 공동중개 계약서는 어떻게 작성하나요?', color: 'text-teal-400' },
];

export default function AiAssistantPage() {
  const { user, session, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Session management
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 세션 목록 로드
  const loadSessions = useCallback(async () => {
    if (!session?.access_token) return;
    setSessionsLoading(true);
    try {
      const res = await fetch('/api/ai-assistant/sessions', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.error('Failed to load sessions:', e);
    } finally {
      setSessionsLoading(false);
    }
  }, [session?.access_token]);

  // 초기 세션 로드
  useEffect(() => {
    if (user && session?.access_token) {
      loadSessions();
    }
  }, [user, session?.access_token, loadSessions]);

  // 세션 메시지 로드
  const loadSessionMessages = useCallback(async (sessionId: string) => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`/api/ai-assistant/sessions/${sessionId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const loaded: Message[] = (data.messages || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }));
        setMessages(loaded);
        setActiveSessionId(sessionId);
        setSidebarOpen(false);
      }
    } catch (e) {
      console.error('Failed to load session messages:', e);
    }
  }, [session?.access_token]);

  // 새 대화 시작
  const startNewConversation = () => {
    setMessages([]);
    setActiveSessionId(null);
    setInput('');
    setSidebarOpen(false);
  };

  // 세션 삭제
  const deleteSession = async (sessionId: string) => {
    if (!session?.access_token) return;
    setDeletingSessionId(sessionId);
    try {
      const res = await fetch(`/api/ai-assistant/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (activeSessionId === sessionId) {
          startNewConversation();
        }
      }
    } catch (e) {
      console.error('Failed to delete session:', e);
    } finally {
      setDeletingSessionId(null);
    }
  };

  // 프리셋 답변을 타이핑 효과로 표시
  const streamPresetAnswer = useCallback(async (answer: string, messagesWithUser: Message[], assistantId: string) => {
    const CHUNK_SIZE = 8;
    const DELAY = 15;
    let displayed = '';

    for (let i = 0; i < answer.length; i += CHUNK_SIZE) {
      displayed = answer.slice(0, i + CHUNK_SIZE);
      const current = displayed;
      setMessages(() => {
        const updated = [...messagesWithUser, { id: assistantId, role: 'assistant' as const, content: current }];
        return updated;
      });
      await new Promise((r) => setTimeout(r, DELAY));
    }

    setMessages(() => {
      return [...messagesWithUser, { id: assistantId, role: 'assistant' as const, content: answer }];
    });
  }, []);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isStreaming) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
    };

    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
    };

    const updatedMessages = [...messages, userMessage];
    setMessages([...updatedMessages, assistantMessage]);
    setInput('');
    setIsStreaming(true);

    const isFirstMessage = messages.length === 0;

    // 프리셋 답변 확인 (DB 저장 안함, 차감 안함, 로그인 불필요)
    const presetAnswer = getPresetAnswer(messageText);
    if (presetAnswer) {
      const answerWithTag = `[예시]\n\n${presetAnswer}`;
      await streamPresetAnswer(answerWithTag, updatedMessages, assistantId);
      setIsStreaming(false);
      return;
    }

    // API 호출 필요 → 로그인 필수 체크
    if (!user || !session?.access_token) {
      // 로그인 안 됨 → 답변 표시하지 않고 회원가입으로 이동
      setMessages((prev) => prev.slice(0, -1)); // 빈 assistant 메시지 제거
      setIsStreaming(false);
      window.location.href = '/agent/auth/signup';
      return;
    }

    // API 호출 (직접 입력한 질문)
    try {
      const chatHistory = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: chatHistory,
          sessionId: activeSessionId,
          isFirstMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '오류가 발생했습니다');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('스트림을 읽을 수 없습니다');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.type === 'text') {
              fullContent += data.content;
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg.role === 'assistant') {
                  lastMsg.content = fullContent;
                }
                return updated;
              });
            } else if (data.type === 'done') {
              if (data.remaining !== undefined) {
                setRemaining(data.remaining);
              }
              if (data.sessionId) {
                setActiveSessionId(data.sessionId);
                loadSessions();
              }
            } else if (data.type === 'error') {
              fullContent = data.content;
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg.role === 'assistant') {
                  lastMsg.content = fullContent;
                }
                return updated;
              });
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    } catch (error: any) {
      setMessages((prev) => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg.role === 'assistant') {
          lastMsg.content = error.message || '오류가 발생했습니다. 다시 시도해주세요.';
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 md:w-14 md:h-14 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const isLoggedIn = !!user && !!session?.access_token;

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar overlay (mobile) */}
      {isLoggedIn && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - 로그인 시에만 표시: 데스크톱 항상 노출, 모바일은 토글 */}
      {isLoggedIn && <aside
        className={`fixed md:relative md:flex z-50 md:z-auto h-full bg-slate-800 border-r border-slate-700/50 flex-col transition-all duration-300 flex-shrink-0 ${
          sidebarOpen ? 'flex w-80' : 'hidden md:flex md:w-80'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            대화 내역
          </h2>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white md:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New conversation button */}
        <div className="p-3">
          <button
            onClick={startNewConversation}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl text-sm font-medium hover:from-cyan-500/30 hover:to-emerald-500/30 transition-all"
          >
            <MessageSquarePlus className="w-4 h-4" />
            새 대화
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          {sessionsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-8 px-4">아직 대화 내역이 없습니다</p>
          ) : (
            <div className="px-2 py-1 space-y-0.5">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    activeSessionId === s.id
                      ? 'bg-cyan-500/15 border border-cyan-500/20'
                      : 'hover:bg-slate-700/50 border border-transparent'
                  }`}
                  onClick={() => loadSessionMessages(s.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${activeSessionId === s.id ? 'text-cyan-300' : 'text-slate-300'}`}>
                      {s.title}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(s.updated_at)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(s.id);
                    }}
                    disabled={deletingSessionId === s.id}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1 rounded"
                  >
                    {deletingSessionId === s.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              {/* Sidebar toggle (mobile only, logged in only) */}
              {isLoggedIn && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-slate-400 hover:text-white transition-colors md:hidden"
                  title="대화 내역"
                >
                  <PanelLeftOpen className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => {
                  if (messages.length > 0) {
                    startNewConversation();
                  } else if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    window.location.href = '/';
                  }
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-lg md:rounded-xl flex items-center justify-center">
                  <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-semibold text-sm md:text-xl">AI 부동산인 실무비서</h1>
                  <p className="text-slate-500 text-xs md:text-sm">최고급 AI 모델 · 중개실무 전문</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center px-3 py-1 md:px-4 md:py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs md:text-sm text-cyan-400 font-semibold whitespace-nowrap leading-none">
                {remaining !== null ? `오늘 ${remaining}회 남음` : '5회/일 무료'}
              </span>
              {!isLoggedIn && (
                <Link
                  href="/agent/auth/signup"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-300 text-xs md:text-sm font-medium hover:bg-cyan-500/30 transition-colors whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  로그인
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
            {messages.length === 0 ? (
              // Empty state with suggested questions
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6">
                  <Bot className="w-10 h-10 md:w-14 md:h-14 text-white" />
                </div>
                <h2 className="text-xl md:text-3xl font-bold text-white mb-2 md:mb-3">무엇이 궁금하세요?</h2>
                <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-1 md:py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-full mb-3 md:mb-4">
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-amber-400" />
                  <span className="text-xs md:text-sm text-amber-300 font-medium">최고급 AI 모델 사용중</span>
                </div>
                <p className="text-slate-400 text-sm md:text-lg mb-8 md:mb-10 text-center max-w-md md:max-w-xl">
                  중개보수, 계약서 특약, 세금, 판례 등<br />부동산 중개 실무에 관한 모든 질문을 해보세요
                </p>
                <div className="grid grid-cols-2 gap-3 md:gap-5 w-full max-w-lg md:max-w-4xl">
                  {SUGGESTED_QUESTIONS.map((q) => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={q.label}
                        onClick={() => sendMessage(q.question)}
                        className="flex items-center gap-3 md:gap-4 p-4 md:px-6 md:py-5 rounded-xl md:rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/80 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 active:scale-[0.97] transition-all text-left group cursor-pointer"
                      >
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-700/50 group-hover:bg-slate-600/50 transition-colors`}>
                          <Icon className={`w-5 h-5 md:w-6 md:h-6 ${q.color}`} />
                        </div>
                        <span className="text-sm md:text-base font-medium text-slate-300 group-hover:text-white transition-colors leading-snug">
                          {q.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Chat messages
              <div className="space-y-6 md:space-y-8">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-3 md:gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] rounded-2xl px-4 py-3 md:px-6 md:py-4 ${
                        message.role === 'user'
                          ? 'bg-cyan-600/30 border border-cyan-500/20 rounded-tr-sm'
                          : 'bg-slate-800 border border-slate-700/50 rounded-tl-sm'
                      }`}
                    >
                      {message.content ? (
                        <div className={`text-sm md:text-base whitespace-pre-wrap leading-relaxed md:leading-7 ${message.role === 'user' ? 'text-white' : 'text-slate-200'}`}>
                          {message.content}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                          <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                          <span className="text-sm md:text-base">답변을 작성하고 있습니다...</span>
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 md:w-11 md:h-11 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-4 h-4 md:w-5 md:h-5 text-slate-300" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="sticky bottom-0 bg-slate-900/80 backdrop-blur-xl border-t border-slate-700/50">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 md:py-5">
            <div className="flex items-end gap-2 md:gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="중개 실무에 관해 물어보세요..."
                  rows={1}
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl md:rounded-2xl px-4 py-3 md:px-6 md:py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 resize-none text-sm md:text-base"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                  disabled={isStreaming}
                />
              </div>
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isStreaming}
                className="w-11 h-11 md:w-14 md:h-14 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0 hover:from-cyan-600 hover:to-emerald-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isStreaming ? (
                  <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-white animate-spin" />
                ) : (
                  <Send className="w-5 h-5 md:w-6 md:h-6 text-white" />
                )}
              </button>
            </div>
            <p className="text-[10px] md:text-xs text-slate-600 mt-1.5 md:mt-2.5 text-center leading-relaxed">
              ⚠️ 본 AI의 답변은 법적 효력이 없으며, 법률적 조언이 아닙니다. 답변 내용은 실무 참고용으로만 활용하시고, 중요한 법률·세무 사안은 반드시 변호사·세무사 등 전문가와 상담하시기 바랍니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
