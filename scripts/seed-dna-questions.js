// Supabase에 DNA 질문 데이터를 등록하는 스크립트
// 실행: node scripts/seed-dna-questions.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://pkbnudkbkhzqjhwffkbj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrYm51ZGtia2h6cWpod2Zma2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2Mzk4MDAsImV4cCI6MjA4NDIxNTgwMH0.QBqaRBMuOzrm5h5uAP3GJQhwgKp40QdUodg6-jZIS-A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// dnaQuestions.ts에서 질문 데이터 추출
function extractQuestions() {
  const tsPath = path.join(__dirname, '../src/data/dnaQuestions.ts');
  const content = fs.readFileSync(tsPath, 'utf-8');

  // QUESTION_POOL 객체 추출
  const poolMatch = content.match(/const QUESTION_POOL.*?=\s*\{([\s\S]*?)\n\};/);
  if (!poolMatch) {
    console.error('QUESTION_POOL을 찾을 수 없습니다');
    process.exit(1);
  }

  // 각 카테고리별 질문 추출 (정규식으로 id 기반)
  const questions = [];
  const questionRegex = /\{\s*id:\s*'([^']+)',\s*category:\s*'([^']+)',\s*categoryKey:\s*'([^']+)',\s*question:\s*'([^']*(?:\\'[^']*)*)',\s*options:\s*\[([\s\S]*?)\],?\s*\}/g;

  let match;
  while ((match = questionRegex.exec(content)) !== null) {
    const [, id, category, categoryKey, question, optionsStr] = match;

    // 옵션 파싱
    const options = [];
    const optRegex = /\{\s*id:\s*'([^']+)',\s*text:\s*'([^']*(?:\\'[^']*)*)',\s*label:\s*'([^']*(?:\\'[^']*)*)',\s*scores:\s*\{([^}]+)\}\s*\}/g;
    let optMatch;
    while ((optMatch = optRegex.exec(optionsStr)) !== null) {
      const [, optId, text, label, scoresStr] = optMatch;
      const scores = {};
      scoresStr.replace(/(\w+):\s*(-?\d+)/g, (_, key, val) => {
        scores[key] = parseInt(val);
      });
      options.push({
        id: optId,
        text: text.replace(/\\'/g, "'"),
        label: label.replace(/\\'/g, "'"),
        scores
      });
    }

    if (options.length > 0) {
      questions.push({
        question_id: id,
        category: category.replace(/\\'/g, "'"),
        category_key: categoryKey,
        question: question.replace(/\\'/g, "'"),
        options: options
      });
    }
  }

  return questions;
}

async function createTable() {
  console.log('1. dna_questions 테이블 생성 시도...');

  // RPC로 테이블 생성 (SQL 직접 실행)
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS dna_questions (
        id BIGSERIAL PRIMARY KEY,
        question_id TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        category_key TEXT NOT NULL,
        question TEXT NOT NULL,
        options JSONB NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_dna_questions_category ON dna_questions(category_key);
      CREATE INDEX IF NOT EXISTS idx_dna_questions_active ON dna_questions(is_active);
    `
  });

  if (error) {
    console.log('   RPC 방식 불가 - 직접 테이블 접근으로 진행합니다.');
    console.log('   (Supabase Dashboard에서 테이블을 먼저 만들거나, 아래 SQL을 실행해주세요)');
    console.log('\n--- SQL (Supabase SQL Editor에 붙여넣기) ---');
    console.log(`
CREATE TABLE IF NOT EXISTS dna_questions (
  id BIGSERIAL PRIMARY KEY,
  question_id TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  category_key TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dna_questions_category ON dna_questions(category_key);
CREATE INDEX IF NOT EXISTS idx_dna_questions_active ON dna_questions(is_active);

-- RLS 정책 (모든 사용자 읽기 허용)
ALTER TABLE dna_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dna_questions_read_all" ON dna_questions
  FOR SELECT USING (true);
`);
    console.log('--- SQL 끝 ---\n');
    return false;
  }

  console.log('   ✅ 테이블 생성 완료!');
  return true;
}

async function seedQuestions(questions) {
  console.log(`\n2. ${questions.length}개 질문 Supabase에 등록 중...`);

  // 50개씩 배치 삽입
  const batchSize = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('dna_questions')
      .upsert(batch, { onConflict: 'question_id' })
      .select('question_id');

    if (error) {
      console.error(`   ❌ 배치 ${Math.floor(i / batchSize) + 1} 에러:`, error.message);
      errors += batch.length;
    } else {
      inserted += (data || []).length;
      process.stdout.write(`   진행: ${inserted}/${questions.length} (${Math.round(inserted / questions.length * 100)}%)\r`);
    }
  }

  console.log(`\n\n3. 결과:`);
  console.log(`   ✅ 등록 성공: ${inserted}개`);
  if (errors > 0) console.log(`   ❌ 에러: ${errors}개`);

  // 카테고리별 통계
  const { data: stats } = await supabase
    .from('dna_questions')
    .select('category_key')

  if (stats) {
    const counts = {};
    stats.forEach(s => { counts[s.category_key] = (counts[s.category_key] || 0) + 1; });
    console.log('\n   카테고리별:');
    for (const [key, count] of Object.entries(counts).sort()) {
      console.log(`     ${key}: ${count}개`);
    }
    console.log(`     합계: ${stats.length}개`);
  }
}

async function main() {
  console.log('=== DNA 질문 Supabase 등록 스크립트 ===\n');

  // 질문 추출
  const questions = extractQuestions();
  console.log(`파싱된 질문: ${questions.length}개`);

  const catCounts = {};
  questions.forEach(q => { catCounts[q.category_key] = (catCounts[q.category_key] || 0) + 1; });
  for (const [key, count] of Object.entries(catCounts).sort()) {
    console.log(`  ${key}: ${count}개`);
  }

  // 테이블 생성 시도
  const tableCreated = await createTable();

  // 데이터 삽입
  await seedQuestions(questions);

  console.log('\n=== 완료 ===');
}

main().catch(console.error);
