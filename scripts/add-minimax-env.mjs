// Wgrywa MINIMAX_API_KEY z lokalnego .env do Vercel (production).
// Wzorzec jak fix-cron-secret.mjs: wartość przez stdin BEZ trailing newline
// (trailing whitespace w env Vercela psuł nam kiedyś deploye przez 75 dni).
// Uruchomienie: node scripts/add-minimax-env.mjs

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const env = readFileSync('.env', 'utf8');
const m = env.match(/^MINIMAX_API_KEY="?([^"\r\n]+)"?/m);
if (!m || !m[1]) {
  console.error('Brak MINIMAX_API_KEY w .env — dodaj linię MINIMAX_API_KEY="sk-cp-..." i uruchom ponownie.');
  process.exit(1);
}
const value = m[1].trim();
console.log(`Znaleziono klucz (długość ${value.length}). Wgrywam do Vercel production…`);

// Usuń starą wartość (non-fatal jeśli nie istnieje), dodaj świeżą bez \n.
spawnSync('npx', ['vercel', 'env', 'rm', 'MINIMAX_API_KEY', 'production', '--yes'], {
  stdio: 'inherit',
  shell: true,
});
const add = spawnSync('npx', ['vercel', 'env', 'add', 'MINIMAX_API_KEY', 'production'], {
  input: value, // KLUCZOWE: bez trailing newline
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true,
});
process.exit(add.status ?? 1);
