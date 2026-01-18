'use client';

interface NewsImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function NewsImage({ src, alt, className }: NewsImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop';
      }}
    />
  );
}
