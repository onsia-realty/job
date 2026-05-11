'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import Link from 'next/link';
import { ArrowLeft, MapPin, TrendingUp, Building2, Filter } from 'lucide-react';
import type { MapComplexPoint } from '@/components/market/MarketMap.client';

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || '';

// SSR 금지 (Leaflet은 window 의존)
const MarketMap = dynamic(() => import('@/components/market/MarketMap.client'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#0B0F14] text-slate-500 text-sm">
      지도를 불러오는 중…
    </div>
  ),
});

// 기본 지역: 서울 강남구
const DEFAULT_CENTER: [number, number] = [37.5172, 127.0473];
const DEFAULT_LAWD_CD = '11680';

type PropertyTypeFilter = 'apt' | 'officetel';

export default function MarketPageClient() {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [lawd_cd, setLawdCd] = useState(DEFAULT_LAWD_CD);
  const [property_type, setPropertyType] = useState<PropertyTypeFilter>('apt');
  const [points, setPoints] = useState<MapComplexPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    loadData(lawd_cd, property_type);
  }, [lawd_cd, property_type]);

  const loadData = async (lc: string, pt: PropertyTypeFilter) => {
    setLoading(true);
    try {
      // 실거래는 보통 1-2개월 지연. 최근 3개월을 순차 시도해서 데이터 밀도 확보.
      const now = new Date();
      const candidateYms = [1, 2, 3].map((lag) => {
        const d = new Date(now.getFullYear(), now.getMonth() - lag, 1);
        return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
      });

      let txs: Array<{
        complex_key: string;
        complex_name: string;
        price_manwon: number;
      }> = [];
      for (const ym of candidateYms) {
        const res = await fetch(`/api/market/transactions?lawd_cd=${lc}&ym=${ym}&type=${pt}&deal=trade`);
        if (!res.ok) continue;
        const data = await res.json();
        const arr = (data.transactions || []) as typeof txs;
        if (arr.length > 0) {
          txs = arr;
          break;
        }
      }

      // 단지별 평균가 집계 (로컬)
      const map = new Map<string, { name: string; prices: number[] }>();
      txs.forEach((t) => {
        if (!t.price_manwon) return;
        if (!map.has(t.complex_key)) {
          map.set(t.complex_key, { name: t.complex_name, prices: [] });
        }
        map.get(t.complex_key)!.prices.push(t.price_manwon);
      });

      // 좌표는 현재 지역 lawd_cd 중심 + 지터링 (실제 단지 좌표는 v1.1에서 지오코딩)
      const pts: MapComplexPoint[] = Array.from(map.entries()).map(([key, v], i) => ({
        complex_key: key,
        complex_name: v.name,
        lat: center[0] + ((i % 9) - 4) * 0.003,
        lng: center[1] + ((Math.floor(i / 9) % 9) - 4) * 0.003,
        avg_price_manwon: Math.round(v.prices.reduce((a, b) => a + b, 0) / v.prices.length),
        trade_count: v.prices.length,
        property_type: pt,
      }));

      setPoints(pts);
    } catch (e) {
      console.error('[market] load error:', e);
      setPoints([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {NAVER_CLIENT_ID && (
        <Script
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_CLIENT_ID}`}
          strategy="afterInteractive"
        />
      )}
      {/* 헤더 */}
      <header className="bg-[#0B0F14]/95 backdrop-blur border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg hover:bg-slate-800" aria-label="메인으로">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            시세·거래량 지도
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 ml-1">
              β
            </span>
          </h1>
          <Link
            href="/market/rankings"
            className="ml-auto text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 flex items-center gap-1"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            랭킹
          </Link>
        </div>
      </header>

      {/* 필터바 */}
      <div className="bg-[#0B0F14] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => setPropertyType('apt')}
              className={`px-2.5 py-1 text-xs rounded ${
                property_type === 'apt' ? 'bg-cyan-500 text-[#0B0F14] font-bold' : 'bg-slate-800 text-slate-300'
              }`}
            >
              아파트
            </button>
            <button
              onClick={() => setPropertyType('officetel')}
              className={`px-2.5 py-1 text-xs rounded ${
                property_type === 'officetel' ? 'bg-pink-500 text-[#0B0F14] font-bold' : 'bg-slate-800 text-slate-300'
              }`}
            >
              오피스텔
            </button>
          </div>
          <div className="mx-2 h-4 w-px bg-slate-700" />
          <RegionPicker current={lawd_cd} onSelect={(cd, lat, lng) => {
            setLawdCd(cd);
            setCenter([lat, lng]);
          }} />
          <div className="ml-auto text-[11px] text-slate-500 flex items-center gap-1 flex-shrink-0">
            <Building2 className="w-3 h-3" />
            {loading ? '로딩' : `${points.length}개 단지`}
          </div>
        </div>
      </div>

      {/* 지도 */}
      <div className="flex-1 relative">
        <MarketMap
          center={center}
          zoom={14}
          points={points}
          onSelect={setSelectedKey}
        />

        {/* 단지 선택 패널 */}
        {selectedKey && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl z-10">
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs text-slate-500">단지 상세</span>
              <button
                onClick={() => setSelectedKey(null)}
                className="text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <div className="text-sm font-bold mb-2">
              {points.find((p) => p.complex_key === selectedKey)?.complex_name}
            </div>
            <p className="text-[11px] text-slate-400">
              상세 분석·중개사 목록·구인공고는 Day 3에서 연결됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== 지역 선택 (간이) ==========
const MVP_REGIONS: Array<{ lawd_cd: string; name: string; lat: number; lng: number }> = [
  { lawd_cd: '11680', name: '서울 강남', lat: 37.5172, lng: 127.0473 },
  { lawd_cd: '11710', name: '서울 송파', lat: 37.5145, lng: 127.1060 },
  { lawd_cd: '11650', name: '서울 서초', lat: 37.4837, lng: 127.0323 },
  { lawd_cd: '11440', name: '서울 마포', lat: 37.5637, lng: 126.9085 },
  { lawd_cd: '11170', name: '서울 용산', lat: 37.5326, lng: 126.9906 },
  { lawd_cd: '41135', name: '성남 분당', lat: 37.3822, lng: 127.1186 },
  { lawd_cd: '41117', name: '수원 영통', lat: 37.2595, lng: 127.0460 },
  { lawd_cd: '41465', name: '용인 수지', lat: 37.3220, lng: 127.0976 },
];

function RegionPicker({
  current,
  onSelect,
}: {
  current: string;
  onSelect: (lawd_cd: string, lat: number, lng: number) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto">
      {MVP_REGIONS.map((r) => (
        <button
          key={r.lawd_cd}
          onClick={() => onSelect(r.lawd_cd, r.lat, r.lng)}
          className={`px-2.5 py-1 text-xs rounded whitespace-nowrap flex-shrink-0 ${
            current === r.lawd_cd
              ? 'bg-slate-100 text-[#0B0F14] font-bold'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {r.name}
        </button>
      ))}
    </div>
  );
}
