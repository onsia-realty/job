'use client';

import { useEffect, useRef, useState } from 'react';
import { formatKoreanPrice } from '@/lib/market/format';

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || '';

export type DealTypeFilter = 'trade' | 'jeonse' | 'wolse' | 'presale';

export interface MapComplexPoint {
  complex_key: string;
  complex_name: string;
  lat: number;
  lng: number;
  avg_price_manwon: number;          // trade=매매가, jeonse=보증금, wolse=보증금
  avg_monthly_manwon?: number;       // wolse일 때만 사용 (월세)
  trade_count: number;
  growth_pct?: number | null;
  property_type: 'apt' | 'officetel' | 'villa' | 'store' | 'presale';
}

export type MarkerMode = 'complex' | 'dong' | 'gu';

export interface MapAggregatePoint {
  key: string;
  name: string;
  lat: number;
  lng: number;
  avg_price_manwon: number;
  trade_count: number;
  complex_count: number;
}

interface MarketMapProps {
  center: [number, number];
  zoom?: number;
  points: MapComplexPoint[];
  onSelect?: (key: string) => void;
  selectedKey?: string | null;
  height?: string;
  dealType?: DealTypeFilter;
  // 줌 레벨별 마커 모드 — gu(구 집계)/dong(동 집계)/complex(단지 개별)
  markerMode?: MarkerMode;
  aggregates?: MapAggregatePoint[];
  onCenterChanged?: (lat: number, lng: number) => void;  // 지도 idle 시 중심 콜백 (legacy)
  // viewport bounds 콜백 — idle 시 SW/NE 모서리 좌표 전달. bounds 기반 데이터 조회용.
  onBoundsChanged?: (sw_lat: number, sw_lng: number, ne_lat: number, ne_lng: number) => void;
  // 지도 idle 시 현재 중심+줌 콜백 — URL 동기화(딥링크)용.
  onViewChanged?: (lat: number, lng: number, zoom: number) => void;
  // 중개업소 보조 마커 (차별화 레이어 — 토글 on일 때만)
  brokers?: Array<{ lat: number; lng: number; name: string }>;
}

// naver.maps 타입 선언 (공식 @types 없음)
declare global {
  interface Window {
    naver?: {
      maps: {
        Map: new (el: HTMLElement, opts: object) => NaverMap;
        LatLng: new (lat: number, lng: number) => NaverLatLng;
        Marker: new (opts: object) => NaverMarker;
        Size: new (w: number, h: number) => object;
        Point: new (x: number, y: number) => object;
        Event: {
          addListener: (tgt: object, evt: string, fn: (...a: unknown[]) => void) => object;
          removeListener: (listener: object) => void;
        };
        Position: { BOTTOM_RIGHT: number; TOP_RIGHT: number };
        ZoomControlStyle: { SMALL: number };
      };
    };
  }
}

interface NaverMap {
  setCenter: (latlng: NaverLatLng) => void;
  setZoom: (z: number) => void;
  getCenter: () => NaverLatLng;
  getZoom: () => number;
  getBounds: () => NaverLatLngBounds;
  destroy?: () => void;
}

interface NaverLatLng {
  lat: () => number;
  lng: () => number;
}

interface NaverLatLngBounds {
  getMin: () => NaverLatLng;  // SW
  getMax: () => NaverLatLng;  // NE
}

interface NaverMarker {
  setMap: (m: NaverMap | null) => void;
  getPosition: () => NaverLatLng;
  setPosition: (latlng: NaverLatLng) => void;
  setIcon: (icon: { content: string; size: object; anchor: object }) => void;
  setZIndex: (z: number) => void;
}

// SDK는 페이지 레벨 <Script strategy="afterInteractive">로 로드.
// 여기서는 window.naver.maps 가 채워질 때까지 폴링.
// 단, 인증 실패 시 SDK가 window.naver.maps = null 로 박는 케이스도 처리.
function waitForNaverMaps(timeoutMs = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const m = typeof window !== 'undefined' ? window.naver?.maps : null;
      if (m && typeof m.Map === 'function') {
        resolve();
        return;
      }
      // null 명시 박힘 = 인증 실패 신호
      if (typeof window !== 'undefined' && window.naver && window.naver.maps === null) {
        reject(new Error('네이버 지도 SDK 인증 실패 (NCP 화이트리스트 확인 필요)'));
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('네이버 지도 SDK 로드 타임아웃'));
        return;
      }
      setTimeout(tick, 100);
    };
    tick();
  });
}

// 거래유형별 단색 hue 농도 램프 (Q1 저가 → Q5 고가).
// 호갱노노식 — 색상(hue)은 거래유형이 결정, 가격 분위는 명도만 바꾼다.
const DEAL_RAMPS: Record<DealTypeFilter, [string, string, string, string, string]> = {
  trade:   ['#fb7185', '#f43f5e', '#e11d48', '#be123c', '#9f1239'], // rose
  jeonse:  ['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'], // blue
  wolse:   ['#34d399', '#10b981', '#059669', '#047857', '#065f46'], // emerald
  presale: ['#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'], // violet
};

function quintileOf(price: number, sortedPrices: number[]): number {
  if (sortedPrices.length === 0) return 2;
  // index of price in sortedPrices (or where it would be)
  let lo = 0, hi = sortedPrices.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sortedPrices[mid] < price) lo = mid + 1;
    else hi = mid;
  }
  const ratio = lo / sortedPrices.length; // 0..1
  return Math.min(4, Math.floor(ratio * 5));
}

const MARKER_FONT = `'Plus Jakarta Sans', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

// 네이버페이 부동산식 마커 — 가격(크게) + 단지명(작게) 말풍선 + 하단 꼬리 + 거래건수 뱃지.
function buildMarkerHTML(p: MapComplexPoint, quintile: number, isSelected: boolean, dealType: DealTypeFilter = 'trade'): string {
  const bg = DEAL_RAMPS[dealType][quintile];
  const priceLabel = formatKoreanPrice(p.avg_price_manwon, 'compact');

  // 거래 유형 표시: 매매는 가격만, 전세/분양권은 작은 prefix, 월세는 보증금/월세
  const prefix = dealType === 'jeonse' ? '전' : dealType === 'presale' ? '분' : '';
  const prefixHtml = prefix
    ? `<span style="font-size:9px;font-weight:700;opacity:0.85;margin-right:2px;vertical-align:1px;">${prefix}</span>`
    : '';
  const priceHtml = dealType === 'wolse' && p.avg_monthly_manwon
    ? `${priceLabel}<span style="font-size:10px;font-weight:700;opacity:0.9;">/${p.avg_monthly_manwon}</span>`
    : `${prefixHtml}${priceLabel}`;

  // 단지명 6자 컷
  const nameRaw = p.complex_name || '';
  const nameLabel = nameRaw.length > 7 ? `${nameRaw.slice(0, 6)}…` : nameRaw;

  // 오피스텔 식별 점 (단지명 줄 앞)
  const typeDot = p.property_type === 'officetel'
    ? `<span style="display:inline-block;width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.9);margin-right:3px;vertical-align:middle;"></span>`
    : '';

  // 거래건수 뱃지 (우상단, 1건이면 숨김)
  const countBadge = p.trade_count > 1
    ? `<div style="
        position:absolute;top:-7px;right:-7px;
        min-width:17px;height:17px;padding:0 4px;border-radius:9px;
        background:#ffffff;color:${bg};
        font-size:9px;font-weight:800;line-height:17px;text-align:center;
        box-shadow:0 1px 3px rgba(0,0,0,0.28);
        font-variant-numeric:tabular-nums;
      ">${p.trade_count > 99 ? '99+' : p.trade_count}</div>`
    : '';

  const wrapperTransform = isSelected
    ? 'transform: translate(-50%, -100%) scale(1.12);'
    : 'transform: translate(-50%, -100%);';
  const wrapperZ = isSelected ? 1000 : (p.property_type === 'officetel' ? 50 : 100);
  const bubbleShadow = isSelected
    ? `box-shadow: 0 0 0 2px #ffffff, 0 0 0 3.5px ${bg}, 0 12px 24px -6px rgba(0,0,0,0.35);`
    : 'box-shadow: 0 4px 12px -2px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.1);';

  return `
    <div style="
      ${wrapperTransform}
      transform-origin: 50% 100%;
      z-index: ${wrapperZ};
      cursor: pointer;
      transition: transform 0.15s ease-out;
    ">
      <div style="
        position: relative;
        background: ${bg};
        color: #ffffff;
        padding: 4px 10px 3px;
        border-radius: 8px;
        ${bubbleShadow}
        font-family: ${MARKER_FONT};
        text-align: center;
        font-variant-numeric: tabular-nums;
        min-width: 48px;
        max-width: 110px;
      ">
        <div style="
          font-size: 14px;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.02em;
          white-space: nowrap;
        ">${priceHtml}</div>
        <div style="
          font-size: 9.5px;
          font-weight: 500;
          line-height: 1.2;
          color: rgba(255,255,255,0.88);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">${typeDot}${nameLabel}</div>
        ${countBadge}
      </div>
      <div style="
        width: 0; height: 0; margin: 0 auto;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 6px solid ${bg};
        filter: drop-shadow(0 2px 1px rgba(0,0,0,0.12));
      "></div>
    </div>
  `;
}

// 집계 마커 — 구(원형) / 동(둥근 사각). 클릭 시 드릴다운 줌인.
function buildAggMarkerHTML(a: MapAggregatePoint, level: 'gu' | 'dong', dealType: DealTypeFilter): string {
  const accent = DEAL_RAMPS[dealType][2]; // 중간 농도
  const priceLabel = formatKoreanPrice(a.avg_price_manwon, 'compact');

  if (level === 'gu') {
    return `
      <div style="
        transform: translate(-50%, -50%);
        z-index: 80; cursor: pointer;
        transition: transform 0.15s ease-out;
      ">
        <div style="
          width: 68px; height: 68px; border-radius: 50%;
          background: ${accent}e6;
          border: 2px solid rgba(255,255,255,0.95);
          box-shadow: 0 6px 16px -4px rgba(0,0,0,0.3);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          font-family: ${MARKER_FONT}; color: #fff; text-align: center;
          font-variant-numeric: tabular-nums;
        ">
          <div style="font-size:10px;font-weight:600;line-height:1.2;opacity:0.92;max-width:60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.name}</div>
          <div style="font-size:13px;font-weight:800;line-height:1.2;letter-spacing:-0.02em;">${priceLabel}</div>
          <div style="font-size:9px;font-weight:600;opacity:0.85;line-height:1.2;">${a.trade_count.toLocaleString()}건</div>
        </div>
      </div>
    `;
  }

  // dong — pill형
  return `
    <div style="
      transform: translate(-50%, -50%);
      z-index: 80; cursor: pointer;
      transition: transform 0.15s ease-out;
    ">
      <div style="
        background: ${accent}f2;
        border: 1.5px solid rgba(255,255,255,0.95);
        border-radius: 14px;
        padding: 4px 11px;
        box-shadow: 0 4px 12px -2px rgba(0,0,0,0.28);
        font-family: ${MARKER_FONT}; color: #fff; text-align: center;
        font-variant-numeric: tabular-nums;
      ">
        <div style="font-size:9.5px;font-weight:600;line-height:1.2;opacity:0.92;white-space:nowrap;">${a.name} · ${a.complex_count}단지</div>
        <div style="font-size:13px;font-weight:800;line-height:1.2;letter-spacing:-0.02em;white-space:nowrap;">${priceLabel}</div>
      </div>
    </div>
  `;
}

// 중개업소 보조 마커 — 시세 마커와 시각 구분되는 작은 청록 배지.
function buildBrokerMarkerHTML(name: string): string {
  const label = name.length > 7 ? `${name.slice(0, 6)}…` : name;
  return `
    <div style="transform: translate(-50%, -50%); z-index: 30; cursor: default;">
      <div style="
        display: flex; align-items: center; gap: 3px;
        background: #0d9488; color: #ffffff;
        padding: 2px 6px; border-radius: 8px;
        border: 1.5px solid rgba(255,255,255,0.92);
        box-shadow: 0 2px 6px rgba(0,0,0,0.18);
        font-family: 'Plus Jakarta Sans', Pretendard, -apple-system, sans-serif;
        font-size: 9.5px; font-weight: 700; white-space: nowrap;
      ">
        <span style="width:5px;height:5px;border-radius:50%;background:#fff;"></span>${label}
      </div>
    </div>
  `;
}

export default function MarketMap({
  center,
  zoom = 13,
  points,
  onSelect,
  selectedKey = null,
  height = '100%',
  dealType = 'trade',
  markerMode = 'complex',
  aggregates = [],
  onCenterChanged,
  onBoundsChanged,
  onViewChanged,
  brokers,
}: MarketMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMap | null>(null);
  // 단지 마커 diff 렌더용 — key별 마커 + 마지막 렌더 HTML/좌표 캐시 (변경분만 setIcon/setPosition)
  const markersRef = useRef<Map<string, { marker: NaverMarker; html: string; lat: number; lng: number }>>(new Map());
  const aggMarkersRef = useRef<NaverMarker[]>([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const brokerMarkersRef = useRef<NaverMarker[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const onCenterChangedRef = useRef(onCenterChanged);
  onCenterChangedRef.current = onCenterChanged;
  const onBoundsChangedRef = useRef(onBoundsChanged);
  onBoundsChangedRef.current = onBoundsChanged;
  const onViewChangedRef = useRef(onViewChanged);
  onViewChangedRef.current = onViewChanged;

  useEffect(() => {
    if (!NAVER_CLIENT_ID) {
      setLoadError('NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경변수가 설정되지 않았습니다');
      return;
    }
    if (!containerRef.current) return;

    let cancelled = false;

    waitForNaverMaps()
      .then(() => {
        if (cancelled || !containerRef.current || !window.naver?.maps) return;
        const { naver } = window;
        const map = new naver.maps.Map(containerRef.current, {
          center: new naver.maps.LatLng(center[0], center[1]),
          zoom,
          minZoom: 8,
          maxZoom: 19,
          scaleControl: false,
          logoControl: true,
          mapDataControl: false,
          zoomControl: true,
          zoomControlOptions: {
            position: naver.maps.Position.TOP_RIGHT,
            style: naver.maps.ZoomControlStyle.SMALL,
          },
        });
        mapRef.current = map;

        // idle = panning/zoom 종료 시 발생. 중심 + bounds 콜백 모두 전달.
        naver.maps.Event.addListener(map, 'idle', () => {
          const c = map.getCenter();
          onCenterChangedRef.current?.(c.lat(), c.lng());
          try { onViewChangedRef.current?.(c.lat(), c.lng(), map.getZoom()); } catch { /* ignore */ }
          if (onBoundsChangedRef.current) {
            try {
              const b = map.getBounds();
              const sw = b.getMin();
              const ne = b.getMax();
              onBoundsChangedRef.current(sw.lat(), sw.lng(), ne.lat(), ne.lng());
            } catch { /* SDK 인스턴스 상태 이슈 — 무시 */ }
          }
        });

        // 초기 마운트 직후에도 한 번 bounds 발화 (idle 이벤트 전에 데이터 채우려고)
        setTimeout(() => {
          if (cancelled || !onBoundsChangedRef.current) return;
          try {
            const b = map.getBounds();
            const sw = b.getMin();
            const ne = b.getMax();
            onBoundsChangedRef.current(sw.lat(), sw.lng(), ne.lat(), ne.lng());
          } catch { /* ignore */ }
        }, 0);
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e.message);
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach(({ marker }) => {
        try { marker.setMap(null); } catch { /* SDK internal state, ignore */ }
      });
      markersRef.current = new Map();
      aggMarkersRef.current.forEach((m) => {
        try { m.setMap(null); } catch { /* ignore */ }
      });
      aggMarkersRef.current = [];
      brokerMarkersRef.current.forEach((m) => {
        try { m.setMap(null); } catch { /* ignore */ }
      });
      brokerMarkersRef.current = [];
      // map.destroy() 호출 시 Naver SDK 내부 상태가 깨져
      // 재마운트(Strict Mode / dynamic import) 때 Marker 생성 실패 발생.
      // 컨테이너 DOM 제거로 GC에 맡기는 게 안전.
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !window.naver?.maps) return;
    mapRef.current.setCenter(new window.naver.maps.LatLng(center[0], center[1]));
    mapRef.current.setZoom(zoom);
  }, [center, zoom]);

  useEffect(() => {
    if (!mapRef.current) return;
    const naver = window.naver;
    if (!naver?.maps?.Marker || !naver.maps.LatLng) return;

    // 집계 모드에서는 단지 마커 전체 숨김
    if (markerMode !== 'complex') {
      markersRef.current.forEach(({ marker }) => {
        try { marker.setMap(null); } catch { /* ignore */ }
      });
      markersRef.current = new Map();
      return;
    }

    // 5분위 계산용 정렬된 가격 배열 (binary search lookup)
    const sortedPrices = points.map((p) => p.avg_price_manwon).sort((a, b) => a - b);
    const existing = markersRef.current;
    const nextKeys = new Set(points.map((p) => p.complex_key));

    // 1) 사라진 단지 마커 제거
    for (const [key, entry] of existing) {
      if (!nextKeys.has(key)) {
        try { entry.marker.setMap(null); } catch { /* ignore stale marker */ }
        existing.delete(key);
      }
    }

    // 2) 신규 생성 / 변경분만 setIcon (선택 변경 시 2개만 갱신됨)
    for (const p of points) {
      const q = quintileOf(p.avg_price_manwon, sortedPrices);
      const isSelected = selectedKey === p.complex_key;
      const html = buildMarkerHTML(p, q, isSelected, dealType);
      const zIndex = isSelected ? 1000 : (p.property_type === 'officetel' ? 50 : 100);
      const entry = existing.get(p.complex_key);

      if (entry) {
        try {
          if (entry.html !== html) {
            entry.marker.setIcon({
              content: html,
              size: new naver.maps.Size(0, 0),
              anchor: new naver.maps.Point(0, 0),
            });
            entry.marker.setZIndex(zIndex);
            entry.html = html;
          }
          if (entry.lat !== p.lat || entry.lng !== p.lng) {
            entry.marker.setPosition(new naver.maps.LatLng(p.lat, p.lng));
            entry.lat = p.lat;
            entry.lng = p.lng;
          }
        } catch { /* ignore */ }
        continue;
      }

      try {
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(p.lat, p.lng),
          map: mapRef.current,
          icon: {
            content: html,
            size: new naver.maps.Size(0, 0),
            anchor: new naver.maps.Point(0, 0),
          },
          zIndex,
        });
        const key = p.complex_key;
        naver.maps.Event.addListener(marker, 'click', () => {
          onSelectRef.current?.(key);
        });
        existing.set(key, { marker, html, lat: p.lat, lng: p.lng });
      } catch { /* ignore */ }
    }
  }, [points, selectedKey, dealType, markerMode]);

  // 집계 마커 (구/동) — 수가 적어 전량 재생성. 클릭 시 드릴다운 줌인.
  useEffect(() => {
    if (!mapRef.current) return;
    const naver = window.naver;
    if (!naver?.maps?.Marker || !naver.maps.LatLng) return;

    aggMarkersRef.current.forEach((m) => {
      try { m.setMap(null); } catch { /* ignore */ }
    });
    aggMarkersRef.current = [];

    if (markerMode === 'complex' || aggregates.length === 0) return;
    const level = markerMode;

    aggMarkersRef.current = aggregates
      .map((a) => {
        try {
          const marker = new naver.maps.Marker({
            position: new naver.maps.LatLng(a.lat, a.lng),
            map: mapRef.current,
            icon: {
              content: buildAggMarkerHTML(a, level, dealType),
              size: new naver.maps.Size(0, 0),
              anchor: new naver.maps.Point(0, 0),
            },
            zIndex: 80,
          });
          naver.maps.Event.addListener(marker, 'click', () => {
            const map = mapRef.current;
            if (!map || !window.naver?.maps) return;
            // 구 → 동(12), 동 → 단지(14) 드릴다운
            map.setCenter(new window.naver.maps.LatLng(a.lat, a.lng));
            map.setZoom(level === 'gu' ? 12 : 14);
          });
          return marker;
        } catch {
          return null;
        }
      })
      .filter((m): m is NaverMarker => m !== null);
  }, [aggregates, markerMode, dealType]);

  // 중개업소 보조 마커 레이어 (토글 on일 때만 brokers 전달됨)
  useEffect(() => {
    if (!mapRef.current) return;
    const naver = window.naver;
    if (!naver?.maps?.Marker || !naver.maps.LatLng) return;

    brokerMarkersRef.current.forEach((m) => {
      try { m.setMap(null); } catch { /* ignore stale marker */ }
    });
    brokerMarkersRef.current = [];

    if (!brokers || brokers.length === 0) return;

    brokerMarkersRef.current = brokers
      .map((b) => {
        try {
          return new naver.maps.Marker({
            position: new naver.maps.LatLng(b.lat, b.lng),
            map: mapRef.current,
            icon: {
              content: buildBrokerMarkerHTML(b.name),
              size: new naver.maps.Size(0, 0),
              anchor: new naver.maps.Point(0, 0),
            },
            zIndex: 30,
          });
        } catch {
          return null;
        }
      })
      .filter((m): m is NaverMarker => m !== null);
  }, [brokers]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0B0F14] text-slate-400 text-sm px-4 text-center">
        <div>
          <p className="mb-2">{loadError}</p>
          <p className="text-xs text-slate-500">Vercel 환경변수 NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 확인 필요</p>
        </div>
      </div>
    );
  }

  // outer는 부모(`flex-1 relative`)의 빈 공간을 absolute로 채움
  // CSS flex item 안에서 height:100% 가 0으로 계산되는 케이스 회피
  return (
    <div
      style={height === '100%' ? { position: 'absolute', inset: 0 } : { height, width: '100%' }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {markerMode === 'complex' && points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 text-market-text-mute text-sm px-4 py-2.5 rounded-xl border border-market-border shadow-lg font-jakarta">
            이 지역의 최근 거래 데이터가 아직 수집되지 않았습니다
          </div>
        </div>
      )}
    </div>
  );
}
