// 중개사 법정표기 스냅샷 조립 (공인중개사법 제18조의2, 038:35-59)
//
// ⚠️ 서버 전용. 클라이언트 컴포넌트에서 import 금지 (supabaseAdmin = service_role 키 노출).
//    클라이언트는 GET /api/stays/agent-snapshot 으로만 결과를 읽는다.
//
// 서버 승인 app_metadata.brokerVerified + brokerRegNo로 사무소를 선택한다.
// 사무소명·주소·등록번호·대표자는 레지스트리만 사용한다. 사용자 프로필은 증거가 아니다.
// 연락처는 users.phone 우선, 레지스트리 tel_no 순이다. 누락된 법정표기는 missing으로 알린다.

import { supabaseAdmin } from '@/lib/supabase-server';
import type { StayAgentSnapshot } from '@/types/stay';

/** users 에서 읽는 5컬럼 (001 + 031) */
export interface AgentUsersRow {
  name?: string | null;
  phone?: string | null;
  company_name?: string | null;
  broker_reg_no?: string | null;
  broker_address?: string | null;
}

/** broker_offices 에서 읽는 컬럼 (004) */
export interface AgentBrokerRow {
  id: string;
  estbl_reg_no?: string | null;
  med_office_nm?: string | null;
  rprsv_nm?: string | null;
  lctn_road_nm_addr?: string | null;
  tel_no?: string | null;
}

const LEGAL_KEYS = [
  'agent_office_name',
  'agent_office_address',
  'agent_phone',
  'agent_reg_no',
  'agent_representative',
] as const;

/** 빈 문자열/공백만 → null (SQL NULLIF 의미) */
function nullIfBlank(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  return t === '' ? null : t;
}

/**
 * 개설등록번호 정규화: 모든 공백 제거, 전각/각종 대시 → 반각 하이픈.
 * users.broker_reg_no 는 자유 텍스트(varchar 50)라 "11710－2022－00250" 같은 입력이 온다.
 */
export function normalizeRegNo(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = String(raw)
    .replace(/\s+/g, '')
    .replace(/[－‐‑‒–—―﹣]/g, '-');
  return s === '' ? null : s;
}

/**
 * 순수 조립 함수. DB 접근 없음 — 매핑·정규화·missing 계산만 담당한다.
 * @param usersRow  users 조회 결과 (없으면 null)
 * @param brokerRow broker_offices 매칭 결과 (미매칭이면 null)
 * @param now       agent_snapshot_at 로 쓸 ISO 문자열
 */
export function composeAgentSnapshot(
  usersRow: AgentUsersRow | null,
  brokerRow: AgentBrokerRow | null,
  now: string
): StayAgentSnapshot {
  const u = usersRow ?? {};
  const b = brokerRow;

  const agent_office_name = nullIfBlank(b?.med_office_nm);
  const agent_office_address = nullIfBlank(b?.lctn_road_nm_addr);
  const agent_reg_no = nullIfBlank(b?.estbl_reg_no);
  const agent_representative = nullIfBlank(b?.rprsv_nm);
  // 연락처만 반대 순서: 실제 문의를 받는 등록자 번호가 우선
  const agent_phone = nullIfBlank(u.phone) ?? nullIfBlank(b?.tel_no);

  const values = {
    agent_office_name,
    agent_office_address,
    agent_phone,
    agent_reg_no,
    agent_representative,
  };

  const missing = LEGAL_KEYS.filter((k) => values[k] == null);
  const allNull = missing.length === LEGAL_KEYS.length;

  const source: StayAgentSnapshot['source'] = allNull
    ? 'none'
    : b
      ? 'broker_offices'
      : 'users';

  return {
    ...values,
    broker_office_id: b?.id ?? null,
    agent_snapshot_at: now,
    source,
    missing: [...missing],
  };
}

/** 조회 실패 시 missing 5개를 반환한다. 호출자가 등록 가능 여부를 판단한다. */
function emptySnapshot(now: string): StayAgentSnapshot {
  return composeAgentSnapshot(null, null, now);
}

/**
 * userId 의 users + broker_offices 를 읽어 법정표기 스냅샷을 조립한다.
 * 조회 에러는 던지지 않는다 — console.error 후 source:'none' 을 반환한다.
 */
export async function buildAgentSnapshot(userId: string): Promise<StayAgentSnapshot> {
  const now = new Date().toISOString();

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
    const approved = authData?.user?.app_metadata;
    if (authError || approved?.brokerVerified !== true || typeof approved.brokerRegNo !== 'string') {
      return emptySnapshot(now);
    }
    // ① users
    const { data: usersRow, error: usersError } = await supabaseAdmin
      .from('users')
      .select('name, phone, company_name, broker_reg_no, broker_address')
      .eq('id', userId)
      .maybeSingle();

    if (usersError) {
      console.error('[agent-snapshot] users query error:', usersError);
      return emptySnapshot(now);
    }

    const u = (usersRow ?? null) as AgentUsersRow | null;

    // ② broker_offices — 정규화된 등록번호로 단건 조회
    let brokerRow: AgentBrokerRow | null = null;
    const regNo = normalizeRegNo(approved.brokerRegNo);
    if (regNo) {
      const { data: broker, error: brokerError } = await supabaseAdmin
        .from('broker_offices')
        .select('id, estbl_reg_no, med_office_nm, rprsv_nm, lctn_road_nm_addr, tel_no')
        .eq('estbl_reg_no', regNo)
        .limit(1)
        .maybeSingle();

      if (brokerError) {
        // 레지스트리 조회 실패 시 사무소 법정표기를 누락 처리한다.
        console.error('[agent-snapshot] broker_offices query error:', brokerError);
      } else if (broker) {
        brokerRow = broker as AgentBrokerRow;
      }
    }

    // ③ 매핑
    return composeAgentSnapshot(u, brokerRow, now);
  } catch (err) {
    console.error('[agent-snapshot] unexpected error:', err);
    return emptySnapshot(now);
  }
}
