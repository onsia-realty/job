import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import Link from 'next/link';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SecurityShield from './SecurityShield';

const dimensionNames = ['innerWidth', 'innerHeight', 'outerWidth', 'outerHeight'] as const;
let consoleDescriptors: PropertyDescriptorMap;
let originalToString: typeof Function.prototype.toString;
let dimensionDescriptors: Map<string, PropertyDescriptor | undefined>;

function resizeViewport(innerWidth: number, innerHeight: number, outerWidth = 1920, outerHeight = 1080) {
  Object.entries({ innerWidth, innerHeight, outerWidth, outerHeight }).forEach(([name, value]) => {
    Object.defineProperty(window, name, { configurable: true, writable: true, value });
  });
  fireEvent(window, new Event('resize'));
}

function mountShield() {
  return render(
    <>
      <SecurityShield />
      <main>공개 홈 콘텐츠</main>
      <input aria-label="검색" />
      <textarea aria-label="문의" />
    </>,
  );
}

beforeEach(() => {
  consoleDescriptors = Object.getOwnPropertyDescriptors(console);
  originalToString = Function.prototype.toString;
  dimensionDescriptors = new Map(dimensionNames.map((name) => [name, Object.getOwnPropertyDescriptor(window, name)]));
  vi.useFakeTimers();
  // Run the real production effect, not the development return or the stored bypass.
  vi.stubEnv('NODE_ENV', 'production');
  window.history.replaceState(null, '', '/');
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  Function.prototype.toString = originalToString;
  Object.defineProperties(console, consoleDescriptors);
  dimensionDescriptors.forEach((descriptor, name) => {
    if (descriptor) Object.defineProperty(window, name, descriptor);
  });
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('SecurityShield production viewport regression', () => {
  it.each([320, 375, 390, 768, 1440, 1920])('keeps public content at %ipx without viewport polling or debugger timers', (width) => {
    resizeViewport(width, 844);
    const interval = vi.spyOn(globalThis, 'setInterval');
    mountShield();

    act(() => vi.advanceTimersByTime(35000));

    expect(screen.getByRole('main')).toHaveTextContent('공개 홈 콘텐츠');
    expect(document.getElementById('security-protection-overlay')).toBeNull();
    expect(interval).not.toHaveBeenCalled();
    expect(localStorage.getItem('__dev_bypass__')).toBeNull();
    // Confirms the production guards actually mounted.
    expect(document.body.style.userSelect).toBe('none');
  });

  it('does not cover content after orientation and browser chrome height changes', () => {
    resizeViewport(390, 844);
    mountShield();

    for (const [width, height, outerWidth, outerHeight] of [
      [844, 390, 1920, 1080],
      [390, 480, 390, 1000],
      [768, 350, 1920, 1080],
      [1920, 1080, 1920, 1080],
    ]) {
      act(() => {
        resizeViewport(width, height, outerWidth, outerHeight);
        vi.advanceTimersByTime(15000);
      });
      expect(screen.getByRole('main')).toBeVisible();
      expect(document.getElementById('security-protection-overlay')).toBeNull();
    }
  });

  it('keeps ordinary controls and navigation links usable', () => {
    const click = vi.fn();
    const followLink = vi.fn((event: React.MouseEvent<HTMLAnchorElement>) => event.preventDefault());
    resizeViewport(320, 640);
    render(
      <>
        <SecurityShield />
        <button onClick={click}>다음 공지</button>
        <Link href="/agent/jobs" onClick={followLink}>채용공고</Link>
      </>,
    );
    act(() => vi.advanceTimersByTime(35000));

    fireEvent.click(screen.getByRole('button', { name: '다음 공지' }));
    fireEvent.click(screen.getByRole('link', { name: '채용공고' }));
    expect(click).toHaveBeenCalledOnce();
    expect(followLink).toHaveBeenCalledOnce();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/agent/jobs');
  });
});

describe('SecurityShield retained client interaction guards', () => {
  it.each(['copy', 'selectstart', 'contextmenu', 'dragstart'])('still prevents %s on public body content', (type) => {
    mountShield();
    const event = new Event(type, { bubbles: true, cancelable: true });
    document.body.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it.each([
    ['copy', '검색'],
    ['copy', '문의'],
    ['selectstart', '검색'],
    ['selectstart', '문의'],
  ])('allows %s in the %s form field', (type, label) => {
    mountShield();
    const event = new Event(type, { bubbles: true, cancelable: true });
    screen.getByLabelText(label).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('retains guarded shortcuts without preventing normal typing', () => {
    mountShield();
    for (const options of [{ key: 'F12' }, { key: 'I', ctrlKey: true, shiftKey: true }, { key: 'u', ctrlKey: true }]) {
      const event = new KeyboardEvent('keydown', { ...options, bubbles: true, cancelable: true });
      document.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
    const typing = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
    screen.getByLabelText('검색').dispatchEvent(typing);
    expect(typing.defaultPrevented).toBe(false);
  });

  it('removes interaction listeners and selection styles when unmounted', () => {
    const { unmount } = mountShield();
    expect(document.body.style.userSelect).toBe('none');
    unmount();

    for (const type of ['copy', 'selectstart', 'contextmenu', 'dragstart', 'keydown']) {
      const event = type === 'keydown'
        ? new KeyboardEvent(type, { key: 'F12', bubbles: true, cancelable: true })
        : new Event(type, { bubbles: true, cancelable: true });
      document.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    }
    expect(document.body.style.userSelect).toBe('');
    expect(document.body.style.webkitUserSelect).toBe('');
  });
});
