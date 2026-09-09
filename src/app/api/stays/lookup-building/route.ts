import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { verifyUser } from '@/lib/auth-server';
import { geocodeAddress } from '@/lib/market/complexes';
import { fetchBuildingTitle, type BuildingLedgerRow } from '@/lib/market/buildingLedger';
import { buildPnu, lawdCdFromBcode } from '@/lib/stay/pnu';

/**
 * POST /api/stays/lookup-building
 *
 * 매물 등록 폼 프리필: 주소 → 좌표 + 건축물대장 요약.
 *
 * body: { address: string; jibunAddress?: string; bcode?: string }
 *   - address      : 도로명주소 (지오코딩 대상)
 *   - jibunAddress : 지번주소 (PNU 조립용)
 *   - bcode        : 법정동코드 10자리 (Daum 우편번호 API)
 *
 * 설계 원칙 — "프리필은 편의 기능이지 관문이 아니다":
 *   인증 실패(401)와 address 누락(400) 을 제외한 모든 단계 실패는 200 + 부분 결과.
 *   지오코딩 실패, PNU 조립 실패, 대장 API 장애 전부 null 필드로 내려가고
 *   폼은 사용자가 직접 입력해 계속 진행할 수 있다.
 *
 * ⚠️ platGbCd(0=대지/1=산) 변환은 buildingLedger.ts 의 splitPnu() 가 담당한다.
 *    여기서는 표준 PNU(1=일반/2=산) 만 만들어 넘긴다. (pnu.ts 주석 참조)
 */

export const dynamic = 'force-dynamic';

// ---- 사용자별 간단 rate limit (메모리, 서버 재시작 시 초기화) ----
// 외부 유료 API(지오코딩 + 건축물대장) 를 태우는 엔드포인트라 최소한의 방어만 둔다.
// 프로젝트에 공용 rate limit 유틸이 없어 chat/route.ts 의 패턴을 그대로 인라인.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_PER_WINDOW) return false;
  entry.count++;
  return true;
}

// 메모리 누수 방지 — 요청 시점에 만료 엔트리 정리 (setInterval 은 서버리스에서 무의미)
function sweepRateLimit() {
  if (rateLimitMap.size < 500) return;
  const now = Date.now();
  for (const [k, v] of rateLimitMap) {
    if (now > v.resetAt) rateLimitMap.delete(k);
  }
}

export interface StayBuildingPrefill {
  mgm_bldrgst_pk: string | null;
  building_name: string | null;
  main_purps_cd_nm: string | null;
  use_apr_day: string | null;
  total_floors: number | null;
  elevator_cnt: number | null;
  parking_total: number | null;
}

type LedgerLike = Partial<BuildingLedgerRow> & { raw?: unknown };

function sum(...vals: Array<number | null | undefined>): number | null {
  const present = vals.filter((v): v is number => typeof v === 'number' && !isNaN(v));
  return present.length === 0 ? null : present.reduce((a, b) => a + b, 0);
}

/** building_ledgers 행(또는 API 응답 행) → stays 프리필 형태 */
function toPrefill(row: LedgerLike): StayBuildingPrefill {
  return {
    mgm_bldrgst_pk: row.mgm_bldrgst_pk ?? null,
    building_name: row.bld_nm ?? null,
    main_purps_cd_nm: row.main_purps_cd_nm ?? null,
    use_apr_day: row.use_apr_day ?? null,
    // 지상층수를 총층수로 사용 (stays.total_floors)
    total_floors: row.grnd_flr_cnt ?? null,
    // 승용 + 비상용 승강기
    elevator_cnt: sum(row.ride_elvt_cnt, row.emgen_elvt_cnt),
    // 옥내/옥외 × 기계식/자주식 합산
    parking_total: sum(
      row.indr_mech_utcnt,
      row.oudr_mech_utcnt,
      row.indr_auto_utcnt,
      row.oudr_auto_utcnt,
    ),
  };
}

/** cron 이 남기는 "표제부 없음" 스텁 판별 */
function isNotFoundStub(row: LedgerLike): boolean {
  const raw = row.raw as { not_found?: boolean } | null | undefined;
  return !!raw && typeof raw === 'object' && raw.not_found === true;
}

export async function POST(req: NextRequest) {
  // 1) 인증 — 외부 API 비용이 드는 엔드포인트라 로그인 필수
  const user = await verifyUser(req);
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  sweepRateLimit();
  if (!checkRateLimit(user.id)) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 },
    );
  }

  let body: { address?: string; jibunAddress?: string; bcode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json body' }, { status: 400 });
  }

  const address = typeof body.address === 'string' ? body.address.trim() : '';
  const jibunAddress = typeof body.jibunAddress === 'string' ? body.jibunAddress.trim() : '';
  const bcode = typeof body.bcode === 'string' ? body.bcode.trim() : '';

  // 지오코딩 대상 주소는 도로명 우선, 없으면 지번으로 대체
  const geocodeTarget = address || jibunAddress;
  if (!geocodeTarget) {
    return NextResponse.json({ error: 'address 또는 jibunAddress 가 필요합니다.' }, { status: 400 });
  }

  const warnings: string[] = [];

  // 2) 지오코딩 (NCP 네이버 → VWorld fallback)
  let lat: number | null = null;
  let lng: number | null = null;
  let geocode_source: string | null = null;
  try {
    const point = await geocodeAddress(geocodeTarget);
    if (point) {
      lat = point.lat;
      lng = point.lng;
      geocode_source = point.source;
    } else {
      warnings.push('geocode_failed');
    }
  } catch (e) {
    warnings.push(`geocode_error: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 3) PNU 조립 (실패해도 좌표만 응답)
  const pnu = buildPnu(bcode, jibunAddress);
  const lawd_cd = lawdCdFromBcode(bcode);
  if (!pnu) warnings.push('pnu_unavailable');

  let building: StayBuildingPrefill | null = null;
  let source: 'cache' | 'api' | 'none' = 'none';

  if (pnu) {
    // 4) 캐시 조회
    let cached: LedgerLike | null = null;
    try {
      const { data, error } = await supabaseAdmin
        .from('building_ledgers')
        .select('*')
        .eq('pnu', pnu)
        .maybeSingle();
      if (error) warnings.push(`cache_error: ${error.message}`);
      cached = (data as LedgerLike | null) ?? null;
    } catch (e) {
      warnings.push(`cache_error: ${e instanceof Error ? e.message : String(e)}`);
    }

    if (cached && !isNotFoundStub(cached)) {
      building = toPrefill(cached);
      source = 'cache';
    } else if (cached && isNotFoundStub(cached)) {
      // 이미 "표제부 없음"으로 확인된 필지 — 외부 API 재호출하지 않는다
      source = 'none';
      warnings.push('ledger_not_found_cached');
    } else {
      // 5) 캐시 miss → 건축물대장 API 호출 후 upsert
      const service_key = process.env.DATA_GO_KR_API_KEY;
      if (!service_key) {
        warnings.push('DATA_GO_KR_API_KEY_missing');
      } else {
        try {
          const row = await fetchBuildingTitle(pnu, service_key);
          if (row) {
            building = toPrefill(row);
            source = 'api';
            const { error: upErr } = await supabaseAdmin
              .from('building_ledgers')
              .upsert({ ...row, fetched_at: new Date().toISOString() }, { onConflict: 'pnu' });
            if (upErr) warnings.push(`cache_upsert_failed: ${upErr.message}`);
          } else {
            warnings.push('ledger_not_found');
          }
        } catch (e) {
          warnings.push(`ledger_error: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }
  }

  // 6) 어떤 단계가 실패해도 200 + 부분 결과
  return NextResponse.json({
    lat,
    lng,
    geocode_source,
    lawd_cd,
    bcode: bcode || null,
    pnu,
    building,
    source,
    warnings,
  });
}
