# 홈 화면 디자인 개선·검수 (2026-10-20)

사용자 요청: Claude는 디자인, Codex는 기능 유지·컴퓨터 유즈 검수를 맡아 기존 홈 화면을 개선한다.

## 협업과 구현

- Claude Code에 실제 홈 소스를 전달해 1차 디자인 명세를 받고, 브라우저에서 발견한 여백·레이아웃 이동을 전달해 2차 검토를 받았다. 두 결과는 기존 Obsidian 보관함에 저장됐다.
- Claude는 전달된 소스 기준 디자인 제안 담당이며 브라우저·스크린샷을 직접 확인한 것은 아니다. Codex가 제안을 검토·통합하고 Chrome에서 실제 검수했다.
- `src/components/home/AnnouncementSlider.tsx`: 단일 공지 카드, 이름 있는 44px 컨트롤, 재생/정지, hover·focus 독립 정지, 모션 감소 대응, 본문 높이·CTA 슬롯으로 공지 전환 시 레이아웃 이동 방지.
- `src/components/home/ServiceCard.tsx`: 이미지 위 어두운 오버레이·색 강조선·화살표, 공통 모서리/초점 표시, 태블릿 밀도 조절, 한국어 단어 단위 줄바꿈.
- `src/app/page.tsx`: 모바일에서 서비스→소개 배너→영상 순서, 데스크톱 공지/광고 높이 정렬, 태블릿 메뉴 2행 유지, 미구현 검색·커뮤니티 준비 중 표시.
- 공지·이미지·영상·기존 하단 콘텐츠·모든 실제 링크를 보존했다. 뉴스/웹툰 API, sessionStorage 캐시, 로그인 분기, STAY 기능 플래그와 결제/API/DB 로직은 바꾸지 않았다.
- 기존 캐시 복구 effect의 새 lint 규칙 위반은 동작 유지 이유를 명시한 해당 한 줄 예외만 추가했다.

## 자동 검사

- 전체 Vitest: 35파일 510테스트 통과(새 홈 회귀 16개 포함).
- TypeScript: 통과. 변경 소스·테스트 6파일 ESLint: 오류/경고 0. diff check: 통과(기존 LF/CRLF 안내만).
- 회귀 항목: 공지 자동/수동 이동·명시 정지·hover/focus 중첩·모션 감소·타이머/구독 해제, STAY on/off, 모바일/데스크톱 이동 경로, 뉴스/웹툰 목적지·외부 링크 안전 속성·캐시·로그인/계정 분기.
- 홈 이외 기존 미커밋 소스 15파일의 SHA-256을 전후 대조해 그대로임을 확인했다.

## Chrome 실제 검수

모든 폭에서 가로 넘침이 없고 공지 1/2/3 전환 시 카드 높이·컨트롤 위치가 동일했다.

| 뷰포트 폭 | 공지 카드 높이 | 공지 3개 높이 차이 |
|---|---:|---:|
| 320px | 398px | 0px |
| 375px | 350px | 0px |
| 390px | 350px | 0px |
| 768px | 358px | 0px |
| 1440px | 362px | 0px |

- 390px에서 첫 서비스 링크가 기존 화면 y=967px에서 y=499px로 올라왔다.
- 1440px에서 공지·프리미엄 카드 모두 362px. 서비스 경로는 `/agent`, `/sales`, `/stay` 유지.
- 768px에서 모든 기존 헤더 링크 노출, 서비스 제목/설명 각각 1줄 확인(STAY 켜진 현재 환경).
- 모바일 서비스 클릭으로 `/agent/jobs` 도착과 공고 목록 화면을 확인했다. AI 안내 링크 `/event/ai-assistant`도 실제 이동 확인.
- 뉴스 3개·웹툰 2개가 실제 공개 API 결과로 표시된다. 영상 원본 URL·muted/autoplay/playsInline 유지.
- 슬라이더 컨트롤 6개 모두 44×44px, 링크 안 버튼 0개. Tab으로 점→재생 제어→이전→다음→모바일 서비스 링크 순서와 초점 링을 확인했다.
- 브라우저 모션 감소 에뮬레이션에서 자동재생 버튼 비활성·설명 라벨·수동 이동을 확인한 뒤 설정을 복원했다.
- 로그인 실계정 전 과정을 수행한 것은 아니다. 계정별 표시와 STAY off는 자동 회귀 테스트로 검증했다.
- 변경 전 Chrome에 Monica 확장이 body 속성을 주입해 hydration 경고를 발생시키는 것을 확인했다. 이 작업에서 전역 layout·확장 설정을 바꾸지 않았다.

## 증적과 후속

### 2026-10-20 보안 오탐 후속

- 사용자 승인 후 창 크기 차이 기반 보호 오버레이·반복 debugger를 제거했다. 기존 콘텐츠 복사 가드와 서버 인증/권한은 유지한다.
- 우회 없는 production 회귀18개 포함 전체528테스트·변경24소스 lint·빌드110페이지 통과. 운영 빌드320/390/768/1440px에서 가로 넘침/보호 화면 없음, 모바일 공지 조작·서비스 이동 확인. 모바일 서비스 href는 `/agent/jobs`이며 데스크톱 Chrome 모바일 폭에서는 기존 페이지 전환 로직으로 `/agent`에 도착했다.
- `production-mobile-fixed.png`, `production-mobile-320-fixed.png`, `production-tablet-fixed.png`를 보존했다. 물리 모바일 기기를 검증한 것은 아니다. 아래 보호 화면 기록은 수정 전 이력이다.
- 사용자 요청에 따라 GitHub 커밋과 운영 배포를 진행하며 최종 결과는 PROGRESS 최신 블록에 기록한다. 아래 미커밋·미배포 기록은 최초 홈 구현 당시 기준이다.

- `claudedocs/home-review-2026-10-20/`: before/after desktop·mobile PNG, tablet·320px PNG, `browser-checks.json` 실제 DOM 실측.
- Claude 1차: Obsidian `AI-Sessions/conversations/booin-collaboration/HOME-20261020-db429cb7-26b5-4c48-817c-6862fcb7b005-claude.md`
- Claude 2차: Obsidian `AI-Sessions/conversations/booin-collaboration/HOME-REVIEW-20261020-3a183551-5174-4ce5-904b-5f4faeb4ac1d-claude.md`
- 프로덕션 빌드 성공·110개 정적 페이지 생성. 빌드본 데스크톱 홈·실데이터 로딩·기존 경로를 확인했다. 기존 middleware 폐기 예정 경고 1건은 유지된다.
- 프로덕션 모바일 에뮬레이션에서는 기존 `SecurityShield`가 outer/inner 화면 크기 차이를 개발자 도구로 오인해 보호 화면을 표시했다. 보안 코드·우회 설정을 바꾸지 않았으며 로컬 개발 서버에서 반응형 시각 검수를 마쳤다. 빌드본 모바일 수치는 DOM 실측이고, 보호 화면 없는 실제 모바일 기기의 최종 검수를 대신하지 않는다. `production-mobile-overlay.png`에 증적을 보존한다.
- 검수용 viewport·모션 에뮬레이션은 종료 시 복원한다. 로컬 개발 미리보기는 `http://127.0.0.1:3010/`이다.
- 이번 작업은 로컬 구현·검수다. 커밋·푸시·운영 DB 변경·외부 배포·실제 결제는 수행하지 않았다.
