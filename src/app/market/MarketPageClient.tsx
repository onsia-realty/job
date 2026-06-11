'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, TrendingUp, Building2, Filter, Store, Briefcase, X, SlidersHorizontal } from 'lucide-react';
import type { MapComplexPoint, DealTypeFilter, MarkerMode } from '@/components/market/MarketMap.client';
import ComplexListPanel from '@/components/market/ComplexListPanel';
import ComplexDetailView from '@/components/market/ComplexDetailView';
import BottomSheet, { type SheetSnap } from '@/components/market/BottomSheet';
import MarketFilterSheet from '@/components/market/MarketFilterSheet';
import MarketSearch, { type SearchResult } from '@/components/market/MarketSearch';
import { useBrokersNearby, useJobsNearby, useGuAggregates } from '@/lib/market/queries';
import { aggregateByDong } from '@/lib/market/aggregateMarkers';
import { nearestLawdCd } from '@/lib/market/regions';
import { formatKoreanPrice } from '@/lib/market/format';
import {
  type PropertyTypeFilter, type AreaBand, type AgeBand, type HouseholdBand,
  AREA_OPTIONS, AGE_OPTIONS, HOUSEHOLD_OPTIONS,
  matchAreaBand, matchAgeBand, matchHouseholdBand, validBand,
} from '@/lib/market/filters';

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || '';

// SSR 금지 (네이버 지도 SDK는 window 의존)
const MarketMap = dynamic(() => import('@/components/market/MarketMap.client'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-market-bg text-market-text-mute text-sm font-jakarta">
      지도를 불러오는 중…
    </div>
  ),
});

// 기본 지역: 서울 강남구
const DEFAULT_CENTER: [number, number] = [37.5172, 127.0473];
const DEFAULT_LAWD_CD = '11680';

// 줌 레벨 → 마커 모드 (구 집계 / 동 집계 / 단지 개별)
function modeForZoom(z: number): MarkerMode {
  if (z <= 11) return 'gu';
  if (z <= 13) return 'dong';
  return 'complex';
}

export default function MarketPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── URL → 초기 상태 (최초 마운트 1회, 딥링크 복원) ──
  const [center, setCenter] = useState<[number, number]>(() => {
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : DEFAULT_CENTER;
  });
  const [zoom, setZoom] = useState<number>(() => {
    const z = parseFloat(searchParams.get('zoom') || '');
    const saved = Number.isFinite(z) && z >= 8 && z <= 19 ? z : 14;
    // 단지 딥링크(sel)는 단지 마커가 보이는 줌(≥14)으로 보정
    return searchParams.get('sel') ? Math.max(14, saved) : saved;
  });
  const [lawd_cd, setLawdCd] = useState(() => searchParams.get('region') || DEFAULT_LAWD_CD);
  // 지도 viewport 범위 (idle 시 갱신). 직렬화 문자열로 보관해 useEffect 트리거가 안정적이도록.
  const [boundsStr, setBoundsStr] = useState<string | null>(null);
  const [property_type, setPropertyType] = useState<PropertyTypeFilter>(() =>
    searchParams.get('type') === 'officetel' ? 'officetel' : 'apt',
  );
  const [dealType, setDealType] = useState<DealTypeFilter>(() => {
    const d = searchParams.get('deal');
    return d === 'jeonse' || d === 'wolse' || d === 'presale' || d === 'trade' ? d : 'trade';
  });
  const [areaBand, setAreaBand] = useState<AreaBand>(() =>
    validBand(searchParams.get('area'), AREA_OPTIONS, 'all'),
  );
  const [ageBand, setAgeBand] = useState<AgeBand>(() =>
    validBand(searchParams.get('age'), AGE_OPTIONS, 'all'),
  );
  const [householdBand, setHouseholdBand] = useState<HouseholdBand>(() =>
    validBand(searchParams.get('hhld'), HOUSEHOLD_OPTIONS, 'all'),
  );
  const [points, setPoints] = useState<MapComplexPoint[]>([]);
  // complex_key → 법정동명 (동 집계 마커용 — 거래 데이터에서 수집)
  const [dongByKey, setDongByKey] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(() => searchParams.get('sel') || null);

  // 줌 레벨별 마커 모드 (idle 콜백에서 갱신)
  const [markerMode, setMarkerMode] = useState<MarkerMode>(() => modeForZoom(zoom));

  // 모바일 바텀시트 / 필터시트
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>('peek');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // ── 차별화 레이어 토글 (중개업소/구인공고) ──
  const [showBrokers, setShowBrokers] = useState(false);
  const [showJobs, setShowJobs] = useState(false);

  const { data: brokerRows = [] } = useBrokersNearby(lawd_cd, showBrokers);
  const { data: jobs = [] } = useJobsNearby(lawd_cd, showJobs);

  // 구(시군구) 집계 — 줌아웃 시에만 fetch (React Query 1시간 캐시)
  const { data: guAggregates = [] } = useGuAggregates(property_type, markerMode === 'gu');

  // 동(洞) 집계 — viewport 단지 클라이언트 집계 (bounds 캡 500단지 기준)
  const dongAggregates = useMemo(
    () => (markerMode === 'dong' ? aggregateByDong(points, dongByKey) : []),
    [markerMode, points, dongByKey],
  );

  const aggregates = markerMode === 'gu' ? guAggregates : markerMode === 'dong' ? dongAggregates : [];

  // 중개업소 → 지도 마커 (좌표 보유분만)
  const brokerMarkers = useMemo(
    () =>
      brokerRows
        .filter((b) => b.latitude != null && b.longitude != null)
        .map((b) => ({ lat: b.latitude as number, lng: b.longitude as number, name: b.med_office_nm })),
    [brokerRows],
  );

  // ── 상태 → URL 동기화 (딥링크/공유) ──
  // 지도 위치는 mapViewRef에 보관(맵 idle 콜백이 갱신) — center/zoom state로 되먹이지 않아 피드백 루프 회피.
  const mapViewRef = useRef<{ lat: number; lng: number; zoom: number }>({
    lat: center[0],
    lng: center[1],
    zoom,
  });
  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const writeUrl = useCallback(() => {
    if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
    writeTimerRef.current = setTimeout(() => {
      const p = new URLSearchParams();
      p.set('lat', mapViewRef.current.lat.toFixed(5));
      p.set('lng', mapViewRef.current.lng.toFixed(5));
      p.set('zoom', mapViewRef.current.zoom.toFixed(2));
      p.set('deal', dealType);
      p.set('type', property_type);
      p.set('region', lawd_cd);
      if (areaBand !== 'all') p.set('area', areaBand);
      if (ageBand !== 'all') p.set('age', ageBand);
      if (householdBand !== 'all') p.set('hhld', householdBand);
      if (selectedKey) p.set('sel', selectedKey);
      router.replace(`/market?${p.toString()}`, { scroll: false });
    }, 400);
  }, [dealType, property_type, lawd_cd, areaBand, ageBand, householdBand, selectedKey, router]);

  useEffect(() => {
    writeUrl();
  }, [writeUrl]);

  // 지도 idle 시: URL 반영 + 마커 모드 갱신 + lawd_cd 자동 매핑 (지역 칩 대체)
  const handleMapViewChanged = useCallback(
    (lat: number, lng: number, z: number) => {
      mapViewRef.current = { lat, lng, zoom: z };
      setMarkerMode((prev) => {
        const next = modeForZoom(z);
        return prev === next ? prev : next;
      });
      setLawdCd((prev) => {
        const next = nearestLawdCd(lat, lng);
        return prev === next ? prev : next;
      });
      writeUrl();
    },
    [writeUrl],
  );

  useEffect(() => {
    // 구 집계 모드에서는 bounds 거래 조회 생략 (서버 집계 API만 사용 — 네트워크 절약)
    if (markerMode === 'gu') return;
    loadData(lawd_cd, boundsStr, property_type, dealType, areaBand, ageBand, householdBand);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lawd_cd, boundsStr, property_type, dealType, areaBand, ageBand, householdBand, markerMode]);

  const loadData = async (
    lc: string,
    bStr: string | null,
    pt: PropertyTypeFilter,
    dt: DealTypeFilter,
    ab: AreaBand,
    ag: AgeBand,
    hh: HouseholdBand,
  ) => {
    setLoading(true);
    try {
      // API deal: trade=매매, jeonse/wolse=rent (서버가 rent로 합쳐 가져옴), presale=분양권
      const apiDeal = dt === 'trade' ? 'trade' : dt === 'presale' ? 'presale_resale' : 'rent';

      type Tx = {
        complex_key: string;
        complex_name: string;
        dong: string | null;
        price_manwon: number;
        deposit_manwon: number;
        monthly_manwon: number;
        exclusive_area: number | null;
        build_year: number | null;
      };
      type CoordEntry = { lat: number | null; lng: number | null; hhld_cnt: number | null; build_year: number | null };
      let txs: Tx[] = [];
      let complex_coords: Record<string, CoordEntry> = {};

      // bounds 모드 우선 시도
      if (bStr) {
        const res = await fetch(`/api/market/transactions?bounds=${bStr}&type=${pt}&deal=${apiDeal}&months=6`);
        if (res.ok) {
          const data = await res.json();
          txs = (data.transactions || []) as Tx[];
          complex_coords = data.complex_coords || {};
        }
      }

      // bounds 결과 없거나 bounds 미설정(초기 마운트) → lawd_cd 모드 안전망
      if (txs.length === 0 && !bStr) {
        // 실거래 1~2개월 지연 고려, 최근 3개월 순차 시도
        const now = new Date();
        const candidateYms = [1, 2, 3].map((lag) => {
          const d = new Date(now.getFullYear(), now.getMonth() - lag, 1);
          return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
        });
        for (const ym of candidateYms) {
          const res = await fetch(`/api/market/transactions?lawd_cd=${lc}&ym=${ym}&type=${pt}&deal=${apiDeal}`);
          if (!res.ok) continue;
          const data = await res.json();
          const arr = (data.transactions || []) as Tx[];
          if (arr.length > 0) {
            txs = arr;
            complex_coords = data.complex_coords || {};
            break;
          }
        }
      }

      // 1차 필터: 거래 유형(매매/전세/월세/분양권) + 평형 + 연식
      const filtered = txs.filter((t) => {
        if (dt === 'trade' && !(t.price_manwon || 0)) return false;
        if (dt === 'presale' && !(t.price_manwon || 0)) return false;
        if (dt === 'jeonse' && !((t.monthly_manwon || 0) === 0 && (t.deposit_manwon || 0) > 0)) return false;
        if (dt === 'wolse' && !(t.monthly_manwon || 0)) return false;
        if (!matchAreaBand(t.exclusive_area, ab)) return false;
        const buildYear = t.build_year ?? complex_coords[t.complex_key]?.build_year;
        if (!matchAgeBand(buildYear, ag)) return false;
        return true;
      });

      // 단지별 평균 집계 — dealType에 따라 다른 필드 사용
      const map = new Map<string, { name: string; dong: string | null; deposits: number[]; monthlies: number[] }>();
      filtered.forEach((t) => {
        const mainPrice = (dt === 'trade' || dt === 'presale') ? t.price_manwon : t.deposit_manwon;
        if (!mainPrice) return;
        if (!map.has(t.complex_key)) {
          map.set(t.complex_key, { name: t.complex_name, dong: t.dong ?? null, deposits: [], monthlies: [] });
        }
        const entry = map.get(t.complex_key)!;
        entry.deposits.push(mainPrice);
        if (dt === 'wolse' && t.monthly_manwon) {
          entry.monthlies.push(t.monthly_manwon);
        }
      });

      // 좌표: complexes 마스터(백필 완료) 좌표만 사용 — 좌표 없는 단지는 마커 제외.
      // 세대수 필터는 단지 단위에 적용
      const dongMap: Record<string, string | null> = {};
      const pts: MapComplexPoint[] = Array.from(map.entries())
        .filter(([key]) => {
          const real = complex_coords[key];
          if (!real || real.lat == null || real.lng == null) return false;
          return matchHouseholdBand(real.hhld_cnt, hh);
        })
        .map(([key, v]) => {
          const real = complex_coords[key];
          dongMap[key] = v.dong;
          const avgDeposit = Math.round(v.deposits.reduce((a, b) => a + b, 0) / v.deposits.length);
          const avgMonthly = v.monthlies.length > 0
            ? Math.round(v.monthlies.reduce((a, b) => a + b, 0) / v.monthlies.length)
            : undefined;
          return {
            complex_key: key,
            complex_name: v.name,
            lat: real.lat!,
            lng: real.lng!,
            avg_price_manwon: avgDeposit,
            avg_monthly_manwon: avgMonthly,
            trade_count: v.deposits.length,
            property_type: pt,
          };
        });

      setPoints(pts);
      setDongByKey(dongMap);
    } catch (e) {
      console.error('[market] load error:', e);
      setPoints([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedPoint = selectedKey ? points.find((p) => p.complex_key === selectedKey) : undefined;

  // 단지 선택 (마커/리스트/검색) — 모바일은 시트 half로 올림
  const handleSelect = useCallback((key: string) => {
    setSelectedKey(key);
    setSheetSnap((s) => (s === 'peek' ? 'half' : s));
  }, []);

  // 검색 결과 클릭 — 지도 이동 + 단지 선택. 단지 마커가 보이는 줌으로 보정.
  const handleSearchSelect = useCallback((r: SearchResult) => {
    if (r.lat == null || r.lng == null) return;
    mapViewRef.current = { ...mapViewRef.current, lat: r.lat, lng: r.lng };
    setCenter([r.lat, r.lng]);
    setZoom((z) => Math.max(15, z));
    handleSelect(r.complex_key);
  }, [handleSelect]);

  // 리스트 행 클릭 — 선택 + 지도 이동
  const handleListSelect = useCallback((key: string, lat: number, lng: number) => {
    mapViewRef.current = { ...mapViewRef.current, lat, lng };
    setCenter([lat, lng]);
    handleSelect(key);
  }, [handleSelect]);

  // 지도 idle 시 viewport bounds 갱신 → loadData(bounds 모드)로 자동 전환.
  const handleMapBoundsChanged = useCallback(
    (sw_lat: number, sw_lng: number, ne_lat: number, ne_lng: number) => {
      const next = `${sw_lat.toFixed(6)},${sw_lng.toFixed(6)},${ne_lat.toFixed(6)},${ne_lng.toFixed(6)}`;
      setBoundsStr((prev) => (prev === next ? prev : next));
    },
    [],
  );

  const activeFilterCount =
    (areaBand !== 'all' ? 1 : 0) + (ageBand !== 'all' ? 1 : 0) + (householdBand !== 'all' ? 1 : 0);

  // 사이드 패널 내용 (데스크탑 좌측 / 모바일 바텀시트 공용)
  const sidePanelContent = selectedKey ? (
    <ComplexDetailView
      complexKey={selectedKey}
      point={selectedPoint}
      dealType={dealType}
      onClose={() => setSelectedKey(null)}
    />
  ) : (
    <ComplexListPanel
      points={points}
      dealType={dealType}
      loading={loading}
      markerMode={markerMode}
      selectedKey={selectedKey}
      onSelect={handleListSelect}
    />
  );

  return (
    <div className="relative h-screen flex flex-col bg-market-bg font-jakarta">
      {NAVER_CLIENT_ID && (
        // ⚠️ 파라미터는 ncpKeyId — ncpClientId는 deprecated로 silent fail (라이브 검증 완료 파라미터)
        <Script
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_CLIENT_ID}`}
          strategy="afterInteractive"
        />
      )}
      {/* 헤더 */}
      <header className="bg-market-surface/95 backdrop-blur border-b border-market-border sticky top-0 z-20">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-market-surface-2 text-market-text-mute transition-colors"
            aria-label="메인으로"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold flex items-center gap-2 text-market-text flex-shrink-0">
            <MapPin className="w-4 h-4 text-deal-trade" />
            시세·거래량 지도
          </h1>
          <div className="flex-1 flex justify-center px-2 max-w-md mx-auto">
            <MarketSearch onSelect={handleSearchSelect} />
          </div>
          <Link
            href="/market/rankings"
            className="ml-auto text-xs px-3 py-1.5 bg-market-surface-2 hover:bg-market-border rounded-lg text-market-text-mute font-medium flex items-center gap-1 transition-colors flex-shrink-0"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            랭킹
          </Link>
        </div>
      </header>

      {/* 필터바 — 1줄 (지역 칩 제거: 지도 이동 기반) */}
      <div className="bg-market-surface border-b border-market-border">
        <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <Filter className="w-3.5 h-3.5 text-market-text-faint flex-shrink-0 hidden md:block" />
          {/* 거래 유형 */}
          <div className="flex gap-1 flex-shrink-0">
            <FilterChip active={dealType === 'trade'} activeColor="bg-deal-trade" onClick={() => setDealType('trade')}>매매</FilterChip>
            <FilterChip active={dealType === 'jeonse'} activeColor="bg-deal-jeonse" onClick={() => setDealType('jeonse')}>전세</FilterChip>
            <FilterChip active={dealType === 'wolse'} activeColor="bg-deal-wolse" onClick={() => setDealType('wolse')}>월세</FilterChip>
            <FilterChip active={dealType === 'presale'} activeColor="bg-[#7c3aed]" onClick={() => setDealType('presale')}>분양권</FilterChip>
          </div>

          {/* 모바일: 통합 필터 버튼 */}
          <button
            onClick={() => setFilterSheetOpen(true)}
            className={`md:hidden flex items-center gap-1 px-3 py-1 text-xs rounded-full font-medium flex-shrink-0 transition-all ${
              activeFilterCount > 0 || property_type !== 'apt'
                ? 'bg-market-text text-white font-semibold shadow-sm'
                : 'bg-market-surface-2 text-market-text-mute'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            필터{activeFilterCount > 0 ? ` ${activeFilterCount}` : ''}
          </button>

          {/* 데스크탑: 매물유형 + 세부필터 popover */}
          <div className="hidden md:flex items-center gap-2">
            <div className="mx-1 h-4 w-px bg-market-border" />
            <div className="flex gap-1 flex-shrink-0">
              <FilterChip active={property_type === 'apt'} activeColor="bg-market-text" onClick={() => setPropertyType('apt')}>아파트</FilterChip>
              <FilterChip active={property_type === 'officetel'} activeColor="bg-market-text" onClick={() => setPropertyType('officetel')}>오피스텔</FilterChip>
            </div>
            <div className="mx-1 h-4 w-px bg-market-border" />
            <FilterPopover<AreaBand> label="평형" options={AREA_OPTIONS} value={areaBand} onChange={setAreaBand} />
            <FilterPopover<AgeBand> label="연식" options={AGE_OPTIONS} value={ageBand} onChange={setAgeBand} />
            <FilterPopover<HouseholdBand> label="세대수" options={HOUSEHOLD_OPTIONS} value={householdBand} onChange={setHouseholdBand} />
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setAreaBand('all');
                  setAgeBand('all');
                  setHouseholdBand('all');
                }}
                className="text-[11px] text-market-text-mute hover:text-market-text px-2 py-1 underline underline-offset-2 decoration-dotted whitespace-nowrap"
              >
                초기화
              </button>
            )}
          </div>

          {/* 우측: 레이어 토글 + 단지 수 */}
          <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
            <LayerToggle
              active={showBrokers}
              onClick={() => setShowBrokers((v) => !v)}
              icon={<Store className="w-3 h-3" />}
              activeClass="bg-teal-600 text-white"
            >
              중개업소{showBrokers && brokerMarkers.length > 0 ? ` ${brokerMarkers.length}` : ''}
            </LayerToggle>
            <LayerToggle
              active={showJobs}
              onClick={() => setShowJobs((v) => !v)}
              icon={<Briefcase className="w-3 h-3" />}
              activeClass="bg-deal-trade text-white"
            >
              구인{showJobs && jobs.length > 0 ? ` ${jobs.length}` : ''}
            </LayerToggle>
            <div className="hidden md:flex text-[11px] text-market-text-faint items-center gap-1 tabular-nums pl-1">
              <Building2 className="w-3 h-3" />
              {loading ? '로딩' : `${points.length}개 단지`}
            </div>
          </div>
        </div>
      </div>

      {/* 메인 영역: 데스크탑 좌측 패널 1개 + 지도 최대화 / 모바일 지도 + 바텀시트 */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* 데스크탑 좌측 통합 패널 — 미선택: 단지 리스트 / 선택: 상세+차트 */}
        <aside className="hidden md:flex md:w-[400px] md:flex-col md:border-r md:border-market-border md:bg-market-surface md:shadow-sm flex-shrink-0 overflow-hidden">
          {sidePanelContent}
        </aside>

        {/* 지도 영역 */}
        <div className="flex-1 relative min-w-0">
          <MarketMap
            center={center}
            zoom={zoom}
            points={points}
            onSelect={handleSelect}
            selectedKey={selectedKey}
            dealType={dealType}
            markerMode={markerMode}
            aggregates={aggregates}
            onBoundsChanged={handleMapBoundsChanged}
            onViewChanged={handleMapViewChanged}
            brokers={showBrokers ? brokerMarkers : undefined}
          />

          {/* 구인공고 오버레이 — 정밀 핀 대신 이 지역 채용 리스트 (jobs는 좌표 없음) */}
          {showJobs && (
            <div className="absolute top-3 left-3 z-10 w-[230px] max-h-[60%] bg-market-surface/97 backdrop-blur border border-market-border rounded-xl shadow-xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-market-border flex-shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-bold text-market-text">
                  <Briefcase className="w-3.5 h-3.5 text-deal-trade" />
                  이 지역 채용 {jobs.length}건
                </div>
                <button
                  onClick={() => setShowJobs(false)}
                  className="text-market-text-faint hover:text-market-text"
                  aria-label="닫기"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="overflow-y-auto overscroll-contain">
                {jobs.length === 0 ? (
                  <div className="px-3 py-6 text-center text-[11px] text-market-text-faint">
                    이 지역 활성 공고가 없습니다
                  </div>
                ) : (
                  jobs.map((j) => (
                    <Link
                      key={j.id}
                      href={`/agent/jobs/${j.id}`}
                      className="block px-3 py-2 hover:bg-market-surface-2 transition-colors border-b border-market-border/40 last:border-b-0"
                    >
                      <div className="text-xs font-semibold text-market-text truncate">{j.title}</div>
                      <div className="text-[10px] text-market-text-mute mt-0.5 truncate">
                        {j.company || '회사명 비공개'}
                        {j.category ? ` · ${j.category}` : ''}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 모바일 바텀시트 — peek/half/full 스냅 (지도 가시성 유지) */}
        <BottomSheet
          snap={sheetSnap}
          onSnapChange={setSheetSnap}
          peekContent={
            selectedKey && selectedPoint ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-market-text truncate">{selectedPoint.complex_name}</div>
                  <div className="text-[11px] text-market-text-mute tabular-nums">거래 {selectedPoint.trade_count}건</div>
                </div>
                <div className="text-lg font-extrabold text-deal-trade tabular-nums flex-shrink-0">
                  {formatKoreanPrice(selectedPoint.avg_price_manwon, 'compact')}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-market-text">
                <Building2 className="w-4 h-4 text-market-text-mute" />
                지도 내 단지 <span className="tabular-nums">{loading ? '…' : points.length.toLocaleString()}</span>개
              </div>
            )
          }
        >
          {sidePanelContent}
        </BottomSheet>
      </div>

      {/* 모바일 필터 시트 */}
      <MarketFilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        propertyType={property_type}
        onPropertyType={setPropertyType}
        areaBand={areaBand}
        onAreaBand={setAreaBand}
        ageBand={ageBand}
        onAgeBand={setAgeBand}
        householdBand={householdBand}
        onHouseholdBand={setHouseholdBand}
      />
    </div>
  );
}

// 라이트 톤 필터 칩
function FilterChip({
  active,
  activeColor,
  onClick,
  children,
}: {
  active: boolean;
  activeColor: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
        active
          ? `${activeColor} text-white font-semibold shadow-sm`
          : 'bg-market-surface-2 text-market-text-mute hover:bg-market-border'
      }`}
    >
      {children}
    </button>
  );
}

// 차별화 레이어 토글 칩 (중개업소/구인공고)
function LayerToggle({
  active,
  onClick,
  icon,
  activeClass,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  activeClass: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[11px] rounded-full font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
        active ? `${activeClass} font-semibold shadow-sm` : 'bg-market-surface-2 text-market-text-mute hover:bg-market-border'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

// 드롭다운 필터 popover (평형/연식/세대수) — 데스크탑 전용
function FilterPopover<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = value !== options[0].value;
  const activeOption = options.find((o) => o.value === value);
  return (
    <div className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={`px-3 py-1 text-xs rounded-full font-medium transition-all flex items-center gap-1 whitespace-nowrap ${
          isActive
            ? 'bg-market-text text-white font-semibold shadow-sm'
            : 'bg-market-surface-2 text-market-text-mute hover:bg-market-border'
        }`}
      >
        <span>{label}</span>
        {isActive && activeOption && (
          <span className="opacity-90">· {activeOption.label.split(' ')[0]}</span>
        )}
        <span className="text-[8px] ml-0.5">▼</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 bg-market-surface border border-market-border rounded-xl shadow-xl z-40 py-1.5 min-w-[180px]">
            {options.map((opt) => {
              const selected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-xs text-left hover:bg-market-surface-2 transition-colors flex items-center justify-between ${
                    selected ? 'font-bold text-market-text' : 'text-market-text-mute'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selected && <span className="text-deal-jeonse">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
