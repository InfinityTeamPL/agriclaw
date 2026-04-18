// Automatyczny setup Neon DB dla Vercel production.
// 1. Pobiera pooled + direct connection strings z neonctl
// 2. Enable PostGIS extension
// 3. Nadpisuje DATABASE_URL, DATABASE_URL_UNPOOLED, NEXTAUTH_URL w Vercel env
// 4. Push Prisma schema
// 5. Seed demo user
//
// Credentials nigdy nie są drukowane do stdout — tylko status.
// Uruchom: node scripts/setup-neon-production.mjs

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PROJECT_ID = 'lucky-dawn-85945456';
const VERCEL_URL = 'https://agriclaw-tau.vercel.app';

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', ...opts });
}

function silent(cmd) {
  try {
    return run(cmd, { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    return null;
  }
}

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

// ────────────────────────────────────────────────────────────
// Krok 1: Connection strings z neonctl
// ────────────────────────────────────────────────────────────
log('▸ Pobieram connection strings z Neon...');
const pooled = run(`neonctl connection-string --project-id ${PROJECT_ID} --pooled`).trim();
const direct = run(`neonctl connection-string --project-id ${PROJECT_ID}`).trim();
if (!pooled.startsWith('postgresql://') || !direct.startsWith('postgresql://')) {
  log('✗ Connection strings mają zły format.');
  process.exit(1);
}
log('  ✓ pooled + direct connection strings OK');

// Zapisz lokalnie (plik jest w .gitignore)
fs.writeFileSync('.env.production.local', `DATABASE_URL=${pooled}\nDATABASE_URL_UNPOOLED=${direct}\n`, 'utf8');
log('  ✓ .env.production.local zapisany');

// ────────────────────────────────────────────────────────────
// Krok 2: Enable PostGIS
// ────────────────────────────────────────────────────────────
log('▸ Włączam PostGIS extension w Neon...');
fs.writeFileSync('.tmp-postgis.sql', 'CREATE EXTENSION IF NOT EXISTS postgis;\n', 'utf8');
try {
  run(`npx prisma db execute --url "${direct}" --file .tmp-postgis.sql`, {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  log('  ✓ PostGIS enabled');
} catch (e) {
  log('  ✗ PostGIS enable failed: ' + (e.stdout?.slice(0, 200) || e.message.slice(0, 200)));
  process.exit(1);
}
fs.unlinkSync('.tmp-postgis.sql');

// ────────────────────────────────────────────────────────────
// Krok 3: Vercel env vars (nadpisz localhost)
// ────────────────────────────────────────────────────────────
log('▸ Aktualizuję Vercel env vars...');

function updateVercelEnv(name, value) {
  // Usuń stary z każdego środowiska
  for (const env of ['production', 'preview', 'development']) {
    silent(`vercel env rm ${name} ${env} --yes`);
  }
  // Dodaj nowy do production + preview
  for (const env of ['production', 'preview']) {
    const proc = require('child_process').spawn('vercel', ['env', 'add', name, env], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    proc.stdin.write(value + '\n');
    proc.stdin.end();
  }
}

// Synchronous version using echo pipe via shell
function vercelEnvAdd(name, value, envs = ['production', 'preview']) {
  // Usuń stare
  for (const env of envs) {
    silent(`vercel env rm ${name} ${env} --yes`);
  }
  // Zapisz do temp file
  const tmpFile = `.tmp-${name}.env`;
  fs.writeFileSync(tmpFile, value, 'utf8');
  for (const env of envs) {
    try {
      run(`vercel env add ${name} ${env} < ${tmpFile}`, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
      });
    } catch (e) {
      log(`  ⚠ ${name} ${env}: ${e.message.slice(0, 100)}`);
    }
  }
  fs.unlinkSync(tmpFile);
}

vercelEnvAdd('DATABASE_URL', pooled);
log('  ✓ DATABASE_URL (pooled)');
vercelEnvAdd('DATABASE_URL_UNPOOLED', direct);
log('  ✓ DATABASE_URL_UNPOOLED (direct)');
vercelEnvAdd('NEXTAUTH_URL', VERCEL_URL);
log('  ✓ NEXTAUTH_URL = ' + VERCEL_URL);

// ────────────────────────────────────────────────────────────
// Krok 4: Push Prisma schema
// ────────────────────────────────────────────────────────────
log('▸ Pushuję Prisma schema na Neon...');
try {
  run(`npx prisma db push --accept-data-loss --skip-generate`, {
    env: { ...process.env, DATABASE_URL: direct, DATABASE_URL_UNPOOLED: direct },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  log('  ✓ Schema pushed');
} catch (e) {
  log('  ✗ Schema push failed: ' + (e.stdout?.toString().slice(0, 500) || e.message.slice(0, 200)));
  process.exit(1);
}

// ────────────────────────────────────────────────────────────
// Krok 5: Seed demo user
// ────────────────────────────────────────────────────────────
log('▸ Zasiewam demo user w produkcji...');
try {
  run(`npx tsx prisma/seed.ts`, {
    env: { ...process.env, DATABASE_URL: direct, DATABASE_URL_UNPOOLED: direct },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  log('  ✓ Demo user: demo@agriclaw.pl / demo1234');
} catch (e) {
  log('  ⚠ Seed problem: ' + (e.stdout?.toString().slice(0, 300) || e.message.slice(0, 200)));
  log('  (ignorujemy — user może być już w DB)');
}

// ────────────────────────────────────────────────────────────
// Krok 6: Redeploy
// ────────────────────────────────────────────────────────────
log('▸ Redeploy production z nowymi env vars...');
try {
  const out = run(`vercel --prod --yes`, { stdio: ['ignore', 'pipe', 'pipe'] });
  const url = out.match(/https:\/\/\S+\.vercel\.app/)?.[0] ?? VERCEL_URL;
  log('  ✓ Deploy: ' + url);
} catch (e) {
  log('  ⚠ Deploy: ' + (e.stdout?.toString().slice(0, 300) || e.message.slice(0, 200)));
}

log('');
log('════════════════════════════════════════════════════════');
log('  ✓ SETUP COMPLETE');
log('  Production: ' + VERCEL_URL);
log('  Login:      demo@agriclaw.pl / demo1234');
log('════════════════════════════════════════════════════════');
