// 지도 마커 HTML 빌더 — /market 과 /stay 지도가 공유하는 순수 모듈.
// 시각 회귀 위험이 있으니 출력 HTML(템플릿 문자열·공백·인라인 스타일·조건 분기)을 임의로 바꾸지 마라.

import { formatKoreanPrice } from '@/lib/market/format';

export type DealTypeFilter = 'trade' | 'jeonse' | 'wolse' | 'presale';

/** 집계 마커(구/동) 한 점 — 줌아웃 시 개별 단지 마커를 대신한다. */
export interface MapAggregatePoint {
  key: string;
  name: string;
  lat: number;
  lng: number;
  avg_price_manwon: number;
  trade_count: number;
  complex_count: number;
  /** 월세 레이어 전용 — 보증금(avg_price_manwon) 옆에 병기할 월세 가중평균 */
  avg_monthly_manwon?: number;
}

export interface MapComplexPoint {
  complex_key: string;
  complex_name: string;
  lat: number;
  lng: number;
  avg_price_manwon: number;          // primary 가격 — trade/presale=매매가, jeonse/wolse=보증금 (정렬/리스트 기준)
  avg_monthly_manwon?: number;       // wolse일 때만 사용 (월세)
  avg_trade_manwon?: number;         // 매매 평균 (dealType 무관 — 패널/리스트 참고용)
  avg_jeonse_manwon?: number;        // 전세 평균 보증금 (dealType 무관)
  latest_price_manwon?: number;      // 현재 탭 기준 가장 최근 실거래가 ("실 X억" 표시)
  latest_monthly_manwon?: number;    // 월세 탭일 때 최근 실거래의 월세
  rep_area?: number;                 // 대표 전용면적 ㎡ (지붕 표시 — primary 거래 중앙값)
  trade_count: number;
  growth_pct?: number | null;
  property_type: 'apt' | 'officetel' | 'villa' | 'store' | 'presale';
}

// 마커 팔레트 — 파란 지붕 + 흰 본문(평균가 검정 / 실거래가 초록).
// 가격대별 색 인코딩 없음 (차분함 유지).
export const MARKER_ACCENT = '#2563EB'; // 지붕/선택 본문/뱃지/집계 마커 — 블루
export const MARKER_TEXT = '#1E1E23';   // 본문 평균가 텍스트 (검정)
export const MARKER_BORDER = '#E2E4E8';
export const MARKER_GREEN = '#0A8348';  // 실거래가 (네이버의 '실' 초록)
export const MARKER_SECONDARY_ON_ACCENT = 'rgba(255,255,255,0.92)'; // 선택(블루 반전) 시 실거래가

export const MARKER_FONT = `'Plus Jakarta Sans', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

// 네이버페이 부동산식 집 모양 마커 — 파란 지붕(대표면적㎡) + 흰 본문(평균가 검정 / 최근 실거래가 초록) + 아래 단지명.
export function buildMarkerHTML(p: MapComplexPoint, isSelected: boolean, dealType: DealTypeFilter = 'trade'): string {
  // 1줄: 현재 탭 평균가 (검정 볼드) — 매매/전세/월세/분양권
  const priceLabel = formatKoreanPrice(p.avg_price_manwon, 'compact');
  const primaryPrefix = dealType === 'jeonse' ? '전' : dealType === 'presale' ? '분' : dealType === 'wolse' ? '월' : '매';
  const primaryValue = dealType === 'wolse' && p.avg_monthly_manwon
    ? `${priceLabel}/${p.avg_monthly_manwon}`
    : priceLabel;

  // 2줄: 가장 최근 실거래 1건 (초록 "실") — 네이버의 매/실 조합과 동일한 구성
  const latestLabel = p.latest_price_manwon
    ? (dealType === 'wolse' && p.latest_monthly_manwon
        ? `${formatKoreanPrice(p.latest_price_manwon, 'compact')}/${p.latest_monthly_manwon}`
        : formatKoreanPrice(p.latest_price_manwon, 'compact'))
    : null;
  const secondaryGreen = isSelected ? MARKER_SECONDARY_ON_ACCENT : MARKER_GREEN;
  const secondaryHtml = latestLabel
    ? `<div style="font-size:11px;font-weight:700;line-height:1.25;color:${secondaryGreen};white-space:nowrap;">
        <span style="font-size:9px;font-weight:700;margin-right:2px;vertical-align:0.5px;">실</span>${latestLabel}
      </div>`
    : '';

  // 지붕: 대표면적 (오피스텔은 OP 표기)
  const roofLabel = `${p.property_type === 'officetel' ? 'OP ' : ''}${p.rep_area ? `${p.rep_area}㎡` : ''}`.trim();

  // 단지명: 집 아래 — 지도 라벨처럼 흰 halo. 절대배치라 anchor(집 바닥)에 영향 없음.
  const nameRaw = p.complex_name || '';
  const nameLabel = nameRaw.length > 9 ? `${nameRaw.slice(0, 8)}…` : nameRaw;

  // 거래건수 뱃지 (우상단, 1건이면 숨김)
  const countBadge = p.trade_count > 1
    ? `<div style="
        position:absolute;top:-6px;right:-8px;
        min-width:17px;height:17px;padding:0 4px;border-radius:9px;
        background:${MARKER_ACCENT};color:#ffffff;
        border:1.5px solid #ffffff;
        font-size:9px;font-weight:800;line-height:14px;text-align:center;
        box-shadow:0 1px 3px rgba(0,0,0,0.25);
        font-variant-numeric:tabular-nums;
        z-index:2;
      ">${p.trade_count > 99 ? '99+' : p.trade_count}</div>`
    : '';

  const wrapperTransform = isSelected
    ? 'transform: translate(-50%, -100%) scale(1.1);'
    : 'transform: translate(-50%, -100%);';
  const wrapperZ = isSelected ? 1000 : (p.property_type === 'officetel' ? 50 : 100);

  // 선택 시 본문 블루 반전 (평소 본문 텍스트는 검정 — 가독성)
  const bodyBg = isSelected ? MARKER_ACCENT : '#ffffff';
  const bodyColor = isSelected ? '#ffffff' : MARKER_TEXT;
  const bodyBorder = isSelected ? MARKER_ACCENT : MARKER_BORDER;
  const houseShadow = isSelected
    ? 'filter: drop-shadow(0 6px 14px rgba(0,0,0,0.35));'
    : 'filter: drop-shadow(0 3px 8px rgba(0,0,0,0.22));';

  return `
    <div style="
      ${wrapperTransform}
      transform-origin: 50% 100%;
      z-index: ${wrapperZ};
      cursor: pointer;
      transition: transform 0.15s ease-out;
      position: relative;
    ">
      <div style="${houseShadow}">
        <div style="
          position: relative;
          min-width: 58px;
          max-width: 110px;
          font-family: ${MARKER_FONT};
          font-variant-numeric: tabular-nums;
          text-align: center;
        ">
          <div style="
            height: 19px;
            background: ${MARKER_ACCENT};
            clip-path: polygon(50% 0, 100% 58%, 100% 100%, 0 100%, 0 58%);
            display: flex; align-items: flex-end; justify-content: center;
            padding-bottom: 1px;
            color: #ffffff;
            font-size: 9px; font-weight: 700; letter-spacing: -0.01em;
            white-space: nowrap;
          ">${roofLabel}</div>
          <div style="
            background: ${bodyBg};
            color: ${bodyColor};
            border: 1px solid ${bodyBorder};
            border-top: none;
            border-radius: 0 0 5px 5px;
            padding: 2px 8px 3px;
          ">
            <div style="font-size:13px;font-weight:800;line-height:1.25;letter-spacing:-0.02em;white-space:nowrap;">
              <span style="font-size:9px;font-weight:700;opacity:0.75;margin-right:2px;vertical-align:0.5px;">${primaryPrefix}</span>${primaryValue}
            </div>
            ${secondaryHtml}
          </div>
          ${countBadge}
        </div>
      </div>
      <div style="
        position: absolute;
        top: 100%; left: 50%;
        transform: translateX(-50%);
        margin-top: 1px;
        font-family: ${MARKER_FONT};
        font-size: 10px; font-weight: 600;
        color: #444448;
        white-space: nowrap;
        text-shadow: 0 0 3px #fff, 0 0 3px #fff, 0 0 4px #fff;
        pointer-events: none;
      ">${nameLabel}</div>
    </div>
  `;
}

// 집계 마커 — 구(원형) / 동(둥근 사각). 블루 톤 (집 마커 지붕과 동일). 클릭 시 드릴다운 줌인.
// dealType 은 선택 인자다. 기본값 'trade' 로 두어 /market 의 2인자 호출은 출력 HTML이 종전과 완전히 동일하다.
export function buildAggMarkerHTML(
  a: MapAggregatePoint,
  level: 'gu' | 'dong',
  dealType: DealTypeFilter = 'trade',
): string {
  // 월세 레이어에서만 "보증금/월세" 병기 — 그 외에는 기존 그대로 단일 가격.
  const priceLabel = dealType === 'wolse' && a.avg_monthly_manwon
    ? `${formatKoreanPrice(a.avg_price_manwon, 'compact')}/${a.avg_monthly_manwon}`
    : formatKoreanPrice(a.avg_price_manwon, 'compact');

  if (level === 'gu') {
    return `
      <div style="
        transform: translate(-50%, -50%);
        z-index: 80; cursor: pointer;
        transition: transform 0.15s ease-out;
      ">
        <div style="
          width: 68px; height: 68px; border-radius: 50%;
          background: rgba(37,99,235,0.92);
          border: 2px solid rgba(255,255,255,0.95);
          box-shadow: 0 6px 16px -4px rgba(0,0,0,0.3);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          font-family: ${MARKER_FONT}; color: #fff; text-align: center;
          font-variant-numeric: tabular-nums;
        ">
          <div style="font-size:10px;font-weight:600;line-height:1.2;opacity:0.92;max-width:60px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.name}</div>
          <div style="font-size:13px;font-weight:800;line-height:1.2;letter-spacing:-0.02em;">${priceLabel}</div>
          <div style="font-size:9px;font-weight:600;color:rgba(255,255,255,0.88);line-height:1.2;">${a.trade_count.toLocaleString()}건</div>
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
        background: rgba(37,99,235,0.92);
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
