// 중개사 법정표기 스냅샷 조립 (공인중개사법 제18조의2, 038:35-59)
//
// ⚠️ 서버 전용. 클라이언트 컴포넌트에서 import 금지 (supabaseAdmin = service_role 키 노출).
//    클라이언트는 GET /api/stays/agent-snapshot 으로만 결과를 읽는다.
//
// 흐름:
//   ① users 에서 name / phone / company_name / broker_reg_no / broker_address 조회
//   ② broker_reg_no 를 정규화(공백 제거, 전각 하이픈 → 반각)한 뒤
//      broker_offices.estbl_reg_no(004, LOCALDATA 캐시) 로 단건 조회
//   ③ composeAgentSnapshot 으로 우선순위 매핑 (순수 함수 — 단위 테스트 대상)
//
// 우선순위 (공적 레지스트리가 사무소 정보의 진실, 연락처는 실제로 받는 사람):
//   agent_office_name    : broker_offices.med_office_nm     → users.company_name
//   agent_office_address : broker_offices.lctn_road_nm_addr → users.broker_address
//   agent_reg_no         : broker_offices.estbl_reg_no      → users.broker_reg_no(정규화본)
//   agent_representative : broker_offices.rprsv_nm          → users.name
//   agent_phone          : users.phone → broker_offices.tel_no   (반대 순서 — LOCALDATA 대표번호는
//                          비어 있거나 낡은 경우가 많고, 문의는 등록자가 직접 받아야 한다)
//   빈 문자열은 null 로 취급한다 (SQL NULLIF 의미).
//
// ⚠️ agent_representative 의 users.name 폴백 리스크:
//    공인중개사법상 광고에 "중개보조원" 성명은 표기 금지 항목이다. 등록자가 중개보조원인데
//    broker_offices 매칭이 실패하면, 이 폴백은 금지 항목을 대표자 성명 자리에 적는 셈이 된다.
//    이 저장소의 brokerVerified 는 "개업공인중개사 자격 인증"(auth-server.ts:40-49) 이라
//    등록자 = 대표자라는 전제로 허용한다. broker_offices 매칭이 되면 rprsv_nm 이 우선하므로
//    폴백을 타지 않는다. 향후 중개보조원 계정을 허용하게 되면 이 폴백을 반드시 끊을 것.

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

  const agent_office_name = nullIfBlank(b?.med_office_nm) ?? nullIfBlank(u.company_name);
  const agent_office_address = nullIfBlank(b?.lctn_road_nm_addr) ?? nullIfBlank(u.broker_address);
  const agent_reg_no = nullIfBlank(b?.estbl_reg_no) ?? normalizeRegNo(u.broker_reg_no);
  // ⚠️ users.name 폴백 리스크는 파일 상단 주석 참고. 매칭 시 rprsv_nm 이 우선해 폴백을 타지 않는다.
  const agent_representative = nullIfBlank(b?.rprsv_nm) ?? nullIfBlank(u.name);
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

/** 조회 실패 시 반환값 — 등록을 막지 않고 missing 5개로 폼/관리자에 알린다 */
function emptySnapshot(now: string): StayAgentSnapshot {
  return composeAgentSnapshot(null, null, now);
}

/**
 * userId 의 users + broker_offices 를 읽어 법정표기 스냅샷을 조립한다.
 * 조회 에러는 던지지 않는다 — console.error 후 source:'none' 을 반환한다.
 * (스냅샷 실패가 매물 등록을 막으면 안 된다. 대신 missing 이 5개가 되어 표시된다.)
 */
export async function buildAgentSnapshot(userId: string): Promise<StayAgentSnapshot> {
  const now = new Date().toISOString();

  try {
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
    const regNo = normalizeRegNo(u?.broker_reg_no);
    if (regNo) {
      const { data: broker, error: brokerError } = await supabaseAdmin
        .from('broker_offices')
        .select('id, estbl_reg_no, med_office_nm, rprsv_nm, lctn_road_nm_addr, tel_no')
        .eq('estbl_reg_no', regNo)
        .limit(1)
        .maybeSingle();

      if (brokerError) {
        // 레지스트리 조회만 실패 → users 값으로 계속 진행
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
