// 다날(Danal) UAS 휴대폰 본인확인 - 서버 전용 유틸
//
// UAS.UI.1.2.5.NODEJS 예제(inc/function.js, Ready.js, CPCGI.js)를 TypeScript로 이식.
// - 거래서버(Ready/Confirm): POST https://uas.teledit.com/uas/ (x-www-form-urlencoded, UTF-8)
// - 각 값은 encodeURI 로 직렬화 (예제 data2str 그대로). 응답은 UTF-8 문자열을 Map으로 파싱.
// - 새 npm 의존성 없이 네이티브 fetch 사용.
//
// 보안: CPID/CPPWD/CI/DI 는 절대 프론트/팝업에 노출하지 않는다. 이 파일은 서버에서만 import.

import { supabaseAdmin } from '@/lib/supabase-server';

const DN_SERVICE_URL = 'https://uas.teledit.com/uas/';
const DN_TIMEOUT_MS = 30_000;

export const DANAL_WAUTH_URL = 'https://wauth.teledit.com/Danal/WebAuth/Web/Start.php';

// 예제 data2str: key=encodeURI(val) 를 & 로 연결
export function data2str(data: Map<string, string>): string {
  const parts: string[] = [];
  data.forEach((val, key) => {
    parts.push(`${key}=${encodeURI(val ?? '')}`);
  });
  return parts.join('&');
}

// 예제 str2data: & / = 로 분해. 다날 응답은 UTF-8 원문이며 URL 인코딩되어 있지 않다.
// (예제 inc/function.js 도 응답값을 percent-decode 하지 않고 원문 그대로 사용)
// ⚠️ CI/DI 는 base64 라 '+' '/' '=' 를 포함한다 → percent-decode 하거나 '+'→' ' 치환하면
//    값이 손상되므로 절대 디코드하지 않고 첫 '=' 기준으로만 key/value 를 분리한다.
export function str2data(str: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const elem of str.split('&')) {
    if (!elem) continue;
    const idx = elem.indexOf('=');
    const key = idx === -1 ? elem : elem.slice(0, idx);
    const val = idx === -1 ? '' : elem.slice(idx + 1); // 원문 그대로 (base64 보존)
    map.set(key, val);
  }
  return map;
}

// 예제 CallTrans 이식: 거래서버로 POST 후 응답 Map 반환
export async function callTrans(params: Record<string, string>): Promise<Map<string, string>> {
  const reqMap = new Map<string, string>(Object.entries(params));
  const body = data2str(reqMap);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DN_TIMEOUT_MS);
  try {
    const res = await fetch(DN_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
      body,
      signal: controller.signal,
      // 운영에서 TLS 무시 절대 금지 (예제의 NODE_TLS_REJECT_UNAUTHORIZED=0 는 이식하지 않음)
    });

    if (res.status !== 200) {
      return str2data('RETURNCODE=-1');
    }
    // 응답은 UTF-8 x-www-form-urlencoded 문자열
    const text = await res.text();
    return str2data(text);
  } catch {
    return str2data('RETURNCODE=-1');
  } finally {
    clearTimeout(timer);
  }
}

// 서버 생성 주문번호
export function makeOrderId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `BOOIN${ts}${rand}`.toUpperCase();
}

// DANAL_TARGET_URL(=.../callback) 로부터 취소 콜백(BackURL) 도출
export function danalTargetUrl(): string {
  const url = process.env.DANAL_TARGET_URL;
  if (!url) throw new Error('DANAL_TARGET_URL 미설정');
  return url;
}

export function danalCancelUrl(): string {
  // TARGETURL 과 반드시 달라야 함 → /callback 을 /cancel 로 치환
  return danalTargetUrl().replace(/\/callback\/?$/, '/cancel');
}

// ---- Confirm 결과 소비(회원가입 저장 시) ----

export interface DanalVerification {
  tid: string;
  orderid: string;
  ci: string | null;
  di: string | null;
  name: string | null;
  phone: string | null;
  status: string;
}

// token 으로 confirmed 상태의 인증 행 조회 (없으면 null)
export async function getConfirmedVerificationByToken(
  token: string
): Promise<DanalVerification | null> {
  if (!token) return null;
  const { data, error } = await supabaseAdmin
    .from('danal_verifications')
    .select('tid, orderid, ci, di, name, phone, status')
    .eq('token', token)
    .eq('status', 'confirmed')
    .maybeSingle();
  if (error || !data) return null;
  return data as DanalVerification;
}

// 동일 DI 로 이미 가입된 다른 사용자가 있는지 확인
export async function isDiTaken(di: string, excludeUserId?: string): Promise<boolean> {
  if (!di) return false;
  let query = supabaseAdmin.from('users').select('id').eq('di', di).limit(1);
  if (excludeUserId) query = query.neq('id', excludeUserId);
  const { data } = await query.maybeSingle();
  return !!data;
}

// 인증 행을 소비 완료 처리 (재사용 방지)
export async function markVerificationConsumed(token: string): Promise<void> {
  await supabaseAdmin
    .from('danal_verifications')
    .update({ status: 'consumed' })
    .eq('token', token);
}
