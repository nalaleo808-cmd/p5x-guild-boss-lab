// Replays the route Joker's DOD attempt actually followed on 2026-09-10 (driven
// through computer use) with Joker's Berry and Persona slots, and compares the
// model's per-round points with the live HUD checkpoints.
// Usage: node scripts/replay-hachiman-dod-live.mjs [--seeds=12]
import { readFileSync, writeFileSync } from 'node:fs';
import { HachimanRecordedEngine, performRouteAction, performSongCycle } from '../src/hachiman-recorded-team.js';
import { createHachimanDodConfig } from '../src/hachiman-dod-route.js';
import { buildRoute } from './optimize-hachiman-dod.mjs';

const live = JSON.parse(readFileSync('data/hachiman-dod-live-run-2026-09-10.json', 'utf8'));
const seedsArgument = process.argv.find(value => value.startsWith('--seeds='));
const seeds = Array.from({ length: Number(seedsArgument?.slice('--seeds='.length) || 12) }, (_, index) => index + 1);

// Deviations from Sleepy's route as played: Tarukaja instead of Matarukaja at
// B2 (Joker's Janosik has none), HL-Up as the only B2 medicine, no B4 Fighter
// Salve (one owned, used at B1), no A6 press at B3 (button not available).
// Pre-break heals in place of guards and DOT-Ups change nothing the score can
// see, because the boss sits at the lock floor from T2.
const DECISIONS = { wonderB2: 'tarukaja', medicineB2: 'highlight_up', medicineB4: 'none' };

function play(seed) {
  const route = buildRoute(DECISIONS, 'joker');
  const { config } = createHachimanDodConfig(seed, { berryPanel: 'joker', personaOwner: 'joker' });
  config.fastMode = true;
  const engine = new HachimanRecordedEngine(config);
  const rounds = {};
  const actions = {};
  for (const turn of Object.keys(route)) {
    const before = engine.state.scoreBreakdown.points || 0;
    for (const [label, spec] of route[turn]) {
      const pointsBefore = engine.state.scoreBreakdown.points || 0;
      try {
        if (spec.kind === 'songCycle' || spec.kind === 'setSong') performSongCycle(engine, label, spec);
        else performRouteAction(engine, label, spec);
      } catch (error) {
        if (spec.optional) continue;
        throw new Error(`${label}: ${error.message}`);
      }
      const gained = (engine.state.scoreBreakdown.points || 0) - pointsBefore;
      if (gained) actions[label] = (actions[label] || 0) + gained / seeds.length;
    }
    rounds[turn] = (engine.state.scoreBreakdown.points || 0) - before;
    if (engine.state.phase !== 'battle') break;
  }
  return { rounds, points: engine.state.scoreBreakdown.points || 0, actions };
}

const runs = seeds.map(play);
const mean = key => runs.reduce((sum, run) => sum + (run.rounds[key] || 0), 0) / runs.length;
const points = runs.reduce((sum, run) => sum + run.points, 0) / runs.length;
const actionMeans = {};
for (const run of runs) for (const [label, value] of Object.entries(run.actions)) actionMeans[label] = (actionMeans[label] || 0) + value;

const cp = Object.fromEntries(live.scoreCheckpoints.map(row => [row.point, row.score]));
const liveRounds = {
  'T18 (break-opening action)': cp['B1 start (after break-opening S3)'] - cp['T3 to T18 pre-break (locked)'],
  B1: cp['B1 after Berry S3 (end of B1)'] - cp['B1 start (after break-opening S3)'],
  B2: cp['B2 after Alt S3 and Neverending Song echo (Concert end)'] - cp['B1 after Berry S3 (end of B1)'],
  B3: cp['B3 end (after Berry S3)'] - cp['B2 after Alt S3 and Neverending Song echo (Concert end)'],
  B4: cp['final points (result screen)'] - cp['B3 end (after Berry S3)']
};
const simRounds = { 'T18 (break-opening action)': mean('T18'), B1: mean('B1'), B2: mean('B2'), B3: mean('B3'), B4: mean('B4') };
const money = value => Math.round(value).toLocaleString();
console.log(`Joker's live DOD route replayed on the current model, mean over ${seeds.length} seeds (Joker's Berry, Joker's Persona slots).`);
console.log('round | live points | model points | ratio');
for (const key of Object.keys(liveRounds)) console.log(`${key.padEnd(28)} | ${money(liveRounds[key]).padStart(14)} | ${money(simRounds[key]).padStart(14)} | ${(simRounds[key] / liveRounds[key]).toFixed(2)}`);
const preBreak = cp['T3 to T18 pre-break (locked)'];
const livePoints = cp['final points (result screen)'];
console.log(`${'pre-break (locked)'.padEnd(28)} | ${money(preBreak).padStart(14)} | ${money(points - Object.values(simRounds).reduce((a, b) => a + b, 0)).padStart(14)} |`);
console.log(`${'total points'.padEnd(28)} | ${money(livePoints).padStart(14)} | ${money(points).padStart(14)} | ${(points / livePoints).toFixed(2)}`);
console.log(`Projected final: model ${money((points + 125000) * 8)} vs live ${money(live.result.finalScore)}.`);

const liveActions = {
  'B1 Twins S1 F/I boss (A6 nuke)': cp['B1 after twins S1 + enhanced Two Masks'] - cp['B1 start (after break-opening S3)'],
  'B1 Berry S3 boss': cp['B1 after Berry S3 (end of B1)'] - cp['B1 after twins S1 + enhanced Two Masks'],
  'B2 Twins S2 P/N boss': cp['B2 after twins S2'] - cp['B1 after Berry S3 (end of B1)'],
  'B2 Marian S1 Beach Basket': cp['B2 after Marian Beach Basket'] - cp['B2 after twins S2'],
  'B2 Berry Highlight boss': cp['B2 after Berry Highlight'] - cp['B2 after Marian Beach Basket'],
  'B2 Berry free Highlight boss': cp['B2 after Berry free Highlight'] - cp['B2 after Berry Highlight'],
  'B2 Berry Alt S3 boss': cp['B2 after Alt S3 and Neverending Song echo (Concert end)'] - cp['B2 after Berry free Highlight'],
  'B3 Twins S1 F/I boss': cp['B3 after twins S1 + Two Masks'] - cp['B2 after Alt S3 and Neverending Song echo (Concert end)'],
  'B3 Berry S3 boss': cp['B3 end (after Berry S3)'] - cp['B3 after twins S1 + Two Masks'],
  'B4 Twins S2 P/N boss': cp['B4 after twins S2'] - cp['B4 after twins Absurdity Highlight'],
  'B4 Berry S3 boss': cp['final points (result screen)'] - cp['B4 after twins S2']
};
console.log('\naction | live | model | ratio');
for (const [label, value] of Object.entries(liveActions)) {
  const sim = actionMeans[label];
  console.log(`${label.padEnd(32)} | ${money(value).padStart(13)} | ${sim == null ? 'n/a'.padStart(13) : money(sim).padStart(13)} | ${sim == null ? '' : (sim / value).toFixed(2)}`);
}
writeFileSync('outputs/hachiman-dod-live-replay-2026-09-10.json', JSON.stringify({ generatedAt: new Date().toISOString(), seeds, decisions: DECISIONS, liveRounds, simRounds, liveActions, simActions: actionMeans, points, livePoints }, null, 2));
