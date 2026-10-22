import Image from 'next/image';

export default function MarketIllustration() {
  return (
    <div className="relative h-16 md:h-[90px] shrink-0 overflow-hidden bg-market-surface-2">
      <Image src="/images/market-prices-volume-20261023.png" alt="도시 건물과 시세·거래량을 표현한 일러스트" fill sizes="(max-width: 767px) 100vw, 400px" className="object-cover" />
      <span className="absolute bottom-1 right-2 rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-gray-700">AI 생성 이미지 · 실제 통계 아님</span>
    </div>
  );
}
