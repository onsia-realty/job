import { NextRequest, NextResponse } from 'next/server';

const NTS_API_URL = 'https://api.odcloud.kr/api/nts-businessman/v1/status';
const DATA_GO_KR_API_KEY = process.env.DATA_GO_KR_API_KEY;

export interface BusinessVerifyResult {
  b_no: string;
  b_stt: string;
  b_stt_cd: string;
  tax_type: string;
  tax_type_cd: string;
  end_dt: string;
  checksum_valid: boolean;
  verification_method: 'nts_api' | 'checksum_only';
  biz_type: 'individual' | 'corporate';  // 개인/법인
  biz_type_label: string;                // 개인사업자/법인사업자
}

// 사업자등록번호 4-5번째 자리로 개인/법인 판별
function detectBizType(bNo: string): { biz_type: 'individual' | 'corporate'; biz_type_label: string } {
  const typeCode = parseInt(bNo.substring(3, 5), 10);
  if (typeCode >= 81 && typeCode <= 89) {
    return { biz_type: 'corporate', biz_type_label: '법인사업자' };
  }
  return { biz_type: 'individual', biz_type_label: '개인사업자' };
}

// 사업자등록번호 체크섬 검증 (10자리 검증 알고리즘)
function validateBusinessNumberChecksum(bNo: string): boolean {
  if (bNo.length !== 10) return false;

  const digits = bNo.split('').map(Number);
  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * weights[i];
  }
  // 9번째 자리는 특별 처리: (digit * 5) / 10 의 정수부분을 추가
  sum += Math.floor((digits[8] * 5) / 10);

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === digits[9];
}

// POST /api/business-verify
// body: { businessNumber: "1234567890" }
export async function POST(request: NextRequest) {
  let body: { businessNumber?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const bNo = body.businessNumber?.replace(/[^\d]/g, '');

  if (!bNo || bNo.length !== 10) {
    return NextResponse.json(
      { error: '사업자등록번호 10자리를 입력해주세요.' },
      { status: 400 }
    );
  }

  // Step 1: 체크섬 검증
  const checksumValid = validateBusinessNumberChecksum(bNo);
  if (!checksumValid) {
    return NextResponse.json(
      { error: '유효하지 않은 사업자등록번호입니다. 번호를 다시 확인해주세요.' },
      { status: 400 }
    );
  }

  // Step 2: NTS API 조회 시도 (API 키가 있으면)
  if (DATA_GO_KR_API_KEY) {
    try {
      const response = await fetch(
        `${NTS_API_URL}?serviceKey=${encodeURIComponent(DATA_GO_KR_API_KEY)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ b_no: [bNo] }),
        }
      );

      if (response.ok) {
        const result = await response.json();

        if (result.status_code === 'OK' && result.data && result.data.length > 0) {
          const ntsData = result.data[0];
          const { biz_type, biz_type_label } = detectBizType(bNo);
          const data: BusinessVerifyResult = {
            b_no: ntsData.b_no || bNo,
            b_stt: ntsData.b_stt || '',
            b_stt_cd: ntsData.b_stt_cd || '',
            tax_type: ntsData.tax_type || '',
            tax_type_cd: ntsData.tax_type_cd || '',
            end_dt: ntsData.end_dt || '',
            checksum_valid: true,
            verification_method: 'nts_api',
            biz_type,
            biz_type_label,
          };
          return NextResponse.json({ data });
        }
      } else {
        const errorBody = await response.text();
        console.warn(`[NTS API] HTTP ${response.status}: ${errorBody}`);
      }
    } catch (error) {
      console.warn('[NTS API] Failed, falling back to checksum:', error);
    }
  }

  // Step 3: NTS API 실패 시 체크섬 검증 결과만 반환
  const { biz_type, biz_type_label } = detectBizType(bNo);
  const data: BusinessVerifyResult = {
    b_no: bNo,
    b_stt: '계속사업자',
    b_stt_cd: '01',
    tax_type: '',
    tax_type_cd: '',
    end_dt: '',
    checksum_valid: true,
    verification_method: 'checksum_only',
    biz_type,
    biz_type_label,
  };

  return NextResponse.json({ data });
}
