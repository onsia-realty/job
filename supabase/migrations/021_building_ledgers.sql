-- 021: 건축물대장 캐시 테이블 (국토부 getBrTitleInfo 등)
-- ⚠️ 건축물대장 API 키는 실거래가와 별도 신청 필요 (Day 0 액션)

CREATE TABLE IF NOT EXISTS building_ledgers (
  id BIGSERIAL PRIMARY KEY,

  -- 식별자
  pnu VARCHAR(19) UNIQUE,              -- 고유지번번호 19자리 (시군구5+법정동5+산1+본번4+부번4)
  mgm_bldrgst_pk VARCHAR(50),          -- 건축물대장 관리번호

  -- 주소·위치
  sigungu_cd CHAR(5),
  bjdong_cd VARCHAR(10),                -- 법정동코드
  plat_plc TEXT,                        -- 대지위치
  new_plat_plc TEXT,                    -- 도로명대지위치
  bld_nm TEXT,                          -- 건물명
  dong_nm TEXT,                         -- 동명

  -- 용도·규모
  main_purps_cd_nm VARCHAR(100),        -- 주용도명 (공동주택/업무시설/근린생활시설 등)
  etc_purps TEXT,                       -- 기타용도
  main_atch_gb_cd_nm VARCHAR(50),       -- 주부속구분

  -- 면적
  plat_area NUMERIC(14,2),              -- 대지면적
  arch_area NUMERIC(14,2),              -- 건축면적
  tot_area NUMERIC(14,2),               -- 연면적
  bc_rat NUMERIC(6,2),                  -- 건폐율
  vl_rat NUMERIC(6,2),                  -- 용적률

  -- 층수·세대
  grnd_flr_cnt INTEGER,                 -- 지상층수
  ugrnd_flr_cnt INTEGER,                -- 지하층수
  hhld_cnt INTEGER,                     -- 세대수
  fmly_cnt INTEGER,                     -- 가구수
  ho_cnt INTEGER,                       -- 호수

  -- 구조
  strct_cd_nm VARCHAR(100),             -- 구조명 (철근콘크리트 등)
  roof_cd_nm VARCHAR(50),               -- 지붕명

  -- 승인
  use_apr_day VARCHAR(8),               -- 사용승인일 YYYYMMDD
  pmsrv_day VARCHAR(8),                 -- 허가일

  -- 설비
  ride_elvt_cnt INTEGER,                -- 승용승강기
  emgen_elvt_cnt INTEGER,               -- 비상용승강기

  -- 주차
  indr_mech_utcnt INTEGER,              -- 옥내기계식
  oudr_mech_utcnt INTEGER,              -- 옥외기계식
  indr_auto_utcnt INTEGER,              -- 옥내자주식
  oudr_auto_utcnt INTEGER,              -- 옥외자주식

  -- 원본
  raw JSONB,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bl_pnu ON building_ledgers(pnu);
CREATE INDEX IF NOT EXISTS idx_bl_sigungu ON building_ledgers(sigungu_cd);
CREATE INDEX IF NOT EXISTS idx_bl_bld_nm ON building_ledgers(bld_nm);

ALTER TABLE building_ledgers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view building ledgers" ON building_ledgers
  FOR SELECT TO public
  USING (true);

-- INSERT/UPDATE는 service_role만
