'use client';

import { useEffect } from 'react';

export default function SecurityShield() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    // ─── 1. Console 무력화 ───
    const noop = () => {};
    const methods = ['log', 'debug', 'info', 'warn', 'table', 'dir', 'dirxml', 'trace', 'group', 'groupCollapsed', 'groupEnd', 'clear', 'count', 'countReset', 'assert', 'profile', 'profileEnd', 'time', 'timeLog', 'timeEnd', 'timeStamp'] as const;
    methods.forEach((method) => {
      try {
        (console as Record<string, unknown>)[method] = noop;
      } catch {}
    });

    // ─── 2. 우클릭 방지 ───
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // ─── 3. 텍스트 선택 방지 ───
    const blockSelect = (e: Event) => {
      e.preventDefault();
      return false;
    };

    // ─── 4. 키보드 단축키 차단 (F12, Ctrl+Shift+I/J/C, Ctrl+U) ───
    const blockKeys = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I (개발자도구)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+J (콘솔)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+C (요소 선택)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }
      // Ctrl+U (소스 보기)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }
      // Ctrl+S (저장 방지)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }
    };

    // ─── 5. 드래그 방지 (이미지/텍스트 드래그 복사 차단) ───
    const blockDrag = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // ─── 6. 복사/붙여넣기 방지 ───
    const blockCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      return false;
    };

    // ─── 7. DevTools 감지 (디버거 트랩) ───
    let devtoolsOpen = false;
    const devtoolsCheck = setInterval(() => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;

      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          // 개발자 도구 열림 감지 시 경고
          document.title = '접근이 제한됩니다';
        }
      } else {
        devtoolsOpen = false;
      }
    }, 1000);

    // ─── 8. debugger 트랩 ───
    const debuggerTrap = setInterval(() => {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const end = performance.now();
      // debugger에서 멈추면 시간차가 큼 = DevTools 열림
      if (end - start > 100) {
        document.title = '접근이 제한됩니다';
      }
    }, 3000);

    // 이벤트 등록
    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('selectstart', blockSelect);
    document.addEventListener('keydown', blockKeys);
    document.addEventListener('dragstart', blockDrag);
    document.addEventListener('copy', blockCopy);

    // CSS로 텍스트 선택 비활성화
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('selectstart', blockSelect);
      document.removeEventListener('keydown', blockKeys);
      document.removeEventListener('dragstart', blockDrag);
      document.removeEventListener('copy', blockCopy);
      clearInterval(devtoolsCheck);
      clearInterval(debuggerTrap);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, []);

  // 렌더링 없음 - 순수 보안 레이어
  return null;
}
