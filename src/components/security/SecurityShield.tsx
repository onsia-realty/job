'use client';

import { useEffect, useState } from 'react';

const PROTECTION_OVERLAY_ID = 'security-protection-overlay';

function showProtectionOverlay() {
  if (document.getElementById(PROTECTION_OVERLAY_ID)) return;

  const overlay = document.createElement('div');
  overlay.id = PROTECTION_OVERLAY_ID;
  overlay.innerHTML = `
    <div style="
      position:fixed;inset:0;z-index:99999;
      background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%);
      display:flex;align-items:center;justify-content:center;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
    ">
      <div style="text-align:center;max-width:480px;padding:0 24px;">
        <div style="
          width:96px;height:96px;margin:0 auto 32px;
          background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);
          border-radius:16px;display:flex;align-items:center;justify-content:center;
        ">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 style="color:#fff;font-size:28px;font-weight:700;margin:0 0 16px;">
          콘텐츠 정보를 보호하고 있습니다
        </h1>
        <p style="color:#94a3b8;font-size:16px;line-height:1.7;margin:0 0 12px;">
          이 화면은 콘텐츠 관련 정보를 확인할 수 있는<br/>
          <span style="color:#cbd5e1;font-weight:500;">'개발자 도구'</span>에 접근했을 때 표시됩니다.
        </p>
        <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 40px;">
          개발자 도구를 닫으면 자동으로 원래 화면으로 돌아갑니다.
        </p>
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;color:#64748b;font-size:13px;margin:0 0 40px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>부동산인은 콘텐츠 무단 복제를 방지하고 있습니다</span>
        </div>
        <p style="color:#475569;font-size:12px;margin:0;">
          © 2026 부동산인 BOOIN. All rights reserved.
        </p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function hideProtectionOverlay() {
  const overlay = document.getElementById(PROTECTION_OVERLAY_ID);
  if (overlay) overlay.remove();
}

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

    // ─── 7. DevTools 감지 → 보호 오버레이 표시 ───
    let devtoolsOpen = false;
    let debuggerInterval: ReturnType<typeof setInterval> | null = null;

    const startDebuggerTrap = () => {
      if (debuggerInterval) return;
      debuggerInterval = setInterval(() => {
        // eslint-disable-next-line no-debugger
        debugger;
      }, 10000);
    };

    const stopDebuggerTrap = () => {
      if (debuggerInterval) {
        clearInterval(debuggerInterval);
        debuggerInterval = null;
      }
    };

    const devtoolsCheck = setInterval(() => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      const isOpen = widthThreshold || heightThreshold;

      if (isOpen !== devtoolsOpen) {
        devtoolsOpen = isOpen;
        if (isOpen) {
          showProtectionOverlay();
          startDebuggerTrap();
        } else {
          hideProtectionOverlay();
          stopDebuggerTrap();
        }
      }
    }, 3000);

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
      clearInterval(devtoolsCheck);
      stopDebuggerTrap();
      hideProtectionOverlay();
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, []);

  return null;
}
