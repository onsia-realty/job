/** @type {import('next').NextConfig} */
const nextConfig = {
  // Source Map 비활성화 - 원본 코드 노출 방지
  productionBrowserSourceMaps: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'pkbnudkbkhzqjhwffkbj.supabase.co',
      },
    ],
  },

  // X-Powered-By 헤더 제거
  poweredByHeader: false,

  // 정적 자산 압축
  compress: true,

  // 보안 헤더
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // XSS 방어
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // 외부 사이트에서 iframe 삽입 차단
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          // Referrer 정보 최소화
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // HTTPS 강제
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // 브라우저 기능 제한
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // JS/CSS 소스 직접 접근 차단
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default nextConfig;
