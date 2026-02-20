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
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 프리셋 답변을 타이핑 효과로 표시
  const streamPresetAnswer = useCallback(async (answer: string, messagesWithUser: Message[], assistantId: string) => {
    const CHUNK_SIZE = 8; // 한번에 표시할 글자 수
    const DELAY = 15; // ms 간격
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

    // 최종 완성
    setMessages(() => {
      return [...messagesWithUser, { id: assistantId, role: 'assistant' as const, content: answer }];
    });
  }, []);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isStreaming || !session?.access_token) return;

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

    // 프리셋 답변 확인
    const presetAnswer = getPresetAnswer(messageText);
    if (presetAnswer) {
      const answerWithTag = `[예시]\n\n${presetAnswer}`;
      await streamPresetAnswer(answerWithTag, updatedMessages, assistantId);
      setIsStreaming(false);
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
        body: JSON.stringify({ messages: chatHistory }),
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

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 md:w-14 md:h-14 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 md:mb-8">
          <Bot className="w-10 h-10 md:w-14 md:h-14 text-white" />
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3">AI 부동산인 실무비서</h1>
        <p className="text-slate-400 text-center mb-8 max-w-sm md:max-w-lg text-sm md:text-lg">
          AI 부동산인 실무비서를 이용하려면 로그인이 필요합니다
        </p>
        <Link
          href="/agent/auth/login"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold px-6 py-3 md:px-10 md:py-4 rounded-xl md:rounded-2xl hover:from-cyan-600 hover:to-emerald-600 transition-all text-base md:text-lg"
        >
          <LogIn className="w-5 h-5 md:w-6 md:h-6" />
          로그인하기
        </Link>
        <Link href="/agent" className="mt-4 text-sm md:text-base text-slate-500 hover:text-slate-300 transition-colors">
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => {
                if (messages.length > 0) {
                  setMessages([]);
                  setInput('');
                } else {
                  window.location.href = '/agent';
                }
              }}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 md:w-7 md:h-7" />
            </button>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-lg md:rounded-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <h1 className="text-white font-semibold text-sm md:text-xl">AI 부동산인 실무비서</h1>
                  <span className="px-1.5 py-0.5 md:px-2.5 md:py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded md:rounded-md text-[10px] md:text-xs text-amber-400 font-medium">
                    최고급 AI
                  </span>
                </div>
                <p className="text-slate-500 text-xs md:text-sm">최고급 AI 모델 · 중개실무 전문</p>
              </div>
            </div>
          </div>
          {remaining !== null && (
            <span className="text-xs md:text-sm text-slate-500">
              오늘 {remaining}회 남음
            </span>
          )}
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
              <div className="grid grid-cols-2 gap-2.5 md:gap-4 w-full max-w-lg md:max-w-3xl">
                {SUGGESTED_QUESTIONS.map((q) => {
                  const Icon = q.icon;
                  return (
                    <button
                      key={q.label}
                      onClick={() => sendMessage(q.question)}
                      className="flex items-center gap-3 md:gap-4 p-4 md:px-6 md:py-5 rounded-xl md:rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/80 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 active:scale-[0.97] transition-all text-left group cursor-pointer"
                    >
                      <div className={`w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-700/50 group-hover:bg-slate-600/50 transition-colors`}>
                        <Icon className={`w-4 h-4 md:w-6 md:h-6 ${q.color}`} />
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
  );
}
