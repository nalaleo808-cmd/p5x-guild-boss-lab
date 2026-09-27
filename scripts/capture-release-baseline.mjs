// Captures route fingerprints from the CURRENT engine into tests/fixtures/release-baseline.json.
// Run it only on an engine whose behaviour you want to freeze (for example before
// integrating a new character), then keep tests/release-regression.test.mjs green.
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { BattleEngine } from '../src/engine.js';
import { runBaselineRoute, signature } from '../tests/helpers/regression.js';

const STEPS = 16;
const configs = [];
for (const mechanicsProfile of ['live-2026-09-04', 'recorded-2026-08-29'])
  for (const bossId of ['slaughter_drive', 'vishnu', 'hachiman', 'surt'])
    for (const seed of [17, 808, 2026]) configs.push({ bossId, seed, mechanicsProfile, modeId: 'nexus' });
for (const modeId of ['multidimensional', 'devourer'])
  for (const bossId of ['hachiman', 'surt']) configs.push({ bossId, seed: 17, mechanicsProfile: 'live-2026-09-04', modeId });

const cases = [], skipped = [];
for (const config of configs) {
  try {
    const full = signature(runBaselineRoute(BattleEngine, config, STEPS));
    const fast = signature(runBaselineRoute(BattleEngine, { ...config, fastMode: true }, STEPS));
    if (full !== fast) throw new Error('full/fast signatures differ');
    cases.push({ config, steps: STEPS, expectedSHA256: full });
  } catch (error) {
    skipped.push({ config, reason: error.message });
  }
}
const hash = async path => createHash('sha256').update(await readFile(new URL(`../${path}`, import.meta.url))).digest('hex');
const baseline = {
  note: 'Captured from the unmodified local 2.2.0 engine before the Kotone port. Default team, recommended actions. Not a Kotone battle validation.',
  engineSHA256: await hash('src/engine.js'),
  catalogSHA256: await hash('src/generated/lufel-catalog.js'),
  cases, skipped
};
await mkdir(new URL('../tests/fixtures/', import.meta.url), { recursive: true });
await writeFile(new URL('../tests/fixtures/release-baseline.json', import.meta.url), JSON.stringify(baseline, null, 2) + '\n');
console.log(`Captured ${cases.length} route fingerprints; skipped ${skipped.length}.`);
for (const item of skipped) console.log('skipped', JSON.stringify(item.config), item.reason);
