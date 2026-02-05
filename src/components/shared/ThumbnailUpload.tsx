'use client';

import { useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface ThumbnailUploadProps {
  preview: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  accentColor?: string;
}

export default function ThumbnailUpload({
  preview,
  onFileChange,
  onRemove,
  accentColor = 'blue',
}: ThumbnailUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const borderHover = accentColor === 'purple' ? 'hover:border-purple-500' : 'hover:border-blue-500';

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative w-full max-w-md">
          <img
            src={preview}
            alt="썸네일 미리보기"
            className="w-full h-48 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`w-full max-w-md border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${borderHover} transition-colors cursor-pointer bg-white`}
        >
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">클릭하여 이미지 업로드</p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF (최대 2MB)</p>
        </button>
      )}

      {/* 가이드라인 */}
      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg max-w-md">
        <p className="text-xs font-bold text-gray-600 mb-1.5">썸네일 가이드라인</p>
        <ul className="text-[11px] text-gray-500 space-y-0.5 leading-relaxed">
          <li>• 권장 크기: <strong className="text-gray-700">800 x 600px</strong> (4:3 비율)</li>
          <li>• 큰 이미지는 자동으로 축소/압축됩니다</li>
          <li>• 공고 목록에서 카드 썸네일로 표시됩니다</li>
        </ul>
      </div>
    </>
  );
}
