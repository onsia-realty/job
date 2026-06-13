-- 028: 공동주택 관리비 (K-apt 공동주택관리정보시스템)
-- 출처: 국토부 공동주택관리비 정보제공서비스 (data.go.kr 1613000)
--   · 공용관리비 (getHsmpCmnuseManageCostInfo)
--   · 개별사용료 (getHsmpIndvdlUseFeeInfo)
--   · 장기수선충당금 (getHsmpLongTermResvInfo)
-- ⚠️ 관리비 API 키는 실거래가/건축물대장과 별도 활용신청 필요 (Day 0 액션)
--
-- 매핑: complexes ↔ K-apt kaptCode 는 1:1 이 아님(법정동코드+단지명 매칭).
--       complexes.kapt_code 컬럼에 백필 후 이 테이블과 연결.

-- 1) complexes 에 kaptCode 매핑 컬럼 추가
ALTER TABLE complexes ADD COLUMN IF NOT EXISTS kapt_code VARCHAR(20);  -- K-apt 단지코드 (예: A13816002)
CREATE INDEX IF NOT EXISTS idx_complexes_kapt ON complexes(kapt_code) WHERE kapt_code IS NOT NULL;

-- 2) 월별 관리비 캐시 테이블 (kapt_code × searchDate(YYYYMM) 단위)
CREATE TABLE IF NOT EXISTS apt_mgmt_costs (
  id BIGSERIAL PRIMARY KEY,

  kapt_code   VARCHAR(20) NOT NULL,   -- K-apt 단지코드
  search_date CHAR(6) NOT NULL,        -- 관리비 부과월 YYYYMM

  -- ── 공용관리비 (공용 부담, 세대 공통) — 단위 원 ──
  cmn_labor       BIGINT,   -- 인건비
  cmn_office       BIGINT,  -- 제사무비
  cmn_tax          BIGINT,  -- 제세공과금
  cmn_clothing     BIGINT,  -- 피복비
  cmn_education    BIGINT,  -- 교육훈련비
  cmn_vehicle      BIGINT,  -- 차량유지비
  cmn_etc          BIGINT,  -- 그밖의부대비용
  -- 청소/경비/소독/승강기/홈네트워크/수선/시설/안전/재해/위탁
  cmn_cleaning     BIGINT,  -- 청소비
  cmn_security     BIGINT,  -- 경비비
  cmn_disinfect    BIGINT,  -- 소독비
  cmn_elevator     BIGINT,  -- 승강기유지비
  cmn_network      BIGINT,  -- 지능형홈네트워크설비유지비
  cmn_repair       BIGINT,  -- 수선비
  cmn_facility     BIGINT,  -- 시설유지비
  cmn_safety       BIGINT,  -- 안전점검비
  cmn_disaster     BIGINT,  -- 재해예방비
  cmn_consign      BIGINT,  -- 위탁관리수수료
  cmn_total        BIGINT,  -- 공용관리비 합계

  -- ── 개별사용료 (세대 사용량 기반) — 단위 원 ──
  ind_heat         BIGINT,  -- 난방비
  ind_heat_public  BIGINT,  -- 공동난방비
  ind_hotwater     BIGINT,  -- 급탕비
  ind_gas          BIGINT,  -- 가스사용료
  ind_elec         BIGINT,  -- 전기료
  ind_elec_public  BIGINT,  -- 공동전기료
  ind_water        BIGINT,  -- 수도료
  ind_water_public BIGINT,  -- 공동수도료
  ind_waste        BIGINT,  -- 생활폐기물수수료
  ind_septic       BIGINT,  -- 정화조오물수수료
  ind_repr_council BIGINT,  -- 입주자대표회의운영비
  ind_insurance    BIGINT,  -- 건물보험료
  ind_election     BIGINT,  -- 선거관리위원회운영비
  ind_total        BIGINT,  -- 개별사용료 합계

  -- ── 장기수선충당금 ──
  ltr_reserve_month BIGINT,  -- 월 적립금
  ltr_reserve_sum   BIGINT,  -- 누적 적립금
  ltr_use           BIGINT,  -- 사용금액

  -- ── 합계/단가 ──
  total_cost       BIGINT,   -- 총 관리비 (공용+개별+장충 등)
  area_total       NUMERIC(14,2),  -- 관리대상 총면적(㎡) — 면적당 단가 계산용

  raw JSONB,                 -- API 원본 (typed 컬럼 보강 전 안전망)
  fetched_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (kapt_code, search_date)
);

CREATE INDEX IF NOT EXISTS idx_amc_kapt ON apt_mgmt_costs(kapt_code);
CREATE INDEX IF NOT EXISTS idx_amc_kapt_date ON apt_mgmt_costs(kapt_code, search_date DESC);

ALTER TABLE apt_mgmt_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view apt mgmt costs" ON apt_mgmt_costs
  FOR SELECT TO public
  USING (true);
-- INSERT/UPDATE는 service_role만 (cron + 백필 스크립트)

-- 검증
-- SELECT COUNT(*) FROM complexes WHERE kapt_code IS NOT NULL;
-- SELECT kapt_code, search_date, total_cost, cmn_total, ind_total FROM apt_mgmt_costs ORDER BY search_date DESC LIMIT 10;
