'use client';

import { useState, useEffect, useCallback } from 'react';

// ==================== OPTION CONSTANTS ====================

// Agent options
const AGENT_JOB_TYPES = ['공인중개사', '중개보조원', '팀장', '실장', '부장', '사무장', '경리/사무직'];
const EMPLOYMENT_TYPES = ['정규직', '계약직', '프리랜서', '아르바이트/파트타임'];
const AGENT_SALARY_TYPES = ['월급', '비율제', '월급+비율', '건당수수료'];
const INCENTIVE_OPTIONS = ['있음', '없음', '협의'];
const PAYMENT_METHODS = ['매월 25일', '매월 말일', '건별 지급', '협의'];
const WORK_DAYS = ['월~금', '월~토', '주5일', '주6일', '협의'];
const BREAK_TIMES = ['1시간', '30분', '없음'];
const EDUCATION_LEVELS = ['학력무관', '고졸 이상', '초대졸 이상', '대졸 이상'];
const EXPERIENCE_LEVELS = ['경력무관', '신입', '1년 이상', '2년 이상', '3년 이상', '5년 이상'];
const AGENT_PREFERENCES = ['공인중개사 자격증', '부동산 실무경력', '영업경험 우대', '운전면허 소지자', '컴퓨터 활용 가능', '외국어 가능'];
const AGENT_BENEFITS = ['4대보험', '퇴직금', '인센티브', '식대 지원', '교통비 지원', '차량유지비', '숙소 제공', '교육비 지원', '명절 보너스', '경조금', '연차/휴가 보장', '자유 출퇴근'];

// Sales options
const SALES_SITE_TYPES = ['아파트', '오피스텔', '상가', '지식산업센터', '타운하우스'];
const SALES_SALARY_TYPES = ['월급', '건당수수료', '월급+수수료'];
const PAYMENT_TIMINGS = ['계약 시', '입금 시', '등기 시', '협의'];
const SETTLEMENTS = ['개인정산', '법인정산', '협의'];
const SALES_POSITIONS = ['팀장', '실장', '부장', '상담사', '기타'];
const SALES_EXPERIENCES = ['경력무관', '신입가능', '1년 이상', '3년 이상', '5년 이상'];
const SALES_BENEFITS = ['4대보험', '퇴직금', '인센티브', '숙소 제공', '일비 지급', '식대 지원', '교통비 지원', '교육비 지원', '명절 보너스'];
const SALES_FEATURES = ['역세권', '브랜드 아파트', '대단지', '분양가 경쟁력', '입주율 높음', '우수 입지', '교통 편리', '학군 우수'];

const TIME_OPTIONS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00',
];

// ==================== TYPES ====================

interface AgentFormData {
  jobType: string;
  duties: string;
  employmentType: string;
  headcount: string;
  deadline: string;
  salaryType: string;
  salaryAmount: string;
  incentive: string;
  paymentMethod: string;
  workDays: string;
  workStart: string;
  workEnd: string;
  breakTime: string;
  workLocation: string;
  education: string;
  experience: string;
  preferences: string[];
  benefits: string[];
  companyIntro: string;
}

interface SalesFormData {
  siteName: string;
  developer: string;
  constructor: string;
  siteType: string;
  siteLocation: string;
  totalUnits: string;
  salesTiming: string;
  salaryType: string;
  commission: string;
  paymentTiming: string;
  settlement: string;
  additionalBenefits: string;
  position: string;
  headcount: string;
  experience: string;
  workPeriod: string;
  benefits: string[];
  siteFeatures: string[];
  siteIntro: string;
}

const INITIAL_AGENT: AgentFormData = {
  jobType: '', duties: '', employmentType: '', headcount: '', deadline: '상시채용',
  salaryType: '', salaryAmount: '', incentive: '', paymentMethod: '',
  workDays: '', workStart: '09:00', workEnd: '18:00', breakTime: '',
  workLocation: '', education: '', experience: '',
  preferences: [], benefits: [], companyIntro: '',
};

const INITIAL_SALES: SalesFormData = {
  siteName: '', developer: '', constructor: '', siteType: '', siteLocation: '',
  totalUnits: '', salesTiming: '',
  salaryType: '', commission: '', paymentTiming: '', settlement: '', additionalBenefits: '',
  position: '', headcount: '', experience: '', workPeriod: '',
  benefits: [], siteFeatures: [], siteIntro: '',
};

// ==================== CHIP SELECT ====================

function ChipSelect({ label, options, value, onChange, multi = false }: {
  label: string;
  options: string[];
  value: string | string[];
  onChange: (val: string | string[]) => void;
  multi?: boolean;
}) {
  const handleClick = (option: string) => {
    if (multi) {
      const arr = value as string[];
      onChange(arr.includes(option) ? arr.filter(v => v !== option) : [...arr, option]);
    } else {
      onChange(option === value ? '' : option);
    }
  };

  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label} {multi && <span className="text-gray-400 normal-case tracking-normal">(복수 선택)</span>}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(option => {
          const isSelected = multi ? (value as string[]).includes(option) : value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleClick(option)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ==================== SECTION HEADER ====================

function SectionHeader({ emoji, title, color }: { emoji: string; title: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${colorMap[color] || colorMap.blue}`}>
      <span>{emoji}</span> {title}
    </div>
  );
}

// ==================== HTML GENERATION - AGENT ====================

function generateAgentBasicHtml(d: AgentFormData): string {
  const prefs = d.preferences.length > 0
    ? d.preferences.map(p => `  <li>${p}</li>`).join('\n')
    : '  <li></li>';
  const bens = d.benefits.length > 0
    ? d.benefits.map(b => `  <li>${b}</li>`).join('\n')
    : '  <li></li>';
  const salaryText = [d.salaryType, d.salaryAmount ? `${d.salaryAmount}만원` : ''].filter(Boolean).join(' ');
  const workTime = d.workStart && d.workEnd ? `${d.workStart} ~ ${d.workEnd}` : '';

  return `<h2>📋 모집 개요</h2>
<table>
  <tbody>
    <tr><th>모집분야</th><td>${d.jobType}</td></tr>
    <tr><th>담당업무</th><td>${d.duties}</td></tr>
    <tr><th>근무지역</th><td>${d.workLocation}</td></tr>
    <tr><th>근무시간</th><td>${workTime}</td></tr>
    <tr><th>급여조건</th><td>${salaryText}</td></tr>
    <tr><th>경력조건</th><td>${d.experience}</td></tr>
  </tbody>
</table>

<h2>✅ 우대 조건</h2>
<ul>
${prefs}
</ul>

<h2>🎁 복리후생</h2>
<ul>
${bens}
</ul>

<h2>🏢 회사 소개</h2>
<p>${d.companyIntro}</p>
`;
}

function generateAgentAlbamonHtml(d: AgentFormData): string {
  const workTime = d.workStart && d.workEnd ? `${d.workStart} ~ ${d.workEnd}` : '';
  const salaryText = d.salaryAmount
    ? (d.salaryType === '비율제' ? `${d.salaryAmount}%` : `${d.salaryAmount}만원`)
    : '';
  const benefitsText = d.benefits.length > 0 ? d.benefits.join(' · ') : '';

  return `<h2>📌 모집 내용</h2>
<table>
  <tbody>
    <tr><th>모집직종</th><td>${d.jobType}</td></tr>
    <tr><th>고용형태</th><td>${d.employmentType}</td></tr>
    <tr><th>모집인원</th><td>${d.headcount ? d.headcount + '명' : ''}</td></tr>
    <tr><th>모집마감</th><td>${d.deadline || '상시채용'}</td></tr>
  </tbody>
</table>

<h2>💰 급여 조건</h2>
<table>
  <tbody>
    <tr><th>급여형태</th><td>${d.salaryType}</td></tr>
    <tr><th>급여액</th><td>${salaryText}</td></tr>
    <tr><th>인센티브</th><td>${d.incentive}</td></tr>
    <tr><th>지급방식</th><td>${d.paymentMethod}</td></tr>
  </tbody>
</table>

<h2>⏰ 근무 조건</h2>
<table>
  <tbody>
    <tr><th>근무요일</th><td>${d.workDays}</td></tr>
    <tr><th>근무시간</th><td>${workTime}</td></tr>
    <tr><th>휴게시간</th><td>${d.breakTime}</td></tr>
    <tr><th>근무지역</th><td>${d.workLocation}</td></tr>
  </tbody>
</table>

<h2>📝 자격 요건</h2>
<table>
  <tbody>
    <tr><th>학력</th><td>${d.education}</td></tr>
    <tr><th>경력</th><td>${d.experience}</td></tr>
    <tr><th>우대사항</th><td>${d.preferences.join(', ')}</td></tr>
  </tbody>
</table>

<h2>🎁 복리후생</h2>
<p>${benefitsText}</p>
`;
}

function generateAgentJobkoreaHtml(d: AgentFormData): string {
  const salaryText = [d.salaryType, d.salaryAmount ? `${d.salaryAmount}만원` : ''].filter(Boolean).join(' ');
  const workTime = d.workStart && d.workEnd ? `${d.workStart} ~ ${d.workEnd}` : '';
  const qualText = [d.education, d.experience].filter(Boolean).join(', ');

  // Split benefits into categories
  const pay = d.benefits.filter(b => ['인센티브', '퇴직금', '명절 보너스'].includes(b)).join(', ');
  const support = d.benefits.filter(b => ['4대보험', '경조금'].includes(b)).join(', ');
  const facility = d.benefits.filter(b => ['숙소 제공', '식대 지원'].includes(b)).join(', ');
  const edu = d.benefits.filter(b => ['교육비 지원', '자유 출퇴근', '연차/휴가 보장'].includes(b)).join(', ');
  const culture = d.benefits.filter(b => ['교통비 지원', '차량유지비'].includes(b)).join(', ');

  return `<h2>모집부문 및 자격요건</h2>
<table>
  <thead>
    <tr><th>모집부문</th><th>담당업무</th><th>자격요건</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>${d.jobType}</td>
      <td>${d.duties}</td>
      <td>${qualText}</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>근무조건</h2>
<ul>
  <li><strong>고용형태:</strong> ${d.employmentType}</li>
  <li><strong>급여:</strong> ${salaryText}</li>
  <li><strong>근무시간:</strong> ${workTime}</li>
  <li><strong>근무요일:</strong> ${d.workDays}</li>
  <li><strong>근무지역:</strong> ${d.workLocation}</li>
</ul>

<hr />

<h2>복리후생</h2>
<ul>
  <li><strong>급여제도:</strong> ${pay}</li>
  <li><strong>지원금/보험:</strong> ${support}</li>
  <li><strong>편의시설:</strong> ${facility}</li>
  <li><strong>교육/생활:</strong> ${edu}</li>
  <li><strong>조직문화:</strong> ${culture}</li>
</ul>

<hr />

<h2>회사소개</h2>
<p>${d.companyIntro}</p>

<hr />

<h2>전형절차</h2>
<p><strong>서류전형</strong> → <strong>면접</strong> → <strong>최종합격</strong></p>`;
}

function generateAgentHtml(templateId: string, data: AgentFormData): string {
  switch (templateId) {
    case 'agent-basic': return generateAgentBasicHtml(data);
    case 'agent-albamon': return generateAgentAlbamonHtml(data);
    case 'agent-jobkorea': return generateAgentJobkoreaHtml(data);
    default: return generateAgentAlbamonHtml(data);
  }
}

// ==================== HTML GENERATION - SALES ====================

function generateSalesBasicHtml(d: SalesFormData): string {
  const bens = d.benefits.length > 0
    ? d.benefits.map(b => `  <li>${b}</li>`).join('\n')
    : '  <li></li>';

  return `<h2>📋 현장 소개</h2>
<table>
  <tbody>
    <tr><th>현장명</th><td>${d.siteName}</td></tr>
    <tr><th>현장유형</th><td>${d.siteType}</td></tr>
    <tr><th>총 세대수</th><td>${d.totalUnits ? d.totalUnits + '세대' : ''}</td></tr>
    <tr><th>현장위치</th><td>${d.siteLocation}</td></tr>
    <tr><th>분양시기</th><td>${d.salesTiming}</td></tr>
  </tbody>
</table>

<h2>💰 수수료 조건</h2>
<table>
  <tbody>
    <tr><th>수수료</th><td>${d.commission ? d.commission + '만원' : ''}</td></tr>
    <tr><th>지급시기</th><td>${d.paymentTiming}</td></tr>
    <tr><th>추가혜택</th><td>${d.additionalBenefits}</td></tr>
  </tbody>
</table>

<h2>👥 모집 조건</h2>
<ul>
  <li><strong>모집직급:</strong> ${d.position}</li>
  <li><strong>모집인원:</strong> ${d.headcount ? d.headcount + '명' : ''}</li>
  <li><strong>경력조건:</strong> ${d.experience}</li>
</ul>

<h2>🎁 복리후생</h2>
<ul>
${bens}
</ul>
`;
}

function generateSalesAlbamonHtml(d: SalesFormData): string {
  const benefitsText = d.benefits.length > 0 ? d.benefits.join(' · ') : '';
  const features = d.siteFeatures.length > 0
    ? d.siteFeatures.map(f => `  <li>${f}</li>`).join('\n')
    : '  <li></li>';

  return `<h2>📌 현장 정보</h2>
<table>
  <tbody>
    <tr><th>현장명</th><td>${d.siteName}</td></tr>
    <tr><th>시행사</th><td>${d.developer}</td></tr>
    <tr><th>시공사</th><td>${d.constructor}</td></tr>
    <tr><th>현장유형</th><td>${d.siteType}</td></tr>
    <tr><th>현장위치</th><td>${d.siteLocation}</td></tr>
  </tbody>
</table>

<h2>💰 급여 및 수수료</h2>
<table>
  <tbody>
    <tr><th>급여형태</th><td>${d.salaryType}</td></tr>
    <tr><th>수수료</th><td>${d.commission ? d.commission + '만원' : ''}</td></tr>
    <tr><th>지급시기</th><td>${d.paymentTiming}</td></tr>
    <tr><th>정산방법</th><td>${d.settlement}</td></tr>
  </tbody>
</table>

<h2>👥 모집 내용</h2>
<table>
  <tbody>
    <tr><th>모집직급</th><td>${d.position}</td></tr>
    <tr><th>모집인원</th><td>${d.headcount ? d.headcount + '명' : ''}</td></tr>
    <tr><th>경력조건</th><td>${d.experience}</td></tr>
    <tr><th>근무기간</th><td>${d.workPeriod}</td></tr>
  </tbody>
</table>

<h2>🎁 복리후생</h2>
<p>${benefitsText}</p>

<h2>🔥 현장 특징</h2>
<ul>
${features}
</ul>
`;
}

function generateSalesJobkoreaHtml(d: SalesFormData): string {
  const bens = d.benefits.length > 0 ? d.benefits : [''];

  return `<h2>현장소개</h2>
<p>${d.siteIntro}</p>

<hr />

<h2>모집부문 및 조건</h2>
<table>
  <thead>
    <tr><th>모집직급</th><th>수수료</th><th>자격요건</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>${d.position}</td>
      <td>${d.commission ? d.commission + '만원' : ''}</td>
      <td>${d.experience}</td>
    </tr>
  </tbody>
</table>

<hr />

<h2>현장 상세</h2>
<ul>
  <li><strong>현장명:</strong> ${d.siteName}</li>
  <li><strong>세대수:</strong> ${d.totalUnits ? d.totalUnits + '세대' : ''}</li>
  <li><strong>분양가:</strong> ${d.salesTiming}</li>
  <li><strong>입주예정:</strong> ${d.workPeriod}</li>
  <li><strong>위치:</strong> ${d.siteLocation}</li>
</ul>

<hr />

<h2>복리후생</h2>
<ul>
  <li><strong>숙소:</strong> ${bens.includes('숙소 제공') ? '제공' : ''}</li>
  <li><strong>일비:</strong> ${bens.includes('일비 지급') ? '지급' : ''}</li>
  <li><strong>식대:</strong> ${bens.includes('식대 지원') ? '지원' : ''}</li>
  <li><strong>교통:</strong> ${bens.includes('교통비 지원') ? '지원' : ''}</li>
  <li><strong>기타:</strong> ${bens.filter(b => !['숙소 제공', '일비 지급', '식대 지원', '교통비 지원'].includes(b)).join(', ')}</li>
</ul>

<hr />

<h2>전형절차</h2>
<p>${d.siteIntro ? '서류접수 → 면접 → 현장배치' : ''}</p>`;
}

function generateSalesHtml(templateId: string, data: SalesFormData): string {
  switch (templateId) {
    case 'sales-basic': return generateSalesBasicHtml(data);
    case 'sales-albamon': return generateSalesAlbamonHtml(data);
    case 'sales-jobkorea': return generateSalesJobkoreaHtml(data);
    default: return generateSalesAlbamonHtml(data);
  }
}

// ==================== MAIN COMPONENT ====================

interface StructuredJobFormProps {
  templateId: string;
  category: 'agent' | 'sales';
  onHtmlChange: (html: string) => void;
}

export default function StructuredJobForm({ templateId, category, onHtmlChange }: StructuredJobFormProps) {
  const [agentData, setAgentData] = useState<AgentFormData>({ ...INITIAL_AGENT });
  const [salesData, setSalesData] = useState<SalesFormData>({ ...INITIAL_SALES });

  // Generate HTML on data change
  useEffect(() => {
    const html = category === 'agent'
      ? generateAgentHtml(templateId, agentData)
      : generateSalesHtml(templateId, salesData);
    onHtmlChange(html);
  }, [category, templateId, agentData, salesData, onHtmlChange]);

  const updateAgent = useCallback(<K extends keyof AgentFormData>(key: K, value: AgentFormData[K]) => {
    setAgentData(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateSales = useCallback(<K extends keyof SalesFormData>(key: K, value: SalesFormData[K]) => {
    setSalesData(prev => ({ ...prev, [key]: value }));
  }, []);

  if (category === 'agent') {
    return (
      <div className="space-y-4">
        <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
          <p className="text-[11px] text-blue-600 font-medium">
            옵션을 클릭하면 자동으로 양식에 반영됩니다
          </p>
        </div>

        {/* Section 1: 모집 정보 */}
        <SectionHeader emoji="📌" title="모집 정보" color="blue" />
        <div className="space-y-3 pl-1">
          <ChipSelect label="모집직종" options={AGENT_JOB_TYPES} value={agentData.jobType} onChange={v => updateAgent('jobType', v as string)} />
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">담당업무</label>
            <input
              type="text"
              value={agentData.duties}
              onChange={e => updateAgent('duties', e.target.value)}
              placeholder="예: 아파트 매매/전세 중개"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <ChipSelect label="고용형태" options={EMPLOYMENT_TYPES} value={agentData.employmentType} onChange={v => updateAgent('employmentType', v as string)} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">모집인원</label>
              <div className="relative">
                <input
                  type="text"
                  value={agentData.headcount}
                  onChange={e => updateAgent('headcount', e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-8 text-xs focus:outline-none focus:border-blue-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">명</span>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">모집마감</label>
              <input
                type="text"
                value={agentData.deadline}
                onChange={e => updateAgent('deadline', e.target.value)}
                placeholder="상시채용"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </div>

        {/* Section 2: 급여 조건 */}
        <SectionHeader emoji="💰" title="급여 조건" color="emerald" />
        <div className="space-y-3 pl-1">
          <ChipSelect label="급여형태" options={AGENT_SALARY_TYPES} value={agentData.salaryType} onChange={v => updateAgent('salaryType', v as string)} />
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">급여액</label>
            <div className="relative">
              <input
                type="text"
                value={agentData.salaryAmount}
                onChange={e => updateAgent('salaryAmount', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="예: 250"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-12 text-xs focus:outline-none focus:border-blue-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                {agentData.salaryType === '비율제' ? '%' : '만원'}
              </span>
            </div>
          </div>
          <ChipSelect label="인센티브" options={INCENTIVE_OPTIONS} value={agentData.incentive} onChange={v => updateAgent('incentive', v as string)} />
          <ChipSelect label="지급방식" options={PAYMENT_METHODS} value={agentData.paymentMethod} onChange={v => updateAgent('paymentMethod', v as string)} />
        </div>

        {/* Section 3: 근무 조건 */}
        <SectionHeader emoji="⏰" title="근무 조건" color="amber" />
        <div className="space-y-3 pl-1">
          <ChipSelect label="근무요일" options={WORK_DAYS} value={agentData.workDays} onChange={v => updateAgent('workDays', v as string)} />
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">근무시간</label>
            <div className="flex items-center gap-2">
              <select
                value={agentData.workStart}
                onChange={e => updateAgent('workStart', e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-blue-400"
              >
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="text-xs text-gray-400">~</span>
              <select
                value={agentData.workEnd}
                onChange={e => updateAgent('workEnd', e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-blue-400"
              >
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <ChipSelect label="휴게시간" options={BREAK_TIMES} value={agentData.breakTime} onChange={v => updateAgent('breakTime', v as string)} />
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">근무지역</label>
            <input
              type="text"
              value={agentData.workLocation}
              onChange={e => updateAgent('workLocation', e.target.value)}
              placeholder="예: 서울 강남구"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>

        {/* Section 4: 자격 요건 */}
        <SectionHeader emoji="📝" title="자격 요건" color="violet" />
        <div className="space-y-3 pl-1">
          <ChipSelect label="학력" options={EDUCATION_LEVELS} value={agentData.education} onChange={v => updateAgent('education', v as string)} />
          <ChipSelect label="경력" options={EXPERIENCE_LEVELS} value={agentData.experience} onChange={v => updateAgent('experience', v as string)} />
          <ChipSelect label="우대사항" options={AGENT_PREFERENCES} value={agentData.preferences} onChange={v => updateAgent('preferences', v as string[])} multi />
        </div>

        {/* Section 5: 복리후생 */}
        <SectionHeader emoji="🎁" title="복리후생" color="rose" />
        <div className="space-y-3 pl-1">
          <ChipSelect label="복리후생" options={AGENT_BENEFITS} value={agentData.benefits} onChange={v => updateAgent('benefits', v as string[])} multi />
        </div>

        {/* Section 6: 회사 소개 (별도 섹션, 최하단) */}
        <SectionHeader emoji="🏢" title="회사 소개" color="blue" />
        <div className="space-y-3 pl-1">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">회사/사무소 소개</label>
            <textarea
              value={agentData.companyIntro}
              onChange={e => updateAgent('companyIntro', e.target.value)}
              placeholder="회사/사무소를 간단히 소개해 주세요 (예: 강남 20년 전통 부동산, 월 거래 30건 이상)"
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400 resize-none"
            />
          </div>
        </div>
      </div>
    );
  }

  // ==================== SALES FORM ====================
  return (
    <div className="space-y-4">
      <div className="px-3 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-100">
        <p className="text-[11px] text-teal-600 font-medium">
          옵션을 클릭하면 자동으로 양식에 반영됩니다
        </p>
      </div>

      {/* Section 1: 현장 정보 */}
      <SectionHeader emoji="📌" title="현장 정보" color="blue" />
      <div className="space-y-3 pl-1">
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">현장명</label>
          <input
            type="text"
            value={salesData.siteName}
            onChange={e => updateSales('siteName', e.target.value)}
            placeholder="예: ○○ 아파트"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">시행사</label>
            <input
              type="text"
              value={salesData.developer}
              onChange={e => updateSales('developer', e.target.value)}
              placeholder="시행사명"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">시공사</label>
            <input
              type="text"
              value={salesData.constructor}
              onChange={e => updateSales('constructor', e.target.value)}
              placeholder="시공사명"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
        <ChipSelect label="현장유형" options={SALES_SITE_TYPES} value={salesData.siteType} onChange={v => updateSales('siteType', v as string)} />
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">현장위치</label>
          <input
            type="text"
            value={salesData.siteLocation}
            onChange={e => updateSales('siteLocation', e.target.value)}
            placeholder="예: 경기도 화성시"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">총 세대수</label>
            <div className="relative">
              <input
                type="text"
                value={salesData.totalUnits}
                onChange={e => updateSales('totalUnits', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-10 text-xs focus:outline-none focus:border-blue-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">세대</span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">분양시기</label>
            <input
              type="text"
              value={salesData.salesTiming}
              onChange={e => updateSales('salesTiming', e.target.value)}
              placeholder="예: 2026년 상반기"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </div>

      {/* Section 2: 급여/수수료 */}
      <SectionHeader emoji="💰" title="급여 및 수수료" color="emerald" />
      <div className="space-y-3 pl-1">
        <ChipSelect label="급여형태" options={SALES_SALARY_TYPES} value={salesData.salaryType} onChange={v => updateSales('salaryType', v as string)} />
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">수수료</label>
          <div className="relative">
            <input
              type="text"
              value={salesData.commission}
              onChange={e => updateSales('commission', e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="예: 300"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-12 text-xs focus:outline-none focus:border-blue-400"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">만원</span>
          </div>
        </div>
        <ChipSelect label="지급시기" options={PAYMENT_TIMINGS} value={salesData.paymentTiming} onChange={v => updateSales('paymentTiming', v as string)} />
        <ChipSelect label="정산방법" options={SETTLEMENTS} value={salesData.settlement} onChange={v => updateSales('settlement', v as string)} />
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">추가혜택</label>
          <input
            type="text"
            value={salesData.additionalBenefits}
            onChange={e => updateSales('additionalBenefits', e.target.value)}
            placeholder="예: 실적 상위 10% 보너스"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {/* Section 3: 모집 내용 */}
      <SectionHeader emoji="👥" title="모집 내용" color="violet" />
      <div className="space-y-3 pl-1">
        <ChipSelect label="모집직급" options={SALES_POSITIONS} value={salesData.position} onChange={v => updateSales('position', v as string)} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">모집인원</label>
            <div className="relative">
              <input
                type="text"
                value={salesData.headcount}
                onChange={e => updateSales('headcount', e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-8 text-xs focus:outline-none focus:border-blue-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">명</span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">근무기간</label>
            <input
              type="text"
              value={salesData.workPeriod}
              onChange={e => updateSales('workPeriod', e.target.value)}
              placeholder="예: 분양완료시까지"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400"
            />
          </div>
        </div>
        <ChipSelect label="경력조건" options={SALES_EXPERIENCES} value={salesData.experience} onChange={v => updateSales('experience', v as string)} />
      </div>

      {/* Section 4: 복리후생 + 현장특징 */}
      <SectionHeader emoji="🎁" title="복리후생 / 현장 특징" color="rose" />
      <div className="space-y-3 pl-1">
        <ChipSelect label="복리후생" options={SALES_BENEFITS} value={salesData.benefits} onChange={v => updateSales('benefits', v as string[])} multi />
        <ChipSelect label="현장 특징" options={SALES_FEATURES} value={salesData.siteFeatures} onChange={v => updateSales('siteFeatures', v as string[])} multi />
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">현장 소개</label>
          <textarea
            value={salesData.siteIntro}
            onChange={e => updateSales('siteIntro', e.target.value)}
            placeholder="현장을 간단히 소개해 주세요"
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-400 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
