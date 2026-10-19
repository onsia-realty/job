import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Building2, Home } from 'lucide-react';
import ServiceCard from './ServiceCard';

afterEach(cleanup);

describe('ServiceCard', () => {
  it('preserves the destination, visible service copy and a single accessible link', () => {
    const { container } = render(<ServiceCard href="/agent/jobs" img="/service.png" title="공인중개사" desc="중개사무소 구인구직" Icon={Building2} accent="bg-cyan-400" className="flex md:hidden" />);
    expect(screen.getByRole('link', { name: '공인중개사 중개사무소 구인구직' })).toHaveAttribute('href', '/agent/jobs');
    expect(screen.getByRole('heading', { name: '공인중개사' })).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(container.querySelector('a button')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('accepts independent service content without changing its route', () => {
    render(<ServiceCard href="/stay" img="/stay.png" title="단기임대" desc="검증된 안심 단기임대" Icon={Home} accent="bg-emerald-400" />);
    expect(screen.getByRole('link', { name: '단기임대 검증된 안심 단기임대' })).toHaveAttribute('href', '/stay');
  });
});
