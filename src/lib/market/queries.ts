'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { ComplexDetail } from '@/components/market/MarketDetailPanel';
import type { SearchResult } from '@/components/market/MarketSearch';

// 차트 기간 범위 (Phase 3에서 UI 노출). API ?range= 로 전달.
export type ChartRange = '1m' | '6m' | '1y' | '3y' | '5y';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed: ${res.status} ${url}`);
  return res.json() as Promise<T>;
}

// 단지 상세 — /api/market/complex/[key]?range=
export function useComplexDetail(complexKey: string | null, range: ChartRange = '6m') {
  return useQuery({
    queryKey: ['market', 'complex', complexKey, range],
    enabled: !!complexKey,
    queryFn: () =>
      fetchJson<ComplexDetail>(
        `/api/market/complex/${encodeURIComponent(complexKey!)}?range=${range}`,
      ),
    // 기간 탭 전환 시 이전 데이터 유지해 깜빡임 방지.
    placeholderData: keepPreviousData,
  });
}

// 단지명 검색 — /api/market/search?q=
export function useMarketSearch(q: string) {
  const query = q.trim();
  return useQuery({
    queryKey: ['market', 'search', query],
    enabled: query.length > 0,
    queryFn: () =>
      fetchJson<{ results: SearchResult[] }>(
        `/api/market/search?q=${encodeURIComponent(query)}`,
      ).then((d) => d.results || []),
    // 검색은 더 빨리 stale 처리 (입력 변화 잦음).
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

// 지역 중개업소 — /api/market/brokers-nearby?lawd_cd= (Phase 4)
export interface BrokerOffice {
  med_office_nm: string;
  rprsv_nm: string | null;
  tel_no: string | null;
  lctn_road_nm_addr: string | null;
  latitude: number | null;
  longitude: number | null;
}

export function useBrokersNearby(lawdCd: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['market', 'brokers', lawdCd],
    enabled: enabled && !!lawdCd,
    queryFn: () =>
      fetchJson<{ brokers: BrokerOffice[] }>(
        `/api/market/brokers-nearby?lawd_cd=${lawdCd}`,
      ).then((d) => d.brokers || []),
  });
}

// 지역 구인공고 — /api/market/jobs-nearby?lawd_cd= (Phase 4)
export interface NearbyJob {
  id: string;
  title: string;
  company: string | null;
  category: string | null;
  tier: string | null;
  region: string | null;
  address: string | null;
  thumbnail: string | null;
  created_at: string;
}

export function useJobsNearby(lawdCd: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['market', 'jobs', lawdCd],
    enabled: enabled && !!lawdCd,
    queryFn: () =>
      fetchJson<{ jobs: NearbyJob[] }>(
        `/api/market/jobs-nearby?lawd_cd=${lawdCd}`,
      ).then((d) => d.jobs || []),
  });
}
