import { writeFileSync } from 'node:fs';
import { HachimanRecordedEngine, character, combatSkill, dionysusDefinition, navigatorDefinition } from '../src/hachiman-recorded-team.js';
import { CURRENT_MECHANICS_PROFILE } from '../src/engine.js';
import { buildPersonaLoadoutCatalog } from '../src/persona-loadout.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';
import { getDefaultWonderWeaponProfileId } from '../src/wonder-weapons.js';

// Latest complete logger session: outputs/sessions/20260920_203601.
const LIVE_FINAL_FDP = 1_749_845_760;
const LIVE_FINAL_SCORE = 7_000_383_040;
const LIVE_CHECKPOINTS = [
  { label: 'opening auto-nuke', score: 44_307, sourceRun: 'supplied_checkpoint_1_same_run_2026-09-21', confidence: 'exact_ui' },
  { label: 'T1 J&C S1 + Miyu', score: 392_534, sourceRun: 'supplied_checkpoint_1_same_run_2026-09-21', confidence: 'exact_ui' },
  { label: 'T1 Wonder Universal Theoria + Miyu', score: 786_423, sourceRun: 'supplied_checkpoint_1_same_run_2026-09-21', confidence: 'exact_ui' },
  { label: 'T1 Marian S3 + Miyu', score: 1_334_327, sourceRun: 'supplied_screenshot', confidence: 'exact_ui' },
  { label: 'T1 boundary', score: 3_194_900, sourceRun: 'supplied_screenshot', confidence: 'exact_ui' },
  { label: 'T2 J&C S2 + Miyu', score: 5_126_257, sourceRun: 'logger_20260920_203601', capturedAt: '20:39:36', confidence: 'exact_logger_ocr' },
  { label: 'T2 Wonder Tarukaja + Miyu', score: 6_850_644, sourceRun: 'logger_20260920_203601', capturedAt: '20:39:45', confidence: 'exact_logger_ocr' },
  { label: 'T2 boundary', score: 23_633_158, sourceRun: 'logger_20260920_203601', capturedAt: '20:40:30', confidence: 'exact_logger_ocr' },
  { label: 'T3 J&C S1 + Miyu', score: 26_663_212, sourceRun: 'logger_20260920_203601', capturedAt: '20:41:17', confidence: 'exact_logger_ocr' },
  { label: 'T3 Sonic + Miyu', score: 29_898_064, sourceRun: 'logger_20260920_203601', capturedAt: '20:41:23', confidence: 'exact_logger_ocr' },
  { label: 'T3 boundary', score: 74_393_456, sourceRun: 'logger_20260920_203601', capturedAt: '20:41:55', confidence: 'exact_logger_ocr' },
  { label: 'before Virtual Concert', score: 136_308_608, sourceRun: 'logger_20260920_203601', capturedAt: '20:43:30', confidence: 'exact_logger_ocr' },
  { label: 'Concert Shark + Miyu', score: 223_922_800, sourceRun: 'logger_20260920_203601', capturedAt: '20:44:27', confidence: 'exact_logger_ocr' },
  { label: 'late Marian S2 before Miyu', score: 259_789_920, sourceRun: 'battle_export_20260920_151414', confidence: 'exact_logger_ocr_other_run' },
  { label: 'Virtual Concert finish', score: 1_394_879_360, sourceRun: 'logger_20260920_203601', capturedAt: '20:45:50', confidence: 'exact_logger_ocr' },
  { label: 'post-Concert Universal Theoria + Miyu', score: 1_417_574_144, sourceRun: 'logger_20260920_203601', capturedAt: '20:46:17', confidence: 'exact_logger_ocr' },
  { label: 'late Miyu S2 checkpoint', score: 1_608_279_296, sourceRun: 'logger_20260920_203601', capturedAt: '20:46:58', confidence: 'exact_logger_ocr' },
  { label: 'late J&C S2 packet end', score: 1_620_529_536, sourceRun: 'logger_20260920_203601', capturedAt: '20:47:34', confidence: 'exact_logger_ocr' },
  { label: 'late Marian S1 packet end', score: 1_633_361_024, sourceRun: 'logger_20260920_203601', capturedAt: '20:47:58', confidence: 'exact_logger_ocr' },
  { label: 'final FDP', score: LIVE_FINAL_FDP, sourceRun: 'logger_20260920_203601', confidence: 'exact_end_result' }
];

const catalog = buildPersonaLoadoutCatalog(lufelCatalog);
const transferable = name => catalog.transferableSkills.find(skill => skill.name === name);
const persona = name => lufelCatalog.personas.find(item => item.name === name);
const dionysus = dionysusDefinition().definition;
const nianSource = persona('Nian');
const sharkSource = persona('Sahimochi-no-kami');
const nian = {
  id: nianSource.id, name: nianSource.name, element: nianSource.element, arcana: nianSource.position,
  passive: structuredClone(nianSource.passive || []), maxRankPassive: structuredClone(nianSource.maxRankPassive || null),
  skills: [combatSkill(transferable('Sonic Interference'), 0, {
    cost: 22, debuff: { id: 'sonic_interference', name: 'SONIC INTERFERENCE', value: 0.30, duration: 3 }
  })]
};
const shark = {
  id: sharkSource.id, name: sharkSource.name, element: sharkSource.element, arcana: sharkSource.position,
  passive: structuredClone(sharkSource.passive || []), maxRankPassive: structuredClone(sharkSource.maxRankPassive || null),
  skills: [combatSkill(sharkSource.skills.find(skill => skill.name === 'Chilling Depth'), 0, {
    cost: 24, power: 1.1, debuff: { id: 'chilling_depth', name: 'ICE DAMAGE TAKEN', value: 0.088, duration: 2 }
  })]
};

const jc = character('j-c');
const marian = character('marian-beachflower');
const miyu = character('puppet-wavecatcher');
const stats = {
  // These equipped totals are reconstructed from the supplied Character
  // Details captures at T2. The displayed T2 values already include the active
  // Marian, J&C, Miyu, and MIKU effects, which are removed here before replay.
  [jc.id]: { attack: 3123, defense: 2784, maxHp: 13100, maxSp: 100, speed: 113.4, critRate: 48.5, critMult: 223.8, damageBonus: 52.5, spRecovery: 5 },
  wonder: { attack: 2846, defense: 2910, maxHp: 13823, maxSp: 100, speed: 111.8, critRate: 47.1, critMult: 241.065, pierceRate: 3.1 },
  [marian.id]: { attack: 2572, defense: 2403, maxHp: 17853, maxSp: 100, speed: 106.8, critRate: 20.2, critMult: 265.665, pierceRate: 6.6 },
  [miyu.id]: { attack: 3121, defense: 2163, maxHp: 11142, maxSp: 450, speed: 98.8, critRate: 35.3, critMult: 373.465, spRecovery: 202.5, pierceRate: 34.6 }
};

const sourceMiyu = !process.argv.includes('--legacy-miyu');
const diagnosticLedger = process.argv.includes('--ledger');

function makeEngine(seed) {
  const loadouts = Object.fromEntries(Object.entries(stats).map(([id, baseStats]) => [id, {
    statsMode: 'equipped', navigatorShareApplied: true, panelIncludesShareAndSetEffects: true, baseStats
  }]));
  loadouts[jc.id].jcDesireLevel = 120;
  loadouts[jc.id].characterResearch = {
    weapon: 'signature', refinement: 6, staticWeaponStatsIncluded: false
  };
  loadouts[miyu.id].characterResearch = {
    weapon: 'signature', refinement: 6, staticWeaponStatsIncluded: true
  };
  loadouts.wonder.weaponId = 'ice-age';
  loadouts.wonder.weaponProfileId = getDefaultWonderWeaponProfileId('ice-age');
  return new HachimanRecordedEngine({
    seed, bossId: 'surt', modeId: 'multidimensional', mechanicsProfile: CURRENT_MECHANICS_PROFILE, fastMode: !diagnosticLedger,
    dreamscapeObservedCompositionEffect: true, sharedHighlightStart: 25, wavecatcherSourceMechanics: sourceMiyu,
    teamIds: [jc.id, 'wonder', marian.id, miyu.id], characterDefinitions: [jc, marian, miyu],
    navigatorDefinition: navigatorDefinition(), personaDefinitions: [dionysus, nian, shark],
    personaIds: [dionysus.id, nian.id, shark.id], jcMaskPair: ['mischief', 'service'],
    jcOpeningAutoTargetId: 'jack_o_lantern',
    loadouts
  });
}

const targetId = (engine, target) => target === 'miyu' ? miyu.id
  : target === 'party' ? 'party' : target === 'add' ? 'jack_o_lantern' : engine.state.boss.id;

function setSong(engine, song) {
  engine.state.navigator.currentSong = song;
  engine.state.navigator.songIndex = ['Heaven', 'Spring Storm', 'Play-With-Fire'].indexOf(song);
}

function navigator(engine, name, song) {
  if (song) setSong(engine, song);
  let action = engine.getNavigatorActions().find(item => item.name === name && item.enabled);
  if (!action) {
    action = engine.getNavigatorActions().find(item => item.name === name);
    if (!action) throw new Error(`Missing navigator action ${name}`);
    engine.runnerForcedResources.push({ type: 'navigator_cooldown', action: name, attackTurn: engine.state.attackTurn });
    engine.state.navigator.cooldowns[action.id] = 0;
    engine.state.navigator.lastUsedAttackTurn = -1;
  }
  return engine.stepNavigator(action.id);
}

function switchPersona(engine, name) {
  const selected = engine.personaDefinitions.find(item => item.name === name);
  if (!selected) throw new Error(`Missing Persona ${name}`);
  if (engine.state.activePersonaId !== selected.id) engine.selectPersona(selected.id);
}

function action(engine, actorSlug, selector, target = 'boss') {
  if (engine.actor?.slug !== actorSlug && engine.actor?.id !== actorSlug) {
    throw new Error(`Expected ${actorSlug}, found ${engine.actor?.slug || engine.actor?.id}`);
  }
  const legal = engine.getAvailableActions().find(item => item.enabled && (
    selector.slot ? item.skill?.slot === selector.slot : item.name === selector.name
  ));
  if (!legal) throw new Error(`No legal ${JSON.stringify(selector)} for ${actorSlug}`);
  return engine.step({ type: legal.type, skillId: legal.skillId, targetId: targetId(engine, target) });
}

function highlight(engine, actorSlug, target = 'boss', mask = null) {
  engine.runnerForcedResources.push({ type: 'highlight_gauge', actor: actorSlug, prior: engine.state.sharedCombat.highlight, attackTurn: engine.state.attackTurn });
  engine.state.sharedCombat.highlight = 100;
  const unit = engine.state.party.find(item => item.slug === actorSlug || item.id === actorSlug);
  const available = engine.getHighlightActions().find(item => item.actorId === unit.id && item.enabled
    && (!mask || item.skill?.jcHighlightMask === mask));
  if (!available) throw new Error(`No Highlight for ${actorSlug}`);
  return engine.stepHighlight(available.skillId, targetId(engine, target));
}

function medicine(engine, id, target = 'miyu') {
  const marianUnit = engine.state.party.find(item => item.slug === 'marian-beachflower');
  engine.runnerForcedResources.push({ type: 'medicine_availability', item: id, prior: marianUnit.midsummerPrescription, attackTurn: engine.state.attackTurn });
  marianUnit.midsummerPrescription = Math.max(1, marianUnit.midsummerPrescription);
  marianUnit.lastMedicineCharacterTurn = -1;
  return engine.stepMedicine(id, targetId(engine, target));
}

function dreamItem(engine, id, target = 'miyu') {
  const pending = engine.getAvailableActions().find(item => item.enabled && item.type === 'skip_extra_actions');
  if (pending) engine.step({ type: pending.type, skillId: pending.skillId, targetId: engine.actor.id });
  const prior = Number(engine.state.itemInventory[id] || 0);
  if (prior < 1) engine.runnerForcedResources.push({ type: 'dream_item_inventory', item: id, prior, attackTurn: engine.state.attackTurn });
  engine.state.itemInventory[id] = Math.max(1, prior);
  engine.state.itemUsesRemaining = Math.max(1, Number(engine.state.itemUsesRemaining || 0));
  return engine.stepItem(id, targetId(engine, target));
}

function checkpoint(engine, label, rows) {
  const wavecatcher = engine.state.party.find(unit => unit.slug === 'puppet-wavecatcher');
  const priorLogIndex = Number(engine.replayCheckpointLogIndex || 0);
  const checkpointEvents = diagnosticLedger
    ? engine.state.log.slice(priorLogIndex).filter(event => ['move', 'follow_up', 'damage', 'medicine', 'item', 'concert_start', 'concert_end'].includes(event.type))
      .map(event => ({ type: event.type, message: event.message, amount: event.amount, targetId: event.targetId,
        skillId: event.skillId, sourceType: event.sourceType, element: event.element, critical: event.critical,
        calculation: event.calculation }))
    : [];
  engine.replayCheckpointLogIndex = engine.state.log.length;
  rows.push({ label, attackTurn: engine.state.attackTurn, foeDefensePoints: engine.state.scoreBreakdown.foeDefensePoints,
    rawDamage: engine.state.totalDamage,
    ...(diagnosticLedger && wavecatcher ? {
      wavecatcher: {
        attack: wavecatcher.attack,
        sp: wavecatcher.sp,
        surfActive: wavecatcher.surfActive,
        offshoreStacks: wavecatcher.offshoreStacks,
        catchAWaveCount: wavecatcher.catchAWaveCount,
        buffs: wavecatcher.buffs.map(buff => ({ id: buff.id, stat: buff.stat, value: buff.value, duration: buff.duration }))
      },
      partyStats: engine.state.party.map(unit => ({
        id: unit.id,
        slug: unit.slug,
        attack: unit.attack,
        sp: unit.sp,
        attackBuff: unit.buffs.filter(buff => buff.stat === 'attack').reduce((sum, buff) => sum + Number(buff.value || 0), 0),
        critRateBuff: unit.buffs.filter(buff => buff.stat === 'critRate').reduce((sum, buff) => sum + Number(buff.value || 0), 0),
        critDamageBuff: unit.buffs.filter(buff => buff.stat === 'critDamage').reduce((sum, buff) => sum + Number(buff.value || 0), 0),
        buffs: unit.buffs.map(buff => ({ id: buff.id, stat: buff.stat, value: buff.value, duration: buff.duration }))
      })),
      virtualConcert: structuredClone(engine.state.navigator.virtualConcert),
      events: checkpointEvents
    } : {})
  });
}

function play(seed) {
  const e = makeEngine(seed);
  e.runnerForcedResources = [];
  const rows = [];
  checkpoint(e, 'opening auto-nuke', rows);

  action(e, 'j-c', { slot: 'S1' }, 'add'); checkpoint(e, 'T1 J&C S1 + Miyu', rows);
  switchPersona(e, 'Dionysus'); action(e, 'wonder', { name: 'Universal Theoria' }, 'miyu'); checkpoint(e, 'T1 Wonder Universal Theoria + Miyu', rows);
  action(e, 'marian-beachflower', { slot: 'S3' }, 'miyu'); checkpoint(e, 'T1 Marian S3 + Miyu', rows);
  action(e, 'puppet-wavecatcher', { slot: 'S1' }, 'add'); checkpoint(e, 'T1 boundary', rows);

  navigator(e, 'Feel the Beat', 'Heaven');
  checkpoint(e, 'T2 after Miku S1 Heaven', rows);
  action(e, 'j-c', { slot: 'S2' }, 'add'); checkpoint(e, 'T2 J&C S2 + Miyu', rows);
  action(e, 'wonder', { name: 'Tarukaja' }, 'miyu'); checkpoint(e, 'T2 Wonder Tarukaja + Miyu', rows);
  highlight(e, 'marian-beachflower', 'miyu');
  action(e, 'marian-beachflower', { slot: 'S2' }, 'party');
  action(e, 'puppet-wavecatcher', { slot: 'S2' }, 'add');
  checkpoint(e, 'T2 boundary', rows);

  navigator(e, 'Clear Sound', 'Spring Storm');
  action(e, 'j-c', { slot: 'S1' }, 'add'); checkpoint(e, 'T3 J&C S1 + Miyu', rows);
  switchPersona(e, 'Nian'); action(e, 'wonder', { name: 'Sonic Interference' }, 'boss'); checkpoint(e, 'T3 Sonic + Miyu', rows);
  medicine(e, 'reso_up'); action(e, 'marian-beachflower', { slot: 'S1' }, 'boss');
  action(e, 'puppet-wavecatcher', { slot: 'S2' }, 'add');
  checkpoint(e, 'T3 boundary', rows);

  navigator(e, 'Feel the Beat', 'Play-With-Fire');
  highlight(e, 'j-c', 'add', 'mischief'); dreamItem(e, 'highlight_up');
  switchPersona(e, 'Dionysus'); action(e, 'wonder', { name: 'Universal Theoria' }, 'miyu');
  medicine(e, 'attack_tablet'); action(e, 'marian-beachflower', { slot: 'S3' }, 'miyu');
  action(e, 'puppet-wavecatcher', { slot: 'S1' }, 'add');
  checkpoint(e, 'before Virtual Concert', rows);

  navigator(e, 'Showstopper');
  checkpoint(e, 'Virtual Concert start', rows);
  e.setTrueDesire(true);
  action(e, 'j-c', { slot: 'S2' }, 'add');
  highlight(e, 'puppet-wavecatcher', 'add');
  switchPersona(e, 'Sahimochi-no-kami'); action(e, 'wonder', { name: 'Chilling Depth' }, 'add'); checkpoint(e, 'Concert Shark + Miyu', rows);
  medicine(e, 'fighter_salve'); action(e, 'marian-beachflower', { slot: 'S2' }, 'party'); checkpoint(e, 'late Marian S2 before Miyu', rows);
  action(e, 'puppet-wavecatcher', { slot: 'S2' }, 'add');
  checkpoint(e, 'Virtual Concert round 1 end', rows);

  highlight(e, 'marian-beachflower', 'miyu');
  action(e, 'j-c', { slot: 'S1' }, 'add');
  switchPersona(e, 'Dionysus'); action(e, 'wonder', { name: 'Tarukaja' }, 'miyu');
  medicine(e, 'reso_up'); action(e, 'marian-beachflower', { slot: 'S1' }, 'boss'); checkpoint(e, 'late Marian S1 checkpoint', rows);
  highlight(e, 'j-c', 'add', 'mischief'); action(e, 'puppet-wavecatcher', { slot: 'S2' }, 'add');
  checkpoint(e, 'Virtual Concert finish', rows);

  navigator(e, 'Feel the Beat', 'Heaven'); dreamItem(e, 'dot_up');
  switchPersona(e, 'Dionysus'); action(e, 'wonder', { name: 'Universal Theoria' }, 'miyu'); checkpoint(e, 'post-Concert Universal Theoria + Miyu', rows);
  action(e, 'marian-beachflower', { slot: 'S3' }, 'miyu');
  action(e, 'puppet-wavecatcher', { slot: 'S2' }, 'add'); checkpoint(e, 'late Miyu S2 checkpoint', rows);

  navigator(e, 'Feel the Beat', 'Spring Storm');
  highlight(e, 'wonder', 'boss');
  action(e, 'j-c', { slot: 'S2' }, 'add'); checkpoint(e, 'late J&C S2 packet end', rows);
  switchPersona(e, 'Nian'); action(e, 'wonder', { name: 'Sonic Interference' }, 'boss'); checkpoint(e, 'late Sonic checkpoint', rows);
  medicine(e, 'attack_tablet'); action(e, 'marian-beachflower', { slot: 'S1' }, 'boss'); checkpoint(e, 'late Marian S1 packet end', rows);
  action(e, 'puppet-wavecatcher', { slot: 'S2' }, 'add');

  while (e.state.phase === 'battle') {
    const skip = e.getAvailableActions().find(item => item.enabled && item.type === 'skip_extra_actions');
    const guard = e.getAvailableActions().find(item => item.enabled && item.type === 'guard');
    if (!skip && !guard) break;
    const use = skip || guard;
    e.step({ type: use.type, skillId: use.skillId, targetId: e.actor.id });
  }
  checkpoint(e, 'final FDP', rows);
  const finalWavecatcher = e.state.party.find(unit => unit.slug === 'puppet-wavecatcher');
  const regularCatchAWaveCasts = Number(finalWavecatcher?.catchAWaveCount || 0);
  return { rows, finalScore: e.state.result?.score || e.state.score, finalFdp: e.state.scoreBreakdown.foeDefensePoints,
    turnScoreBuckets: structuredClone(e.state.scoreBreakdown.turnScoreBuckets || []),
    forcedResources: e.runnerForcedResources,
    damageByActor: Object.fromEntries(e.state.party.map(unit => [unit.slug || unit.id, unit.damageDone])),
    catchAWaveCasts: regularCatchAWaveCasts,
    specialCatchAWaveCasts: sourceMiyu && Number(finalWavecatcher?.awareness || 0) >= 2
      ? Math.floor(regularCatchAWaveCasts / 4) : 0,
    largestDamagePackets: e.state.log.filter(event => event.type === 'damage')
      .sort((left, right) => Number(right.amount || 0) - Number(left.amount || 0)).slice(0, 12)
      .map(event => ({ amount: event.amount, actorId: event.actorId, targetId: event.targetId,
        sourceType: event.sourceType, element: event.element, critical: event.critical, calculation: event.calculation })) };
}

const seeds = Array.from({ length: Number(process.argv.find(v => v.startsWith('--seeds='))?.split('=')[1] || 24) }, (_, i) => i + 1);
const runs = [];
for (const seed of seeds) {
  try { runs.push(play(seed)); }
  catch (error) { console.error(`Seed ${seed}: ${error.stack || error.message}`); process.exitCode = 1; break; }
}
if (runs.length === seeds.length) {
  const previousBySourceRun = new Map();
  const rows = runs[0].rows.map((row, index) => {
    const liveCheckpoint = LIVE_CHECKPOINTS.find(item => item.label === row.label);
    const live = liveCheckpoint?.score ?? null;
    const simulated = Math.round(runs.reduce((sum, run) => sum + run.rows[index].foeDefensePoints, 0) / runs.length);
    const previous = liveCheckpoint ? previousBySourceRun.get(liveCheckpoint.sourceRun) : null;
    const liveInterval = previous && live >= previous.live ? live - previous.live : null;
    const simulatedInterval = previous && simulated >= previous.simulated ? simulated - previous.simulated : null;
    const compared = { label: row.label, attackTurn: row.attackTurn, live, simulated, difference: live == null ? null : simulated - live,
      differencePercent: live == null ? null : (simulated / live - 1) * 100,
      liveSourceRun: liveCheckpoint?.sourceRun ?? null, liveCapturedAt: liveCheckpoint?.capturedAt ?? null,
      liveConfidence: liveCheckpoint?.confidence ?? null,
      intervalFrom: previous?.label ?? null, liveInterval, simulatedInterval,
      intervalDifference: liveInterval == null ? null : simulatedInterval - liveInterval,
      intervalRatio: liveInterval > 0 ? simulatedInterval / liveInterval : null };
    if (liveCheckpoint) previousBySourceRun.set(liveCheckpoint.sourceRun, { label: row.label, live, simulated });
    return compared;
  });
  const output = { seeds: seeds.length, liveFinalFdp: LIVE_FINAL_FDP, liveFinalScore: LIVE_FINAL_SCORE, rows,
    recordedLoadout: { wonderWeapon: 'Ice Age R6', jcMasks: ['mischief', 'service'],
      miyuWeapon: 'Mermaid Dreamer R6', miyuWeaponConfidence: 'inferred_from_supplied_A6R6_team_and_T2_stats' },
    alternateObservations: [{ label: 'T2 J&C S2 + Miyu', score: 5_024_634, sourceRun: 'supplied_screenshot' },
      { label: 'T2 Wonder Tarukaja + Miyu', score: 6_736_360, sourceRun: 'supplied_screenshot' }],
    wavecatcherSourceMechanics: sourceMiyu,
    simulatedTurnScoreBuckets: runs[0].turnScoreBuckets.map((bucket, index) => ({
      normalTurn: bucket.normalTurn,
      multiplier: bucket.multiplier,
      rawDamage: Math.round(runs.reduce((sum, run) => sum + run.turnScoreBuckets[index].rawDamage, 0) / runs.length),
      weightedPoints: Math.round(runs.reduce((sum, run) => sum + run.turnScoreBuckets[index].weightedPoints, 0) / runs.length)
    })),
    simulatedDamageByActor: Object.fromEntries(Object.keys(runs[0].damageByActor).map(actorId => [actorId,
      Math.round(runs.reduce((sum, run) => sum + run.damageByActor[actorId], 0) / runs.length)])),
    simulatedCatchAWaveCasts: runs[0].catchAWaveCasts,
    simulatedSpecialCatchAWaveCasts: runs[0].specialCatchAWaveCasts,
    forcedResources: runs[0].forcedResources,
    ...(diagnosticLedger ? { diagnosticCheckpoints: runs[0].rows } : {}),
    sampleLargestDamagePackets: runs[0].largestDamagePackets,
    simulatedFinalFdp: Math.round(runs.reduce((sum, run) => sum + run.finalFdp, 0) / runs.length),
    simulatedFinalScore: Math.round(runs.reduce((sum, run) => sum + run.finalScore, 0) / runs.length) };
  const outputPath = diagnosticLedger
    ? 'outputs/surt-mld-live-ledger-seed1.json'
    : 'outputs/surt-mld-live-replay-2026-09-20.json';
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.table(rows);
  console.log(output);
}
