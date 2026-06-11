'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { ComplexDetail } from '@/lib/market/types';
import type { SearchResult } from '@/components/market/MarketSearch';
import type { GuAggregate } from '@/lib/market/aggregateMarkers';
import type { Surroundings } from '@/lib/market/surroundings';

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

// 구(시군구) 집계 — /api/market/aggregates (줌아웃 마커용, 매매 기준)
export function useGuAggregates(propertyType: 'apt' | 'officetel', enabled: boolean) {
  return useQuery({
    queryKey: ['market', 'agg', 'gu', propertyType],
    enabled,
    queryFn: () =>
      fetchJson<{ aggregates: GuAggregate[] }>(
        `/api/market/aggregates?level=gu&type=${propertyType}`,
      ).then((d) => d.aggregates || []),
    staleTime: 60 * 60 * 1000, // 구 평균은 일 단위 변동 — 1시간 캐시
  });
}

// 단지 주변 학교/지하철/버스 — /api/market/surroundings (인근 탭)
export function useSurroundings(
  lat: number | null | undefined,
  lng: number | null | undefined,
  address: string | null | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['market', 'surroundings', lat, lng],
    enabled: enabled && lat != null && lng != null,
    queryFn: () =>
      fetchJson<Surroundings>(
        `/api/market/surroundings?lat=${lat}&lng=${lng}&address=${encodeURIComponent(address || '')}`,
      ),
    staleTime: 24 * 60 * 60 * 1000, // 주변 시설은 사실상 정적 — 24시간
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
