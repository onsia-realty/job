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
} from 'lucide-react';
import type { AgentResume, AgentCareer, AgentJobType, AgentSalaryType, AgentExperience } from '@/types';
import { REGIONS, AGENT_JOB_TYPE_LABELS, AGENT_SALARY_TYPE_LABELS, AGENT_EXPERIENCE_LABELS } from '@/types';

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
  isPublic: false,
};

const EMPTY_CAREER: AgentCareer = {
  id: '',
  company: '',
  type: 'apartment',
  region: '',
  startDate: '',
  isCurrent: false,
};

export default function ResumePage() {
  const [resume, setResume] = useState<AgentResume | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<AgentResume>(EMPTY_RESUME);
  const [showCareerForm, setShowCareerForm] = useState(false);
  const [newCareer, setNewCareer] = useState<AgentCareer>(EMPTY_CAREER);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const savedResume = localStorage.getItem('agent_resume');
    if (savedResume) {
      const parsed = JSON.parse(savedResume);
      setResume(parsed);
      setEditData(parsed);
    }
  }, []);

  const handleSave = () => {
    const now = new Date().toISOString();
    const updatedResume: AgentResume = {
      ...editData,
      id: editData.id || `resume_${Date.now()}`,
      createdAt: editData.createdAt || now,
      updatedAt: now,
    };
    localStorage.setItem('agent_resume', JSON.stringify(updatedResume));
    setResume(updatedResume);
    setIsEditing(false);
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
                disabled={!editData.name || !editData.phone || !editData.email}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <Save className="w-4 h-4" />
                저장
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              기본 정보
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  placeholder="이름을 입력하세요"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    연락처 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: formatPhoneNumber(e.target.value) })}
                    placeholder="010-0000-0000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    placeholder="example@email.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              공인중개사 자격증
            </h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">취득일</label>
                <input
                  type="date"
                  value={editData.licenseDate || ''}
                  onChange={(e) => setEditData({ ...editData, licenseDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">회사명</label>
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

              {/* 입사 가능일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">입사 가능일</label>
                <input
                  type="date"
                  value={editData.availableDate || ''}
                  onChange={(e) => setEditData({ ...editData, availableDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 자기소개 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              자기소개
            </h2>
            <textarea
              value={editData.introduction || ''}
              onChange={(e) => setEditData({ ...editData, introduction: e.target.value })}
              placeholder="간단한 자기소개를 작성해주세요"
              rows={5}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* 이력서 공개 설정 */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">이력서 공개</h2>
                <p className="text-sm text-gray-500 mt-1">공개 시 기업에서 이력서를 열람할 수 있습니다</p>
              </div>
              <button
                type="button"
                onClick={() => setEditData({ ...editData, isPublic: !editData.isPublic })}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  editData.isPublic ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    editData.isPublic ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>
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
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-blue-600" />
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
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  resume.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {resume.isPublic ? '공개' : '비공개'}
                </span>
                <span className="text-xs text-gray-400">
                  마지막 수정: {new Date(resume.updatedAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
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
                  <p className="text-sm text-gray-500">취득일: {resume.licenseDate}</p>
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
            <div className="flex items-center gap-4">
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
              {resume.availableDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">입사 가능: {resume.availableDate}</span>
                </div>
              )}
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
