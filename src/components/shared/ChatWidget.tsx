'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MessageCircle, X, Send, Home, ArrowLeft, Mail,
  FileText, CreditCard, Shield, UserPlus, HelpCircle, PenLine, Bot,
} from 'lucide-react';

interface ChatMessage {
  id: number;
  type: 'bot' | 'user';
  text: string;
  time: string;
}

type ViewState = 'faq' | 'chat';

const CONTACT_EMAIL = 'onsia777@gmail.com';

const FAQ_CATEGORIES = [
  {
    icon: PenLine,
    label: '구인글 작성 방법',
    question: '구인글은 어떻게 작성하나요?',
    answer: '모든 공고는 무료(일반)로 등록됩니다.\n\n✅ 기업 인증 완료 후 작성 가능\n✅ 공인중개사 / 분양상담사 카테고리 선택\n✅ 등록 후 "내 공고보기"에서 유료 등급으로 업그레이드 가능\n\n📌 무료 공고는 24시간 후 자동 만료됩니다.',
  },
  {
    icon: Shield,
    label: '인증 방법',
    question: '기업 인증은 어떻게 하나요?',
    answer: '마이페이지 → 기업 인증에서 아래 서류 중 하나로 인증할 수 있습니다.\n\n📋 중개사무소 등록번호\n📋 사업자등록번호\n📋 분양현장 명함\n\n⚠️ 기업 인증이 완료되어야 구인글 작성이 가능합니다.',
  },
  {
    icon: CreditCard,
    label: '상품 및 요금 안내',
    question: '상품 및 요금이 궁금합니다.',
    answer: '📌 공인중개사 상품\n• 일반(무료): 24시간 노출\n• BASIC 4,900원/5일: 반짝이 효과 + 골드 테두리\n• 프리미엄 9,900원/1주일: 전용 섹션 + 조회수 3배\n• VIP 24,900원/1주일: 최상단 슬라이더 + 조회수 5배\n\n📌 분양상담사 상품\n• 일반(무료): 24시간 노출\n• 프리미엄 4,900원/5일: 반짝이 효과 + 시안 테두리\n• 슈페리어 9,900원/1주일: 전용 섹션 + 조회수 4배\n• 유니크 24,900원/1주일: 최상단 + 조회수 7배\n\n💳 결제: 신용카드 (포트원)',
  },
  {
    icon: FileText,
    label: '이력서 등록',
    question: '이력서는 어떻게 등록하나요?',
    answer: '마이페이지 → 내 이력서에서 등록할 수 있습니다.\n\n✏️ 경력, 자격증, 희망 근무조건 등을 입력하시면 기업회원에게 노출됩니다.\n\n💡 이력서를 상세하게 작성할수록 매칭 확률이 높아집니다!',
  },
  {
    icon: UserPlus,
    label: '회원가입 / 계정',
    question: '회원가입은 어떻게 하나요?',
    answer: '아래 방법으로 간편하게 가입할 수 있습니다.\n\n📧 이메일 회원가입\n🟡 카카오 로그인\n🔵 구글 로그인\n\n비밀번호 분실 시: 로그인 화면 → 비밀번호 찾기 → 이메일 인증으로 재설정',
  },
  {
    icon: HelpCircle,
    label: '결제 및 환불',
    question: '결제와 환불은 어떻게 하나요?',
    answer: '💳 결제 안내\n• 결제 수단: 신용카드\n• 결제 후 즉시 등급 적용\n• 기간 만료 시 자동으로 일반(무료)으로 전환\n\n🔄 환불/결제 관련 문의\n결제 취소 및 환불은 아래 이메일로 문의해주세요.\n\n📧 onsia777@gmail.com\n\n운영시간: 평일 09:00 ~ 18:00',
  },
];

function getTimeString() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 1,
  type: 'bot',
  text: '안녕하세요! 부동산인 고객센터입니다 🏠\n궁금한 내용을 선택하시거나 직접 질문해주세요.',
  time: getTimeString(),
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [view, setView] = useState<ViewState>('faq');
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 스크롤 하단 고정
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  // 봇 메시지 추가 (타이핑 딜레이)
  const addBotMessage = (text: string) => {
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        text,
        time: getTimeString(),
      }]);
    }, 500);
  };

  // FAQ 클릭 → 하드코딩 답변
  const handleFaqClick = (faq: typeof FAQ_CATEGORIES[number]) => {
    const userMsg: ChatMessage = {
      id: Date.now(),
      type: 'user',
      text: faq.question,
      time: getTimeString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setView('chat');
    addBotMessage(faq.answer);
  };

  // 직접 질문 → 이메일 안내
  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      type: 'user',
      text: input.trim(),
      time: getTimeString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setView('chat');
    setInput('');
    addBotMessage(
      `문의해 주셔서 감사합니다 🙏\n\n해당 내용은 담당자 확인 후 답변드리겠습니다.\n아래 이메일로 상세 내용을 보내주시면 더 빠르게 도움드릴 수 있습니다.\n\n📧 ${CONTACT_EMAIL}\n\n운영시간: 평일 09:00 ~ 18:00`
    );
  };

  const showFaqMenu = view === 'faq';
  const showActionBtns = view === 'chat' && messages.length > 1;

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
                    <span className="text-blue-100 text-[11px]">상담 가능</span>
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
                {msg.type === 'bot' && (
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[78%] ${msg.type === 'user' ? 'order-1' : ''}`}>
                  <div
                    className={`px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line ${
                      msg.type === 'user'
                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md'
                        : 'bg-white text-gray-800 rounded-2xl rounded-tl-md border border-gray-200 shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <p className={`text-[10px] text-gray-400 mt-0.5 ${msg.type === 'user' ? 'text-right' : ''}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}

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
                  또는 아래에서 직접 질문을 입력해보세요 ✍️
                </p>
              </div>
            )}

            {/* 뒤로가기 / 이메일 문의 버튼 */}
            {showActionBtns && (
              <div className="flex flex-col items-center gap-2 pt-1">
                <div className="flex gap-2">
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
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-medium transition-colors shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" />
                  이메일로 문의하기
                </a>
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
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
                  placeholder="질문을 입력하세요..."
                  className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-full flex items-center justify-center transition-all flex-shrink-0 disabled:cursor-not-allowed"
                  aria-label="전송"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-1.5">
                운영시간: 평일 09:00 ~ 18:00
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
