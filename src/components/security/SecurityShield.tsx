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
      // 입력 필드에서는 선택 허용 (UX 유지)
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

    // ─── 7. DevTools 감지 (최적화: 2초 간격, 가벼운 체크) ───
    let devtoolsOpen = false;
    const devtoolsCheck = setInterval(() => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;

      if (widthThreshold || heightThreshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          document.title = '접근이 제한됩니다';
        }
      } else {
        if (devtoolsOpen) {
          devtoolsOpen = false;
          document.title = '부동산인 BOOIN - 부동산 전문가 구인구직';
        }
      }
    }, 2000); // 2초 간격 (성능 최적화)

    // ─── 8. debugger 트랩 (최적화: DevTools 감지 시에만 활성화) ───
    let debuggerInterval: ReturnType<typeof setInterval> | null = null;

    const startDebuggerTrap = () => {
      if (debuggerInterval) return;
      debuggerInterval = setInterval(() => {
        // eslint-disable-next-line no-debugger
        debugger;
      }, 5000); // 5초 간격 (성능 이슈 방지)
    };

    const stopDebuggerTrap = () => {
      if (debuggerInterval) {
        clearInterval(debuggerInterval);
        debuggerInterval = null;
      }
    };

    // DevTools 감지와 연동: 열릴 때만 debugger 트랩 활성화
    const debuggerCheck = setInterval(() => {
      if (devtoolsOpen) {
        startDebuggerTrap();
      } else {
        stopDebuggerTrap();
      }
    }, 2000);

    // ─── 9. 자동화 도구 감지 (행동 기반) ───
    const detectAutomation = () => {
      const indicators: string[] = [];

      // Selenium/WebDriver 감지
      if ((navigator as unknown as Record<string, unknown>).webdriver) indicators.push('webdriver');
      // PhantomJS 감지
      if ((window as unknown as Record<string, unknown>).__phantom) indicators.push('phantom');
      if ((window as unknown as Record<string, unknown>)._phantom) indicators.push('_phantom');
      // Nightmare.js 감지
      if ((window as unknown as Record<string, unknown>).__nightmare) indicators.push('nightmare');
      // Headless Chrome 감지
      if (/HeadlessChrome/.test(navigator.userAgent)) indicators.push('headless');
      // Chrome DevTools Protocol 감지
      if ((window as unknown as Record<string, unknown>).chrome && !(window as unknown as Record<string, unknown>).chrome) indicators.push('cdp');
      // 비정상적인 플러그인 수 (Headless는 보통 0개)
      if (navigator.plugins.length === 0 && !/Mobile|Android/i.test(navigator.userAgent)) {
        indicators.push('no-plugins');
      }
      // 비정상적인 언어 설정
      if (!navigator.language && !navigator.languages?.length) {
        indicators.push('no-language');
      }

      if (indicators.length >= 2) {
        // 자동화 도구로 판단 → 페이지 내용 교란
        document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-size:24px;color:#666;">서비스 점검 중입니다</div>';
      }
    };

    // 페이지 로드 후 자동화 감지 실행
    setTimeout(detectAutomation, 1000);

    // ─── 10. 소스코드 내 주요 문자열 보호 ───
    // toString, toSource 재정의로 함수 내부 코드 조회 차단
    try {
      const origToString = Function.prototype.toString;
      Function.prototype.toString = function () {
        // SecurityShield 관련 함수는 빈 문자열 반환
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
      clearInterval(devtoolsCheck);
      clearInterval(debuggerCheck);
      stopDebuggerTrap();
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, []);

  return null;
}
