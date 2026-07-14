import { NextRequest, NextResponse } from 'next/server';

// BackURL: 사용자가 인증창에서 취소/에러 시 다날이 이 URL 로 이동
// → opener 로 취소 postMessage 후 팝업 닫기
export const runtime = 'nodejs';

function requestOrigin(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'booin.co.kr';
  return `${proto}://${host}`;
}

function cancelHtml(origin: string): NextResponse {
  const payload = { source: 'danal-uas', ok: false, cancelled: true };
  const json = JSON.stringify(payload).replace(/</g, '\\u003c');
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>본인인증 취소</title></head>
<body style="font-family:sans-serif;text-align:center;padding:40px;color:#334155">
<p>본인인증이 취소되었습니다.</p>
<script>
(function(){
  var data = ${json};
  try { if (window.opener) { window.opener.postMessage(data, ${JSON.stringify(origin)}); } } catch (e) {}
  setTimeout(function(){ window.close(); }, 300);
})();
</script>
</body></html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function POST(req: NextRequest) {
  return cancelHtml(requestOrigin(req));
}

export async function GET(req: NextRequest) {
  return cancelHtml(requestOrigin(req));
}
