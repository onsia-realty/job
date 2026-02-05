-- 전국 공인중개사사무소 캐시 테이블
-- LOCALDATA + 공공데이터포털 + 서울열린데이터광장 데이터 통합
CREATE TABLE IF NOT EXISTS broker_offices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estbl_reg_no TEXT NOT NULL UNIQUE,          -- 개설등록번호 (11710-2022-00250)
  med_office_nm TEXT NOT NULL DEFAULT '',      -- 중개사무소명
  opbiz_lrea_clsc_se TEXT DEFAULT '',          -- 개업공인중개사종별구분
  rprsv_nm TEXT DEFAULT '',                    -- 대표자명
  lctn_road_nm_addr TEXT DEFAULT '',           -- 소재지도로명주소
  lctn_lotno_addr TEXT DEFAULT '',             -- 소재지지번주소
  tel_no TEXT DEFAULT '',                      -- 전화번호
  estbl_reg_de TEXT DEFAULT '',                -- 개설등록일자
  sttus_se_nm TEXT DEFAULT '영업중',            -- 상태구분명 (영업중/휴업/폐업)
  mdat_join_yn TEXT DEFAULT '',                -- 공제가입유무
  latitude TEXT DEFAULT '',                     -- 위도
  longitude TEXT DEFAULT '',                    -- 경도
  lawd_cd TEXT DEFAULT '',                      -- 법정동코드 (앞5자리)
  data_source TEXT DEFAULT 'api',              -- 데이터 출처 (api/localdata/seoul/manual)
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),    -- 마지막 동기화 시각
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 개설등록번호 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_broker_estbl_reg_no ON broker_offices(estbl_reg_no);

-- 지역코드 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_broker_lawd_cd ON broker_offices(lawd_cd);

-- 사무소명 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_broker_med_office_nm ON broker_offices(med_office_nm);

-- 상태 필터 인덱스
CREATE INDEX IF NOT EXISTS idx_broker_sttus ON broker_offices(sttus_se_nm);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_broker_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_broker_updated_at
  BEFORE UPDATE ON broker_offices
  FOR EACH ROW
  EXECUTE FUNCTION update_broker_updated_at();

-- RLS 정책
ALTER TABLE broker_offices ENABLE ROW LEVEL SECURITY;

-- 누구나 조회 가능
CREATE POLICY "broker_offices_select" ON broker_offices
  FOR SELECT USING (true);

-- 서버에서만 INSERT/UPDATE (service_role key 사용)
CREATE POLICY "broker_offices_insert" ON broker_offices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "broker_offices_update" ON broker_offices
  FOR UPDATE USING (true);
