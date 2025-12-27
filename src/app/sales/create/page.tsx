"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, X, Sparkles } from "lucide-react";

export default function CreateJobPage() {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "아파트",
    commission: "",
    deadline: "",
    description: "",
    contact: "",
  });

  const [images, setImages] = useState<string[]>([]);

  const propertyTypes = ["아파트", "오피스텔", "지식산업센터", "상가", "타운하우스"];
  const tags = ["숙소제공", "즉시투입", "교통비지원", "식대지원", "초보가능", "경력우대"];
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API 연동
    console.log({ ...formData, tags: selectedTags, images });
  };

  const handleAIGenerate = () => {
    // TODO: AI 공고 자동 생성
    alert("AI가 공고 내용을 자동 생성합니다. (Phase 3 기능)");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/sales" className="p-2 -ml-2">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <h1 className="font-bold text-gray-900">구인공고 등록</h1>
          </div>
          <button
            onClick={handleAIGenerate}
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-lg"
          >
            <Sparkles className="w-4 h-4" />
            AI 작성
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6">
        {/* 이미지 업로드 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            현장 이미지/영상
          </label>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <label className="w-24 h-24 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors flex-shrink-0">
              <Upload className="w-6 h-6 text-gray-400 mb-1" />
              <span className="text-xs text-gray-400">업로드</span>
              <input type="file" className="hidden" accept="image/*,video/*" multiple />
            </label>
            {/* 업로드된 이미지 미리보기 */}
            {images.map((img, i) => (
              <div key={i} className="relative w-24 h-24 flex-shrink-0">
                <div className="w-full h-full bg-gray-200 rounded-xl" />
                <button
                  type="button"
                  className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 공고 제목 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            공고 제목 *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="예: 용인 반도체클러스터 팀원 모집"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            required
          />
        </div>

        {/* 회사/팀명 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            회사/팀명 *
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="예: ○○분양대행"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            required
          />
        </div>

        {/* 현장 위치 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            현장 위치 *
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="예: 경기 용인시 처인구 양지면"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            required
          />
        </div>

        {/* 현장 타입 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            현장 타입 *
          </label>
          <div className="flex flex-wrap gap-2">
            {propertyTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, type })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  formData.type === type
                    ? "bg-rose-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 수수료 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            수수료 *
          </label>
          <input
            type="text"
            value={formData.commission}
            onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
            placeholder="예: 8% 또는 협의"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            required
          />
        </div>

        {/* 마감일 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            마감일
          </label>
          <input
            type="text"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            placeholder="예: 상시모집 또는 12/31까지"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>

        {/* 태그 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            태그 (복수 선택)
          </label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSelectedTags((prev) =>
                    prev.includes(tag)
                      ? prev.filter((t) => t !== tag)
                      : [...prev, tag]
                  );
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-rose-100 text-rose-600 border border-rose-300"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 상세 설명 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            상세 설명 *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="현장 정보, 근무 조건, 우대 사항 등을 자세히 적어주세요"
            rows={8}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
            required
          />
        </div>

        {/* 연락처 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            연락처 *
          </label>
          <input
            type="text"
            value={formData.contact}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
            placeholder="예: 010-1234-5678"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            required
          />
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
        >
          공고 등록하기
        </button>

        <p className="text-center text-sm text-gray-400 mt-4">
          등록된 공고는 검토 후 게시됩니다
        </p>
      </form>
    </div>
  );
}
