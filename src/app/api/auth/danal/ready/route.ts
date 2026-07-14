import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import {
  callTrans,
  makeOrderId,
  danalTargetUrl,
  danalCancelUrl,
  DANAL_WAUTH_URL,
} from '@/lib/danal';

// 팝업에서 열림: window.open('/api/auth/danal/ready', ...)
// Ready(TID 발급) → 성공 시 wauth 인증창으로 자동 submit 하는 HTML 반환
export const runtime = 'nodejs';

function htmlResponse(html: string, status = 200) {
  return new NextResponse(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function escapeAttr(v: string): string {
  return String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function errorHtml(msg: string): string {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>본인인증 오류</title></head>
<body style="font-family:sans-serif;text-align:center;padding:40px;color:#334155">
<p>본인인증 서비스 오류</p>
<p style="color:#94a3b8;font-size:13px">${escapeAttr(msg)}</p>
<button onclick="window.close()" style="margin-top:16px;padding:8px 20px">닫기</button>
</body></html>`;
}

export async function GET(_req: NextRequest) {
  try {
    const CPID = process.env.DANAL_CPID;
    const CPPWD = process.env.DANAL_CPPWD;
    if (!CPID || !CPPWD) {
      return htmlResponse(errorHtml('환경설정 누락'), 500);
    }

    const orderId = makeOrderId();
    const targetUrl = danalTargetUrl();

    // Ready 전문 (TID 발급)
    const res = await callTrans({
      TXTYPE: 'ITEMSEND',
      SERVICE: 'UAS',
      AUTHTYPE: '36',
      CPID,
      CPPWD,
      TARGETURL: targetUrl,
      CPTITLE: 'booin.co.kr',
      ORDERID: orderId,
    });

    if (res.get('RETURNCODE') !== '0000') {
      const msg = `${res.get('RETURNCODE') ?? '-'} / ${res.get('RETURNMSG') ?? '알 수 없는 오류'}`;
      return htmlResponse(errorHtml(msg));
    }

    const tid = res.get('TID') || '';
    if (!tid) {
      return htmlResponse(errorHtml('TID 수신 실패'));
    }

    // 거래 저장 (ORDERID 는 Confirm 시 CPID 와 함께 검증에 사용)
    const { error: insertError } = await supabaseAdmin
      .from('danal_verifications')
      .insert({ tid, orderid: orderId, status: 'ready' });
    if (insertError) {
      console.error('danal ready insert error:', insertError);
      return htmlResponse(errorHtml('거래 저장 실패'), 500);
    }

    const backUrl = danalCancelUrl();

    // wauth 인증창으로 자동 submit (BackURL 은 TARGETURL 과 달라야 함)
    const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>본인인증</title></head>
<body>
<form name="danalReady" method="post" action="${DANAL_WAUTH_URL}">
<input type="hidden" name="TID" value="${escapeAttr(tid)}">
<input type="hidden" name="BackURL" value="${escapeAttr(backUrl)}">
<input type="hidden" name="BgColor" value="00">
<input type="hidden" name="IsCharSet" value="UTF-8">
</form>
<script>document.danalReady.submit();</script>
</body></html>`;
    return htmlResponse(html);
  } catch (e) {
    console.error('danal ready error:', e);
    return htmlResponse(errorHtml('서버 오류'), 500);
  }
}
