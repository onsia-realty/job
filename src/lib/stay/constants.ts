// 단기임대/공실임대(stays) 코드 ↔ 한글 라벨 단일 출처
//
// ⚠️ 값은 supabase/migrations/035_stays.sql 의 CHECK 제약과 정확히 일치해야 한다.
//    - stay_type   : 035:23
//    - deal_type   : 035:24
//    - owner_type  : 035:96
//    - source      : 035:97
//    room_structure(035:59) / amenities(035:78) / appliances(035:79) 는 DB CHECK 가 없는
//    자유 컬럼이지만, 애플리케이션 레벨에서 이 목록으로 화이트리스트한다.
//    (035 주석의 예시값 'studio' | 'separated' | '1room', 'wifi'/'aircon'/'washer' 를 기준으로 확장)

// ---------- 숙소 유형 (035 CHECK) ----------
export const STAY_TYPES = ['officetel', 'apartment', 'living_facility', 'office', 'store', 'villa'] as const;
export type StayType = (typeof STAY_TYPES)[number];

export const STAY_TYPE_LABELS: Record<StayType, string> = {
  officetel: '오피스텔',
  apartment: '아파트',
  living_facility: '생활숙박시설',
  office: '사무실',
  store: '상가',
  villa: '빌라/다세대',
};

// ---------- 거래 유형 (035 CHECK) ----------
export const STAY_DEAL_TYPES = ['short_term', 'vacancy'] as const;
export type StayDealType = (typeof STAY_DEAL_TYPES)[number];

export const STAY_DEAL_TYPE_LABELS: Record<StayDealType, string> = {
  short_term: '단기임대',
  vacancy: '공실임대',
};

// ---------- 등록 주체 (035 CHECK) ----------
export const STAY_OWNER_TYPES = ['agent', 'owner'] as const;
export type StayOwnerType = (typeof STAY_OWNER_TYPES)[number];

export const STAY_OWNER_TYPE_LABELS: Record<StayOwnerType, string> = {
  agent: '중개사',
  owner: '임대인',
};

// ---------- 임대 진행 상태 (038 CHECK) ----------
// 038 stays.status 와 1:1. is_active/is_approved(노출 여부)와 축이 다름 — 임대 진행 단계.
export const STAY_STATUSES = ['available', 'inquiring', 'contracting', 'occupied', 'leaving'] as const;
export type StayStatus = (typeof STAY_STATUSES)[number];

export const STAY_STATUS_LABELS: Record<StayStatus, string> = {
  available: '입주가능',
  inquiring: '문의중',
  contracting: '계약진행중',
  occupied: '입주중',
  leaving: '퇴거예정',
};

// ---------- 유입 경로 (035 CHECK) — 서버 강제 필드 ----------
export const STAY_SOURCES = ['self', 'owner_lead'] as const;
export type StaySource = (typeof STAY_SOURCES)[number];

export const STAY_SOURCE_LABELS: Record<StaySource, string> = {
  self: '직접등록',
  owner_lead: '집주인접수',
};

// ---------- 방 구조 (DB CHECK 없음 · 앱 화이트리스트) ----------
export const STAY_ROOM_STRUCTURES = ['studio', 'separated', '1room', '2room', '3room', 'duplex'] as const;
export type StayRoomStructure = (typeof STAY_ROOM_STRUCTURES)[number];

export const STAY_ROOM_STRUCTURE_LABELS: Record<StayRoomStructure, string> = {
  studio: '오픈형 원룸',
  separated: '분리형 원룸',
  '1room': '1룸',
  '2room': '2룸',
  '3room': '3룸 이상',
  duplex: '복층',
};

// ---------- 어메니티 (DB CHECK 없음 · GIN 인덱스 대상, 035:78/129) ----------
export const STAY_AMENITIES = [
  'wifi',
  'aircon',
  'heating',
  'elevator',
  'parking',
  'security',
  'cctv',
  'balcony',
  'desk',
  'bed',
  'closet',
  'kitchen',
  'bathtub',
  'shower',
  'veranda',
  'pet',
  'nonsmoking',
  'selfcheckin',
] as const;
export type StayAmenity = (typeof STAY_AMENITIES)[number];

export const STAY_AMENITY_LABELS: Record<StayAmenity, string> = {
  wifi: '와이파이',
  aircon: '에어컨',
  heating: '난방',
  elevator: '엘리베이터',
  parking: '주차',
  security: '보안/경비',
  cctv: 'CCTV',
  balcony: '발코니',
  desk: '책상',
  bed: '침대',
  closet: '옷장',
  kitchen: '주방',
  bathtub: '욕조',
  shower: '샤워부스',
  veranda: '베란다',
  pet: '반려동물 가능',
  nonsmoking: '금연',
  // '셀프 체크인' 은 숙박업 어휘라 임대차 상품에 부적절하다. 코드값은 유지하고 라벨만 교체.
  selfcheckin: '무인 출입',
};

// ---------- 가전/비품 (DB CHECK 없음, 035:79) ----------
export const STAY_APPLIANCES = [
  'refrigerator',
  'washer',
  'dryer',
  'microwave',
  'induction',
  'gas_range',
  'tv',
  'air_purifier',
  'dishwasher',
  'water_purifier',
  'bidet',
  'sink',
] as const;
export type StayAppliance = (typeof STAY_APPLIANCES)[number];

export const STAY_APPLIANCE_LABELS: Record<StayAppliance, string> = {
  refrigerator: '냉장고',
  washer: '세탁기',
  dryer: '건조기',
  microwave: '전자레인지',
  induction: '인덕션',
  gas_range: '가스레인지',
  tv: 'TV',
  air_purifier: '공기청정기',
  dishwasher: '식기세척기',
  water_purifier: '정수기',
  bidet: '비데',
  sink: '싱크대',
};

// ---------- 지오코딩 출처 (035:41, DB CHECK 없음 → VARCHAR(20) 길이만 지키면 된다) ----------
// vworld_* 2종은 `lib/market/complexes.ts:13` 의 GeocodeSource 가 실제로 내보내는 값이다.
// `api/stays/lookup-building` 이 네이버 실패 시 VWorld 로 폴백하므로 여기서 받지 않으면
// 정상 좌표를 얻고도 Zod 400 이 난다. 도로명/지번은 정확도가 달라 출처 구분에 실익이 있어
// 하나로 뭉개지 않는다. ('kakao' 는 현재 아무 코드도 생산하지 않지만 기존 데이터 호환으로 남긴다)
export const STAY_GEOCODE_SOURCES = ['naver', 'kakao', 'manual', 'vworld_road', 'vworld_parcel'] as const;
export type StayGeocodeSource = (typeof STAY_GEOCODE_SOURCES)[number];

// ---------- 목록 정렬 옵션 (API 전용) ----------
export const STAY_SORT_OPTIONS = ['latest', 'views', 'daily_fee_asc', 'daily_fee_desc', 'monthly_fee_asc', 'monthly_fee_desc'] as const;
export type StaySortOption = (typeof STAY_SORT_OPTIONS)[number];

// ---------- 목록 페이지네이션 한도 ----------
// PostgREST 기본 1000행 캡 회피를 위해 항상 명시적 limit 을 건다.
export const STAY_LIST_DEFAULT_LIMIT = 20;
export const STAY_LIST_MAX_LIMIT = 100;

// Supabase .in() 은 URL 길이 한도 때문에 값 30개 초과 시 안전하지 않다.
// (메모리: feedback_supabase_in_query_chunk)
export const STAY_IN_FILTER_MAX_VALUES = 30;

// 이미지 배열 상한 (035 는 제약 없음 — 앱 레벨 정책)
export const STAY_IMAGES_MAX = 20;
