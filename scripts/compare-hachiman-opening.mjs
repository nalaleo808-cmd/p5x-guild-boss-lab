import { CURRENT_MECHANICS_PROFILE } from '../src/engine.js';
import { ichigoStatsPreset } from '../src/default-presets.js';
import { calculateDreamscapeResult } from '../src/mode-scoring.js';
import {
  HachimanRecordedEngine, HACHIMAN_RECORDED_ROUTE, HACHIMAN_RECORDED_SEED, HACHIMAN_ROUTES, OBSERVED_STAT_EVIDENCE,
  createHachimanRecordedConfig, evidenceValue, legalActionDigest, performRouteAction, performSongCycle, required
} from '../src/hachiman-recorded-team.js';

const TURN_CHECKPOINTS = Object.freeze(['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8']);
const CHECKPOINTS = Object.freeze(['opening', ...TURN_CHECKPOINTS, 'all']);
const DEFAULT_SEED = HACHIMAN_RECORDED_SEED;
const clone = value => structuredClone(value);
const normalizeText = value => String(value || '').replace(/[–—]/g, '-');

// The shared recorded-team engine supplies the Rakunda, Auto-Mataru IV,
// Tarukaja scaling and Revelation set adapters. This subclass only records the
// damage formula trace for the comparison report.
class HachimanCheckpointEngine extends HachimanRecordedEngine {
  calculateDamage(actor, skill, target, sourceType = null) {
    const result = super.calculateDamage(actor, skill, target, sourceType);
    if (result.damageFormula && !skill.lovesickSnapshotCapture) {
      this.runnerDamageTrace ||= [];
      this.runnerDamageTrace.push({
        traceStatus: 'exact_engine_factors_provisional_inputs',
        traceLimitations: [
          'Factors are captured from this engine calculation without additional random draws.',
          'Encounter Defense, incomplete equipped stats and identified category placements remain provisional.',
          'Calculated packet damage precedes finite enemy HP clamping and is not game score.'
        ],
        action: skill.name,
        actor: actor.codename || actor.name,
        sourceType,
        target: target.name,
        listedPower: Number(skill.power || 0),
        ...clone(result.damageFormula),
        critical: result.critical,
        resultAmount: result.amount,
        actorBuffs: actor.buffs.map(compactBuff),
        targetDebuffs: target.debuffs.map(effect => ({
          id: effect.id,
          value: effect.value ?? null,
          stacks: effect.stacks ?? null,
          duration: effect.duration ?? null
        }))
      });
    }
    return result;
  }
}

function createEngine(seed = DEFAULT_SEED, highlightChargeRule = 'normal_weakness_cast_rates', lovesickTickModel = undefined, hachimanBaseDefense = undefined) {
  const { config, dionysus, vasuki, janosik, berryLoadout } = createHachimanRecordedConfig(seed, highlightChargeRule, { lovesickTickModel, hachimanBaseDefense });
  const engine = new HachimanCheckpointEngine(config);
  return { engine, dionysus, vasuki, janosik, berryLoadout };
}

function compactBuff(effect) {
  return {
    id: effect.id,
    stat: effect.stat || null,
    value: effect.value ?? null,
    duration: effect.duration ?? null,
    stacks: effect.stacks ?? null
  };
}

function partyResources(engine) {
  return engine.state.party.map(unit => ({
    id: unit.id,
    actor: unit.codename || unit.name,
    hp: unit.hp,
    maxHp: unit.maxHp,
    sp: unit.sp,
    maxSp: unit.maxSp,
    personalHighlight: unit.highlight,
    ammo: unit.ammo,
    facades: unit.facades ? [...unit.facades] : undefined,
    selectedMasks: unit.selectedMasks ? [...unit.selectedMasks] : undefined,
    trueDesireStacks: unit.trueDesireStacks,
    trueDesirePrimed: unit.trueDesirePrimed,
    chainsOfLove: unit.chainsOfLove,
    prescriptions: unit.midsummerPrescription,
    skillCooldowns: Object.fromEntries(Object.entries(unit.skillCooldowns || {}).filter(([, value]) => value > 0)),
    highlightCooldowns: Object.fromEntries(Object.entries(unit.highlightCooldowns || {}).filter(([, value]) => value > 0)),
    buffs: unit.buffs.map(compactBuff)
  }));
}

function shields(engine) {
  return [engine.state.boss, ...engine.state.boss.summons].map(enemy => ({
    id: enemy.id,
    name: enemy.name,
    alive: enemy.alive !== false,
    hp: enemy.finiteHp === false || enemy.scoreAttack ? 'infinity-target' : enemy.hp,
    downPoints: enemy.downPoints,
    downMax: enemy.downMax,
    downed: enemy.downed,
    debuffs: enemy.debuffs.map(effect => ({
      id: effect.id,
      value: effect.value ?? null,
      stacks: effect.stacks ?? null,
      duration: effect.duration ?? null
    }))
  }));
}

function navigatorResources(engine) {
  const navigator = engine.state.navigator;
  const cooldowns = Object.fromEntries(navigator.skills.map(skill => [
    skill.name,
    Number(navigator.cooldowns[skill.id] || 0)
  ]));
  const trackSkillCooldowns = navigator.skills
    .filter(skill => ['Feel the Beat', 'Clear Sound'].includes(skill.name))
    .map(skill => Number(navigator.cooldowns[skill.id] || 0));
  return {
    actor: navigator.codename || navigator.name,
    currentSong: navigator.currentSong || null,
    tracks: [...(navigator.tracks || [])],
    supportCooldown: trackSkillCooldowns.length ? Math.max(...trackSkillCooldowns) : null,
    cooldowns,
    lastUsedAttackTurn: navigator.lastUsedAttackTurn,
    uses: navigator.uses
  };
}

function eventSummary(event) {
  return {
    type: event.type,
    sourceType: event.sourceType || null,
    actorId: event.actorId || null,
    targetId: event.targetId || null,
    amount: event.amount ?? null,
    critical: event.critical ?? null,
    weakness: event.weakness ?? null,
    downPoints: event.downPoints ?? null,
    downMax: event.downMax ?? null,
    downed: event.downed ?? null,
    resource: event.resource || null,
    message: normalizeText(event.message)
  };
}

function isFollowUp(event) {
  return event.type === 'follow_up'
    || /follow|awareness|berry_repeat|one_more|all_out/.test(String(event.sourceType || ''));
}

function stateSummary(engine) {
  const concert = engine.state.navigator.virtualConcert;
  return {
    attackTurn: engine.state.attackTurn,
    attackTurnsLeft: engine.state.attackTurnsLeft,
    internalActionNumber: engine.state.actionNumber,
    currentActor: engine.actor?.codename || engine.actor?.name || null,
    currentActorId: engine.actor?.id || null,
    concert: {
      active: engine.isVirtualConcertActive(),
      roundsRemaining: Number(concert?.roundsRemaining || 0)
    },
    turnActionsUsed: engine.state.turnActionsUsed,
    turnActionsTotal: engine.state.turnActionsTotal,
    rawDamagePreview: engine.state.totalDamage,
    scoreEligibleDamagePreview: engine.state.scoreBreakdown.damagePreview,
    turnWeightedDamagePoints: engine.state.scoreBreakdown.turnWeightedDamagePoints,
    foeDefensePoints: engine.state.scoreBreakdown.foeDefensePoints,
    excludedTargetDamage: engine.state.totalDamage - engine.state.scoreBreakdown.damagePreview,
    gameScorePrediction: null,
    daisoujouDefeatStacks: engine.state.boss.daisoujouDefeatStacks ?? null,
    highlight: engine.getHighlightState(),
    partyResources: partyResources(engine),
    navigatorResources: navigatorResources(engine),
    shields: shields(engine),
    pendingFreeActions: (engine.state.sharedCombat?.pendingActions || []).map(action => ({
      type: action.type,
      name: action.name,
      enabled: action.enabled
    }))
  };
}

function actionStateSummary(engine) {
  const concert = engine.state.navigator.virtualConcert;
  return {
    attackTurn: engine.state.attackTurn,
    attackTurnsLeft: engine.state.attackTurnsLeft,
    internalActionNumber: engine.state.actionNumber,
    currentActor: engine.actor?.codename || engine.actor?.name || null,
    activePersona: engine.activePersona?.name || null,
    concert: {
      active: engine.isVirtualConcertActive(),
      roundsRemaining: Number(concert?.roundsRemaining || 0)
    },
    rawDamagePreview: engine.state.totalDamage,
    scoreEligibleDamagePreview: engine.state.scoreBreakdown.damagePreview,
    excludedTargetDamage: engine.state.totalDamage - engine.state.scoreBreakdown.damagePreview,
    highlight: engine.getHighlightState(),
    bossShield: `${engine.state.boss.downPoints}/${engine.state.boss.downMax}`,
    navigator: navigatorResources(engine),
    party: engine.state.party.map(unit => ({
      actor: unit.codename || unit.name,
      hp: unit.hp,
      sp: unit.sp,
      personalHighlight: unit.highlight,
      ammo: unit.ammo,
      facades: unit.facades ? [...unit.facades] : undefined,
      trueDesireStacks: unit.trueDesireStacks,
      chainsOfLove: unit.chainsOfLove,
      prescriptions: unit.midsummerPrescription
    }))
  };
}

function execute(engine, label, spec) {
  const before = actionStateSummary(engine);
  const { action, targetId, result } = performRouteAction(engine, label, spec);
  const events = (result.events || []).map(eventSummary);
  const after = actionStateSummary(engine);
  return {
    label,
    actorBefore: before.currentActor,
    action: action.name,
    type: action.type,
    targetId,
    consumedAction: result.consumedAction === true,
    freeAction: result.consumedAction === false,
    rawDamageDelta: after.rawDamagePreview - before.rawDamagePreview,
    scoreEligibleDamageDelta: after.scoreEligibleDamagePreview - before.scoreEligibleDamagePreview,
    before,
    after,
    events,
    shieldEvents: events.filter(event => ['down_damage', 'down', 'down_suppressed', 'enemy_recovered'].includes(event.type)),
    followUpEvents: (result.events || []).filter(isFollowUp).map(eventSummary)
  };
}

function executeSongCycle(engine, label, spec) {
  const before = actionStateSummary(engine);
  const { event } = performSongCycle(engine, label, spec);
  const after = actionStateSummary(engine);
  engine.state.lastEvents = [];
  return {
    label,
    actorBefore: before.currentActor,
    action: `Song: ${spec.expectedSong} to ${spec.nextSong}`,
    type: 'runner_song_cycle',
    targetId: 'self',
    consumedAction: false,
    freeAction: true,
    rawDamageDelta: 0,
    before,
    after,
    events: [eventSummary(event)],
    shieldEvents: [],
    followUpEvents: []
  };
}

const routeArgument = process.argv.find(value => value.startsWith('--route='));
const SELECTED_ROUTE = routeArgument?.slice('--route='.length) || 'recorded';
const CHECKPOINT_ACTIONS = HACHIMAN_ROUTES[SELECTED_ROUTE] || HACHIMAN_RECORDED_ROUTE;

function checkpoint(engine, name, actions, openingLogIndex = 0) {
  const allEvents = engine.state.log.slice(openingLogIndex);
  return {
    name,
    status: 'complete',
    state: stateSummary(engine),
    actions,
    followUpEvents: allEvents.filter(isFollowUp).map(eventSummary)
  };
}

function requestedCheckpoint(argv) {
  const raw = argv.find(argument => !argument.startsWith('-')) || 'T1';
  const lowered = raw.toLowerCase();
  const normalized = ['opening', 'all'].includes(lowered) ? lowered : raw.toUpperCase();
  if (!CHECKPOINTS.includes(normalized)) {
    throw new Error(`Unknown checkpoint ${raw}. Use opening, T1 through T8, or all.`);
  }
  return normalized;
}

function requestedSeed(argv) {
  const argument = argv.find(value => value.startsWith('--seed='));
  if (!argument) return DEFAULT_SEED;
  const seed = Number(argument.slice('--seed='.length));
  if (!Number.isInteger(seed) || seed < 1) throw new Error('Seed must be a positive integer.');
  return seed;
}

function main() {
  const argv = process.argv.slice(2);
  const requested = requestedCheckpoint(argv);
  const seed = requestedSeed(argv);
  const highlightRuleArgument = argv.find(value => value.startsWith('--highlight-rule='));
  const highlightChargeRule = highlightRuleArgument?.slice('--highlight-rule='.length) || 'normal_weakness_cast_rates';
  if (!['normal_weakness_cast_rates', 'base_double_weak_cast_bonus'].includes(highlightChargeRule)) {
    throw new Error('Unknown Highlight rule. Use normal_weakness_cast_rates or base_double_weak_cast_bonus.');
  }
  const baseDefenseArgument = argv.find(value => value.startsWith('--hachiman-base-def='));
  const hachimanBaseDefense = baseDefenseArgument ? Number(baseDefenseArgument.slice('--hachiman-base-def='.length)) : undefined;
  const lovesickTickArgument = argv.find(value => value.startsWith('--lovesick-tick='));
  const lovesickTickModel = lovesickTickArgument?.slice('--lovesick-tick='.length) || undefined;
  const { engine, dionysus, vasuki, janosik, berryLoadout } = createEngine(seed, highlightChargeRule, lovesickTickModel, hachimanBaseDefense);
  const report = {
    title: 'Hachiman live opening checkpoint comparison',
    generatedAt: new Date().toISOString(),
    requestedCheckpoint: requested,
    replayCoverage: {
      fullRecordedRouteImplemented: true,
      lastImplementedAction: 'T8 Berry S3 on Hachiman',
      recordedTurns: 'T1 through T8, including both Virtual Concert party rounds in T5 and T6.',
      completedCheckpointMeans: 'All scripted actions in that checkpoint resolved, not full live-run parity.',
      stopPolicy: 'Stop at the first illegal actor, action, song, resource, selected mask, Highlight, or Concert-context guard.',
      validationStatus: 'Inspect checkpoint status, guardFailure, action events, and shield events for actual progress.'
    },
    purpose: 'Deterministic damage and score estimate using confirmed Hachiman turn weights and difficulty multiplier, with provisional damage inputs.',
    configuration: {
      seed,
      seedSelection: seed === DEFAULT_SEED
        ? 'Default 8 is the first positive seed from a narrow 1-100 check whose J&C Gun roll is critical after the opening target-selection draw. It was not selected by score or total damage.'
        : 'Explicit CLI override. No outcome search was performed by this runner invocation.',
      mechanicsProfile: CURRENT_MECHANICS_PROFILE,
      route: SELECTED_ROUTE,
      lovesickTickModel: engine.config.hachimanLovesickTickModel,
      hachimanBaseDefense: engine.state.boss.baseDefense ?? null,
      hachimanEffectiveDefense: engine.state.boss.defense ?? null,
      damageStructure: 'skill_conditional_bonus_in_damage_bucket_2026-09-06',
      boss: 'Hachiman',
      mode: 'Multidimensional Dreamscape',
      encounterObservation: {
        source: 'HACHIMAN-ROTATION-CHECK-2026-09-05.md: Direct T8 Battle Intel reading',
        compositionEffectActive: true,
        foeFinalDamageTakenMultiplier: 1.2,
        foeFinalDamageDealtMultiplier: 0.4,
        scope: 'Recorded fixed-party setup; the general activation trigger remains unresolved.'
      },
      awareness: 'A6 for J&C, Wonder, Beachflower Marian, Ichigo Berry, and MIKU',
      partyOrder: engine.state.party.map(unit => unit.codename || unit.name),
      jcMasks: ['mischief', 'service'],
      wonderOpeningPersona: 'Dionysus',
      wonderWeapon: clone(engine.config.loadouts.wonder),
      dionysusEquipment: dionysus.equipment,
      wonderT1Persona: 'Vasuki after a free Persona switch',
      vasukiEquipment: vasuki.equipment,
      janosikEquipment: janosik.equipment,
      navigator: 'MIKU',
      marianRevelations: clone(engine.config.loadouts['lufel-recent-marian-beachflower']),
      sharedHighlight: engine.getHighlightState(),
      ichigoStatsPreset: {
        id: ichigoStatsPreset.id,
        statsMode: berryLoadout.statsMode,
        baseStats: clone(berryLoadout.baseStats),
        runnerOverride: { maxHp: evidenceValue('berry', 'maxHp'), reason: OBSERVED_STAT_EVIDENCE.berry.maxHp.evidence }
      },
      observedStatEvidence: clone(OBSERVED_STAT_EVIDENCE),
      effectiveOpeningStats: engine.state.party.map(unit => ({
        actor: unit.codename || unit.name,
        attack: unit.attack,
        defense: unit.defense,
        maxHp: unit.maxHp,
        maxSp: unit.maxSp,
        speed: unit.speed,
        critRate: unit.crit,
        critMultiplier: unit.critMult,
        statsMode: unit.statsMode || 'catalog-default'
      }))
    },
    runnerAdapters: [
      {
        name: 'Rakunda',
        reason: 'Vasuki and Janosik use the observed 42.7% Defense reduction tooltip, while the local transferable skill is reference-only.',
        behavior: 'This script supplies a 42.7% Defense reduction for 3 turns and uses the observed 22 SP cost for both Personas.'
      },
      {
        name: 'Janosik Tarukaja',
        reason: 'The recorded T6 cast provides the max-rank base, per-500-Attack scaling, cap, duration, and SP cost.',
        behavior: 'This script applies 17.1% plus 1.4% per 500 current Wonder Attack, capped at an additional 11.4%, for 3 turns and costs 22 SP.'
      },
      {
        name: dionysus.autoMataru.name,
        reason: 'The local catalog has a 9.8% party Attack tooltip but marks the passive reference-only.',
        behavior: 'This script applies 9.8% party Attack for 2 turns before opening passives.'
      },
      {
        name: 'MIKU Labor 4-set',
        reason: 'The user-confirmed Integrity + Labor navigator loadout has a sourced 4-set party HP/ATK/DEF +8% effect that the engine does not pass for navigators.',
        behavior: 'This script applies a permanent party Attack and Defense +8% buff before opening passives. HP is not re-applied because the observed maximum HP totals already include it.'
      },
      {
        name: 'J&C Reconcilation 4-set',
        reason: 'The user-confirmed Creation + Reconcilation loadout has a sourced 4-set in-combat HP/ATK/DEF +15% effect that is reference-only in the local catalog.',
        behavior: 'This script applies a permanent J&C Attack and Defense +15% buff before opening passives. HP is not re-applied because the observed maximum HP already includes it.'
      }
    ],
    knownOmissions: [
      'Dionysus trait effects are not modeled by the engine.',
      'Vasuki passive Stare, Serpent Bite, and Venomous Spiral continuous damage are not modeled by this checkpoint path.',
      'Universal Theoria has a sourced 33% party Attack and selected-ally 22% damage implementation; later checkpoint use remains unvalidated.',
      'Lovesick uses the sourced level-70+ 18% Attack per stack and four-turn duration, with application snapshots and S3 refresh. Highlight-trigger Pierce, first all-DOT critical behavior, capped-stack replacement, transfer snapshots and roll granularity remain provisional; see LOVESICK-FORMULA-EVIDENCE-2026-09-06.md.',
      'Berry starts with 180 maximum SP by user request on 2026-09-05; her original screenshot preset records 100 SP.',
      'Natural owner-turn SP recovery applies the guide-sourced base 10, including Concert turns. SP Recovery percentage modifiers remain unapplied pending normalization of their stored conventions.',
      'J&C, Wonder, Marian and Berry maximum HP use the directly observed T3 full-heal totals. J&C Attack, Damage Mult. and critical multiplier and Marian critical multiplier are sourced-cap lower bounds, not equipped totals; see configuration.observedStatEvidence. Wonder Attack and critical stats and the borrowed Berry Attack, critical and Pierce totals remain unsupplied. Marian starts with 180 maximum SP by user request on 2026-09-05.',
      'Unresolved buff residuals at the T3 snapshot: Two Masks as One showed +71.1% damage versus 51.1% x 1.20 = 61.3% at Desire Level 120, and every MIKU Feel the Beat value was 1.15x its level-13 cap (35.1%/30.5%, 25.3%/22%, 12.6%/11%). Neither residual is modeled.',
      'Hachiman uses confirmed turn score weights and x8 difficulty. The complete route uses its recorded 125,000 survival bonus; a general survival-bonus curve and actual ending trigger remain unverified.',
      'The simulator internal Action counter is not expected to match the game counter, which includes enemy actions.',
      'Shared Highlight starts from Marian Prosperity and uses user-confirmed ordinary action gains: 17%, or 21% on weakness. The old 93% checkpoint predates this correction; no new result is claimed without a replay.',
      'Virtual Concert doubles charge to 34% normally or 42% on weakness. Berry S1 kill-reset recasts also charge, per user correction. Other repeat/follow-up eligibility and historical 38% intervals remain unresolved.',
      'Wonder now carries the directly observed Cursed Ties profile. Evil Eye automatic application is omitted until its trigger granularity is verified; weapon component stats are not substituted for missing equipped Wonder totals.',
      'The route records the observed Janosik Persona cycles. Janosik Marked, Harmony activation, and visible Matarukaja IV reactivation remain unmodeled.',
      'The recorded live score allocations and missed individual hit frames are not used to force resources, damage, shields, cooldowns, or target state.',
      'If the engine diverges from a recorded checkpoint, the next guarded action may still be legal. The report exposes the simulated state after every action and stops only at the first illegal route action.'
    ],
    checkpoints: []
  };

  const openingEvents = engine.state.log.map(eventSummary);
  report.checkpoints.push({
    ...checkpoint(engine, 'opening', []),
    damageFormulaTrace: clone(engine.runnerDamageTrace || []),
    events: openingEvents,
    automaticOpeningResolved: engine.state.log.some(event => event.type === 'follow_up'
      && event.message.includes('automatically activated Two Masks'))
  });

  if (requested === 'opening') return report;

  const requestedTurnIndex = requested === 'all'
    ? TURN_CHECKPOINTS.length - 1
    : TURN_CHECKPOINTS.indexOf(requested);
  for (const name of TURN_CHECKPOINTS.slice(0, requestedTurnIndex + 1)) {
    const checkpointStart = engine.state.log.length;
    const damageTraceStart = engine.runnerDamageTrace?.length || 0;
    const actions = [];
    let activeLabel = null;
    try {
      for (const [label, spec] of CHECKPOINT_ACTIONS[name]) {
        activeLabel = label;
        actions.push(spec.kind === 'songCycle'
          ? executeSongCycle(engine, label, spec)
          : execute(engine, label, spec));
      }
      const completed = checkpoint(engine, name, actions, checkpointStart);
      completed.damageFormulaTrace = clone((engine.runnerDamageTrace || []).slice(damageTraceStart));
      report.checkpoints.push(completed);
    } catch (error) {
      const legalActions = error.actionDigest || legalActionDigest(engine);
      const guardFailure = {
        checkpoint: name,
        action: activeLabel,
        message: normalizeText(error.message),
        currentActorId: engine.actor?.id || null,
        currentActor: engine.actor?.codename || engine.actor?.name || null,
        concertActive: engine.isVirtualConcertActive(),
        activePersona: engine.activePersona?.name || null,
        highlight: engine.getHighlightState(),
        legalActions
      };
      report.replayCoverage.earliestIllegalCheckpoint = name;
      report.replayCoverage.earliestIllegalAction = activeLabel;
      report.checkpoints.push({
        name,
        status: 'blocked',
        message: guardFailure.message,
        guardFailure,
        legalActions,
        state: stateSummary(engine),
        damageFormulaTrace: clone((engine.runnerDamageTrace || []).slice(damageTraceStart)),
        actions
      });
      break;
    }
  }
  const bossDamagePreview = engine.state.scoreBreakdown.damagePreview;
  const difficultyBonus = engine.state.boss.difficultyBonus;
  const fullRouteComplete = report.checkpoints.at(-1)?.name === 'T8' && report.checkpoints.at(-1)?.status === 'complete';
  report.scoreComparison = {
    bossDamagePreview,
    turnWeightedDamagePoints: engine.state.scoreBreakdown.turnWeightedDamagePoints,
    foeDefensePoints: engine.state.scoreBreakdown.foeDefensePoints,
    turnScoreBuckets: clone(engine.state.scoreBreakdown.turnScoreBuckets || []),
    difficultyBonus,
    observedTurnsSurvivedBonus: fullRouteComplete ? 125000 : null,
    projectedFinalScore: fullRouteComplete ? calculateDreamscapeResult({
      foeDefensePoints: engine.state.scoreBreakdown.foeDefensePoints, turnsSurvivedBonus: 125000, difficultyBonus
    }) : null,
    actualRecordedFinalScore: 6101612096,
    status: 'simulated_score_with_confirmed_turn_multipliers',
    limitation: 'Applies user-confirmed normal-turn multipliers and x8 difficulty, plus the recorded six-turn survival bonus. Damage inputs remain provisional; fractional weighted points are rounded once at the cumulative total.'
  };
  return report;
}

function compactReport(report) {
  return {
    title: report.title,
    requestedCheckpoint: report.requestedCheckpoint,
    replayCoverage: report.replayCoverage,
    purpose: report.purpose,
    scoreComparison: report.scoreComparison,
    configuration: {
      seed: report.configuration.seed,
      seedSelection: report.configuration.seedSelection,
      mechanicsProfile: report.configuration.mechanicsProfile,
      boss: report.configuration.boss,
      mode: report.configuration.mode,
      encounterObservation: report.configuration.encounterObservation,
      partyOrder: report.configuration.partyOrder,
      wonderOpeningPersona: report.configuration.wonderOpeningPersona,
      wonderWeapon: report.configuration.wonderWeapon,
      wonderT1Persona: report.configuration.wonderT1Persona,
      jcMasks: report.configuration.jcMasks,
      janosikEquipment: report.configuration.janosikEquipment,
      sharedHighlight: report.configuration.sharedHighlight,
      marianRevelations: report.configuration.marianRevelations,
      ichigoStatsPreset: report.configuration.ichigoStatsPreset,
      observedStatEvidence: report.configuration.observedStatEvidence,
      effectiveOpeningStats: report.configuration.effectiveOpeningStats
    },
    runnerAdapters: report.runnerAdapters,
    knownOmissions: report.knownOmissions,
    checkpoints: report.checkpoints.map(checkpointRow => ({
      name: checkpointRow.name,
      status: checkpointRow.status,
      message: checkpointRow.message,
      state: checkpointRow.state ? {
        attackTurn: checkpointRow.state.attackTurn,
        attackTurnsLeft: checkpointRow.state.attackTurnsLeft,
        internalActionNumber: checkpointRow.state.internalActionNumber,
        currentActor: checkpointRow.state.currentActor,
        currentActorId: checkpointRow.state.currentActorId,
        concert: checkpointRow.state.concert,
        rawDamagePreview: checkpointRow.state.rawDamagePreview,
        scoreEligibleDamagePreview: checkpointRow.state.scoreEligibleDamagePreview,
        turnWeightedDamagePoints: checkpointRow.state.turnWeightedDamagePoints,
        foeDefensePoints: checkpointRow.state.foeDefensePoints,
        excludedTargetDamage: checkpointRow.state.excludedTargetDamage,
        daisoujouDefeatStacks: checkpointRow.state.daisoujouDefeatStacks,
        highlight: checkpointRow.state.highlight,
        navigatorResources: checkpointRow.state.navigatorResources,
        partyResources: checkpointRow.state.partyResources.map(unit => ({
          actor: unit.actor,
          hp: unit.hp,
          maxHp: unit.maxHp,
          sp: unit.sp,
          personalHighlight: unit.personalHighlight,
          ammo: unit.ammo,
          facades: unit.facades,
          trueDesireStacks: unit.trueDesireStacks,
          chainsOfLove: unit.chainsOfLove,
          prescriptions: unit.prescriptions,
          skillCooldowns: unit.skillCooldowns,
          highlightCooldowns: unit.highlightCooldowns
        })),
        shields: checkpointRow.state.shields.map(enemy => ({
          name: enemy.name,
          alive: enemy.alive,
          hp: enemy.hp,
          downPoints: enemy.downPoints,
          downMax: enemy.downMax,
          downed: enemy.downed
        }))
      } : null,
      guardFailure: checkpointRow.guardFailure,
      legalActions: checkpointRow.legalActions,
      actions: checkpointRow.actions?.map(action => ({
        label: action.label,
        actorBefore: action.actorBefore,
        action: action.action,
        targetId: action.targetId,
        consumedAction: action.consumedAction,
        freeAction: action.freeAction,
        rawDamageDelta: action.rawDamageDelta,
        scoreEligibleDamageDelta: action.scoreEligibleDamageDelta,
        after: action.after,
        events: action.events.filter(event => [
          'move', 'damage', 'debuff', 'resource', 'switch', 'runner_adapter',
          'navigator', 'buff', 'track', 'song', 'item', 'medicine',
          'down_damage', 'down', 'down_suppressed', 'enemy_recovered'
        ].includes(event.type)),
        shieldEvents: action.shieldEvents || [],
        followUpEvents: action.followUpEvents
      })) || [],
      followUpEvents: checkpointRow.followUpEvents || [],
      damageFormulaTrace: checkpointRow.damageFormulaTrace || []
    }))
  };
}

try {
  const report = main();
  const output = process.argv.includes('--compact') ? compactReport(report) : report;
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if (report.checkpoints.at(-1)?.status === 'blocked') process.exitCode = 2;
} catch (error) {
  process.stderr.write(`${normalizeText(error.stack || error.message)}\n`);
  process.exitCode = 1;
}
