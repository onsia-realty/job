---
name: 온시아 Job .env.local 구성 (키 이름만)
description: .env.local에 어떤 키들이 있는지 목록만. 실제 값은 저장하지 않음 — 파일 자체 또는 Vercel 대시보드 참조.
type: project
originSessionId: 13bbd32d-2ca0-4f12-93e9-06f62bd48bcf
---
**중요**: 실제 키 값은 이 파일에 절대 저장하지 않는다. 키 목록과 용도만 기록.

**파일 위치**: `D:\claude\onsia-Job\onsia-job\.env.local`
**Vercel 미러**: https://vercel.com/realtors77-7871s-projects/onsia-job/settings/environment-variables

## 키 인벤토리

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` — 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 클라이언트용 anon 키
- `SUPABASE_SERVICE_ROLE_KEY` — 서버 전용 (RLS 우회)

### 공공/지도 API
- `DATA_GO_KR_API_KEY` — 국토부 실거래가 (data.go.kr, 마피 서비스에도 쓰이는 공유 키)
- `SEOUL_OPEN_API_KEY` — 서울 열린데이터광장
- `VWORLD_API_KEY` + `NEXT_PUBLIC_VWORLD_KEY` — 전국 중개사무소 조회
- `NEXT_PUBLIC_KAKAO_MAP_KEY` — 카카오 지도 (온시아 계정 **첫 번째 앱** 키 사용. onsia.city와 공유. 자세히는 [project_kakao_apps.md](project_kakao_apps.md))

### AI / 콘텐츠
- `GEMINI_API_KEY` — Google Gemini (AI 사진/뉴스툰)
- `PEXELS_API_KEY` — 뉴스 썸네일

### Auth
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — Google GIS 소셜 로그인

### 결제
- `NEXT_PUBLIC_TOSS_CLIENT_KEY` / `TOSS_SECRET_KEY` — 토스페이먼츠 (live_gck_/live_gsk_ 접두사)
- `TOSS_WEBHOOK_SECRET`
- `NEXT_PUBLIC_PORTONE_STORE_ID` / `NEXT_PUBLIC_PORTONE_CHANNEL_KEY` / `PORTONE_API_SECRET` — 포트원

### 인프라
- `CRON_SECRET` — Vercel Cron 인증용

## 상태 메모 (2026-04-27)
- **CRON_SECRET 통일 완료**: 로컬·Vercel 모두 동일 값 (실제 값은 .env.local + Vercel 대시보드 참조)
- **NAVER_MAP_CLIENT_ID**: 시세지도(`/market`)에서 사용 중. NCP Maps Application `booin-market`
