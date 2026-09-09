import { z } from 'zod';
import {
  STAY_TYPES,
  STAY_DEAL_TYPES,
  STAY_OWNER_TYPES,
  STAY_ROOM_STRUCTURES,
  STAY_AMENITIES,
  STAY_APPLIANCES,
  STAY_GEOCODE_SOURCES,
  STAY_IMAGES_MAX,
  STAY_STATUSES,
} from '@/lib/stay/constants';

// 단기임대(stays) 입력 검증
//
// ⚠️ job.ts:22 와 달리 .passthrough() 를 쓰지 않는다. Zod 의 기본 object 동작(strip)에 따라
//    아래 화이트리스트에 없는 키는 파싱 결과에서 "제거"된다.
//    → 클라이언트가 is_approved / user_id / views / lead_id / source 같은 서버 통제 컬럼을
//      본문에 밀어넣어도 DB insert 페이로드에 도달하지 못한다.
//    이것이 "서버 규약 그대로 복사"의 유일한 의도적 예외다.
//
// 컬럼명/타입/CHECK 는 supabase/migrations/035_stays.sql + 038_stays_status_agent_lead_detail.sql 이 단일 출처.

const MAX_WON = 2_000_000_000; // INTEGER(2,147,483,647) 범위 내 실무 상한

// 금액: 원 단위 정수, 음수 불가
const wonField = (label: string) =>
  z
    .number({ message: `${label}은(는) 숫자로 입력해주세요` })
    .int(`${label}은(는) 원 단위 정수로 입력해주세요`)
    .min(0, `${label}은(는) 0원 이상이어야 합니다`)
    .max(MAX_WON, `${label} 금액이 너무 큽니다`)
    .nullish();

const areaField = (label: string) =>
  z
    .number({ message: `${label}은(는) 숫자로 입력해주세요` })
    .min(0, `${label}은(는) 0 이상이어야 합니다`)
    .max(999_999.99, `${label}이(가) 너무 큽니다`)
    .nullish();

const dayCountField = (label: string) =>
  z
    .number({ message: `${label}은(는) 숫자로 입력해주세요` })
    .int(`${label}은(는) 정수로 입력해주세요`)
    .min(1, `${label}은(는) 1일 이상이어야 합니다`)
    .max(3650, `${label}은(는) 3650일 이내로 입력해주세요`)
    .nullish();

const smallIntField = (label: string, max: number) =>
  z
    .number({ message: `${label}은(는) 숫자로 입력해주세요` })
    .int(`${label}은(는) 정수로 입력해주세요`)
    .min(0, `${label}은(는) 0 이상이어야 합니다`)
    .max(max, `${label}이(가) 너무 큽니다`)
    .nullish();

// DATE 컬럼: 'YYYY-MM-DD'
const dateField = (label: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label}은(는) YYYY-MM-DD 형식으로 입력해주세요`)
    .nullish();

// 명시 화이트리스트. 여기 없는 키는 전부 strip 된다.
const stayBaseShape = {
  // ---- 분류 (035 NOT NULL + CHECK) ----
  stay_type: z.enum(STAY_TYPES),
  deal_type: z.enum(STAY_DEAL_TYPES),

  // ---- 기본 정보 ----
  title: z.string().trim().min(1, '제목을 입력해주세요').max(200, '제목은 200자 이내로 입력해주세요'),
  description: z.string().max(20000, '상세 내용이 너무 깁니다').nullish(),

  // ---- 위치 ----
  address: z.string().max(500, '주소가 너무 깁니다').nullish(),
  jibun_address: z.string().max(500, '지번주소가 너무 깁니다').nullish(),
  detail_address: z.string().max(200, '상세주소는 200자 이내로 입력해주세요').nullish(),
  region: z.string().max(50, '지역명이 너무 깁니다').nullish(),
  sigungu: z.string().max(50, '시군구명이 너무 깁니다').nullish(),
  lawd_cd: z.string().regex(/^\d{5}$/, '법정동코드(시군구)는 숫자 5자리입니다').nullish(),
  bcode: z.string().regex(/^\d{10}$/, '법정동코드는 숫자 10자리입니다').nullish(),
  pnu: z.string().regex(/^\d{19}$/, 'PNU는 숫자 19자리입니다').nullish(),
  lat: z.number().min(-90, '위도 범위를 벗어났습니다').max(90, '위도 범위를 벗어났습니다').nullish(),
  lng: z.number().min(-180, '경도 범위를 벗어났습니다').max(180, '경도 범위를 벗어났습니다').nullish(),
  geocode_source: z.enum(STAY_GEOCODE_SOURCES).nullish(),

  // ---- 건물 ----
  mgm_bldrgst_pk: z.string().max(50).nullish(),
  building_name: z.string().max(200, '건물명이 너무 깁니다').nullish(),
  main_purps_cd_nm: z.string().max(100).nullish(),
  use_apr_day: z.string().regex(/^\d{8}$/, '사용승인일은 YYYYMMDD 8자리입니다').nullish(),
  total_floors: smallIntField('총 층수', 200),
  elevator_cnt: smallIntField('엘리베이터 대수', 100),
  parking_total: smallIntField('총 주차대수', 100000),
  building_verified: z.boolean().nullish(),

  // ---- 호실 ----
  floor: z
    .number({ message: '층은 숫자로 입력해주세요' })
    .int('층은 정수로 입력해주세요')
    .min(-10, '층 범위를 확인해주세요')
    .max(200, '층 범위를 확인해주세요')
    .nullish(),
  exclusive_area: areaField('전용면적'),
  supply_area: areaField('공급면적'),
  rooms: smallIntField('방 개수', 100),
  baths: smallIntField('욕실 개수', 100),
  room_structure: z.enum(STAY_ROOM_STRUCTURES).nullish(),
  max_guests: smallIntField('최대 인원', 100),

  // ---- 요금 (원 단위) ----
  deposit_won: wonField('보증금'),
  daily_fee_won: wonField('일 요금'),
  weekly_fee_won: wonField('주 요금'),
  monthly_fee_won: wonField('월 요금'),
  maintenance_fee_won: wonField('관리비'),
  maintenance_included: z.boolean().nullish(),
  utilities_included: z.boolean().nullish(),

  // ---- 기간 ----
  min_stay_days: dayCountField('최소 숙박일'),
  max_stay_days: dayCountField('최대 숙박일'),
  available_from: dateField('입주 가능일'),
  available_to: dateField('임대 종료일'),

  // ---- 옵션 ----
  amenities: z.array(z.enum(STAY_AMENITIES)).max(STAY_AMENITIES.length, '옵션 선택이 너무 많습니다').optional(),
  appliances: z.array(z.enum(STAY_APPLIANCES)).max(STAY_APPLIANCES.length, '가전 선택이 너무 많습니다').optional(),
  parking_available: z.boolean().nullish(),
  pets_allowed: z.boolean().nullish(),
  smoking_allowed: z.boolean().nullish(),

  // ---- 미디어 ----
  thumbnail: z.string().max(1000, '썸네일 주소가 너무 깁니다').nullish(),
  images: z
    .array(z.string().max(1000, '이미지 주소가 너무 깁니다'))
    .max(STAY_IMAGES_MAX, `이미지는 최대 ${STAY_IMAGES_MAX}장까지 등록할 수 있습니다`)
    .optional(),

  // ---- 연락처 ----
  contact_name: z.string().max(50, '담당자명은 50자 이내로 입력해주세요').nullish(),
  phone: z.string().max(20, '연락처 형식을 확인해주세요').nullish(),
  kakao_url: z.string().max(1000, '카카오 링크가 너무 깁니다').nullish(),
  contact_hours: z.string().max(100, '연락 가능 시간은 100자 이내로 입력해주세요').nullish(),

  // ---- 메타 (클라이언트가 정할 수 있는 유일한 메타 필드) ----
  owner_type: z.enum(STAY_OWNER_TYPES).nullish(),

  // ---- 038: 임대 진행 상태 + 전속 여부 (등록자가 정하는 매물 단위 속성) ----
  status: z.enum(STAY_STATUSES).nullish(),
  is_exclusive: z.boolean().nullish(),
  // ⚠️ 038 agent_* / broker_office_id / agent_snapshot_at 은 의도적으로 여기 없다.
  //    법정표기 스냅샷은 서버가 users/broker_offices 에서 채우며, 이 화이트리스트에 없어야
  //    클라이언트가 보낸 값이 strip 되어 insert 페이로드에 닿지 않는다 (038:46-48).
};

const stayBaseObject = z.object(stayBaseShape);

// 035:108 stays_fee_required CHECK 재현 — daily/weekly/monthly 중 최소 1개
const hasAnyFee = (v: {
  daily_fee_won?: number | null;
  weekly_fee_won?: number | null;
  monthly_fee_won?: number | null;
}) =>
  v.daily_fee_won != null || v.weekly_fee_won != null || v.monthly_fee_won != null;

/** POST /api/stays 본문 검증 */
export const stayCreateSchema = stayBaseObject
  .refine(hasAnyFee, {
    message: '일 요금 / 주 요금 / 월 요금 중 최소 하나는 입력해야 합니다',
    path: ['daily_fee_won'],
  })
  .refine(
    (v) =>
      v.min_stay_days == null || v.max_stay_days == null || v.min_stay_days <= v.max_stay_days,
    { message: '최소 숙박일은 최대 숙박일보다 클 수 없습니다', path: ['min_stay_days'] }
  )
  .refine(
    (v) =>
      !v.available_from || !v.available_to || v.available_from <= v.available_to,
    { message: '입주 가능일은 임대 종료일보다 늦을 수 없습니다', path: ['available_from'] }
  );

/**
 * PATCH /api/stays/[id] 본문 검증
 *
 * 부분 수정이므로 요금 3종 CHECK 는 "세 값이 모두 본문에 실려 온 경우"에만 검사한다.
 * (한 컬럼만 보내는 경우 나머지 값은 DB 에 있으므로 앱에서 판단 불가 → DB CHECK 가 최종 방어)
 * is_active 는 소유자가 본인 매물 노출을 끄고 켤 수 있어야 하므로 여기서만 허용한다.
 */
export const stayUpdateSchema = stayBaseObject
  .partial()
  .extend({ is_active: z.boolean().optional() })
  .refine(
    (v) =>
      !('daily_fee_won' in v && 'weekly_fee_won' in v && 'monthly_fee_won' in v) || hasAnyFee(v),
    {
      message: '일 요금 / 주 요금 / 월 요금 중 최소 하나는 입력해야 합니다',
      path: ['daily_fee_won'],
    }
  )
  .refine(
    (v) =>
      v.min_stay_days == null || v.max_stay_days == null || v.min_stay_days <= v.max_stay_days,
    { message: '최소 숙박일은 최대 숙박일보다 클 수 없습니다', path: ['min_stay_days'] }
  )
  .refine(
    (v) => !v.available_from || !v.available_to || v.available_from <= v.available_to,
    { message: '입주 가능일은 임대 종료일보다 늦을 수 없습니다', path: ['available_from'] }
  );

export type StayCreateParsed = z.infer<typeof stayCreateSchema>;
export type StayUpdateParsed = z.infer<typeof stayUpdateSchema>;

// 필드별 친절 메시지 (job.ts:25 JOB_FIELD_MESSAGES 스타일)
export const STAY_FIELD_MESSAGES: Record<string, string> = {
  stay_type: '숙소 유형(오피스텔/아파트/생활숙박시설/사무실/상가/빌라)을 선택해주세요',
  deal_type: '거래 유형(단기임대/공실임대)을 선택해주세요',
  title: '제목을 입력해주세요',
  description: '상세 내용을 확인해주세요',
  region: '지역을 확인해주세요',
  sigungu: '시군구를 확인해주세요',
  lawd_cd: '법정동코드(시군구 5자리)를 확인해주세요',
  bcode: '법정동코드(10자리)를 확인해주세요',
  pnu: 'PNU(19자리)를 확인해주세요',
  room_structure: '방 구조를 확인해주세요',
  owner_type: '등록 주체(중개사/임대인)를 확인해주세요',
  geocode_source: '좌표 출처 값을 확인해주세요',
  exclusive_area: '전용면적을 확인해주세요',
  supply_area: '공급면적을 확인해주세요',
  floor: '층 정보를 확인해주세요',
  deposit_won: '보증금은 0원 이상의 정수(원 단위)로 입력해주세요',
  daily_fee_won: '일 요금 / 주 요금 / 월 요금 중 최소 하나는 입력해야 합니다',
  weekly_fee_won: '주 요금은 0원 이상의 정수(원 단위)로 입력해주세요',
  monthly_fee_won: '월 요금은 0원 이상의 정수(원 단위)로 입력해주세요',
  maintenance_fee_won: '관리비는 0원 이상의 정수(원 단위)로 입력해주세요',
  min_stay_days: '최소 숙박일을 확인해주세요',
  max_stay_days: '최대 숙박일을 확인해주세요',
  available_from: '입주 가능일을 YYYY-MM-DD 형식으로 입력해주세요',
  available_to: '임대 종료일을 YYYY-MM-DD 형식으로 입력해주세요',
  amenities: '선택한 옵션 항목을 확인해주세요',
  appliances: '선택한 가전/비품 항목을 확인해주세요',
  images: `이미지는 최대 ${STAY_IMAGES_MAX}장까지 등록할 수 있습니다`,
  thumbnail: '대표 이미지를 확인해주세요',
  contact_name: '담당자명을 확인해주세요',
  phone: '연락처를 확인해주세요',
  use_apr_day: '사용승인일(YYYYMMDD)을 확인해주세요',
  status: '임대 진행 상태(입주가능/문의중/계약진행중/입주중/퇴거예정)를 확인해주세요',
  is_exclusive: '전속중개 여부는 true/false 로 입력해주세요',
};
