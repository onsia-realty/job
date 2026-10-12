/**
 * Supabase 마이그레이션 순차 적용기 (범용)
 *
 * 기존 `apply-migration.mjs` 는 004 파일명이 하드코딩돼 있어 재사용이 안 된다.
 * 이 스크립트는 파일명을 인자로 받아 순서대로 적용하고, 각 파일을 트랜잭션으로 감싼다.
 *
 * 사전 준비 (한 번만):
 *   1) npm install pg
 *   2) Supabase Dashboard > Project Settings > Database > Connection string > URI 복사
 *      .env.local 에 추가:
 *      DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
 *      ⚠️ DDL 이므로 6543(트랜잭션 풀러)이 아니라 5432(세션 모드/direct)를 써야 한다.
 *
 * 사용법:
 *   node scripts/apply-migrations.mjs                    # 기본: stay 4종(035~038)
 *   node scripts/apply-migrations.mjs 039_foo.sql        # 특정 파일만
 *   node scripts/apply-migrations.mjs --dry              # 실행 없이 대상만 출력
 *
 * ⚠️ CREATE POLICY 에는 IF NOT EXISTS 가 없다. 이미 적용된 파일을 다시 돌리면 실패한다.
 *    그래서 파일 단위 트랜잭션으로 감싼다 — 중간 실패 시 그 파일은 통째로 롤백된다.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations');

/** 인자가 없을 때의 기본 대상 — /stay 도메인 4종. 순서 의존이 있어 배열 순서가 곧 적용 순서다. */
const DEFAULT_FILES = [
  '035_stays.sql',
  '036_stay_owner_leads.sql',
  '037_stays_rpc_storage.sql',
  '038_stays_status_agent_lead_detail.sql',
];

/** 적용 후 눈으로 확인할 것들. 실패해도 마이그레이션 자체는 이미 커밋된 상태다. */
const VERIFY = [
  {
    label: 'stays 038 컬럼 9개',
    sql: `SELECT column_name, is_nullable, column_default
            FROM information_schema.columns
           WHERE table_schema='public' AND table_name='stays'
             AND column_name IN ('status','agent_office_name','agent_office_address','agent_phone',
                                 'agent_reg_no','agent_representative','is_exclusive',
                                 'broker_office_id','agent_snapshot_at')
           ORDER BY ordinal_position`,
    expect: '9행. status/is_exclusive 는 is_nullable=NO + default 있어야 함',
  },
  {
    label: 'stay_owner_leads detail 2개',
    sql: `SELECT column_name, data_type FROM information_schema.columns
           WHERE table_schema='public' AND table_name='stay_owner_leads'
             AND column_name IN ('detail','detail_version')`,
    expect: '2행 (jsonb, smallint)',
  },
  {
    label: 'CHECK / FK 제약',
    sql: `SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint
           WHERE conrelid='stays'::regclass AND contype IN ('c','f') ORDER BY conname`,
    expect: 'stays_fee_required + status CHECK + stays_broker_office_id_fkey',
  },
  {
    label: 'RLS 정책',
    sql: `SELECT tablename, policyname, cmd FROM pg_policies
           WHERE tablename IN ('stays','stay_owner_leads') ORDER BY tablename, policyname`,
    expect: 'stays 5건, stay_owner_leads 0건(의도된 설계 — service_role 전용)',
  },
  {
    label: 'stays 인덱스',
    sql: `SELECT indexname FROM pg_indexes WHERE tablename='stays' ORDER BY indexname`,
    expect: '035 의 7개. 038 은 인덱스를 추가하지 않는다',
  },
];

function resolveDbUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL.trim();
  try {
    const env = readFileSync(join(ROOT, '.env.local'), 'utf-8');
    // 값에 특수문자(@ : / #)가 들어가므로 첫 '=' 뒤 전체를 취한다
    for (const line of env.split(/\r?\n/)) {
      if (line.startsWith('DATABASE_URL=')) return line.slice('DATABASE_URL='.length).trim();
    }
  } catch {
    /* .env.local 부재 */
  }
  return null;
}

/** 로그에 비밀번호가 찍히지 않게 마스킹 */
function maskUrl(url) {
  return url.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const files = args.filter((a) => !a.startsWith('--'));
  const targets = files.length > 0 ? files : DEFAULT_FILES;

  console.log('적용 대상 (이 순서대로):');
  targets.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  console.log('');

  if (dry) {
    console.log('--dry 모드. 실행하지 않고 종료합니다.');
    return;
  }

  const dbUrl = resolveDbUrl();
  if (!dbUrl) {
    console.error('DATABASE_URL 이 없습니다.');
    console.error('');
    console.error('  Supabase Dashboard > Project Settings > Database > Connection string > URI');
    console.error('  를 복사해 .env.local 에 아래 형태로 추가하세요:');
    console.error('');
    console.error('  DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres');
    console.error('');
    console.error('  ⚠️ DDL 이라 포트는 5432(세션 모드)여야 합니다. 6543(트랜잭션 풀러)은 실패합니다.');
    process.exit(1);
  }

  let pg;
  try {
    ({ default: pg } = await import('pg'));
  } catch {
    console.error("'pg' 패키지가 없습니다. 먼저 실행하세요:  npm install pg");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log(`연결됨: ${maskUrl(dbUrl)}\n`);

  try {
    for (const file of targets) {
      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
      process.stdout.write(`[${file}] 적용 중... `);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        console.log('OK');
      } catch (err) {
        await client.query('ROLLBACK');
        console.log('실패 (이 파일은 롤백됨)');
        console.error(`\n  ${err.message}`);
        if (/already exists/i.test(err.message)) {
          console.error('  → 이미 적용된 파일로 보입니다. 남은 파일만 인자로 지정해 다시 실행하세요.');
        }
        console.error('\n중단합니다. 앞서 성공한 파일들은 이미 커밋되었습니다.');
        process.exit(1);
      }
    }

    console.log('\n===== 검증 =====');
    for (const v of VERIFY) {
      const { rows } = await client.query(v.sql);
      console.log(`\n[${v.label}] ${rows.length}행  (기대: ${v.expect})`);
      console.table(rows);
    }
    console.log('\n완료. PostgREST 스키마 캐시는 자동 리로드됩니다(수 초 소요).');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
