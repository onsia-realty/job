'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, backgroundColor: '#141517', fontFamily: 'sans-serif' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <h1 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.75rem' }}>
              시스템 오류가 발생했습니다
            </h1>
            <p style={{ color: '#9ca3af', marginBottom: '2rem', lineHeight: 1.6 }}>
              예기치 않은 문제가 발생했습니다. 페이지를 새로고침 해주세요.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(to right, #2563eb, #0891b2)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              새로고침
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
