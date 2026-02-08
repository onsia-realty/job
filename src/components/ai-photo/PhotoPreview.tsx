'use client';

import { useState } from 'react';
import { Download, RefreshCw, Check, ArrowLeftRight } from 'lucide-react';

interface PhotoPreviewProps {
  originalUrl: string;
  generatedUrl: string;
  generationTimeMs?: number;
  remaining: number;
  accountLimit: number;
  onRegenerate: () => void;
  onSaveToProfile: () => void;
  isSaving?: boolean;
}

export default function PhotoPreview({
  originalUrl,
  generatedUrl,
  generationTimeMs,
  remaining,
  accountLimit,
  onRegenerate,
  onSaveToProfile,
  isSaving,
}: PhotoPreviewProps) {
  const [viewMode, setViewMode] = useState<'compare' | 'original' | 'generated'>('compare');

  const handleDownload = async () => {
    try {
      const response = await fetch(generatedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-profile-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(generatedUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Mobile: Toggle buttons */}
      <div className="flex gap-2 md:hidden">
        <button
          onClick={() => setViewMode('original')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'original'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          원본
        </button>
        <button
          onClick={() => setViewMode('compare')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
            viewMode === 'compare'
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          비교
        </button>
        <button
          onClick={() => setViewMode('generated')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'generated'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          결과
        </button>
      </div>

      {/* Desktop: Side by side / Mobile: Based on viewMode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original */}
        <div className={`${viewMode === 'generated' ? 'hidden md:block' : ''}`}>
          <p className="text-sm font-medium text-gray-500 mb-2 text-center">원본</p>
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-md">
            <img
              src={originalUrl}
              alt="원본 사진"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Generated */}
        <div className={`${viewMode === 'original' ? 'hidden md:block' : ''}`}>
          <p className="text-sm font-medium text-blue-600 mb-2 text-center">AI 생성 결과</p>
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-md ring-2 ring-blue-200">
            <img
              src={generatedUrl}
              alt="AI 생성 사진"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Generation info */}
      {generationTimeMs && (
        <p className="text-center text-xs text-gray-400">
          생성 시간: {(generationTimeMs / 1000).toFixed(1)}초
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRegenerate}
          disabled={remaining <= 0}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className="w-4 h-4" />
          다시 생성하기
        </button>

        <button
          onClick={onSaveToProfile}
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-medium transition-all shadow-md disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          이 사진 사용하기
        </button>
      </div>

      {/* Download link */}
      <button
        onClick={handleDownload}
        className="w-full flex items-center justify-center gap-2 py-2 text-gray-500 hover:text-blue-600 text-sm transition-colors"
      >
        <Download className="w-4 h-4" />
        이미지 다운로드
      </button>

      {/* Remaining count */}
      <div className="text-center bg-gray-50 rounded-xl py-3 px-4">
        <p className="text-sm text-gray-600">
          남은 횟수:{' '}
          <span className={`font-bold ${remaining <= 1 ? 'text-red-500' : 'text-blue-600'}`}>
            {remaining}
          </span>
          <span className="text-gray-400">/{accountLimit}</span>
        </p>
      </div>
    </div>
  );
}
