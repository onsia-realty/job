/**
 * 단지별 거래 집계 + 월간 변동률 계산
 * 출처: raps-clone/renderer/lib/aggregateByComplex.ts — 포팅
 *
 * 주의: 대규모 데이터는 DB Materialized View(022_complex_aggregates)를 사용하고,
 * 이 파일은 클라이언트 사이드에서 소규모 집계(단지 상세 등)에만 사용.
 */
import { sqmToPyeong } from './publicApi';
import type { NormalizedTransaction } from './realEstate';

export interface ComplexStats {
  id: string;                      // complex_key
  name: string;                    // 단지명
  dong: string;
  totalUnits: number;              // 추정 세대수
  buildYear: number;
  avgArea: number;                 // 평균 전용면적
  avgPyeong: number;
  tradePrice: number;              // 평균 매매가 (만원)
  tradePricePerPyeong: number;     // 평당가
  tradeCount: number;
  jeonsePrice?: number;
  jeonsePricePerPyeong?: number;
  jeonseRate?: number;             // 전세가율(%)
  priceChange: number;
  priceChangePercent: number;
  changeType: 'up' | 'down' | 'same';
}

export function aggregateByComplex(
  trades: NormalizedTransaction[],
  rents?: NormalizedTransaction[],
  previousTrades?: NormalizedTransaction[]
): ComplexStats[] {
  const complexMap = new Map<string, {
    trades: NormalizedTransaction[];
    rents: NormalizedTransaction[];
    prevTrades: NormalizedTransaction[];
  }>();

  for (const t of trades) {
    if (t.cancel_yn) continue;
    const key = t.complex_key;
    if (!complexMap.has(key)) {
      complexMap.set(key, { trades: [], rents: [], prevTrades: [] });
    }
    complexMap.get(key)!.trades.push(t);
  }

  if (rents) {
    for (const r of rents) {
      const key = r.complex_key;
      if (!complexMap.has(key)) {
        complexMap.set(key, { trades: [], rents: [], prevTrades: [] });
      }
      complexMap.get(key)!.rents.push(r);
    }
  }

  if (previousTrades) {
    for (const pt of previousTrades) {
      if (pt.cancel_yn) continue;
      const key = pt.complex_key;
      if (complexMap.has(key)) {
        complexMap.get(key)!.prevTrades.push(pt);
      }
    }
  }

  const results: ComplexStats[] = [];

  complexMap.forEach((data, key) => {
    const { trades: tr, rents: re, prevTrades } = data;
    if (tr.length === 0) return;

    const first = tr[0];
    const tradePrices = tr.map((t) => t.price_manwon || 0).filter((p) => p > 0);
    if (tradePrices.length === 0) return;

    const avgTradePrice = Math.round(tradePrices.reduce((a, b) => a + b, 0) / tradePrices.length);
    const areas = tr.map((t) => t.exclusive_area).filter((a) => a > 0);
    const avgArea = areas.reduce((a, b) => a + b, 0) / areas.length;
    const avgPyeong = sqmToPyeong(avgArea);
    const tradePricePerPyeong = Math.round(avgTradePrice / avgPyeong);

    const uniqueFloors = new Set(tr.map((t) => t.floor).filter((f) => f != null));
    const estimatedUnits = Math.max(tr.length * 10, uniqueFloors.size * 4);

    // 전세 집계
    let jeonsePrice: number | undefined;
    let jeonsePricePerPyeong: number | undefined;
    let jeonseRate: number | undefined;
    if (re.length > 0) {
      const deposits = re.map((r) => r.deposit_manwon || 0).filter((p) => p > 0);
      if (deposits.length > 0) {
        jeonsePrice = Math.round(deposits.reduce((a, b) => a + b, 0) / deposits.length);
        jeonsePricePerPyeong = Math.round(jeonsePrice / avgPyeong);
        jeonseRate = Math.round((jeonsePrice / avgTradePrice) * 100);
      }
    }

    // 변동률
    let priceChange = 0;
    let priceChangePercent = 0;
    let changeType: 'up' | 'down' | 'same' = 'same';
    if (prevTrades.length > 0) {
      const prev = prevTrades.map((t) => t.price_manwon || 0).filter((p) => p > 0);
      if (prev.length > 0) {
        const avgPrev = prev.reduce((a, b) => a + b, 0) / prev.length;
        priceChange = Math.round(avgTradePrice - avgPrev);
        priceChangePercent = avgPrev > 0 ? Math.round((priceChange / avgPrev) * 1000) / 10 : 0;
        if (priceChange > 0) changeType = 'up';
        else if (priceChange < 0) changeType = 'down';
      }
    }

    results.push({
      id: key,
      name: first.complex_name,
      dong: first.dong,
      totalUnits: estimatedUnits,
      buildYear: first.build_year || 0,
      avgArea,
      avgPyeong: Math.round(avgPyeong * 10) / 10,
      tradePrice: avgTradePrice,
      tradePricePerPyeong,
      tradeCount: tr.length,
      jeonsePrice,
      jeonsePricePerPyeong,
      jeonseRate,
      priceChange,
      priceChangePercent,
      changeType,
    });
  });

  results.sort((a, b) => b.tradePrice - a.tradePrice);
  return results;
}
