'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Brain,
  Target,
  Users,
  TrendingUp,
  Shield,
  Rocket,
  Heart,
  Lightbulb,
  Crown,
  CheckCircle2,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { generateRandomQuestions, getTotalQuestionCount, type DNAQuestion } from '@/data/dnaQuestions';

// DNA 유형 정의
const DNA_TYPES = {
  RS: {
    code: 'RS',
    name: '야수형 영업왕',
    emoji: '🦁',
    color: 'from-orange-500 to-red-500',
    description: '숨만 쉬어도 영업을 하는 천재적 재능!',
    detail: '높은 리스크 감수성과 뛰어난 사교성을 갖춘 당신은 분양, 상가 영업에서 탑티어 성과를 낼 수 있는 타고난 영업인입니다.',
    jobs: ['분양상담사', '상가 전문 중개', '신규 분양 영업'],
    strengths: ['강력한 클로징 능력', '빠른 친밀감 형성', '도전 정신'],
  },
  RL: {
    code: 'RL',
    name: '승부사형 전략가',
    emoji: '🎯',
    color: 'from-blue-600 to-indigo-600',
    description: '차가운 머리와 뜨거운 심장을 가진 전략가',
    detail: '데이터 분석력과 리스크 감수성이 높은 당신은 경매, NPL, 투자 컨설팅 분야에서 빛을 발할 것입니다.',
    jobs: ['경매 전문가', 'NPL 투자', '부동산 컨설턴트'],
    strengths: ['시장 분석력', '냉철한 판단력', '협상 능력'],
  },
  SL: {
    code: 'SL',
    name: '카운셀러형 전문가',
    emoji: '🤝',
    color: 'from-emerald-500 to-teal-500',
    description: '고객의 마음을 읽고 신뢰를 파는 전문가',
    detail: '높은 사교성과 분석력을 갖춘 당신은 아파트, 고급 주거 중개에서 고객 만족도를 극대화할 수 있습니다.',
    jobs: ['아파트 전문 중개', '고급 주거 컨설팅', 'VIP 고객 관리'],
    strengths: ['고객 신뢰 구축', '맞춤형 상담', '장기 관계 형성'],
  },
  LA: {
    code: 'LA',
    name: '스마트 관리형',
    emoji: '📊',
    color: 'from-violet-500 to-purple-500',
    description: '빈틈없는 일 처리, 뒤에서 받쳐주는 핵심 인재',
    detail: '뛰어난 분석력과 안정적인 성향의 당신은 법무, 세무, 사무행정 분야에서 없어서는 안 될 존재입니다.',
    jobs: ['부동산 법무', '세무 컨설팅', '사무행정 관리'],
    strengths: ['꼼꼼한 서류 처리', '법률 지식', '안정적 업무 수행'],
  },
  RF: {
    code: 'RF',
    name: '자유영혼형 크리에이터',
    emoji: '🚀',
    color: 'from-pink-500 to-rose-500',
    description: '어디에도 얽매이지 않고 성과를 내는 디지털 노마드',
    detail: '높은 회복탄력성과 균형잡힌 능력의 당신은 프리랜서, 유튜브 중개, 온라인 마케팅에 적합합니다.',
    jobs: ['부동산 유튜버', '프리랜서 중개인', '온라인 마케터'],
    strengths: ['자기 관리 능력', '콘텐츠 제작', '유연한 사고'],
  },
};

type DNAType = keyof typeof DNA_TYPES;

interface Scores {
  risk: number;
  social: number;
  logic: number;
  resilience: number;
}

export default function DNAQuizPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<DNAQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [scores, setScores] = useState<Scores>({ risk: 0, social: 0, logic: 0, resilience: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const [dnaType, setDnaType] = useState<DNAType | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showIntroPopup, setShowIntroPopup] = useState(true);
  const [introChecked, setIntroChecked] = useState(false);

  // 컴포넌트 마운트 시 랜덤 질문 생성
  useEffect(() => {
    setQuestions(generateRandomQuestions());
  }, []);

  // 질문 새로고침 (랜덤 재생성)
  const handleRefreshQuestions = () => {
    setQuestions(generateRandomQuestions());
    setCurrentQuestion(0);
    setAnswers({});
    setScores({ risk: 0, social: 0, logic: 0, resilience: 0 });
  };

  const handleAnswer = (questionIndex: number, optionId: string, optionScores: Scores) => {
    setIsAnimating(true);

    // 이전 답변이 있으면 점수 차감
    const prevAnswer = answers[questionIndex];
    let newScores = { ...scores };

    if (prevAnswer) {
      const prevOption = questions[questionIndex].options.find(o => o.id === prevAnswer);
      if (prevOption) {
        newScores.risk -= prevOption.scores.risk;
        newScores.social -= prevOption.scores.social;
        newScores.logic -= prevOption.scores.logic;
        newScores.resilience -= prevOption.scores.resilience;
      }
    }

    // 새 답변 점수 추가
    newScores.risk += optionScores.risk;
    newScores.social += optionScores.social;
    newScores.logic += optionScores.logic;
    newScores.resilience += optionScores.resilience;

    setScores(newScores);
    setAnswers({ ...answers, [questionIndex]: optionId });

    // 다음 질문으로 이동
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      }
      setIsAnimating(false);
    }, 300);
  };

  const calculateDNAType = (): DNAType => {
    const { risk, social, logic, resilience } = scores;

    // 가장 높은 두 가지 변수 조합으로 유형 결정
    const sorted = [
      { key: 'R', value: risk },
      { key: 'S', value: social },
      { key: 'L', value: logic },
      { key: 'E', value: resilience },
    ].sort((a, b) => b.value - a.value);

    const top1 = sorted[0].key;
    const top2 = sorted[1].key;

    // 유형 매핑
    if ((top1 === 'R' && top2 === 'S') || (top1 === 'S' && top2 === 'R')) return 'RS';
    if ((top1 === 'R' && top2 === 'L') || (top1 === 'L' && top2 === 'R')) return 'RL';
    if ((top1 === 'S' && top2 === 'L') || (top1 === 'L' && top2 === 'S')) return 'SL';
    if ((top1 === 'L' && top2 === 'E') || (top1 === 'E' && top2 === 'L')) return 'LA';
    if (top1 === 'R' || resilience >= 8) return 'RF';

    // 기본값
    return 'SL';
  };

  const handleComplete = () => {
    const type = calculateDNAType();
    setDnaType(type);
    setIsComplete(true);

    // 답변 상세 정보 수집 (자기소개 생성용)
    const answerDetails = questions.map((q, index) => {
      const selectedOptionId = answers[index];
      const selectedOption = q.options.find(o => o.id === selectedOptionId);
      return {
        category: q.category,
        categoryKey: q.categoryKey,
        question: q.question,
        selectedText: selectedOption?.text || '',
        selectedLabel: selectedOption?.label || '',
      };
    });

    // localStorage에 DNA 결과 저장
    localStorage.setItem('agent_dna_result', JSON.stringify({
      type,
      scores,
      answers,
      answerDetails, // 답변 상세 정보 추가
      completedAt: new Date().toISOString(),
    }));
  };

  const handleContinueToResume = () => {
    router.push('/agent/mypage/resume?fromDNA=true');
  };

  // 질문이 로딩되지 않았으면 로딩 표시
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 animate-pulse text-yellow-400" />
          <p>질문을 준비하고 있습니다...</p>
        </div>
      </div>
    );
  }

  // 안내 팝업
  if (showIntroPopup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
          {/* 아이콘 */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">부동산 DNA 분석</h2>
            <p className="text-white/70">나에게 맞는 부동산 직무를 찾아보세요</p>
          </div>

          {/* 안내 내용 */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-3 p-4 bg-white/5 rounded-xl">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white/90">자기소개 자동 생성</p>
                <p className="text-sm text-white/60">분석 결과가 이력서 자기소개에 반영됩니다</p>
              </div>
            </div>
            <div className="flex gap-3 p-4 bg-white/5 rounded-xl">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-white/90">AI 맞춤 매칭</p>
                <p className="text-sm text-white/60">성향에 맞는 채용공고를 추천받을 수 있습니다</p>
              </div>
            </div>
            <div className="flex gap-3 p-4 bg-white/5 rounded-xl">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="font-medium text-white/90">10개 상황별 질문</p>
                <p className="text-sm text-white/60">약 2~3분 정도 소요됩니다</p>
              </div>
            </div>
          </div>

          {/* 체크박스 */}
          <label className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl cursor-pointer mb-6 hover:bg-yellow-500/20 transition-colors">
            <input
              type="checkbox"
              checked={introChecked}
              onChange={(e) => setIntroChecked(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded border-2 border-yellow-400 bg-transparent text-yellow-500 focus:ring-yellow-500 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-sm text-yellow-100 leading-relaxed">
              <strong>분석 결과는 자기소개에 적용됩니다.</strong><br />
              최대한 본인 성향에 맞게 솔직하게 체크해주시면 더 정확한 결과를 얻을 수 있습니다.
            </span>
          </label>

          {/* 버튼 */}
          <button
            onClick={() => setShowIntroPopup(false)}
            disabled={!introChecked}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-500 disabled:to-gray-600"
          >
            분석 시작하기
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const allAnswered = Object.keys(answers).length === questions.length;
  const totalQuestionPool = getTotalQuestionCount();

  // 결과 화면
  if (isComplete && dnaType) {
    const result = DNA_TYPES[dnaType];
    const maxScore = 20; // 대략적인 최대 점수

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm">AI 분석 완료</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">당신의 부동산 DNA</h1>
          </div>

          {/* 결과 카드 */}
          <div className={`bg-gradient-to-br ${result.color} rounded-3xl p-8 mb-8 shadow-2xl`}>
            <div className="text-center">
              <div className="text-6xl mb-4">{result.emoji}</div>
              <div className="text-sm opacity-80 mb-1">{result.code} Type</div>
              <h2 className="text-3xl font-bold mb-3">{result.name}</h2>
              <p className="text-lg opacity-90">{result.description}</p>
            </div>
          </div>

          {/* 레이더 차트 (심플 버전) */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              DNA 분석 결과
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>🔥 리스크 감수성 (Risk)</span>
                  <span>{Math.max(0, scores.risk)}</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, (scores.risk / maxScore) * 100))}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>💬 사교성 (Social)</span>
                  <span>{Math.max(0, scores.social)}</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, (scores.social / maxScore) * 100))}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>🧠 분석력 (Logic)</span>
                  <span>{Math.max(0, scores.logic)}</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, (scores.logic / maxScore) * 100))}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>💪 회복탄력성 (Resilience)</span>
                  <span>{Math.max(0, scores.resilience)}</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, (scores.resilience / maxScore) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 상세 설명 */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
            <p className="text-white/90 leading-relaxed">{result.detail}</p>
          </div>

          {/* 추천 직무 */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              AI 추천 직무
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.jobs.map((job, index) => (
                <span key={index} className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium">
                  {job}
                </span>
              ))}
            </div>
          </div>

          {/* 핵심 강점 */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              핵심 강점
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {result.strengths.map((strength, index) => (
                <div key={index} className="text-center p-3 bg-white/10 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <span className="text-sm">{strength}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleContinueToResume}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg"
          >
            이력서 작성하고 매칭 시작하기
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-white/50 text-sm mt-4">
            DNA 결과가 이력서에 자동으로 반영됩니다
          </p>
        </div>
      </div>
    );
  }

  // 퀴즈 화면
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/agent/mypage/resume"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="font-bold">부동산 DNA 분석</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefreshQuestions}
                className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title={`질문 새로고침 (총 ${totalQuestionPool}개 중 10개 랜덤 선택)`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <span className="text-sm text-white/70">
                {currentQuestion + 1}/{questions.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 진행률 바 */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* 왼쪽: 퀴즈 영역 */}
          <main className="flex-1 max-w-2xl">
            {/* 질문 카테고리 */}
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-sm">
                <Brain className="w-4 h-4" />
                {question.category}
              </span>
            </div>

            {/* 질문 */}
            <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
              <h2 className="text-xl md:text-2xl font-bold text-center mb-8 leading-relaxed">
                Q{currentQuestion + 1}. {question.question}
              </h2>

              {/* 선택지 */}
              <div className="space-y-4">
                {question.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(currentQuestion, option.id, option.scores)}
                    className={`w-full p-5 rounded-2xl text-left transition-all ${
                      answers[currentQuestion] === option.id
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg scale-[1.02]'
                        : 'bg-white/10 hover:bg-white/20 hover:scale-[1.01]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        answers[currentQuestion] === option.id
                          ? 'bg-white text-blue-600'
                          : 'bg-white/20'
                      }`}>
                        {option.id}
                      </span>
                      <div>
                        <p className="font-medium">{option.text}</p>
                        <span className="text-sm text-white/60 mt-1">{option.label}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

        {/* 네비게이션 */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            이전
          </button>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleComplete}
              disabled={!allAnswered}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-cyan-600 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              결과 보기
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              disabled={answers[currentQuestion] === undefined}
              className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              다음
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

            {/* 진행 상태 표시 */}
            <div className="flex justify-center gap-2 mt-8">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentQuestion
                      ? 'bg-white scale-125'
                      : answers[index] !== undefined
                        ? 'bg-blue-400'
                        : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </main>

          {/* 오른쪽: 안내 패널 (데스크톱만) */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-20 bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 min-h-[420px] flex flex-col">
              {/* 헤더 */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-white/90">DNA 분석 안내</p>
                  <p className="text-xs text-white/50">솔직하게 답변해주세요</p>
                </div>
              </div>

              {/* 안내 항목 */}
              <div className="space-y-3 flex-1">
                <div className="flex gap-3 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                  <FileText className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-100">자기소개 자동 생성</p>
                    <p className="text-xs text-yellow-100/60 mt-0.5">분석 결과가 이력서 자기소개에 적용됩니다</p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 bg-white/5 rounded-xl">
                  <Target className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white/80">AI 맞춤 매칭</p>
                    <p className="text-xs text-white/50 mt-0.5">성향에 맞는 공고 추천</p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 bg-white/5 rounded-xl">
                  <Brain className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white/80">5가지 DNA 유형</p>
                    <p className="text-xs text-white/50 mt-0.5">나만의 부동산 성향 분석</p>
                  </div>
                </div>
              </div>

              {/* 진행률 */}
              <div className="mt-auto pt-4 border-t border-white/10">
                <div className="flex justify-between text-xs text-white/50 mb-2">
                  <span>진행률</span>
                  <span>{Object.keys(answers).length}/{questions.length} 완료</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                    style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
