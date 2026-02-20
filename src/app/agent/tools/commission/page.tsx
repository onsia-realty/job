'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calculator,
  ChevronDown,
  Info,
} from 'lucide-react';
import Header from '@/components/shared/Header';
import MobileNav from '@/components/shared/MobileNav';
import {
  calculateCommission,
  convertMonthlyToAmount,
  formatKRW,
  formatManwon,
  TRANSACTION_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  RATE_TABLE_DATA,
} from '@/lib/commission-calculator';
import type { TransactionType, PropertyType } from '@/lib/commission-calculator';

export default function CommissionCalculatorPage() {
  const [transactionType, setTransactionType] = useState<TransactionType>('sale');
  const [propertyType, setPropertyType] = useState<PropertyType>('residential');
  const [amount, setAmount] = useState('');
  const [deposit, setDeposit] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [showResult, setShowResult] = useState(false);

  const handleCalculate = () => {
    if (transactionType === 'monthly') {
      if (!deposit && !monthlyRent) return;
    } else {
      if (!amount) return;
    }
    setShowResult(true);
  };

  const getResult = () => {
    if (transactionType === 'monthly') {
      const dep = Number(deposit) || 0;
      const rent = Number(monthlyRent) || 0;
      const effectiveAmount = convertMonthlyToAmount(dep, rent);
      return calculateCommission(transactionType, propertyType, effectiveAmount, dep, rent);
    }
    return calculateCommission(transactionType, propertyType, Number(amount) || 0);
  };

  const result = showResult ? getResult() : null;

  const handleReset = () => {
    setAmount('');
    setDeposit('');
    setMonthlyRent('');
    setShowResult(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Header variant="agent" />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/agent" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Calculator className="w-4 h-4 text-emerald-600" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">중개보수 계산기</h1>
          </div>
        </div>

        {/* Calculator Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 space-y-5">
            {/* 거래유형 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">거래유형</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(TRANSACTION_TYPE_LABELS) as [TransactionType, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setTransactionType(key); setShowResult(false); }}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                      transactionType === key
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 부동산 유형 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">부동산 유형</label>
              <div className="relative">
                <select
                  value={propertyType}
                  onChange={(e) => { setPropertyType(e.target.value as PropertyType); setShowResult(false); }}
                  className="w-full bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium"
                >
                  {(Object.entries(PROPERTY_TYPE_LABELS) as [PropertyType, string][]).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 금액 입력 */}
            {transactionType === 'monthly' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">보증금 (만원)</label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={(e) => { setDeposit(e.target.value); setShowResult(false); }}
                    placeholder="예: 3000"
                    className="w-full bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  />
                  {deposit && Number(deposit) > 0 && (
                    <p className="text-xs text-slate-400 mt-1">{formatManwon(Number(deposit))}원</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">월세 (만원)</label>
                  <input
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => { setMonthlyRent(e.target.value); setShowResult(false); }}
                    placeholder="예: 80"
                    className="w-full bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  />
                </div>
                {deposit && monthlyRent && (
                  <div className="bg-blue-50 rounded-xl p-3 text-sm">
                    <div className="flex items-center gap-1.5 text-blue-700 font-medium mb-1">
                      <Info className="w-3.5 h-3.5" />
                      환산보증금
                    </div>
                    <p className="text-blue-600">
                      {formatManwon(convertMonthlyToAmount(Number(deposit), Number(monthlyRent)))}원
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      = 보증금 + (월세 × {convertMonthlyToAmount(Number(deposit), Number(monthlyRent)) < 5000 ? '70' : '100'})
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {transactionType === 'sale' ? '매매가' : '전세금'} (만원)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setShowResult(false); }}
                  placeholder="예: 80000"
                  className="w-full bg-slate-50 border-2 border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
                {amount && Number(amount) > 0 && (
                  <p className="text-xs text-slate-400 mt-1">{formatManwon(Number(amount))}원</p>
                )}
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={handleCalculate}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold py-3 rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/25 text-sm"
              >
                계산하기
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors text-sm font-medium"
              >
                초기화
              </button>
            </div>
          </div>

          {/* 결과 */}
          {result && (
            <div className="border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 md:p-6">
              <h3 className="font-bold text-slate-800 mb-4">계산 결과</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">거래금액</span>
                  <span className="font-medium text-slate-800">{formatManwon(result.transactionAmount)}원</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">적용 구간</span>
                  <span className="text-sm text-slate-700">{result.bracket}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">법정 상한 요율</span>
                  <span className="font-bold text-emerald-600">{result.rateLabel}</span>
                </div>
                <div className="border-t border-slate-200 pt-3"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">최대 중개보수</span>
                  <span className="font-bold text-lg text-slate-800">{formatKRW(result.maxCommission)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">부가세 (10%)</span>
                  <span className="text-sm text-slate-700">{formatKRW(result.vat)}</span>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 flex justify-between items-center">
                  <span className="font-medium text-emerald-700">합계 (부가세 포함)</span>
                  <span className="font-bold text-lg text-emerald-700">{formatKRW(result.total)}</span>
                </div>
              </div>

              <div className="mt-4 bg-amber-50 rounded-xl p-3 text-xs text-amber-700">
                <div className="flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">참고사항</p>
                    <ul className="space-y-0.5 text-amber-600">
                      <li>- 상한 요율 범위 내에서 중개의뢰인과 협의하여 결정합니다</li>
                      <li>- 실제 중개보수는 상한 요율 이하로 협의 가능합니다</li>
                      <li>- 일반과세자의 경우 부가세 10% 별도, 간이과세자는 포함이 일반적</li>
                      <li>- 서울특별시 기준 (출처: land.seoul.go.kr)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 요율표 참조 */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-500" />
              서울특별시 중개보수 요율표
            </h2>

            {/* 주택 매매 */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">주택 매매·교환</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600">
                      <th className="text-left px-3 py-2 font-medium">거래금액</th>
                      <th className="text-right px-3 py-2 font-medium">상한요율</th>
                      <th className="text-right px-3 py-2 font-medium">한도액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {RATE_TABLE_DATA.residential_sale.map((row) => (
                      <tr key={row.rate.label} className="text-slate-700">
                        <td className="px-3 py-2">{row.rate.label}</td>
                        <td className="text-right px-3 py-2 font-medium text-emerald-600">{row.rate.maxRate}%</td>
                        <td className="text-right px-3 py-2">{row.rate.maxAmount ? `${row.rate.maxAmount}만원` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 주택 임대차 */}
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">주택 임대차 (전세·월세)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600">
                      <th className="text-left px-3 py-2 font-medium">거래금액</th>
                      <th className="text-right px-3 py-2 font-medium">상한요율</th>
                      <th className="text-right px-3 py-2 font-medium">한도액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {RATE_TABLE_DATA.residential_lease.map((row) => (
                      <tr key={row.rate.label} className="text-slate-700">
                        <td className="px-3 py-2">{row.rate.label}</td>
                        <td className="text-right px-3 py-2 font-medium text-emerald-600">{row.rate.maxRate}%</td>
                        <td className="text-right px-3 py-2">{row.rate.maxAmount ? `${row.rate.maxAmount}만원` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 오피스텔·주택 외 */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">오피스텔·주택 외</h3>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <span>오피스텔 매매·교환 (전용 85㎡ 이하)</span>
                  <span className="font-medium text-emerald-600">0.5%</span>
                </div>
                <div className="flex justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <span>오피스텔 임대차 (전용 85㎡ 이하)</span>
                  <span className="font-medium text-emerald-600">0.4%</span>
                </div>
                <div className="flex justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <span>주택 외 (상가, 사무실, 토지 등)</span>
                  <span className="font-medium text-emerald-600">0.9% 이내</span>
                </div>
              </div>
            </div>

            {/* 환산보증금 */}
            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
              <p className="font-medium mb-1">월세 환산보증금 계산법</p>
              <p className="text-blue-600">보증금 + (월차임 × 100)</p>
              <p className="text-blue-500 mt-0.5">단, 합산액이 5천만원 미만이면 → 보증금 + (월차임 × 70)</p>
            </div>

            <p className="text-[10px] text-slate-400 mt-3">
              출처: 서울특별시 부동산정보 (land.seoul.go.kr) · 공인중개사법 시행규칙 별표
            </p>
          </div>
        </div>
      </div>

      <MobileNav variant="agent" />
    </div>
  );
}
