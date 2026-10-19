import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AnnouncementSlider, { type Announcement } from './AnnouncementSlider';

const items: Announcement[] = [
  { id: 1, badge: '공지', title: '첫 공지', description: '첫 설명', link: null },
  { id: 2, badge: 'AI', title: '둘째 공지', description: '둘째 설명', link: '/event/ai-assistant' },
  { id: 3, badge: '업데이트', title: '셋째 공지', description: '셋째 설명', link: null },
];
let reduced = false;
let listeners: Set<() => void>;
const tick = (milliseconds = 5000) => act(() => vi.advanceTimersByTime(milliseconds));

beforeEach(() => {
  vi.useFakeTimers();
  reduced = false;
  listeners = new Set();
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: reduced,
    addEventListener: (_event: string, callback: () => void) => listeners.add(callback),
    removeEventListener: (_event: string, callback: () => void) => listeners.delete(callback),
  })));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('AnnouncementSlider', () => {
  it('moves every five seconds and wraps without creating a link for null href', () => {
    render(<AnnouncementSlider items={items} />);
    expect(screen.getByRole('heading', { name: '첫 공지' })).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    tick(4999);
    expect(screen.getByRole('heading', { name: '첫 공지' })).toBeInTheDocument();
    tick(1);
    expect(screen.getByRole('link', { name: '자세히 보기' })).toHaveAttribute('href', '/event/ai-assistant');
    tick(10000);
    expect(screen.getByRole('heading', { name: '첫 공지' })).toBeInTheDocument();
  });

  it('supports next, previous and selected labelled dots with no interactive nesting', () => {
    const { container } = render(<AnnouncementSlider items={items} />);
    fireEvent.click(screen.getByRole('button', { name: '이전 공지' }));
    expect(screen.getByRole('heading', { name: '셋째 공지' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다음 공지' }));
    fireEvent.click(screen.getByRole('button', { name: '2번 공지: 둘째 공지' }));
    expect(screen.getByRole('button', { name: '2번 공지: 둘째 공지' })).toHaveAttribute('aria-current', 'true');
    expect(container.querySelector('a button, button a, button button')).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(6);
    for (const button of screen.getAllByRole('button')) expect(button).toHaveAccessibleName();
  });

  it('holds on focus after hover ends, then resumes only after blur leaves the carousel', () => {
    render(<AnnouncementSlider items={items} />);
    const carousel = screen.getByRole('region', { name: '공지사항' });
    const next = screen.getByRole('button', { name: '다음 공지' });
    fireEvent.mouseEnter(carousel);
    fireEvent.focus(next);
    fireEvent.mouseLeave(carousel);
    tick(10000);
    expect(screen.getByRole('heading', { name: '첫 공지' })).toBeInTheDocument();
    fireEvent.blur(next, { relatedTarget: document.body });
    tick();
    expect(screen.getByRole('heading', { name: '둘째 공지' })).toBeInTheDocument();
  });

  it('holds on hover after focus leaves, and ignores internal focus movement', () => {
    render(<AnnouncementSlider items={items} />);
    const carousel = screen.getByRole('region', { name: '공지사항' });
    const next = screen.getByRole('button', { name: '다음 공지' });
    const previous = screen.getByRole('button', { name: '이전 공지' });
    fireEvent.focus(next);
    fireEvent.blur(next, { relatedTarget: previous });
    tick();
    expect(screen.getByRole('heading', { name: '첫 공지' })).toBeInTheDocument();
    fireEvent.mouseEnter(carousel);
    fireEvent.blur(previous, { relatedTarget: document.body });
    tick();
    expect(screen.getByRole('heading', { name: '첫 공지' })).toBeInTheDocument();
    fireEvent.mouseLeave(carousel);
    tick();
    expect(screen.getByRole('heading', { name: '둘째 공지' })).toBeInTheDocument();
  });

  it('keeps explicit pause intent through hover and focus changes until play is requested', () => {
    render(<AnnouncementSlider items={items} />);
    const carousel = screen.getByRole('region', { name: '공지사항' });
    const pause = screen.getByRole('button', { name: '자동 재생 정지' });
    fireEvent.focus(pause);
    fireEvent.click(pause);
    expect(pause).toHaveAttribute('aria-pressed', 'true');
    fireEvent.blur(pause, { relatedTarget: document.body });
    fireEvent.mouseEnter(carousel);
    fireEvent.mouseLeave(carousel);
    tick(15000);
    expect(screen.getByRole('heading', { name: '첫 공지' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '자동 재생 시작' }));
    tick();
    expect(screen.getByRole('heading', { name: '둘째 공지' })).toBeInTheDocument();
  });

  it('disables autoplay for reduced motion but retains manual navigation and reacts to preference changes', () => {
    reduced = true;
    render(<AnnouncementSlider items={items} />);
    expect(screen.getByRole('button', { name: '모션 감소 설정으로 자동 재생 꺼짐' })).toBeDisabled();
    tick(10000);
    expect(screen.getByRole('heading', { name: '첫 공지' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다음 공지' }));
    expect(screen.getByRole('heading', { name: '둘째 공지' })).toBeInTheDocument();
    act(() => { reduced = false; listeners.forEach((callback) => callback()); });
    tick();
    expect(screen.getByRole('heading', { name: '셋째 공지' })).toBeInTheDocument();
    act(() => { reduced = true; listeners.forEach((callback) => callback()); });
    tick(10000);
    expect(screen.getByRole('heading', { name: '셋째 공지' })).toBeInTheDocument();
  });

  it('cleans up its interval and preference subscription when unmounted', () => {
    const { unmount } = render(<AnnouncementSlider items={items} />);
    expect(vi.getTimerCount()).toBe(1);
    expect(listeners.size).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(listeners.size).toBe(0);
  });

  it('handles empty and single-item announcements without invalid timers or controls', () => {
    const { rerender } = render(<AnnouncementSlider items={[]} />);
    expect(screen.queryByRole('region')).toBeNull();
    rerender(<AnnouncementSlider items={[items[0]]} />);
    expect(screen.getByRole('heading', { name: '첫 공지' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
});
