/**
 * Supabase 마이그레이션 적용 스크립트
 *
 * 사용법:
 *   1. Supabase Dashboard > Project Settings > Database > Connection string 에서 DB 비밀번호 확인
 *   2. .env.local 에 DATABASE_URL 추가:
 *      DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
 *   3. npm install pg (한 번만)
 *   4. node scripts/apply-migration.mjs
 *
 * 또는 Supabase Dashboard > SQL Editor 에서 직접 실행:
 *   supabase/migrations/004_broker_offices.sql 파일 내용을 복사하여 실행
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function applyMigration() {
  // .env.local 파일에서 DATABASE_URL 읽기
  const envPath = join(__dirname, '..', '.env.local');
  let dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    try {
      const envContent = readFileSync(envPath, 'utf-8');
      const match = envContent.match(/DATABASE_URL=(.+)/);
      if (match) dbUrl = match[1].trim();
    } catch {
      // .env.local 읽기 실패
    }
  }

  if (!dbUrl) {
    console.error('DATABASE_URL이 설정되지 않았습니다.');
    console.error('');
    console.error('방법 1: .env.local에 DATABASE_URL 추가');
    console.error('  Supabase Dashboard > Project Settings > Database > Connection string');
    console.error('  DATABASE_URL=postgresql://postgres.[ref]:[password]@...');
    console.error('');
    console.error('방법 2: Supabase Dashboard SQL Editor에서 직접 실행');
    console.error('  supabase/migrations/004_broker_offices.sql 내용을 복사하여 실행');
    process.exit(1);
  }

  try {
    const { default: pg } = await import('pg');
    const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

    await client.connect();
    console.log('Supabase DB 연결 성공');

    // 마이그레이션 SQL 읽기
    const sqlPath = join(__dirname, '..', 'supabase', 'migrations', '004_broker_offices.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('마이그레이션 실행 중...');
    await client.query(sql);
    console.log('broker_offices 테이블 생성 완료!');

    // 확인
    const result = await client.query("SELECT count(*) FROM broker_offices");
    console.log('현재 레코드 수:', result.rows[0].count);

    await client.end();
    console.log('완료!');
  } catch (error) {
    console.error('마이그레이션 실패:', error.message);
    process.exit(1);
  }
}

applyMigration();
