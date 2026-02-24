const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addColumn() {
  // toon_image_url 컬럼 추가 (이미 있으면 무시됨)
  const { error } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE news_toon_episodes ADD COLUMN IF NOT EXISTS toon_image_url TEXT;`
  });

  if (error) {
    // rpc가 없으면 직접 REST로 시도
    console.log('RPC not available, trying direct approach...');
    // Supabase JS에서는 DDL을 직접 실행할 수 없으므로 SQL Editor에서 실행 필요
    console.log('Please run this SQL in Supabase SQL Editor:');
    console.log('ALTER TABLE news_toon_episodes ADD COLUMN IF NOT EXISTS toon_image_url TEXT;');
    return;
  }

  console.log('Column added successfully');
}

addColumn();
