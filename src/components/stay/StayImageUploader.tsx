'use client';

// 단기임대 매물 등록/수정 폼용 순서 있는 다중 사진 업로더.
//
// - value[0] 이 대표 사진(썸네일). 순서 = 표시 순서.
// - 파일을 받는 즉시 uploadImagesInOrder 로 올리고, 반환 URL 을 기존 value 뒤에 붙여 onChange.
// - 순서 변경/제거는 배열에서만 처리한다. 스토리지 실제 삭제는 하지 않는다 —
//   job-images 버킷에 storage DELETE 정책이 없어 deleteUploadedImage 가 항상 실패하는
//   알려진 별건 버그(정책 추가 후 별도 처리).
// - 드래그앤드롭 "순서 변경"은 일부러 넣지 않았다. 버튼 이동이 모바일에서 더 확실하다.
//   (파일 드롭으로 "추가"는 지원)
// - 이 컴포넌트는 string[] / File[] 만 다루는 독립 컴포넌트다. stay 타입 파일에 의존하지 않는다.

import { useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, X } from 'lucide-react';
import { uploadImagesInOrder } from '@/lib/upload';
import { STAY_IMAGES_MAX } from '@/lib/stay/constants';

// upload.ts 의 MAX_FILE_SIZE(2MB)와 동일. upload.ts 도 거르지만 파일명을 사용자에게
// 알려주기 위해 업로드 전에 한 번 더 검사한다.
const MAX_FILE_SIZE = 2 * 1024 * 1024;

interface StayImageUploaderProps {
  /** 이미 업로드된 URL 목록 (수정 모드용). 순서 = 표시 순서, [0] 이 썸네일 */
  value: string[];
  /** 업로드 완료·순서 변경·삭제 후 최종 URL 배열 */
  onChange: (urls: string[]) => void;
  /** 기본 STAY_IMAGES_MAX */
  max?: number;
  /** 업로드 진행 중 부모가 제출 버튼을 잠글 수 있게 */
  onUploadingChange?: (uploading: boolean) => void;
  /** 필드 하단 인라인 에러 (부모 validate 결과) */
  error?: string;
}

const iconBtnBase =
  'inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm ring-1 ring-slate-900/10 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40';

export default function StayImageUploader({
  value,
  onChange,
  max = STAY_IMAGES_MAX,
  onUploadingChange,
  error,
}: StayImageUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // 업로드 중인 슬롯 수 (스켈레톤 표시용)
  const [pendingCount, setPendingCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  // 컴포넌트 내부 인라인 메시지 (장수 초과 · 용량 초과 · 업로드 실패)
  const [notice, setNotice] = useState<string | null>(null);

  const uploading = pendingCount > 0;
  const remaining = Math.max(0, max - value.length);
  const isFull = remaining === 0;

  function setUploading(next: boolean) {
    onUploadingChange?.(next);
  }

  async function handleFiles(fileList: FileList | File[]) {
    if (uploading) return;

    const incoming = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (incoming.length === 0) return;

    const messages: string[] = [];

    // 1) 용량 초과 사전 검사 — 파일명과 함께 안내
    const oversized = incoming.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      messages.push(
        `2MB를 초과한 사진은 등록할 수 없습니다: ${oversized.map((f) => f.name).join(', ')}`
      );
    }
    let accepted = incoming.filter((f) => f.size <= MAX_FILE_SIZE);

    // 2) 장수 상한 — 초과분은 받지 않는다
    if (accepted.length > remaining) {
      messages.push(`최대 ${max}장까지 등록할 수 있습니다`);
      accepted = accepted.slice(0, remaining);
    }

    setNotice(messages.length > 0 ? messages.join(' · ') : null);

    if (accepted.length === 0) return;

    setPendingCount(accepted.length);
    setUploading(true);
    try {
      const urls = await uploadImagesInOrder(accepted, 'stay-images');
      if (urls.length < accepted.length) {
        const failed = accepted.length - urls.length;
        setNotice((prev) =>
          [prev, `${failed}장은 업로드에 실패해 제외되었습니다`].filter(Boolean).join(' · ')
        );
      }
      if (urls.length > 0) {
        onChange([...value, ...urls]);
      }
    } catch (err) {
      console.error('[StayImageUploader] upload error', err);
      setNotice('사진 업로드 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setPendingCount(0);
      setUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) void handleFiles(files);
    // 같은 파일을 다시 고를 수 있도록 초기화
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (isFull || uploading) return;
    if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function remove(index: number) {
    // 배열에서만 제거. 스토리지 삭제는 하지 않는다 (파일 상단 주석 참고).
    onChange(value.filter((_, i) => i !== index));
  }

  const dropDisabled = isFull || uploading;

  return (
    <div className="space-y-3">
      {/* 드롭존 / 파일 선택 */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!dropDisabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-5 text-center transition ${
          dropDisabled
            ? 'border-slate-200 bg-slate-50'
            : dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          disabled={dropDisabled}
          onChange={handleInputChange}
          className="sr-only"
        />
        <label
          htmlFor={inputId}
          className={`inline-flex flex-col items-center gap-2 ${
            dropDisabled ? 'cursor-not-allowed text-slate-400' : 'cursor-pointer text-slate-700'
          }`}
        >
          {uploading ? (
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" aria-hidden />
          ) : (
            <ImagePlus className="h-7 w-7" aria-hidden />
          )}
          <span className="text-sm font-medium">
            {uploading
              ? '사진 등록 중...'
              : isFull
                ? `최대 ${max}장까지 등록할 수 있습니다`
                : '사진 선택 또는 여기로 끌어다 놓기'}
          </span>
          <span className="text-xs text-slate-500">
            JPG·PNG · 장당 2MB 이하 · {value.length}/{max}장 · 첫 번째 사진이 대표 사진이 됩니다
          </span>
        </label>
      </div>

      {/* 인라인 안내/에러 */}
      {notice && (
        <p className="text-xs text-amber-700" role="status" aria-live="polite">
          {notice}
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}

      {/* 썸네일 그리드 */}
      {(value.length > 0 || pendingCount > 0) && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5" aria-label="등록된 사진">
          {value.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="group relative aspect-[3/2] overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-900/10"
            >
              {/* 외부 스토리지 URL 이라 next/image 대신 img 를 쓴다 (StayPrimitives 와 동일 이유) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={index === 0 ? '대표 사진' : `사진 ${index + 1}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />

              {/* 순서 번호 / 대표 배지 */}
              <div className="absolute left-2 top-2 flex items-center gap-1">
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-900/70 px-1.5 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                {index === 0 && (
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                    대표
                  </span>
                )}
              </div>

              {/* 제거 */}
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={uploading}
                aria-label={`${index + 1}번째 사진 제거`}
                className={`${iconBtnBase} absolute right-2 top-2`}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>

              {/* 좌우 이동 */}
              <div className="absolute inset-x-2 bottom-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || uploading}
                  aria-label={`${index + 1}번째 사진을 앞으로 이동`}
                  className={iconBtnBase}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1 || uploading}
                  aria-label={`${index + 1}번째 사진을 뒤로 이동`}
                  className={iconBtnBase}
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}

          {/* 업로드 중 스켈레톤 */}
          {Array.from({ length: pendingCount }).map((_, i) => (
            <li
              key={`pending-${i}`}
              className="flex aspect-[3/2] items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-900/10"
              aria-label="사진 등록 중"
              role="status"
            >
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
