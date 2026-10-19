import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, type LucideIcon } from 'lucide-react';

interface ServiceCardProps {
  href: string;
  img: string;
  title: string;
  desc: string;
  Icon: LucideIcon;
  accent: 'bg-cyan-400' | 'bg-blue-400' | 'bg-emerald-400';
  className?: string;
}

export default function ServiceCard({ href, img, title, desc, Icon, accent, className = '' }: ServiceCardProps) {
  return (
    <Link href={href} className={`group relative min-h-[120px] flex-1 overflow-hidden rounded-2xl border border-white/10 hover:border-cyan-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141517] ${className}`}>
      <Image src={img} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b1220]/95 via-[#0b1220]/70 to-transparent" />
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${accent}`} />
      <div className="relative z-10 flex h-full w-full items-center gap-4 px-4 py-3 lg:px-5 lg:py-4">
        <Icon className="size-7 shrink-0 text-white md:hidden lg:block lg:size-8" aria-hidden="true" />
        <div className="min-w-0 flex-1"><h3 className="break-keep text-lg font-bold lg:text-xl">{title}</h3><p className="mt-1 break-keep text-sm leading-relaxed text-gray-300">{desc}</p></div>
        <ArrowRight className="size-5 shrink-0 text-cyan-300 transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true" />
      </div>
    </Link>
  );
}
