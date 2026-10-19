-- 048: 033 통합 집계 갱신 RPC를 고정된 두 MV만 갱신하는 서버 전용 함수로 제한.
-- 033 적용 후 MV 소유 역할(일반적으로 postgres)로 실행한다.
-- 적용 전 함수 owner가 두 MV를 REFRESH할 권한을 가진 역할인지 확인해야 한다.
BEGIN;

CREATE OR REPLACE FUNCTION public.refresh_market_aggregates()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
-- PostgREST service_role은 기본 8초 제한을 상속하므로 이 RPC에만 예외를 둔다.
SET statement_timeout = '60s'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_matviews
    WHERE schemaname = 'public' AND matviewname = 'complex_aggregates'
  ) THEN
    BEGIN
      REFRESH MATERIALIZED VIEW CONCURRENTLY public.complex_aggregates;
    EXCEPTION WHEN feature_not_supported THEN
      REFRESH MATERIALIZED VIEW public.complex_aggregates;
    END;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_matviews
    WHERE schemaname = 'public' AND matviewname = 'complex_rent_aggregates'
  ) THEN
    BEGIN
      REFRESH MATERIALIZED VIEW CONCURRENTLY public.complex_rent_aggregates;
    EXCEPTION WHEN feature_not_supported THEN
      REFRESH MATERIALIZED VIEW public.complex_rent_aggregates;
    END;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refresh_market_aggregates() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_market_aggregates() TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
