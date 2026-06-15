-- users 테이블 누락 컬럼 추가 (신규 가입 500 블로커 수정)
--
-- 증상: 가입 직후 /api/auth/ensure-user 와 /api/auth/complete-profile 가
--       users 테이블에 business_no / broker_reg_no / broker_address / broker_reg_date 를
--       insert/update 하는데, 라이브 users 테이블에 이 컬럼들이 없어서
--       "Could not find the 'broker_address' column of 'users'" 로 500 → users 레코드 미생성.
--       → 이후 공고 등록이 jobs_user_id_fkey FK 위반으로 연쇄 실패.
-- 원인: 001_initial_schema.sql 의 users 정의에 기업회원(중개사무소) 정보 컬럼이 빠짐.
--       코드는 이 컬럼들을 기대하나 추가 마이그레이션이 없었음.
-- 적용: 라이브 Supabase SQL 에디터에서 실행 후 PostgREST 스키마 캐시 자동 리로드됨.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS nickname         varchar(50),   -- 닉네임 (ensure-user/complete-profile에서 사용)
  ADD COLUMN IF NOT EXISTS business_no      varchar(20),   -- 사업자등록번호 (000-00-00000)
  ADD COLUMN IF NOT EXISTS broker_reg_no    varchar(50),   -- 중개사무소 등록번호
  ADD COLUMN IF NOT EXISTS broker_address   text,          -- 중개사무소 주소
  ADD COLUMN IF NOT EXISTS broker_reg_date  varchar(20);   -- 개설등록일 (문자열 보관: 빈값 허용)
