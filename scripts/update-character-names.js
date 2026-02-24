const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pkbnudkbkhzqjhwffkbj.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updatePanels() {
  const { data: ep } = await supabase
    .from('news_toon_episodes')
    .select('id, panels')
    .order('episode_number', { ascending: true })
    .limit(1)
    .single();

  if (!ep) { console.log('No episode found'); return; }

  const nameMap = {
    '부동산 아저씨': '말 소장',
    '분양 언니': '고양이 기자',
    '정부 관료': '여우 관료',
    '실수요자': '영끌남',
    '현금부자': '올빼미 교수',
    '전문가': '올빼미 교수',
  };

  const panels = ep.panels.map(p => ({
    ...p,
    character: nameMap[p.character] || p.character,
  }));

  const { error } = await supabase
    .from('news_toon_episodes')
    .update({ panels })
    .eq('id', ep.id);

  if (error) console.error('Update error:', error);
  else console.log('Updated panels:', JSON.stringify(panels.map(p => p.character)));
}

updatePanels();
