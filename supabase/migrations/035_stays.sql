-- 035: 단기임대/공실임대 매물 테이블 (stays)
--
-- 목적: 구인공고(jobs)와 별개의 신규 도메인. 오피스텔/아파트/생활숙박시설 등의
--       단기임대(short_term) 및 공실임대(vacancy) 매물을 등록·노출한다.
--       jobs에 컬럼을 추가하지 않고 독립 테이블로 신설한다.
--
-- 적용 순서: 035 → 036 → 037 (036이 stays(id)를 FK로 참조하므로 반드시 035 먼저)
-- 적용 방법: Supabase SQL Editor에 파일 전체를 붙여넣고 실행 (수동 적용 전제)
--
-- 금액 규약: 모든 금액 컬럼은 "원 단위"이며 컬럼명에 _won 접미사를 붙인다.
--            시세 도메인(price_transactions 등)은 만원 단위이므로 혼동 방지가 목적이다.
--
-- 건물 정보: 021_building_ledgers.sql 의 building_ledgers 캐시를 pnu / mgm_bldrgst_pk 로
--            조인해 재사용한다. building_ledgers 는 수정하지 않는다.

-- ============================================================
-- 1. stays 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS stays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 분류
  stay_type VARCHAR(20) NOT NULL CHECK (stay_type IN ('officetel', 'apartment', 'living_facility', 'office', 'store', 'villa')),
  deal_type VARCHAR(20) NOT NULL CHECK (deal_type IN ('short_term', 'vacancy')),  -- 단기임대 / 공실임대

  -- 기본 정보
  title VARCHAR(200) NOT NULL,
  description TEXT,

  -- 위치
  address TEXT,                          -- 도로명주소
  jibun_address TEXT,                    -- 지번주소
  detail_address VARCHAR(200),           -- 동/호 등 상세
  region VARCHAR(50),                    -- 시도 (jobs.region 관행과 동일)
  sigungu VARCHAR(50),
  lawd_cd CHAR(5),                       -- 법정동코드 앞 5자리 (시군구) — 025_jobs_lawd_cd 관행
  bcode CHAR(10),                        -- 법정동코드 10자리
  pnu VARCHAR(19),                       -- 고유지번번호 19자리 (building_ledgers.pnu 와 조인)
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  geocode_source VARCHAR(20),            -- 'naver' | 'kakao' | 'manual' 등

  -- 건물 (building_ledgers 캐시에서 채움)
  mgm_bldrgst_pk VARCHAR(50),            -- 건축물대장 관리번호
  building_name VARCHAR(200),
  main_purps_cd_nm VARCHAR(100),         -- 주용도명
  use_apr_day CHAR(8),                   -- 사용승인일 YYYYMMDD
  total_floors INTEGER,
  elevator_cnt INTEGER,
  parking_total INTEGER,
  building_verified BOOLEAN DEFAULT false,  -- 건축물대장 대조 완료 여부

  -- 호실
  floor INTEGER,
  exclusive_area NUMERIC(8,2),           -- 전용면적 (㎡)
  supply_area NUMERIC(8,2),              -- 공급면적 (㎡)
  rooms SMALLINT,
  baths SMALLINT,
  room_structure VARCHAR(20),            -- 'studio' | 'separated' | '1room' 등
  max_guests SMALLINT,

  -- 요금 (전부 원 단위)
  deposit_won INTEGER,
  daily_fee_won INTEGER,
  weekly_fee_won INTEGER,
  monthly_fee_won INTEGER,
  maintenance_fee_won INTEGER,
  maintenance_included BOOLEAN DEFAULT false,
  utilities_included BOOLEAN DEFAULT false,

  -- 기간
  min_stay_days INTEGER,
  max_stay_days INTEGER,
  available_from DATE,
  available_to DATE,

  -- 옵션
  amenities TEXT[] DEFAULT '{}',         -- ['wifi', 'aircon', 'washer', ...]
  appliances TEXT[] DEFAULT '{}',
  parking_available BOOLEAN DEFAULT false,
  pets_allowed BOOLEAN DEFAULT false,
  smoking_allowed BOOLEAN DEFAULT false,

  -- 미디어
  thumbnail TEXT,
  images TEXT[] DEFAULT '{}',            -- 배열 순서 = 갤러리 노출 순서

  -- 연락처
  contact_name VARCHAR(50),
  phone VARCHAR(20),
  kakao_url TEXT,
  contact_hours VARCHAR(100),

  -- 메타
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  owner_type VARCHAR(20) DEFAULT 'agent' CHECK (owner_type IN ('agent', 'owner')),
  source VARCHAR(20) DEFAULT 'self' CHECK (source IN ('self', 'owner_lead')),
  lead_id BIGINT,                        -- stay_owner_leads.id (036에서 생성 — 순환참조 방지로 FK 미설정)
  views INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,     -- 관리자 승인 (service_role로만 변경)

  -- 타임스탬프 (001_initial_schema.sql 관행 동일)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

  -- 요금 중 최소 하나는 반드시 있어야 노출 가능
  CONSTRAINT stays_fee_required CHECK (
    daily_fee_won IS NOT NULL OR weekly_fee_won IS NOT NULL OR monthly_fee_won IS NOT NULL
  )
);

-- ============================================================
-- 2. 인덱스
-- ============================================================
-- 목록 기본 정렬 (공개 목록: is_active AND is_approved, 최신순)
CREATE INDEX IF NOT EXISTS idx_stays_list ON stays(is_active, is_approved, created_at DESC);

-- 지역 필터
CREATE INDEX IF NOT EXISTS idx_stays_lawd_cd ON stays(lawd_cd) WHERE lawd_cd IS NOT NULL;

-- 향후 지도/bounds 조회 대비
CREATE INDEX IF NOT EXISTS idx_stays_latlng ON stays(lat, lng) WHERE lat IS NOT NULL;

-- 분류 필터
CREATE INDEX IF NOT EXISTS idx_stays_deal_stay_type ON stays(deal_type, stay_type);

-- 옵션 다중 필터 (amenities @> ARRAY[...])
CREATE INDEX IF NOT EXISTS idx_stays_amenities ON stays USING GIN (amenities);

-- building_ledgers 조인
CREATE INDEX IF NOT EXISTS idx_stays_pnu ON stays(pnu);

-- 내 매물 조회
CREATE INDEX IF NOT EXISTS idx_stays_user_id ON stays(user_id);

-- ============================================================
-- 3. updated_at 자동 갱신
--    001_initial_schema.sql 에서 정의된 update_updated_at_column() 재사용
-- ============================================================
DROP TRIGGER IF EXISTS update_stays_updated_at ON stays;
CREATE TRIGGER update_stays_updated_at
  BEFORE UPDATE ON stays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. RLS
--    관리자 승인(is_approved)은 service_role(API 라우트)로만 처리한다.
--    → 관리자용 정책은 만들지 않는다.
-- ============================================================
ALTER TABLE stays ENABLE ROW LEVEL SECURITY;

-- 공개: 활성 + 승인된 매물만
CREATE POLICY "Anyone can view active stays" ON stays
  FOR SELECT TO public
  USING (is_active = true AND is_approved = true);

-- 본인 매물은 심사중(is_approved = false)에도 조회 가능
CREATE POLICY "Users can view own stays" ON stays
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own stays" ON stays
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stays" ON stays
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stays" ON stays
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 검증 쿼리 (수동 실행)
-- ============================================================
-- SELECT tablename, policyname, cmd, roles, qual, with_check FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'stays'
-- ORDER BY cmd, policyname;
--
-- SELECT indexname, indexdef FROM pg_indexes
-- WHERE schemaname = 'public' AND tablename = 'stays' ORDER BY indexname;
--
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conrelid = 'stays'::regclass ORDER BY conname;
--
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'stays'::regclass AND NOT tgisinternal;
