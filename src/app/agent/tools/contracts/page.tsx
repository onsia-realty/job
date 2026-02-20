'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Download, ExternalLink, Building2,
  FileSignature, ClipboardList, Send, ScrollText, Search, CheckCircle2,
} from 'lucide-react';
import Header from '@/components/shared/Header';
import MobileNav from '@/components/shared/MobileNav';

type CategoryKey = 'contract' | 'brokerage' | 'report' | 'etc';

interface FormItem {
  id: number;
  title: string;
  desc: string;
  category: CategoryKey;
  source: string;
  sourceUrl: string;
  downloadUrl?: string; // 직접 다운로드 가능한 파일 경로
}

const CATEGORIES: { key: CategoryKey; label: string; icon: typeof FileText; color: string; iconBg: string }[] = [
  { key: 'contract', label: '계약서', icon: FileSignature, color: 'text-emerald-600', iconBg: 'bg-emerald-100' },
  { key: 'brokerage', label: '중개 실무', icon: ClipboardList, color: 'text-blue-600', iconBg: 'bg-blue-100' },
  { key: 'report', label: '거래 신고', icon: Send, color: 'text-amber-600', iconBg: 'bg-amber-100' },
  { key: 'etc', label: '기타 서류', icon: ScrollText, color: 'text-violet-600', iconBg: 'bg-violet-100' },
];

const FORMS: FormItem[] = [
  // A. 계약서
  {
    id: 1,
    title: '부동산 매매계약서',
    desc: '부동산 매매 거래 시 필수 작성 (매도인·매수인, 대금, 소유권 이전 등)',
    category: 'contract',
    source: '경기부동산포털',
    sourceUrl: 'https://gris.gg.go.kr/reb/selectRebFormView.do',
    downloadUrl: '/forms/부동산_매매계약서.hwp',
  },
  {
    id: 2,
    title: '부동산 임대차계약서 (전세/월세)',
    desc: '전세·월세 거래 시 필수 작성 (보증금, 차임, 임대차 기간, 특약사항 등)',
    category: 'contract',
    source: '경기부동산포털',
    sourceUrl: 'https://gris.gg.go.kr/reb/selectRebFormView.do',
    downloadUrl: '/forms/부동산_임대차계약서.hwp',
  },
  {
    id: 3,
    title: '표준임대차계약서 (임대사업자용)',
    desc: '등록 임대사업자가 사용하는 표준 임대차계약서',
    category: 'contract',
    source: '경기부동산포털',
    sourceUrl: 'https://gris.gg.go.kr/reb/selectRebFormView.do',
    downloadUrl: '/forms/표준임대차계약서_임대사업자용.hwp',
  },
  {
    id: 4,
    title: '상가건물 임대차 표준계약서',
    desc: '상가 임대차 거래 시 사용 (2024.5 개정, 관리비 세부내역·권리금 보호 조항 포함)',
    category: 'contract',
    source: '법무부',
    sourceUrl: 'https://www.moj.go.kr/moj/316/subview.do',
    downloadUrl: '/forms/상가건물_임대차_표준계약서.hwp',
  },

  // B. 중개 실무
  {
    id: 5,
    title: '중개대상물 확인·설명서 [주거용]',
    desc: '주거용 건축물 거래 시 법정 의무 교부 서류 (2024.7 개정)',
    category: 'brokerage',
    source: '국가법령정보센터',
    sourceUrl: 'https://law.go.kr/LSW/lsBylSc.do?menuId=9&subMenuId=55&tabMenuId=261&query=%EC%A4%91%EA%B0%9C%EB%8C%80%EC%83%81%EB%AC%BC',
    downloadUrl: '/forms/중개대상물_확인설명서_주거용.hwp',
  },
  {
    id: 6,
    title: '중개대상물 확인·설명서 [비주거용]',
    desc: '상가·오피스·토지 등 비주거용 거래 시 법정 의무 교부 서류',
    category: 'brokerage',
    source: '국가법령정보센터',
    sourceUrl: 'https://law.go.kr/LSW/lsBylSc.do?menuId=9&subMenuId=55&tabMenuId=261&query=%EC%A4%91%EA%B0%9C%EB%8C%80%EC%83%81%EB%AC%BC',
    downloadUrl: '/forms/중개대상물_확인설명서_비주거용.hwp',
  },
  {
    id: 7,
    title: '일반중개계약서',
    desc: '중개 의뢰 시 작성 — 여러 중개사에 동시 의뢰 가능 (서식 14호)',
    category: 'brokerage',
    source: '국가법령정보센터',
    sourceUrl: 'https://law.go.kr/LSW/lsBylSc.do?menuId=9&subMenuId=55&tabMenuId=261&query=%EC%9D%BC%EB%B0%98%EC%A4%91%EA%B0%9C%EA%B3%84%EC%95%BD%EC%84%9C',
    downloadUrl: '/forms/일반중개계약서.hwp',
  },
  {
    id: 8,
    title: '전속중개계약서',
    desc: '한 중개사에만 독점 의뢰 시 작성 — 3개월 유효 (서식 15호)',
    category: 'brokerage',
    source: '국가법령정보센터',
    sourceUrl: 'https://law.go.kr/LSW/lsBylSc.do?menuId=9&subMenuId=55&tabMenuId=261&query=%EC%A0%84%EC%86%8D%EC%A4%91%EA%B0%9C%EA%B3%84%EC%95%BD%EC%84%9C',
    downloadUrl: '/forms/전속중개계약서.pdf',
  },
  {
    id: 9,
    title: '중개보수 영수증',
    desc: '중개수수료 지급 확인 영수증 (거래금액, 요율, 보수액 기재)',
    category: 'brokerage',
    source: '부동산인',
    sourceUrl: '/forms/중개보수_영수증.html',
    downloadUrl: '/forms/중개보수_영수증.html',
  },

  // C. 거래 신고
  {
    id: 10,
    title: '부동산거래계약 신고서',
    desc: '매매 계약 후 30일 이내 관할 시·군·구청에 신고 의무',
    category: 'report',
    source: '국가법령정보센터',
    sourceUrl: 'https://law.go.kr/LSW/lsBylSc.do?menuId=9&subMenuId=55&tabMenuId=261&query=%EB%B6%80%EB%8F%99%EC%82%B0%EA%B1%B0%EB%9E%98%EA%B3%84%EC%95%BD',
    downloadUrl: '/forms/부동산거래계약_신고서.pdf',
  },
  {
    id: 11,
    title: '부동산거래계약 해제 신고서',
    desc: '계약 해제·무효·취소 시 30일 이내 해제 신고',
    category: 'report',
    source: '국가법령정보센터',
    sourceUrl: 'https://law.go.kr/LSW/lsBylSc.do?menuId=9&subMenuId=55&tabMenuId=261&query=%EB%B6%80%EB%8F%99%EC%82%B0%EA%B1%B0%EB%9E%98%EA%B3%84%EC%95%BD',
    downloadUrl: '/forms/부동산거래계약_해제신고서.pdf',
  },
  {
    id: 12,
    title: '주택임대차 계약 신고서',
    desc: '보증금 6,000만원 또는 월세 30만원 초과 시 30일 이내 신고',
    category: 'report',
    source: '국가법령정보센터',
    sourceUrl: 'https://law.go.kr/LSW/lsBylSc.do?menuId=9&subMenuId=55&tabMenuId=261&query=%EC%A3%BC%ED%83%9D%EC%9E%84%EB%8C%80%EC%B0%A8',
    downloadUrl: '/forms/주택임대차_계약신고서.pdf',
  },

  // D. 기타
  {
    id: 13,
    title: '위임장',
    desc: '본인 대신 대리인이 계약 체결 시 필요 (인감증명서 첨부)',
    category: 'etc',
    source: '국토교통부',
    sourceUrl: 'https://www.molit.go.kr/',
    downloadUrl: '/forms/위임장.hwp',
  },
  {
    id: 14,
    title: '부동산 매매계약서 (영문)',
    desc: '외국인 거래 시 사용하는 영문 매매계약서 양식',
    category: 'etc',
    source: '경기부동산포털',
    sourceUrl: 'https://gris.gg.go.kr/reb/selectRebFormView.do',
    downloadUrl: '/forms/부동산_매매계약서_영문.hwp',
  },
];

export default function ContractsPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredForms = FORMS.filter((form) => {
    const matchCategory = activeCategory === 'all' || form.category === activeCategory;
    const matchSearch = searchQuery === '' || form.title.includes(searchQuery) || form.desc.includes(searchQuery);
    return matchCategory && matchSearch;
  });

  const getCategoryInfo = (key: CategoryKey) => CATEGORIES.find((c) => c.key === key)!;
  const downloadableCount = FORMS.filter((f) => f.downloadUrl).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Header variant="agent" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/agent" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">부동산 중개 서식</h1>
              <p className="text-xs text-slate-500">총 {FORMS.length}개 필수 서식 · {downloadableCount}개 바로 다운로드</p>
            </div>
          </div>
        </div>

        {/* 검색 */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="서식명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
          />
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            전체 ({FORMS.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = FORMS.filter((f) => f.category === cat.key).length;
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.key
                    ? 'bg-slate-800 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* 서식 목록 */}
        <div className="space-y-3">
          {filteredForms.map((form) => {
            const catInfo = getCategoryInfo(form.category);
            const CatIcon = catInfo.icon;
            const hasDownload = !!form.downloadUrl;
            return (
              <div
                key={form.id}
                className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${catInfo.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <CatIcon className={`w-5 h-5 md:w-6 md:h-6 ${catInfo.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-400">#{form.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catInfo.iconBg} ${catInfo.color}`}>
                        {catInfo.label}
                      </span>
                      {hasDownload && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          바로받기
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm md:text-base mb-1">{form.title}</h3>
                    <p className="text-xs md:text-sm text-slate-500 mb-3">{form.desc}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {hasDownload ? (
                        <a
                          href={form.downloadUrl}
                          {...(form.downloadUrl?.endsWith('.html') ? { target: '_blank', rel: 'noopener noreferrer' } : { download: true })}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {form.downloadUrl?.endsWith('.html') ? '양식 열기' : '바로 다운로드'}
                        </a>
                      ) : (
                        <a
                          href={form.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          공식사이트 이동
                        </a>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        {hasDownload ? <Download className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
                        {form.source}
                        {hasDownload && ` · ${form.downloadUrl?.endsWith('.pdf') ? 'PDF' : form.downloadUrl?.endsWith('.html') ? 'HTML' : 'HWP'}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredForms.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">검색 결과가 없습니다</p>
          </div>
        )}

        {/* 안내 */}
        <div className="mt-8 bg-blue-50 rounded-xl border border-blue-100 p-4 md:p-5">
          <h3 className="font-bold text-blue-800 text-sm mb-2">참고 안내</h3>
          <ul className="space-y-1.5 text-xs text-blue-700">
            <li>• <span className="inline-flex items-center gap-0.5 bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">바로받기</span> 표시 서식은 사이트에서 직접 다운로드됩니다 (HWP 또는 PDF).</li>
            <li>• 그 외 서식은 공식 기관 사이트로 이동하여 다운로드할 수 있습니다.</li>
            <li>• 중개대상물 확인·설명서는 2024년 7월 개정본이 적용됩니다.</li>
            <li>• HWP 파일은 한컴오피스 또는 <a href="https://www.hancom.com/viewer" target="_blank" rel="noopener noreferrer" className="underline font-medium">한컴 뷰어</a>로 열 수 있습니다.</li>
            <li>• 추가 서식이 필요하시면 <a href="https://www.kar.or.kr/pinfo/realtyformlist.asp" target="_blank" rel="noopener noreferrer" className="underline font-medium">한국공인중개사협회</a>를 참고하세요.</li>
          </ul>
        </div>

        {/* 바로가기 */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <a
            href="https://plus.gov.kr/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">정부24시</p>
              <p className="text-xs text-slate-500">민원서류 발급</p>
            </div>
          </a>
          <a
            href="https://www.iros.go.kr/index.jsp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">등기부등본</p>
              <p className="text-xs text-slate-500">인터넷등기소</p>
            </div>
          </a>
        </div>
      </div>

      <MobileNav variant="agent" />
    </div>
  );
}
