'use client';

import { useEffect, useRef, useState } from 'react';

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || '';

export interface MapComplexPoint {
  complex_key: string;
  complex_name: string;
  lat: number;
  lng: number;
  avg_price_manwon: number;
  trade_count: number;
  growth_pct?: number | null;
  property_type: 'apt' | 'officetel' | 'villa' | 'store' | 'presale';
}

interface MarketMapProps {
  center: [number, number];
  zoom?: number;
  points: MapComplexPoint[];
  onSelect?: (key: string) => void;
  height?: string;
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
  destroy?: () => void;
}

interface NaverLatLng {
  lat: () => number;
  lng: () => number;
}

interface NaverMarker {
  setMap: (m: NaverMap | null) => void;
  getPosition: () => NaverLatLng;
}

let scriptLoadPromise: Promise<void> | null = null;

function loadNaverMapScript(clientId: string): Promise<void> {
  if (typeof window !== 'undefined' && window.naver?.maps) {
    return Promise.resolve();
  }
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-naver-maps]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}`;
    script.async = true;
    script.defer = true;
    script.dataset.naverMaps = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('네이버 지도 스크립트 로드 실패'));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

function buildMarkerHTML(p: MapComplexPoint): string {
  const price = p.avg_price_manwon;
  const label = price >= 10000
    ? `${Math.floor(price / 10000)}억${price % 10000 > 0 ? `${Math.round((price % 10000) / 100)}` : ''}`
    : `${price.toLocaleString()}`;
  const growth = p.growth_pct;
  const bg = p.property_type === 'officetel'
    ? 'rgba(244,114,182,0.95)'
    : 'rgba(34,211,238,0.95)';
  const growthBadge = growth != null
    ? `<span style="margin-left:4px;font-size:9px;font-weight:800;color:${growth > 0 ? '#fca5a5' : '#93c5fd'};">${growth > 0 ? '↑' : '↓'}${Math.abs(growth).toFixed(1)}%</span>`
    : '';

  return `
    <div style="
      background:${bg};
      color:#0B0F14;
      padding:3px 8px;
      border-radius:12px;
      font-weight:800;
      font-size:11px;
      white-space:nowrap;
      box-shadow:0 2px 8px rgba(0,0,0,0.4);
      border:1.5px solid rgba(255,255,255,0.6);
      cursor:pointer;
      transform:translate(-50%, -100%);
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    ">
      ${label}${growthBadge}
    </div>
  `;
}

export default function MarketMap({
  center,
  zoom = 13,
  points,
  onSelect,
  height = '100%',
}: MarketMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<NaverMap | null>(null);
  const markersRef = useRef<NaverMarker[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!NAVER_CLIENT_ID) {
      setLoadError('NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 환경변수가 설정되지 않았습니다');
      return;
    }
    if (!containerRef.current) return;

    let cancelled = false;

    loadNaverMapScript(NAVER_CLIENT_ID)
      .then(() => {
        if (cancelled || !containerRef.current || !window.naver) return;
        const { naver } = window;
        mapRef.current = new naver.maps.Map(containerRef.current, {
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
      })
      .catch((e) => {
        if (!cancelled) setLoadError(e.message);
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => {
        try { m.setMap(null); } catch { /* SDK internal state, ignore */ }
      });
      markersRef.current = [];
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

    markersRef.current.forEach((m) => {
      try { m.setMap(null); } catch { /* ignore stale marker */ }
    });
    markersRef.current = [];

    const makeMarker = (p: MapComplexPoint, idx: number) => {
      try {
        const jitterLat = p.lat + (idx % 7) * 0.0001;
        const jitterLng = p.lng + (idx % 11) * 0.0001;
        const marker = new naver.maps.Marker({
          position: new naver.maps.LatLng(jitterLat, jitterLng),
          map: mapRef.current,
          icon: {
            content: buildMarkerHTML(p),
            size: new naver.maps.Size(0, 0),
            anchor: new naver.maps.Point(0, 0),
          },
          zIndex: p.property_type === 'officetel' ? 50 : 100,
        });
        naver.maps.Event.addListener(marker, 'click', () => {
          onSelect?.(p.complex_key);
        });
        return marker;
      } catch {
        return null;
      }
    };

    markersRef.current = points
      .map(makeMarker)
      .filter((m): m is NaverMarker => m !== null);
  }, [points, onSelect]);

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

  return (
    <div style={{ height, width: '100%' }} className="relative">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-900/80 text-slate-300 text-sm px-4 py-2 rounded-lg border border-slate-700">
            이 지역의 최근 거래 데이터가 아직 수집되지 않았습니다
          </div>
        </div>
      )}
    </div>
  );
}
