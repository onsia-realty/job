'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MessageCircle, X, Send, Home, ArrowLeft, Mail, Phone, Headset,
  FileText, CreditCard, Shield, UserPlus, HelpCircle, PenLine, Bot,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import {
  getSupportContact,
  SUPPORT_HOURS,
  type SupportContact,
} from '@/lib/support-knowledge';
import { buildFaqAnswer, buildPaymentRefundAnswer } from '@/lib/support-faq';

interface ChatMessage {
  id: number;
  type: 'bot' | 'user' | 'handoff';
  text: string;
  time: string;
  contact?: SupportContact;
}

type ViewState = 'faq' | 'chat';

const MAX_INPUT_CHARS = 500;
const SESSION_KEY = 'booin_support_session_id';

// 답변은 support-faq 빌더에서 생성 (API 의 FAQ 답변과 같은 출처 — 문구 중복 금지)
const FAQ_CATEGORIES = [
  { icon: PenLine, label: '구인글 작성 방법', question: '구인글은 어떻게 작성하나요?', answer: () => buildFaqAnswer('post-howto') },
  { icon: Shield, label: '인증 방법', question: '기업 인증은 어떻게 하나요?', answer: () => buildFaqAnswer('company-verify') },
  { icon: CreditCard, label: '상품 및 요금 안내', question: '상품 및 요금이 궁금해요.', answer: () => buildFaqAnswer('pricing-all') },
  { icon: FileText, label: '이력서 등록', question: '이력서는 어떻게 등록하나요?', answer: () => buildFaqAnswer('resume-howto') },
  { icon: UserPlus, label: '회원가입 / 계정', question: '회원가입은 어떻게 하나요?', answer: () => buildFaqAnswer('signup-howto') },
  { icon: HelpCircle, label: '결제 및 환불', question: '결제와 환불은 어떻게 하나요?', answer: buildPaymentRefundAnswer },
];

function getTimeString() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function getSessionId(): string {
  const make = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`);
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) return saved;
    const id = make();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return make();
  }
}

async function getAccessToken(): Promise<string | null> {
  try {
    const session = await getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 1,
  type: 'bot',
  text: '안녕하세요! 부동산인 고객센터예요 🏠\n궁금한 내용을 선택하시거나 직접 질문해 주세요.',
  time: getTimeString(),
};

let nextId = 2;
const newId = () => Date.now() * 100 + (nextId++ % 100);

function HandoffCard({ contact }: { contact: SupportContact }) {
  return (
    <div className="bg-white border border-blue-200 rounded-2xl rounded-tl-md shadow-sm px-3.5 py-3">
      <p className="text-[13px] font-semibold text-gray-800">상담원이 직접 도와드릴게요</p>
      <p className="text-[11px] text-gray-500 mt-0.5">운영시간: {contact.hours}</p>
      <div className="flex flex-col gap-1.5 mt-2.5">
        <a
          href={`mailto:${contact.email}`}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />
          이메일 문의 ({contact.email})
        </a>
        <a
          href={`tel:${contact.phone.replace(/[^0-9]/g, '')}`}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 rounded-xl text-xs font-medium transition-colors"
        >
          <Phone className="w-3.5 h-3.5" />
          전화 상담 {contact.phone} ({contact.hoursShort})
        </a>
        {contact.kakaoChannelUrl && (
          <a
            href={contact.kakaoChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] rounded-xl text-xs font-medium transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            카카오톡 상담
          </a>
        )}
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [view, setView] = useState<ViewState>('faq');
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 스크롤 하단 고정
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleToggle = () => {
    if (isOpen) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsAnimating(false);
      }, 200);
    } else {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  // 처음으로 (대화 초기화)
  const handleReset = () => {
    setMessages([{ ...WELCOME_MESSAGE, time: getTimeString() }]);
    setView('faq');
    setInput('');
  };

  // 뒤로가기 (채팅 → FAQ 메뉴)
  const handleBack = () => {
    setView('faq');
  };

  const pushMessage = (msg: Omit<ChatMessage, 'id' | 'time'>) => {
    setMessages(prev => [...prev, { ...msg, id: newId(), time: getTimeString() }]);
  };

  // FAQ 클릭 → 하드코딩 답변 (대화 히스토리에도 남아 후속 질문 맥락이 됨)
  const handleFaqClick = (faq: typeof FAQ_CATEGORIES[number]) => {
    pushMessage({ type: 'user', text: faq.question });
    setView('chat');
    setTimeout(() => pushMessage({ type: 'bot', text: faq.answer() }), 400);
  };

  // 상담원 연결 — 모델 호출 없이 핸드오프 카드만 표시
  const handleHandoff = () => {
    setView('chat');
    pushMessage({ type: 'handoff', text: '', contact: getSupportContact() });
  };

  // 직접 질문 → /api/chat (대화 히스토리 포함)
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = { id: newId(), type: 'user', text, time: getTimeString() };
    const history = [...messages, userMsg]
      .filter((m) => m.type !== 'handoff' && m.text)
      .map((m) => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.text }))
      .slice(-12);

    setMessages(prev => [...prev, userMsg]);
    setView('chat');
    setInput('');
    setIsLoading(true);

    try {
      const token = await getAccessToken();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: history, sessionId: getSessionId() }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        pushMessage({ type: 'bot', text: data.error || '답변을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' });
        return;
      }

      pushMessage({ type: 'bot', text: data.answer || '답변을 불러오지 못했어요.' });
      if (data.handoff) {
        pushMessage({ type: 'handoff', text: '', contact: data.contact ?? getSupportContact() });
      }
    } catch {
      pushMessage({ type: 'bot', text: '네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.' });
    } finally {
      setIsLoading(false);
    }
  };

  const showFaqMenu = view === 'faq';
  const showActionBtns = view === 'chat' && messages.length > 1 && !isLoading;

  return (
    <>
      {/* 플로팅 버튼 */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group hover:scale-105 active:scale-95"
          aria-label="채팅 열기"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            1
          </span>
        </button>
      )}

      {/* 채팅 윈도우 */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-32px)] flex flex-col overflow-hidden transition-all duration-200 ${
            isAnimating ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'
          }`}
          style={{
            height: 'min(680px, calc(100vh - 48px))',
            borderRadius: '24px',
            boxShadow: 'rgba(0,0,0,0.1) 0px 4px 6px, rgba(0,0,0,0.15) 0px 8px 30px, rgba(255,255,255,0.2) 0px 0px 0px 1px inset',
          }}
        >
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              {/* 처음으로 */}
              <button
                onClick={handleReset}
                className="p-1.5 hover:bg-white/15 rounded-full transition-colors"
                aria-label="처음으로"
                title="처음으로"
              >
                <Home className="w-4 h-4 text-white" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center relative">
                  <Bot className="w-5 h-5 text-white" />
                  <span className="absolute -bottom-0.5 -right-0.5 bg-emerald-400 text-[7px] font-bold text-white px-1 rounded-full leading-tight">
                    AI
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm leading-tight">부동산인 고객센터</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <span className="text-blue-100 text-[11px]">AI 상담 가능</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              {/* 뒤로가기 (채팅 → FAQ) */}
              {view === 'chat' && (
                <button
                  onClick={handleBack}
                  className="p-1.5 hover:bg-white/15 rounded-full transition-colors"
                  aria-label="뒤로가기"
                  title="뒤로가기"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
              )}
              {/* 닫기 */}
              <button
                onClick={handleToggle}
                className="p-1.5 hover:bg-white/15 rounded-full transition-colors"
                aria-label="닫기"
                title="닫기"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.type !== 'user' && (
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[78%] ${msg.type === 'user' ? 'order-1' : ''}`}>
                  {msg.type === 'handoff' && msg.contact ? (
                    <HandoffCard contact={msg.contact} />
                  ) : (
                    <div
                      className={`px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line break-words ${
                        msg.type === 'user'
                          ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md'
                          : 'bg-white text-gray-800 rounded-2xl rounded-tl-md border border-gray-200 shadow-sm'
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}
                  <p className={`text-[10px] text-gray-400 mt-0.5 ${msg.type === 'user' ? 'text-right' : ''}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}

            {/* 답변 생성 중 */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="px-3.5 py-3 bg-white rounded-2xl rounded-tl-md border border-gray-200 shadow-sm flex items-center gap-1" aria-label="답변 작성 중">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            {/* FAQ 카테고리 메뉴 */}
            {showFaqMenu && (
              <div className="space-y-2 pt-1">
                {FAQ_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.label}
                      onClick={() => handleFaqClick(cat)}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-left hover:bg-blue-50 hover:border-blue-300 transition-colors group shadow-sm"
                    >
                      <div className="w-8 h-8 bg-blue-50 group-hover:bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                        <Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-[13px] font-medium text-gray-700 group-hover:text-blue-700 transition-colors">
                        {cat.label}
                      </span>
                    </button>
                  );
                })}

                {/* 직접 질문하기 안내 */}
                <p className="text-center text-[11px] text-gray-400 pt-2">
                  또는 아래에서 직접 질문을 입력해 보세요 ✍️
                </p>
              </div>
            )}

            {/* 뒤로가기 / 다른 질문 버튼 */}
            {showActionBtns && (
              <div className="flex justify-center gap-2 pt-1">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                >
                  ← 뒤로가기
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-full text-xs font-medium hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-sm"
                >
                  🔄 다른 질문하기
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="bg-white border-t border-gray-200 flex-shrink-0">
            <div className="px-4 py-2.5">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  maxLength={MAX_INPUT_CHARS}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
                  placeholder="질문을 입력하세요..."
                  className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-full flex items-center justify-center transition-all flex-shrink-0 disabled:cursor-not-allowed"
                  aria-label="전송"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-1.5 gap-2">
                <p className="text-[10px] text-gray-400 leading-tight">
                  AI 상담이라 틀릴 수 있어요 · {SUPPORT_HOURS}
                </p>
                <button
                  onClick={handleHandoff}
                  className="flex items-center gap-1 px-2.5 py-1 border border-blue-200 text-blue-600 rounded-full text-[11px] font-medium hover:bg-blue-50 transition-colors flex-shrink-0"
                >
                  <Headset className="w-3 h-3" />
                  상담원 연결
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
