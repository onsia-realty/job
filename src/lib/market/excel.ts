/**
 * 엑셀 다운로드 유틸 (브라우저 전용)
 * 출처: raps-clone/renderer/lib/excel.ts — 포팅
 */
import * as XLSX from 'xlsx';
import type { NormalizedTransaction } from './realEstate';
import { formatPrice, formatArea } from './publicApi';

export function downloadTransactionsAsExcel(
  rows: NormalizedTransaction[],
  filename: string
): void {
  const data = rows.map((t) => ({
    거래일자: t.deal_date,
    단지명: t.complex_name,
    법정동: t.dong,
    지번: t.jibun ?? '',
    전용면적: formatArea(t.exclusive_area),
    층: t.floor ?? '',
    건축년도: t.build_year ?? '',
    거래금액: t.price_manwon ? formatPrice(t.price_manwon) : '',
    보증금: t.deposit_manwon ? formatPrice(t.deposit_manwon) : '',
    월세: t.monthly_manwon ? formatPrice(t.monthly_manwon) : '',
    거래유형: t.deal_type === 'trade' ? '매매' : '전월세',
    거래채널: t.deal_channel ?? '',
    해제여부: t.cancel_yn ? 'O' : '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '실거래가');

  const safeFilename = filename.replace(/[^\w\sㄱ-ㅎ가-힣_-]/g, '') + '.xlsx';
  XLSX.writeFile(wb, safeFilename);
}
