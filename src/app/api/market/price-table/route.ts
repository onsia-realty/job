import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

/**
 * GET /api/market/price-table
 * 시세표(PriceTable) 데이터 — 부동산지인 지역분석 표 벤치마크.
 * 공인중개사 슬라이드 패널 + /market 표 모드 공용.
 *
 * Params:
 *  - type   : 'apt' | 'offi' | 'officetel'   (DB property_type로 정규화)
 *  - level  : 'region'(시군구 요약) | 'complex'(단지 목록)   기본 region
 *  - region : 시도명('서울특별시'|'경기도') 또는 lawd_cd prefix('11', '11680' 등). 없으면 전체.
 *  - sort   : 'price_desc' | 'price_asc' | 'volume_desc'    기본 price_desc
 *
 * 사전계산(022 complex_aggregates MV = 매매, 033 complex_rent_aggregates MV = 전세,
 * 032 market_rankings = 신고가 캐시)을 조합. 원자료 풀스캔 금지.
 * 033 미적용 상태에서도 전세 필드만 null로 두고 500 없이 동작한다(try/catch 방어).
 */

const PAGE = 1000;

// 시도명 → lawd_cd prefix (rankings.ts / rankings/top10 route와 동일 규약)
const SIDO_PREFIX: Record<string, string> = { 서울특별시: '11', 경기도: '41' };

// property_type 정규화 — API는 'offi' 별칭 허용, DB는 'officetel'
function normalizeType(raw: string | null): 'apt' | 'officetel' {
  return raw === 'offi' || raw === 'officetel' ? 'officetel' : 'apt';
}

// region 파라미터 → lawd_cd prefix. 시도명이면 매핑, 아니면 숫자 prefix로 취급.
function regionPrefix(region: string | null): string | undefined {
  if (!region) return undefined;
  if (SIDO_PREFIX[region]) return SIDO_PREFIX[region];
  const digits = region.replace(/\D/g, '');
  return digits.length ? digits : undefined;
}

// PostgREST .in() 은 한글 키가 많으면 URL 한도 초과 → 30개 청크로 분할 (프로젝트 규약)
async function chunkedIn<T>(
  table: string,
  select: string,
  column: string,
  values: string[],
): Promise<T[]> {
  const uniq = [...new Set(values)];
  const out: T[] = [];
  for (let i = 0; i < uniq.length; i += 30) {
    const slice = uniq.slice(i, i + 30);
    const { data, error } = await supabaseAdmin.from(table).select(select).in(column, slice);
    if (error) throw error;
    out.push(...((data || []) as T[]));
  }
  return out;
}

// 최근 N개월 시작일(1일) 문자열
function sinceMonths(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

type TradeAggRow = {
  complex_key: string;
  complex_name: string | null;
  lawd_cd: string;
  avg_price_manwon: number | null;
  avg_pyeong_price: number | null;
  trade_count: number | null;
  ym: string;
  last_deal_date: string | null;
};
type RentAggRow = {
  complex_key: string;
  lawd_cd: string;
  avg_deposit_manwon: number | null;
  rent_count: number | null;
  ym: string;
};

// MV 페이지 전체 조회 (PostgREST aggregate 미지원 → 서버 집계). prefix like 필터.
async function pageAll<T>(
  table: string,
  select: string,
  property_type: string,
  sinceStr: string,
  prefix: string | undefined,
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += PAGE) {
    let q = supabaseAdmin
      .from(table)
      .select(select)
      .eq('property_type', property_type)
      .gte('ym', sinceStr)
      .range(offset, offset + PAGE - 1);
    if (prefix) q = q.like('lawd_cd', `${prefix}%`);
    const { data, error } = await q;
    if (error) throw error;
    rows.push(...((data || []) as T[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

// 033 미적용/미존재 방어 — 전세 MV 조회 실패 시 빈 배열
async function pageRentSafe(
  property_type: string,
  sinceStr: string,
  prefix: string | undefined,
): Promise<RentAggRow[]> {
  try {
    return await pageAll<RentAggRow>(
      'complex_rent_aggregates',
      'complex_key, lawd_cd, avg_deposit_manwon, rent_count, ym',
      property_type,
      sinceStr,
      prefix,
    );
  } catch (e) {
    console.warn('[price-table] rent MV 조회 실패(033 미적용?) — 전세 필드 null:', e instanceof Error ? e.message : e);
    return [];
  }
}

// 032 신고가 캐시 → lawd_cd별 신고가 단지 수 (best-effort, 없으면 빈 맵)
async function newHighCountByLawd(property_type: string, prefix: string | undefined): Promise<{ map: Map<string, number>; updatedAt: string | null }> {
  const map = new Map<string, number>();
  let updatedAt: string | null = null;
  try {
    const sido = prefix === '11' ? '서울특별시' : prefix === '41' ? '경기도' : 'all';
    const { data } = await supabaseAdmin
      .from('market_rankings')
      .select('data, updated_at')
      .eq('cache_key', `highest|${sido}|${property_type}`)
      .maybeSingle();
    if (data) {
      updatedAt = (data.updated_at as string) ?? null;
      const arr = (data.data as Array<{ lawd_cd?: string | null }>) || [];
      for (const it of arr) {
        if (!it?.lawd_cd) continue;
        if (prefix && !it.lawd_cd.startsWith(prefix)) continue;
        map.set(it.lawd_cd, (map.get(it.lawd_cd) || 0) + 1);
      }
    }
  } catch {
    /* 032 미적용 — best-effort */
  }
  return { map, updatedAt };
}

const round = (n: number) => Math.round(n);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const property_type = normalizeType(searchParams.get('type'));
  const level = searchParams.get('level') === 'complex' ? 'complex' : 'region';
  const prefix = regionPrefix(searchParams.get('region'));
  const sort = searchParams.get('sort') || 'price_desc';
  const sinceStr = sinceMonths(3); // 최근 3개월 (실거래 신고 지연 고려)

  const applySort = <T extends { avgTradeManwon: number | null; tradeCount3m: number }>(rows: T[]): T[] => {
    const price = (r: T) => r.avgTradeManwon ?? -1;
    if (sort === 'volume_desc') return rows.sort((a, b) => b.tradeCount3m - a.tradeCount3m);
    if (sort === 'price_asc') return rows.sort((a, b) => price(a) - price(b));
    return rows.sort((a, b) => price(b) - price(a)); // price_desc 기본
  };

  try {
    if (level === 'region') {
      // ── 지역(lawd_cd) 요약 ──
      const [trade, rent, { map: newHighMap, updatedAt: rankUpdatedAt }] = await Promise.all([
        pageAll<TradeAggRow>(
          'complex_aggregates',
          'complex_key, lawd_cd, avg_price_manwon, avg_pyeong_price, trade_count',
          property_type,
          sinceStr,
          prefix,
        ),
        pageRentSafe(property_type, sinceStr, prefix),
        newHighCountByLawd(property_type, prefix),
      ]);

      // lawd_cd별 매매 가중집계 (거래건수 가중)
      type Acc = { priceSum: number; pySum: number; count: number; complexes: Set<string> };
      const byGu = new Map<string, Acc>();
      for (const r of trade) {
        if (!r.avg_price_manwon || !r.trade_count) continue;
        let g = byGu.get(r.lawd_cd);
        if (!g) { g = { priceSum: 0, pySum: 0, count: 0, complexes: new Set() }; byGu.set(r.lawd_cd, g); }
        g.priceSum += r.avg_price_manwon * r.trade_count;
        g.pySum += (r.avg_pyeong_price || 0) * r.trade_count;
        g.count += r.trade_count;
        g.complexes.add(r.complex_key);
      }

      // lawd_cd별 전세 가중집계
      const rentByGu = new Map<string, { depSum: number; count: number }>();
      for (const r of rent) {
        if (!r.avg_deposit_manwon || !r.rent_count) continue;
        let g = rentByGu.get(r.lawd_cd);
        if (!g) { g = { depSum: 0, count: 0 }; rentByGu.set(r.lawd_cd, g); }
        g.depSum += r.avg_deposit_manwon * r.rent_count;
        g.count += r.rent_count;
      }

      // 지역명 부착
      const names = await chunkedIn<{ lawd_cd: string; sido: string | null; sigungu: string | null }>(
        'region_codes',
        'lawd_cd, sido, sigungu',
        'lawd_cd',
        Array.from(byGu.keys()),
      );
      const nameMap = new Map(names.map((n) => [n.lawd_cd, n.sigungu || n.sido || n.lawd_cd]));

      const rows = Array.from(byGu.entries()).map(([lawdCd, g]) => {
        const avgTradeManwon = g.count > 0 ? round(g.priceSum / g.count) : null;
        const avgPyeongManwon = g.count > 0 ? round(g.pySum / g.count) : null;
        const rg = rentByGu.get(lawdCd);
        const avgJeonseManwon = rg && rg.count > 0 ? round(rg.depSum / rg.count) : null;
        const jeonseRatio =
          avgTradeManwon && avgJeonseManwon ? round((avgJeonseManwon / avgTradeManwon) * 100) : null;
        return {
          regionName: nameMap.get(lawdCd) || lawdCd,
          lawdCd,
          complexCount: g.complexes.size,
          avgTradeManwon,
          avgPyeongManwon,
          avgJeonseManwon,
          jeonseRatio,
          tradeCount3m: g.count,
          rentCount3m: rg?.count ?? 0,
          newHighCount: newHighMap.get(lawdCd) ?? 0,
        };
      });

      applySort(rows);

      return NextResponse.json(
        { level, type: property_type, region: searchParams.get('region') ?? null, sort, updatedAt: rankUpdatedAt ?? new Date().toISOString(), rows },
        { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } },
      );
    }

    // ── 단지(complex) 목록 ──
    const [trade, rent] = await Promise.all([
      pageAll<TradeAggRow>(
        'complex_aggregates',
        'complex_key, complex_name, lawd_cd, avg_price_manwon, avg_pyeong_price, trade_count, ym, last_deal_date',
        property_type,
        sinceStr,
        prefix,
      ),
      pageRentSafe(property_type, sinceStr, prefix),
    ]);

    // 단지별 3개월 매매 가중집계 + 최근월 스냅샷
    type CAcc = {
      name: string | null; lawdCd: string;
      priceSum: number; pySum: number; count: number;
      latestYm: string; lastDealDate: string | null; lastDealManwon: number | null;
    };
    const byComplex = new Map<string, CAcc>();
    for (const r of trade) {
      if (!r.avg_price_manwon || !r.trade_count) continue;
      let g = byComplex.get(r.complex_key);
      if (!g) {
        g = { name: r.complex_name, lawdCd: r.lawd_cd, priceSum: 0, pySum: 0, count: 0, latestYm: '', lastDealDate: null, lastDealManwon: null };
        byComplex.set(r.complex_key, g);
      }
      g.priceSum += r.avg_price_manwon * r.trade_count;
      g.pySum += (r.avg_pyeong_price || 0) * r.trade_count;
      g.count += r.trade_count;
      if (r.ym >= g.latestYm) {
        // 최근월 avg를 최근 거래가 근사값으로 사용 (원자료 스캔 회피)
        g.latestYm = r.ym;
        g.lastDealManwon = r.avg_price_manwon;
      }
      if (r.last_deal_date && (!g.lastDealDate || r.last_deal_date > g.lastDealDate)) {
        g.lastDealDate = r.last_deal_date;
      }
    }

    // 단지별 전세 가중집계
    const rentByComplex = new Map<string, { depSum: number; count: number }>();
    for (const r of rent) {
      if (!r.avg_deposit_manwon || !r.rent_count) continue;
      let g = rentByComplex.get(r.complex_key);
      if (!g) { g = { depSum: 0, count: 0 }; rentByComplex.set(r.complex_key, g); }
      g.depSum += r.avg_deposit_manwon * r.rent_count;
      g.count += r.rent_count;
    }

    const keys = Array.from(byComplex.keys());
    // 단지 마스터 메타 (세대수/준공) — 청크 .in()
    const metas = await chunkedIn<{ complex_key: string; hhld_cnt: number | null; build_year: number | null }>(
      'complexes',
      'complex_key, hhld_cnt, build_year',
      'complex_key',
      keys,
    );
    const metaMap = new Map(metas.map((m) => [m.complex_key, m]));

    const rows = Array.from(byComplex.entries()).map(([complexKey, g]) => {
      const meta = metaMap.get(complexKey);
      const rg = rentByComplex.get(complexKey);
      return {
        complexKey,
        name: g.name || complexKey,
        households: meta?.hhld_cnt ?? null,
        builtYear: meta?.build_year ?? null,
        lawdCd: g.lawdCd,
        avgTradeManwon: g.count > 0 ? round(g.priceSum / g.count) : null,
        avgPyeongManwon: g.count > 0 ? round(g.pySum / g.count) : null,
        avgJeonseManwon: rg && rg.count > 0 ? round(rg.depSum / rg.count) : null,
        lastDealDate: g.lastDealDate,
        lastDealManwon: g.lastDealManwon,
        tradeCount3m: g.count,
      };
    });

    applySort(rows);
    const capped = rows.slice(0, 300); // 1000행 캡 여유

    return NextResponse.json(
      { level, type: property_type, region: searchParams.get('region') ?? null, sort, updatedAt: new Date().toISOString(), rows: capped },
      { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    console.error('[market/price-table] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
