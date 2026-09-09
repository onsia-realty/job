/**
 * stays 개발용 샘플 매물 시드 (로컬 실행 전용)
 *
 * 삭제된 `src/data/staysSample.ts` 목데이터 12건의 역할을 실제 DB 행으로 대체한다.
 * 화면(목록/상세/필터/관리자 승인 플로우) 검증이 목적이다.
 *
 * ── 시드 행 식별 방법 ───────────────────────────────────────────────
 *   고정 UUID 프리픽스 `5eed0000-0000-4000-8000-0000000000NN` (NN = 01~12).
 *   아래 SEED_ROWS 의 id 12개가 전부이며, --clean 은 `.in('id', SEED_IDS)` 로
 *   이 12개 id 만 지운다. LIKE 패턴 매칭이나 다른 조건(user_id/title 등)은 쓰지 않으므로
 *   사용자가 나중에 등록할 진짜 매물은 어떤 경우에도 삭제 대상이 될 수 없다.
 *   stays 외 다른 테이블은 읽지도 쓰지도 않는다.
 *
 * 사용법:
 *   node scripts/seed-stays.mjs           # 기존 시드 12건 제거 후 재삽입 (재실행 안전)
 *   node scripts/seed-stays.mjs --clean   # 시드 12건만 삭제
 *
 * 주의:
 *   - 금액은 전부 원 단위(_won). 시세 도메인의 만원 단위와 다르다.
 *   - user_id 는 NULL (users 테이블을 건드리지 않기 위해). RLS 는 service_role 로 우회한다.
 *   - images 는 전부 빈 배열. `public/images/stay/` 에 자산이 0장이라 폴백을 태운다.
 *   - living_facility(생활숙박시설) 는 넣지 않는다 (기존 목데이터도 0건이었다).
 *   - lat/lng 는 각 행의 도로명주소를 NCP 네이버 지오코딩 API로 실제 조회한 값이다
 *     (geocode_source: 'naver'). 임의 추정값이 아니다.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── env 로드 (backfill-geocode.mjs 관행 동일) ──
function loadEnv() {
  const envPath = join(__dirname, '..', '.env.local');
  try {
    const content = readFileSync(envPath, 'utf-8');
    const env = {};
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  const missing = [
    !SUPABASE_URL && 'NEXT_PUBLIC_SUPABASE_URL',
    !SERVICE_KEY && 'SUPABASE_SERVICE_ROLE_KEY',
  ].filter(Boolean).join(', ');
  console.error(`[seed-stays] 필요한 환경변수가 없습니다: ${missing}`);
  console.error('[seed-stays] .env.local 또는 프로세스 환경에 설정한 뒤 다시 실행하세요.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── 시드 id 프리픽스 ──
const SEED_ID_PREFIX = '5eed0000-0000-4000-8000-0000000000';
const sid = (n) => SEED_ID_PREFIX + String(n).padStart(2, '0');

/** 중개사 등록 건에 공통으로 박는 법정표기 스냅샷 (038 — 공인중개사법 제18조의2) */
const AGENT = (office, addr, phone, regNo, rep) => ({
  agent_office_name: office,
  agent_office_address: addr,
  agent_phone: phone,
  agent_reg_no: regNo,
  agent_representative: rep,
  agent_snapshot_at: new Date().toISOString(),
});

const OWNER_AGENT_NULL = {
  agent_office_name: null,
  agent_office_address: null,
  agent_phone: null,
  agent_reg_no: null,
  agent_representative: null,
  broker_office_id: null,
  agent_snapshot_at: null,
};

/**
 * 샘플 12건.
 * deal_type  : short_term 8 / vacancy 4
 * stay_type  : officetel 4 / apartment 2 / villa 2 / office 2 / store 2 (living_facility 0)
 * status     : 5종 분산
 * owner_type : agent 8 / owner 4
 * is_approved: true 9 / false 3
 */
const SEED_ROWS = [
  {
    id: sid(1),
    stay_type: 'officetel',
    deal_type: 'short_term',
    title: '강남역 도보 3분 신축 오피스텔 단기임대',
    description: '강남역 2번 출구 도보 3분. 풀옵션 원룸형 오피스텔로 최소 1개월부터 입주 가능합니다. 출장·프로젝트 체류에 적합합니다.',
    address: '서울특별시 강남구 테헤란로 124',
    jibun_address: '서울특별시 강남구 역삼동 823-11',
    detail_address: '1204호',
    region: '서울', sigungu: '강남구', lawd_cd: '11680',
    lat: 37.4987952, lng: 127.0317205, geocode_source: 'naver',
    building_name: '강남센트럴타워', main_purps_cd_nm: '업무시설',
    total_floors: 22, elevator_cnt: 4, parking_total: 180,
    floor: 12, exclusive_area: 26.40, supply_area: 44.20,
    rooms: 1, baths: 1, room_structure: 'studio', max_guests: 2,
    deposit_won: 5000000, monthly_fee_won: 1200000, maintenance_fee_won: 120000,
    maintenance_included: false, utilities_included: false,
    min_stay_days: 30, max_stay_days: 365,
    available_from: '2026-09-15',
    amenities: ['wifi', 'aircon', 'heating', 'elevator', 'parking', 'security', 'cctv', 'bed', 'closet', 'kitchen', 'shower', 'nonsmoking'],
    appliances: ['refrigerator', 'washer', 'microwave', 'induction', 'tv', 'air_purifier'],
    parking_available: true, pets_allowed: false, smoking_allowed: false,
    contact_name: '김선우', phone: '02-555-1234', contact_hours: '평일 09:00~19:00',
    owner_type: 'agent', status: 'available', is_active: true, is_approved: true,
    is_exclusive: true,
    ...AGENT('온시아공인중개사사무소', '서울특별시 강남구 테헤란로 120, 3층', '02-555-1234', '11680-2023-00142', '김선우'),
  },
  {
    id: sid(2),
    stay_type: 'apartment',
    deal_type: 'short_term',
    title: '마포 공덕역 30평대 아파트 단기 3개월',
    description: '공덕역 초역세권 방3 아파트. 이사 대기·리모델링 기간 거주에 적합합니다. 가족 단위 입주 가능.',
    address: '서울특별시 마포구 백범로 200',
    jibun_address: '서울특별시 마포구 공덕동 476',
    detail_address: '103동 1502호',
    region: '서울', sigungu: '마포구', lawd_cd: '11440',
    lat: 37.5435269, lng: 126.9519475, geocode_source: 'naver',
    building_name: '공덕래미안', main_purps_cd_nm: '공동주택',
    total_floors: 25, elevator_cnt: 2, parking_total: 420,
    floor: 15, exclusive_area: 84.97, supply_area: 112.30,
    rooms: 3, baths: 2, room_structure: '3room', max_guests: 4,
    deposit_won: 30000000, monthly_fee_won: 2600000, maintenance_fee_won: 250000,
    maintenance_included: false, utilities_included: false,
    min_stay_days: 60, max_stay_days: 180,
    available_from: '2026-10-01',
    amenities: ['wifi', 'aircon', 'heating', 'elevator', 'parking', 'security', 'cctv', 'balcony', 'closet', 'kitchen', 'bathtub', 'veranda'],
    appliances: ['refrigerator', 'washer', 'dryer', 'microwave', 'gas_range', 'tv', 'dishwasher', 'water_purifier'],
    parking_available: true, pets_allowed: false, smoking_allowed: false,
    contact_name: '이정민', phone: '02-712-8800', contact_hours: '평일 10:00~18:00',
    owner_type: 'agent', status: 'inquiring', is_active: true, is_approved: true,
    is_exclusive: false,
    ...AGENT('공덕제일공인중개사사무소', '서울특별시 마포구 백범로 190, 1층', '02-712-8800', '11440-2021-00087', '이정민'),
  },
  {
    id: sid(3),
    stay_type: 'officetel',
    deal_type: 'short_term',
    title: '송파 문정지구 신축 오피스텔 월세',
    description: '법조타운 인접 신축 오피스텔. 무인 출입 시스템, 지하주차장 완비. 단기 체류 문의 환영합니다.',
    address: '서울특별시 송파구 법원로 128',
    jibun_address: '서울특별시 송파구 문정동 633',
    detail_address: '918호',
    region: '서울', sigungu: '송파구', lawd_cd: '11710',
    lat: 37.4868641, lng: 127.1204160, geocode_source: 'naver',
    building_name: '문정지식산업센터앤스퀘어', main_purps_cd_nm: '업무시설',
    total_floors: 15, elevator_cnt: 6, parking_total: 300,
    floor: 9, exclusive_area: 31.20, supply_area: 52.80,
    rooms: 1, baths: 1, room_structure: 'separated', max_guests: 2,
    deposit_won: 10000000, monthly_fee_won: 950000, maintenance_fee_won: 100000,
    maintenance_included: false, utilities_included: false,
    min_stay_days: 30, max_stay_days: 270,
    available_from: '2026-09-20',
    amenities: ['wifi', 'aircon', 'heating', 'elevator', 'parking', 'security', 'cctv', 'desk', 'bed', 'closet', 'shower', 'selfcheckin'],
    appliances: ['refrigerator', 'washer', 'microwave', 'induction', 'tv'],
    parking_available: true, pets_allowed: false, smoking_allowed: false,
    contact_name: '박현주', phone: '02-404-7788', contact_hours: '평일 09:30~18:30',
    owner_type: 'agent', status: 'available', is_active: true, is_approved: true,
    is_exclusive: false,
    ...AGENT('문정법조공인중개사사무소', '서울특별시 송파구 법원로 120, 2층', '02-404-7788', '11710-2022-00250', '박현주'),
  },
  {
    id: sid(4),
    stay_type: 'villa',
    deal_type: 'short_term',
    title: '서대문 연희동 조용한 빌라 투룸',
    description: '연희동 주택가 2룸 빌라. 남향 채광 좋고 반려동물 동반 가능합니다. 임대인 직접 등록 매물입니다.',
    address: '서울특별시 서대문구 연희로 232',
    jibun_address: '서울특별시 서대문구 연희동 188-45',
    detail_address: '301호',
    region: '서울', sigungu: '서대문구', lawd_cd: '11410',
    lat: 37.5777499, lng: 126.9355660, geocode_source: 'naver',
    building_name: '연희그린빌', main_purps_cd_nm: '공동주택',
    total_floors: 4, elevator_cnt: 0, parking_total: 4,
    floor: 3, exclusive_area: 49.50, supply_area: 59.80,
    rooms: 2, baths: 1, room_structure: '2room', max_guests: 3,
    deposit_won: 15000000, monthly_fee_won: 850000, maintenance_fee_won: 60000,
    maintenance_included: false, utilities_included: false,
    min_stay_days: 30, max_stay_days: 365,
    available_from: '2026-09-10',
    amenities: ['wifi', 'aircon', 'heating', 'balcony', 'closet', 'kitchen', 'shower', 'veranda', 'pet'],
    appliances: ['refrigerator', 'washer', 'gas_range', 'tv'],
    parking_available: true, pets_allowed: true, smoking_allowed: false,
    contact_name: '최영호', phone: '010-2233-4455', contact_hours: '평일·주말 10:00~20:00',
    owner_type: 'owner', status: 'available', is_active: true, is_approved: true,
    is_exclusive: false,
    ...OWNER_AGENT_NULL,
  },
  {
    id: sid(5),
    stay_type: 'office',
    deal_type: 'vacancy',
    title: '영등포 여의도 소형 사무실 공실 (12평)',
    description: '여의도역 도보 5분 오피스빌딩 공실. 인터넷·냉난방 기본 제공, 즉시 입주 가능합니다.',
    address: '서울특별시 영등포구 국제금융로 10',
    jibun_address: '서울특별시 영등포구 여의도동 23',
    detail_address: '805호',
    region: '서울', sigungu: '영등포구', lawd_cd: '11560',
    lat: 37.5255723, lng: 126.9266143, geocode_source: 'naver',
    building_name: '여의도파이낸스빌딩', main_purps_cd_nm: '업무시설',
    total_floors: 18, elevator_cnt: 5, parking_total: 220,
    floor: 8, exclusive_area: 39.60, supply_area: 66.10,
    rooms: 2, baths: 1, room_structure: '2room',
    deposit_won: 20000000, monthly_fee_won: 1800000, maintenance_fee_won: 330000,
    maintenance_included: false, utilities_included: false,
    available_from: '2026-09-08',
    amenities: ['wifi', 'aircon', 'heating', 'elevator', 'parking', 'security', 'cctv', 'desk', 'nonsmoking'],
    appliances: ['refrigerator', 'air_purifier', 'water_purifier'],
    parking_available: true, pets_allowed: false, smoking_allowed: false,
    contact_name: '정다은', phone: '02-782-3300', contact_hours: '평일 09:00~18:00',
    owner_type: 'agent', status: 'available', is_active: true, is_approved: true,
    is_exclusive: false,
    ...AGENT('여의도금융공인중개사사무소', '서울특별시 영등포구 국제금융로 8, 105호', '02-782-3300', '11560-2020-00311', '정다은'),
  },
  {
    id: sid(6),
    stay_type: 'store',
    deal_type: 'vacancy',
    title: '성남 분당 정자역 1층 상가 공실',
    description: '정자역 카페거리 초입 1층 코너 상가. 전면 노출 우수, 업종 제한 적음. 권리금 없습니다.',
    address: '경기도 성남시 분당구 정자일로 121',
    jibun_address: '경기도 성남시 분당구 정자동 178-1',
    detail_address: '101호',
    region: '경기', sigungu: '성남시 분당구', lawd_cd: '41135',
    lat: 37.3611713, lng: 127.1052642, geocode_source: 'naver',
    building_name: '정자로얄프라자', main_purps_cd_nm: '근린생활시설',
    total_floors: 7, elevator_cnt: 2, parking_total: 45,
    floor: 1, exclusive_area: 56.20, supply_area: 82.40,
    baths: 1,
    deposit_won: 50000000, monthly_fee_won: 3800000, maintenance_fee_won: 400000,
    maintenance_included: false, utilities_included: false,
    available_from: '2026-10-15',
    amenities: ['aircon', 'heating', 'parking', 'cctv', 'nonsmoking'],
    appliances: ['sink'],
    parking_available: true, pets_allowed: false, smoking_allowed: false,
    contact_name: '한지훈', phone: '031-715-2200', contact_hours: '평일 09:00~19:00',
    owner_type: 'agent', status: 'contracting', is_active: true, is_approved: true,
    is_exclusive: true,
    ...AGENT('정자역대박공인중개사사무소', '경기도 성남시 분당구 정자일로 115, 1층', '031-715-2200', '41135-2019-00098', '한지훈'),
  },
  {
    id: sid(7),
    stay_type: 'officetel',
    deal_type: 'short_term',
    title: '수원 광교 오피스텔 주단위 임대',
    description: '광교중앙역 인근 풀옵션 오피스텔. 주 단위 계약 가능해 단기 출장에 적합합니다.',
    address: '경기도 수원시 영통구 광교중앙로 140',
    jibun_address: '경기도 수원시 영통구 이의동 1268',
    detail_address: '1507호',
    region: '경기', sigungu: '수원시 영통구', lawd_cd: '41117',
    lat: 37.2858776, lng: 127.0593276, geocode_source: 'naver',
    building_name: '광교센트럴시티', main_purps_cd_nm: '업무시설',
    total_floors: 20, elevator_cnt: 4, parking_total: 260,
    floor: 15, exclusive_area: 23.80, supply_area: 41.50,
    rooms: 1, baths: 1, room_structure: 'studio', max_guests: 2,
    deposit_won: 3000000, weekly_fee_won: 350000, monthly_fee_won: 1100000, maintenance_fee_won: 90000,
    maintenance_included: false, utilities_included: true,
    min_stay_days: 7, max_stay_days: 180,
    available_from: '2026-09-12',
    amenities: ['wifi', 'aircon', 'heating', 'elevator', 'parking', 'security', 'cctv', 'bed', 'closet', 'kitchen', 'shower', 'selfcheckin'],
    appliances: ['refrigerator', 'washer', 'microwave', 'induction', 'tv'],
    parking_available: true, pets_allowed: false, smoking_allowed: false,
    contact_name: '오세라', phone: '031-217-6600', contact_hours: '평일 09:00~18:00',
    owner_type: 'agent', status: 'occupied', is_active: true, is_approved: true,
    is_exclusive: false,
    ...AGENT('광교중앙공인중개사사무소', '경기도 수원시 영통구 광교중앙로 130, 2층', '031-217-6600', '41117-2022-00456', '오세라'),
  },
  {
    id: sid(8),
    stay_type: 'apartment',
    deal_type: 'short_term',
    title: '고양 일산 호수공원 앞 아파트 퇴거예정',
    description: '호수공원 조망 아파트. 현 세입자 11월 말 퇴거 예정으로 사전 문의 받습니다.',
    address: '경기도 고양시 일산동구 호수로 595',
    jibun_address: '경기도 고양시 일산동구 장항동 875',
    detail_address: '204동 903호',
    region: '경기', sigungu: '고양시 일산동구', lawd_cd: '41285',
    lat: 37.6538411, lng: 126.7688038, geocode_source: 'naver',
    building_name: '일산호수마을', main_purps_cd_nm: '공동주택',
    total_floors: 20, elevator_cnt: 2, parking_total: 380,
    floor: 9, exclusive_area: 59.80, supply_area: 79.30,
    rooms: 2, baths: 1, room_structure: '2room', max_guests: 3,
    deposit_won: 20000000, monthly_fee_won: 1400000, maintenance_fee_won: 180000,
    maintenance_included: false, utilities_included: false,
    min_stay_days: 60, max_stay_days: 365,
    available_from: '2026-12-01',
    amenities: ['wifi', 'aircon', 'heating', 'elevator', 'parking', 'security', 'balcony', 'closet', 'kitchen', 'veranda'],
    appliances: ['refrigerator', 'washer', 'gas_range', 'tv', 'water_purifier'],
    parking_available: true, pets_allowed: false, smoking_allowed: false,
    contact_name: '서민아', phone: '010-8877-1122', contact_hours: '평일 11:00~20:00',
    owner_type: 'owner', status: 'leaving', is_active: true, is_approved: true,
    is_exclusive: false,
    ...OWNER_AGENT_NULL,
  },
  {
    id: sid(9),
    stay_type: 'office',
    deal_type: 'vacancy',
    title: '부천 중동 지식산업센터 사무실 공실',
    description: '중동역 인근 지식산업센터 사무실. 주차 여유롭고 대중교통 접근성 좋습니다.',
    address: '경기도 부천시 길주로 272',
    jibun_address: '경기도 부천시 중동 1156',
    detail_address: '612호',
    region: '경기', sigungu: '부천시', lawd_cd: '41190',
    lat: 37.5029375, lng: 126.7725168, geocode_source: 'naver',
    building_name: '부천테크노타워', main_purps_cd_nm: '공장',
    total_floors: 12, elevator_cnt: 3, parking_total: 150,
    floor: 6, exclusive_area: 72.40, supply_area: 118.60,
    rooms: 3, baths: 1, room_structure: '3room',
    deposit_won: 15000000, monthly_fee_won: 1300000, maintenance_fee_won: 220000,
    maintenance_included: false, utilities_included: false,
    available_from: '2026-09-25',
    amenities: ['wifi', 'aircon', 'heating', 'elevator', 'parking', 'security', 'cctv', 'desk', 'nonsmoking'],
    appliances: ['refrigerator', 'air_purifier'],
    parking_available: true, pets_allowed: false, smoking_allowed: false,
    contact_name: '류경식', phone: '032-322-9900', contact_hours: '평일 09:00~18:00',
    owner_type: 'agent', status: 'inquiring', is_active: true, is_approved: true,
    is_exclusive: false,
    ...AGENT('중동테크노공인중개사사무소', '경기도 부천시 길주로 260, 103호', '032-322-9900', '41190-2021-00173', '류경식'),
  },
  // ── 아래 3건은 is_approved = false (관리자 승인 대기 / 404 게이트 검증용) ──
  {
    id: sid(10),
    stay_type: 'officetel',
    deal_type: 'short_term',
    title: '[승인대기] 용인 수지 오피스텔 단기임대',
    description: '수지구청역 도보 7분 오피스텔. 관리자 승인 대기 상태의 시드 매물입니다.',
    address: '경기도 용인시 수지구 포은대로 435',
    jibun_address: '경기도 용인시 수지구 풍덕천동 1005',
    detail_address: '706호',
    region: '경기', sigungu: '용인시 수지구', lawd_cd: '41465',
    lat: 37.3222422, lng: 127.0977799, geocode_source: 'naver',
    building_name: '수지리치타워', main_purps_cd_nm: '업무시설',
    total_floors: 14, elevator_cnt: 3, parking_total: 120,
    floor: 7, exclusive_area: 28.90, supply_area: 47.20,
    rooms: 1, baths: 1, room_structure: 'separated', max_guests: 2,
    deposit_won: 5000000, monthly_fee_won: 780000, maintenance_fee_won: 80000,
    maintenance_included: false, utilities_included: false,
    min_stay_days: 30, max_stay_days: 180,
    available_from: '2026-10-05',
    amenities: ['wifi', 'aircon', 'heating', 'elevator', 'parking', 'cctv', 'bed', 'closet', 'kitchen', 'shower'],
    appliances: ['refrigerator', 'washer', 'microwave', 'induction'],
    parking_available: true, pets_allowed: false, smoking_allowed: false,
    contact_name: '남기웅', phone: '031-263-4400', contact_hours: '평일 09:30~18:30',
    owner_type: 'agent', status: 'available', is_active: true, is_approved: false,
    is_exclusive: false,
    ...AGENT('수지포은공인중개사사무소', '경기도 용인시 수지구 포은대로 430, 2층', '031-263-4400', '41465-2023-00062', '남기웅'),
  },
  {
    id: sid(11),
    stay_type: 'villa',
    deal_type: 'short_term',
    title: '[승인대기] 광명 철산동 빌라 원룸 단기',
    description: '철산역 도보 10분 원룸. 임대인 직접 등록, 관리자 승인 대기 중인 시드 매물입니다.',
    address: '경기도 광명시 철산로 30',
    jibun_address: '경기도 광명시 철산동 231-7',
    detail_address: '202호',
    region: '경기', sigungu: '광명시', lawd_cd: '41210',
    lat: 37.4761185, lng: 126.8693078, geocode_source: 'naver',
    building_name: '철산하이빌', main_purps_cd_nm: '공동주택',
    total_floors: 5, elevator_cnt: 1, parking_total: 6,
    floor: 2, exclusive_area: 33.10, supply_area: 41.90,
    rooms: 1, baths: 1, room_structure: '1room', max_guests: 2,
    deposit_won: 5000000, monthly_fee_won: 600000, maintenance_fee_won: 50000,
    maintenance_included: true, utilities_included: false,
    min_stay_days: 30, max_stay_days: 240,
    available_from: '2026-09-18',
    amenities: ['wifi', 'aircon', 'heating', 'elevator', 'closet', 'kitchen', 'shower'],
    appliances: ['refrigerator', 'washer', 'gas_range'],
    parking_available: false, pets_allowed: false, smoking_allowed: false,
    contact_name: '조은비', phone: '010-5566-7788', contact_hours: '평일·주말 09:00~21:00',
    owner_type: 'owner', status: 'available', is_active: true, is_approved: false,
    is_exclusive: false,
    ...OWNER_AGENT_NULL,
  },
  {
    id: sid(12),
    stay_type: 'store',
    deal_type: 'vacancy',
    title: '[승인대기] 안양 평촌 2층 상가 공실',
    description: '평촌역 학원가 2층 상가. 임대인 직접 등록, 관리자 승인 대기 중인 시드 매물입니다.',
    address: '경기도 안양시 동안구 시민대로 180',
    jibun_address: '경기도 안양시 동안구 호계동 1039',
    detail_address: '201호',
    region: '경기', sigungu: '안양시 동안구', lawd_cd: '41173',
    lat: 37.3900085, lng: 126.9504445, geocode_source: 'naver',
    building_name: '평촌학원타워', main_purps_cd_nm: '근린생활시설',
    total_floors: 8, elevator_cnt: 2, parking_total: 60,
    floor: 2, exclusive_area: 99.20, supply_area: 148.50,
    baths: 2,
    deposit_won: 30000000, monthly_fee_won: 2400000, maintenance_fee_won: 300000,
    maintenance_included: false, utilities_included: false,
    available_from: '2026-11-01',
    amenities: ['aircon', 'heating', 'elevator', 'parking', 'cctv', 'nonsmoking'],
    appliances: ['sink', 'air_purifier'],
    parking_available: true, pets_allowed: false, smoking_allowed: false,
    contact_name: '윤태석', phone: '010-3344-5566', contact_hours: '평일 10:00~19:00',
    owner_type: 'owner', status: 'occupied', is_active: true, is_approved: false,
    is_exclusive: false,
    ...OWNER_AGENT_NULL,
  },
];

const SEED_IDS = SEED_ROWS.map((r) => r.id);

/** 공통 기본값 — 명시하지 않은 컬럼을 안전한 값으로 채운다. */
function withDefaults(row) {
  return {
    user_id: null,
    source: 'self',
    views: 0,
    thumbnail: null,
    images: [],           // public/images/stay/ 에 자산 0장 → 폴백 유도
    kakao_url: null,
    building_verified: false,
    broker_office_id: null,
    ...row,
  };
}

/** 현재 DB 에 남아 있는 시드 행 수 (id 화이트리스트로만 셈) */
async function countSeedRows() {
  const { count, error } = await supabase
    .from('stays')
    .select('id', { count: 'exact', head: true })
    .in('id', SEED_IDS);
  if (error) throw error;
  return count ?? 0;
}

/** 시드 행 삭제 — 조건은 오직 `id IN (12개)`. 다른 행은 대상이 될 수 없다. */
async function cleanSeedRows({ announce }) {
  const before = await countSeedRows();
  if (announce) {
    console.log(`[seed-stays] 삭제 대상 시드 행: ${before}건 (id 프리픽스 ${SEED_ID_PREFIX}*)`);
  }
  if (before === 0) {
    if (announce) console.log('[seed-stays] 지울 시드 행이 없습니다.');
    return 0;
  }
  const { error } = await supabase.from('stays').delete().in('id', SEED_IDS);
  if (error) throw error;
  const after = await countSeedRows();
  if (after !== 0) {
    throw new Error(`삭제 후에도 시드 행 ${after}건이 남아 있습니다.`);
  }
  return before;
}

async function main() {
  const args = process.argv.slice(2);
  const isClean = args.includes('--clean');

  const { count: totalBefore } = await supabase
    .from('stays')
    .select('id', { count: 'exact', head: true });

  if (isClean) {
    const removed = await cleanSeedRows({ announce: true });
    const { count: totalAfter } = await supabase
      .from('stays')
      .select('id', { count: 'exact', head: true });
    console.log(`[seed-stays] 삭제 완료: ${removed}건`);
    console.log(`[seed-stays] 잔여 시드 행: 0건 / stays 전체: ${totalAfter ?? 0}건 (시드 아닌 행은 그대로)`);
    return;
  }

  // 재실행 안전: 기존 시드 행만 먼저 제거하고 다시 넣는다.
  const removed = await cleanSeedRows({ announce: false });
  if (removed > 0) console.log(`[seed-stays] 기존 시드 행 ${removed}건 제거 후 재삽입합니다.`);

  const rows = SEED_ROWS.map(withDefaults);
  const { data, error } = await supabase.from('stays').insert(rows).select('id, is_approved');
  if (error) {
    console.error(`[seed-stays] 삽입 실패: ${error.message}`);
    if (error.details) console.error(`[seed-stays] details: ${error.details}`);
    process.exit(1);
  }

  const approved = data.filter((r) => r.is_approved).length;
  const { count: totalAfter } = await supabase
    .from('stays')
    .select('id', { count: 'exact', head: true });

  console.log(`[seed-stays] 삽입 완료: ${data.length}건 (승인 ${approved} / 미승인 ${data.length - approved})`);
  console.log(`[seed-stays] stays 전체: ${totalBefore ?? 0}건 → ${totalAfter ?? 0}건`);
  console.log(`[seed-stays] 시드 식별: id 프리픽스 ${SEED_ID_PREFIX}01~12`);
  console.log('[seed-stays] 삭제하려면: node scripts/seed-stays.mjs --clean');
}

main().catch((err) => {
  console.error(`[seed-stays] 오류: ${err?.message ?? err}`);
  process.exit(1);
});
