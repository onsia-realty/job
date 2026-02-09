'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, ChevronDown } from 'lucide-react';

interface ChatMessage {
  id: number;
  type: 'bot' | 'user';
  text: string;
  time: string;
}

const FAQ_BUTTONS = [
  '구인글 작성 방법',
  '인증은 어떻게 하나요?',
  '프리미엄 공고란?',
  '이력서 등록 방법',
  '문의하기',
];

const FAQ_ANSWERS: Record<string, string> = {
  '구인글 작성 방법': '마이페이지 → 구인글 작성에서 공인중개사 또는 분양상담사 구인글을 작성할 수 있습니다. 기업 인증이 완료되어야 작성이 가능합니다.',
  '인증은 어떻게 하나요?': '마이페이지 → 기업 인증에서 중개사무소 등록번호, 사업자등록번호, 또는 분양현장 명함으로 인증할 수 있습니다.',
  '프리미엄 공고란?': '프리미엄 공고는 일반 공고보다 상위에 노출되며, 강조 표시가 적용됩니다. VIP 공고는 최상단 노출과 골드 테두리가 제공됩니다.',
  '이력서 등록 방법': '마이페이지 → 내 이력서에서 경력, 자격증, 희망 조건 등을 등록할 수 있습니다.',
  '문의하기': '추가 문의사항이 있으시면 아래에 메시지를 입력해주세요. 운영시간(평일 09:00~18:00)에 순차적으로 답변드립니다.',
};

function getTimeString() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'bot',
      text: '안녕하세요! 부동산인 고객센터입니다.\n무엇을 도와드릴까요?',
      time: getTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 열기/닫기 애니메이션
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

  // 스크롤 하단 고정
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // FAQ 버튼 클릭
  const handleFaqClick = (question: string) => {
    const userMsg: ChatMessage = {
      id: Date.now(),
      type: 'user',
      text: question,
      time: getTimeString(),
    };
    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: FAQ_ANSWERS[question] || '죄송합니다. 해당 질문에 대한 답변을 준비 중입니다.',
        time: getTimeString(),
      };
      setMessages(prev => [...prev, botMsg]);
    }, 600);
  };

  // 메시지 전송
  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      type: 'user',
      text: input.trim(),
      time: getTimeString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: '메시지가 접수되었습니다. 운영시간(평일 09:00~18:00)에 담당자가 확인 후 답변드리겠습니다.',
        time: getTimeString(),
      };
      setMessages(prev => [...prev, botMsg]);
    }, 800);
  };

  return (
    <>
      {/* 플로팅 버튼 */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group hover:scale-105 active:scale-95"
          aria-label="채팅 열기"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          {/* 알림 뱃지 */}
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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
            boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 6px, rgba(0, 0, 0, 0.15) 0px 8px 30px, rgba(255, 255, 255, 0.2) 0px 0px 0px 1px inset',
          }}
        >
          {/* 헤더 */}
          <div className="bg-blue-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">부동산인 고객센터</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-blue-100 text-xs">온라인</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleToggle}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="채팅 최소화"
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleToggle}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="채팅 닫기"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'bot' && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                <div className={`max-w-[75%] ${msg.type === 'user' ? 'order-1' : ''}`}>
                  <div
                    className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                      msg.type === 'user'
                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-md'
                        : 'bg-white text-gray-800 rounded-2xl rounded-tl-md border border-gray-200'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <p className={`text-[10px] text-gray-400 mt-1 ${msg.type === 'user' ? 'text-right' : ''}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}

            {/* FAQ 버튼 (메시지가 1개일 때만) */}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pl-10">
                {FAQ_BUTTONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleFaqClick(q)}
                    className="px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-full text-xs font-medium hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && handleSend()}
                placeholder="메시지를 입력하세요..."
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0 disabled:cursor-not-allowed"
                aria-label="전송"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              운영시간: 평일 09:00 ~ 18:00
            </p>
          </div>
        </div>
      )}
    </>
  );
}
