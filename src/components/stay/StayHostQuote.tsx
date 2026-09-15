'use client';

import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { calculateHostQuote, koreaToday, type HostQuoteStay } from '@/lib/stay/host-pricing';
import StayInquiryForm from './StayInquiryForm';

const money = (value: number) => `${value.toLocaleString('ko-KR')}원`;
const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);

export default function StayHostQuote({ stay, preview = false }: { stay: HostQuoteStay & { id: string }; preview?: boolean }) {
  const [today] = useState(koreaToday);
  const firstDate = stay.available_from && stay.available_from > today ? stay.available_from : today;
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [month, setMonth] = useState(firstDate.slice(0, 7));
  const [selecting, setSelecting] = useState<'in' | 'out'>('in');
  const [showInquiry, setShowInquiry] = useState(false);
  const quote = calculateHostQuote(stay, checkIn, checkOut, today);
  const hasRate = Number.isSafeInteger(stay.weekly_fee_won) && (stay.weekly_fee_won ?? 0) > 0;
  const canInquire = ['available', 'inquiring', 'leaving'].includes(stay.status);
  const date = new Date(`${month}-01T00:00:00Z`);
  const monthDays = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  const changeDates = () => setShowInquiry(false);
  function selectDay(value: string) {
    changeDates();
    if (selecting === 'in' || !checkIn || value <= checkIn) {
      setCheckIn(value); setCheckOut(''); setSelecting('out');
    } else { setCheckOut(value); setSelecting('in'); }
  }
  const context = quote.ok ? `입주 희망일: ${checkIn}\n퇴실 희망일: ${checkOut} (${quote.days}일)\n예상 임대료: ${money(quote.rentWon)}\n예상 관리비: ${money(quote.maintenanceWon)}\n예상 합계: ${money(quote.totalWon)} (보증금·별도 공과금 제외)\n반환 조건 확인이 필요한 보증금: ${quote.depositWon === null ? '호스트 확인' : money(quote.depositWon)}\n예약 확정 전 예상 견적입니다.` : '';

  return <section id="host-dates" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-xs font-bold text-blue-700">호스트 직접 임대</p>
    <h2 className="mt-2 text-2xl font-extrabold text-slate-900">{stay.weekly_fee_won != null ? money(stay.weekly_fee_won) : stay.daily_fee_won != null ? money(stay.daily_fee_won) : '요금 문의'}<span className="ml-1 text-sm font-medium text-slate-500">{stay.weekly_fee_won != null ? '/ 1주' : stay.daily_fee_won != null ? '/ 1일' : ''}</span></h2>
    <p className="mt-1 text-xs text-slate-500">원하는 날짜를 선택해 예상 금액을 확인하세요.</p>
    <div className="mt-5 grid grid-cols-2 gap-2">
      <label className="rounded-xl border border-slate-200 p-2 text-xs font-bold text-slate-600">체크인 · 입주<input aria-label="체크인 · 입주" type="date" min={firstDate} max={stay.available_to ?? undefined} value={checkIn} onFocus={() => setSelecting('in')} onChange={e => { changeDates(); setCheckIn(e.target.value); if (e.target.value) setMonth(e.target.value.slice(0, 7)); setCheckOut(''); setSelecting('out'); }} className="mt-2 block min-w-0 w-full bg-white text-sm text-slate-900" /></label>
      <label className="rounded-xl border border-slate-200 p-2 text-xs font-bold text-slate-600">체크아웃 · 퇴실<input aria-label="체크아웃 · 퇴실" type="date" min={checkIn ? addDays(checkIn, 1) : firstDate} max={stay.available_to ?? undefined} value={checkOut} onFocus={() => setSelecting('out')} onChange={e => { changeDates(); setCheckOut(e.target.value); }} className="mt-2 block min-w-0 w-full bg-white text-sm text-slate-900" /></label>
    </div>
    <div className="mt-4 rounded-xl bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="이전 달" disabled={month <= firstDate.slice(0, 7)} onClick={() => setMonth(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1)).toISOString().slice(0, 7))} className="rounded-lg p-2 hover:bg-white disabled:opacity-30"><ChevronLeft size={16} /></button>
        <p className="text-sm font-bold" aria-live="polite">{date.getUTCFullYear()}년 {date.getUTCMonth() + 1}월</p>
        <button type="button" aria-label="다음 달" onClick={() => setMonth(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)).toISOString().slice(0, 7))} className="rounded-lg p-2 hover:bg-white"><ChevronRight size={16} /></button>
      </div>
      <p className="mb-2 text-center text-xs text-blue-700">{selecting === 'in' ? '입주일을 선택하세요' : '퇴실일을 선택하세요'}</p>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
        {['일', '월', '화', '수', '목', '금', '토'].map(day => <span className="py-2 text-slate-500" key={day}>{day}</span>)}
        {Array.from({ length: date.getUTCDay() }, (_, i) => <span key={`empty-${i}`} />)}
        {Array.from({ length: monthDays }, (_, i) => {
          const value = `${month}-${String(i + 1).padStart(2, '0')}`;
          const selected = value === checkIn || value === checkOut;
          const between = checkIn && checkOut && value > checkIn && value < checkOut;
          return <button type="button" key={value} aria-label={`${value} ${selecting === 'in' ? '입주' : '퇴실'} 선택`} aria-pressed={selected} disabled={value < firstDate || !!(stay.available_to && value > stay.available_to)} onClick={() => selectDay(value)} className={`min-h-9 rounded-md disabled:opacity-25 ${selected ? 'bg-blue-700 font-bold text-white' : between ? 'bg-blue-100 text-blue-900' : 'hover:bg-blue-50'}`}>{i + 1}</button>;
        })}
      </div>
    </div>
    <div className="mt-3 flex gap-2">{[1, 2, 3, 4].map(weeks => <button key={weeks} type="button" disabled={!checkIn} onClick={() => { changeDates(); setCheckOut(addDays(checkIn, weeks * 7)); setSelecting('in'); }} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold hover:border-blue-500 hover:text-blue-700 disabled:opacity-40">{weeks}주</button>)}</div>
    <div className="mt-4" aria-live="polite">
      {quote.ok ? <><dl className="space-y-2 text-sm text-slate-600"><div className="flex justify-between"><dt>임대료 · {quote.days}일</dt><dd>{money(quote.rentWon)}</dd></div><div className="flex justify-between"><dt>관리비{stay.maintenance_included ? ' · 포함' : ''}</dt><dd>{money(quote.maintenanceWon)}</dd></div><div className="flex justify-between border-t border-slate-200 pt-3 text-base font-extrabold text-slate-900"><dt>예상 이용 금액</dt><dd>{money(quote.totalWon)}</dd></div><div className="flex justify-between pt-1 text-xs"><dt>보증금 · 별도</dt><dd>{quote.depositWon === null ? '호스트 확인' : money(quote.depositWon)}</dd></div></dl><p className="mt-3 text-xs leading-relaxed text-slate-500">{quote.pricingNote} 보증금 반환 조건은 계약 전에 확인해주세요.</p></> : <p className="rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-blue-800">{!hasRate ? '날짜별 요금이 아직 등록되지 않았습니다. 일반 문의로 임대 조건을 확인해주세요.' : !checkIn || !checkOut ? '입주일과 퇴실일을 선택하면 금액을 계산합니다. 퇴실일은 이용 일수에 포함하지 않습니다.' : quote.error}</p>}
    </div>
    <p className="mt-4 text-xs leading-relaxed text-slate-500">선택한 날짜의 이용 가능 여부와 최종 금액은 호스트 확인이 필요합니다. 문의만 접수되며 예약 확정이나 결제는 진행되지 않습니다.</p>
    {!canInquire && <p className="mt-3 text-xs text-amber-800">현재 문의를 받을 수 없는 매물입니다.</p>}
    <button type="button" disabled={!canInquire || (hasRate && !quote.ok)} onClick={() => setShowInquiry(value => !value)} aria-expanded={showInquiry} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-40"><CalendarDays size={16} />{hasRate ? '선택한 날짜로 호스트에게 문의' : '호스트에게 일반 문의'}</button>
    {showInquiry && <div className="mt-3">{preview ? <p className="whitespace-pre-line rounded-xl bg-blue-50 p-3 text-xs text-blue-900">미리보기 예시입니다. 실제 문의는 전송되지 않습니다.{'\n'}{context}</p> : <StayInquiryForm key={`${checkIn}-${checkOut}`} stayId={stay.id} contextMessage={quote.ok ? context : undefined} />}</div>}
  </section>;
}
