// Generuje świeży CRON_SECRET (64-char hex, bez whitespace) i wgrywa do Vercel Production.
// Nigdy nie wypisuje wartości do stdout. Rozwiązuje błąd:
//   "CRON_SECRET environment variable contains leading or trailing whitespace"
// (ktoś wkleił wartość z \n lub spacją — vercel CLI tego nie trimuje).

import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const secret = randomBytes(32).toString('hex'); // 64 hex chars, deterministycznie bez whitespace

console.log('Generated fresh CRON_SECRET (length:', secret.length + ')');

// 1. Remove old
console.log('\n→ Removing old CRON_SECRET from production...');
const rm = spawnSync('npx', ['vercel', 'env', 'rm', 'CRON_SECRET', 'production', '--yes'], {
  stdio: 'inherit',
  shell: true,
});
if (rm.status !== 0 && rm.status !== null) {
  console.error('\n[non-fatal] rm returned', rm.status, '— continuing anyway');
}

// 2. Add fresh (stdin bez \n!)
console.log('\n→ Adding fresh CRON_SECRET to production...');
const add = spawnSync('npx', ['vercel', 'env', 'add', 'CRON_SECRET', 'production'], {
  input: secret, // KLUCZOWE: bez trailing newline
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true,
});
if (add.status !== 0) {
  console.error('\n[FAIL] vercel env add returned', add.status);
  process.exit(add.status ?? 1);
}

console.log('\n✓ CRON_SECRET refreshed. Next Vercel deploy will use the clean value.');
console.log('  Trigger redeploy: npx vercel deploy --prod');
