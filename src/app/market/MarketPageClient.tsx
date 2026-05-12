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

interface SelectedDetail {
  complex_name: string | null;
  growth_pct: number | null;
  monthly: Array<{ ym: string; avg_price_manwon: number; trade_count: number; avg_pyeong_price: number }>;
  complex_meta: { hhld_cnt: number | null; build_year: number | null } | null;
  lease_ratio: number | null;
}

export default function MarketPageClient() {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [lawd_cd, setLawdCd] = useState(DEFAULT_LAWD_CD);
  const [property_type, setPropertyType] = useState<PropertyTypeFilter>('apt');
  const [points, setPoints] = useState<MapComplexPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<SelectedDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadData(lawd_cd, property_type);
  }, [lawd_cd, property_type]);

  // 단지 선택 시 상세 fetch
  useEffect(() => {
    if (!selectedKey) {
      setSelectedDetail(null);
      return;
    }
    setDetailLoading(true);
    fetch(`/api/market/complex/${encodeURIComponent(selectedKey)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSelectedDetail(d))
      .catch(() => setSelectedDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedKey]);

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
      let complex_coords: Record<string, { lat: number | null; lng: number | null }> = {};
      for (const ym of candidateYms) {
        const res = await fetch(`/api/market/transactions?lawd_cd=${lc}&ym=${ym}&type=${pt}&deal=trade`);
        if (!res.ok) continue;
        const data = await res.json();
        const arr = (data.transactions || []) as typeof txs;
        if (arr.length > 0) {
          txs = arr;
          complex_coords = data.complex_coords || {};
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

      // 좌표: complex_coords 우선 사용, 없으면 jitter 폴백 (백필 완료 전까지)
      const pts: MapComplexPoint[] = Array.from(map.entries()).map(([key, v], i) => {
        const real = complex_coords[key];
        const hasReal = real && real.lat != null && real.lng != null;
        return {
          complex_key: key,
          complex_name: v.name,
          lat: hasReal ? real.lat! : center[0] + ((i % 9) - 4) * 0.003,
          lng: hasReal ? real.lng! : center[1] + ((Math.floor(i / 9) % 9) - 4) * 0.003,
          avg_price_manwon: Math.round(v.prices.reduce((a, b) => a + b, 0) / v.prices.length),
          trade_count: v.prices.length,
          property_type: pt,
        };
      });

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
            <MapPin className="w-4 h-4 text-blue-400" />
            시세·거래량 지도
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 ml-1">
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
                property_type === 'apt' ? 'bg-blue-500 text-white font-semibold' : 'bg-slate-800 text-slate-300'
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
          selectedKey={selectedKey}
        />

        {/* 단지 선택 패널 — 미니 카드 */}
        {selectedKey && (
          <ComplexMiniCard
            complexKey={selectedKey}
            point={points.find((p) => p.complex_key === selectedKey)}
            detail={selectedDetail}
            loading={detailLoading}
            onClose={() => setSelectedKey(null)}
          />
        )}
      </div>
    </div>
  );
}

function ComplexMiniCard({
  complexKey,
  point,
  detail,
  loading,
  onClose,
}: {
  complexKey: string;
  point: MapComplexPoint | undefined;
  detail: SelectedDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  const name = detail?.complex_name || point?.complex_name || '단지';
  const KRW = (n: number) => Math.round(n).toLocaleString('ko-KR');
  const monthly = detail?.monthly ?? [];
  const current = monthly[0];
  const meta = detail?.complex_meta;

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-10 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate">{name}</div>
          {(meta?.hhld_cnt != null || meta?.build_year != null) && (
            <div className="text-[10px] text-slate-500 mt-0.5">
              {meta.hhld_cnt != null && <>세대 {meta.hhld_cnt.toLocaleString()} · </>}
              {meta.build_year != null && <>입주 {meta.build_year}년</>}
            </div>
          )}
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-xs flex-shrink-0">✕</button>
      </div>

      {/* KPI */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2 border-b border-slate-800">
        <div>
          <div className="text-[10px] text-slate-500">평균 매매가</div>
          <div className="text-sm font-semibold text-red-300 tabular-nums">
            {current ? `${KRW(current.avg_price_manwon)}만` : (loading ? '…' : (point ? `${KRW(point.avg_price_manwon)}만` : '-'))}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500">평당가</div>
          <div className="text-sm font-semibold text-slate-100 tabular-nums">
            {current ? `${KRW(current.avg_pyeong_price)}만` : (loading ? '…' : '-')}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-500">변동률</div>
          <div className={`text-sm font-semibold tabular-nums ${(detail?.growth_pct ?? 0) > 0 ? 'text-red-300' : (detail?.growth_pct ?? 0) < 0 ? 'text-blue-300' : 'text-slate-400'}`}>
            {detail?.growth_pct != null ? `${detail.growth_pct > 0 ? '+' : ''}${detail.growth_pct.toFixed(1)}%` : (loading ? '…' : '-')}
          </div>
        </div>
      </div>

      {/* Sparkline */}
      {monthly.length >= 2 && (
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="text-[10px] text-slate-500 mb-1.5">최근 추이 (매매 평균)</div>
          <Sparkline data={monthly.slice().reverse().map((m) => m.avg_price_manwon)} />
        </div>
      )}

      {/* 전세가율 / 상세 보기 */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <div className="text-[11px] text-slate-400">
          {detail?.lease_ratio != null ? (
            <>전세가율 <strong className="text-blue-300 tabular-nums">{detail.lease_ratio}%</strong></>
          ) : (
            <span className="text-slate-600">전세가율 -</span>
          )}
        </div>
        <Link
          href={`/market/${encodeURIComponent(complexKey)}`}
          className="text-xs px-3 py-1.5 bg-blue-500 hover:bg-blue-400 text-white rounded font-semibold flex-shrink-0"
        >
          상세 보기 →
        </Link>
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 320;
  const H = 32;
  const stepX = W / (data.length - 1);
  const points = data.map((v, i) => `${i * stepX},${H - ((v - min) / range) * H}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 32 }}>
      <polyline points={points} fill="none" className="stroke-blue-400" strokeWidth={1.5} />
      {data.map((v, i) => {
        const x = i * stepX;
        const y = H - ((v - min) / range) * H;
        return <circle key={i} cx={x} cy={y} r={1.5} className="fill-blue-400" />;
      })}
    </svg>
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
