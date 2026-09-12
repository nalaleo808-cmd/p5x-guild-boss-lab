// Plays Sleepy's DOD Hachiman rotation through the shared engine under the
// user-supplied DOD rules and reports points per turn. Stops at the first
// illegal action and reports the legal alternatives.
// Usage: node scripts/run-hachiman-dod.mjs [--seed=8] [--strict] [--route=joker-best]
//   --route=joker-best plays the searched route for Joker's build (Joker's Berry and Persona slots).
import { writeFileSync } from 'node:fs';
import { HachimanRecordedEngine, legalActionDigest, performRouteAction, performSongCycle } from '../src/hachiman-recorded-team.js';
import { SLEEPY_ASSUMPTIONS, SLEEPY_DOD_RECORDED_SCORE, SLEEPY_DOD_ROUTE, SLEEPY_DOD_TURNS, createHachimanDodConfig } from '../src/hachiman-dod-route.js';
import { JOKER_DOD_BEST_DECISIONS, buildRoute } from './optimize-hachiman-dod.mjs';

const argv = process.argv.slice(2);
const seedArgument = argv.find(value => value.startsWith('--seed='));
const seed = seedArgument ? Number(seedArgument.slice('--seed='.length)) : 8;
const strict = argv.includes('--strict');
const routeName = argv.find(value => value.startsWith('--route='))?.slice('--route='.length) || 'sleepy';
const jokerBest = routeName === 'joker-best';
const ROUTE = jokerBest ? buildRoute(JOKER_DOD_BEST_DECISIONS, 'joker') : SLEEPY_DOD_ROUTE;
const TURNS = Object.keys(ROUTE);

const { config } = createHachimanDodConfig(seed, jokerBest ? { berryPanel: 'joker', personaOwner: 'joker' } : {});
const engine = new HachimanRecordedEngine(config);
const turns = [];
let failure = null;
let skipped = [];

outer: for (const turn of TURNS) {
  const before = { points: engine.state.scoreBreakdown.points || 0, damage: engine.state.totalDamage, highlight: engine.getHighlightState().current };
  const actions = [];
  for (const [label, spec] of ROUTE[turn]) {
    const pointsBefore = engine.state.scoreBreakdown.points || 0;
    try {
      if (spec.kind === 'songCycle' || spec.kind === 'setSong') performSongCycle(engine, label, spec);
      else performRouteAction(engine, label, spec);
    } catch (error) {
      if (spec.optional && !strict) { skipped.push(label); continue; }
      failure = { turn, label, reason: error.message, digest: error.actionDigest || legalActionDigest(engine) };
      break outer;
    }
    const gained = (engine.state.scoreBreakdown.points || 0) - pointsBefore;
    if (gained) actions.push({ label, points: Math.round(gained) });
  }
  turns.push({
    turn, points: Math.round((engine.state.scoreBreakdown.points || 0) - before.points), cumulative: Math.round(engine.state.scoreBreakdown.points || 0),
    bossHp: engine.state.boss.hp, shield: engine.state.boss.downPoints, lock: engine.state.boss.lifeSustainment, weakened: engine.state.boss.weakenedActive === true,
    highlight: engine.getHighlightState().current, phase: engine.state.phase, actions
  });
  if (engine.state.phase !== 'battle') break;
}

const breakdown = engine.state.scoreBreakdown;
const report = {
  generatedAt: new Date().toISOString(), seed, rules: engine.state.boss.dodRules, assumptions: SLEEPY_ASSUMPTIONS,
  recordedScore: SLEEPY_DOD_RECORDED_SCORE, points: Math.round(breakdown.points || 0),
  preBreakDamage: Math.round(breakdown.preBreakDamage || 0), breakDamage: Math.round(breakdown.breakDamage || 0),
  projectedScore: Math.round(((breakdown.points || 0) + 125000) * 8), recordedBreakdown: { baseDamagePoints: 405499, weakenedDamagePoints: 1195200896, bossAttackPoints: 125000, difficultyBonus: 8 }, phase: engine.state.phase, outcome: engine.state.result?.outcome || null,
  forcedGauge: engine.runnerForcedGauge || [], skippedOptional: skipped, failure, turns
};
writeFileSync(jokerBest ? 'outputs/hachiman-dod-joker-best.json' : 'outputs/hachiman-dod-sleepy-2026-09-09.json', JSON.stringify(report, null, 2));
const money = value => Number(value).toLocaleString();
console.log(`DOD Hachiman, ${jokerBest ? 'Joker best route' : 'Sleepy route'}, seed ${seed}. Phase: ${report.phase}${report.outcome ? ` (${report.outcome})` : ''}`);
console.log('turn | points this turn | cumulative | boss HP | shield | lock | break | HL%');
for (const row of turns) console.log(`${row.turn.padEnd(4)} | ${money(row.points).padStart(14)} | ${money(row.cumulative).padStart(14)} | ${money(row.bossHp).padStart(8)} | ${row.shield} | ${row.lock ? 'on' : 'off'} | ${row.weakened ? 'yes' : 'no'} | ${row.highlight}`);
console.log(`\nPre-break damage ${money(report.preBreakDamage)} (cap ${money(engine.state.boss.maxHp)}), break damage ${money(report.breakDamage)} x3, points ${money(report.points)}.`);
console.log(`Projected score (points + 125,000) x 8: ${money(report.projectedScore)} vs Sleepy's recorded ${money(SLEEPY_DOD_RECORDED_SCORE)} (${(report.projectedScore / SLEEPY_DOD_RECORDED_SCORE).toFixed(3)}x).`);
console.log(`Recorded breakdown: base ${money(405499)} (sim ${money(report.preBreakDamage)}), weakened ${money(1195200896)} = 3 x ${money(398400299)} raw (sim 3 x ${money(report.breakDamage)} = ${money(report.breakDamage * 3)}), boss attack 125,000, x8.`);
if (skipped.length) console.log('Skipped optional actions:', skipped.join('; '));
if (report.forcedGauge.length) console.log('Highlight gauge topped up by the runner:', report.forcedGauge.map(f => `${f.label} (+${f.shortfall.toFixed(0)})`).join('; '));
if (failure) {
  console.log(`\nROUTE BLOCKED at ${failure.turn} ${failure.label}: ${failure.reason}`);
  console.log('Legal actions:', JSON.stringify(failure.digest.actions.filter(a => a.enabled).map(a => a.name)), '| highlights:', JSON.stringify(failure.digest.highlights.filter(h => h.enabled).map(h => h.name)), '| navigator:', JSON.stringify(failure.digest.navigator.filter(n => n.enabled).map(n => n.name)), '| medicines:', JSON.stringify(failure.digest.medicines.filter(m => m.enabled).map(m => m.id)), '| concert:', failure.digest.concertActive);
  process.exitCode = 2;
}
