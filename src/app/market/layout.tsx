import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.booin.co.kr').trim();

export const metadata: Metadata = {
  title: '시세·거래량 지도 — 부동산 실무자 전용',
  description: '공인중개사·분양상담사를 위한 전국 실거래가·거래량·중개사 밀도 지도. 호갱노노·네모가 놓친 오피스텔·상업용 정보까지.',
  keywords: [
    '아파트 실거래가', '오피스텔 실거래가', '부동산 거래량', '중개사 맵',
    '강남 아파트 시세', '분양 시세', '부동산인 지도',
  ],
  openGraph: {
    title: '부동산인 — 실무자 전용 시세·거래량 지도',
    description: '아파트·오피스텔 실거래가 + 중개사 밀도 + 구인공고 한 화면에',
    url: `${SITE_URL}/market`,
    type: 'website',
  },
  alternates: { canonical: `${SITE_URL}/market` },
};

export default function MarketLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-100">
      {children}
    </div>
  );
}
