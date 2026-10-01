import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSlaughterBenchmarkEngine } from './benchmark-slaughter.mjs';
import { CURRENT_MECHANICS_PROFILE, RECORDED_MECHANICS_PROFILE } from '../src/engine.js';

const DEFAULT_SEARCH_SEED = 20260829;
const DEFAULT_BATTLE_SEED = 808;
const actorKey = actor => actor.id === 'wonder' ? 'wonder' : actor.slug;
const clone = value => structuredClone(value);

function makeRandom(seed = DEFAULT_SEARCH_SEED) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

const pick = (list, random) => list[Math.floor(random() * list.length)];

function planEveryTurn(turnLimit, valueFactory) {
  return Object.fromEntries(Array.from({ length: turnLimit }, (_, index) => [index + 1, valueFactory(index + 1)]));
}

function initialCandidate(engine) {
  const marian = engine.state.party.find(unit => unit.slug === 'marian-beachflower');
  const miyu = engine.state.party.find(unit => unit.slug === 'puppet-wavecatcher');
  return {
    actions: {},
    jcMaskPair: ['mischief', 'service'],
    jcOpeningMask: 'service',
    jcHighlightMask: 'mischief',
    trueDesirePlan: [1, 1],
    breakTurn: 7,
    highlightTurns: Object.fromEntries(engine.state.party.map(unit => [
      unit.id,
      unit.id === 'wonder' ? 5 : unit.slug === 'marian-beachflower' ? 2 : unit.slug === 'puppet-wavecatcher' ? 3 : 7
    ])),
    navigatorPlan: { 2: 'Feel the Beat', 3: 'Clear Sound', 4: 'Feel the Beat', 7: 'Showstopper' },
    highlightBeforeNavigator: true,
    highlightTargetId: marian.id,
    medicinePlan: planEveryTurn(engine.state.boss.turnLimit, () => ({ name: engine.config.mechanicsProfile === RECORDED_MECHANICS_PROFILE ? 'Attack Tablet' : 'Attacker Tablet', targetId: miyu.id })),
    allyTargetId: miyu.id
  };
}

function searchModel(engine) {
  const pools = {};
  for (const unit of engine.state.party) {
    if (unit.slug === 'j-c') continue;
    const skills = unit.id === 'wonder' ? engine.activePersona.skills : unit.skills;
    pools[actorKey(unit)] = [...skills.map(skill => skill.name), 'Attack', 'Gun', 'Guard'];
  }
  const keys = [];
  for (let turn = 1; turn <= engine.state.boss.turnLimit; turn += 1) {
    for (const unit of engine.state.party) {
      if (unit.slug === 'j-c') continue;
      keys.push(`${actorKey(unit)}|${turn}|0`);
      if (unit.id === 'wonder') keys.push(`${actorKey(unit)}|${turn}|1`);
      keys.push(`${actorKey(unit)}|${turn}|concert2`);
      keys.push(`${actorKey(unit)}|${turn}|concert1`);
    }
  }
  return {
    pools,
    keys,
    turnLimit: engine.state.boss.turnLimit,
    partyIds: engine.state.party.map(unit => unit.id),
    navigatorNames: engine.state.navigator.skills.map(skill => skill.name),
    medicineNames: [
      engine.config.mechanicsProfile === RECORDED_MECHANICS_PROFILE ? 'Attack Tablet' : 'Attacker Tablet', 'Defender Tonic', 'Fighter Salve', 'DOT-Up',
      'Reso-Up', '1More-Up', 'HL-Up', 'Technica-Up'
    ],
    jcMaskPairs: [
      ['mischief', 'service'], ['mischief', 'absurdity'], ['mischief', 'luck'],
      ['service', 'absurdity'], ['service', 'luck'], ['absurdity', 'luck']
    ]
  };
}

function sortedEntries(value, numeric = false) {
  return Object.entries(value || {}).sort(([a], [b]) => numeric ? Number(a) - Number(b) : a.localeCompare(b));
}

function candidateSignature(candidate) {
  const medicinePlan = sortedEntries(candidate.medicinePlan, true).map(([turn, plan]) => [turn, plan?.name || null, plan?.targetId || null]);
  return JSON.stringify([
    sortedEntries(candidate.actions),
    candidate.jcMaskPair,
    candidate.jcOpeningMask,
    candidate.jcHighlightMask,
    candidate.trueDesirePlan || [candidate.trueDesireTurn],
    candidate.breakTurn,
    sortedEntries(candidate.highlightTurns),
    sortedEntries(candidate.navigatorPlan, true),
    candidate.highlightBeforeNavigator,
    candidate.highlightTargetId,
    medicinePlan,
    candidate.allyTargetId
  ]);
}

function chooseTarget(engine, action, candidate) {
  if (action.target === 'ally') return candidate.allyTargetId;
  if (['self', 'party', 'all_enemies'].includes(action.target)) return action.target;
  return engine.state.boss.id;
}

function highlightTarget(engine, action, candidate) {
  if (action.target === 'ally') return candidate.highlightTargetId || candidate.allyTargetId;
  if (['self', 'party', 'all_enemies'].includes(action.target)) return action.target;
  return engine.state.boss.id;
}

function availableHighlight(engine, candidate) {
  const eligible = engine.getHighlightActions().filter(action => action.enabled
    && engine.state.attackTurn >= (candidate.highlightTurns[action.actorId] || 9));
  const first = eligible[0];
  if (!first) return null;
  const firstActor = engine.state.party.find(unit => unit.id === first.actorId);
  if (firstActor?.slug !== 'j-c') return first;
  const desiredMask = candidate.jcMaskPair.includes(candidate.jcHighlightMask) ? candidate.jcHighlightMask : candidate.jcMaskPair[0];
  return eligible.find(action => action.actorId === first.actorId && action.skill.jcHighlightMask === desiredMask) || first;
}

function availableNavigator(engine, candidate) {
  const atTurnStart = engine.state.actorIndex === 0 && engine.state.turnActionsUsed === 0;
  if (!atTurnStart || engine.isVirtualConcertActive()) return null;
  const plannedName = candidate.navigatorPlan[engine.state.attackTurn];
  return engine.getNavigatorActions().find(action => action.enabled && action.name === plannedName) || null;
}

function desiredJcOpeningAction(engine, candidate, legal) {
  const actor = engine.actor;
  if (actor.slug !== 'j-c' || actor.jcMaskActionsTaken > 0) return null;
  const openingIndex = candidate.jcMaskPair.indexOf(candidate.jcOpeningMask);
  if (openingIndex < 0) return null;
  return legal.find(action => action.type === 'skill' && action.skill?.slot === `S${openingIndex + 1}`) || null;
}

function plannedMedicine(candidate, attackTurn) {
  if (candidate.medicinePlan) return candidate.medicinePlan[attackTurn] || null;
  if (candidate.medicineName && candidate.medicineName !== 'none') {
    return { name: candidate.medicineName, targetId: candidate.medicineTargetId || candidate.allyTargetId };
  }
  return null;
}

export function runCandidate(candidate, { fastMode = true, battleSeed = DEFAULT_BATTLE_SEED, mechanicsProfile = CURRENT_MECHANICS_PROFILE, turnLimit = null } = {}) {
  const engine = createSlaughterBenchmarkEngine({ fastMode, seed: battleSeed, jcMaskPair: candidate.jcMaskPair, mechanicsProfile, turnLimit });
  const trueDesirePlan = candidate.trueDesirePlan || [candidate.trueDesireTurn, candidate.trueDesireTurn];
  let trueDesireUseIndex = 0;
  let safety = 0;
  while (engine.state.phase === 'battle' && safety++ < 300) {
    if (engine.canToggleTrueDesire()) {
      // Uses beyond the plan follow Full Auto: spend as soon as Alt is offered.
      // The party-action recharge can return True Desire more than twice.
      const plannedTurn = trueDesireUseIndex < trueDesirePlan.length ? trueDesirePlan[trueDesireUseIndex] : 1;
      const scheduled = Number.isInteger(plannedTurn) && engine.state.attackTurn >= plannedTurn;
      if (engine.actor.trueDesirePrimed !== scheduled) {
        const activationStacksBefore = Number(engine.actor.trueDesireStacks || 0);
        engine.setTrueDesire(scheduled);
        if (Number(engine.actor.trueDesireStacks || 0) < activationStacksBefore) trueDesireUseIndex += 1;
        continue;
      }
    }
    if (engine.canBreakBoss() && engine.state.attackTurn >= candidate.breakTurn) {
      engine.stepBreak();
      continue;
    }

    const medicinePlan = plannedMedicine(candidate, engine.state.attackTurn);
    const medicine = medicinePlan
      ? engine.getMedicineActions().find(action => action.name === medicinePlan.name || (medicinePlan.name === 'Attack Tablet' && action.id === 'attack_tablet'))
      : null;
    if (medicine) {
      engine.stepMedicine(medicine.id, medicinePlan.targetId || candidate.allyTargetId);
      continue;
    }

    const highlight = availableHighlight(engine, candidate);
    const navigator = availableNavigator(engine, candidate);
    if (candidate.highlightBeforeNavigator && highlight) {
      engine.stepHighlight(highlight.skillId, highlightTarget(engine, highlight, candidate));
      continue;
    }
    if (navigator) {
      engine.stepNavigator(navigator.id);
      continue;
    }
    if (highlight) {
      engine.stepHighlight(highlight.skillId, highlightTarget(engine, highlight, candidate));
      continue;
    }

    const actor = engine.actor;
    const actionContext = engine.isVirtualConcertActive() ? `concert${engine.state.navigator.virtualConcert.roundsRemaining}` : engine.state.turnActionsUsed;
    const key = `${actorKey(actor)}|${engine.state.attackTurn}|${actionContext}`;
    const legal = engine.getAvailableActions().filter(action => action.enabled && action.type !== 'switch');
    const opening = desiredJcOpeningAction(engine, candidate, legal);
    const desired = actor.slug === 'j-c' ? null : candidate.actions[key];
    const action = opening || legal.find(item => item.name === desired) || engine.recommend() || legal[0];
    if (!action) break;
    const trueDesireStacksBefore = Number(actor.trueDesireStacks || 0);
    engine.step({ type: action.type, skillId: action.skillId, targetId: chooseTarget(engine, action, candidate) });
    if (Number(actor.trueDesireStacks || 0) < trueDesireStacksBefore) trueDesireUseIndex += 1;
  }
  if (safety >= 300 && engine.state.phase === 'battle') throw new Error('Candidate replay exceeded the 300-step safety limit');
  return engine;
}

function mutate(parent, model, random, strength = 1) {
  const child = clone(parent);
  for (let change = 0; change < strength; change += 1) {
    const roll = random();
    if (roll < 0.56) {
      const key = pick(model.keys, random);
      const actor = key.split('|')[0];
      child.actions[key] = pick(model.pools[actor], random);
    } else if (roll < 0.66) {
      child.highlightTurns[pick(model.partyIds, random)] = 1 + Math.floor(random() * model.turnLimit);
    } else if (roll < 0.75) {
      const turn = 1 + Math.floor(random() * model.turnLimit);
      const name = pick([null, ...model.navigatorNames], random);
      if (name === null) delete child.navigatorPlan[turn];
      else child.navigatorPlan[turn] = name;
    } else if (roll < 0.79) {
      child.highlightBeforeNavigator = !child.highlightBeforeNavigator;
    } else if (roll < 0.83) {
      child.highlightTargetId = pick(model.partyIds, random);
    } else if (roll < 0.9) {
      const turn = 1 + Math.floor(random() * model.turnLimit);
      const name = pick([null, ...model.medicineNames], random);
      if (name === null) delete child.medicinePlan[turn];
      else child.medicinePlan[turn] = { name, targetId: pick(model.partyIds, random) };
    } else if (roll < 0.92) {
      child.allyTargetId = pick(model.partyIds, random);
    } else if (roll < 0.945) {
      child.jcMaskPair = clone(pick(model.jcMaskPairs, random));
    } else if (roll < 0.965) {
      child.jcOpeningMask = pick(child.jcMaskPair, random);
    } else if (roll < 0.98) {
      child.jcHighlightMask = pick(child.jcMaskPair, random);
    } else if (roll < 0.99) {
      const useIndex = Math.floor(random() * child.trueDesirePlan.length);
      child.trueDesirePlan[useIndex] = pick([null, ...Array.from({ length: model.turnLimit }, (_, index) => index + 1)], random);
    } else {
      child.breakTurn = 2 + Math.floor(random() * (model.turnLimit - 1));
    }
  }
  if (!child.jcMaskPair.includes(child.jcOpeningMask)) child.jcOpeningMask = child.jcMaskPair[0];
  if (!child.jcMaskPair.includes(child.jcHighlightMask)) child.jcHighlightMask = child.jcMaskPair[0];
  return child;
}

function coordinateRefine(start, model, evaluate, maxPasses = 3) {
  let best = clone(start);
  let bestScore = evaluate(best);
  for (let pass = 0; pass < maxPasses; pass += 1) {
    let improved = false;
    const tryCandidate = candidate => {
      const score = evaluate(candidate);
      if (score <= bestScore) return;
      best = clone(candidate);
      bestScore = score;
      improved = true;
    };

    for (const key of model.keys) {
      const actor = key.split('|')[0];
      for (const actionName of [null, ...model.pools[actor]]) {
        const candidate = clone(best);
        if (actionName === null) delete candidate.actions[key];
        else candidate.actions[key] = actionName;
        tryCandidate(candidate);
      }
    }
    for (const actorId of model.partyIds) {
      for (let turn = 1; turn <= model.turnLimit; turn += 1) {
        const candidate = clone(best);
        candidate.highlightTurns[actorId] = turn;
        tryCandidate(candidate);
      }
    }
    for (let turn = 1; turn <= model.turnLimit; turn += 1) {
      for (const name of [null, ...model.navigatorNames]) {
        const candidate = clone(best);
        if (name === null) delete candidate.navigatorPlan[turn];
        else candidate.navigatorPlan[turn] = name;
        tryCandidate(candidate);
      }
    }
    for (const setting of [true, false]) {
      const candidate = clone(best);
      candidate.highlightBeforeNavigator = setting;
      tryCandidate(candidate);
    }
    for (const targetId of model.partyIds) {
      const candidate = clone(best);
      candidate.highlightTargetId = targetId;
      tryCandidate(candidate);
    }
    for (let turn = 1; turn <= model.turnLimit; turn += 1) {
      for (const name of [null, ...model.medicineNames]) {
        const candidate = clone(best);
        if (name === null) delete candidate.medicinePlan[turn];
        else candidate.medicinePlan[turn] = { name, targetId: candidate.medicinePlan[turn]?.targetId || candidate.allyTargetId };
        tryCandidate(candidate);
      }
      for (const targetId of model.partyIds) {
        if (!best.medicinePlan[turn]) break;
        const candidate = clone(best);
        candidate.medicinePlan[turn].targetId = targetId;
        tryCandidate(candidate);
      }
    }
    for (const targetId of model.partyIds) {
      const candidate = clone(best);
      candidate.allyTargetId = targetId;
      tryCandidate(candidate);
    }
    for (const pair of model.jcMaskPairs) {
      const candidate = clone(best);
      candidate.jcMaskPair = clone(pair);
      if (!pair.includes(candidate.jcOpeningMask)) candidate.jcOpeningMask = pair[0];
      if (!pair.includes(candidate.jcHighlightMask)) candidate.jcHighlightMask = pair[0];
      tryCandidate(candidate);
    }
    for (const mask of best.jcMaskPair) {
      const openingCandidate = clone(best);
      openingCandidate.jcOpeningMask = mask;
      tryCandidate(openingCandidate);
      const highlightCandidate = clone(best);
      highlightCandidate.jcHighlightMask = mask;
      tryCandidate(highlightCandidate);
    }
    for (let useIndex = 0; useIndex < best.trueDesirePlan.length; useIndex += 1) {
      for (const turn of [null, ...Array.from({ length: model.turnLimit }, (_, index) => index + 1)]) {
        const candidate = clone(best);
        candidate.trueDesirePlan[useIndex] = turn;
        tryCandidate(candidate);
      }
    }
    for (let turn = 2; turn <= model.turnLimit; turn += 1) {
      const candidate = clone(best);
      candidate.breakTurn = turn;
      tryCandidate(candidate);
    }
    if (!improved) break;
  }
  return { candidate: best, score: bestScore };
}

function summarize(engine, candidate) {
  const result = engine.state.result;
  const followUps = engine.state.log.filter(event => event.type === 'damage' && event.sourceType === 'resonance_follow_up');
  let activeConcertRound = null;
  const rotation = engine.state.history.slice(1).map(frame => {
    const actorId = frame.events.find(event => event.actorId)?.actorId || null;
    const actor = engine.state.party.find(unit => unit.id === actorId);
    const concertStarted = frame.events.some(event => event.type === 'concert_start');
    const concertEnded = frame.events.some(event => event.type === 'concert_end');
    const rowConcertRound = activeConcertRound;
    const row = {
      attackTurn: frame.events[0]?.attackTurn || frame.attackTurn,
      actionNumber: frame.actionNumber,
      actorId,
      actor: actor?.codename || (frame.label.startsWith('Navigator') ? 'MIKU' : actorId),
      action: frame.label,
      targetIds: [...new Set(frame.events.map(event => event.targetId).filter(Boolean))],
      actionContext: concertStarted ? 'concert-start' : rowConcertRound ? `concert-${rowConcertRound}` : 'normal',
      concertRound: rowConcertRound,
      score: frame.score,
      totalDamage: frame.totalDamage,
      freeAction: frame.label.startsWith('Navigator') || frame.label.includes('Highlight') || frame.label.startsWith('Medicine') || frame.label === 'Break HP Lock' || frame.label.startsWith('True Desire')
    };
    if (concertStarted) activeConcertRound = 1;
    if (rowConcertRound && actor?.slug === 'j-c' && !row.freeAction && frame.actorIndex === 0) activeConcertRound += 1;
    if (concertEnded) activeConcertRound = null;
    return row;
  });
  return {
    score: result.score,
    totalDamage: engine.state.totalDamage,
    scoreBreakdown: result.scoreBreakdown,
    followUpHits: followUps.length,
    followUpDamage: followUps.reduce((sum, event) => sum + event.amount, 0),
    candidate: clone(candidate),
    rotation
  };
}

export function replayCandidate(candidate, { battleSeed = DEFAULT_BATTLE_SEED, mechanicsProfile = CURRENT_MECHANICS_PROFILE, turnLimit = null } = {}) {
  const fastEngine = runCandidate(candidate, { fastMode: true, battleSeed, mechanicsProfile, turnLimit });
  const fullEngine = runCandidate(candidate, { fastMode: false, battleSeed, mechanicsProfile, turnLimit });
  const fastScore = fastEngine.state.result.score;
  const fullScore = fullEngine.state.result.score;
  if (fastScore !== fullScore) {
    throw new Error(`Fast/full replay mismatch for battle seed ${battleSeed}: ${fastScore} versus ${fullScore}`);
  }
  return {
    battleSeed,
    mechanicsProfile,
    ...(turnLimit ? { turnLimit } : {}),
    fastScore,
    fullScore,
    parity: true,
    result: summarize(fullEngine, candidate)
  };
}

function positiveInteger(value, name, { allowZero = false } = {}) {
  if (!Number.isInteger(value) || value < (allowZero ? 0 : 1)) throw new Error(`${name} must be ${allowZero ? 'a non-negative' : 'a positive'} integer`);
  return value;
}

export function optimizeSlaughter({
  generations = 45,
  populationSize = 700,
  eliteCount = 45,
  refinePasses = 3,
  searchSeed = DEFAULT_SEARCH_SEED,
  battleSeed = DEFAULT_BATTLE_SEED,
  mechanicsProfile = CURRENT_MECHANICS_PROFILE,
  turnLimit = null
} = {}) {
  positiveInteger(generations, 'generations', { allowZero: true });
  positiveInteger(populationSize, 'populationSize');
  positiveInteger(eliteCount, 'eliteCount');
  positiveInteger(refinePasses, 'refinePasses', { allowZero: true });
  positiveInteger(searchSeed, 'searchSeed', { allowZero: true });
  positiveInteger(battleSeed, 'battleSeed', { allowZero: true });
  if (turnLimit != null) positiveInteger(turnLimit, 'turnLimit');
  if (eliteCount > populationSize) throw new Error('eliteCount cannot exceed populationSize');

  const random = makeRandom(searchSeed);
  const seedEngine = createSlaughterBenchmarkEngine({ fastMode: true, seed: battleSeed, mechanicsProfile, turnLimit });
  const model = searchModel(seedEngine);
  const baseline = initialCandidate(seedEngine);
  const cache = new Map();
  const evaluate = candidate => {
    const signature = candidateSignature(candidate);
    if (!cache.has(signature)) cache.set(signature, runCandidate(candidate, { fastMode: true, battleSeed, mechanicsProfile, turnLimit }).state.result.score);
    return cache.get(signature);
  };

  let population = [baseline];
  while (population.length < populationSize) population.push(mutate(baseline, model, random, 1 + Math.floor(random() * 5)));
  let best = baseline;
  let bestScore = evaluate(best);
  const progress = [];

  for (let generation = 0; generation < generations; generation += 1) {
    const ranked = population.map(candidate => ({ candidate, score: evaluate(candidate) }))
      .sort((a, b) => b.score - a.score);
    if (ranked[0].score > bestScore) {
      best = clone(ranked[0].candidate);
      bestScore = ranked[0].score;
      progress.push({ generation, score: bestScore });
    }
    const elites = ranked.slice(0, eliteCount).map(item => item.candidate);
    population = [best];
    for (const elite of elites) {
      if (population.length >= populationSize) break;
      if (candidateSignature(elite) !== candidateSignature(best)) population.push(elite);
    }
    while (population.length < populationSize) {
      const parent = pick(elites, random);
      const strength = random() < 0.7 ? 1 + Math.floor(random() * 3) : 4 + Math.floor(random() * 7);
      population.push(mutate(parent, model, random, strength));
    }
  }

  const refined = coordinateRefine(best, model, evaluate, refinePasses);
  if (refined.score > bestScore) {
    best = refined.candidate;
    bestScore = refined.score;
    progress.push({ generation: generations, score: bestScore, phase: 'coordinate-refine' });
  }

  const baselineReplay = replayCandidate(baseline, { battleSeed, mechanicsProfile, turnLimit });
  const bestReplay = replayCandidate(best, { battleSeed, mechanicsProfile, turnLimit });
  if (bestReplay.fastScore !== bestScore) throw new Error(`Cached search score ${bestScore} did not match replay score ${bestReplay.fastScore}`);
  return {
    metadata: {
      schemaVersion: 2,
      mechanicsProfile,
      resultKind: 'best-searched-not-global-optimum',
      mode: 'Nexus of Dreams',
      boss: 'Slaughter Drive',
      fixedTeam: ['Wonder', 'MARIAN Beachflower', 'PUPPET Wavecatcher', 'J&C'],
      navigator: 'MIKU',
      recordedBenchmarkScore: 3642530108,
      autoBaselineScore: baselineReplay.fullScore,
      searchPolicy: 'seeded genetic search followed by coordinate refinement'
    },
    search: { searchSeed, battleSeed, generations, populationSize, eliteCount, refinePasses, mechanicsProfile, ...(turnLimit ? { turnLimit } : {}) },
    baseline: baselineReplay.result,
    optimized: bestReplay.result,
    replayParity: { baseline: baselineReplay.parity, optimized: bestReplay.parity },
    scoreGain: bestReplay.fullScore - baselineReplay.fullScore,
    scoreGainPercent: (bestReplay.fullScore / baselineReplay.fullScore - 1) * 100,
    candidatesEvaluated: cache.size,
    progress
  };
}

function publicResult(result) {
  return {
    metadata: result.metadata,
    search: result.search,
    baseline: {
      score: result.baseline.score,
      scoreBreakdown: result.baseline.scoreBreakdown,
      candidate: result.baseline.candidate,
      rotation: result.baseline.rotation
    },
    optimized: {
      score: result.optimized.score,
      totalDamage: result.optimized.totalDamage,
      scoreBreakdown: result.optimized.scoreBreakdown,
      followUpHits: result.optimized.followUpHits,
      followUpDamage: result.optimized.followUpDamage,
      candidate: result.optimized.candidate,
      rotation: result.optimized.rotation
    },
    replayParity: result.replayParity,
    scoreGain: result.scoreGain,
    scoreGainPercent: result.scoreGainPercent,
    candidatesEvaluated: result.candidatesEvaluated,
    progress: result.progress
  };
}

function parseCliArgs(args) {
  const options = {};
  let replayPath = null;
  let outputPath = null;
  const numberOptions = new Map([
    ['--generations', 'generations'], ['--population', 'populationSize'], ['--elite', 'eliteCount'],
    ['--refine-passes', 'refinePasses'], ['--search-seed', 'searchSeed'], ['--battle-seed', 'battleSeed'],
    ['--turn-limit', 'turnLimit']
  ]);
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (numberOptions.has(flag)) {
      const value = Number(args[++index]);
      if (!Number.isInteger(value)) throw new Error(`${flag} requires an integer`);
      options[numberOptions.get(flag)] = value;
    } else if (flag === '--mechanics-profile') {
      options.mechanicsProfile = args[++index];
      if (![CURRENT_MECHANICS_PROFILE, RECORDED_MECHANICS_PROFILE].includes(options.mechanicsProfile)) throw new Error('--mechanics-profile requires a supported version');
    } else if (flag === '--replay') {
      replayPath = args[++index];
      if (!replayPath) throw new Error('--replay requires a JSON file path');
    } else if (flag === '--output') {
      outputPath = args[++index];
      if (!outputPath) throw new Error('--output requires a JSON file path');
    } else {
      throw new Error(`Unknown option: ${flag}`);
    }
  }
  return { options, replayPath, outputPath };
}

function candidateFromDocument(document) {
  return document?.optimized?.candidate || document?.candidate || document;
}

function runCli(args) {
  const { options, replayPath, outputPath } = parseCliArgs(args);
  let output;
  if (replayPath) {
    const document = JSON.parse(readFileSync(resolve(replayPath), 'utf8'));
    const replay = replayCandidate(candidateFromDocument(document), {
      battleSeed: options.battleSeed ?? document?.search?.battleSeed ?? document?.battleSeed ?? DEFAULT_BATTLE_SEED,
      mechanicsProfile: options.mechanicsProfile ?? document?.metadata?.mechanicsProfile ?? document?.search?.mechanicsProfile ?? document?.mechanicsProfile ?? (document?.metadata?.schemaVersion === 1 ? RECORDED_MECHANICS_PROFILE : CURRENT_MECHANICS_PROFILE),
      turnLimit: options.turnLimit ?? document?.search?.turnLimit ?? document?.turnLimit ?? null
    });
    output = {
      mode: 'replay',
      battleSeed: replay.battleSeed,
      mechanicsProfile: replay.mechanicsProfile,
      ...(replay.turnLimit ? { turnLimit: replay.turnLimit } : {}),
      fastScore: replay.fastScore,
      fullScore: replay.fullScore,
      parity: replay.parity,
      optimized: replay.result
    };
  } else {
    output = publicResult(optimizeSlaughter(options));
  }
  const json = `${JSON.stringify(output, null, 2)}\n`;
  if (outputPath) {
    const resolvedOutputPath = resolve(outputPath);
    writeFileSync(resolvedOutputPath, json, 'utf8');
    const summary = replayPath
      ? { outputPath: resolvedOutputPath, mode: output.mode, score: output.fullScore, parity: output.parity }
      : { outputPath: resolvedOutputPath, score: output.optimized.score, baseline: output.baseline.score, candidatesEvaluated: output.candidatesEvaluated, replayParity: output.replayParity };
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } else {
    process.stdout.write(json);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) runCli(process.argv.slice(2));
