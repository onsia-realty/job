'use client';

import { useEffect, useRef, useState } from 'react';

const KAKAO_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY || '';

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

// kakao.maps 타입 (공식 @types 미사용)
declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (cb: () => void) => void;
        Map: new (el: HTMLElement, opts: object) => KakaoMap;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        CustomOverlay: new (opts: object) => KakaoOverlay;
        event: {
          addListener: (tgt: object, evt: string, fn: (...a: unknown[]) => void) => void;
        };
      };
    };
  }
}

interface KakaoMap {
  setCenter: (latlng: KakaoLatLng) => void;
  setLevel: (level: number) => void;
}

interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

interface KakaoOverlay {
  setMap: (m: KakaoMap | null) => void;
}

// 카카오 Maps SDK 동적 로딩 (한 번만)
let scriptLoadPromise: Promise<void> | null = null;

function loadKakaoMapScript(appKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.kakao?.maps) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-maps]');
    const onLoaded = () => {
      if (!window.kakao) {
        reject(new Error('kakao 전역 객체 누락'));
        return;
      }
      // autoload=false 이므로 수동 load 호출 필요
      window.kakao.maps.load(() => resolve());
    };

    if (existing) {
      existing.addEventListener('load', onLoaded);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.defer = true;
    script.dataset.kakaoMaps = 'true';
    script.onload = onLoaded;
    script.onerror = () => reject(new Error('카카오 지도 스크립트 로드 실패'));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

// Naver zoom(8~19) ↔ Kakao level(14~1) 근사 변환
// Naver zoom 값이 클수록 확대, Kakao level 값이 작을수록 확대
function naverZoomToKakaoLevel(zoom: number): number {
  // 대략 Naver 13 ≈ Kakao 6, 선형 근사
  const level = Math.round(19 - zoom + 1);
  return Math.max(1, Math.min(14, level));
}

// 마커(커스텀 오버레이) HTML
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
    <div data-complex-key="${p.complex_key}" style="
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
  const mapRef = useRef<KakaoMap | null>(null);
  const overlaysRef = useRef<KakaoOverlay[]>([]);
  const onSelectRef = useRef(onSelect);
  const [loadError, setLoadError] = useState<string | null>(null);

  // onSelect 최신값을 ref로 유지 (리스너 재등록 없이 사용)
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // 스크립트 + 지도 초기화 (1회)
  useEffect(() => {
    if (!KAKAO_APP_KEY) {
      setLoadError('NEXT_PUBLIC_KAKAO_MAP_KEY 환경변수가 설정되지 않았습니다');
      return;
    }
    if (!containerRef.current) return;

    let cancelled = false;

    loadKakaoMapScript(KAKAO_APP_KEY)
      .then(() => {
        if (cancelled || !containerRef.current || !window.kakao?.maps) return;
        const { kakao } = window;
        mapRef.current = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(center[0], center[1]),
          level: naverZoomToKakaoLevel(zoom),
          draggable: true,
          scrollwheel: true,
        });
      })
      .catch((e: Error) => {
        if (!cancelled) setLoadError(e.message);
      });

    return () => {
      cancelled = true;
      overlaysRef.current.forEach((o) => o.setMap(null));
      overlaysRef.current = [];
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // center/zoom 변경 반영
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;
    mapRef.current.setCenter(new window.kakao.maps.LatLng(center[0], center[1]));
    mapRef.current.setLevel(naverZoomToKakaoLevel(zoom));
  }, [center, zoom]);

  // 오버레이 재생성 (points 변경 시)
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;
    const { kakao } = window;
    const map = mapRef.current;

    // 기존 오버레이 제거
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    // 동일 좌표 겹침 방지 (지터링)
    const makeOverlay = (p: MapComplexPoint, idx: number) => {
      const jitterLat = p.lat + (idx % 7) * 0.0001;
      const jitterLng = p.lng + (idx % 11) * 0.0001;
      const content = document.createElement('div');
      content.innerHTML = buildMarkerHTML(p);
      const inner = content.firstElementChild as HTMLElement | null;
      if (inner) {
        inner.addEventListener('click', (ev) => {
          ev.stopPropagation();
          onSelectRef.current?.(p.complex_key);
        });
      }
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(jitterLat, jitterLng),
        content,
        yAnchor: 1,
        xAnchor: 0.5,
        zIndex: p.property_type === 'officetel' ? 50 : 100,
        clickable: true,
      });
      overlay.setMap(map);
      return overlay;
    };

    overlaysRef.current = points.map(makeOverlay);
  }, [points]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0B0F14] text-slate-400 text-sm px-4 text-center">
        <div>
          <p className="mb-2">{loadError}</p>
          <p className="text-xs text-slate-500">Kakao Developer Console에서 도메인 등록 상태를 확인해 주세요</p>
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
