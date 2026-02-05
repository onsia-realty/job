'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Search, MapPin } from 'lucide-react';

// Daum Postcode 타입 선언
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: {
          address: string;
          roadAddress: string;
          jibunAddress: string;
          zonecode: string;
        }) => void;
      }) => { open: () => void };
    };
  }
}

// VWorldMap SSR 비활성화
const VWorldMap = dynamic(() => import('./VWorldMap'), { ssr: false });

interface AddressSearchProps {
  address: string;
  detailAddress?: string;
  onAddressChange: (address: string) => void;
  onDetailAddressChange?: (detail: string) => void;
  accentColor?: 'blue' | 'purple';
}

export default function AddressSearch({
  address,
  detailAddress = '',
  onAddressChange,
  onDetailAddressChange,
  accentColor = 'blue',
}: AddressSearchProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const focusColor = accentColor === 'purple' ? 'focus:border-purple-500' : 'focus:border-blue-500';
  const btnBg = accentColor === 'purple' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700';

  // Daum Postcode 스크립트 로드
  useEffect(() => {
    if (window.daum?.Postcode) {
      setIsScriptLoaded(true);
      return;
    }

    const existing = document.getElementById('daum-postcode-script');
    if (existing) {
      existing.addEventListener('load', () => setIsScriptLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.id = 'daum-postcode-script';
    script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  // 주소 → 서버 API 프록시를 통해 좌표 변환
  const geocodeAddress = useCallback(async (addr: string) => {
    if (!addr) {
      setCoords(null);
      return;
    }

    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(addr)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.lat && data.lng) {
          setCoords({ lat: data.lat, lng: data.lng });
        } else {
          setCoords(null);
        }
      } else {
        setCoords(null);
      }
    } catch {
      setCoords(null);
    }
  }, []);

  // 주소 변경 시 geocode 실행
  useEffect(() => {
    if (address) {
      geocodeAddress(address);
    } else {
      setCoords(null);
    }
  }, [address, geocodeAddress]);

  // Daum Postcode 팝업 열기
  const openPostcode = () => {
    if (!isScriptLoaded || !window.daum?.Postcode) return;

    new window.daum.Postcode({
      oncomplete: (data) => {
        const fullAddress = data.roadAddress || data.jibunAddress || data.address;
        onAddressChange(fullAddress);
      },
    }).open();
  };

  return (
    <div className="space-y-3">
      {/* 주소 검색 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          주소
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            readOnly
            placeholder="주소를 검색해주세요"
            className={`flex-1 border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-700 ${focusColor}`}
          />
          <button
            type="button"
            onClick={openPostcode}
            className={`px-4 py-3 ${btnBg} text-white rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap`}
          >
            <Search className="w-4 h-4" />
            주소 검색
          </button>
        </div>
      </div>

      {/* 상세주소 */}
      {onDetailAddressChange && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            상세주소
          </label>
          <input
            type="text"
            value={detailAddress}
            onChange={(e) => onDetailAddressChange(e.target.value)}
            placeholder="예: 3층 301호"
            className={`w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none ${focusColor}`}
          />
        </div>
      )}

      {/* VWorld 지도 미리보기 */}
      {coords && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-xs text-gray-500">위치 미리보기</span>
          </div>
          <VWorldMap lat={coords.lat} lng={coords.lng} label={address} />
        </div>
      )}
    </div>
  );
}
