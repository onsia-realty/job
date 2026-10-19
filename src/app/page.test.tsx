import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  current: { user: null as null | { user_metadata?: { name?: string } }, isLoading: false },
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => auth.current }));
vi.mock('@/components/shared/Footer', () => ({ default: () => <footer>공통 푸터</footer> }));

const cachedNews = [{ id: 1, title: '캐시된 뉴스', link: 'https://example.com/cached', category: '정책', thumbnail: '' }];
const freshNews = [{ id: 2, title: '최신 뉴스', link: 'https://example.com/fresh', category: '시장', thumbnail: '' }];
const episode = { id: 'toon-1', episode_number: 1, title: '새 뉴스툰', slug: 'new-toon', category: '부동산', toon_image_url: null, view_count: 15 };
let request: ReturnType<typeof vi.fn>;

async function loadPage(stayEnabled = false) {
  vi.stubEnv('NEXT_PUBLIC_STAY_ENABLED', String(stayEnabled));
  const { default: LandingPage } = await import('./page');
  return LandingPage;
}

beforeEach(() => {
  vi.resetModules();
  sessionStorage.clear();
  auth.current = { user: null, isLoading: false };
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  request = vi.fn(async (url: string) => ({ json: async () => url.startsWith('/api/toon') ? { episodes: [episode] } : { news: freshNews } }));
  vi.stubGlobal('fetch', request);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('home page functionality', () => {
  it.each([false, true])('preserves desktop/mobile agent routes and gates STAY (enabled=%s)', async (stayEnabled) => {
    const LandingPage = await loadPage(stayEnabled);
    const { container } = render(<LandingPage />);
    await screen.findByText('최신 뉴스');
    const services = container.querySelector('[aria-label="서비스 선택"]') as HTMLElement;
    const links = within(services).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual(stayEnabled ? ['/agent/jobs', '/agent', '/sales', '/stay'] : ['/agent/jobs', '/agent', '/sales']);
    expect(container.querySelectorAll('a[href="/stay"]')).toHaveLength(stayEnabled ? 2 : 0);
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/agent/auth/login');
    expect(container.querySelectorAll('a[href="/premium"]')).toHaveLength(2);
    expect(container.querySelector('video')).toHaveAttribute('src', 'https://pkbnudkbkhzqjhwffkbj.supabase.co/storage/v1/object/public/job-images/videos/intro-main.mp4');
    expect(container.querySelector('a button')).toBeNull();
  });

  it('keeps API news and toon destinations, external-link safety and the news cache', async () => {
    const LandingPage = await loadPage();
    render(<LandingPage />);
    const news = await screen.findByRole('link', { name: /최신 뉴스/ });
    expect(news).toHaveAttribute('href', 'https://example.com/fresh');
    expect(news).toHaveAttribute('target', '_blank');
    expect(news).toHaveAttribute('rel', 'noopener noreferrer');
    expect(await screen.findByRole('link', { name: /새 뉴스툰/ })).toHaveAttribute('href', '/toon/new-toon');
    expect(request).toHaveBeenCalledWith('/api/news');
    expect(request).toHaveBeenCalledWith('/api/toon?limit=2');
    expect(JSON.parse(sessionStorage.getItem('booin_news_cache')!)).toEqual(freshNews);
  });

  it('shows cached news while the fresh request is still pending', async () => {
    sessionStorage.setItem('booin_news_cache', JSON.stringify(cachedNews));
    request.mockImplementation(async (url: string) => url.startsWith('/api/toon') ? { json: async () => ({ episodes: [] }) } : new Promise(() => {}));
    const LandingPage = await loadPage();
    render(<LandingPage />);
    expect(await screen.findByRole('link', { name: /캐시된 뉴스/ })).toHaveAttribute('href', 'https://example.com/cached');
  });

  it('preserves signed-in account and loading branches without premature login links', async () => {
    auth.current = { user: null, isLoading: true };
    const LandingPage = await loadPage();
    const { rerender } = render(<LandingPage />);
    expect(screen.queryByRole('link', { name: '로그인' })).toBeNull();
    auth.current = { user: { user_metadata: { name: '디자인 검수자' } }, isLoading: false };
    rerender(<LandingPage />);
    expect(screen.getByRole('link', { name: '디자인 검수자' })).toHaveAttribute('href', '/agent/mypage');
    auth.current = { user: {}, isLoading: false };
    rerender(<LandingPage />);
    expect(screen.getByRole('link', { name: '마이페이지' })).toHaveAttribute('href', '/agent/mypage');
    await waitFor(() => expect(screen.getByText('최신 뉴스')).toBeInTheDocument());
  });

  it('marks unfinished controls as ready-state text instead of actionable buttons', async () => {
    const LandingPage = await loadPage();
    render(<LandingPage />);
    await screen.findByText('최신 뉴스');
    expect(screen.getByText('커뮤니티', { exact: false, selector: '[aria-disabled="true"]' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('검색', { exact: false, selector: '[aria-disabled="true"]' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByRole('button', { name: /검색|커뮤니티/ })).toBeNull();
  });
});
