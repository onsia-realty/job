import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "부동산 파트너 | 부동산 전문 구인구직 플랫폼",
  description: "공인중개사, 분양상담사를 위한 전문 구인구직 및 콘텐츠 플랫폼",
  keywords: ["부동산 구인구직", "분양상담사", "공인중개사", "부동산 채용", "분양대행사"],
  openGraph: {
    title: "부동산 파트너",
    description: "부동산 전문 구인구직 플랫폼",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
