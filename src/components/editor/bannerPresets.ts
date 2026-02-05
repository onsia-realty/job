export interface BannerPreset {
  id: string;
  name: string;
  overlayStyle: string;
  textColor: string;
  subtitleColor: string;
  textAlign: 'left' | 'center' | 'right';
  fontSize: { title: number; subtitle: number };
  swatchColors: string[];
}

export interface BannerData {
  bgUrl: string;
  logoUrl: string;
  title: string;
  subtitle: string;
  presetId: string;
  opacity: number;
}

export const SAMPLE_BANNER_IMAGES = [
  '/images/onsia_realty_A_candid_photograph_of_a_confident_female_execut_401329ad-8fa2-4be6-936d-bfe9c1aac6af_2.png',
  '/images/onsia_realty_A_stunning_Korean_woman_real_estate_manager_with_5cb9b566-bb76-4883-94c1-88b84548f1f1_0.png',
  '/images/onsia_realty_Asian_Korean_male_real_estate_agent_in_modern_of_f4f43b43-54ca-45dc-85fd-7afeb7787e66_1 (1).png',
  '/images/onsia_realty_Professional_Korean_woman_real_estate_consultant_c23dc044-c7a7-49f5-a03a-34412ecd3e67_0.png',
  '/images/onsia_realty_Professional_Korean_woman_real_estate_consultant_dd65c326-faa8-4e9f-a4bf-78d8ea09fc56_0.png',
];

export const BANNER_PRESETS: BannerPreset[] = [
  {
    id: 'dark-classic',
    name: '다크 클래식',
    overlayStyle: 'background:rgba(0,0,0,{opacity})',
    textColor: '#ffffff',
    subtitleColor: 'rgba(255,255,255,0.85)',
    textAlign: 'left',
    fontSize: { title: 44, subtitle: 22 },
    swatchColors: ['#1a1a1a', '#333333', '#4a4a4a'],
  },
  {
    id: 'blue-gradient',
    name: '블루 그라디언트',
    overlayStyle: 'background:linear-gradient(135deg,rgba(37,99,235,{opacity}),rgba(8,145,178,{opacity}))',
    textColor: '#ffffff',
    subtitleColor: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontSize: { title: 46, subtitle: 22 },
    swatchColors: ['#2563eb', '#0891b2', '#06b6d4'],
  },
  {
    id: 'white-minimal',
    name: '화이트 미니멀',
    overlayStyle: 'background:rgba(255,255,255,{opacity})',
    textColor: '#111827',
    subtitleColor: 'rgba(17,24,39,0.7)',
    textAlign: 'center',
    fontSize: { title: 42, subtitle: 20 },
    swatchColors: ['#ffffff', '#f3f4f6', '#e5e7eb'],
  },
  {
    id: 'orange-energy',
    name: '오렌지 에너지',
    overlayStyle: 'background:linear-gradient(135deg,rgba(249,115,22,{opacity}),rgba(234,179,8,{opacity}))',
    textColor: '#ffffff',
    subtitleColor: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontSize: { title: 46, subtitle: 22 },
    swatchColors: ['#f97316', '#eab308', '#fb923c'],
  },
];

export function generateBannerHtml(data: BannerData): string {
  const preset = BANNER_PRESETS.find(p => p.id === data.presetId) || BANNER_PRESETS[0];
  const opacity = data.opacity ?? 0.55;
  const overlayStyle = preset.overlayStyle.replace(/\{opacity\}/g, String(opacity));

  const justifyContent = preset.textAlign === 'center' ? 'center' : 'flex-start';
  const alignItems = preset.textAlign === 'center' ? 'center' : 'flex-start';
  const textAlignVal = preset.textAlign;

  const logoHtml = data.logoUrl
    ? `<img src="${data.logoUrl}" alt="logo" style="width:80px;height:auto;margin-bottom:16px;${preset.textAlign === 'center' ? 'margin-left:auto;margin-right:auto;' : ''}" />`
    : '';

  const titleHtml = data.title
    ? `<h1 style="color:${preset.textColor};font-size:${preset.fontSize.title}px;font-weight:700;margin:0 0 8px;line-height:1.3;text-align:${textAlignVal};">${data.title}</h1>`
    : '';

  const subtitleHtml = data.subtitle
    ? `<p style="color:${preset.subtitleColor};font-size:${preset.fontSize.subtitle}px;margin:0;line-height:1.5;text-align:${textAlignVal};">${data.subtitle}</p>`
    : '';

  const bannerDataJson = JSON.stringify({
    bgUrl: data.bgUrl,
    logoUrl: data.logoUrl,
    title: data.title,
    subtitle: data.subtitle,
    presetId: data.presetId,
    opacity,
  });

  return `<!-- BANNER:START -->
<!-- BANNER_DATA:${bannerDataJson} -->
<div style="position:relative;width:100%;height:300px;overflow:hidden;border-radius:8px;margin-bottom:20px;">
  <img src="${data.bgUrl}" alt="banner" style="width:100%;height:100%;object-fit:cover;" />
  <div style="position:absolute;top:0;left:0;right:0;bottom:0;${overlayStyle};"></div>
  <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;justify-content:${justifyContent};align-items:${alignItems};padding:30px 40px;">
    ${logoHtml}
    ${titleHtml}
    ${subtitleHtml}
  </div>
</div>
<!-- BANNER:END -->`;
}

export function extractBannerData(html: string): BannerData | null {
  const match = html.match(/<!-- BANNER_DATA:(.*?) -->/);
  if (!match) return null;

  try {
    return JSON.parse(match[1]) as BannerData;
  } catch {
    return null;
  }
}

export function hasBanner(html: string): boolean {
  return html.includes('<!-- BANNER:START -->') && html.includes('<!-- BANNER:END -->');
}

export function replaceBanner(html: string, newBannerHtml: string): string {
  return html.replace(
    /<!-- BANNER:START -->[\s\S]*?<!-- BANNER:END -->/,
    newBannerHtml
  );
}

export function insertBannerAtTop(html: string, bannerHtml: string): string {
  return bannerHtml + '\n' + html;
}
