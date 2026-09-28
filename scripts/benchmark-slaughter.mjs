import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BattleEngine, CURRENT_MECHANICS_PROFILE, RECORDED_MECHANICS_PROFILE } from '../src/engine.js';
import { recordedNightmareBenchmark } from '../src/data.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';

const character = slug => lufelCatalog.characters.find(unit => unit.slug === slug);
const recordedTeam = [character('marian-beachflower'), character('puppet-wavecatcher'), character('j-c')].map(record => ({
  ...record,
  actionLimit: 1,
  maxAmmo: 8,
  gunPower: 0.56,
  portrait: (record.codename || record.name || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 1).toUpperCase() || '?'
}));
const miku = character('miku');

const recordedPersona = {
  id: 'recorded-sahimochi', name: 'Sahimochi-no-kami', element: 'ice', arcana: 'Ruler', trait: 'Swift Returner',
  skills: [
    {
      id: 'recorded-one-fathom-fang', slot: 'S1', name: 'One-Fathom Fang', element: 'ice', cost: 22,
      power: 1.1, target: 'all_enemies', debuff: { id: 'ice_vuln', name: 'ICE DAMAGE TAKEN', value: 0.088, duration: 2 },
      note: 'Recorded skill: Ice damage and 8.8% Ice damage taken for 2 turns.'
    },
    {
      id: 'recorded-maziodyne', slot: 'S2', name: 'Maziodyne', element: 'electric', cost: 21,
      power: 0.669, target: 'all_enemies', note: 'Electric damage for the recorded weakness.'
    },
    {
      id: 'recorded-revolution', slot: 'S3', name: 'Revolution', element: 'support', cost: 22,
      power: 0, target: 'party', buff: { id: 'revolution', name: 'CRIT RATE UP', stat: 'critRate', value: 0.065, duration: 3 },
      note: 'Recorded party critical rate setup skill.'
    }
  ]
};

const navigatorMiku = {
  ...miku,
  id: 'navigator-miku-benchmark',
  skills: miku.skills.map((skill, index) => ({
    ...skill, id: `navigator-miku-benchmark-${index + 1}`, power: 0,
    cooldown: skill.cooldown || 4, note: skill.description || skill.note
  }))
};

function actionByName(engine, name) {
  return engine.getAvailableActions().find(action => action.enabled && action.name === name);
}

function strongestAction(engine) {
  const actions = engine.getAvailableActions().filter(action => action.enabled && action.type !== 'switch');
  return actions.sort((a, b) => (b.skill?.power || 0) - (a.skill?.power || 0))[0];
}

function benchmarkAction(engine) {
  const actor = engine.actor;
  if (actor.id === 'wonder') {
    if ([1, 5, 7].includes(engine.state.attackTurn)) return actionByName(engine, 'One-Fathom Fang') || strongestAction(engine);
    if (engine.state.attackTurn === 2) return actionByName(engine, 'Revolution') || strongestAction(engine);
    return actionByName(engine, 'Maziodyne') || strongestAction(engine);
  }
  if (actor.slug === 'marian-beachflower') {
    if (engine.state.attackTurn === 1) return actionByName(engine, 'Gentle Sea Breeze') || strongestAction(engine);
    return actionByName(engine, 'Beach Basket') || strongestAction(engine);
  }
  if (actor.slug === 'puppet-wavecatcher') {
    if (engine.state.attackTurn === 7 && !actor.surfActive) return actionByName(engine, 'Paddle Out') || strongestAction(engine);
    if (engine.state.attackTurn === 8 && actor.surfActive) return actionByName(engine, 'Aerial Tide') || strongestAction(engine);
    return actionByName(engine, 'Jellyfish Splash') || strongestAction(engine);
  }
  if (actor.slug === 'j-c') return engine.recommend() || strongestAction(engine);
  return strongestAction(engine);
}

function targetFor(engine, action) {
  if (action.target === 'ally') return engine.state.party.find(unit => unit.slug === 'puppet-wavecatcher')?.id || engine.actor.id;
  if (action.target === 'self' || action.target === 'party' || action.target === 'all_enemies') return action.target;
  return engine.state.boss.id;
}

function recordedMikuAction(engine) {
  if (engine.state.actorIndex !== 0 || engine.state.turnActionsUsed !== 0 || engine.isVirtualConcertActive()) return null;
  const plannedName = ({ 2: 'Feel the Beat', 3: 'Clear Sound', 4: 'Feel the Beat', 7: 'Showstopper' })[engine.state.attackTurn];
  return engine.getNavigatorActions().find(action => action.enabled && action.name === plannedName) || null;
}

export function createSlaughterBenchmarkEngine({ seed = 808, wavecatcherFollowUps = true, fastMode = false, jcMaskPair = ['mischief', 'absurdity'], mechanicsProfile = RECORDED_MECHANICS_PROFILE, turnLimit = null } = {}) {
  return new BattleEngine({
    seed, bossId: 'slaughter_drive', mechanicsProfile, turnLimit,
    characterDefinitions: recordedTeam,
    teamIds: ['wonder', ...recordedTeam.map(unit => unit.id)],
    personaDefinitions: [recordedPersona], personaIds: [recordedPersona.id],
    navigatorDefinition: navigatorMiku,
    jcMaskPair,
    wavecatcherFollowUps,
    fastMode
  });
}

export function runSlaughterBenchmark({ seed = 808, wavecatcherFollowUps = true, useRecommendedPolicy = false } = {}) {
  const engine = createSlaughterBenchmarkEngine({ seed, wavecatcherFollowUps });
  let safety = 0;
  while (engine.state.phase === 'battle' && safety++ < 250) {
    if (engine.canToggleTrueDesire() && !engine.actor.trueDesirePrimed) {
      engine.setTrueDesire(true);
      continue;
    }
    if (engine.canBreakBoss() && engine.state.attackTurn >= 7) {
      engine.stepBreak();
      continue;
    }
    const medicine = engine.actor.medicineUses < 1
      ? engine.getMedicineActions().find(action => action.id === 'fighter_salve')
      : null;
    if (medicine) {
      const miyu = engine.state.party.find(unit => unit.slug === 'puppet-wavecatcher');
      engine.stepMedicine(medicine.id, miyu.id);
    }
    if (engine.isBossWeakened()) {
      const usedActors = new Set();
      for (const highlight of engine.getHighlightActions().filter(action => action.enabled)) {
        if (usedActors.has(highlight.actorId)) continue;
        usedActors.add(highlight.actorId);
        engine.stepHighlight(highlight.skillId, engine.state.boss.id);
      }
    }
    const navigatorAction = recordedMikuAction(engine);
    if (navigatorAction) {
      engine.stepNavigator(navigatorAction.id);
      continue;
    }
    const action = useRecommendedPolicy ? engine.recommend() : benchmarkAction(engine);
    if (!action) break;
    engine.step({ type: action.type, skillId: action.skillId, targetId: targetFor(engine, action) });
  }
  const followUpEvents = engine.state.log.filter(event => event.type === 'damage' && event.sourceType === 'resonance_follow_up');
  const followUpDamage = followUpEvents.reduce((sum, event) => sum + event.amount, 0);
  const scoreError = engine.state.result.score - recordedNightmareBenchmark.finalScore;
  return {
    result: engine.getObservation(),
    metrics: {
      mechanicsProfile: engine.config.mechanicsProfile,
      score: engine.state.result.score,
      recordedScore: recordedNightmareBenchmark.finalScore,
      scoreError,
      scoreErrorPercent: scoreError / recordedNightmareBenchmark.finalScore * 100,
      totalDamage: engine.state.totalDamage,
      followUpHits: followUpEvents.length,
      followUpDamage,
      scoreBreakdown: engine.state.result.scoreBreakdown
    }
  };
}

export function runOptimizedSlaughter({ seed = 808, mechanicsProfile = CURRENT_MECHANICS_PROFILE } = {}) {
  const engine = createSlaughterBenchmarkEngine({ seed, jcMaskPair: ['mischief', 'service'], mechanicsProfile });
  let safety = 0;
  while (engine.state.phase === 'battle' && safety++ < 300) {
    if (engine.canToggleTrueDesire() && !engine.actor.trueDesirePrimed) {
      engine.setTrueDesire(true);
      continue;
    }
    if (engine.canBreakBoss() && engine.state.attackTurn >= 7) {
      engine.stepBreak();
      continue;
    }

    const medicine = engine.getMedicineActions().find(action => action.id === 'attack_tablet');
    if (medicine) {
      const miyu = engine.state.party.find(unit => unit.slug === 'puppet-wavecatcher');
      engine.stepMedicine(medicine.id, miyu.id);
      continue;
    }

    const navigatorAction = recordedMikuAction(engine);

    const highlightActions = engine.getHighlightActions();
    const highlightThreshold = actorId => {
      const unit = engine.state.party.find(candidate => candidate.id === actorId);
      if (unit?.id === 'wonder') return 5;
      if (unit?.slug === 'puppet-wavecatcher') return 3;
      if (unit?.slug === 'marian-beachflower') return 2;
      return 7;
    };
    const eligibleHighlights = highlightActions.filter(action => action.enabled && engine.state.attackTurn >= highlightThreshold(action.actorId));
    const firstHighlight = eligibleHighlights[0];
    const highlight = firstHighlight?.skill.jcHighlightMask
      ? eligibleHighlights.find(action => action.actorId === firstHighlight.actorId && action.skill.jcHighlightMask === 'mischief') || firstHighlight
      : firstHighlight;
    if (highlight) {
      engine.stepHighlight(highlight.skillId, engine.state.boss.id);
      continue;
    }
    if (navigatorAction) {
      engine.stepNavigator(navigatorAction.id);
      continue;
    }

    const action = engine.recommend();
    if (!action) break;
    const targetId = action.target === 'ally'
      ? action.targetId || engine.state.party.filter(unit => unit.hp > 0).sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0]?.id
      : action.targetId || action.target;
    engine.step({ type: action.type, skillId: action.skillId, targetId });
  }

  return {
    result: engine.getObservation(),
    metrics: {
      score: engine.state.result.score,
      totalDamage: engine.state.totalDamage,
      scoreBreakdown: engine.state.result.scoreBreakdown
    }
  };
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const enabled = runSlaughterBenchmark({ wavecatcherFollowUps: true });
  const disabled = runSlaughterBenchmark({ wavecatcherFollowUps: false });
  console.log(JSON.stringify({
    waveEnabled: enabled.metrics,
    waveDisabled: disabled.metrics,
    waveScoreLift: enabled.metrics.score - disabled.metrics.score
  }, null, 2));
}
