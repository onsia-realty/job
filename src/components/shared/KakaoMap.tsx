'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => unknown;
        Map: new (container: HTMLElement, options: { center: unknown; level: number }) => {
          setCenter: (latlng: unknown) => void;
          relayout: () => void;
        };
        Marker: new (options: { map: unknown; position: unknown }) => unknown;
        InfoWindow: new (options: { content: string; removable?: boolean }) => {
          open: (map: unknown, marker: unknown) => void;
        };
        services: {
          Geocoder: new () => {
            addressSearch: (address: string, callback: (result: Array<{ x: string; y: string }>, status: string) => void) => void;
          };
          Status: { OK: string };
        };
      };
    };
  }
}

interface KakaoMapProps {
  address: string;
  companyName?: string;
  height?: string;
}

export default function KakaoMap({ address, companyName, height = '280px' }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const mapInstanceRef = useRef<{ setCenter: (latlng: unknown) => void; relayout: () => void } | null>(null);

  useEffect(() => {
    const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!KAKAO_KEY) {
      setError(true);
      return;
    }

    // SDK가 이미 로드되어 있으면 바로 초기화
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => initMap());
      return;
    }

    // 기존 스크립트가 있으면 로드 완료 대기
    const existingScript = document.getElementById('kakao-map-sdk');
    if (existingScript) {
      // 이미 로드 실패한 스크립트면 제거 후 재시도
      if (!window.kakao?.maps) {
        existingScript.remove();
      } else {
        window.kakao.maps.load(() => initMap());
        return;
      }
    }

    const script = document.createElement('script');
    script.id = 'kakao-map-sdk';
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => initMap());
    };
    script.onerror = () => setError(true);
    document.head.appendChild(script);

    return () => {
      mapInstanceRef.current = null;
    };
  }, [address]);

  const initMap = () => {
    if (!mapRef.current || !window.kakao?.maps) return;

    const geocoder = new window.kakao.maps.services.Geocoder();

    geocoder.addressSearch(address, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
        const coords = new window.kakao.maps.LatLng(
          parseFloat(result[0].y),
          parseFloat(result[0].x)
        );

        const map = new window.kakao.maps.Map(mapRef.current!, {
          center: coords,
          level: 3,
        });
        mapInstanceRef.current = map;

        const marker = new window.kakao.maps.Marker({
          map,
          position: coords,
        });

        if (companyName) {
          const infowindow = new window.kakao.maps.InfoWindow({
            content: `<div style="padding:8px 12px;font-size:13px;font-weight:600;white-space:nowrap;">${companyName}</div>`,
          });
          infowindow.open(map, marker);
        }

        setIsLoaded(true);
      } else {
        setError(true);
      }
    });
  };

  if (error) {
    return (
      <div
        className="bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center justify-center text-gray-400 gap-2"
        style={{ height }}
      >
        <MapPin className="w-8 h-8" />
        <p className="text-sm">지도를 불러올 수 없습니다</p>
        <a
          href={`https://map.kakao.com/?q=${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:text-blue-600 underline flex items-center gap-1"
        >
          카카오맵에서 보기 <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="relative">
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10"
          style={{ height }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400">지도 로딩 중...</p>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        className="rounded-lg overflow-hidden"
        style={{ width: '100%', height }}
      />
      <a
        href={`https://map.kakao.com/?q=${encodeURIComponent(address)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 hover:bg-white transition-colors z-20"
      >
        <MapPin className="w-3.5 h-3.5" />
        카카오맵에서 보기
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}
