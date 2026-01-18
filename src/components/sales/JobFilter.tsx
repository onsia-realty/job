'use client';

import { useState } from 'react';
import {
  Filter, X, ChevronDown, ChevronUp, RotateCcw,
  Building2, Briefcase, Wallet, Users, Star, MapPin
} from 'lucide-react';
import type {
  SalesJobFilter, SalesJobType, SalaryType, SalesPosition,
  ExperienceLevel, CompanyType, SalesJobTier
} from '@/types';
import {
  REGIONS, SALES_JOB_TYPE_LABELS, SALARY_TYPE_LABELS,
  POSITION_LABELS, EXPERIENCE_LABELS, COMPANY_TYPE_LABELS
} from '@/types';

interface JobFilterProps {
  filters: SalesJobFilter;
  onFilterChange: (filters: SalesJobFilter) => void;
  totalCount: number;
  filteredCount: number;
}

// 티어 라벨
const TIER_LABELS: Record<SalesJobTier, string> = {
  unique: '유니크',
  superior: '슈페리어',
  premium: '프리미엄',
  normal: '일반',
};

export default function JobFilter({ filters, onFilterChange, totalCount, filteredCount }: JobFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // 필터 토글 함수
  const toggleFilter = <K extends keyof SalesJobFilter>(
    key: K,
    value: SalesJobFilter[K][number]
  ) => {
    const currentValues = filters[key] as SalesJobFilter[K];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    onFilterChange({ ...filters, [key]: newValues });
  };

  // 필터 초기화
  const resetFilters = () => {
    onFilterChange({
      regions: [],
      types: [],
      salaryTypes: [],
      positions: [],
      experiences: [],
      companyTypes: [],
      tiers: [],
    });
  };

  // 활성화된 필터 개수
  const activeFilterCount =
    filters.regions.length +
    filters.types.length +
    filters.salaryTypes.length +
    filters.positions.length +
    filters.experiences.length +
    filters.companyTypes.length +
    filters.tiers.length;

  // 섹션 토글
  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  // 필터 버튼 스타일
  const getButtonStyle = (isActive: boolean) =>
    `px-3 py-1.5 rounded-full text-sm border transition-all ${
      isActive
        ? 'bg-purple-600 text-white border-purple-600'
        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
    }`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      {/* 필터 헤더 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-gray-700 font-medium"
          >
            <Filter className="w-5 h-5 text-purple-600" />
            <span>필터</span>
            {activeFilterCount > 0 && (
              <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              검색결과 <span className="font-bold text-purple-600">{filteredCount}</span>건
              {filteredCount !== totalCount && (
                <span className="text-gray-400"> / 전체 {totalCount}건</span>
              )}
            </span>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                초기화
              </button>
            )}
          </div>
        </div>

        {/* 빠른 필터 (항상 표시) */}
        <div className="mt-3 flex flex-wrap gap-2">
          {/* 지역 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => toggleSection('region')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-all ${
                filters.regions.length > 0
                  ? 'bg-purple-100 text-purple-700 border-purple-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              지역 {filters.regions.length > 0 && `(${filters.regions.length})`}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {activeSection === 'region' && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-64 max-h-72 overflow-y-auto p-3">
                <div className="grid grid-cols-3 gap-2">
                  {REGIONS.map((region) => (
                    <button
                      key={region}
                      onClick={() => toggleFilter('regions', region)}
                      className={getButtonStyle(filters.regions.includes(region))}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 현장유형 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => toggleSection('type')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-all ${
                filters.types.length > 0
                  ? 'bg-purple-100 text-purple-700 border-purple-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              현장유형 {filters.types.length > 0 && `(${filters.types.length})`}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {activeSection === 'type' && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-48 p-3">
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(SALES_JOB_TYPE_LABELS) as SalesJobType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleFilter('types', type)}
                      className={getButtonStyle(filters.types.includes(type))}
                    >
                      {SALES_JOB_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 직급 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => toggleSection('position')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-all ${
                filters.positions.length > 0
                  ? 'bg-purple-100 text-purple-700 border-purple-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              직급 {filters.positions.length > 0 && `(${filters.positions.length})`}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {activeSection === 'position' && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-40 p-3">
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(POSITION_LABELS) as SalesPosition[]).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => toggleFilter('positions', pos)}
                      className={getButtonStyle(filters.positions.includes(pos))}
                    >
                      {POSITION_LABELS[pos]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 급여형태 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => toggleSection('salary')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-all ${
                filters.salaryTypes.length > 0
                  ? 'bg-purple-100 text-purple-700 border-purple-300'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              급여 {filters.salaryTypes.length > 0 && `(${filters.salaryTypes.length})`}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {activeSection === 'salary' && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-40 p-3">
                <div className="flex flex-col gap-2">
                  {(Object.keys(SALARY_TYPE_LABELS) as SalaryType[]).map((sal) => (
                    <button
                      key={sal}
                      onClick={() => toggleFilter('salaryTypes', sal)}
                      className={getButtonStyle(filters.salaryTypes.includes(sal))}
                    >
                      {SALARY_TYPE_LABELS[sal]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 확장된 필터 영역 */}
      {isExpanded && (
        <div className="p-4 bg-gray-50 space-y-4">
          {/* 경력 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-600" />
              경력
            </h4>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((exp) => (
                <button
                  key={exp}
                  onClick={() => toggleFilter('experiences', exp)}
                  className={getButtonStyle(filters.experiences.includes(exp))}
                >
                  {EXPERIENCE_LABELS[exp]}
                </button>
              ))}
            </div>
          </div>

          {/* 업체유형 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              업체유형
            </h4>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(COMPANY_TYPE_LABELS) as CompanyType[]).map((comp) => (
                <button
                  key={comp}
                  onClick={() => toggleFilter('companyTypes', comp)}
                  className={getButtonStyle(filters.companyTypes.includes(comp))}
                >
                  {COMPANY_TYPE_LABELS[comp]}
                </button>
              ))}
            </div>
          </div>

          {/* 광고 등급 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-600" />
              광고 등급
            </h4>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TIER_LABELS) as SalesJobTier[]).map((tier) => (
                <button
                  key={tier}
                  onClick={() => toggleFilter('tiers', tier)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    filters.tiers.includes(tier)
                      ? tier === 'unique'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : tier === 'superior'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : tier === 'premium'
                        ? 'bg-cyan-500 text-white border-cyan-500'
                        : 'bg-gray-600 text-white border-gray-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                  }`}
                >
                  {TIER_LABELS[tier]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 적용된 필터 태그 */}
      {activeFilterCount > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 bg-purple-50/50">
          <div className="flex flex-wrap gap-2">
            {filters.regions.map((r) => (
              <span key={r} className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-full text-xs text-purple-700 border border-purple-200">
                {r}
                <button onClick={() => toggleFilter('regions', r)} className="hover:text-purple-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.types.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-full text-xs text-purple-700 border border-purple-200">
                {SALES_JOB_TYPE_LABELS[t]}
                <button onClick={() => toggleFilter('types', t)} className="hover:text-purple-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.positions.map((p) => (
              <span key={p} className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-full text-xs text-purple-700 border border-purple-200">
                {POSITION_LABELS[p]}
                <button onClick={() => toggleFilter('positions', p)} className="hover:text-purple-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.salaryTypes.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-full text-xs text-purple-700 border border-purple-200">
                {SALARY_TYPE_LABELS[s]}
                <button onClick={() => toggleFilter('salaryTypes', s)} className="hover:text-purple-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.experiences.map((e) => (
              <span key={e} className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-full text-xs text-purple-700 border border-purple-200">
                {EXPERIENCE_LABELS[e]}
                <button onClick={() => toggleFilter('experiences', e)} className="hover:text-purple-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.companyTypes.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-full text-xs text-purple-700 border border-purple-200">
                {COMPANY_TYPE_LABELS[c]}
                <button onClick={() => toggleFilter('companyTypes', c)} className="hover:text-purple-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.tiers.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-full text-xs text-purple-700 border border-purple-200">
                {TIER_LABELS[t]}
                <button onClick={() => toggleFilter('tiers', t)} className="hover:text-purple-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
