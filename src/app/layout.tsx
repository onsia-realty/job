import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://onsia.city";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "온시아 JOB - 부동산 전문가 구인구직",
    template: "%s | 온시아 JOB",
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
    "온시아",
    "JOB",
  ],
  authors: [{ name: "온시아 JOB", url: SITE_URL }],
  creator: "온시아 JOB",
  publisher: "온시아 JOB",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "온시아 JOB",
    title: "온시아 JOB - 부동산 전문가 구인구직",
    description: "공인중개사, 분양상담사를 위한 AI 기반 구인구직 플랫폼",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "온시아 JOB - 부동산 전문가 구인구직",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "온시아 JOB - 부동산 전문가 구인구직",
    description: "공인중개사, 분양상담사를 위한 AI 기반 구인구직 플랫폼",
    images: [`${SITE_URL}/og-image.png`],
    creator: "@onsia_job",
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
    // Google Search Console, Naver Webmaster 등록 후 추가
    // google: "google-site-verification-code",
    // other: { "naver-site-verification": "naver-code" },
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
        {/* RSS Autodiscovery */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="온시아 JOB - 부동산 뉴스 RSS"
          href="/api/rss"
        />
        {/* Canonical */}
        <link rel="canonical" href={SITE_URL} />
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Theme Color */}
        <meta name="theme-color" content="#141517" />
        <meta name="msapplication-TileColor" content="#141517" />
        {/* Google News 최적화 */}
        <meta name="news_keywords" content="부동산,분양,아파트,시장동향,정책,공인중개사,분양상담사" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
