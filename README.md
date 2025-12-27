# 온시아 Job Matching - 부동산 구인구직 플랫폼

AI 기반 부동산 전문가 채용 매칭 플랫폼

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)

## 🎯 프로젝트 개요

온시아 Job Matching은 부동산 전문가(공인중개사, 분양상담사)를 위한 AI 기반 구인구직 플랫폼입니다.

### 핵심 기능

- 🏢 **공인중개사 채용**: 중개사무소 전문 인력 매칭
- 🏗️ **분양상담사 구인**: 분양 프로젝트 전문가 채용
- 📰 **AI 뉴스 요약**: 부동산 뉴스 실시간 업데이트
- 🎥 **AI 영상 콘텐츠**: 60초 숏폼 부동산 정보
- 👥 **커뮤니티**: 부동산 전문가 네트워킹

## 🚀 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **UI Components**: Custom Components

### Development Tools
- **AI Assistant**: Claude Code
- **Package Manager**: npm/pnpm
- **Version Control**: Git

## 📁 프로젝트 구조

```
Job matching/
├── src/
│   └── app/
│       ├── page.tsx              # 메인 페이지 (5개 탭)
│       ├── sales/                # 구인구직 상세 (예정)
│       └── auth/                 # 인증 (예정)
├── public/
│   └── onsia__Panoramic_*.png   # 배경 이미지
├── .mcp.json                     # MCP 서버 설정
├── CLAUDE.md                     # 개발 이력
└── README.md                     # 프로젝트 문서
```

## 🎨 디자인 시스템

### 컬러 팔레트
- **Primary**: Blue-600 (#2563eb) → Cyan-600 (#0891b2)
- **Secondary**: Teal-600, Orange-500
- **Gradient**: from-blue-600 to-cyan-600

### 주요 컴포넌트
- **TabButton**: 활성 탭 gradient 배경
- **JobCard**: 호버 효과, 뱃지 시스템
- **NewsCard**: 직방 스타일 리스트 카드
- **MobileNavButton**: 하단 고정 네비게이션

## 🛠️ 설치 및 실행

### 필수 요구사항
- Node.js 18.17 이상
- npm 또는 pnpm

### 설치

```bash
# 저장소 클론
git clone https://github.com/onsia-realty/job.git
cd "Job matching"

# 의존성 설치
npm install
# 또는
pnpm install
```

### 개발 서버 실행

```bash
npm run dev
# 또는
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 빌드

```bash
npm run build
npm run start
```

## 📱 주요 페이지

### 1. 홈 탭
- 히어로 섹션 with AI 브랜딩
- 실시간 뉴스 피드 (AI 요약)
- AI 숏폼 영상 그리드
- 급구 공고 섹션

### 2. 구인구직 탭
- 공인중개사 / 분양상담사 카테고리
- 실시간 통계 배너 (오늘 신규, 온라인, 급구 공고)
- 인기 지역/프로젝트 태그
- 직방 스타일 미디어 섹션 (영상 2/3 + 이미지 1/3)
- 부동산 뉴스 섹션 (직방 스타일)
- 광고 배너 (2개)

### 3. 뉴스 탭
- AI 요약 부동산 뉴스
- 직방 스타일 리스트 레이아웃
- 더보기 버튼 with 화살표 애니메이션

### 4. AI 영상 탭
- 숏폼 영상 그리드 (9/16 비율)
- AI 생성 콘텐츠 뱃지

### 5. 커뮤니티 탭
- 중개사 놀이터
- 실무 질문방
- 분양 정보 공유
- 지역별 모임

## 🎯 개발 진행 상황

### ✅ 완료
- [x] 메인 페이지 UI 구현 (5개 탭)
- [x] 반응형 디자인 (모바일 하단 네비게이션)
- [x] 직방 스타일 헤더 (배경 이미지 포함)
- [x] 구인구직 카드 UI (공인중개사/분양상담사)
- [x] 부동산 뉴스 섹션 (직방 스타일)
- [x] 광고 배너 시스템
- [x] MCP 서버 설정 (Context7)

### 🚧 진행 예정
- [ ] `/sales` 페이지 구현 (상세 공고)
- [ ] 필터링 시스템 (지역, 유형, 급여)
- [ ] 검색 기능
- [ ] 회원가입/로그인
- [ ] 찜하기 기능
- [ ] 실제 뉴스 API 연동
- [ ] AI 매칭 알고리즘

## 🌟 주요 기능

### AI 기반 매칭
- 사용자 프로필 기반 맞춤 공고 추천
- 실시간 매칭 알고리즘

### 실시간 통계
- 오늘 신규 공고: 23건
- 현재 온라인: 156명
- 급구 공고: 8건
- 이번주 채용: 34명

### 반응형 디자인
- 모바일 우선 설계
- 데스크톱 최적화
- 터치 인터랙션 지원

## 📞 문의

- **웹사이트**: [onsia.city](https://www.onsia.city)
- **이메일**: contact@onsia.city
- **GitHub**: [onsia-realty](https://github.com/onsia-realty)

## 📄 라이선스

Copyright © 2025 Onsia Realty. All rights reserved.

---

**개발**: Claude AI Assistant
**디자인 참고**: 직방, 분양라인
**최종 업데이트**: 2025-12-28
