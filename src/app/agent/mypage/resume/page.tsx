'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Award,
  Briefcase,
  MapPin,
  Calendar,
  Plus,
  X,
  Edit2,
  Trash2,
  Check,
  ChevronDown,
  Building2,
  Save,
  Eye,
  AlertCircle,
  FileText,
  GraduationCap,
  Banknote,
  Lock,
  Camera,
  Sparkles,
  Brain,
  ArrowRight,
} from 'lucide-react';
import type { AgentResume, AgentCareer, AgentJobType, AgentSalaryType, AgentExperience, AgentDNAType } from '@/types';
import { REGIONS, AGENT_JOB_TYPE_LABELS, AGENT_SALARY_TYPE_LABELS, AGENT_EXPERIENCE_LABELS, DNA_TYPE_INFO } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyResume, saveResume } from '@/lib/supabase';
import { uploadImage } from '@/lib/upload';

const EMPTY_RESUME: AgentResume = {
  id: '',
  name: '',
  phone: '',
  email: '',
  totalExperience: 'none',
  careers: [],
  preferredRegions: [],
  preferredTypes: [],
  preferredSalary: { type: 'mixed' },
  createdAt: '',
  updatedAt: '',
  isPublic: true,
};

const EMPTY_CAREER: AgentCareer = {
  id: '',
  company: '',
  type: 'apartment',
  region: '',
  startDate: '',
  isCurrent: false,
};

// 답변 상세 정보 타입
interface AnswerDetail {
  category: string;
  categoryKey: string;
  question: string;
  selectedText: string;
  selectedLabel: string;
}

// AI 자기소개 생성 함수 (실제 답변 기반)
function generateAIIntroduction(data: AgentResume, answerDetails?: AnswerDetail[]): string {
  const dnaType = data.dnaType;
  if (!dnaType || !DNA_TYPE_INFO[dnaType]) return '';

  const dnaInfo = DNA_TYPE_INFO[dnaType];
  const name = data.name || '지원자';
  const experience = AGENT_EXPERIENCE_LABELS[data.totalExperience] || '신입';

  // 답변 상세 정보가 있으면 이를 기반으로 생성
  if (answerDetails && answerDetails.length > 0) {
    const lines: string[] = [];

    // 인사말
    lines.push(`안녕하세요, ${name}입니다.`);
    lines.push('');

    // 급여/리스크 관련 답변에서 업무 태도 추출
    const riskAnswer = answerDetails.find(a => a.categoryKey === 'risk');
    if (riskAnswer) {
      if (riskAnswer.selectedLabel.includes('야수') || riskAnswer.selectedLabel.includes('도전')) {
        lines.push('저는 도전을 두려워하지 않습니다. 성과에 따른 보상을 믿기에, 높은 목표도 기꺼이 도전합니다.');
      } else if (riskAnswer.selectedLabel.includes('밸런스') || riskAnswer.selectedLabel.includes('분석')) {
        lines.push('안정과 도전 사이에서 균형을 찾습니다. 계산된 리스크는 감수하되, 무모한 모험은 피합니다.');
      } else {
        lines.push('꾸준함과 성실함을 바탕으로 안정적인 성과를 만들어갑니다.');
      }
    }

    // 업무 환경/스타일 답변에서 일하는 방식 추출
    const workAnswer = answerDetails.find(a => a.categoryKey === 'work');
    if (workAnswer) {
      if (workAnswer.selectedLabel.includes('행동') || workAnswer.selectedLabel.includes('현장')) {
        lines.push('현장에서 직접 발로 뛰며 배우는 것을 좋아합니다. 고객을 직접 만나고, 매물을 눈으로 확인하는 것이 기본이라 생각합니다.');
      } else if (workAnswer.selectedLabel.includes('분석') || workAnswer.selectedLabel.includes('데이터')) {
        lines.push('철저한 데이터 분석을 바탕으로 일합니다. 시세 동향, 권리 분석, 시장 흐름을 파악한 후 움직입니다.');
      }
    }

    // 설득 스타일에서 영업 방식 추출
    const persuasionAnswer = answerDetails.find(a => a.categoryKey === 'persuasion');
    if (persuasionAnswer) {
      if (persuasionAnswer.selectedLabel.includes('감성') || persuasionAnswer.selectedLabel.includes('공감')) {
        lines.push('고객의 마음을 읽는 것이 영업의 시작이라 믿습니다. 숫자보다 감정을, 조건보다 꿈을 이야기합니다.');
      } else if (persuasionAnswer.selectedLabel.includes('팩트') || persuasionAnswer.selectedLabel.includes('데이터')) {
        lines.push('객관적인 데이터와 팩트로 설득합니다. 감정보다 논리로, 고객이 합리적인 결정을 내릴 수 있도록 돕습니다.');
      } else if (persuasionAnswer.selectedLabel.includes('압박') || persuasionAnswer.selectedLabel.includes('클로징')) {
        lines.push('때로는 과감한 클로징이 필요합니다. 좋은 기회를 놓치지 않도록, 결단의 순간을 만들어 드립니다.');
      }
    }

    // 회복탄력성에서 마인드 추출
    const resilienceAnswer = answerDetails.find(a => a.categoryKey === 'resilience');
    if (resilienceAnswer) {
      if (resilienceAnswer.selectedLabel.includes('오기') || resilienceAnswer.selectedLabel.includes('승부욕')) {
        lines.push('거절은 저를 멈추게 하지 않습니다. 오히려 더 좋은 조건을 찾아 다시 찾아가는 원동력이 됩니다.');
      } else if (resilienceAnswer.selectedLabel.includes('쿨') || resilienceAnswer.selectedLabel.includes('담담')) {
        lines.push('일희일비하지 않습니다. 안 되면 다음 기회를 찾고, 되면 다음 목표를 세웁니다.');
      }
    }

    // 성취 동기에서 목표 추출
    const achievementAnswer = answerDetails.find(a => a.categoryKey === 'achievement');
    if (achievementAnswer) {
      if (achievementAnswer.selectedLabel.includes('명예') || achievementAnswer.selectedLabel.includes('인정')) {
        lines.push('고객과 동료에게 인정받는 전문가가 되고 싶습니다. "역시 믿을 수 있다"는 말이 가장 큰 보람입니다.');
      } else if (achievementAnswer.selectedLabel.includes('실리') || achievementAnswer.selectedLabel.includes('수익')) {
        lines.push('솔직히 말해, 성과로 증명하고 싶습니다. 통장에 찍히는 숫자가 제 실력의 척도입니다.');
      } else if (achievementAnswer.selectedLabel.includes('문제해결')) {
        lines.push('복잡한 거래를 깔끔하게 해결했을 때 가장 보람을 느낍니다. 문제 해결이 곧 저의 가치입니다.');
      }
    }

    // 미래 목표
    const futureAnswer = answerDetails.find(a => a.categoryKey === 'future');
    if (futureAnswer) {
      lines.push('');
      if (futureAnswer.selectedLabel.includes('창업') || futureAnswer.selectedLabel.includes('대표')) {
        lines.push('궁극적으로 제 이름을 건 중개사무소를 운영하는 것이 목표입니다.');
      } else if (futureAnswer.selectedLabel.includes('전문가') || futureAnswer.selectedLabel.includes('컨설턴트')) {
        lines.push('부동산 분야의 전문가로 인정받는 것이 목표입니다.');
      } else if (futureAnswer.selectedLabel.includes('투자') || futureAnswer.selectedLabel.includes('건물주')) {
        lines.push('부동산을 통해 경제적 자유를 이루는 것이 목표입니다.');
      }
    }

    // 마무리
    lines.push('');
    lines.push(`${dnaInfo.name}으로서, 제 강점을 살려 성과로 보여드리겠습니다.`);

    return lines.filter(Boolean).join('\n');
  }

  // 답변 상세가 없으면 DNA 유형 기반 기본 템플릿
  return [
    `안녕하세요, ${experience} ${name}입니다.`,
    '',
    `저는 "${dnaInfo.name}" 유형입니다.`,
    dnaInfo.description,
    '',
    '부동산 전문가로서 성과로 증명하겠습니다.',
  ].join('\n');
}

export default function ResumePage() {
  const { user } = useAuth();
  const [resume, setResume] = useState<AgentResume | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<AgentResume>(EMPTY_RESUME);
  const [showCareerForm, setShowCareerForm] = useState(false);
  const [newCareer, setNewCareer] = useState<AgentCareer>(EMPTY_CAREER);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dnaResult, setDnaResult] = useState<{ type: AgentDNAType; scores: any; answerDetails?: AnswerDetail[] } | null>(null);
  const [introMode, setIntroMode] = useState<'manual' | 'ai'>('manual');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // 프로필 사진 업로드 핸들러 (Supabase Storage)
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 보관 (저장 시 Storage에 업로드)
      setPhotoFile(file);
      // 미리보기용 ObjectURL 생성
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      // editData.photo는 저장 시 업로드 URL로 교체됨
    }
  };

  // 로그인한 사용자 정보에서 이메일/연락처 가져오기
  const userEmail = user?.email || '';
  const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || '';
  const userPhone = user?.user_metadata?.phone || '';

  // DNA 결과 로드
  useEffect(() => {
    const savedDna = localStorage.getItem('agent_dna_result');
    if (savedDna) {
      try {
        const parsed = JSON.parse(savedDna);
        setDnaResult({
          type: parsed.type,
          scores: parsed.scores,
          answerDetails: parsed.answerDetails // 답변 상세 정보 포함
        });
      } catch (e) {
        console.error('Failed to parse DNA result:', e);
      }
    }
  }, []);

  // Supabase에서 이력서 불러오기
  useEffect(() => {
    async function loadResume() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const savedResume = await fetchMyResume(user.id);

        // localStorage에서 DNA 결과 가져오기
        let dnaData: { type?: AgentDNAType; scores?: any; answerDetails?: AnswerDetail[] } = {};
        const savedDna = localStorage.getItem('agent_dna_result');
        if (savedDna) {
          try {
            const parsed = JSON.parse(savedDna);
            dnaData = {
              type: parsed.type,
              scores: parsed.scores,
              answerDetails: parsed.answerDetails
            };
          } catch (e) {}
        }

        if (savedResume) {
          // DB에서 가져온 이력서에 로그인 사용자 정보 병합
          const updatedResume = {
            ...savedResume,
            email: userEmail || savedResume.email,
            name: savedResume.name || userName,
            phone: userPhone || savedResume.phone,
            // DNA 결과 병합 (localStorage 우선)
            dnaType: dnaData.type || savedResume.dnaType,
            dnaScores: dnaData.scores || savedResume.dnaScores,
            dnaAnswerDetails: dnaData.answerDetails || savedResume.dnaAnswerDetails,
          };
          setResume(updatedResume);
          setEditData(updatedResume);
          // dnaResult 상태도 업데이트
          if (dnaData.type || savedResume.dnaType) {
            setDnaResult({
              type: (dnaData.type || savedResume.dnaType) as AgentDNAType,
              scores: dnaData.scores || savedResume.dnaScores,
              answerDetails: dnaData.answerDetails || savedResume.dnaAnswerDetails,
            });
          }
          if (updatedResume.photo) setPhotoPreview(updatedResume.photo);
        } else {
          // 새 이력서 작성 시 사용자 정보 자동 채우기
          setEditData({
            ...EMPTY_RESUME,
            email: userEmail,
            name: userName,
            phone: userPhone,
            dnaType: dnaData.type,
            dnaScores: dnaData.scores,
            dnaAnswerDetails: dnaData.answerDetails,
          });
          // dnaResult 상태도 업데이트
          if (dnaData.type) {
            setDnaResult({
              type: dnaData.type,
              scores: dnaData.scores,
              answerDetails: dnaData.answerDetails,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load resume:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadResume();
  }, [user?.id, userEmail, userName, userPhone]);

  const handleSave = async () => {
    if (!user?.id) {
      setSaveError('로그인이 필요합니다');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      let dataToSave = { ...editData };

      // 새 사진 파일이 있으면 Supabase Storage에 업로드
      if (photoFile) {
        const photoUrl = await uploadImage(photoFile, 'profile-photos');
        if (photoUrl) {
          dataToSave.photo = photoUrl;
        }
        setPhotoFile(null);
      }

      const savedResume = await saveResume(dataToSave, user.id);
      if (savedResume) {
        setResume(savedResume);
        setEditData(savedResume);
        setIsEditing(false);
        if (savedResume.photo) setPhotoPreview(savedResume.photo);
      } else {
        setSaveError('이력서 저장에 실패했습니다');
      }
    } catch (err) {
      console.error('Save error:', err);
      setSaveError('이력서 저장 중 오류가 발생했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCareer = () => {
    if (!newCareer.company || !newCareer.region || !newCareer.startDate) return;

    const career: AgentCareer = {
      ...newCareer,
      id: `career_${Date.now()}`,
    };
    setEditData({
      ...editData,
      careers: [...editData.careers, career],
    });
    setNewCareer(EMPTY_CAREER);
    setShowCareerForm(false);
  };

  const handleRemoveCareer = (id: string) => {
    setEditData({
      ...editData,
      careers: editData.careers.filter((c) => c.id !== id),
    });
  };

  const handleToggleRegion = (region: string) => {
    const regions = editData.preferredRegions.includes(region)
      ? editData.preferredRegions.filter((r) => r !== region)
      : [...editData.preferredRegions, region];
    setEditData({ ...editData, preferredRegions: regions });
  };

  const handleToggleType = (type: AgentJobType) => {
    const types = editData.preferredTypes.includes(type)
      ? editData.preferredTypes.filter((t) => t !== type)
      : [...editData.preferredTypes, type];
    setEditData({ ...editData, preferredTypes: types });
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">이력서 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 로그인 필요
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-500 mb-6">이력서를 등록하려면 먼저 로그인해주세요</p>
          <Link
            href="/agent/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  // 이력서 작성 폼
  if (isEditing || !resume) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* 헤더 */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <button
                onClick={() => {
                  if (resume) {
                    setIsEditing(false);
                    setEditData(resume);
                  }
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">{resume ? '취소' : '마이페이지'}</span>
              </button>
              <h1 className="font-bold text-gray-900">이력서 {resume ? '수정' : '등록'}</h1>
              <button
                onClick={handleSave}
                disabled={!editData.name || !editData.phone || !editData.email || isSaving}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <Save className="w-4 h-4" />
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* 저장 에러 메시지 */}
          {saveError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{saveError}</p>
              <button
                onClick={() => setSaveError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* DNA 분석 섹션 */}
          {editData.dnaType && DNA_TYPE_INFO[editData.dnaType] ? (
            <div className={`bg-gradient-to-r ${DNA_TYPE_INFO[editData.dnaType].color} rounded-2xl p-6 text-white`}>
              <div className="flex items-center gap-4">
                <div className="text-4xl">{DNA_TYPE_INFO[editData.dnaType].emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm opacity-80">AI 분석 완료</span>
                  </div>
                  <h3 className="text-xl font-bold">{DNA_TYPE_INFO[editData.dnaType].name}</h3>
                  <p className="text-sm opacity-90">{DNA_TYPE_INFO[editData.dnaType].description}</p>
                </div>
                <Link
                  href="/agent/mypage/resume/dna"
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
                >
                  다시 분석
                </Link>
              </div>
            </div>
          ) : (
            <Link
              href="/agent/mypage/resume/dna"
              className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <Brain className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span className="text-sm opacity-80">AI 매칭을 위한 필수 단계</span>
                  </div>
                  <h3 className="text-xl font-bold">부동산 DNA 분석하기</h3>
                  <p className="text-sm opacity-90">10개 질문으로 나에게 맞는 직무를 찾아보세요</p>
                </div>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )}

          {/* 기본 정보 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              기본 정보
            </h2>
            <div className="space-y-4">
              {/* 사진등록 | AI 프로필 | 이름 - 가로 배치 */}
              <div className="flex items-center gap-4">
                {/* 사진 등록 */}
                <label className="cursor-pointer group flex-shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-gray-300 group-hover:border-blue-400 transition-colors bg-gray-50">
                    {photoPreview || editData.photo ? (
                      <img
                        src={photoPreview || editData.photo}
                        alt="프로필"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                        <Camera className="w-5 h-5" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      {(photoPreview || editData.photo) && (
                        <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 text-center mt-1">사진등록</p>
                </label>

                {/* 구분선 */}
                <div className="w-px h-12 bg-gray-200 flex-shrink-0" />

                {/* AI 이력서 사진 */}
                <Link
                  href="/profile/ai-photo"
                  className="flex-shrink-0 flex flex-col items-center gap-1 group"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:from-blue-600 group-hover:to-cyan-600 transition-all shadow-md group-hover:shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-[10px] font-medium text-blue-600">AI 이력서</p>
                </Link>

                {/* 구분선 */}
                <div className="w-px h-12 bg-gray-200 flex-shrink-0" />

                {/* 이름 */}
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    placeholder="이름"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    연락처 <span className="text-red-500">*</span>
                    {userPhone && (
                      <span className="ml-2 text-xs text-gray-400 inline-flex items-center gap-0.5">
                        <Lock className="w-3 h-3" />
                        회원정보
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => !userPhone && setEditData({ ...editData, phone: formatPhoneNumber(e.target.value) })}
                      placeholder="010-0000-0000"
                      readOnly={!!userPhone}
                      className={`flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        userPhone ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''
                      }`}
                    />
                    {!userPhone && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!editData.phone || editData.phone.length < 13) {
                            alert('연락처를 정확히 입력해주세요');
                            return;
                          }
                          const { supabase } = await import('@/lib/supabase');
                          const { data } = await supabase
                            .from('resumes')
                            .select('id')
                            .eq('phone', editData.phone)
                            .neq('user_id', user?.id || '')
                            .limit(1);
                          if (data && data.length > 0) {
                            alert('이미 등록된 연락처입니다');
                          } else {
                            alert('사용 가능한 연락처입니다');
                          }
                        }}
                        className="shrink-0 px-3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-xl transition-colors whitespace-nowrap"
                      >
                        중복확인
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이메일 <span className="text-red-500">*</span>
                    {userEmail && (
                      <span className="ml-2 text-xs text-gray-400 inline-flex items-center gap-0.5">
                        <Lock className="w-3 h-3" />
                        회원정보
                      </span>
                    )}
                  </label>
                  <input
                    type="email"
                    value={editData.email}
                    readOnly={!!userEmail}
                    placeholder="example@email.com"
                    className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none ${
                      userEmail ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">출생연도</label>
                  <input
                    type="number"
                    value={editData.birthYear || ''}
                    onChange={(e) => setEditData({ ...editData, birthYear: parseInt(e.target.value) || undefined })}
                    placeholder="1990"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditData({ ...editData, gender: 'male' })}
                      className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                        editData.gender === 'male'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      남성
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditData({ ...editData, gender: 'female' })}
                      className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                        editData.gender === 'female'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      여성
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 자격증 정보 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                공인중개사 자격증
              </h2>
              <span className="text-xs text-gray-400">선택사항</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">자격번호</label>
                <input
                  type="text"
                  value={editData.licenseNumber || ''}
                  onChange={(e) => setEditData({ ...editData, licenseNumber: e.target.value })}
                  placeholder="자격번호를 입력하세요"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">취득연도</label>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={editData.licenseDate || ''}
                      onChange={(e) => setEditData({ ...editData, licenseDate: e.target.value })}
                      placeholder="예: 2023"
                      min={1990}
                      max={new Date().getFullYear()}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {editData.licenseDate && Number(editData.licenseDate) >= 1990 && (
                    <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm font-medium text-blue-700 whitespace-nowrap">
                      제{Number(editData.licenseDate) - 1989}회
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  합격 연도를 입력하면 회차가 자동 계산됩니다 (1회: 1990년 ~ 36회: 2025년)
                </p>
              </div>
            </div>
          </div>

          {/* 경력 정보 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                경력 사항
              </h2>
              {!showCareerForm && (
                <button
                  onClick={() => setShowCareerForm(true)}
                  className="flex items-center gap-1 text-blue-600 text-sm font-medium hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  경력 추가
                </button>
              )}
            </div>

            {/* 총 경력 선택 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">총 경력</label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(AGENT_EXPERIENCE_LABELS) as AgentExperience[]).map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => setEditData({ ...editData, totalExperience: exp })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editData.totalExperience === exp
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {AGENT_EXPERIENCE_LABELS[exp]}
                  </button>
                ))}
              </div>
            </div>

            {/* 경력 추가 폼 */}
            {showCareerForm && (
              <div className="p-4 bg-gray-50 rounded-xl mb-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">회사명 (공인중개사 상호)</label>
                    <input
                      type="text"
                      value={newCareer.company}
                      onChange={(e) => setNewCareer({ ...newCareer, company: e.target.value })}
                      placeholder="회사명을 입력하세요"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">업무 유형</label>
                      <select
                        value={newCareer.type}
                        onChange={(e) => setNewCareer({ ...newCareer, type: e.target.value as AgentJobType })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {(Object.keys(AGENT_JOB_TYPE_LABELS) as AgentJobType[]).map((type) => (
                          <option key={type} value={type}>{AGENT_JOB_TYPE_LABELS[type]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">지역</label>
                      <select
                        value={newCareer.region}
                        onChange={(e) => setNewCareer({ ...newCareer, region: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">선택하세요</option>
                        {REGIONS.map((region) => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">입사일</label>
                      <input
                        type="month"
                        value={newCareer.startDate}
                        onChange={(e) => setNewCareer({ ...newCareer, startDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">퇴사일</label>
                      <input
                        type="month"
                        value={newCareer.endDate || ''}
                        onChange={(e) => setNewCareer({ ...newCareer, endDate: e.target.value })}
                        disabled={newCareer.isCurrent}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCareer.isCurrent}
                      onChange={(e) => setNewCareer({ ...newCareer, isCurrent: e.target.checked, endDate: undefined })}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">현재 재직중</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowCareerForm(false); setNewCareer(EMPTY_CAREER); }}
                      className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleAddCareer}
                      disabled={!newCareer.company || !newCareer.region || !newCareer.startDate}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                    >
                      추가
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 경력 목록 */}
            {editData.careers.length > 0 ? (
              <div className="space-y-3">
                {editData.careers.map((career) => (
                  <div key={career.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                      <Building2 className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{career.company}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{AGENT_JOB_TYPE_LABELS[career.type]}</span>
                        <span>·</span>
                        <span>{career.region}</span>
                        <span>·</span>
                        <span>
                          {career.startDate} ~ {career.isCurrent ? '현재' : career.endDate}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveCareer(career.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : !showCareerForm && (
              <p className="text-sm text-gray-500 text-center py-4">등록된 경력이 없습니다</p>
            )}
          </div>

          {/* 희망 조건 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              희망 조건
            </h2>
            <div className="space-y-6">
              {/* 희망 지역 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">희망 지역 (복수 선택)</label>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => handleToggleRegion(region)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        editData.preferredRegions.includes(region)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              {/* 희망 분야 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">희망 분야 (복수 선택)</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(AGENT_JOB_TYPE_LABELS) as AgentJobType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleToggleType(type)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        editData.preferredTypes.includes(type)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {AGENT_JOB_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 희망 급여 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">희망 급여 형태</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(AGENT_SALARY_TYPE_LABELS) as AgentSalaryType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEditData({
                        ...editData,
                        preferredSalary: { ...editData.preferredSalary, type }
                      })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        editData.preferredSalary.type === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {AGENT_SALARY_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 희망 급여 금액 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">희망 최소 급여 (만원)</label>
                  <input
                    type="number"
                    value={editData.preferredSalary.min || ''}
                    onChange={(e) => setEditData({
                      ...editData,
                      preferredSalary: { ...editData.preferredSalary, min: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="200"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">희망 최대 급여 (만원)</label>
                  <input
                    type="number"
                    value={editData.preferredSalary.max || ''}
                    onChange={(e) => setEditData({
                      ...editData,
                      preferredSalary: { ...editData.preferredSalary, max: parseInt(e.target.value) || undefined }
                    })}
                    placeholder="400"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* 자기소개 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              자기소개
            </h2>

            {/* 작성 방식 선택 */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setIntroMode('manual')}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                  introMode === 'manual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Edit2 className="w-4 h-4" />
                직접 작성
              </button>
              <button
                type="button"
                onClick={() => setIntroMode('ai')}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 ${
                  introMode === 'ai'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                AI 자동 작성
              </button>
            </div>

            {introMode === 'manual' ? (
              <textarea
                value={editData.introduction || ''}
                onChange={(e) => setEditData({ ...editData, introduction: e.target.value })}
                placeholder="간단한 자기소개를 작성해주세요"
                rows={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            ) : (
              <div className="space-y-4">
                {editData.dnaType && DNA_TYPE_INFO[editData.dnaType] ? (
                  <>
                    {/* AI 생성 미리보기 */}
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${DNA_TYPE_INFO[editData.dnaType].color} flex items-center justify-center text-white text-sm`}>
                          {DNA_TYPE_INFO[editData.dnaType].emoji}
                        </div>
                        <span className="text-sm font-medium text-purple-700">
                          {DNA_TYPE_INFO[editData.dnaType].name} 기반 AI 자기소개
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {editData.introduction || generateAIIntroduction(editData, dnaResult?.answerDetails || editData.dnaAnswerDetails)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const generated = generateAIIntroduction(editData, dnaResult?.answerDetails || editData.dnaAnswerDetails);
                          setEditData({ ...editData, introduction: generated });
                        }}
                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        AI 자기소개 생성
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const generated = generateAIIntroduction(editData, dnaResult?.answerDetails || editData.dnaAnswerDetails);
                          setEditData({ ...editData, introduction: generated });
                          setIntroMode('manual');
                        }}
                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        title="생성 후 직접 수정"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      생성된 자기소개는 수정 가능합니다
                    </p>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-2">DNA 분석이 필요합니다</p>
                    <p className="text-sm text-gray-500 mb-4">
                      AI 자기소개 생성을 위해 먼저 DNA 분석을 완료해주세요
                    </p>
                    <Link
                      href="/agent/mypage/resume/dna"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                      <Brain className="w-4 h-4" />
                      DNA 분석하러 가기
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

        </main>
      </div>
    );
  }

  // 이력서 조회 화면
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/agent/mypage"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">마이페이지</span>
            </Link>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 text-blue-600 font-medium"
            >
              <Edit2 className="w-4 h-4" />
              수정
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 bg-blue-100 flex items-center justify-center">
              {resume.photo ? (
                <img src={resume.photo} alt="프로필" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{resume.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {resume.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {resume.email}
                </span>
              </div>
              <span className="text-xs text-gray-400 mt-2 inline-block">
                마지막 수정: {new Date(resume.updatedAt).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </div>
        </div>

        {/* 자격증 */}
        {resume.licenseNumber && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              공인중개사 자격증
            </h2>
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">자격번호: {resume.licenseNumber}</p>
                {resume.licenseDate && (
                  <p className="text-sm text-gray-500">
                    {resume.licenseDate}년 합격
                    {Number(resume.licenseDate) >= 1990 && (
                      <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        제{Number(resume.licenseDate) - 1989}회
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 경력 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            경력 ({AGENT_EXPERIENCE_LABELS[resume.totalExperience]})
          </h2>
          {resume.careers.length > 0 ? (
            <div className="space-y-3">
              {resume.careers.map((career) => (
                <div key={career.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                    <Building2 className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{career.company}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{AGENT_JOB_TYPE_LABELS[career.type]}</span>
                      <span>·</span>
                      <span>{career.region}</span>
                      <span>·</span>
                      <span>
                        {career.startDate} ~ {career.isCurrent ? '현재' : career.endDate}
                      </span>
                    </div>
                  </div>
                  {career.isCurrent && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      재직중
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">등록된 경력이 없습니다</p>
          )}
        </div>

        {/* 희망 조건 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            희망 조건
          </h2>
          <div className="space-y-4">
            {resume.preferredRegions.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">희망 지역</p>
                <div className="flex flex-wrap gap-2">
                  {resume.preferredRegions.map((region) => (
                    <span key={region} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                      {region}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {resume.preferredTypes.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">희망 분야</p>
                <div className="flex flex-wrap gap-2">
                  {resume.preferredTypes.map((type) => (
                    <span key={type} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
                      {AGENT_JOB_TYPE_LABELS[type]}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">
                {AGENT_SALARY_TYPE_LABELS[resume.preferredSalary.type]}
                {resume.preferredSalary.min && resume.preferredSalary.max && (
                  <span className="ml-1 text-blue-600 font-medium">
                    ({resume.preferredSalary.min}~{resume.preferredSalary.max}만원)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 자기소개 */}
        {resume.introduction && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              자기소개
            </h2>
            <p className="text-gray-600 whitespace-pre-wrap">{resume.introduction}</p>
          </div>
        )}
      </main>
    </div>
  );
}
