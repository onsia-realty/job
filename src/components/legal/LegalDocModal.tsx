'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface LegalDocModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /** 전달 시 "동의하고 닫기" 버튼 노출 */
  onAgree?: () => void;
  children: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 약관 전문 보기 모달 — 가입 흐름을 벗어나지 않고 약관을 확인할 수 있게 함
 * ESC·배경 클릭으로 닫힘, 포커스 가두기, 닫을 때 열었던 요소로 포커스 복귀
 */
export default function LegalDocModal({ open, title, onClose, onAgree, children }: LegalDocModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* 배경 — 클릭 시 닫힘 */}
      <div className="absolute inset-0 bg-slate-900/50" aria-hidden="true" onClick={onClose} />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full sm:max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl focus:outline-none"
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-slate-200 flex-shrink-0">
          <h2 id={titleId} className="font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="p-1.5 -mr-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6">
          {children}
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-slate-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={`py-3.5 rounded-xl font-bold transition-colors ${
              onAgree ? 'flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200' : 'w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600'
            }`}
          >
            확인
          </button>
          {onAgree && (
            <button
              type="button"
              onClick={onAgree}
              className="flex-[2] py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/25"
            >
              동의하고 닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
