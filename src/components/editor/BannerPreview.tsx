'use client';

import { BANNER_PRESETS } from './bannerPresets';

interface BannerPreviewProps {
  bgUrl: string;
  logoUrl: string;
  title: string;
  subtitle: string;
  presetId: string;
  opacity: number;
}

export default function BannerPreview({
  bgUrl,
  logoUrl,
  title,
  subtitle,
  presetId,
  opacity,
}: BannerPreviewProps) {
  const preset = BANNER_PRESETS.find(p => p.id === presetId) || BANNER_PRESETS[0];
  const overlayStyle = preset.overlayStyle.replace(/\{opacity\}/g, String(opacity));

  const justifyContent = preset.textAlign === 'center' ? 'center' : 'flex-start';
  const alignItems = preset.textAlign === 'center' ? 'center' : 'flex-start';
  const textAlignVal = preset.textAlign;

  return (
    <div style={{ position: 'relative', width: '100%', height: 300, overflow: 'hidden', borderRadius: 8 }}>
      {bgUrl ? (
        <img
          src={bgUrl}
          alt="banner preview"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#9ca3af', fontSize: 14 }}>배경 이미지를 선택하세요</span>
        </div>
      )}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, ...(parseOverlayStyle(overlayStyle)) }} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent,
          alignItems,
          padding: '30px 40px',
        }}
      >
        {logoUrl && (
          <img
            src={logoUrl}
            alt="logo"
            style={{
              width: 80,
              height: 'auto',
              marginBottom: 16,
              ...(preset.textAlign === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } : {}),
            }}
          />
        )}
        {title && (
          <h1
            style={{
              color: preset.textColor,
              fontSize: preset.fontSize.title,
              fontWeight: 700,
              margin: '0 0 8px',
              lineHeight: 1.3,
              textAlign: textAlignVal,
              width: '100%',
            }}
          >
            {title}
          </h1>
        )}
        {subtitle && (
          <p
            style={{
              color: preset.subtitleColor,
              fontSize: preset.fontSize.subtitle,
              margin: 0,
              lineHeight: 1.5,
              textAlign: textAlignVal,
              width: '100%',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function parseOverlayStyle(styleStr: string): React.CSSProperties {
  const bgMatch = styleStr.match(/background:(.+)/);
  if (bgMatch) {
    return { background: bgMatch[1] };
  }
  return {};
}
