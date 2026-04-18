// Dodaje PLANET_API_KEY do Vercel production. Nigdy nie loguje wartości.
// Uruchomienie: node scripts/set-planet-key.mjs <PLAK...>
import { spawnSync } from 'node:child_process';

const key = process.argv[2];
if (!key || !key.startsWith('PLAK')) {
  console.error('Usage: node scripts/set-planet-key.mjs <PLAK...>');
  console.error('Key must start with "PLAK".');
  process.exit(1);
}

const trimmed = key.trim(); // defensive — to też nie może mieć whitespace
console.log('Adding PLANET_API_KEY (length:', trimmed.length + ') to production...');

// rm old (jeśli jest)
spawnSync('npx', ['vercel', 'env', 'rm', 'PLANET_API_KEY', 'production', '--yes'], {
  stdio: 'inherit',
  shell: true,
});

// add fresh bez \n
const add = spawnSync('npx', ['vercel', 'env', 'add', 'PLANET_API_KEY', 'production'], {
  input: trimmed,
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true,
});

if (add.status !== 0) {
  console.error('Failed:', add.status);
  process.exit(add.status ?? 1);
}

console.log('\n✓ PLANET_API_KEY added. Also adding to preview + development for local dev...');
for (const env of ['preview', 'development']) {
  spawnSync('npx', ['vercel', 'env', 'rm', 'PLANET_API_KEY', env, '--yes'], {
    stdio: 'inherit',
    shell: true,
  });
  spawnSync('npx', ['vercel', 'env', 'add', 'PLANET_API_KEY', env], {
    input: trimmed,
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
  });
}

console.log('\n✓ PLANET_API_KEY set in production/preview/development. Redeploy to activate.');
