# 온시아 JOB (Onsia Job)

부동산 전문가를 위한 AI 기반 구인구직 플랫폼

![Next.js](https://img.shields.io/badge/Next.js-16.1.3-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase)

## 주요 기능

### 구현 완료
- **랜딩 페이지**: 직방 스타일 다크 테마 UI
  - 영상 배너 (2/3) + 카테고리 카드 (1/3)
  - 공지사항 슬라이더
  - 부동산 뉴스 섹션
  - 광고 배너
- **분양상담사 구인구직** (`/sales`)
  - 분양라인 스타일 공고 리스트
  - 티어 시스템 (유니크/슈페리어/프리미엄/일반)
  - 필터링 (지역, 현장유형)
- **공고 등록** (`/sales/jobs/new`)
  - 이미지 업로드 (Supabase Storage)
  - 급여형태: 건당 / % 비율제
  - 연락처 자동 포맷 (010-XXXX-XXXX)
- **Supabase 연동**
  - PostgreSQL 데이터베이스
  - Storage (이미지 업로드)
  - RLS (Row Level Security) 정책

### 개발 예정
- [ ] DB에서 공고 목록 불러오기
- [ ] 사용자 인증 (카카오/구글 로그인)
- [ ] 공인중개사 섹션 (`/agent`)
- [ ] AI 매칭 시스템
- [ ] 커뮤니티 게시판

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Icons | Lucide React |

## 시작하기

### 1. 저장소 클론
```bash
git clone https://github.com/YOUR_USERNAME/onsia-job.git
cd onsia-job
```

### 2. 의존성 설치
```bash
pnpm install
```

### 3. 환경변수 설정
`.env.local` 파일 생성:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase 설정
Supabase SQL Editor에서 다음 파일 실행:
- `supabase/migrations/001_initial_schema.sql` - 테이블 생성
- `supabase/migrations/002_storage_setup.sql` - Storage 정책

### 5. 개발 서버 실행
```bash
pnpm dev
```

http://localhost:3000 에서 확인

## 프로젝트 구조

```
onsia-job/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 랜딩 페이지 (직방 스타일)
│   │   ├── sales/
│   │   │   ├── page.tsx          # 분양상담사 메인
│   │   │   └── jobs/
│   │   │       ├── [id]/page.tsx # 공고 상세
│   │   │       └── new/page.tsx  # 공고 등록
│   │   └── agent/                # 공인중개사 (예정)
│   ├── lib/
│   │   └── supabase.ts           # Supabase 클라이언트
│   └── types/
│       └── database.ts           # DB 타입 정의
├── supabase/
│   └── migrations/               # SQL 마이그레이션
└── public/
```

## 데이터베이스 스키마

### jobs 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | Primary Key |
| title | text | 공고 제목 |
| site_name | text | 현장명 |
| description | text | 상세 설명 |
| region | text | 지역 |
| site_type | text | 현장 유형 |
| salary_type | text | 급여 형태 |
| salary_amount | text | 급여 금액 |
| thumbnail_url | text | 썸네일 이미지 |
| tier | text | 티어 (unique/superior/premium/normal) |
| is_approved | boolean | 승인 여부 |
| created_at | timestamp | 생성일 |

## 참고 자료

### 벤치마크 사이트
- [직방](https://zigbang.com) - 랜딩 페이지 레이아웃
- [분양라인](https://bunyangline.com) - 구인공고 티어 시스템

## 라이선스

MIT License

---

*Developed with Claude Code*
