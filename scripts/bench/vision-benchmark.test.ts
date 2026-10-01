// @vitest-environment node
import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
const UA = { 'User-Agent': 'AgriClawBenchmark/1.0 (contact@infinityteam.io)' };
const SET: Array<{ id: string; url: string; ok: RegExp }> = [
  { id: 'rdza_brunatna', url: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Wheat_leaf_rust_on_wheat.jpg', ok: /rdz[ay]\s*(brunatn|liści)|puccinia (triticina|recondita)|leaf rust/i },
  { id: 'rdza_brunatna_2', url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/54/Bruine_roest_op_tarwe_%28Puccinia_recondita_f.sp._tritici_on_Triticum_aestivum%29.jpg/960px-Bruine_roest_op_tarwe_%28Puccinia_recondita_f.sp._tritici_on_Triticum_aestivum%29.jpg', ok: /rdz[ay]\s*(brunatn|liści)|puccinia (triticina|recondita)|leaf rust/i },
  { id: 'rdza_zolta', url: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Stripe_rust_on_wheat.jpg', ok: /rdz[ay]\s*żółt|striiformis|stripe rust|yellow rust/i },
  { id: 'maczniak', url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/83/Erysiphe_graminis.jpg/960px-Erysiphe_graminis.jpg', ok: /mączni|blumeria|erysiphe|powdery/i },
  { id: 'zaraza_ziemniaka', url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/1/14/Phytophthora_infestans_on_potato_leaf.jpg/960px-Phytophthora_infestans_on_potato_leaf.jpg', ok: /zaraz|phytophthora|late blight/i },
  { id: 'zaraza_ziemniaka_2', url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/aa/Late_blight_on_potato_leaf_2.jpg/960px-Late_blight_on_potato_leaf_2.jpg', ok: /zaraz|phytophthora|late blight/i },
  { id: 'fuzarioza', url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/83/CSIRO_ScienceImage_11243_Fusarium_head_blight_of_barley.jpg/960px-CSIRO_ScienceImage_11243_Fusarium_head_blight_of_barley.jpg', ok: /fuzarioz|fusarium|head blight/i },
  { id: 'stonka', url: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c2/Colorado_potato_beetle_larvae.jpg/960px-Colorado_potato_beetle_larvae.jpg', ok: /stonk|leptinotarsa|colorado/i },
];
const MODELS = ['google/gemma-4-31b-it', 'google/gemini-3.8-flash', 'google/gemini-3.5-flash-lite', 'qwen/qwen3.8-flash', 'qwen/qwen3.8-27b', 'openai/gpt-5.6-luna', 'openai/gpt-5.6-terra', 'anthropic/claude-sonnet-5.5', 'x-ai/grok-4.7'];
const PROMPT = 'Jesteś agronomem. Na zdjęciu jest roślina uprawna lub szkodnik. Rozpoznaj uprawę i najbardziej prawdopodobną chorobę/szkodnika. Odpowiedz WYŁĄCZNIE JSON: {"uprawa":"...","diagnoza":"nazwa polska (nazwa łacińska)","pewnosc":"wysoka|średnia|niska"}';
it('bench', async () => {
  process.loadEnvFile?.('.env');
  const imgs: Record<string, string> = {};
  for (const s of SET) { const r = await fetch(s.url, { headers: UA }); const b = Buffer.from(await r.arrayBuffer()); imgs[s.id] = `data:image/jpeg;base64,${b.toString('base64')}`; }
  const rows: any[] = [];
  await Promise.all(MODELS.map(async (model) => {
    for (const s of SET) {
      const t0 = Date.now();
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, max_tokens: 1500, temperature: 0.1, messages: [{ role: 'user', content: [{ type: 'text', text: PROMPT }, { type: 'image_url', image_url: { url: imgs[s.id] } }] }] }) });
        const j: any = await res.json();
        const txt = String(j.choices?.[0]?.message?.content ?? j.error?.message ?? '');
        rows.push({ model, id: s.id, ok: s.ok.test(txt), ms: Date.now() - t0, cost: j.usage?.cost ?? null, txt: txt.replace(/\s+/g, ' ').slice(0, 140) });
      } catch (e) { rows.push({ model, id: s.id, ok: false, ms: Date.now() - t0, txt: 'EXC ' + String(e).slice(0, 80) }); }
    }
  }));
  writeFileSync('scripts/bench/vision-benchmark-wyniki.json', JSON.stringify(rows, null, 1));
  const by: Record<string, any> = {};
  for (const r of rows) { const b = (by[r.model] ??= { ok: 0, n: 0, ms: 0, cost: 0 }); b.n++; b.ok += r.ok ? 1 : 0; b.ms += r.ms; b.cost += r.cost ?? 0; }
  for (const [m, b] of Object.entries(by).sort((a: any, c: any) => c[1].ok - a[1].ok)) console.log(`SCORE ${m} ${b.ok}/${b.n} avg ${Math.round(b.ms / b.n)}ms koszt/8 zdjęć $${b.cost.toFixed(4)}`);
}, 900000);
