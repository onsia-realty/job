import { Metadata } from 'next';
import { ReactNode } from 'react';

const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.booin.co.kr').trim();

export const metadata: Metadata = {
  title: '공인중개사 구인구직 - 중개사무소 채용정보',
  description: '공인중개사 구인구직 전문 플랫폼. 중개사무소 채용공고, 부동산 중개 일자리를 한눈에 확인하세요. AI 매칭으로 나에게 맞는 중개사무소를 찾아보세요.',
  keywords: [
    '공인중개사 구인구직',
    '공인중개사 채용',
    '중개사무소 구인',
    '부동산 중개사 채용',
    '부동산 구인구직',
    '공인중개사 일자리',
    '중개사무소 채용공고',
    '부동산인',
    'BOOIN',
  ],
  openGraph: {
    title: '공인중개사 구인구직 | 부동산인 BOOIN',
    description: '공인중개사 구인구직 전문 플랫폼. 중개사무소 채용공고를 한눈에 확인하세요.',
    url: `${SITE_URL}/agent`,
    siteName: '부동산인',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/images/Gemini_Generated_Image_ug5k94ug5k94ug5k.png`,
        width: 1200,
        height: 400,
        alt: '부동산인 - 공인중개사 구인구직',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '공인중개사 구인구직 | 부동산인',
    description: '공인중개사 구인구직 전문 플랫폼. 중개사무소 채용공고를 한눈에 확인하세요.',
    images: [`${SITE_URL}/images/Gemini_Generated_Image_ug5k94ug5k94ug5k.png`],
  },
  alternates: {
    canonical: `${SITE_URL}/agent`,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: '공인중개사 구인구직',
  description: '공인중개사 구인구직 전문 플랫폼. 중개사무소 채용공고를 한눈에 확인하세요.',
  url: `${SITE_URL}/agent`,
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
      { '@type': 'ListItem', position: 2, name: '공인중개사', item: `${SITE_URL}/agent` },
    ],
  },
};

export default function AgentLayout({ children }: { children: ReactNode }) {
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
