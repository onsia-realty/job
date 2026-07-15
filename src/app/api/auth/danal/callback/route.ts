import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { callTrans, isDiTaken } from '@/lib/danal';

// TARGETURL: 다날 인증창이 인증 완료 후 TID 를 POST 로 전달
// → Confirm(CPCGI) 호출 → 성공 시 1회성 token 발급 후 팝업이 opener 로 postMessage
export const runtime = 'nodejs';

// 요청 기반 origin (운영: https://booin.co.kr, dev: http://localhost:3001)
function requestOrigin(req: NextRequest): string {
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'booin.co.kr';
  return `${proto}://${host}`;
}

function postMessageHtml(origin: string, payload: Record<string, unknown>): NextResponse {
  // payload 에는 CI/DI 절대 포함 금지 (서버에만 보관)
  const json = JSON.stringify(payload).replace(/</g, '\\u003c');
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>본인인증</title></head>
<body style="font-family:sans-serif;text-align:center;padding:40px;color:#334155">
<p>본인인증 처리 중...</p>
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

// 다날 confirm 응답 키를 대소문자·변형 무시하고 후보군에서 탐색
// (다날이 리턴값을 phoneNumber/phone, operator/carrier 등으로 반환하므로 정확한 키명이 유동적)
function pickField(map: Map<string, string>, candidates: string[]): string | null {
  const wanted = new Set(candidates.map((c) => c.toLowerCase()));
  for (const [k, v] of map) {
    if (v && wanted.has(k.toLowerCase())) return v;
  }
  return null;
}

// PII 로그 마스킹: 뒤 4자리만 노출
function maskPhone(v: string | null): string {
  if (!v) return '-';
  const d = v.replace(/[^0-9]/g, '');
  return d.length >= 4 ? `***${d.slice(-4)}` : '****';
}

async function parseTid(req: NextRequest): Promise<string> {
  const ct = req.headers.get('content-type') || '';
  try {
    if (ct.includes('application/json')) {
      const body = await req.json();
      return String(body.TID || body.tid || '');
    }
    const form = await req.formData();
    return String(form.get('TID') || form.get('tid') || '');
  } catch {
    return '';
  }
}

export async function POST(req: NextRequest) {
  const origin = requestOrigin(req);

  try {
    const CPID = process.env.DANAL_CPID;
    if (!CPID) {
      return postMessageHtml(origin, { source: 'danal-uas', ok: false, msg: '환경설정 누락' });
    }

    const tid = await parseTid(req);
    if (!tid) {
      return postMessageHtml(origin, { source: 'danal-uas', ok: false, msg: 'TID 없음' });
    }

    // 거래 조회 (ORDERID 확보 + 상태 가드)
    const { data: row, error: selError } = await supabaseAdmin
      .from('danal_verifications')
      .select('tid, orderid, status')
      .eq('tid', tid)
      .maybeSingle();

    if (selError || !row) {
      return postMessageHtml(origin, { source: 'danal-uas', ok: false, msg: '거래 정보 없음' });
    }

    // 재호출 차단: ready 상태에서만 Confirm 진행
    if (row.status !== 'ready') {
      return postMessageHtml(origin, { source: 'danal-uas', ok: false, msg: '이미 처리된 인증입니다' });
    }

    // Confirm 전문 (CONFIRMOPTION=1 → CPID + ORDERID 필수, IDENOPTION=1 → DOB/SEX 분리)
    const res = await callTrans({
      TXTYPE: 'CONFIRM',
      TID: tid,
      CONFIRMOPTION: '1',
      IDENOPTION: '1',
      CPID,
      ORDERID: row.orderid,
    });

    if (res.get('RETURNCODE') !== '0000') {
      const msg = res.get('RETURNMSG') || '본인인증에 실패했습니다';
      return postMessageHtml(origin, { source: 'danal-uas', ok: false, msg });
    }

    const name = res.get('NAME') || null;
    const dob = res.get('DOB') || null;
    const sex = res.get('SEX') || null;
    const ci = res.get('CI') || null;
    const di = res.get('DI') || null;
    // 다날 리턴값 추가적용(2026-07) 후: phoneNumber/phone(번호), operator/carrier(통신사)
    // 정확한 키명이 유동적이라 대소문자·변형을 모두 흡수
    const phone = pickField(res, ['PHONE', 'PHONENO', 'PHONENUMBER']);
    const carrier = pickField(res, ['OPERATOR', 'CARRIER', 'TELECOM']);

    // 어떤 키로 값이 오는지 확인용(값은 마스킹, CI/DI 는 로그 금지)
    console.log(
      '[danal confirm] keys=%s phone=%s carrier=%s',
      Array.from(res.keys()).join(','),
      maskPhone(phone),
      carrier || '-'
    );

    // L1) 이미 가입된 번호(DI)면 재차 인증 차단 — 토큰 발급하지 않음 (다날 인증은 가입 전용)
    if (di && (await isDiTaken(di))) {
      await supabaseAdmin
        .from('danal_verifications')
        .update({ status: 'duplicate' })
        .eq('tid', tid)
        .eq('status', 'ready');
      return postMessageHtml(origin, {
        source: 'danal-uas',
        ok: false,
        code: 'DUPLICATE',
        msg: '이미 가입된 휴대폰번호입니다. 로그인해 주세요.',
      });
    }

    // 1회성 소비 토큰
    const token = crypto.randomUUID();

    const { error: updError } = await supabaseAdmin
      .from('danal_verifications')
      .update({
        ci,
        di,
        name,
        dob,
        sex,
        phone,
        token,
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('tid', tid)
      .eq('status', 'ready'); // 동시성 가드

    if (updError) {
      console.error('danal callback update error:', updError);
      return postMessageHtml(origin, { source: 'danal-uas', ok: false, msg: '인증 저장 실패' });
    }

    // CI/DI 는 절대 전달하지 않음
    return postMessageHtml(origin, {
      source: 'danal-uas',
      ok: true,
      token,
      name,
      dob,
      sex,
      ...(phone ? { phone } : {}),
    });
  } catch (e) {
    console.error('danal callback error:', e);
    return postMessageHtml(origin, { source: 'danal-uas', ok: false, msg: '서버 오류' });
  }
}
