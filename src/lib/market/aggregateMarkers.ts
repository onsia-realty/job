/**
 * 줌 레벨별 집계 마커용 순수 함수.
 * - 동(洞) 집계: viewport 내 단지 points를 법정동 단위로 묶음 (클라이언트 집계)
 * - 구(시군구) 집계: /api/market/aggregates 서버 집계 사용 (GuAggregate 타입만 여기 정의)
 */

import type { MapComplexPoint } from '@/components/market/MarketMap.client';

export interface AggregatePoint {
  key: string;
  name: string;
  lat: number;
  lng: number;
  avg_price_manwon: number;
  trade_count: number;
  complex_count: number;
}

/** /api/market/aggregates 응답 행 */
export interface GuAggregate extends AggregatePoint {
  lawd_cd: string;
  sido: string;
}

/**
 * 단지 points → 법정동 단위 집계.
 * - 평균가: 단지 평균의 거래건수 가중평균
 * - 좌표: 멤버 단지 centroid
 * - dongByKey: complex_key → 법정동명 (거래 데이터에서 수집). 동 정보 없는 단지는 제외.
 */
export function aggregateByDong(
  points: MapComplexPoint[],
  dongByKey: Record<string, string | null | undefined>,
): AggregatePoint[] {
  const byDong = new Map<
    string,
    { latSum: number; lngSum: number; priceSum: number; tradeCount: number; complexCount: number }
  >();

  for (const p of points) {
    const dong = dongByKey[p.complex_key];
    if (!dong) continue;
    let g = byDong.get(dong);
    if (!g) {
      g = { latSum: 0, lngSum: 0, priceSum: 0, tradeCount: 0, complexCount: 0 };
      byDong.set(dong, g);
    }
    g.latSum += p.lat;
    g.lngSum += p.lng;
    g.priceSum += p.avg_price_manwon * p.trade_count;
    g.tradeCount += p.trade_count;
    g.complexCount += 1;
  }

  const out: AggregatePoint[] = [];
  for (const [dong, g] of byDong) {
    if (g.tradeCount === 0) continue;
    out.push({
      key: `dong:${dong}`,
      name: dong,
      lat: g.latSum / g.complexCount,
      lng: g.lngSum / g.complexCount,
      avg_price_manwon: Math.round(g.priceSum / g.tradeCount),
      trade_count: g.tradeCount,
      complex_count: g.complexCount,
    });
  }
  return out.sort((a, b) => b.trade_count - a.trade_count);
}
