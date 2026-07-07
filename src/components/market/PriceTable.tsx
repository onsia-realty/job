'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X, ChevronRight, Building2 } from 'lucide-react';
import { formatKoreanPrice } from '@/lib/market/format';

/**
 * 시세표 (PriceTable) — 부동산지인 지역분석 표 벤치마크 공용 컴포넌트.
 * 공인중개사 슬라이드 패널 + /market 표 모드 양쪽에서 재사용.
 * 2레벨 드릴다운: 지역 요약 → 행 클릭 → 단지 목록 → 뒤로가기. 단지 행 클릭 → /market 딥링크.
 */

interface Props {
  propertyType: 'apt' | 'offi';
  initialRegion?: string;
  onClose?: () => void;
  accent?: string;
}

type SortKey = 'price_desc' | 'price_asc' | 'volume_desc';

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: 'price_desc', label: '가격 높은순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'volume_desc', label: '거래량순' },
];

// 시도 프리셋 (region 미지정 시 상단 탭). lawd_cd prefix 규약(11/41)과 동일.
const SIDO_TABS: Array<{ value: string; label: string }> = [
  { value: '서울특별시', label: '서울' },
  { value: '경기도', label: '경기' },
];

interface RegionRow {
  regionName: string;
  lawdCd: string;
  complexCount: number;
  avgTradeManwon: number | null;
  avgPyeongManwon: number | null;
  avgJeonseManwon: number | null;
  jeonseRatio: number | null;
  tradeCount3m: number;
  rentCount3m: number;
  newHighCount: number;
}
interface ComplexRow {
  complexKey: string;
  name: string;
  households: number | null;
  builtYear: number | null;
  lawdCd: string;
  avgTradeManwon: number | null;
  avgPyeongManwon: number | null;
  avgJeonseManwon: number | null;
  lastDealDate: string | null;
  lastDealManwon: number | null;
  tradeCount3m: number;
}

const TRADE_COLOR = 'var(--color-deal-trade)';   // 매매 Rose-600 #e11d48
const JEONSE_COLOR = 'var(--color-deal-jeonse)'; // 전세 Blue-600 #2563eb

function fmtDate(d: string | null): string {
  if (!d) return '-';
  const s = d.slice(0, 10).split('-');
  return s.length === 3 ? `${s[0].slice(2)}.${s[1]}.${s[2]}` : d;
}

export default function PriceTable({ propertyType, initialRegion, onClose, accent = '#0891B2' }: Props) {
  const router = useRouter();
  const [level, setLevel] = useState<'region' | 'complex'>('region');
  // region 레벨의 현재 시도, complex 레벨의 현재 lawd_cd
  const [region, setRegion] = useState<string>(initialRegion || SIDO_TABS[0].value);
  const [drillLawd, setDrillLawd] = useState<string | null>(null);
  const [drillName, setDrillName] = useState<string>('');
  const [sort, setSort] = useState<SortKey>('price_desc');

  const [regionRows, setRegionRows] = useState<RegionRow[]>([]);
  const [complexRows, setComplexRows] = useState<ComplexRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const params = new URLSearchParams({ type: propertyType, level, sort });
    if (level === 'region') params.set('region', region);
    else if (drillLawd) params.set('region', drillLawd);
    try {
      const res = await fetch(`/api/market/price-table?${params.toString()}`);
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      if (level === 'region') setRegionRows((json.rows as RegionRow[]) || []);
      else setComplexRows((json.rows as ComplexRow[]) || []);
    } catch {
      setError(true);
      if (level === 'region') setRegionRows([]);
      else setComplexRows([]);
    } finally {
      setLoading(false);
    }
  }, [propertyType, level, sort, region, drillLawd]);

  useEffect(() => {
    load();
  }, [load]);

  const openComplex = (row: RegionRow) => {
    setDrillLawd(row.lawdCd);
    setDrillName(row.regionName);
    setLevel('complex');
  };
  const goBack = () => {
    setLevel('region');
    setDrillLawd(null);
  };
  const openMap = (row: ComplexRow) => {
    const type = propertyType === 'offi' ? 'officetel' : 'apt';
    router.push(`/market?sel=${encodeURIComponent(row.complexKey)}&region=${row.lawdCd}&type=${type}`);
  };

  const isEmpty = !loading && !error && (level === 'region' ? regionRows.length === 0 : complexRows.length === 0);

  return (
    <div className="flex flex-col h-full w-full bg-market-surface font-jakarta text-market-text">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-market-border flex-shrink-0">
        {level === 'complex' ? (
          <button onClick={goBack} className="text-market-text-mute hover:text-market-text" aria-label="뒤로">
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <Building2 className="w-5 h-5" style={{ color: accent }} />
        )}
        <span className="text-sm font-bold text-market-text truncate">
          {level === 'region' ? '시세표' : drillName}
          <span className="ml-1.5 text-[11px] font-medium text-market-text-faint">
            {propertyType === 'offi' ? '오피스텔' : '아파트'}
          </span>
        </span>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-market-text-faint hover:text-market-text" aria-label="닫기">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 컨트롤: 시도 탭(region 레벨) + 정렬 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-market-border flex-shrink-0">
        {level === 'region' && !initialRegion && (
          <div className="flex bg-market-surface-2 rounded-lg p-0.5 border border-market-border">
            {SIDO_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setRegion(t.value)}
                className="px-2.5 py-1 text-[11px] rounded-md font-medium transition-colors"
                style={
                  region === t.value
                    ? { background: accent, color: '#fff' }
                    : { color: 'var(--color-market-text-mute)' }
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="ml-auto appearance-none text-[11px] font-medium text-market-text-mute bg-market-surface-2 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-market-border transition-colors outline-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <SkeletonRows />
        ) : error ? (
          <div className="py-16 text-center text-sm text-market-text-faint">
            데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </div>
        ) : isEmpty ? (
          <div className="py-16 text-center text-sm text-market-text-faint">
            이 지역 거래 데이터가 아직 없어요
          </div>
        ) : level === 'region' ? (
          <RegionTable rows={regionRows} onRowClick={openComplex} />
        ) : (
          <ComplexTable rows={complexRows} onRowClick={openMap} />
        )}
      </div>
    </div>
  );
}

// ── 지역 요약 표 ──
function RegionTable({ rows, onRowClick }: { rows: RegionRow[]; onRowClick: (r: RegionRow) => void }) {
  return (
    <table className="w-full text-[12px] tabular-nums">
      <thead className="sticky top-0 bg-market-surface-2 text-market-text-mute text-[10px] font-semibold">
        <tr>
          <th className="text-left px-3 py-2 font-semibold">지역</th>
          <th className="text-right px-2 py-2 font-semibold">매매</th>
          <th className="text-right px-2 py-2 font-semibold">평당</th>
          <th className="text-right px-2 py-2 font-semibold">전세</th>
          <th className="text-right px-2 py-2 font-semibold">전세율</th>
          <th className="text-right px-3 py-2 font-semibold">거래</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-market-border">
        {rows.map((r) => (
          <tr
            key={r.lawdCd}
            onClick={() => onRowClick(r)}
            className="cursor-pointer hover:bg-market-surface-2 transition-colors"
          >
            <td className="px-3 py-2.5">
              <div className="flex items-center gap-1">
                <span className="font-bold text-market-text">{r.regionName}</span>
                <ChevronRight className="w-3 h-3 text-market-text-faint" />
              </div>
              <div className="text-[10px] text-market-text-faint">
                {r.complexCount.toLocaleString()}단지
                {r.newHighCount > 0 && <span className="ml-1 text-deal-trade font-semibold">신고가 {r.newHighCount}</span>}
              </div>
            </td>
            <td className="text-right px-2 py-2.5 font-semibold" style={{ color: TRADE_COLOR }}>
              {formatKoreanPrice(r.avgTradeManwon, 'compact')}
            </td>
            <td className="text-right px-2 py-2.5 text-market-text-mute">
              {r.avgPyeongManwon != null ? `${r.avgPyeongManwon.toLocaleString()}만` : '-'}
            </td>
            <td className="text-right px-2 py-2.5 font-medium" style={{ color: JEONSE_COLOR }}>
              {r.avgJeonseManwon != null ? formatKoreanPrice(r.avgJeonseManwon, 'compact') : '-'}
            </td>
            <td className="text-right px-2 py-2.5 text-market-text-mute">
              {r.jeonseRatio != null ? `${r.jeonseRatio}%` : '-'}
            </td>
            <td className="text-right px-3 py-2.5 text-market-text-mute">{r.tradeCount3m.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── 단지 목록 표 ──
function ComplexTable({ rows, onRowClick }: { rows: ComplexRow[]; onRowClick: (r: ComplexRow) => void }) {
  return (
    <table className="w-full text-[12px] tabular-nums">
      <thead className="sticky top-0 bg-market-surface-2 text-market-text-mute text-[10px] font-semibold">
        <tr>
          <th className="text-left px-3 py-2 font-semibold">단지</th>
          <th className="text-right px-2 py-2 font-semibold">매매</th>
          <th className="text-right px-2 py-2 font-semibold">평당</th>
          <th className="text-right px-2 py-2 font-semibold">전세</th>
          <th className="text-right px-3 py-2 font-semibold">최근거래</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-market-border">
        {rows.map((r) => (
          <tr
            key={r.complexKey}
            onClick={() => onRowClick(r)}
            className="cursor-pointer hover:bg-market-surface-2 transition-colors"
          >
            <td className="px-3 py-2.5 max-w-[160px]">
              <div className="font-bold text-market-text truncate">{r.name}</div>
              <div className="text-[10px] text-market-text-faint">
                {r.households != null && `${r.households.toLocaleString()}세대`}
                {r.households != null && r.builtYear != null && ' · '}
                {r.builtYear != null && `${r.builtYear}년`}
              </div>
            </td>
            <td className="text-right px-2 py-2.5 font-semibold" style={{ color: TRADE_COLOR }}>
              {formatKoreanPrice(r.avgTradeManwon, 'compact')}
            </td>
            <td className="text-right px-2 py-2.5 text-market-text-mute">
              {r.avgPyeongManwon != null ? `${r.avgPyeongManwon.toLocaleString()}만` : '-'}
            </td>
            <td className="text-right px-2 py-2.5 font-medium" style={{ color: JEONSE_COLOR }}>
              {r.avgJeonseManwon != null ? formatKoreanPrice(r.avgJeonseManwon, 'compact') : '-'}
            </td>
            <td className="text-right px-3 py-2.5">
              <div className="font-medium text-market-text">{formatKoreanPrice(r.lastDealManwon, 'compact')}</div>
              <div className="text-[10px] text-market-text-faint">{fmtDate(r.lastDealDate)}</div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── 로딩 스켈레톤 ──
function SkeletonRows() {
  return (
    <div className="divide-y divide-market-border">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3">
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-24 bg-market-surface-2 rounded animate-pulse" />
            <div className="h-2 w-16 bg-market-surface-2 rounded animate-pulse" />
          </div>
          <div className="h-3 w-12 bg-market-surface-2 rounded animate-pulse" />
          <div className="h-3 w-10 bg-market-surface-2 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}
