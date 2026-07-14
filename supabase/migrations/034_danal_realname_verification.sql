-- 034 다날(Danal) UAS 휴대폰 본인확인 연동
--
-- 목적: 회원가입 시 다날 UAS 본인인증 결과(CI/DI/이름 등)를 저장하고,
--       DI 기준으로 1인 1계정을 강제한다.
-- 실행: 라이브 Supabase SQL 에디터에서 실행. 모두 idempotent(if not exists).
-- 주의: CI/DI 는 서버(service role)만 기록/조회. RLS 정책은 두지 않아 클라이언트 직접 접근 차단.

-- 1) users 테이블: 본인인증 결과 컬럼
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ci                text,                       -- 다날 CI (88 byte, 연계정보)
  ADD COLUMN IF NOT EXISTS di                text,                       -- 다날 DI (64 byte, 중복가입확인정보)
  ADD COLUMN IF NOT EXISTS realname_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at       timestamptz;

-- DI 존재 시 유니크 → 동일인 재가입 차단 (di is null 행은 제약 대상 아님)
CREATE UNIQUE INDEX IF NOT EXISTS users_di_unique ON users (di) WHERE di IS NOT NULL;

-- 2) 다날 인증 거래 임시 저장 테이블
CREATE TABLE IF NOT EXISTS public.danal_verifications (
  tid          text PRIMARY KEY,                 -- 다날 Ready 응답 TID
  orderid      text NOT NULL,                    -- 서버 생성 주문번호 (Confirm 시 CPID와 함께 검증)
  token        text UNIQUE,                      -- 1회성 브라우저→서버 소비 토큰 (Confirm 성공 후 발급)
  ci           text,
  di           text,
  name         text,
  dob          text,                             -- YYYYMMDD (IDENOPTION=1)
  sex          text,
  phone        text,                             -- 응답에 휴대폰번호 필드가 있을 때만 저장 (없으면 null)
  status       text NOT NULL DEFAULT 'ready',    -- ready → confirmed → consumed
  created_at   timestamptz DEFAULT now(),
  confirmed_at timestamptz
);

-- token 조회 성능 (1회성 소비 시 사용)
CREATE INDEX IF NOT EXISTS danal_verifications_token_idx ON public.danal_verifications (token);

-- RLS 활성화 + 정책 없음 → service role(서버)만 접근 가능
ALTER TABLE public.danal_verifications ENABLE ROW LEVEL SECURITY;
