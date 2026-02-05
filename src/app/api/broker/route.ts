import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 서버 클라이언트
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// API Keys
const DATA_GO_KR_API_KEY = process.env.DATA_GO_KR_API_KEY;
const SEOUL_API_KEY = process.env.SEOUL_OPEN_API_KEY;

// API Endpoints
const NATIONAL_API_URL = 'http://api.data.go.kr/openapi/tn_pubr_public_med_office_api';
const SEOUL_API_URL = 'http://openapi.seoul.go.kr:8088';

// 개설등록번호 형식: XXXXX-YYYY-NNNNN (지역코드5자리-연도4자리-일련번호5자리)
const REG_NO_PATTERN = /^\d{5}-\d{4}-\d{5}$/;

// API 요청 타임아웃 (15초)
const API_TIMEOUT = 15000;

export interface BrokerOfficeInfo {
  medOfficeNm: string;
  estblRegNo: string;
  opbizLreaClscSe: string;
  rprsvNm: string;
  lctnRoadNmAddr: string;
  lctnLotnoAddr: string;
  telNo: string;
  estblRegDe: string;
  sttusSeNm: string;
  mdatJoinYn: string;
  latitude: string;
  longitude: string;
}

// 타임아웃 적용 fetch
function fetchWithTimeout(url: string, timeoutMs: number = API_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { cache: 'no-store', signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}

// 등록번호 형식 검증
function validateRegNo(regNo: string): { valid: boolean; error?: string } {
  if (!regNo.trim()) {
    return { valid: false, error: '개설등록번호를 입력해주세요' };
  }
  if (!REG_NO_PATTERN.test(regNo.trim())) {
    return {
      valid: false,
      error: '개설등록번호 형식이 올바르지 않습니다 (예: 11710-2022-00250)',
    };
  }
  return { valid: true };
}

// 등록번호에서 지역코드(LAWD_CD) 추출
function extractLawdCd(regNo: string): string {
  return regNo.split('-')[0] || '';
}

// 서울 지역코드 여부 (11로 시작하는 5자리)
function isSeoulRegNo(regNo: string): boolean {
  return extractLawdCd(regNo).startsWith('11');
}

// ========================================
// 1단계: Supabase DB 조회 (즉시 응답)
// ========================================
async function searchDB(regNo: string): Promise<BrokerOfficeInfo | null> {
  try {
    const { data, error } = await supabase
      .from('broker_offices')
      .select('*')
      .eq('estbl_reg_no', regNo)
      .single();

    if (error || !data) return null;

    console.log('[DB] Cache hit:', data.med_office_nm);
    return {
      medOfficeNm: data.med_office_nm,
      estblRegNo: data.estbl_reg_no,
      opbizLreaClscSe: data.opbiz_lrea_clsc_se,
      rprsvNm: data.rprsv_nm,
      lctnRoadNmAddr: data.lctn_road_nm_addr,
      lctnLotnoAddr: data.lctn_lotno_addr,
      telNo: data.tel_no,
      estblRegDe: data.estbl_reg_de,
      sttusSeNm: data.sttus_se_nm,
      mdatJoinYn: data.mdat_join_yn,
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch {
    return null;
  }
}

// ========================================
// DB에 캐싱 (UPSERT)
// ========================================
async function cacheToDB(info: BrokerOfficeInfo, source: string): Promise<void> {
  try {
    const lawdCd = extractLawdCd(info.estblRegNo);
    const { error } = await supabase.from('broker_offices').upsert({
      estbl_reg_no: info.estblRegNo,
      med_office_nm: info.medOfficeNm,
      opbiz_lrea_clsc_se: info.opbizLreaClscSe,
      rprsv_nm: info.rprsvNm,
      lctn_road_nm_addr: info.lctnRoadNmAddr,
      lctn_lotno_addr: info.lctnLotnoAddr,
      tel_no: info.telNo,
      estbl_reg_de: info.estblRegDe,
      sttus_se_nm: info.sttusSeNm,
      mdat_join_yn: info.mdatJoinYn,
      latitude: info.latitude,
      longitude: info.longitude,
      lawd_cd: lawdCd,
      data_source: source,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'estbl_reg_no' });

    if (error) {
      console.warn('[DB] Cache write failed:', error.message);
    } else {
      console.log('[DB] Cached:', info.estblRegNo, 'from', source);
    }
  } catch (error) {
    console.warn('[DB] Cache error:', error);
  }
}

// ========================================
// 2단계: 공공데이터포털 API (전국)
// ========================================
async function searchNationalAPI(regNo: string): Promise<BrokerOfficeInfo | null> {
  if (!DATA_GO_KR_API_KEY) {
    console.warn('[National API] API key not configured');
    return null;
  }

  try {
    const url = new URL(NATIONAL_API_URL);
    url.searchParams.set('serviceKey', DATA_GO_KR_API_KEY);
    url.searchParams.set('pageNo', '1');
    url.searchParams.set('numOfRows', '100');
    url.searchParams.set('type', 'json');
    url.searchParams.set('ESTBL_REG_NO', regNo);

    console.log('[National API] Searching:', regNo);
    const response = await fetchWithTimeout(url.toString());

    if (!response.ok) {
      console.warn('[National API] HTTP', response.status);
      return null;
    }

    const data = await response.json();

    if (data.response?.header?.resultCode !== '00') {
      console.log('[National API] No result:', data.response?.header?.resultCode);
      return null;
    }

    const items = data.response?.body?.items || [];
    if (items.length === 0) return null;

    const item = items[0];
    console.log('[National API] Found:', item.medOfficeNm);
    return {
      medOfficeNm: item.medOfficeNm || '',
      estblRegNo: item.estblRegNo || regNo,
      opbizLreaClscSe: item.opbizLreaClscSe || '',
      rprsvNm: item.rprsvNm || '',
      lctnRoadNmAddr: item.lctnRoadNmAddr || '',
      lctnLotnoAddr: item.lctnLotnoAddr || '',
      telNo: item.telno || '',
      estblRegDe: item.estblRegYmd || '',
      sttusSeNm: item.sttusSeNm || '영업중',
      mdatJoinYn: item.ddcJoinYn || '',
      latitude: item.latitude || '',
      longitude: item.longitude || '',
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn('[National API] Request timeout');
    } else {
      console.error('[National API] Error:', error);
    }
    return null;
  }
}

// ========================================
// 3단계: 서울열린데이터광장 API (서울 전역)
// ========================================
async function searchSeoulAPI(regNo: string): Promise<BrokerOfficeInfo | null> {
  if (!SEOUL_API_KEY) {
    console.warn('[Seoul API] API key not configured');
    return null;
  }

  try {
    // 전체 건수 확인
    const totalUrl = `${SEOUL_API_URL}/${SEOUL_API_KEY}/json/landBizInfo/1/1/`;
    const totalRes = await fetchWithTimeout(totalUrl, 10000);
    const totalData = await totalRes.json();
    const totalCount = totalData.landBizInfo?.list_total_count || 0;

    if (totalCount === 0) {
      console.warn('[Seoul API] No data available');
      return null;
    }

    console.log(`[Seoul API] Searching ${regNo} in ${totalCount} records`);

    // 1000개씩 페이지네이션 (병렬 3개씩 요청)
    const pageSize = 1000;
    const batchSize = 3;
    const totalPages = Math.ceil(totalCount / pageSize);

    for (let batch = 0; batch < totalPages; batch += batchSize) {
      const promises: Promise<BrokerOfficeInfo | null>[] = [];

      for (let i = 0; i < batchSize && (batch + i) < totalPages; i++) {
        const pageIndex = batch + i;
        const start = pageIndex * pageSize + 1;
        const end = Math.min(start + pageSize - 1, totalCount);

        promises.push(
          fetchWithTimeout(
            `${SEOUL_API_URL}/${SEOUL_API_KEY}/json/landBizInfo/${start}/${end}/`,
            10000
          )
            .then(res => res.json())
            .then(pageData => {
              const rows = pageData.landBizInfo?.row || [];
              const found = rows.find((r: Record<string, string>) => r.REST_BRKR_INFO === regNo);
              if (found) {
                return {
                  medOfficeNm: found.BZMN_CONM || '',
                  estblRegNo: found.REST_BRKR_INFO || regNo,
                  opbizLreaClscSe: found.BRKR_TP || '공인중개사',
                  rprsvNm: found.MDT_BSNS_NM || '',
                  lctnRoadNmAddr: found.ADDR || '',
                  lctnLotnoAddr: found.LOT_ADDR || '',
                  telNo: found.TELNO || '',
                  estblRegDe: found.RGST_DE || '',
                  sttusSeNm: found.STTS_SE || '영업중',
                  mdatJoinYn: found.GRTNT_YN || '',
                  latitude: '',
                  longitude: '',
                } as BrokerOfficeInfo;
              }
              return null;
            })
            .catch(() => null)
        );
      }

      const results = await Promise.all(promises);
      const found = results.find(r => r !== null);
      if (found) {
        console.log('[Seoul API] Found:', found.medOfficeNm);
        return found;
      }
    }

    console.log('[Seoul API] Not found in', totalCount, 'records');
    return null;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn('[Seoul API] Request timeout');
    } else {
      console.error('[Seoul API] Error:', error);
    }
    return null;
  }
}

// ========================================
// 4단계: 공공데이터포털 이름 검색 (fallback)
// 등록번호로 못 찾으면 지역코드 기반으로 넓게 검색
// ========================================
async function searchNationalByLawdCd(regNo: string): Promise<BrokerOfficeInfo | null> {
  if (!DATA_GO_KR_API_KEY) return null;

  try {
    const lawdCd = extractLawdCd(regNo);
    const url = new URL(NATIONAL_API_URL);
    url.searchParams.set('serviceKey', DATA_GO_KR_API_KEY);
    url.searchParams.set('pageNo', '1');
    url.searchParams.set('numOfRows', '1000');
    url.searchParams.set('type', 'json');

    console.log('[National API] Fallback search by LAWD_CD:', lawdCd);
    const response = await fetchWithTimeout(url.toString());
    if (!response.ok) return null;

    const data = await response.json();
    if (data.response?.header?.resultCode !== '00') return null;

    const items = data.response?.body?.items || [];
    // 등록번호가 정확히 일치하는 항목 찾기
    const found = items.find(
      (item: Record<string, string>) => item.estblRegNo === regNo
    );

    if (!found) return null;

    console.log('[National API] Fallback found:', found.medOfficeNm);
    return {
      medOfficeNm: found.medOfficeNm || '',
      estblRegNo: found.estblRegNo || regNo,
      opbizLreaClscSe: found.opbizLreaClscSe || '',
      rprsvNm: found.rprsvNm || '',
      lctnRoadNmAddr: found.lctnRoadNmAddr || '',
      lctnLotnoAddr: found.lctnLotnoAddr || '',
      telNo: found.telno || '',
      estblRegDe: found.estblRegYmd || '',
      sttusSeNm: found.sttusSeNm || '영업중',
      mdatJoinYn: found.ddcJoinYn || '',
      latitude: found.latitude || '',
      longitude: found.longitude || '',
    };
  } catch {
    return null;
  }
}

// ========================================
// GET /api/broker?regNo=11710-2022-00250
// ========================================
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const regNo = searchParams.get('regNo')?.trim();
  const testMode = searchParams.get('test') === 'true';

  // 테스트 모드: API 상태 확인
  if (testMode) {
    // 직접 REST API 호출로 테이블 존재 확인 (JS client가 에러를 올바르게 전달하지 않는 이슈 우회)
    let tableExists = false;
    let cachedCount = 0;

    try {
      const checkRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/broker_offices?select=id&limit=0`,
        {
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
        }
      );
      tableExists = checkRes.ok;

      if (tableExists) {
        const { count } = await supabase
          .from('broker_offices')
          .select('*', { count: 'exact', head: true });
        cachedCount = count || 0;
      }
    } catch {
      tableExists = false;
    }

    const response: Record<string, unknown> = {
      message: 'Broker API Status',
      db: {
        tableExists,
        cachedCount,
      },
      apis: {
        national: !!DATA_GO_KR_API_KEY,
        seoul: !!SEOUL_API_KEY,
      },
    };

    if (!tableExists) {
      response.setup = {
        instruction: 'Supabase Dashboard > SQL Editor 에서 supabase/migrations/004_broker_offices.sql 실행 필요',
        note: '테이블 없이도 API 조회는 가능하지만 캐싱이 비활성화됩니다',
      };
    }

    return NextResponse.json(response);
  }

  // 등록번호 검증
  if (!regNo) {
    return NextResponse.json(
      { error: '개설등록번호를 입력해주세요' },
      { status: 400 }
    );
  }

  const validation = validateRegNo(regNo);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  try {
    const startTime = Date.now();
    console.log('=== Broker Search ===', regNo);

    // ① DB 캐시 조회 (즉시)
    const dbResult = await searchDB(regNo);
    if (dbResult) {
      console.log(`=== Found in DB (${Date.now() - startTime}ms) ===`);
      return NextResponse.json({ data: dbResult, source: 'cache' });
    }

    // ② 전국 공공데이터 API (등록번호 직접 검색)
    const nationalResult = await searchNationalAPI(regNo);
    if (nationalResult) {
      console.log(`=== Found in National API (${Date.now() - startTime}ms) ===`);
      cacheToDB(nationalResult, 'national');
      return NextResponse.json({ data: nationalResult, source: 'national' });
    }

    // ③ 서울 등록번호(11xxx)면 서울 API 검색
    if (isSeoulRegNo(regNo) && SEOUL_API_KEY) {
      const seoulResult = await searchSeoulAPI(regNo);
      if (seoulResult) {
        console.log(`=== Found in Seoul API (${Date.now() - startTime}ms) ===`);
        cacheToDB(seoulResult, 'seoul');
        return NextResponse.json({ data: seoulResult, source: 'seoul' });
      }
    }

    // ④ 전국 API 지역코드 기반 넓은 검색 (fallback)
    const fallbackResult = await searchNationalByLawdCd(regNo);
    if (fallbackResult) {
      console.log(`=== Found in National Fallback (${Date.now() - startTime}ms) ===`);
      cacheToDB(fallbackResult, 'national');
      return NextResponse.json({ data: fallbackResult, source: 'national' });
    }

    // 못 찾음
    console.log(`=== Not Found (${Date.now() - startTime}ms) ===`);
    return NextResponse.json({
      error: '해당 등록번호로 등록된 중개사무소를 찾을 수 없습니다',
      searchedRegNo: regNo,
      hint: '등록번호 형식을 확인해주세요 (예: 11710-2022-00250)',
    }, { status: 404 });

  } catch (error) {
    console.error('=== Broker API Error ===', error);
    return NextResponse.json(
      { error: '중개사무소 정보 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
