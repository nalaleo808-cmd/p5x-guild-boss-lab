// Rotation search for the Devourer of Dreams (DOD) Hachiman break window.
// Keeps Sleepy's turn structure (T1-T15 as recorded, break at T18, four
// break rounds B1-B4) and varies the decisions from T16 on, plus two loadout
// questions Joker asked on 2026-09-09: Creation & Reconcilation versus
// Harmony & Victory on J&C, and Integrity & Labor versus Hope & Ruin on MIKU.
// Usage: node scripts/optimize-hachiman-dod.mjs [--seeds=12] [--seed=8] [--berry=joker|sleepy]
import { writeFileSync } from 'node:fs';
import { HACHIMAN_RECORDED_SEED, HachimanRecordedEngine, performRouteAction, performSongCycle } from '../src/hachiman-recorded-team.js';
import { DOD_ROUTE_HELPERS as H, SLEEPY_DOD_ROUTE, createHachimanDodConfig } from '../src/hachiman-dod-route.js';

const { JC, MARIAN, BERRY, skill, named, guard, navigator, song, highlight, maskHighlight, medicine, item, trueDesire, lock, sw } = H;

const WONDER = ['venomous', 'rakunda', 'tarukaja', 'theoria', 'matarukaja'];
const MARIAN_SKILL = ['s2', 's1', 's3'];
const MEDICINE = ['dot_up', 'attack_tablet', 'fighter_salve', 'highlight_up', 'none'];
const BERRY_SKILL = ['s3', 'alt_s3'];

export const DIMENSIONS = Object.freeze({
  jcSet: ['reconcilation', 'harmony_victory'],
  mikuSet: ['labor', 'hope_ruin'],
  concertAt: ['B1', 'B2', 'B3'],
  wonderT16: ['venomous', ...WONDER.filter(v => v !== 'venomous')],
  wonderT17: ['rakunda', ...WONDER.filter(v => v !== 'rakunda')],
  wonderT18: ['tarukaja', ...WONDER.filter(v => v !== 'tarukaja')],
  wonderB1: ['theoria', ...WONDER.filter(v => v !== 'theoria')],
  wonderB2: ['matarukaja', ...WONDER.filter(v => v !== 'matarukaja')],
  wonderB3: ['theoria', ...WONDER.filter(v => v !== 'theoria')],
  wonderB4: ['venomous', ...WONDER.filter(v => v !== 'venomous')],
  marianT16: ['s2', 's1', 's3'],
  marianT17: ['s1', 's2', 's3'],
  marianT18: ['s3', 's2', 's1'],
  marianB1: ['s2', 's1', 's3'],
  marianB3: ['s3', 's2', 's1'],
  marianB4: ['s2', 's1', 's3'],
  medicineT17: ['dot_up', ...MEDICINE.filter(v => v !== 'dot_up')],
  medicineT18: ['attack_tablet', ...MEDICINE.filter(v => v !== 'attack_tablet')],
  medicineB1: ['fighter_salve', ...MEDICINE.filter(v => v !== 'fighter_salve')],
  medicineB2: ['dot_up', ...MEDICINE.filter(v => v !== 'dot_up')],
  medicineB3: ['none', ...MEDICINE.filter(v => v !== 'none')],
  medicineB4: ['fighter_salve', ...MEDICINE.filter(v => v !== 'fighter_salve')],
  berryB1: BERRY_SKILL,
  berryB2: ['alt_s3', 's3'],
  berryB3: BERRY_SKILL,
  berryB4: BERRY_SKILL
});
// Best route for Joker's build on the 2026-09-11 model (boss statuses hold while the
// boss does not act, basket unlimited): Beach Basket at T16 so Bewitching Blossoms
// holds through the break, Attacker Tablet at B4. Every Wonder option at B2 and B4
// scored identically (all refreshes), so Sleepy's picks stand there.
export const JOKER_DOD_BEST_DECISIONS = Object.freeze({ marianT16: 's1', medicineB4: 'attack_tablet' });

export const BASELINE = Object.freeze(Object.fromEntries(Object.entries(DIMENSIONS).map(([key, values]) => [key, values[0]])));

const PERSONA_SKILLS_BY_OWNER = {
  sleepy: { Dionysus: ['Revolution', 'Universal Theoria', 'Rakunda'], Vasuki: ['Venomous Spiral', 'Media', 'Rakunda'], Janosik: ['Tatra Shot', 'Tarukaja', 'Matarukaja'] },
  // Joker's slots as read in the live run (2026-09-10).
  joker: { Dionysus: ['Revolution', 'Universal Theoria', 'Tarukaja'], Vasuki: ['Venomous Spiral', 'Media', 'Rakunda'], Janosik: ['Tatra Shot', 'Rakunda', 'Tarukaja'] }
};

function wonderSequence(state, choice, turn, concert, owner = 'sleepy') {
  const PERSONA_SKILLS = PERSONA_SKILLS_BY_OWNER[owner];
  const has = name => PERSONA_SKILLS[state.persona].includes(name);
  const holder = name => Object.keys(PERSONA_SKILLS).find(persona => PERSONA_SKILLS[persona].includes(name));
  const steps = [];
  const goTo = name => {
    if (state.persona === name) return;
    steps.push([`${turn} Wonder switch ${state.persona} to ${name}`, sw(name, concert)]);
    state.persona = name;
  };
  const cast = (name, target) => steps.push([`${turn} ${state.persona} ${name}${target === 'berry' ? ' on Berry' : target === 'boss' ? ' boss' : ''}`, named('wonder', name, target, concert)]);
  if (choice === 'rakunda') { if (!has('Rakunda')) goTo(holder('Rakunda')); cast('Rakunda', 'boss'); }
  else if (choice === 'theoria') { goTo('Dionysus'); cast('Universal Theoria', 'berry'); }
  else if (choice === 'venomous') { goTo('Vasuki'); cast('Venomous Spiral', 'boss'); }
  else if (choice === 'tarukaja') { if (!has('Tarukaja')) goTo(holder('Tarukaja')); cast('Tarukaja', 'berry'); }
  else if (choice === 'matarukaja') {
    // Joker's Janosik has no Matarukaja; fall back to Tarukaja on Berry.
    if (!holder('Matarukaja')) { if (!has('Tarukaja')) goTo(holder('Tarukaja')); cast('Tarukaja', 'berry'); }
    else { goTo('Janosik'); cast('Matarukaja', 'party'); }
  }
  return steps;
}

const marianSkill = (choice, turn, concert) => choice === 's3'
  ? [`${turn} Marian S3 on Berry`, skill(MARIAN, 'S3', 'berry', concert)]
  : choice === 's1' ? [`${turn} Marian S1 Beach Basket`, skill(MARIAN, 'S1', 'party', concert)]
    : [`${turn} Marian S2 Summer Garden`, skill(MARIAN, 'S2', 'party', concert)];
const marianMedicine = (choice, turn, concert) => choice === 'none' ? [] : [[`${turn} Marian ${choice} on Berry`, medicine(choice, concert)]];
const berrySkill = (choice, turn, concert) => choice === 'alt_s3'
  ? [`${turn} Berry Alt S3 boss`, { expectedActorId: BERRY, expectedConcert: concert, kind: 'berryAlt', slot: 'S3', target: 'boss' }]
  : [`${turn} Berry S3 boss`, skill(BERRY, 'S3', 'boss', concert)];
// Song choice plus Feel the Beat on a normal break round; skipped when the
// navigator skill is still cooling down.
const mikuNormal = (turn, songName) => [
  [`${turn} MIKU song ${songName}`, { expectedActorId: JC, expectedConcert: false, kind: 'setSong', nextSong: songName, optional: true }],
  [`${turn} MIKU ${songName} S1`, { ...navigator(JC, 'Feel the Beat'), optional: true }]
];

export function buildRoute(decisions, owner = 'sleepy') {
  const d = { ...BASELINE, ...decisions };
  const wonder = (choice, turn, concert) => wonderSequence(state, choice, turn, concert, owner);
  const state = { persona: 'Dionysus' };
  const route = {};
  for (const turn of Object.keys(SLEEPY_DOD_ROUTE)) if (/^T(\d+)$/.test(turn) && Number(turn.slice(1)) <= 15) route[turn] = SLEEPY_DOD_ROUTE[turn];
  // Sleepy's Wonder sat on Dionysus through T15 (guards); the T16 sequence
  // starts from there as in the recorded route.
  route.T16 = [
    ['T16 MIKU song Heaven', song(JC, 'Heaven')], ['T16 MIKU Heaven S1', navigator(JC, 'Feel the Beat')],
    ['T16 Twins S2 P/N boss', skill(JC, 'S2', 'boss')],
    ...wonder(d.wonderT16, 'T16', false),
    ['T16 Marian Highlight on Berry', highlight(MARIAN, MARIAN, 'berry')], marianSkill(d.marianT16, 'T16', false),
    ['T16 Berry Guard', guard(BERRY)]
  ];
  route.T17 = [
    ['T17 MIKU song Play-With-Fire', song(JC, 'Play-With-Fire')], ['T17 MIKU Fire S1', navigator(JC, 'Feel the Beat')],
    ['T17 Twins S1 F/I boss (A6 nuke)', skill(JC, 'S1', 'boss')],
    ...wonder(d.wonderT17, 'T17', false),
    ...marianMedicine(d.medicineT17, 'T17', false), marianSkill(d.marianT17, 'T17', false),
    ['T17 Berry Guard', guard(BERRY)]
  ];
  route.T18 = [
    ['T18 MIKU song Spring Storm', song(JC, 'Spring Storm')], ['T18 MIKU Spring S2', navigator(JC, 'Clear Sound')],
    ['T18 Twins F/I Highlight', maskHighlight(JC, 'mischief')], ['T18 Twins A6 button', trueDesire(JC)], ['T18 Twins S2 P/N boss', skill(JC, 'S2', 'boss')],
    ...wonder(d.wonderT18, 'T18', false),
    ...marianMedicine(d.medicineT18, 'T18', false), marianSkill(d.marianT18, 'T18', false),
    ['T18 HP Lock OFF', lock(BERRY, false)], ['T18 Berry S3 boss (break)', skill(BERRY, 'S3', 'boss')]
  ];
  const rounds = ['B1', 'B2', 'B3', 'B4'];
  const concertIndex = rounds.indexOf(d.concertAt);
  const songs = { B1: 'Heaven', B2: 'Spring Storm', B3: 'Spring Storm', B4: 'Play-With-Fire' };
  for (const [index, turn] of rounds.entries()) {
    const concert = index === concertIndex || index === concertIndex + 1;
    const steps = [];
    if (index === concertIndex) steps.push([`${turn} MIKU Showstopper`, navigator(JC, 'Showstopper')]);
    else if (!concert) steps.push(...mikuNormal(turn, songs[turn]));
    // J&C as recorded: A6 nuke rounds on S1 F/I, Mask Highlights where Sleepy used them.
    if (turn === 'B1') steps.push(['B1 Twins S1 F/I boss (A6 nuke)', skill(JC, 'S1', 'boss', concert)]);
    if (turn === 'B2') steps.push(['B2 Twins F/I Highlight', maskHighlight(JC, 'mischief', concert)], ['B2 Twins S2 P/N boss', skill(JC, 'S2', 'boss', concert)]);
    if (turn === 'B3') steps.push(['B3 Twins A6 button', trueDesire(JC, concert)], ['B3 Twins S1 F/I boss', skill(JC, 'S1', 'boss', concert)]);
    if (turn === 'B4') steps.push(['B4 Twins P/N Highlight', maskHighlight(JC, 'absurdity', concert)], ['B4 Twins S2 P/N boss', skill(JC, 'S2', 'boss', concert)]);
    steps.push(...wonder(d[`wonder${turn}`], turn, concert));
    if (turn === 'B1') steps.push(['B1 Marian Highlight on Berry', highlight(MARIAN, MARIAN, 'berry', concert)]);
    steps.push(...marianMedicine(d[`medicine${turn}`], turn, concert));
    if (turn === 'B2') steps.push(['B2 Marian HL-Up item on Berry', item('highlight_up', concert)]);
    if (turn !== 'B2') steps.push(marianSkill(d[`marian${turn}`], turn, concert));
    if (turn === 'B2') steps.push(['B2 Berry Highlight boss', highlight(BERRY, BERRY, 'boss', concert)], ['B2 Berry free Highlight boss', { expectedActorId: BERRY, expectedConcert: concert, kind: 'freeHL', target: 'boss' }]);
    steps.push(berrySkill(d[`berry${turn}`], turn, concert));
    route[turn] = steps;
  }
  return route;
}

// Loadout variants applied to the built engine. Reconcilation: the party +12%
// damage read from Berry's status list plus J&C's own +15% Attack/Defense (Joker's
// current pair). Harmony & Victory: J&C wind +10% only (Victory set4 unmodeled).
// Hope & Ruin on MIKU: Ruin set2 +12% own Attack shared at 20% to the party
// (5,650 panel x 0.12 x 0.2 = 136 base Attack each) in place of Labor's +8%
// party Attack/Defense buff; Ruin set4 (+25% own Attack for 3 turns, again after
// a Theurgy) is not modeled because a navigator has no Theurgy to renew it.
const RUIN_SHARE_ATTACK = Math.round(5650 * 0.12 * 0.2);
export function applyLoadoutVariants(engine, d) {
  for (const unit of engine.state.party) {
    if (d.jcSet === 'harmony_victory') {
      unit.buffs = unit.buffs.filter(effect => effect.id !== 'observed_creation_reconciliation_damage' && !String(effect.id).startsWith('runner_reconcilation_'));
    } else if (unit.slug === 'j-c') unit.elementBonus = null;
    if (d.mikuSet === 'hope_ruin') {
      // Undo Labor's stat multiplier, then add Ruin's shared Attack.
      unit.buffs = unit.buffs.filter(effect => !String(effect.id).startsWith('runner_labor_navigator_'));
      if (unit.laborSetApplied) { unit.attack = Math.round(unit.attack / 1.08); unit.defense = Math.round(unit.defense / 1.08); }
      unit.attack += RUIN_SHARE_ATTACK;
    }
  }
}

export function evaluateOne(decisions, seed = HACHIMAN_RECORDED_SEED, berryPanel = 'joker') {
  const owner = berryPanel === 'joker' ? 'joker' : 'sleepy';
  const route = buildRoute(decisions, owner);
  const { config } = createHachimanDodConfig(seed, { berryPanel, personaOwner: owner });
  config.fastMode = true;
  const engine = new HachimanRecordedEngine(config);
  applyLoadoutVariants(engine, { ...BASELINE, ...decisions });
  const checkpoints = {};
  for (const turn of Object.keys(route)) {
    for (const [label, spec] of route[turn]) {
      try {
        if (spec.kind === 'songCycle' || spec.kind === 'setSong') performSongCycle(engine, label, spec);
        else performRouteAction(engine, label, spec);
      } catch (error) {
        if (spec.optional) continue;
        return { legal: false, failedAt: label, reason: error.message, decisions };
      }
    }
    if (['T18', 'B1', 'B2', 'B3', 'B4'].includes(turn)) checkpoints[turn] = Math.round(engine.state.scoreBreakdown.points || 0);
    if (engine.state.phase !== 'battle') break;
  }
  const points = Math.round(engine.state.scoreBreakdown.points || 0);
  return { legal: true, score: (points + 125000) * 8, points, checkpoints, decisions };
}

export function evaluate(decisions, seeds, berryPanel) {
  const runs = seeds.map(seed => evaluateOne(decisions, seed, berryPanel));
  const illegal = runs.find(run => !run.legal);
  if (illegal) return illegal;
  const mean = values => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  const checkpoints = Object.fromEntries(Object.keys(runs[0].checkpoints).map(turn => [turn, mean(runs.map(run => run.checkpoints[turn] ?? 0))]));
  const scores = runs.map(run => run.score);
  return { legal: true, score: mean(scores), scoreMin: Math.min(...scores), scoreMax: Math.max(...scores), points: mean(runs.map(run => run.points)), checkpoints, decisions };
}

function describe(decisions) {
  return Object.entries(decisions).filter(([key, value]) => BASELINE[key] !== value).map(([key, value]) => `${key}=${value}`).join(', ') || "Sleepy's route";
}

function main() {
  const argument = name => process.argv.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3);
  const berryPanel = argument('berry') || 'joker';
  const seedCount = Number(argument('seeds') || 12);
  const seeds = argument('seed') ? [Number(argument('seed'))] : Array.from({ length: seedCount }, (_, index) => index + 1);
  const started = Date.now();
  const baseline = evaluate(BASELINE, seeds, berryPanel);
  if (!baseline.legal) throw new Error(`Baseline illegal at ${baseline.failedAt}: ${baseline.reason}`);

  const sensitivity = [];
  for (const [key, values] of Object.entries(DIMENSIONS)) {
    for (const value of values.slice(1)) {
      const result = evaluate({ ...BASELINE, [key]: value }, seeds, berryPanel);
      sensitivity.push({ change: `${key}=${value}`, legal: result.legal, score: result.score ?? null, delta: result.legal ? result.score - baseline.score : null, failedAt: result.failedAt ?? null, reason: result.reason ?? null });
    }
  }
  sensitivity.sort((a, b) => (b.delta ?? -Infinity) - (a.delta ?? -Infinity));

  const seen = new Map();
  const memo = decisions => {
    const key = JSON.stringify(decisions);
    if (!seen.has(key)) seen.set(key, evaluate(decisions, seeds, berryPanel));
    return seen.get(key);
  };
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
  const starts = [BASELINE, ...sensitivity.filter(row => row.legal && row.delta > 0).slice(0, 8).map(row => { const [key, value] = row.change.split('='); return { ...BASELINE, [key]: value }; })];
  let best = baseline;
  for (const start of starts) { const result = descend(start); if (result.legal && result.score > best.score) best = result; }

  const evaluated = [...seen.values()].filter(row => row.legal).sort((a, b) => b.score - a.score);
  const report = {
    generatedAt: new Date().toISOString(), seeds, berryPanel, elapsedMs: Date.now() - started,
    baseline: { score: baseline.score, points: baseline.points, checkpoints: baseline.checkpoints },
    best: { score: best.score, points: best.points, delta: best.score - baseline.score, deltaPercent: (best.score / baseline.score - 1) * 100, changes: describe(best.decisions), decisions: best.decisions, checkpoints: best.checkpoints },
    noiseMargin: margin, sensitivity, candidatesEvaluated: seen.size, legalCandidates: evaluated.length,
    top: evaluated.slice(0, 12).map(row => ({ score: row.score, changes: describe(row.decisions) })),
    limitations: [
      'T1-T15 and the J&C break-round actions are fixed as Sleepy played them; only the listed decisions vary.',
      'The DOD model reproduces Sleepy\'s run at 1.07x overall with the Concert rounds 1.11x over and the post-Concert rounds 0.7-0.9x under; differences under about 3% are within that error.',
      'Victory set4, Power set4 and Ruin set4 are not modeled; Labor is modeled as a +8% Attack buff in the buff pool.',
      `Scores are means over ${seeds.length} seed(s).`
    ]
  };
  writeFileSync('outputs/hachiman-dod-optimizer-2026-09-09.json', JSON.stringify(report, null, 2));
  const money = value => value.toLocaleString();
  console.log(`Berry panel: ${berryPanel}. Baseline (Sleepy's route, Joker's sets): ${money(baseline.score)} mean over ${seeds.length} seed(s) (min ${money(baseline.scoreMin)}, max ${money(baseline.scoreMax)})`);
  console.log(`Best found: ${money(best.score)} (${report.best.deltaPercent.toFixed(2)}%) via ${report.best.changes}`);
  console.log('Checkpoints best vs baseline (points):', Object.keys(best.checkpoints).map(turn => `${turn} ${money(best.checkpoints[turn])} / ${money(baseline.checkpoints[turn])}`).join(' | '));
  console.log('\nSingle-change sensitivity (delta vs baseline):');
  for (const row of sensitivity) console.log(`  ${row.change.padEnd(30)} ${row.legal ? (row.delta >= 0 ? '+' : '') + money(row.delta) : 'illegal at ' + row.failedAt + ': ' + row.reason}`);
  console.log(`\nEvaluated ${seen.size} candidates, ${evaluated.length} legal, ${report.elapsedMs} ms. Top:`);
  for (const row of report.top) console.log(`  ${money(row.score)}  ${row.changes}`);
}

if (process.argv[1] && /optimize-hachiman-dod\.mjs$/.test(process.argv[1].replace(/\\/g, '/'))) main();
