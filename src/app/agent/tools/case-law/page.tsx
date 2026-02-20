'use client';

import Link from 'next/link';
import { ArrowLeft, Scale, Clock } from 'lucide-react';
import Header from '@/components/shared/Header';
import MobileNav from '@/components/shared/MobileNav';

export default function CaseLawPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Header variant="agent" />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/agent" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Scale className="w-4 h-4 text-amber-600" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">판례 AI 검색</h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">준비 중입니다</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            중개 관련 판례를 AI가 검색하고 요약해주는 기능을 준비하고 있습니다.
          </p>
          <Link
            href="/agent/ai-assistant"
            className="inline-flex items-center gap-2 bg-amber-600 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-amber-700 transition-colors text-sm"
          >
            AI 부동산인 비서에게 판례 질문하기
          </Link>
        </div>
      </div>
      <MobileNav variant="agent" />
    </div>
  );
}
