-- 025: jobs 테이블에 lawd_cd 컬럼 추가 (시세지도 조인용)
-- region 텍스트 → lawd_cd 매핑 백필은 별도 스크립트(`scripts/backfill-jobs-lawd-cd.sql`)

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS lawd_cd CHAR(5);

CREATE INDEX IF NOT EXISTS idx_jobs_lawd_cd ON jobs(lawd_cd) WHERE lawd_cd IS NOT NULL;

-- 간이 백필 (region 텍스트 → lawd_cd)
-- 정확도 보수적: '강남' 포함 시 11680 등 부분 매칭
-- 더 정교한 매칭은 Node 스크립트에서 수행
UPDATE jobs SET lawd_cd = '11680' WHERE region LIKE '%강남%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11650' WHERE region LIKE '%서초%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11710' WHERE region LIKE '%송파%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11740' WHERE region LIKE '%강동%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11440' WHERE region LIKE '%마포%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11170' WHERE region LIKE '%용산%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11110' WHERE region LIKE '%종로%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11140' WHERE region LIKE '%중구%' AND region LIKE '%서울%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11200' WHERE region LIKE '%성동%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11215' WHERE region LIKE '%광진%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11230' WHERE region LIKE '%동대문%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11260' WHERE region LIKE '%중랑%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11290' WHERE region LIKE '%성북%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11305' WHERE region LIKE '%강북%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11320' WHERE region LIKE '%도봉%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11350' WHERE region LIKE '%노원%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11380' WHERE region LIKE '%은평%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11410' WHERE region LIKE '%서대문%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11470' WHERE region LIKE '%양천%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11500' WHERE region LIKE '%강서%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11530' WHERE region LIKE '%구로%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11545' WHERE region LIKE '%금천%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11560' WHERE region LIKE '%영등포%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11590' WHERE region LIKE '%동작%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '11620' WHERE region LIKE '%관악%' AND lawd_cd IS NULL;

-- 경기 주요 시
UPDATE jobs SET lawd_cd = '41135' WHERE region LIKE '%분당%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '41117' WHERE region LIKE '%영통%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '41465' WHERE region LIKE '%수지%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '41463' WHERE region LIKE '%기흥%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '41461' WHERE region LIKE '%처인%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '41131' WHERE region LIKE '%성남%수정%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '41190' WHERE region LIKE '%부천%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '41590' WHERE region LIKE '%화성%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '41220' WHERE region LIKE '%평택%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '41281' WHERE region LIKE '%고양%덕양%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '41285' WHERE region LIKE '%일산동%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '41287' WHERE region LIKE '%일산서%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '41271' WHERE region LIKE '%안산%상록%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '41273' WHERE region LIKE '%안산%단원%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '41390' WHERE region LIKE '%시흥%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '41171' WHERE region LIKE '%안양%만안%' AND lawd_cd IS NULL;
UPDATE jobs SET lawd_cd = '41173' WHERE region LIKE '%안양%동안%' AND lawd_cd IS NULL;
