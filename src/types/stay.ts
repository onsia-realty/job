// 단기임대/공실임대(stays) 타입
// supabase/migrations/035_stays.sql + 038_stays_status_agent_lead_detail.sql 과 1:1 대응한다.
// 컬럼명/nullable 여부는 035 + 038 기준.
// 금액은 전부 "원 단위" (_won 접미사) — 시세 도메인의 만원 단위와 혼동 금지 (035:10-11)

import type {
  StayType,
  StayDealType,
  StayOwnerType,
  StaySource,
  StayRoomStructure,
  StaySortOption,
  StayStatus,
} from '@/lib/stay/constants';

/** stays 테이블 행 (035 컬럼 순서 그대로, 038 추가 컬럼은 뒤에) */
export interface Stay {
  id: string;

  // 분류
  stay_type: StayType;
  deal_type: StayDealType;

  // 기본 정보
  title: string;
  description: string | null;

  // 위치
  address: string | null;
  jibun_address: string | null;
  detail_address: string | null;
  region: string | null;
  sigungu: string | null;
  lawd_cd: string | null;   // CHAR(5)
  bcode: string | null;     // CHAR(10)
  pnu: string | null;       // VARCHAR(19)
  lat: number | null;       // NUMERIC(10,7)
  lng: number | null;
  geocode_source: string | null;

  // 건물 (building_ledgers 캐시에서 채움)
  mgm_bldrgst_pk: string | null;
  building_name: string | null;
  main_purps_cd_nm: string | null;
  use_apr_day: string | null;   // CHAR(8) YYYYMMDD
  total_floors: number | null;
  elevator_cnt: number | null;
  parking_total: number | null;
  building_verified: boolean | null;

  // 호실
  floor: number | null;
  exclusive_area: number | null;  // NUMERIC(8,2) ㎡
  supply_area: number | null;
  rooms: number | null;           // SMALLINT
  baths: number | null;
  room_structure: StayRoomStructure | null;
  max_guests: number | null;

  // 요금 (원 단위) — daily/weekly/monthly 중 최소 1개 NOT NULL (035:108)
  deposit_won: number | null;
  daily_fee_won: number | null;
  weekly_fee_won: number | null;
  monthly_fee_won: number | null;
  maintenance_fee_won: number | null;
  maintenance_included: boolean | null;
  utilities_included: boolean | null;

  // 기간
  min_stay_days: number | null;
  max_stay_days: number | null;
  available_from: string | null;  // DATE (YYYY-MM-DD)
  available_to: string | null;

  // 옵션
  amenities: string[];
  appliances: string[];
  parking_available: boolean | null;
  pets_allowed: boolean | null;
  smoking_allowed: boolean | null;

  // 미디어
  thumbnail: string | null;
  images: string[];

  // 연락처
  contact_name: string | null;
  phone: string | null;
  kakao_url: string | null;
  contact_hours: string | null;

  // 메타
  user_id: string | null;
  owner_type: StayOwnerType | null;
  source: StaySource | null;
  lead_id: number | null;   // BIGINT
  views: number;
  is_active: boolean;
  is_approved: boolean;

  created_at: string;
  updated_at: string;

  // ---- 038 추가 ----

  // 임대 진행 상태 (038:29-32) — is_active/is_approved(노출 여부)와 축이 다르다. 등록자가 변경.
  status: StayStatus;

  // 중개사 법정표기 스냅샷 (038:51-59, 공인중개사법 제18조의2)
  // agent_* 5개는 서버가 users/broker_offices 에서 채우는 법정표기 스냅샷. 클라이언트 입력 불가
  // (StayServerControlledField 에 등재 → StayCreateInput 에서 자동 제외).
  // owner_type === 'owner' 이면 전부 null.
  agent_office_name: string | null;     // ① 중개사무소 명칭
  agent_office_address: string | null;  // ② 소재지
  agent_phone: string | null;           // ③ 연락처
  agent_reg_no: string | null;          // ④ 개설등록번호
  agent_representative: string | null;  // ⑤ 대표자 성명
  is_exclusive: boolean;                // ⑥ 전속중개 여부 — 매물 단위 속성, 클라이언트가 보낸다
  broker_office_id: string | null;      // 스냅샷 출처 (broker_offices.id, ON DELETE SET NULL)
  agent_snapshot_at: string | null;     // 스냅샷 시각 (timestamptz)
}

/** 서버가 강제로 결정하는 컬럼 — 클라이언트 입력에서 항상 제거된다 */
export type StayServerControlledField =
  | 'id'
  | 'user_id'
  | 'views'
  | 'is_active'
  | 'is_approved'
  | 'source'
  | 'lead_id'
  | 'created_at'
  | 'updated_at'
  // 038 중개사 스냅샷 — 서버가 users/broker_offices 에서 읽어 덮어쓴다 (038:46-48)
  | 'agent_office_name'
  | 'agent_office_address'
  | 'agent_phone'
  | 'agent_reg_no'
  | 'agent_representative'
  | 'broker_office_id'
  | 'agent_snapshot_at';

/** POST /api/stays 요청 본문 (Zod stayCreateSchema 의 출력과 동형) */
export type StayCreateInput = Omit<Stay, StayServerControlledField>;

/** PATCH /api/stays/[id] 요청 본문 */
export type StayUpdateInput = Partial<StayCreateInput> & {
  /** 소유자는 본인 매물의 노출 on/off 만 직접 제어할 수 있다 */
  is_active?: boolean;
};

/** 공개 목록 필터 (GET /api/stays 쿼리스트링) */
export interface StayListFilter {
  deal_type?: StayDealType;
  stay_type?: StayType;
  region?: string;
  sigungu?: string;
  lawd_cd?: string;
  min_daily_fee_won?: number;
  max_daily_fee_won?: number;
  min_monthly_fee_won?: number;
  max_monthly_fee_won?: number;
  /** 이 일수 이하로 최소숙박이 가능한 매물 (min_stay_days <= 값) */
  min_stay_days?: number;
  /** 전부 포함(AND, amenities @> ARRAY[...]) */
  amenities?: string[];
  /** 임대 진행 상태 다중 선택 (status IN (...)) */
  status?: StayStatus[];
  limit?: number;
  offset?: number;
  sort?: StaySortOption;
}

/**
 * 중개사 법정표기 스냅샷 (공인중개사법 제18조의2).
 * 서버(`lib/stay/agent-snapshot.ts`)가 users + broker_offices 에서 조립한다.
 * - POST/PATCH /api/stays 가 이 값을 stays.agent_* 에 그대로 쓴다.
 * - GET /api/stays/agent-snapshot 이 등록폼 미리보기용으로 같은 값을 돌려준다.
 * 클라이언트는 이 값을 읽기만 하고 수정해서 보낼 수 없다(보내도 스키마에서 strip).
 */
export interface StayAgentSnapshot {
  agent_office_name: string | null;
  agent_office_address: string | null;
  agent_phone: string | null;
  agent_reg_no: string | null;
  agent_representative: string | null;
  /** 004 broker_offices.id — 공적 레지스트리에서 매칭됐을 때만 */
  broker_office_id: string | null;
  agent_snapshot_at: string;
  /** 어디서 채웠는가. 'none' 이면 5항목 전부 null */
  source: 'broker_offices' | 'users' | 'none';
  /** 비어 있는 법정표기 항목 키 — 폼이 "등록 전 채우세요" 안내에 사용 */
  missing: Array<'agent_office_name' | 'agent_office_address' | 'agent_phone' | 'agent_reg_no' | 'agent_representative'>;
}

/** 목록 응답 */
export interface StayListResponse {
  items: Stay[];
  total: number | null;
  limit: number;
  offset: number;
}

// ---------- 주변 시세 비교 (GET /api/stays/[id]/nearby-price) ----------
// 국토부 전월세 실거래(price_transactions)의 지역 평균과 이 매물을 비교한다.
//
// ⚠️ price_transactions 는 만원 단위지만, 이 응답의 금액은 전부 "원 단위" 다.
//    만원→원(×10000) 변환은 API 라우트 경계에서 딱 한 번만 한다.
//    필드명의 `Won` 접미사가 그 규약이다 — 컴포넌트에서 다시 곱하지 마라.

/** 비교를 만들 수 없는 이유 */
export type StayNearbyPriceUnavailableReason =
  /** lawd_cd 가 없어 지역을 특정할 수 없음 */
  | 'no_region'
  /** 국토부 전월세 실거래가 없는 매물 유형 (사무실/상가/빌라/생활숙박시설) */
  | 'unsupported_type'
  /** 비교 기준(월차임)이 없거나 지역 표본이 최소 건수 미만 */
  | 'insufficient_sample';

export interface StayNearbyPriceUnavailable {
  available: false;
  reason: StayNearbyPriceUnavailableReason;
}

export interface StayNearbyPriceAvailable {
  available: true;
  /** 집계에 실제로 쓰인 실거래 건수 */
  sampleCount: number;
  /** 실제 표본이 걸친 개월수 (최초~최종 deal_date 기준, 최소 1) */
  months: number;
  /** 전용면적 ±30% 밴드가 적용됐는지. false 면 면적 무관 전체 표본이다. */
  areaFiltered: boolean;
  /** region_codes.sigungu (실패 시 stays.sigungu 폴백) */
  regionLabel: string;
  /** STAY_TYPE_LABELS 기준 한글 유형명 */
  propertyTypeLabel: string;
  /** 지역 실거래 월차임 단순 평균 (원 단위) */
  average: { monthlyWon: number };
  /** 이 매물의 월차임 (원 단위) */
  subject: { monthlyWon: number };
  /** 평균 대비 증감률(%). 음수면 이 매물이 더 쌈 */
  monthlyDiffPct: number;
}

export type StayNearbyPriceResponse = StayNearbyPriceAvailable | StayNearbyPriceUnavailable;
