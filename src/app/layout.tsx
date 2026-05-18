import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Black_Han_Sans, Gaegu, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Providers from "@/components/providers/Providers";
import SecurityShield from "@/components/security/SecurityShield";
import Honeypot from "@/components/security/Honeypot";
import ChatWidget from "@/components/shared/ChatWidget";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const blackHanSans = Black_Han_Sans({
  variable: "--font-black-han-sans",
  weight: "400",
  subsets: ["latin"],
});

const gaegu = Gaegu({
  variable: "--font-gaegu",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://www.booin.co.kr").trim();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "부동산인 BOOIN - 부동산 전문가 구인구직",
    template: "%s | 부동산인",
  },
  description: "공인중개사, 분양상담사를 위한 AI 기반 구인구직 플랫폼. 최신 부동산 뉴스와 채용 정보를 제공합니다.",
  keywords: [
    "부동산",
    "구인구직",
    "공인중개사",
    "분양상담사",
    "분양대행사",
    "중개사무소",
    "부동산 채용",
    "부동산 뉴스",
    "부동산인",
    "BOOIN",
  ],
  authors: [{ name: "부동산인", url: SITE_URL }],
  creator: "부동산인",
  publisher: "부동산인",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "부동산인",
    title: "부동산인 BOOIN - 부동산 전문가 구인구직",
    description: "공인중개사, 분양상담사를 위한 AI 기반 구인구직 플랫폼",
    images: [
      {
        url: `${SITE_URL}/images/Gemini_Generated_Image_ug5k94ug5k94ug5k.png`,
        width: 1200,
        height: 400,
        alt: "부동산인 BOOIN - 부동산 전문가 구인구직",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "부동산인 BOOIN - 부동산 전문가 구인구직",
    description: "공인중개사, 분양상담사를 위한 AI 기반 구인구직 플랫폼",
    images: [`${SITE_URL}/images/Gemini_Generated_Image_ug5k94ug5k94ug5k.png`],
    creator: "@booin_kr",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    types: {
      "application/rss+xml": `${SITE_URL}/api/rss`,
    },
  },
  verification: {
    google: "dMN0GY609vDS25mC2MRXryNRgTPSgkNSmevS2rlcFn4",
    other: {
      "naver-site-verification": "99ec8c3f26a0e0fd023aeac14d6b5238d9ea88f9",
    },
  },
  category: "부동산",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Google Identity Services - loaded only on login page via dynamic script */}
        {/* DNS Prefetch & Preconnect */}
        <link rel="dns-prefetch" href="//images.unsplash.com" />
        <link rel="dns-prefetch" href="//images.pexels.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.pexels.com" crossOrigin="anonymous" />
        {/* RSS Autodiscovery */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="부동산인 - 부동산 뉴스 RSS"
          href="/api/rss"
        />
        {/* Canonical은 metadata.alternates.canonical로 관리 */}
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        {/* Theme Color */}
        <meta name="theme-color" content="#141517" />
        <meta name="msapplication-TileColor" content="#141517" />
        {/* Google News 최적화 */}
        <meta name="news_keywords" content="부동산,분양,아파트,시장동향,정책,공인중개사,분양상담사" />
        {/* JSON-LD 구조화 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "부동산인 BOOIN",
              url: SITE_URL,
              description: "공인중개사, 분양상담사를 위한 AI 기반 구인구직 플랫폼",
              publisher: {
                "@type": "Organization",
                name: "온시아 공인중개사",
                url: SITE_URL,
              },
              potentialAction: {
                "@type": "SearchAction",
                target: `${SITE_URL}/agent/jobs?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${blackHanSans.variable} ${gaegu.variable} ${plusJakarta.variable} antialiased`}
      >
        <Providers>
          <SecurityShield />
          <Honeypot />
          {children}
          <ChatWidget />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
