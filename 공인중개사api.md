# 공인중개사 검증 API 문서

## 개요

온시아 Job 플랫폼에서 기업회원(공인중개사) 가입 시 **개설등록번호**를 입력하면 전국 공인중개사사무소 정보를 자동으로 조회하여 검증하는 시스템입니다.

직방, 다방, 이실장 등의 부동산 플랫폼과 동일한 방식으로 등록번호 입력 → 사무소 정보 자동 채우기 기능을 제공합니다.

---

## 사용 API 목록

### 1. 공공데이터포털 - 전국공인중개사사무소표준데이터

| 항목 | 내용 |
|------|------|
| **제공기관** | 행정안전부 |
| **포털** | 공공데이터포털 (data.go.kr) |
| **API명** | 전국 공인중개사사무소 표준데이터 |
| **Endpoint** | `http://api.data.go.kr/openapi/tn_pubr_public_med_office_api` |
| **프로토콜** | HTTP (HTTPS 사용 시 리다이렉트 오류 발생) |
| **데이터 포맷** | JSON, XML |
| **인증방식** | ServiceKey (일반 인증키) |
| **커버리지** | 전국 (단, 서울 데이터 누락) |
| **API Key 환경변수** | `DATA_GO_KR_API_KEY` |
| **API Key 발급** | https://www.data.go.kr → 회원가입 → API 활용신청 |

#### 요청 파라미터

| 파라미터 | 필수 | 설명 | 예시 |
|---------|------|------|------|
| `serviceKey` | O | 공공데이터포털 인증키 | `197e316c...` |
| `pageNo` | O | 페이지 번호 | `1` |
| `numOfRows` | O | 한 페이지 결과 수 | `100` |
| `type` | O | 응답 형식 | `json` |
| `ESTBL_REG_NO` | X | 개설등록번호 (대문자!) | `28177-2022-00104` |

#### 주의사항
- 파라미터명 `ESTBL_REG_NO`는 **대문자**로 전달해야 함 (camelCase 불가)
- **HTTPS 사용 불가** → `https://api.data.go.kr`는 `www.api.data.go.kr`로 리다이렉트되어 DNS 오류 발생
- 반드시 `http://api.data.go.kr` 사용

#### 응답 필드 매핑

| API 응답 필드 | 우리 시스템 필드 | 설명 |
|--------------|-----------------|------|
| `medOfficeNm` | `medOfficeNm` | 중개사무소명 |
| `estblRegNo` | `estblRegNo` | 개설등록번호 |
| `opbizLreaClscSe` | `opbizLreaClscSe` | 개업공인중개사 종별구분 |
| `rprsvNm` | `rprsvNm` | 대표자명 |
| `lctnRoadNmAddr` | `lctnRoadNmAddr` | 도로명주소 |
| `lctnLotnoAddr` | `lctnLotnoAddr` | 지번주소 |
| `telno` | `telNo` | 전화번호 (**소문자 주의**) |
| `estblRegYmd` | `estblRegDe` | 개설등록일자 (**필드명 다름**) |
| `sttusSeNm` | `sttusSeNm` | 상태구분명 (영업중/휴업/폐업) |
| `ddcJoinYn` | `mdatJoinYn` | 공제가입유무 (**필드명 다름**) |
| `latitude` | `latitude` | 위도 |
| `longitude` | `longitude` | 경도 |

#### 응답 예시

```json
{
  "response": {
    "header": {
      "resultCode": "00",
      "resultMsg": "NORMAL_SERVICE"
    },
    "body": {
      "items": [
        {
          "medOfficeNm": "당근공인중개사사무소",
          "estblRegNo": "28177-2022-00104",
          "opbizLreaClscSe": "공인중개사",
          "rprsvNm": "조경국",
          "lctnRoadNmAddr": "인천광역시 미추홀구 소성로185번길 6-5 3층(학익동)",
          "telno": "",
          "estblRegYmd": "2022-08-03",
          "ddcJoinYn": "Y",
          "latitude": "",
          "longitude": ""
        }
      ],
      "totalCount": "1"
    }
  }
}
```

#### 확인된 데이터 커버리지 (부분적)
- 경기도 이천시 (41500)
- 경상북도 경산시 (47290)
- 인천광역시 미추홀구 (28177)
- 제주특별자치도 서귀포시 (50130)
- **서울특별시 데이터 없음** → 서울 열린데이터광장 API로 보완

---

### 2. 서울열린데이터광장 - 서울시 부동산중개업 정보

| 항목 | 내용 |
|------|------|
| **제공기관** | 서울특별시 |
| **포털** | 서울 열린데이터광장 (data.seoul.go.kr) |
| **API명** | 서울시 부동산중개업 정보 (landBizInfo) |
| **Endpoint** | `http://openapi.seoul.go.kr:8088/{KEY}/json/landBizInfo/{start}/{end}/` |
| **프로토콜** | HTTP (포트 8088) |
| **데이터 포맷** | JSON, XML |
| **인증방식** | URL 경로에 API Key 포함 |
| **커버리지** | 서울특별시 전역 (약 25,000건+) |
| **API Key 환경변수** | `SEOUL_OPEN_API_KEY` |
| **API Key 발급** | https://data.seoul.go.kr → 회원가입 → 인증키 발급 |

#### URL 구조

```
http://openapi.seoul.go.kr:8088/{API_KEY}/json/landBizInfo/{시작번호}/{끝번호}/
```

| 경로 파라미터 | 설명 | 예시 |
|-------------|------|------|
| `{API_KEY}` | 서울 열린데이터광장 인증키 | `6d67746d...` |
| `{시작번호}` | 조회 시작 행 번호 | `1` |
| `{끝번호}` | 조회 끝 행 번호 (최대 1000) | `1000` |

#### 주의사항
- **등록번호 직접 검색 파라미터 없음** → 전체 데이터 페이지네이션하면서 검색해야 함
- 한 번에 최대 1000건 조회 가능
- 전체 데이터 약 25,000건 → 최소 25번 API 호출 필요
- 우리 시스템에서는 **병렬 3개씩** 요청하여 속도 최적화
- 한 번 조회 후 DB에 캐싱하면 이후 즉시 응답

#### 응답 필드 매핑

| API 응답 필드 | 우리 시스템 필드 | 설명 |
|--------------|-----------------|------|
| `BZMN_CONM` | `medOfficeNm` | 사업장(상호)명 |
| `REST_BRKR_INFO` | `estblRegNo` | 개설등록번호 |
| `BRKR_TP` | `opbizLreaClscSe` | 중개사 유형 |
| `MDT_BSNS_NM` | `rprsvNm` | 중개인명 |
| `ADDR` | `lctnRoadNmAddr` | 주소 |
| `LOT_ADDR` | `lctnLotnoAddr` | 지번주소 |
| `TELNO` | `telNo` | 전화번호 |
| `RGST_DE` | `estblRegDe` | 등록일자 |
| `STTS_SE` | `sttusSeNm` | 상태구분 |
| `GRTNT_YN` | `mdatJoinYn` | 공제가입유무 |

#### 응답 예시

```json
{
  "landBizInfo": {
    "list_total_count": 25394,
    "RESULT": {
      "CODE": "INFO-000",
      "MESSAGE": "정상 처리되었습니다"
    },
    "row": [
      {
        "BZMN_CONM": "온시아공인중개사사무소",
        "REST_BRKR_INFO": "11710-2022-00250",
        "MDT_BSNS_NM": "연대겸",
        "ADDR": "서울특별시 송파구 중대로 197 3층 (가락동)",
        "TELNO": "02-1600-2774",
        "STTS_SE": "영업중"
      }
    ]
  }
}
```

---

### 3. Supabase 캐싱 DB (자체 구축)

| 항목 | 내용 |
|------|------|
| **용도** | API 조회 결과 캐싱 (재조회 시 즉시 응답) |
| **테이블** | `broker_offices` |
| **DB** | Supabase PostgreSQL |
| **마이그레이션** | `supabase/migrations/004_broker_offices.sql` |
| **RLS 정책** | SELECT: 누구나 / INSERT,UPDATE: 누구나 (서버 캐싱용) |

#### 테이블 스키마

```sql
CREATE TABLE broker_offices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estbl_reg_no TEXT NOT NULL UNIQUE,       -- 개설등록번호
  med_office_nm TEXT NOT NULL DEFAULT '',   -- 중개사무소명
  opbiz_lrea_clsc_se TEXT DEFAULT '',       -- 종별구분
  rprsv_nm TEXT DEFAULT '',                 -- 대표자명
  lctn_road_nm_addr TEXT DEFAULT '',        -- 도로명주소
  lctn_lotno_addr TEXT DEFAULT '',          -- 지번주소
  tel_no TEXT DEFAULT '',                   -- 전화번호
  estbl_reg_de TEXT DEFAULT '',             -- 개설등록일자
  sttus_se_nm TEXT DEFAULT '영업중',         -- 상태 (영업중/휴업/폐업)
  mdat_join_yn TEXT DEFAULT '',             -- 공제가입유무
  latitude TEXT DEFAULT '',                 -- 위도
  longitude TEXT DEFAULT '',                -- 경도
  lawd_cd TEXT DEFAULT '',                  -- 법정동코드 (앞5자리)
  data_source TEXT DEFAULT 'api',           -- 데이터 출처
  last_synced_at TIMESTAMPTZ DEFAULT NOW(), -- 동기화 시각
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 인덱스
- `idx_broker_estbl_reg_no` → 등록번호 검색
- `idx_broker_lawd_cd` → 지역코드 검색
- `idx_broker_med_office_nm` → 사무소명 검색
- `idx_broker_sttus` → 상태 필터

---

## 조회 아키텍처 (4-Tier Fallback)

```
사용자 입력: 개설등록번호 (예: 11710-2022-00250)
         │
         ▼
    ┌─────────────┐
    │ 형식 검증     │  XXXXX-YYYY-NNNNN 패턴 체크
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │ ① DB 캐시    │  Supabase broker_offices 테이블 조회
    │   (즉시)     │  → 캐시 히트 시 즉시 반환 (source: "cache")
    └──────┬──────┘
           │ miss
    ┌──────▼──────┐
    │ ② 전국 API   │  공공데이터포털 (data.go.kr)
    │  (등록번호)   │  → ESTBL_REG_NO 직접 검색
    └──────┬──────┘  → 히트 시 DB 캐싱 + 반환 (source: "national")
           │ miss
    ┌──────▼──────┐
    │ ③ 서울 API   │  서울열린데이터광장 (11xxx 등록번호만)
    │  (페이지네이션)│  → 25,000건 중 검색 (병렬 3개씩)
    └──────┬──────┘  → 히트 시 DB 캐싱 + 반환 (source: "seoul")
           │ miss
    ┌──────▼──────┐
    │ ④ 전국 API   │  공공데이터포털 (LAWD_CD 기반 넓은 검색)
    │  (Fallback)  │  → 지역코드로 1000건 조회 후 매칭
    └──────┬──────┘  → 히트 시 DB 캐싱 + 반환 (source: "national")
           │ miss
    ┌──────▼──────┐
    │  404 반환    │  "해당 등록번호로 등록된 중개사무소를 찾을 수 없습니다"
    └─────────────┘
```

---

## 개설등록번호 체계

```
XXXXX - YYYY - NNNNN
  │       │      │
  │       │      └─ 일련번호 (5자리)
  │       └─ 등록 연도 (4자리)
  └─ 법정동코드/LAWD_CD (5자리) = 지역코드
```

### 지역코드 예시

| 코드 | 지역 |
|------|------|
| `11xxx` | 서울특별시 (→ 서울 API 사용) |
| `26xxx` | 부산광역시 |
| `27xxx` | 대구광역시 |
| `28xxx` | 인천광역시 |
| `29xxx` | 광주광역시 |
| `30xxx` | 대전광역시 |
| `31xxx` | 울산광역시 |
| `36xxx` | 세종특별자치시 |
| `41xxx` | 경기도 |
| `42xxx` | 강원특별자치도 |
| `43xxx` | 충청북도 |
| `44xxx` | 충청남도 |
| `45xxx` | 전라북도 |
| `46xxx` | 전라남도 |
| `47xxx` | 경상북도 |
| `48xxx` | 경상남도 |
| `50xxx` | 제주특별자치도 |

---

## API 엔드포인트

### `GET /api/broker?regNo={등록번호}`

공인중개사사무소 정보를 조회합니다.

#### 요청

```
GET /api/broker?regNo=11710-2022-00250
```

#### 성공 응답 (200)

```json
{
  "data": {
    "medOfficeNm": "온시아공인중개사사무소",
    "estblRegNo": "11710-2022-00250",
    "opbizLreaClscSe": "공인중개사",
    "rprsvNm": "연대겸",
    "lctnRoadNmAddr": "서울특별시 송파구 중대로 197 3층 (가락동)",
    "lctnLotnoAddr": "",
    "telNo": "02-1600-2774",
    "estblRegDe": "",
    "sttusSeNm": "영업중",
    "mdatJoinYn": "",
    "latitude": "",
    "longitude": ""
  },
  "source": "cache"
}
```

#### `source` 값 의미

| source | 의미 |
|--------|------|
| `cache` | Supabase DB 캐시에서 즉시 조회 |
| `national` | 공공데이터포털 API에서 실시간 조회 |
| `seoul` | 서울열린데이터광장 API에서 실시간 조회 |

#### 에러 응답

| 상태 | 응답 | 원인 |
|------|------|------|
| 400 | `{"error": "개설등록번호를 입력해주세요"}` | regNo 파라미터 없음 |
| 400 | `{"error": "개설등록번호 형식이 올바르지 않습니다"}` | XXXXX-YYYY-NNNNN 형식 아님 |
| 404 | `{"error": "해당 등록번호로 등록된 중개사무소를 찾을 수 없습니다"}` | 모든 API에서 찾지 못함 |
| 500 | `{"error": "중개사무소 정보 조회 중 오류가 발생했습니다"}` | 서버 내부 오류 |

### `GET /api/broker?test=true`

API 상태를 확인합니다.

```json
{
  "message": "Broker API Status",
  "db": {
    "tableExists": true,
    "cachedCount": 3
  },
  "apis": {
    "national": true,
    "seoul": true
  }
}
```

---

## 환경변수

```env
# .env.local

# 공공데이터포털 API (전국 중개사무소)
DATA_GO_KR_API_KEY=발급받은_인증키

# 서울 열린데이터광장 API (서울 중개사무소)
SEOUL_OPEN_API_KEY=발급받은_인증키

# Supabase (DB 캐싱)
NEXT_PUBLIC_SUPABASE_URL=https://프로젝트.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=발급받은_anon_key
```

---

## API Key 발급 방법

### 공공데이터포털 (data.go.kr)

1. https://www.data.go.kr 접속 → 회원가입/로그인
2. "전국 공인중개사사무소 표준데이터" 검색
3. "활용신청" 클릭 → 신청 사유 작성
4. **즉시 발급됨** (일반 인증키 사용)
5. 마이페이지 > 활용현황에서 인증키 확인

### 서울 열린데이터광장 (data.seoul.go.kr)

1. https://data.seoul.go.kr 접속 → 회원가입/로그인
2. "인증키 신청/관리" 메뉴
3. 인증키 신청 → **즉시 발급됨**
4. 발급된 인증키를 환경변수에 설정

---

## 기술 사양

| 항목 | 값 |
|------|-----|
| **프레임워크** | Next.js 16 (App Router) |
| **파일 위치** | `src/app/api/broker/route.ts` |
| **API 타임아웃** | 15초 (Seoul API 페이지: 10초) |
| **Seoul API 병렬도** | 3개 동시 요청 |
| **등록번호 정규식** | `/^\d{5}-\d{4}-\d{5}$/` |
| **캐싱 전략** | Write-through (조회 성공 시 즉시 DB 저장) |
| **DB 충돌 처리** | UPSERT (ON CONFLICT estbl_reg_no) |

---

## 테스트 검증 결과

| 지역 | 등록번호 | 사무소명 | 소스 | 결과 |
|------|---------|---------|------|------|
| 서울 송파 | 11710-2022-00250 | 온시아공인중개사사무소 | Seoul API | OK |
| 인천 미추홀 | 28177-2022-00104 | 당근공인중개사사무소 | National API | OK |
| 제주 서귀포 | 50130-2022-00006 | 제주대지공인중개사사무소 | National API | OK |
| 경기 이천 | 41500-2020-00013 | 한양수자인공인중개사사무소 | National API | OK |
| 경북 경산 | 47290-2022-00001 | 뉴황금공인중개사사무소 | National API | OK |

---

## 한계 및 향후 개선 방향

### 현재 한계
1. **공공데이터포털 커버리지 불완전** - 전국 모든 시군구 데이터가 포함되지 않음 (일부 지역만)
2. **서울 API 속도** - 등록번호 직접 검색 불가 → 25,000건 페이지네이션 필요 (첫 조회 시 수초 소요)
3. **위도/경도 누락** - 서울 API에서는 좌표 정보 미제공

### 향후 개선 가능
1. **LOCALDATA (지방행정인허가데이터)** - `localdata.go.kr`에서 전국 부동산중개업 전체 데이터 다운로드 가능 (opnSvcId: `07_22_16_P`)
2. **국토교통부 부동산중개업소정보서비스** - LAWD_CD 파라미터로 지역별 검색 가능
3. **Supabase 벌크 임포트** - LOCALDATA CSV를 Supabase에 일괄 업로드하면 모든 조회가 DB 캐시에서 즉시 응답

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `src/app/api/broker/route.ts` | 메인 API 라우트 (4단계 조회 로직) |
| `supabase/migrations/004_broker_offices.sql` | DB 마이그레이션 (테이블 생성) |
| `src/app/agent/auth/signup/page.tsx` | 회원가입 페이지 (등록번호 입력 → 자동 채우기) |
| `src/lib/auth.ts` | 인증 라이브러리 (signUp 메타데이터에 중개사무소 정보 포함) |
| `scripts/apply-migration.mjs` | DB 마이그레이션 스크립트 |
| `.env.local` | API Key 설정 |

---

*작성일: 2026-02-05*
*프로젝트: 온시아 Job Matching Platform*
