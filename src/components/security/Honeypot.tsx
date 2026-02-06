'use client';

/**
 * Honeypot 트랩 컴포넌트
 * - 사람 눈에는 보이지 않지만 봇/크롤러는 이 링크를 따라감
 * - /api/trap 접근 시 해당 IP를 블랙리스트에 등록
 * - 여러 개의 숨겨진 링크로 봇 탐지율 향상
 */
export default function Honeypot() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        opacity: 0,
        pointerEvents: 'none',
        tabIndex: -1,
      }}
    >
      <a href="/api/trap?src=sitemap" tabIndex={-1}>사이트맵</a>
      <a href="/api/trap?src=admin" tabIndex={-1}>관리자</a>
      <a href="/api/trap?src=data" tabIndex={-1}>데이터</a>
      <a href="/api/trap?src=export" tabIndex={-1}>내보내기</a>
      <a href="/api/trap?src=backup" tabIndex={-1}>백업</a>
    </div>
  );
}
