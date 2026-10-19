'use client';

import { useEffect } from 'react';

export default function SecurityShield() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    // ─── 0. 개발자 우회 모드 ───
    // URL에 ?devmode=본인만_아는_키 입력 → localStorage에 저장 → 보안 기능 우회
    const DEV_KEY = 'onsia-dev-2026';
    const params = new URLSearchParams(window.location.search);
    if (params.get('devmode') === DEV_KEY) {
      localStorage.setItem('__dev_bypass__', DEV_KEY);
    }
    if (params.get('devmode') === 'off') {
      localStorage.removeItem('__dev_bypass__');
    }
    if (localStorage.getItem('__dev_bypass__') === DEV_KEY) return;

    // ─── 1. Console 무력화 ───
    const noop = () => {};
    const methods = ['log', 'debug', 'info', 'warn', 'table', 'dir', 'dirxml', 'trace', 'group', 'groupCollapsed', 'groupEnd', 'clear', 'count', 'countReset', 'assert', 'profile', 'profileEnd', 'time', 'timeLog', 'timeEnd', 'timeStamp'] as const;
    methods.forEach((method) => {
      try {
        (console as unknown as Record<string, unknown>)[method] = noop;
      } catch {}
    });

    // ─── 2. 우클릭 방지 ───
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // ─── 3. 텍스트 선택 방지 (input/textarea는 허용) ───
    const blockSelect = (e: Event) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target.isContentEditable) return;
      e.preventDefault();
      return false;
    };

    // ─── 4. 키보드 단축키 차단 (F12, Ctrl+Shift+I/J/C, Ctrl+U) ───
    const blockKeys = (e: KeyboardEvent) => {
      if (e.key === 'F12') { e.preventDefault(); return false; }
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) { e.preventDefault(); return false; }
      if (e.ctrlKey && e.key === 'u') { e.preventDefault(); return false; }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); return false; }
    };

    // ─── 5. 드래그 방지 ───
    const blockDrag = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // ─── 6. 복사 방지 (input/textarea는 허용) ───
    const blockCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target.isContentEditable) return;
      e.preventDefault();
      return false;
    };

    // 창 크기 차이는 사이드패널·모바일·확대에서도 발생하므로 접근 차단에 사용하지 않는다.

    // ─── 9. 자동화 도구 감지 (행동 기반) ───
    const detectAutomation = () => {
      const indicators: string[] = [];

      if ((navigator as unknown as Record<string, unknown>).webdriver) indicators.push('webdriver');
      if ((window as unknown as Record<string, unknown>).__phantom) indicators.push('phantom');
      if ((window as unknown as Record<string, unknown>)._phantom) indicators.push('_phantom');
      if ((window as unknown as Record<string, unknown>).__nightmare) indicators.push('nightmare');
      if (/HeadlessChrome/.test(navigator.userAgent)) indicators.push('headless');
      if ((window as unknown as Record<string, unknown>).chrome && !(window as unknown as Record<string, unknown>).chrome) indicators.push('cdp');
      if (navigator.plugins.length === 0 && !/Mobile|Android/i.test(navigator.userAgent)) {
        indicators.push('no-plugins');
      }
      if (!navigator.language && !navigator.languages?.length) {
        indicators.push('no-language');
      }

      if (indicators.length >= 2) {
        document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-size:24px;color:#666;">서비스 점검 중입니다</div>';
      }
    };

    setTimeout(detectAutomation, 1000);

    // ─── 10. 소스코드 내 주요 문자열 보호 ───
    try {
      const origToString = Function.prototype.toString;
      Function.prototype.toString = function () {
        if (this === blockKeys || this === blockCopy || this === detectAutomation) {
          return 'function () { [native code] }';
        }
        return origToString.call(this);
      };
    } catch {}

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
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, []);

  return null;
}
