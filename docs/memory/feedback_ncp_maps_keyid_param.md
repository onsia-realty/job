---
name: NCP Maps SDK는 ncpKeyId 파라미터 사용 (ncpClientId 아님)
description: 네이버 클라우드 플랫폼 Maps JS SDK URL은 ncpKeyId=KEY 로 호출해야 인증 통과. ncpClientId는 deprecated 처리되어 silent fail
type: feedback
originSessionId: ad00840e-f900-4860-9918-1d46eb422804
---
NCP Maps JavaScript API v3는 SDK URL 파라미터를 `ncpClientId` → **`ncpKeyId`** 로 변경했음.

**Why:** 2026-05-11 시세지도 디버깅 12시간 중 진짜 원인. validatev3 엔드포인트에 두 파라미터 변형을 직접 hit해서 결정적으로 확인:
- `?ncpClientId=KEY` → `Authentication Failed` (옛 키든 새 키든 모두 거부)
- `?ncpKeyId=KEY` → `OK` (같은 키로 통과)

NCP 공식 문서나 콘솔 UI에서 이 변경을 명시적으로 알리지 않아 옛 코드는 silent fail. 콘솔 에러 메시지(`Authentication Failed`)만 보고 "키 만료/화이트리스트 문제"로 오해하기 쉬움. 실제로 12시간 동안 다음을 잘못된 원인으로 의심:
- NCP 캐시 (X)
- 카드/결제 (X)
- 화이트리스트 URL 형식 (X)
- React Strict Mode 더블 마운트 (영향은 있지만 본질 X)
- SDK 로드 타이밍 (X)
- 다른 계정 키 (X)

**How to apply:** NCP Maps SDK URL 만들 때 무조건 `ncpKeyId` 사용:
```ts
src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${KEY}`}
```
콘솔에 `네이버 지도 Open API 인증이 실패하였습니다` 메시지 + `URI: ...` 라인이 뜨면 가장 먼저 파라미터 이름부터 확인. 화이트리스트 / 캐시 / 결제 다 보기 전에 1초 만에 결판.

**디버깅 무기:** NCP는 인증 결과를 JSONP로 노출. 직접 hit해서 확인 가능:
```js
fetch via <script>: https://oapi.map.naver.com/v1/validatev3?ncpKeyId=KEY&uri=ENCODED_URL&time=TIMESTAMP&callback=CB
```
응답이 `{error: {errorCode: '200', message: 'Authentication Failed'}}` 면 거부, error 없으면 통과. 이걸로 캐시 가설 vs 파라미터 가설 등을 빠르게 판별.
