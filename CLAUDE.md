# 온시아 Job Matching 프로젝트

## 프로젝트 개요
부동산 전문가를 위한 AI 기반 구인구직 플랫폼

**핵심 기능**:
- 🏢 공인중개사 / 분양상담사 구인구직
- 📰 AI 요약 부동산 뉴스
- 🎥 AI 숏폼 영상 콘텐츠
- 👥 커뮤니티 네트워킹

---

## 📅 개발 진행 상황

### 2025-12-28

#### ✅ 완료된 작업

**9. 모바일 최적화 완료** (`src/app/page.tsx`)
- 헤더: 모바일에서 상단 네비게이션 숨김, 로고/텍스트 크기 축소
- 탭: 데스크톱에서만 표시, 모바일은 하단 네비게이션 사용
- 폰트: 반응형 폰트 크기 (text-sm → text-lg → text-3xl 등)
- 버튼: 모바일에서 전체 너비, 터치 친화적 크기
- 통계 배너: 그리드 간격 조정, 아이콘/텍스트 크기 축소
- 비디오/이미지: 모바일에서 세로 스택, 높이 250px
- 뉴스 카드: 날짜 위치 조정, 반응형 패딩
- 광고 배너: 모바일 높이 200px, 세로 스택
- AI 영상: 2열 그리드, 작은 플레이 버튼
- 커뮤니티: 1열 레이아웃, 작은 패딩

**1. 메인 페이지 UI 구현** (`src/app/page.tsx`)
- 5개 탭 구조: 홈, 구인구직, 뉴스, AI 영상, 커뮤니티
- 반응형 디자인 (모바일 하단 네비게이션)
- 분양라인 스타일 참조한 구인구직 카드 UI
- 직방 스타일 미디어 섹션 (영상/이미지)

**2. 구인구직 카테고리 페이지**
- 공인중개사 / 분양상담사 카테고리 분리
- 실시간 통계 배너
- 인기 지역/프로젝트 태그
- 프리미엄 공고 배지 시스템

**3. 홈 탭 기능**
- 히어로 섹션 with AI 브랜딩
- 실시간 뉴스 피드 (AI 요약)
- AI 숏폼 영상 그리드
- 급구 공고 섹션

**4. MCP 서버 설정**
- Context7 MCP 서버 추가 (`.mcp.json`)
- 라이브러리 문서 검색 기능 활성화

**5. 개발 환경 문제 해결**
- 포트 충돌 해결 (3000-3003 포트 정리)
- PowerShell 경로 오류 해결 (공백 경로 처리)

**6. 직방 스타일 헤더 구현**
- 배경 이미지 (온시아 파노라믹 야경)
- 상단 네비게이션 바 (로그인, 상품문의)
- 원형 화살표 SVG 아이콘
- 둥근 사각형 테두리 버튼

**7. UI 개선 작업**
- 공인중개사/분양상담사 카드 크기 축소 (2/3)
- 영상/이미지 비율 조정 (2:1)
- 부동산 뉴스 섹션 (직방 스타일 리스트)
- 광고 배너 2개 추가 (SPONSORED, PROMOTION)
- 텍스트 가독성 개선 (드롭 섀도우, 폰트 굵기)

**8. GitHub 저장소 설정**
- Git 초기화 및 .gitignore 생성
- README.md 작성
- 초기 커밋 및 GitHub 푸시
- Repository: https://github.com/onsia-realty/job.git

---

## 🏗️ 프로젝트 구조

```
Job matching/
├── src/
│   └── app/
│       ├── page.tsx          # 메인 페이지 (5개 탭)
│       ├── sales/            # 구인구직 상세 (예정)
│       └── auth/             # 인증 (예정)
├── .mcp.json                 # MCP 서버 설정
└── CLAUDE.md                 # 개발 이력 (본 문서)
```

---

## 🎨 디자인 시스템

### 컬러 팔레트
- **Primary**: Blue-600 (#2563eb) → Cyan-600 (#0891b2)
- **Secondary**: Teal-600, Orange-500
- **Accent**: Gradient from-blue-600 to-cyan-600

### 컴포넌트
- **TabButton**: 활성 탭 gradient 배경
- **JobCard**: 호버 효과, 뱃지 시스템
- **MobileNavButton**: 하단 고정 네비게이션

### 아이콘 라이브러리
- Lucide React (Building2, Briefcase, Newspaper, Video, Users 등)

---

## 📊 임시 데이터 구조

### 구인공고 (jobListings)
```typescript
{
  id: number
  title: string
  company: string
  location: string
  region: string          // 지역 필터링용
  type: string            // 아파트/지산/오피스텔/상가
  commission: string
  deadline: string
  salary: string
  tags: string[]
  badges: string[]        // HOT, 신규, 대박
  isPremium: boolean
  image: string
  views: number
}
```

---

## 🔧 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

### AI/MCP
- **Context7**: 라이브러리 문서 검색

### 개발 도구
- Claude Code (AI 개발 도우미)
- PowerShell (Windows 환경)

---

## 📝 다음 작업 계획

### 우선순위 1 (핵심 기능)
- [ ] `/sales` 페이지 구현 (공인중개사/분양상담사 상세)
- [ ] 필터링 시스템 (지역, 유형, 급여)
- [ ] 검색 기능
- [ ] 상세 공고 페이지

### 우선순위 2 (사용자 경험)
- [ ] 회원가입/로그인 (`/auth`)
- [ ] 찜하기 기능
- [ ] 지원하기 기능
- [ ] 마이페이지

### 우선순위 3 (콘텐츠)
- [ ] 실제 뉴스 API 연동
- [ ] AI 영상 생성 시스템
- [ ] 커뮤니티 게시판

### 우선순위 4 (고도화)
- [ ] AI 매칭 알고리즘
- [ ] 실시간 채팅
- [ ] 푸시 알림
- [ ] 관리자 대시보드

---

## 🐛 해결된 이슈

### 포트 충돌 (2025-12-28)
**문제**: 3000-3003 포트에 여러 Next.js 서버 동시 실행
**해결**: `Stop-Process -Id` 명령어로 프로세스 종료

### 경로 오류 (2025-12-28)
**문제**: PowerShell에서 공백 포함 경로 인식 불가
**해결**: 따옴표로 경로 감싸기 `cd "Job matching"`

---

## 📚 참고 자료

### 벤치마크 사이트
- **분양라인** (bunyangline.com): 구인구직 카드 UI
- **직방** (zigbang.com): 미디어 섹션, 레이아웃
- **온시아** (onsia.city): 타겟 비즈니스 모델

### 디자인 영감
- Gradient 버튼 스타일
- 유리 모피즘 (backdrop-blur)
- 마이크로 인터랙션 (hover effects)

---

## 💡 개발 노트

### 성능 최적화 고려사항
- 이미지 lazy loading
- 무한 스크롤 구현 필요
- SSR vs CSR 전략 수립

### 접근성
- ARIA 레이블 추가 필요
- 키보드 네비게이션 개선
- 색상 대비 검토

### SEO
- 메타 태그 최적화
- Open Graph 설정
- 구조화된 데이터 (JSON-LD)

---

## 📞 연락처 & 리소스

**프로젝트 위치**: `D:\claude\onsia-Job\Job matching\`

**주요 파일**:
- 메인 페이지: `src/app/page.tsx`
- MCP 설정: `.mcp.json`
- 개발 이력: `CLAUDE.md`

---

*Last Updated: 2025-12-28*
*Developer: Claude AI Assistant*
