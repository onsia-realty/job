'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Image as ImageIcon, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import BannerPreview from './BannerPreview';
import {
  BANNER_PRESETS,
  SAMPLE_BANNER_IMAGES,
  generateBannerHtml,
  type BannerData,
} from './bannerPresets';
import { getTemplatesByCategory } from './templates';

interface BannerBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (bannerHtml: string, templateHtml?: string) => void;
  onImageUpload?: (file: File) => Promise<string | null>;
  onTitleChange?: (title: string, subtitle: string) => void;
  defaultTitle?: string;
  defaultSubtitle?: string;
  existingBannerData?: BannerData | null;
  templateCategory?: 'agent' | 'sales';
}

export default function BannerBuilderModal({
  isOpen,
  onClose,
  onApply,
  onImageUpload,
  onTitleChange,
  defaultTitle = '',
  defaultSubtitle = '',
  existingBannerData,
  templateCategory,
}: BannerBuilderModalProps) {
  const [bgUrl, setBgUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [presetId, setPresetId] = useState('dark-classic');
  const [opacity, setOpacity] = useState(0.55);
  const [uploading, setUploading] = useState(false);
  const [samplePage, setSamplePage] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const templates = templateCategory ? getTemplatesByCategory(templateCategory) : [];
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || null;

  const logoInputRef = useRef<HTMLInputElement>(null);
  const templateEditRef = useRef<HTMLDivElement>(null);

  // Initialize from existing data or defaults
  useEffect(() => {
    if (!isOpen) return;
    setSelectedTemplateId(null);
    if (existingBannerData) {
      setBgUrl(existingBannerData.bgUrl || '');
      setLogoUrl(existingBannerData.logoUrl || '');
      setTitle(existingBannerData.title || '');
      setSubtitle(existingBannerData.subtitle || '');
      setPresetId(existingBannerData.presetId || 'dark-classic');
      setOpacity(existingBannerData.opacity ?? 0.55);
    } else {
      setBgUrl('');
      setLogoUrl('');
      setTitle(defaultTitle);
      setSubtitle(defaultSubtitle);
      setPresetId('dark-classic');
      setOpacity(0.55);
    }
    // Clear template edit area
    if (templateEditRef.current) {
      templateEditRef.current.innerHTML = '';
    }
  }, [isOpen, existingBannerData, defaultTitle, defaultSubtitle]);

  // Sync selected template HTML into the editable area
  useEffect(() => {
    if (selectedTemplate && templateEditRef.current) {
      templateEditRef.current.innerHTML = selectedTemplate.html;
    } else if (!selectedTemplate && templateEditRef.current) {
      templateEditRef.current.innerHTML = '';
    }
  }, [selectedTemplate]);

  const handleFileUpload = useCallback(async (file: File, type: 'bg' | 'logo') => {
    if (onImageUpload) {
      setUploading(true);
      const url = await onImageUpload(file);
      setUploading(false);
      if (url) {
        if (type === 'bg') setBgUrl(url);
        else setLogoUrl(url);
      }
    } else {
      // Fallback: base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'bg') setBgUrl(result);
        else setLogoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const handleLogoFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file, 'logo');
    e.target.value = '';
  }, [handleFileUpload]);

  const handleApply = useCallback(() => {
    const bannerHtml = bgUrl
      ? generateBannerHtml({ bgUrl, logoUrl, title, subtitle, presetId, opacity })
      : '';
    // Read the user-edited HTML from contentEditable area
    const templateHtml = templateEditRef.current?.innerHTML || undefined;
    // Sync title/subtitle back to form fields
    onTitleChange?.(title, subtitle);
    onApply(bannerHtml, templateHtml);
    onClose();
  }, [bgUrl, logoUrl, title, subtitle, presetId, opacity, onApply, onClose, onTitleChange]);

  // Sample images pagination (3 per page)
  const SAMPLES_PER_PAGE = 3;
  const totalSamplePages = Math.ceil(SAMPLE_BANNER_IMAGES.length / SAMPLES_PER_PAGE);
  const visibleSamples = SAMPLE_BANNER_IMAGES.slice(
    samplePage * SAMPLES_PER_PAGE,
    samplePage * SAMPLES_PER_PAGE + SAMPLES_PER_PAGE
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">템플릿 제작</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body - Two Panels */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left Panel - Controls */}
          <div className="w-[420px] border-r border-gray-200 overflow-y-auto p-5 space-y-6 flex-shrink-0">

            {/* 0. Template (공고 양식) Selection */}
            {templates.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3">① 공고 양식 선택 <span className="text-xs font-normal text-red-500">(필수)</span></h3>
                <div className="grid grid-cols-3 gap-2">
                  {templates.map((tpl) => {
                    const isSelected = selectedTemplateId === tpl.id;
                    // Color coding per template style
                    const borderColor = isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-400';
                    const accentColors: Record<string, string> = {
                      'agent-basic': 'bg-blue-500', 'agent-albamon': 'bg-orange-500', 'agent-jobkorea': 'bg-green-500',
                      'sales-basic': 'bg-blue-500', 'sales-albamon': 'bg-orange-500', 'sales-jobkorea': 'bg-green-500',
                    };
                    const accent = accentColors[tpl.id] || 'bg-gray-400';
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`relative rounded-lg border-2 p-2.5 transition-all text-left ${borderColor}`}
                      >
                        {/* Mini preview bar */}
                        <div className={`w-full h-1.5 rounded-full mb-2 ${accent}`} />
                        {/* Mini skeleton lines to represent template content */}
                        <div className="space-y-1 mb-2">
                          <div className="h-1 bg-gray-300 rounded w-full" />
                          <div className="h-1 bg-gray-200 rounded w-4/5" />
                          <div className="h-1 bg-gray-200 rounded w-3/5" />
                          <div className="h-1 bg-gray-100 rounded w-full" />
                          <div className="h-1 bg-gray-100 rounded w-2/3" />
                        </div>
                        <p className="text-[11px] font-bold text-gray-700 leading-tight">{tpl.name}</p>
                        <p className="text-[10px] text-gray-400 leading-tight">{tpl.description}</p>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {!selectedTemplateId && (
                  <p className="text-[11px] text-red-400 mt-1.5">공고 양식을 선택해주세요.</p>
                )}
              </div>
            )}

            {/* 1. Sample Image Selection (알바몬 스타일 썸네일 그리드) */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-3">② 배경 이미지 선택 <span className="text-xs font-normal text-red-500">(필수)</span></h3>

              {/* Sample thumbnails grid (알바몬 template thumbnail style) */}
              <div className="grid grid-cols-3 gap-2">
                {visibleSamples.map((src, idx) => {
                  const globalIdx = samplePage * SAMPLES_PER_PAGE + idx;
                  const isSelected = bgUrl === src;
                  return (
                    <button
                      key={globalIdx}
                      type="button"
                      onClick={() => setBgUrl(src)}
                      className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all group ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img src={src} alt={`샘플 ${globalIdx + 1}`} className="w-full h-full object-cover" />
                      {/* Dimmed overlay with name */}
                      <div className={`absolute inset-0 flex items-end justify-center pb-1.5 transition-opacity ${
                        isSelected ? 'bg-blue-600/20' : 'bg-black/0 group-hover:bg-black/20'
                      }`}>
                        <span className="text-[10px] font-bold text-white drop-shadow-sm">
                          샘플 {globalIdx + 1}
                        </span>
                      </div>
                      {/* Checkmark */}
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Pagination (알바몬 스타일) */}
              {totalSamplePages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-2.5">
                  <button
                    type="button"
                    onClick={() => setSamplePage(p => Math.max(0, p - 1))}
                    disabled={samplePage === 0}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-xs text-gray-500">
                    <em className="font-bold text-gray-800 not-italic">{samplePage + 1}</em> / {totalSamplePages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSamplePage(p => Math.min(totalSamplePages - 1, p + 1))}
                    disabled={samplePage === totalSamplePages - 1}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}

              {!bgUrl && (
                <p className="text-[11px] text-red-400 mt-1.5">배경 이미지를 선택해주세요.</p>
              )}
            </div>

            {/* 2. Preset / Color Selection (알바몬 컬러 칩 스타일) */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-3">디자인 프리셋</h3>
              <div className="flex flex-wrap gap-2">
                {BANNER_PRESETS.map((preset) => {
                  const isSelected = presetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPresetId(preset.id)}
                      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Color swatch chips (알바몬 color-box style) */}
                      <div className="flex gap-0.5">
                        {preset.swatchColors.map((color, i) => (
                          <span
                            key={i}
                            className="w-3.5 h-3.5 rounded-full border border-gray-200"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-gray-700">{preset.name}</span>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Overlay Opacity Slider */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">오버레이 투명도</h3>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="0.9"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <span className="text-xs text-gray-500 w-10 text-right">{Math.round(opacity * 100)}%</span>
              </div>
            </div>

            {/* 4. Text Input (항목 입력 - 알바몬 스타일) */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-3">텍스트 입력</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">제목</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="공고 제목을 입력해 주세요"
                    maxLength={80}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">부제목 <span className="text-gray-400">(선택)</span></label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="부제목 또는 추가 설명"
                    maxLength={100}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 5. Logo Upload (선택) */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">
                로고 <span className="text-xs font-normal text-gray-400">(선택)</span>
              </h3>
              {logoUrl ? (
                <div className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                  <img src={logoUrl} alt="logo" className="w-12 h-12 object-contain rounded" />
                  <span className="text-xs text-gray-600">로고 적용됨</span>
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="ml-auto p-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2 hover:border-blue-400 transition-colors cursor-pointer bg-white"
                >
                  <ImageIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">로고 이미지 업로드</span>
                </button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoFileChange} className="hidden" />
            </div>
          </div>

          {/* Right Panel - Live Preview (상세요강 미리보기) */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700">미리보기</h3>
              {uploading && (
                <span className="text-xs text-blue-600 animate-pulse">이미지 업로드 중...</span>
              )}
            </div>

            {/* Preview Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <BannerPreview
                bgUrl={bgUrl}
                logoUrl={logoUrl}
                title={title || '공고 제목을 입력해 주세요'}
                subtitle={subtitle}
                presetId={presetId}
                opacity={opacity}
              />
            </div>

            {/* Template body - editable area */}
            {selectedTemplate && (
              <div className="mt-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-100 bg-blue-50">
                  <p className="text-[11px] font-bold text-blue-600">
                    양식 직접 편집 — {selectedTemplate.name}
                    <span className="ml-2 text-[10px] font-normal text-blue-400">각 칸을 클릭하여 내용을 입력하세요</span>
                  </p>
                </div>
                <div
                  ref={templateEditRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="template-editable px-4 py-3 max-h-[350px] overflow-y-auto prose prose-sm max-w-none text-sm focus:outline-none"
                />
              </div>
            )}

            {/* Preview info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                {selectedTemplate
                  ? <>양식에 내용을 직접 입력한 후 <strong>적용하기</strong>를 누르면 배너 + 양식이 함께 에디터에 삽입됩니다.</>
                  : <><strong>적용하기</strong>를 누르면 배너가 에디터에 삽입됩니다. 이미 배너가 있으면 새 배너로 교체됩니다.</>
                }
              </p>
            </div>

            {/* Current preset info */}
            <div className="mt-3 p-3 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-600">
                <span className="font-bold">현재 프리셋:</span>{' '}
                {BANNER_PRESETS.find(p => p.id === presetId)?.name || presetId}
                {' / '}
                <span className="font-bold">정렬:</span>{' '}
                {BANNER_PRESETS.find(p => p.id === presetId)?.textAlign === 'center' ? '중앙' : '좌측'}
                {selectedTemplate && (
                  <>
                    {' / '}
                    <span className="font-bold">양식:</span> {selectedTemplate.name}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!selectedTemplate || !bgUrl}
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            적용하기
          </button>
        </div>
      </div>
    </div>
  );
}
