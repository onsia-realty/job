'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { useMarketSearch } from '@/lib/market/queries';

export interface SearchResult {
  complex_key: string;
  complex_name: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  hhld_cnt: number | null;
  build_year: number | null;
  sigungu_cd: string | null;
  source: 'master' | 'tx';
}

interface Props {
  onSelect: (result: SearchResult) => void;
}

export default function MarketSearch({ onSelect }: Props) {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // debounce 250ms — 입력값을 쿼리 키로 전달. 캐시/중복제거는 React Query가 처리.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data: results = [], isFetching: loading } = useMarketSearch(debouncedQ);

  // 검색 결과 도착 시 드롭다운 열기
  useEffect(() => {
    if (debouncedQ && results.length > 0) setOpen(true);
  }, [debouncedQ, results.length]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full max-w-[280px]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-market-text-faint" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="단지명 검색 (예: 래미안)"
          className="w-full pl-9 pr-8 py-1.5 text-xs bg-market-surface-2 border border-transparent rounded-full focus:outline-none focus:bg-market-surface focus:border-market-border placeholder:text-market-text-faint text-market-text"
        />
        {q && (
          <button
            onClick={() => { setQ(''); setDebouncedQ(''); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-market-text-faint hover:text-market-text"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && q && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-market-surface border border-market-border rounded-xl shadow-xl z-40 max-h-[60vh] overflow-y-auto">
          {loading && results.length === 0 && (
            <div className="px-3 py-4 text-xs text-market-text-faint text-center">검색 중…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-4 text-xs text-market-text-faint text-center">
              결과 없음
            </div>
          )}
          {results.map((r) => {
            const noCoord = r.lat == null || r.lng == null;
            return (
              <button
                key={r.complex_key}
                onClick={() => {
                  onSelect(r);
                  setOpen(false);
                  setQ('');
                  setDebouncedQ('');
                }}
                disabled={noCoord}
                className={`w-full px-3 py-2 text-left hover:bg-market-surface-2 transition-colors border-b border-market-border/40 last:border-b-0 ${noCoord ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-market-text-faint flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-market-text truncate">
                      {r.complex_name}
                    </div>
                    {(r.address || r.hhld_cnt != null || r.build_year != null) && (
                      <div className="text-[10px] text-market-text-mute mt-0.5 truncate">
                        {r.address && <span>{r.address}</span>}
                        {r.hhld_cnt != null && (
                          <span> · {r.hhld_cnt.toLocaleString()}세대</span>
                        )}
                        {r.build_year != null && (
                          <span> · {r.build_year}년</span>
                        )}
                      </div>
                    )}
                    {noCoord && (
                      <div className="text-[10px] text-deal-trade mt-0.5">좌표 정보 없음</div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
