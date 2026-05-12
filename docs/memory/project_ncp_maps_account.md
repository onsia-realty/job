---
name: NCP Maps 계정/Application/키 인벤토리
description: 시세지도가 사용하는 네이버 클라우드 플랫폼 Maps 리소스 위치와 키. 메뉴 경로가 혼란스러워 다시 찾기 어려우므로 명시
type: project
originSessionId: ad00840e-f900-4860-9918-1d46eb422804
---
**NCP 계정**: 온시아 주식회사 / Region: 한국 VPC (계정 이메일은 1Password/내부 문서 참조)

**console 경로**: NCP는 Maps를 "AI·NAVER API" 메뉴가 아니라 별도 **"Maps"** 메뉴로 분리해서 관리. URL 직접: `https://console.ncloud.com/maps/application`

**Application: `booin-market`** (2026-04-25 등록)
- 활성 API: Geocoding, Reverse Geocoding, Dynamic Map (Web JS)
- Client ID / Secret: `.env.local` (`NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`) + NCP 콘솔에서 확인. **public repo에 키 직접 저장 금지**.

**등록된 Web 서비스 URL (화이트리스트)**:
- `http://localhost:3000`
- `https://booin.co.kr` (NCP가 http→https 자동 정규화)

**Why:** "AI·NAVER API" 페이지에는 0개로 보여서 "Application 없음"으로 오해 → 다른 계정 의심 → 결국 같은 계정 다른 메뉴(`/maps/application`)에 있었음. 다음 작업자가 같은 경로로 헤매지 않도록 명시.

**How to apply:** 시세지도 SDK 키 / 화이트리스트 손볼 때 이 경로로 직행. NCP 화이트리스트 규칙: HTTP/HTTPS 자동 매칭, www 빼고 등록, 서브도메인은 대표 도메인만.

**결제 상태**: 신용카드 등록됨 (수협카드, 2025-11-02). 매월 0원 청구 정상 처리 중.
