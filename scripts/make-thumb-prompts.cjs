// v2 — 광고 배너 스타일 (왼쪽 금속 3D 타이포 + 오른쪽 건물 야경). Output: markdown on Desktop.
const fs = require('fs');
const src = fs.readFileSync('D:/claude/onsia-Job/onsia-job/src/data/salesJobsSample.ts', 'utf8');
const out = 'C:/Users/Dae/Desktop/부인-썸네일-프롬프트.md';

const blocks = src.split(/\n  \{\r?\n/).slice(1).map((b) => b.split(/\n  \},?/)[0]);
const pick = (b, k) => { const m = b.match(new RegExp(`\\b${k}:\\s*'([^']*)'`)); return m ? m[1] : ''; };
const items = blocks.map((b) => ({
  id: pick(b, 'id'), title: pick(b, 'title'), desc: pick(b, 'description'),
  type: pick(b, 'type'), tier: pick(b, 'tier'), region: pick(b, 'region'),
  position: pick(b, 'position'), experience: pick(b, 'experience'),
  amount: (b.match(/amount:\s*'([^']*)'/) || [])[1] || '',
  salaryType: (b.match(/salary:\s*\{\s*type:\s*'([^']*)'/) || [])[1] || '',
  benefits: ((b.match(/benefits:\s*\[([^\]]*)\]/) || [])[1] || '').split(',').map((s) => s.replace(/['\s]/g, '')).filter(Boolean),
})).filter((x) => x.id && x.title);

// 오른쪽 건물 (야경 조명 렌더, 글자·로고 없는 건물)
const BUILDING = {
  apartment: '고층 아파트 타워 3개 동. 세대마다 따뜻한 노란 불빛이 켜진 야경, 건물 모서리를 따라 {accent} 경관조명 라인',
  officetel: '슬림한 신축 오피스텔 타워 1~2개 동. 유리 커튼월에 불이 켜진 야경, 옥상과 모서리에 {accent} 경관조명 라인',
  industrial: '대형 지식산업센터(도심형 비즈니스 타워) 1개 동. 수평 띠창마다 불이 켜진 야경, 옥상 라인에 {accent} 경관조명',
  store: '3~4층 규모의 고급 스트리트형 상가. 통유리 매장마다 밝은 조명이 켜진 야경, 처마 라인에 {accent} 경관조명',
};
// 색 테마 (배경색 / 조명색 / 건물 포인트 조명)
const THEME = {
  red:     { bg: '깊은 와인 레드에서 검정으로 떨어지는 그라데이션', light: '붉은 스포트라이트', accent: '붉은색' },
  navy:    { bg: '깊은 네이비 블루에서 검정으로 떨어지는 그라데이션', light: '푸른 스포트라이트', accent: '푸른색' },
  emerald: { bg: '깊은 에메랄드 그린에서 검정으로 떨어지는 그라데이션', light: '청록빛 스포트라이트', accent: '에메랄드색' },
  purple:  { bg: '깊은 로열 퍼플에서 검정으로 떨어지는 그라데이션', light: '보랏빛 스포트라이트', accent: '보라색' },
  black:   { bg: '무광 블랙에서 짙은 차콜로 이어지는 그라데이션', light: '금빛 스포트라이트', accent: '금색' },
  bronze:  { bg: '깊은 브라운 브론즈에서 검정으로 떨어지는 그라데이션', light: '호박색 스포트라이트', accent: '호박색' },
};
const ROTATE = ['navy', 'emerald', 'purple', 'black', 'bronze', 'red'];
let rot = 0;
const themeOf = (it) => (it.tier === 'unique' ? (it.type === 'industrial' ? 'black' : 'red') : ROTATE[rot++ % ROTATE.length]);

const POS = { member: '팀원', teamLead: '팀장', manager: '본부장', director: '본부장' };
const TYPE_KO = { apartment: '아파트', officetel: '오피스텔', industrial: '지식산업센터', store: '상가' };

// 현장명(짧게) — 자동 분리가 어색한 공고는 손으로 지정
const SITE = {
  '1': '경기 힐스테이트', '8': '세종 지식산업센터', s1: '강서 이안 민간임대', s2: '서울원 파크로쉬', s3: '인천시청역 민간임대',
  s4: '더자하 인 마곡', s5: 'e편한세상 일산', s6: '숭의역 라온프라이빗', s7: '의왕 포일 민간임대', s8: '운정 아이파크',
  s9: '보라매 파크시티', s10: '파주 문산역 동문3차', s11: '반포 단지내상가', s12: '회룡역 힐스테이트', s13: '김포 해링턴플레이스',
  s14: '한남동 민간임대', s15: '신길 AK 푸르지오', s16: '눈담봄 112프라자', s17: '제주 민간임대', s18: '엘리프 검단 포레듀',
  s19: '안양 롯데캐슬', s20: '영등포 C타워', '3': '송도 오피스텔', '5': '해운대 마린시티 상가', '7': '광주 상무지구',
  '4': '김포 지식산업센터', '9': '수원 광교 상가', '10': '제주 노형동 오피스텔',
};
// 가장 큰 금색 글자 (숫자가 있으면 숫자, 없으면 핵심 조건)
const HERO = { s1: '팀 1,100만', s18: '최대 수수료', '7': '기본급+인센' };

function copy(it) {
  const parts = it.desc.split('|').map((s) => s.trim()).filter(Boolean);
  const daily = (it.title + ' ' + it.desc).match(/일비\s*(\d+)만원/);
  const pos = POS[it.position] || '상담사';
  let top, hero;
  if (HERO[it.id]) { top = `${pos} 모집`; hero = HERO[it.id]; }
  else if (daily) { top = `${pos} 일비`; hero = `매일 ${daily[1]}만원`; }
  else if (it.salaryType === 'daily' && it.amount) { top = `${pos} 일당`; hero = `${it.amount}원`; }
  else if (it.amount && it.amount !== '협의') { top = `${pos} 수수료`; hero = it.amount.replace(/원$/, ''); }
  else { top = `${it.region} · ${TYPE_KO[it.type] || '분양'}`; hero = null; } // 숫자가 없으면 현장명이 주인공
  // 조건 한 줄: 손으로 다듬은 문구 우선, 없으면 설명에서 짧은 조건 2개
  const COND = {
    '1': '조건변경 · 수수료 인상', '8': '행복도시 첫 지산', s1: '3월 3일 투입 · 광고지원', s3: '경력무관 · 즉시투입',
    s7: '최고 입지 · 경력무관', s8: '운정 대단지 · 숙소제공', s11: '상가분양 경험자 우대', s16: '초보·경력 모두 환영',
    s18: '신규 분상제 · 주단위 지급', '3': '송도 핵심 상권', '5': '해운대 핵심 상권', '7': '광주 최고 입지',
    '4': '골드라인 역세권', '9': '광교 핵심 상권', '10': '제주 중심상업지역',
  };
  const conds = parts.filter((s) => /수수료|지급|투입|지원|우대|무관|역세권/.test(s) && s.length <= 8 && !/\d/.test(s));
  const cond = COND[it.id] || (conds.length ? conds.slice(0, 2).join(' · ') : `${it.region} ${TYPE_KO[it.type] || ''} 현장`.trim());
  // 뱃지 3개
  const pills = [...it.benefits];
  if (it.experience === 'none' || /경력무관/.test(it.desc)) pills.push('경력무관');
  for (const p of parts) if (/즉시투입|숙소제공|광고지원|광고비지원|일비지급|주단위지급|항공권지원/.test(p)) pills.push(p.replace(/\s/g, ''));
  for (const p of parts) if (/^(계약수수료|경력우대|최대수수료)$/.test(p)) pills.push(p);
  // 공고에 없는 혜택은 지어내지 않는다 — 모자라면 지역·유형으로 채움
  for (const d of [`${it.region} 현장`, TYPE_KO[it.type] || '분양', '상담사 모집']) pills.push(d);
  const inCond = (p) => cond.replace(/\s/g, '').includes(p.replace(/\s/g, ''));
  const uniq = [...new Set(pills.map((p) => (p === '일비' ? '일비지급' : p)))].filter((p) => p.length <= 6 && !inCond(p)).slice(0, 3);
  const site = SITE[it.id] || it.title;
  // 숫자가 없는 공고: 현장명을 금색 주인공으로, 은색 줄은 "분양상담사 모집"
  return hero ? { top, hero, site, cond, pills: uniq } : { top, hero: site, site: '분양상담사 모집', cond, pills: uniq };
}

const L = [];
L.push('# 부인(BOOIN) 분양 공고 썸네일 프롬프트 v2 — 광고 배너 스타일 (GPT 이미지용)', '');
L.push('## 공통 설정', '- **크기**: 가로형 3:2 (1536×1024)', '- **파일명**: 각 제목의 파일명 그대로 (예: `sales-1.jpg`). 이 이름이면 바로 사이트에 연결돼요.', '');
L.push('## 검수 체크리스트', '1. 한글이 따옴표 안 문구와 **한 글자도 다르지 않은지** (특히 숫자와 "만")', '2. 건설사·브랜드 **로고나 심볼이 없는지**', '3. 글자는 왼쪽, 건물은 오른쪽에 있는지', '4. 전화번호, 워터마크, 영어 문구가 없는지', '', '## 색 테마', '유니크는 레드·블랙 골드로 고정, 나머지는 네이비·에메랄드·퍼플·블랙·브론즈·레드를 돌아가며 써서 목록이 단조롭지 않게 했어요.', '', '---', '');

const summary = [];
for (const it of items) {
  const tk = themeOf(it); const t = THEME[tk]; const c = copy(it);
  summary.push(`${it.id.padStart(3)} | ${tk.padEnd(7)} | ${c.top} / ${c.hero} / ${c.site} / ${c.cond} / [${c.pills.join(', ')}]`);
  L.push(`## ${it.id}번 · ${it.title}  →  파일명 \`sales-${it.id}.jpg\``, '', '```');
  L.push(
`한국 분양 현장의 구인 광고 배너. 가로형 3:2. 고급스럽고 임팩트 있는 프로모션 광고 디자인.

[전체 구도] 화면을 좌우로 나눈다. 왼쪽 55%는 글자 영역, 오른쪽 45%는 건물. 두 영역은 경계선 없이 자연스럽게 이어진다.

[배경] ${t.bg}. 왼쪽 위에서 비스듬히 내려오는 ${t.light} 빛줄기, 공중에 흩날리는 작은 금빛 불꽃 입자, 은은한 렌즈 플레어. 화면 맨 아래는 잔잔한 수면처럼 건물과 글자가 희미하게 반사된다.

[오른쪽 건물] ${BUILDING[it.type].replace('{accent}', t.accent)}. 실사에 가까운 건축 CG, 아래에서 약간 올려다보는 시점, 밤하늘 배경. 건물에는 글자나 로고가 없다.

[왼쪽 글자] 위에서 아래로 4줄, 모두 가운데 정렬, 굵은 고딕체. 한글 철자와 숫자는 따옴표 안과 정확히 같게.
1. 작은 글자, 흰색에 옅은 입체감: "${c.top}"
2. 가장 큰 글자, 빛나는 황금색 금속 3D 질감, 위쪽에 하이라이트, 짙은 그림자: "${c.hero}"
3. 큰 글자, 은백색 금속 3D 질감: "${c.site}"
4. 중간 글자, 연한 금색: "${c.cond}"

[하단 뱃지] 왼쪽 글자 아래에 알약 모양 뱃지 3개를 가로로 나란히. 어두운 반투명 바탕에 얇은 금색 테두리, 왼쪽에 작은 금색 선 아이콘, 흰색 굵은 글자: "${c.pills[0] || '경력무관'}", "${c.pills[1] || '즉시투입'}", "${c.pills[2] || '계약수수료'}"

[금지] 건설사·브랜드 로고와 심볼, 전화번호, QR코드, 워터마크, 영어 문구, 사람, 위 문구 외의 다른 글자, 깨지거나 틀린 한글, 테두리 프레임.`);
  L.push('```', '');
}
fs.writeFileSync(out, L.join('\n'), 'utf8');
console.log(`items: ${items.length}`); summary.forEach((s) => console.log(s)); console.log('written:', out);
