'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, Camera, X, AlertCircle } from 'lucide-react';
import { validateImageFile, MAX_FILE_SIZE } from '@/lib/validations/ai-photo';

interface PhotoUploaderProps {
  onPhotoSelected: (file: File, preview: string) => void;
  selectedPreview: string | null;
  onClear: () => void;
}

// Client-side image compression via Canvas
async function compressImage(file: File, maxDim: number = 1024, quality: number = 0.85): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width <= maxDim && height <= maxDim && file.size <= MAX_FILE_SIZE) {
        resolve(file);
        return;
      }

      // Scale down
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

export default function PhotoUploader({ onPhotoSelected, selectedPreview, onClear }: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);

    // Validate type first
    const validation = validateImageFile(file);

    // If file is too large, try compressing
    if (!validation.valid && file.size > MAX_FILE_SIZE && file.type.startsWith('image/')) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file);
        const revalidation = validateImageFile(compressed);
        if (!revalidation.valid) {
          setError(revalidation.error!);
          setIsCompressing(false);
          return;
        }
        file = compressed;
      } catch {
        setError('이미지 처리에 실패했습니다');
        setIsCompressing(false);
        return;
      }
      setIsCompressing(false);
    } else if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    // Compress if needed for optimal API performance
    if (file.size > 1024 * 1024) {
      setIsCompressing(true);
      file = await compressImage(file);
      setIsCompressing(false);
    }

    const preview = URL.createObjectURL(file);
    onPhotoSelected(file, preview);
  }, [onPhotoSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }, [processFile]);

  if (selectedPreview) {
    return (
      <div className="relative">
        <div className="relative w-full max-w-sm mx-auto aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
          <img
            src={selectedPreview}
            alt="업로드된 사진"
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClear}
            className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-sm text-gray-500 mt-3">
          다른 사진을 사용하려면 X 버튼을 눌러주세요
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer border-2 border-dashed rounded-2xl p-8 md:p-12
          transition-all duration-200 text-center
          ${isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
          ${isCompressing ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-4">
          {isCompressing ? (
            <>
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-gray-600 font-medium">이미지 최적화 중...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-gray-700 font-medium text-lg">
                  사진을 드래그하거나 클릭하여 업로드
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  JPG, PNG, WebP / 최대 5MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile camera button */}
      <div className="md:hidden">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-gray-700 font-medium"
        >
          <Camera className="w-5 h-5" />
          카메라로 촬영하기
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
        <p className="font-medium mb-1">좋은 결과를 위한 팁</p>
        <ul className="list-disc list-inside space-y-0.5 text-amber-600">
          <li>얼굴이 정면으로 잘 보이는 사진</li>
          <li>밝은 조명에서 촬영한 사진</li>
          <li>배경이 깔끔한 사진</li>
        </ul>
      </div>
    </div>
  );
}
