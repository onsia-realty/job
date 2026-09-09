-- 038: stays 임대 진행 상태 + 중개사 법정표기 스냅샷, stay_owner_leads 매물 스펙 컨테이너
--
-- 목적:
--   1) stays.status — 임대 진행 5단계. is_active(게시 on/off) / is_approved(관리자 승인) 과 축이 다르다.
--      occupied/leaving 매물도 게시는 유지된다(퇴거예정 사전 노출이 이 사업모델의 핵심).
--   2) stays 중개사 법정표기 6항목 — 공인중개사법 제18조의2. 상세 화면의 담당 중개사 블록이 요구한다.
--      광고 게재의 법적 요건이라 이 컬럼들이 없으면 매물을 띄울 수 없다.
--   3) stay_owner_leads.detail — 소유주 랜딩(/stay/owner) 폼이 수집하는 매물 스펙 컨테이너.
--
-- 적용 순서: 035 → 036 → 037 → [038]
-- 적용 방법: Supabase Dashboard SQL Editor 수동 실행 (PostgREST 스키마 캐시는 자동 리로드)
--
-- ⚠️ 이 파일은 컬럼만 추가한다. RLS 정책과 인덱스는 건드리지 않는다.
--    - CREATE POLICY 는 IF NOT EXISTS 를 지원하지 않아 정책을 건드리는 순간 재실행 안전성이 깨진다.
--    - 036 의 "정책 0건" 은 서버 전용 잠금을 위한 의도된 설계다(036:59-65). 여기서도 추가하지 않는다.
--    - idx_stays_list(is_active, is_approved, created_at DESC) 도 그대로 둔다. 아래 1번 주석 참고.

-- ============================================================
-- 1. stays — 임대 진행 상태
--
--    기존 2-플래그와 이중 진실이 아니다. 축이 다르다:
--      is_approved : 관리자 승인      (service_role 만 변경)
--      is_active   : 게시 on/off      (등록자)
--      status      : 임대 진행 단계   (등록자)
--    노출 여부는 계속 is_active AND is_approved 가 결정한다. status 는 노출 조건이 아니다.
--    occupied(입주중) 매물도 게시는 유지되며, leaving(퇴거예정)을 미리 띄우는 것이 회전 모델의 핵심이다.
--    → 이 둘을 하나로 합치려 들지 말 것. 두 플래그로는 5단계를 표현할 수 없다.
-- ============================================================
ALTER TABLE stays
  ADD COLUMN IF NOT EXISTS status  varchar(20) NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'inquiring', 'contracting', 'occupied', 'leaving'));
    -- available:입주가능 / inquiring:문의중 / contracting:계약진행중 / occupied:입주중 / leaving:퇴거예정

-- ============================================================
-- 2. stays — 중개사 법정표기 스냅샷 (공인중개사법 제18조의2)
--
--    왜 조인이 아니라 비정규화인가:
--      users 의 RLS 는 본인 행 SELECT 뿐이고(001_initial_schema.sql:135),
--      company_profiles 도 동일하다(010_company_profiles.sql:27).
--      매물 상세는 anon(비로그인)이 읽으므로 조인하면 이 테이블들이 0행이라 법정표기가 통째로 빈다.
--      users 에 anon SELECT 를 여는 것은 di / business_no / phone 노출이라 선택지가 아니다.
--      법리적으로도 "광고 시점의 표기"가 그 광고의 책임 범위이므로 스냅샷이 오히려 정합적이다.
--
--    ⚠️ 중개보조원 성명 컬럼은 두지 않는다. 공인중개사법상 광고에 표기가 금지된 항목이라
--       담을 자리를 아예 만들지 않는 것이 안전하다.
--    ⚠️ agent_* 5개는 서버가 users / broker_offices 에서 읽어 채운다. 클라이언트 입력 금지.
--       POST·PATCH /api/stays 가 요청 본문에서 제거하고 서버 값으로 덮어쓴다
--       (types/stay.ts 의 StayServerControlledField 에 등재).
--    ⚠️ owner_type = 'owner'(임대인 직접등록) 이면 agent_* 는 전부 NULL 이다.
-- ============================================================
ALTER TABLE stays
  ADD COLUMN IF NOT EXISTS agent_office_name     varchar(200),  -- ① 중개사무소 명칭
  ADD COLUMN IF NOT EXISTS agent_office_address  text,          -- ② 소재지
  ADD COLUMN IF NOT EXISTS agent_phone           varchar(20),   -- ③ 연락처
  ADD COLUMN IF NOT EXISTS agent_reg_no          varchar(50),   -- ④ 개설등록번호 (11710-2022-00250)
  ADD COLUMN IF NOT EXISTS agent_representative  varchar(100),  -- ⑤ 대표자 성명
  ADD COLUMN IF NOT EXISTS is_exclusive          boolean NOT NULL DEFAULT false,  -- ⑥ 전속중개 여부(매물 단위 속성)
  ADD COLUMN IF NOT EXISTS broker_office_id      uuid,          -- 스냅샷 출처 (004 broker_offices.id)
  ADD COLUMN IF NOT EXISTS agent_snapshot_at     timestamptz;   -- 스냅샷 시각 (재동기화 판단용)

-- broker_offices 는 LOCALDATA 동기화 캐시라 재동기화로 행이 사라질 수 있다.
-- 출처가 사라져도 스냅샷은 남아야 하므로 ON DELETE SET NULL.
-- 제약 이름을 명시해 재실행 시 중복 추가를 건너뛸 수 있게 한다(ADD CONSTRAINT 에는 IF NOT EXISTS 가 없다).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stays_broker_office_id_fkey'
  ) THEN
    ALTER TABLE stays
      ADD CONSTRAINT stays_broker_office_id_fkey
      FOREIGN KEY (broker_office_id) REFERENCES broker_offices(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 3. stay_owner_leads — 매물 스펙 컨테이너
--
--    036 은 연락 목적의 얇은 리드 테이블이라 스펙 컬럼이 없다.
--    이 데이터는 "운영자가 검토해 stays 로 전환할 때 한 번 읽는" 쓰기 전용이고
--    리드 테이블 자체를 조건 검색하지 않으므로 개별 컬럼의 이점(인덱스·CHECK·타입안전)이 실현되지 않는다.
--    반면 랜딩 폼 문항은 운영 중 자주 바뀌는데 이 저장소는 마이그레이션 적용이
--    대시보드 수동 실행뿐이라 컬럼 추가 비용이 크다.
--    → JSONB. 009_add_dna_fields.sql:9,12 의 dna_scores / dna_answer_details 와 같은 성격이다.
--    검색 요구가 실제로 생기면 그때 GIN 인덱스를 별도 마이그레이션으로 추가한다(지금은 만들지 않는다).
-- ============================================================
ALTER TABLE stay_owner_leads
  ADD COLUMN IF NOT EXISTS detail          jsonb,               -- 매물 스펙 원본 (아래 키 규약)
  ADD COLUMN IF NOT EXISTS detail_version  smallint DEFAULT 1;  -- 랜딩 폼 스키마 버전

-- detail 키 규약 (v1) — 값이 없으면 키를 생략한다. 금액은 전부 원 단위 정수(시세 도메인의 만원과 다름).
--   stay_type            : 'officetel' | 'apartment' | 'office' | 'store' | 'villa'   (living_facility 는 v1 미취급)
--   deal_type            : 'short_term' | 'vacancy'
--   floor                : 정수 (층)
--   exclusive_area       : 실수 (전용면적 ㎡)
--   rooms / baths        : 정수
--   room_structure       : constants.ts STAY_ROOM_STRUCTURES 코드값
--   deposit_won          : 정수 (보증금)
--   monthly_fee_won      : 정수 (월 임대료)
--   maintenance_fee_won  : 정수 (관리비)
--   available_from       : 'YYYY-MM-DD'
--   amenities            : 문자열 배열 (constants.ts STAY_AMENITIES)
--   appliances           : 문자열 배열 (constants.ts STAY_APPLIANCES)
--   free_text            : 문자열 (기타 요청사항)
-- ※ 일/주 단가는 상품에 없으므로 키 자체를 두지 않는다.

-- ============================================================
-- 4. 스냅샷 일괄 재동기화 (수동 실행 — 사무소 정보만 바뀐 경우의 보정)
--
--    평상시에는 등록·수정 시 API(lib/stay/agent-snapshot.ts)가 자동으로 재동기화한다.
--    아래는 매물이 오래 수정되지 않은 채 사무소 정보만 바뀐 경우를 위한 것이다.
--    실행 전 SELECT 로 영향 행수를 먼저 확인할 것.
-- ============================================================
-- UPDATE stays s
--    SET agent_office_name    = COALESCE(NULLIF(b.med_office_nm, ''),     s.agent_office_name),
--        agent_office_address = COALESCE(NULLIF(b.lctn_road_nm_addr, ''), s.agent_office_address),
--        agent_phone          = COALESCE(NULLIF(b.tel_no, ''),            s.agent_phone),
--        agent_reg_no         = COALESCE(NULLIF(b.estbl_reg_no, ''),      s.agent_reg_no),
--        agent_representative = COALESCE(NULLIF(b.rprsv_nm, ''),          s.agent_representative),
--        agent_snapshot_at    = NOW()
--   FROM broker_offices b
--  WHERE s.broker_office_id = b.id
--    AND s.owner_type = 'agent';

-- ============================================================
-- 검증 쿼리 (수동 실행)
-- ============================================================
-- 1) 컬럼이 전부 생겼는지
-- SELECT column_name, data_type, is_nullable, column_default
--   FROM information_schema.columns
--  WHERE table_schema = 'public' AND table_name = 'stays'
--    AND column_name IN ('status','agent_office_name','agent_office_address','agent_phone',
--                        'agent_reg_no','agent_representative','is_exclusive',
--                        'broker_office_id','agent_snapshot_at')
--  ORDER BY ordinal_position;
-- → 9행. status/is_exclusive 는 is_nullable='NO' + default 있어야 함.
--
-- SELECT column_name, data_type FROM information_schema.columns
--  WHERE table_schema = 'public' AND table_name = 'stay_owner_leads'
--    AND column_name IN ('detail','detail_version');
-- → 2행 (jsonb, smallint)
--
-- 2) CHECK 제약 (status 5종) + FK
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
--  WHERE conrelid = 'stays'::regclass AND contype IN ('c','f') ORDER BY conname;
-- → stays_fee_required(035) + status CHECK + stays_broker_office_id_fkey 확인
--
-- 3) 정책·인덱스가 그대로인지 (이 파일은 아무것도 바꾸지 않아야 한다)
-- SELECT tablename, policyname, cmd FROM pg_policies
--  WHERE tablename IN ('stays','stay_owner_leads') ORDER BY tablename, policyname;
-- → stays 5건, stay_owner_leads 0건
-- SELECT indexname FROM pg_indexes WHERE tablename = 'stays' ORDER BY indexname;
-- → 035 의 7개 그대로 (idx_stays_list 포함, 신규 없음)
--
-- 4) 기존 행 백필 상태
-- SELECT status, is_exclusive, count(*) FROM stays GROUP BY 1,2 ORDER BY 1,2;
-- → 전 행 (available, false)
