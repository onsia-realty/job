---
name: flex item 안에서 자식 height:100% 가 0으로 계산되는 트랩
description: 부모가 flex item일 때 자식의 height:100% 가 CSS spec상 0이 됨. 지도/캔버스 같이 명시 height 필요한 컴포넌트에서 자주 발생
type: feedback
originSessionId: ad00840e-f900-4860-9918-1d46eb422804
---
부모가 `flex-1` (flex item) 이고 자식이 `height: 100%` 면, 자식의 계산된 height는 **0**이 됨.

**Why:** CSS spec — `height: <percentage>`는 부모가 명시적 height 값일 때만 동작. flex item의 used main-axis size는 명시 height로 간주되지 않음. 2026-05-11 시세지도에서 SDK 인증 통과한 뒤에도 지도가 검은 빈 화면이었던 이유. 부모 `flex-1`은 791px이었지만 자식 `<MarketMap>` outer wrapper의 height: 100% 가 0으로 계산되어 타일은 fetch됐지만 화면에 안 보임.

**How to apply:** 지도 / 캔버스 / 큰 자식 영역을 flex container의 flex item으로 둘 때, 자식 wrapper에 두 패턴 중 하나 사용:

```tsx
// Option A — absolute fill (부모가 relative 이어야 함)
<div style={{ position: 'absolute', inset: 0 }}>
  <div style={{ width: '100%', height: '100%' }} ref={mapRef} />
</div>

// Option B — 부모를 flex column으로 만들고 자식을 flex-1
<div className="flex-1 flex flex-col"> {/* 부모 */}
  <div className="flex-1" ref={mapRef} /> {/* 자식 */}
</div>
```

증상 식별법: 컨테이너 div의 getBoundingClientRect에서 width는 정상인데 height만 0. `height: 100%` 스타일이 적용되어 있어도 시각적으로 보이지 않음. DevTools에서 부모 height 확인 → 명시 값 없으면 이 트랩.
