import { Metadata } from 'next';
import { ReactNode } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://booin.co.kr';

export const metadata: Metadata = {
  title: '부동산 뉴스 | 부동산인 - 실시간 부동산 시장 동향',
  description: '최신 부동산 뉴스, 분양정보, 시장동향, 정책 변화를 실시간으로 확인하세요. 공인중개사, 분양상담사를 위한 필수 부동산 정보 플랫폼.',
  keywords: [
    '부동산 뉴스',
    '부동산 시장',
    '분양정보',
    '아파트 분양',
    '부동산 정책',
    '부동산 전망',
    '공인중개사',
    '분양상담사',
    '부동산인',
    'BOOIN',
    '구인구직',
  ],
  openGraph: {
    title: '부동산 뉴스 | 부동산인',
    description: '최신 부동산 뉴스, 분양정보, 시장동향을 실시간으로 확인하세요.',
    url: `${SITE_URL}/news`,
    siteName: '부동산인',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 556,
        alt: '부동산인 부동산 뉴스',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '부동산 뉴스 | 부동산인',
    description: '최신 부동산 뉴스, 분양정보, 시장동향을 실시간으로 확인하세요.',
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: `${SITE_URL}/news`,
    types: {
      'application/rss+xml': `${SITE_URL}/api/rss`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'google-news-keywords': '부동산,분양,아파트,시장동향,정책',
  },
};

export default function NewsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
