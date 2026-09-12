// Rotation search for the recorded Hachiman team on the current engine model.
// The recorded T1 to T8 route is the baseline; each decision point below is
// replaced by its legal alternatives and every candidate is played through the
// same HachimanRecordedEngine. Candidates that hit an illegal action are
// discarded. Output: a single-change sensitivity table, a coordinate-descent
// best route, and the top candidates, written to outputs/.
import { writeFileSync } from 'node:fs';
import {
  HachimanRecordedEngine, HACHIMAN_RECORDED_SEED, createHachimanRecordedConfig,
  hachimanScoreDerivation, performRouteAction, performSongCycle
} from '../src/hachiman-recorded-team.js';

const JC = 'lufel-recent-j-c';
const MARIAN = 'lufel-recent-marian-beachflower';
const BERRY = 'lufel-recent-berry';

const DIMENSIONS = Object.freeze({
  jcOpener: ['gun_then_s1', 's1_then_gun'],
  earlyHighlights: ['berry_t2_marian_t3', 'marian_t2_berry_t3'],
  wonderT2: ['revolution', 'theoria'],
  medicineT3: ['dot_up', 'attack_tablet', 'fighter_salve', 'highlight_up'],
  medicineT4: ['fighter_salve', 'attack_tablet', 'dot_up', 'highlight_up'],
  medicineT5: ['attack_tablet', 'fighter_salve', 'dot_up', 'highlight_up'],
  medicineT6: ['dot_up', 'fighter_salve', 'attack_tablet', 'highlight_up'],
  wonderT6: ['tarukaja', 'theoria', 'venomous'],
  wonderT7: ['theoria', 'tarukaja'],
  marianT7: ['s3_on_berry', 's2'],
  wonderT8: ['venomous', 'theoria', 'tarukaja'],
  medicineT8: ['fighter_salve', 'attack_tablet', 'dot_up', 'highlight_up'],
  marianT2: ['s2', 's1'],
  jcT4: ['s1', 'gun'],
  marianT6: ['s1', 's2'],
  berryT7: ['alt_s1', 's3', 's1'],
  jcT8: ['s1', 'gun']
});
const BASELINE = Object.freeze(Object.fromEntries(Object.entries(DIMENSIONS).map(([key, values]) => [key, values[0]])));

const skill = (actor, slot, target, concert = false) => ({ expectedActorId: actor, expectedConcert: concert, type: 'skill', slot, target });
const named = (actor, name, target, concert = false) => ({ expectedActorId: actor, expectedConcert: concert, type: 'skill', name, target });
const gun = concert => ({ expectedActorId: JC, expectedConcert: concert, type: 'gun', name: 'Gun', target: 'boss' });
const navigator = (actor, name, concert = false) => ({ expectedActorId: actor, expectedConcert: concert, kind: 'navigator', name, target: 'party' });
const highlight = (turnActor, owner, target, concert = false) => ({ expectedActorId: turnActor, expectedConcert: concert, kind: 'highlight', actorId: owner, target });
const maskHighlight = (turnActor, concert = false) => ({ expectedActorId: turnActor, expectedConcert: concert, kind: 'selectedMaskHL', actorId: JC, mask: 'mischief', target: 'party' });
const medicine = (id, concert = false) => ({ expectedActorId: MARIAN, expectedConcert: concert, kind: 'medicine', id, target: 'berry' });
const songCycle = (from, to) => ({ expectedActorId: JC, expectedConcert: false, kind: 'songCycle', expectedSong: from, nextSong: to });

function wonderSequence(state, choice, concert) {
  // Emits the Persona switches needed for the chosen skill, tracking the
  // current Persona so a no-op switch is never requested.
  const steps = [];
  const goTo = name => {
    if (state.persona === name) return;
    steps.push([`Wonder switch ${state.persona} to ${name}`, { expectedActorId: 'wonder', expectedConcert: concert, kind: 'switch', type: 'switch', name, target: 'self' }]);
    state.persona = name;
  };
  if (choice === 'revolution') { goTo('Dionysus'); steps.push(['Dionysus Revolution', named('wonder', 'Revolution', 'party', concert)]); }
  else if (choice === 'theoria') { goTo('Dionysus'); steps.push(['Dionysus Universal Theoria on Berry', named('wonder', 'Universal Theoria', 'berry', concert)]); }
  else if (choice === 'tarukaja') { goTo('Janosik'); steps.push(['Janosik Tarukaja on Berry', named('wonder', 'Tarukaja', 'berry', concert)]); }
  else if (choice === 'venomous') { goTo('Vasuki'); steps.push(['Vasuki Venomous Spiral boss', named('wonder', 'Venomous Spiral', 'boss', concert)]); }
  else if (choice === 'rakunda_vasuki') { goTo('Vasuki'); steps.push(['Vasuki Rakunda boss', named('wonder', 'Rakunda', 'boss', concert)]); }
  else if (choice === 'rakunda_janosik') { goTo('Janosik'); steps.push(['Janosik Rakunda boss', named('wonder', 'Rakunda', 'boss', concert)]); }
  return steps;
}

export function buildRoute(decisions) {
  const d = { ...BASELINE, ...decisions };
  const state = { persona: 'Dionysus' };
  const jcFirst = d.jcOpener === 'gun_then_s1' ? ['Twins Gun boss', gun(false)] : ['Twins S1 boss', skill(JC, 'S1', 'boss')];
  const jcSecond = d.jcOpener === 'gun_then_s1' ? ['Twins S1 boss', skill(JC, 'S1', 'boss')] : ['Twins Gun boss', gun(false)];
  const route = {};
  route.T1 = [
    jcFirst,
    ...wonderSequence(state, 'rakunda_vasuki', false),
    ['Marian S3 on Berry', skill(MARIAN, 'S3', 'berry')],
    ['Berry S1 on first living add', skill(BERRY, 'S1', 'first_add')]
  ];
  route.T2 = [
    ['MIKU Heaven S1', navigator(JC, 'Feel the Beat')],
    d.earlyHighlights === 'berry_t2_marian_t3'
      ? ['Berry Highlight boss', highlight(JC, BERRY, 'boss')]
      : ['Marian Highlight on Berry', highlight(JC, MARIAN, 'berry')],
    jcSecond,
    // The recorded run visited Janosik before Dionysus in T2; retained.
    ...(state.persona !== 'Janosik' ? [['Wonder switch to Janosik', { expectedActorId: 'wonder', expectedConcert: false, kind: 'switch', type: 'switch', name: 'Janosik', target: 'self' }]] : []),
    ...(() => { state.persona = 'Janosik'; return wonderSequence(state, d.wonderT2, false); })(),
    d.marianT2 === 's2' ? ['Marian S2', skill(MARIAN, 'S2', 'party')] : ['Marian S1 Beach Basket', skill(MARIAN, 'S1', 'party')],
    ['Berry S3 boss', skill(BERRY, 'S3', 'boss')]
  ];
  const t3Marian = d.earlyHighlights === 'berry_t2_marian_t3'
    ? [['Marian Highlight on Berry', highlight(MARIAN, MARIAN, 'berry')], [`Marian ${d.medicineT3} on Berry`, medicine(d.medicineT3)]]
    : [[`Marian ${d.medicineT3} on Berry`, medicine(d.medicineT3)], ['Berry Highlight during Marian turn', highlight(MARIAN, BERRY, 'boss')]];
  route.T3 = [
    ['MIKU cycle Spring Storm to Play-With-Fire', songCycle('Spring Storm', 'Play-With-Fire')],
    ['MIKU Play-With-Fire S1', navigator(JC, 'Feel the Beat')],
    ['Twins S2 Service and Admonition boss', skill(JC, 'S2', 'boss')],
    ...wonderSequence(state, 'venomous', false),
    ...t3Marian,
    ['Marian S1 Beach Basket', skill(MARIAN, 'S1', 'party')],
    ['Berry S3 boss', skill(BERRY, 'S3', 'boss')]
  ];
  route.T4 = [
    ['MIKU cycle Heaven to Spring Storm', songCycle('Heaven', 'Spring Storm')],
    ['MIKU Spring Storm S2', navigator(JC, 'Clear Sound')],
    d.jcT4 === 's1' ? ['Twins S1 Fire and Ice boss', skill(JC, 'S1', 'boss')] : ['Twins Gun boss', gun(false)],
    ...wonderSequence(state, 'rakunda_janosik', false),
    [`Marian ${d.medicineT4} on Berry`, medicine(d.medicineT4)],
    ['Marian S3 on Berry', skill(MARIAN, 'S3', 'berry')],
    ['Berry S3 boss', skill(BERRY, 'S3', 'boss')]
  ];
  route.T5 = [
    ['Twins Fire and Ice Highlight', maskHighlight(JC, false)],
    ['MIKU Showstopper', navigator(JC, 'Showstopper')],
    ['Twins store Power to Resist Ruin', { expectedActorId: JC, expectedConcert: true, kind: 'trueDesire', target: 'self' }],
    ['Twins S2 Electric and Wind boss', skill(JC, 'S2', 'boss', true)],
    ...wonderSequence(state, 'theoria', true),
    [`Marian ${d.medicineT5} on Berry`, medicine(d.medicineT5, true)],
    ['Marian S2 Summer Garden', skill(MARIAN, 'S2', 'party', true)],
    ['Marian Highlight on Berry', highlight(BERRY, MARIAN, 'berry', true)],
    ['Berry S3 boss', skill(BERRY, 'S3', 'boss', true)]
  ];
  route.T6 = [
    ['Twins S1 Fire and Ice boss', skill(JC, 'S1', 'boss', true)],
    ...wonderSequence(state, d.wonderT6, true),
    [`Marian ${d.medicineT6} on Berry`, medicine(d.medicineT6, true)],
    ['Berry Highlight during Marian turn', highlight(MARIAN, BERRY, 'boss', true)],
    d.marianT6 === 's1' ? ['Marian S1 Beach Basket', skill(MARIAN, 'S1', 'party', true)] : ['Marian S2 Summer Garden', skill(MARIAN, 'S2', 'party', true)],
    ['Berry free Highlight boss', { expectedActorId: BERRY, expectedConcert: true, kind: 'freeHL', target: 'boss' }],
    ['Berry Alt S3 boss', { expectedActorId: BERRY, expectedConcert: true, kind: 'berryAlt', slot: 'S3', target: 'boss' }]
  ];
  route.T7 = [
    ['MIKU cycle Heaven to Spring Storm', songCycle('Heaven', 'Spring Storm')],
    ['MIKU Spring Storm S1', navigator(JC, 'Feel the Beat')],
    ['Twins S2 Electric and Wind boss', skill(JC, 'S2', 'boss')],
    ...wonderSequence(state, d.wonderT7, false),
    ['Twins Fire and Ice Highlight', maskHighlight(MARIAN, false)],
    d.marianT7 === 's3_on_berry' ? ['Marian S3 on Berry', skill(MARIAN, 'S3', 'berry')] : ['Marian S2 Summer Garden', skill(MARIAN, 'S2', 'party')],
    d.berryT7 === 'alt_s1' ? ['Berry Alt S1 boss', { expectedActorId: BERRY, expectedConcert: false, kind: 'berryAlt', slot: 'S1', target: 'boss' }]
      : d.berryT7 === 's3' ? ['Berry S3 boss', skill(BERRY, 'S3', 'boss')] : ['Berry S1 boss', skill(BERRY, 'S1', 'boss')]
  ];
  route.T8 = [
    ['MIKU Play-With-Fire S1', navigator(JC, 'Feel the Beat')],
    d.jcT8 === 's1' ? ['Twins S1 Fire and Ice boss', skill(JC, 'S1', 'boss')] : ['Twins Gun boss', gun(false)],
    ...wonderSequence(state, d.wonderT8, false),
    [`Marian ${d.medicineT8} on Berry`, medicine(d.medicineT8)],
    ['Marian ordinary Attacker Tablet item on Berry', { expectedActorId: MARIAN, expectedConcert: false, kind: 'item', id: 'attack_tablet', target: 'berry' }],
    ['Berry S3 boss', skill(BERRY, 'S3', 'boss')]
  ];
  return route;
}

export function evaluateOne(decisions, seed = HACHIMAN_RECORDED_SEED) {
  const route = buildRoute(decisions);
  const { config } = createHachimanRecordedConfig(seed);
  config.fastMode = true;
  const engine = new HachimanRecordedEngine(config);
  const checkpoints = {};
  for (const turn of ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8']) {
    for (const [label, spec] of route[turn]) {
      try {
        if (spec.kind === 'songCycle') performSongCycle(engine, `${turn} ${label}`, spec);
        else performRouteAction(engine, `${turn} ${label}`, spec);
      } catch (error) {
        return { legal: false, failedAt: `${turn} ${label}`, reason: error.message, decisions };
      }
    }
    checkpoints[turn] = Math.round(engine.state.scoreBreakdown.turnWeightedDamagePoints);
  }
  const derivation = hachimanScoreDerivation(engine.state);
  return { legal: true, score: derivation.projectedFinalScore, checkpoints, decisions };
}

// Averages a candidate over several seeds so Highlight and Lovesick critical
// rolls cannot promote a change on one seed (as Beach Basket at T2 did on seed 8).
export function evaluate(decisions, seeds = [HACHIMAN_RECORDED_SEED]) {
  const list = Array.isArray(seeds) ? seeds : [seeds];
  const runs = list.map(seed => evaluateOne(decisions, seed));
  const illegal = runs.find(run => !run.legal);
  if (illegal) return illegal;
  const mean = key => Math.round(runs.reduce((sum, run) => sum + run[key], 0) / runs.length);
  const checkpoints = Object.fromEntries(Object.keys(runs[0].checkpoints).map(turn => [turn, Math.round(runs.reduce((sum, run) => sum + run.checkpoints[turn], 0) / runs.length)]));
  const scores = runs.map(run => run.score);
  return { legal: true, score: mean('score'), scoreMin: Math.min(...scores), scoreMax: Math.max(...scores), seeds: list.length, checkpoints, decisions };
}

function describe(decisions) {
  return Object.entries(decisions).filter(([key, value]) => BASELINE[key] !== value).map(([key, value]) => `${key}=${value}`).join(', ') || 'recorded route';
}

function main() {
  const seedArgument = process.argv.find(value => value.startsWith('--seed='));
  const seedsArgument = process.argv.find(value => value.startsWith('--seeds='));
  const seedCount = seedsArgument ? Number(seedsArgument.slice('--seeds='.length)) : 24;
  const seed = seedArgument ? [Number(seedArgument.slice('--seed='.length))] : Array.from({ length: seedCount }, (_, index) => index + 1);
  const started = Date.now();
  const baseline = evaluate(BASELINE, seed);
  if (!baseline.legal) throw new Error(`Baseline illegal at ${baseline.failedAt}: ${baseline.reason}`);

  // 1. Single-change sensitivity from the recorded route.
  const sensitivity = [];
  for (const [key, values] of Object.entries(DIMENSIONS)) {
    for (const value of values.slice(1)) {
      const result = evaluate({ ...BASELINE, [key]: value }, seed);
      sensitivity.push({ change: `${key}=${value}`, legal: result.legal, score: result.score ?? null, delta: result.legal ? result.score - baseline.score : null, failedAt: result.failedAt ?? null });
    }
  }
  sensitivity.sort((a, b) => (b.delta ?? -Infinity) - (a.delta ?? -Infinity));

  // 2. Coordinate descent with restarts from every single-change improvement.
  const seen = new Map();
  const memo = decisions => {
    const key = JSON.stringify(decisions);
    if (!seen.has(key)) seen.set(key, evaluate(decisions, seed));
    return seen.get(key);
  };
  // A change must beat the current route by more than the noise margin
  // (0.25% of the baseline) to be adopted, so seed-level swings cannot
  // promote a change that is a wash on average.
  const margin = Math.round(baseline.score * 0.0025);
  const descend = start => {
    let current = memo(start);
    if (!current.legal) return current;
    let improved = true;
    while (improved) {
      improved = false;
      for (const [key, values] of Object.entries(DIMENSIONS)) {
        for (const value of values) {
          if (current.decisions[key] === value) continue;
          const candidate = memo({ ...current.decisions, [key]: value });
          if (candidate.legal && candidate.score > current.score + margin) { current = candidate; improved = true; }
        }
      }
    }
    return current;
  };
  const starts = [BASELINE, ...sensitivity.filter(row => row.legal && row.delta > 0).map(row => { const [key, value] = row.change.split('='); return { ...BASELINE, [key]: value }; })];
  let best = baseline;
  for (const start of starts) { const result = descend(start); if (result.legal && result.score > best.score) best = result; }

  // 3. Exhaustive pass over the three most sensitive dimensions around the best route.
  const topKeys = [...new Set(sensitivity.filter(row => row.legal).map(row => row.change.split('=')[0]))].slice(0, 3);
  const combos = topKeys.reduce((acc, key) => acc.flatMap(partial => DIMENSIONS[key].map(value => ({ ...partial, [key]: value }))), [{}]);
  for (const combo of combos) { const result = memo({ ...best.decisions, ...combo }); if (result.legal && result.score > best.score + margin) best = result; }

  const evaluated = [...seen.values()].filter(row => row.legal).sort((a, b) => b.score - a.score);
  const report = {
    generatedAt: new Date().toISOString(), seeds: seed, engineModel: 'hachiman live path, 2026-09-06 structure', elapsedMs: Date.now() - started,
    baseline: { score: baseline.score, checkpoints: baseline.checkpoints },
    best: { score: best.score, delta: best.score - baseline.score, deltaPercent: (best.score / baseline.score - 1) * 100, changes: describe(best.decisions), decisions: best.decisions, checkpoints: best.checkpoints },
    noiseMargin: margin, sensitivity, candidatesEvaluated: seen.size, legalCandidates: evaluated.length,
    top: evaluated.slice(0, 12).map(row => ({ score: row.score, changes: describe(row.decisions) })),
    limitations: [
      'The search covers the listed decision points only; turn structure, Berry Alt placement, Showstopper timing and the T4+ J&C and MIKU actions are fixed as recorded.',
      'Scores are the current engine model, which reproduces the recorded run at 1.058x overall with T1 and T2 at 1.3x; differences under about 3% are within that error.',
      `Scores are means over ${seed.length} seed(s); single-seed results can move by a critical outcome, as Highlights and Lovesick activations use ordinary critical rolls.`
    ]
  };
  writeFileSync('outputs/hachiman-optimizer-2026-09-06.json', JSON.stringify(report, null, 2));
  const money = value => value.toLocaleString();
  console.log(`Baseline (recorded route): ${money(baseline.score)} mean over ${seed.length} seed(s)${baseline.scoreMin ? ` (min ${money(baseline.scoreMin)}, max ${money(baseline.scoreMax)})` : ''}`);
  console.log(`Best found: ${money(best.score)} (${report.best.deltaPercent.toFixed(2)}%) via ${report.best.changes}`);
  console.log('Checkpoints best vs baseline:', Object.keys(best.checkpoints).map(turn => `${turn} ${money(best.checkpoints[turn])} / ${money(baseline.checkpoints[turn])}`).join(' | '));
  console.log('\nSingle-change sensitivity (delta vs recorded route):');
  for (const row of sensitivity) console.log(`  ${row.change.padEnd(34)} ${row.legal ? (row.delta >= 0 ? '+' : '') + money(row.delta) : 'illegal at ' + row.failedAt}`);
  console.log(`\nEvaluated ${seen.size} candidates, ${evaluated.length} legal, ${report.elapsedMs} ms. Top:`);
  for (const row of report.top) console.log(`  ${money(row.score)}  ${row.changes}`);
}

main();
