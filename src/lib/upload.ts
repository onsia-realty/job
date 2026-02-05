import { supabase } from './supabase';

const BUCKET = 'job-images';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

// 폴더별 최대 이미지 크기 — Supabase 무료 티어(1GB) 최적화
const IMAGE_SIZE_LIMITS: Record<string, { maxWidth: number; maxHeight: number; quality: number }> = {
  'thumbnails':    { maxWidth: 600,  maxHeight: 400,  quality: 0.75 },
  'agent-images':  { maxWidth: 800,  maxHeight: 600,  quality: 0.75 },
  'editor-images': { maxWidth: 1000, maxHeight: 800,  quality: 0.75 },
  'banner-images': { maxWidth: 1200, maxHeight: 600,  quality: 0.75 },
};

/** 이미지를 최대 크기에 맞게 리사이즈 + JPEG 압축 (클라이언트) */
function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<File> {
  return new Promise((resolve) => {
    // GIF는 리사이즈 건너뛰기 (애니메이션 손실 방지)
    if (file.type === 'image/gif') {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // 이미 작으면 리사이즈 불필요
      if (width <= maxWidth && height <= maxHeight) {
        resolve(file);
        return;
      }

      // 비율 유지하며 축소
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const resized = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
          });
          resolve(resized);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // 실패 시 원본 사용
    };

    img.src = url;
  });
}

function generateFileName(file: File, prefix: string): string {
  const ext = file.name.split('.').pop();
  const rand = Math.random().toString(36).substring(7);
  return `${prefix}/${Date.now()}-${rand}.${ext}`;
}

export async function uploadImage(
  file: File,
  folder: 'thumbnails' | 'agent-images' | 'editor-images' | 'banner-images'
): Promise<string | null> {
  // 파일 크기 검증 (최대 2MB)
  if (file.size > MAX_FILE_SIZE) {
    console.error(`파일 크기 초과: ${(file.size / 1024 / 1024).toFixed(1)}MB (최대 2MB)`);
    return null;
  }

  // 업로드 전 자동 리사이즈
  const limits = IMAGE_SIZE_LIMITS[folder] || IMAGE_SIZE_LIMITS['editor-images'];
  const resized = await resizeImage(file, limits.maxWidth, limits.maxHeight, limits.quality);

  const filePath = generateFileName(resized, folder);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, resized);

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function uploadMultipleImages(
  files: Record<string, File | null>,
  folder: 'thumbnails' | 'agent-images' | 'editor-images' | 'banner-images'
): Promise<Record<string, string>> {
  const urls: Record<string, string> = {};

  for (const [key, file] of Object.entries(files)) {
    if (file) {
      const url = await uploadImage(file, folder);
      if (url) urls[key] = url;
    }
  }

  return urls;
}
