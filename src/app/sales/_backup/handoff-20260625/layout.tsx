import { Metadata } from 'next';
import { ReactNode } from 'react';

const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.booin.co.kr').trim();

export const metadata: Metadata = {
  title: '분양상담사 구인구직 - 분양대행사 채용정보',
  description: '분양상담사 구인구직 전문 플랫폼. 아파트, 오피스텔, 상가 분양 현장의 최신 채용공고를 확인하세요. 분양대행사 채용정보와 높은 수수료 현장을 한눈에.',
  keywords: [
    '분양상담사 구인구직',
    '분양상담사 채용',
    '분양대행사 구인',
    '분양상담사 일자리',
    '분양 현장 채용',
    '아파트 분양 구인',
    '부동산 구인구직',
    '부동산인',
    'BOOIN',
  ],
  openGraph: {
    title: '분양상담사 구인구직 | 부동산인 BOOIN',
    description: '분양상담사 구인구직 전문 플랫폼. 분양대행사 채용공고를 한눈에 확인하세요.',
    url: `${SITE_URL}/sales`,
    siteName: '부동산인',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/images/Gemini_Generated_Image_ug5k94ug5k94ug5k.png`,
        width: 1200,
        height: 400,
        alt: '부동산인 - 분양상담사 구인구직',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '분양상담사 구인구직 | 부동산인',
    description: '분양상담사 구인구직 전문 플랫폼. 분양대행사 채용공고를 한눈에 확인하세요.',
    images: [`${SITE_URL}/images/Gemini_Generated_Image_ug5k94ug5k94ug5k.png`],
  },
  alternates: {
    canonical: `${SITE_URL}/sales`,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: '분양상담사 구인구직',
  description: '분양상담사 구인구직 전문 플랫폼. 분양대행사 채용공고를 한눈에 확인하세요.',
  url: `${SITE_URL}/sales`,
  isPartOf: {
    '@type': 'WebSite',
    name: '부동산인 BOOIN',
    url: SITE_URL,
  },
  provider: {
    '@type': 'Organization',
    name: '부동산인',
    url: SITE_URL,
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: '분양상담사', item: `${SITE_URL}/sales` },
    ],
  },
};

export default function SalesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
