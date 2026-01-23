'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Plus, X } from 'lucide-react';

const SPECIALTIES = ['아파트', '상가', '오피스', '빌라', '원룸', '토지'];
const SALARY_TYPES = [
  { value: 'monthly', label: '월급제' },
  { value: 'commission', label: '수수료제' },
  { value: 'base_plus', label: '기본급+α' },
  { value: 'any', label: '무관' },
];

const REGIONS: Record<string, string[]> = {
  서울: ['전체', '강남구', '서초구', '송파구', '강동구', '마포구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '종로구', '중구', '영등포구', '동작구', '관악구', '금천구', '구로구', '양천구', '강서구'],
  경기: ['전체', '성남시', '수원시', '용인시', '고양시', '안양시', '부천시', '광명시', '하남시', '과천시', '의왕시', '군포시', '안산시', '화성시', '평택시', '파주시', '김포시'],
  인천: ['전체', '남동구', '부평구', '계양구', '서구', '연수구', '중구', '동구', '미추홀구'],
  부산: ['전체', '해운대구', '수영구', '남구', '동래구', '부산진구', '사상구', '사하구'],
  대구: ['전체', '수성구', '달서구', '북구', '중구', '동구', '서구', '남구'],
  대전: ['전체', '유성구', '서구', '중구', '동구', '대덕구'],
  광주: ['전체', '북구', '서구', '남구', '동구', '광산구'],
  세종: ['전체'],
  울산: ['전체', '남구', '중구', '동구', '북구', '울주군'],
  강원: ['전체', '춘천시', '원주시', '강릉시', '속초시'],
  충북: ['전체', '청주시', '충주시', '제천시'],
  충남: ['전체', '천안시', '아산시', '서산시'],
  전북: ['전체', '전주시', '익산시', '군산시'],
  전남: ['전체', '목포시', '여수시', '순천시'],
  경북: ['전체', '포항시', '구미시', '경주시'],
  경남: ['전체', '창원시', '김해시', '진주시'],
  제주: ['전체', '제주시', '서귀포시'],
};

interface RegionSelection {
  city: string;
  district: string;
}

export default function Step2Page() {
  const router = useRouter();
  const [hasLicense, setHasLicense] = useState<boolean | null>(null);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [examSession, setExamSession] = useState('');
  const [examYear, setExamYear] = useState('');
  const [regions, setRegions] = useState<RegionSelection[]>([{ city: '', district: '' }]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [salaryType, setSalaryType] = useState('');

  const addRegion = () => {
    if (regions.length >= 3) return;
    setRegions([...regions, { city: '', district: '' }]);
  };

  const removeRegion = (index: number) => {
    if (regions.length <= 1) return;
    setRegions(regions.filter((_, i) => i !== index));
  };

  const updateRegion = (index: number, field: 'city' | 'district', value: string) => {
    const updated = [...regions];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'city') updated[index].district = '';
    setRegions(updated);
  };

  const toggleSpecialty = (specialty: string) => {
    setSpecialties((prev) =>
      prev.includes(specialty) ? prev.filter((s) => s !== specialty) : [...prev, specialty]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 실제로는 API 호출
    console.log({
      hasLicense,
      licenseNumber,
      examSession,
      examYear,
      regions,
      specialties,
      salaryType,
    });
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px]">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/auth/signup"
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              뒤로
            </Link>
            <h2 className="text-lg font-bold text-gray-900">추가 정보 입력</h2>
            <span className="text-sm text-gray-400">1/2</span>
          </div>

          {/* 프로그레스 바 */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full mb-8">
            <div className="w-1/2 h-full bg-blue-600 rounded-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 자격증 보유 여부 */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">공인중개사 자격 정보</h3>
              <p className="text-xs text-gray-400 mb-3">자격증 보유 여부를 선택해주세요</p>
              <div className="flex gap-3">
                <label className="flex-1">
                  <input
                    type="radio"
                    name="license"
                    className="peer hidden"
                    checked={hasLicense === true}
                    onChange={() => setHasLicense(true)}
                  />
                  <div className="py-3 text-center rounded-xl border-2 cursor-pointer transition-all text-sm font-medium peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-600 border-gray-200 text-gray-500 hover:border-gray-300">
                    보유
                  </div>
                </label>
                <label className="flex-1">
                  <input
                    type="radio"
                    name="license"
                    className="peer hidden"
                    checked={hasLicense === false}
                    onChange={() => setHasLicense(false)}
                  />
                  <div className="py-3 text-center rounded-xl border-2 cursor-pointer transition-all text-sm font-medium peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-600 border-gray-200 text-gray-500 hover:border-gray-300">
                    미보유(준비중)
                  </div>
                </label>
              </div>
            </div>

            {/* 자격증 보유 시 추가 정보 */}
            {hasLicense && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    자격증 번호
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="자격증 번호를 입력해주세요"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    합격 정보
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={examSession}
                      onChange={(e) => setExamSession(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    >
                      <option value="">회차 선택</option>
                      {Array.from({ length: 10 }, (_, i) => 35 - i).map((n) => (
                        <option key={n} value={`${n}회`}>{n}회</option>
                      ))}
                    </select>
                    <select
                      value={examYear}
                      onChange={(e) => setExamYear(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    >
                      <option value="">년도 선택</option>
                      {Array.from({ length: 10 }, (_, i) => 2026 - i).map((y) => (
                        <option key={y} value={`${y}년`}>{y}년</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    자격증 사본 <span className="text-gray-400 font-normal">(선택)</span>
                  </label>
                  <label className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">파일 업로드</span>
                    <input type="file" accept="image/*,.pdf" className="hidden" />
                  </label>
                </div>
              </div>
            )}

            {/* 희망 근무 지역 */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">
                희망 근무 지역 <span className="text-blue-600">*</span>
                <span className="text-xs font-normal text-gray-400 ml-2">(최대 3개)</span>
              </label>
              <div className="space-y-3 mt-3">
                {regions.map((region, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <select
                      value={region.city}
                      onChange={(e) => updateRegion(index, 'city', e.target.value)}
                      className="flex-1 px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                    >
                      <option value="">시/도</option>
                      {Object.keys(REGIONS).map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    <select
                      value={region.district}
                      onChange={(e) => updateRegion(index, 'district', e.target.value)}
                      disabled={!region.city}
                      className="flex-1 px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white disabled:bg-gray-50 disabled:text-gray-300"
                    >
                      <option value="">구/군</option>
                      {region.city && REGIONS[region.city]?.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    {regions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRegion(index)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {regions.length < 3 && (
                  <button
                    type="button"
                    onClick={addRegion}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    지역 추가
                  </button>
                )}
              </div>
            </div>

            {/* 전문 분야 */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                전문 분야 <span className="text-blue-600">*</span>
                <span className="text-xs font-normal text-gray-400 ml-2">(복수 선택)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map((specialty) => (
                  <button
                    key={specialty}
                    type="button"
                    onClick={() => toggleSpecialty(specialty)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                      specialties.includes(specialty)
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {specialty}
                  </button>
                ))}
              </div>
            </div>

            {/* 희망 급여 형태 */}
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3">
                희망 급여 형태
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SALARY_TYPES.map((type) => (
                  <label key={type.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="salaryType"
                      value={type.value}
                      checked={salaryType === type.value}
                      onChange={(e) => setSalaryType(e.target.value)}
                      className="peer hidden"
                    />
                    <div className="py-3 text-center rounded-xl border-2 transition-all text-sm font-medium peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-600 border-gray-200 text-gray-500 hover:border-gray-300">
                      {type.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              className="w-full py-4 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              가입 완료
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
