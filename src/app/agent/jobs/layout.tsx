import { Metadata } from 'next';
import { ReactNode } from 'react';

const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.booin.co.kr').trim();

export const metadata: Metadata = {
  title: '공인중개사 채용공고 - 중개사무소 구인 | 부동산인',
  description: '공인중개사 채용공고를 실시간으로 확인하세요. 주거용·상업용 부동산 중개사무소의 최신 구인정보, 급여 조건, 근무지역을 한눈에 비교할 수 있습니다.',
  keywords: [
    '공인중개사 채용공고',
    '공인중개사 구인',
    '중개사무소 채용',
    '부동산 중개사 구인구직',
    '공인중개사 일자리',
    '부동산 채용',
    '중개사무소 구인공고',
    '부동산인',
    'BOOIN',
  ],
  openGraph: {
    title: '공인중개사 채용공고 | 부동산인 BOOIN',
    description: '공인중개사 채용공고를 실시간으로 확인. 중개사무소 구인정보를 한눈에 비교하세요.',
    url: `${SITE_URL}/agent/jobs`,
    siteName: '부동산인',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/images/Gemini_Generated_Image_ug5k94ug5k94ug5k.png`,
        width: 1200,
        height: 400,
        alt: '부동산인 - 공인중개사 채용공고',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '공인중개사 채용공고 | 부동산인',
    description: '공인중개사 채용공고를 실시간으로 확인. 중개사무소 구인정보를 한눈에 비교하세요.',
    images: [`${SITE_URL}/images/Gemini_Generated_Image_ug5k94ug5k94ug5k.png`],
  },
  alternates: {
    canonical: `${SITE_URL}/agent/jobs`,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: '공인중개사 채용공고',
  description: '공인중개사 채용공고를 실시간으로 확인. 중개사무소 구인정보를 한눈에 비교하세요.',
  url: `${SITE_URL}/agent/jobs`,
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
      { '@type': 'ListItem', position: 3, name: '채용공고', item: `${SITE_URL}/agent/jobs` },
    ],
  },
};

export default function AgentJobsLayout({ children }: { children: ReactNode }) {
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
