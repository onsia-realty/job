'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, Clock } from 'lucide-react';
import Header from '@/components/shared/Header';
import MobileNav from '@/components/shared/MobileNav';

export default function SpecialTermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Header variant="agent" />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/agent" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">특약 AI 생성기</h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">준비 중입니다</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
            상황별 계약 특약조항을 AI가 자동으로 생성해주는 기능을 준비하고 있습니다.
          </p>
          <Link
            href="/agent/ai-assistant"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors text-sm"
          >
            AI 부동산인 비서에게 특약 질문하기
          </Link>
        </div>
      </div>
      <MobileNav variant="agent" />
    </div>
  );
}
