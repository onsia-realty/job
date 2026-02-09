'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Image as ImageIcon, Clock, X, Download, Check } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/auth';
import type { AiPhotoStyle } from '@/lib/ai-photo-styles';
import { STYLE_INFO } from '@/lib/ai-photo-styles';
import { ACCOUNT_LIMIT } from '@/lib/validations/ai-photo';
import PhotoUploader from '@/components/ai-photo/PhotoUploader';
import StyleSelector from '@/components/ai-photo/StyleSelector';
import GenerationProgress from '@/components/ai-photo/GenerationProgress';
import PhotoPreview from '@/components/ai-photo/PhotoPreview';

type Step = 'upload' | 'style' | 'generating' | 'preview';

interface GenerationResult {
  id: string;
  originalImageUrl: string;
  generatedImageUrl: string;
  style: AiPhotoStyle;
  generationTimeMs: number;
}

interface HistoryItem {
  id: string;
  original_image_url: string;
  generated_image_url: string | null;
  style: AiPhotoStyle;
  status: string;
  generation_time_ms: number | null;
  created_at: string;
}

export default function AiPhotoPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<AiPhotoStyle | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [remaining, setRemaining] = useState(ACCOUNT_LIMIT);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Get auth token
  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }, []);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    const token = await getToken();
    if (!token) return;

    try {
      const res = await fetch('/api/ai-photo/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.generations || []);
        setRemaining(data.remaining ?? ACCOUNT_LIMIT);
      }
    } catch {
      // Silently fail - history is non-critical
    } finally {
      setHistoryLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (user) fetchHistory();
    else setHistoryLoading(false);
  }, [user, fetchHistory]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/agent/auth/login');
    }
  }, [authLoading, user, router]);

  const handlePhotoSelected = (file: File, preview: string) => {
    setSelectedFile(file);
    setPreviewUrl(preview);
    setStep('style');
    setError(null);
    setSaveSuccess(false);
  };

  const handleClearPhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedStyle(null);
    setStep('upload');
    setResult(null);
    setError(null);
  };

  const handleStyleSelect = (style: AiPhotoStyle) => {
    setSelectedStyle(style);
  };

  const handleGenerate = async () => {
    if (!selectedFile || !selectedStyle) return;

    setStep('generating');
    setError(null);

    const token = await getToken();
    if (!token) {
      setError('로그인이 필요합니다');
      setStep('style');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('style', selectedStyle);

    try {
      const res = await fetch('/api/ai-photo/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || '생성에 실패했습니다');
        setStep('style');
        return;
      }

      setResult(data.generation);
      setStep('preview');
      fetchHistory(); // Refresh history + remaining count
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요');
      setStep('style');
    }
  };

  const handleRegenerate = () => {
    setResult(null);
    setStep('style');
    setSaveSuccess(false);
  };

  const handleSaveToProfile = async () => {
    if (!result) return;

    setIsSaving(true);
    const token = await getToken();
    if (!token) {
      setError('로그인이 필요합니다');
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/ai-photo/save', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ generationId: result.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || '저장에 실패했습니다');
      } else {
        setSaveSuccess(true);
        fetchHistory();
      }
    } catch {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  // Save history item as profile photo
  const handleHistorySave = async (item: HistoryItem) => {
    if (!item.generated_image_url) return;

    setIsSaving(true);
    setError(null);
    const token = await getToken();
    if (!token) {
      setError('로그인이 필요합니다');
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/ai-photo/save', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ generationId: item.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || '저장에 실패했습니다');
      } else {
        setSaveSuccess(true);
        setSelectedHistory(null);
        fetchHistory();
      }
    } catch {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  // Download image
  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `ai-profile-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const stepIndex = ['upload', 'style', 'generating', 'preview'].indexOf(step);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/agent/mypage" className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-gray-900">AI 이력서 사진</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {['사진 업로드', '스타일 선택', 'AI 변환', '완료'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${i <= stepIndex
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-400'
                }
                ${i === stepIndex ? 'ring-2 ring-blue-300' : ''}
              `}>
                <span className={`
                  w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                  ${i < stepIndex
                    ? 'bg-blue-600 text-white'
                    : i === stepIndex
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-white'
                  }
                `}>
                  {i < stepIndex ? '✓' : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < 3 && (
                <div className={`w-6 h-0.5 ${i < stepIndex ? 'bg-blue-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Save success message */}
        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            프로필 사진이 저장되었습니다!
          </div>
        )}

        {/* Main content area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">사진을 업로드하세요</h2>
                <p className="text-gray-500 text-sm mt-1">
                  셀카나 핸드폰 사진을 올리면 AI가 프로필 사진으로 변환해드립니다
                </p>
              </div>
              <PhotoUploader
                onPhotoSelected={handlePhotoSelected}
                selectedPreview={previewUrl}
                onClear={handleClearPhoto}
              />
            </div>
          )}

          {step === 'style' && (
            <div className="space-y-6">
              {/* Uploaded photo preview (small) */}
              {previewUrl && (
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img src={previewUrl} alt="업로드 사진" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">업로드 완료</p>
                    <button
                      onClick={handleClearPhoto}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      다른 사진 선택
                    </button>
                  </div>
                </div>
              )}

              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">스타일을 선택하세요</h2>
                <p className="text-gray-500 text-sm mt-1">
                  원하는 프로필 스타일을 골라주세요
                </p>
              </div>

              <StyleSelector
                selectedStyle={selectedStyle}
                onStyleSelect={handleStyleSelect}
              />

              <button
                onClick={handleGenerate}
                disabled={!selectedStyle || remaining <= 0}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold text-lg transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {remaining <= 0 ? '생성 한도를 초과했습니다' : 'AI 이력서 사진 생성하기'}
              </button>

              {remaining <= 0 && (
                <p className="text-center text-sm text-gray-400">
                  계정당 {ACCOUNT_LIMIT}회까지 생성할 수 있습니다
                </p>
              )}
            </div>
          )}

          {step === 'generating' && (
            <GenerationProgress />
          )}

          {step === 'preview' && result && (
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">AI 이력서 사진 완성!</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {STYLE_INFO[result.style]?.label} 스타일
                </p>
              </div>
              <PhotoPreview
                originalUrl={result.originalImageUrl}
                generatedUrl={result.generatedImageUrl}
                generationTimeMs={result.generationTimeMs}
                remaining={remaining}
                accountLimit={ACCOUNT_LIMIT}
                onRegenerate={handleRegenerate}
                onSaveToProfile={handleSaveToProfile}
                isSaving={isSaving}
              />
            </div>
          )}
        </div>

        {/* Generation history */}
        {!historyLoading && history.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-600">생성 이력</h3>
              <span className="text-xs text-gray-400">({history.filter((h) => h.status === 'COMPLETED' || h.status === 'ACCEPTED').length}장)</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {history
                .filter((h) => h.status === 'COMPLETED' || h.status === 'ACCEPTED')
                .slice(0, 10)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedHistory(item)}
                    className="shrink-0 w-20 space-y-1 text-left group"
                  >
                    <div className={`w-20 h-[106px] rounded-xl overflow-hidden bg-gray-100 shadow-sm border-2 transition-all group-hover:shadow-md group-hover:scale-[1.02] ${
                      item.status === 'ACCEPTED' ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-200 group-hover:border-blue-300'
                    }`}>
                      {item.generated_image_url ? (
                        <img
                          src={item.generated_image_url}
                          alt="생성된 사진"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 text-center truncate">
                      {STYLE_INFO[item.style]?.label || item.style}
                    </p>
                    {item.status === 'ACCEPTED' && (
                      <p className="text-[10px] text-green-600 text-center font-medium">사용중</p>
                    )}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* History detail modal */}
        {selectedHistory && selectedHistory.generated_image_url && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setSelectedHistory(null)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {/* Modal header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div>
                  <p className="font-bold text-gray-900 text-sm">
                    {STYLE_INFO[selectedHistory.style]?.label || selectedHistory.style}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(selectedHistory.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                    {selectedHistory.generation_time_ms && ` · ${(selectedHistory.generation_time_ms / 1000).toFixed(1)}초`}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedHistory(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Photo */}
              <div className="aspect-[3/4] bg-gray-100">
                <img
                  src={selectedHistory.generated_image_url}
                  alt="AI 생성 사진"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Status badge */}
              {selectedHistory.status === 'ACCEPTED' && (
                <div className="mx-4 mt-3 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-center">
                  <p className="text-xs text-green-700 font-medium">현재 프로필 사진으로 사용중</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="p-4 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(selectedHistory.generated_image_url!)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    다운로드
                  </button>
                  {selectedHistory.status !== 'ACCEPTED' && (
                    <button
                      onClick={() => handleHistorySave(selectedHistory)}
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      프로필로 사용하기
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info footer */}
        <div className="text-center text-xs text-gray-400 space-y-1 pb-8">
          <p>계정당 최대 {ACCOUNT_LIMIT}회 무료 생성 가능</p>
          <p>AI가 생성한 사진은 실제와 다를 수 있습니다</p>
        </div>
      </div>
    </div>
  );
}
