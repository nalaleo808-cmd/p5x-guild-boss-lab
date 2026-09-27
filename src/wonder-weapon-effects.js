// Pure Wonder weapon lifecycle adapters. They describe source-backed effects
// without importing or mutating BattleEngine. The caller owns buff storage,
// target selection, RNG, and duration-clock interpretation.

const ALLY_SCOPE = 'all_allies';
const HOLDER_SCOPE = 'holder';
const LUFEL_A6_SOURCE = 'user_lufel_live_interactive_2026-09-21';

const deepFreeze = value => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
};

const effect = (id, target, changes, duration = null, source = 'steam_datamine_2026-09-19') =>
  deepFreeze({ id, target, changes, duration, source });
const lufelEffect = (id, target, changes, duration = null) => effect(id, target, changes, duration, LUFEL_A6_SOURCE);

const result = (state, effects) => deepFreeze({ state: deepFreeze(state), effects: deepFreeze(effects) });
const copy = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const isExplicitAlly = ({ actorId, actorSide, partyIds }) => actorSide === 'ally'
  || (Array.isArray(partyIds) && partyIds.includes(actorId));

export const WONDER_WEAPON_EFFECT_LIMITATIONS = Object.freeze({
  glimmer: 'The source says 1 ally but does not expose target-selection policy or a duration for Blessing.',
  'eye-of-obsequies': 'Independent-stack consumption trigger is not represented by this adapter.',
  'starry-compass': 'The duration clock for Guidance is not explicit beyond losing 5 at Wonder turn end.',
  'abyss-fang': 'The source does not define whether multi-hit skill damage increments once per hit or per cast.',
  purgatory: 'The source does not specify whether the 3-turn duration is per stack or refreshed globally.',
  'plasma-blade': 'Flames of Desire is external state not defined by this weapon record.',
  'pheromone-sting': 'The source does not specify Infestation refresh behavior.',
  'ice-age': 'The source says 1 ally at battle start but does not expose target-selection policy.',
  'event-horizon': 'The source confirms independently calculated durations but does not specify the engine turn clock.'
});

export function createWonderWeaponEffectState(weaponId) {
  return deepFreeze({ weaponId, guidance: 0, hunterInstinct: 0, hunterDamageEvents: 0,
    trialByFire: 0, harmonicTurns: 0, magnetizedTurns: 0, infestationTargetIds: [],
    ancientFrostTargetIds: [], spaghettificationStacks: {}, glimmerCooldown: 0 });
}

export function wonderWeaponBattleStart(state, { partyIds = [], startingPersonaElement = null, selectedAllyId = null } = {}) {
  const next = copy(state);
  const effects = [];
  switch (state.weaponId) {
    case 'starry-compass': next.guidance = 10; break;
    case 'purgatory': next.trialByFire = 2; break;
    case 'plasma-blade': next.harmonicTurns = 2; break;
    case 'cyclotron':
      effects.push(effect('cyclotron-critical-rate', HOLDER_SCOPE, { criticalRateBonus: 0.19 }));
      break;
    case 'ice-age':
      if (selectedAllyId) {
        next.ancientFrostTargetIds = [selectedAllyId];
        effects.push(effect('ice-age-ancient-frost', selectedAllyId, { damageBonus: 0.16, iceDamageBonus: 0.22 }, 3));
      }
      break;
    case 'event-horizon':
      next.spaghettificationStacks = Object.fromEntries(partyIds.map(id => [id, 2]));
      break;
    case 'ex-machina':
      if (startingPersonaElement) effects.push(effect('ex-machina-starting-element', ALLY_SCOPE,
        { element: startingPersonaElement, damageBonus: 0.34, allyDamageShare: 0.4 }, null, LUFEL_A6_SOURCE));
      break;
    default: break;
  }
  return result(next, effects);
}

export function wonderWeaponOnDamage(state, {
  actorId, holderId = 'wonder', targetId, element, isSkillDamage = false,
  inflictedAilment = false, ailmentKind = null, roll = null, partyIds = [], actorSide = null
} = {}) {
  const next = copy(state);
  const effects = [];
  const isAlly = isExplicitAlly({ actorId, actorSide, partyIds });
  switch (state.weaponId) {
    case 'starry-compass':
      if (isAlly) next.guidance = clamp(next.guidance + 1, 0, 20);
      break;
    case 'abyss-fang':
      if (actorId === holderId && isSkillDamage) {
        next.hunterDamageEvents += 1;
        next.hunterInstinct = clamp(next.hunterInstinct + 3 + (next.hunterDamageEvents % 2 === 0 ? 1 : 0), 0, 5);
      }
      break;
    case 'purgatory':
      if (element === 'fire' && isSkillDamage && isAlly) next.trialByFire = clamp(next.trialByFire + 1, 0, 3);
      break;
    case 'plasma-blade':
      if (element === 'almighty' && isSkillDamage && isAlly) next.harmonicTurns = 2;
      break;
    case 'pheromone-sting':
      if (targetId && inflictedAilment && ['elemental', 'spiritual'].includes(ailmentKind)) {
        next.infestationTargetIds = [...new Set([...next.infestationTargetIds, targetId])];
        effects.push(effect('pheromone-infestation', targetId, { damageTakenBonus: 0.2 }, 3));
      }
      break;
    case 'cyclotron':
      if (element === 'electric' && isAlly) {
        next.magnetizedTurns = 2;
        effects.push(effect('cyclotron-magnetized-plasma', ALLY_SCOPE,
        { damageBonus: 0.18, electricCriticalDamageBonus: 0.18 }, 2));
      }
      break;
    case 'cursed-ties':
      if (element === 'curse' && isAlly && targetId && roll != null && roll < 0.7) {
        effects.push(effect('cursed-ties-evil-eye', targetId,
          { defenseDown: 0.25, curseDamageTakenBonus: 0.16 }, 3));
      }
      break;
    case 'event-horizon':
      if (element === 'nuclear' && isSkillDamage && isAlly) {
        for (const id of partyIds) next.spaghettificationStacks[id] = clamp((next.spaghettificationStacks[id] || 0) + 1, 0, 2);
      }
      break;
    default: break;
  }
  return result(next, effects);
}

export function wonderWeaponOnTurnStart(state, { selectedAllyId = null } = {}) {
  const next = copy(state);
  const effects = [];
  if (state.weaponId === 'glimmer' && next.glimmerCooldown === 0 && selectedAllyId) {
    next.glimmerCooldown = 2;
    effects.push(lufelEffect('glimmer-blessing', selectedAllyId, { blessing: true, damageBonus: 0.16, blessDamageBonus: 0.27 }));
  }
  return result(next, effects);
}

export function wonderWeaponOnPersonaChange(state) {
  const effects = state.weaponId === 'midnight-sun'
    ? [effect('midnight-sun-persona-change', HOLDER_SCOPE, { additionalAttackBonus: 0.122, doubled: true }, 1)]
    : [];
  return result(copy(state), effects);
}

export function wonderWeaponOnKnockdown(state, { targetId } = {}) {
  const effects = state.weaponId === 'sennight-inferno' && targetId
    ? [lufelEffect('sennight-inferno-knockdown-defense-down', targetId, { defenseDown: 0.3 }, 1)]
    : [];
  return result(copy(state), effects);
}

export function wonderWeaponOnAilmentInflicted(state, { targetId, ailmentKind, actorId, holderId = 'wonder' } = {}) {
  const effects = [];
  if (actorId !== holderId || !targetId) return result(copy(state), effects);
  if (state.weaponId === 'arc-knife' && ailmentKind === 'elemental') {
    effects.push(lufelEffect('arc-knife-elemental-ailment-attack', HOLDER_SCOPE, { attackBonus: 0.2 }, 2));
  }
  if (state.weaponId === 'eye-of-obsequies' && ailmentKind === 'status') {
    effects.push(lufelEffect('eye-of-obsequies-status-ailment', targetId,
      { ailmentResistanceDown: 0.12, defenseDown: 0.1, holderAttackBonus: 0.2, physicalDamageTakenBonusAtOneStack: 0.28 }, 3));
  }
  return result(copy(state), effects);
}

export function wonderWeaponOnTurnEnd(state, { actorId, holderId = 'wonder' } = {}) {
  const next = copy(state);
  if (actorId === holderId && state.weaponId === 'starry-compass') next.guidance = clamp(next.guidance - 5, 0, 20);
  if (actorId === holderId && state.weaponId === 'glimmer') next.glimmerCooldown = Math.max(0, next.glimmerCooldown - 1);
  return result(next, []);
}

export function wonderWeaponOnSkillTargetAlly(state, { actorId, holderId = 'wonder', targetId } = {}) {
  const next = copy(state);
  const effects = [];
  if (actorId !== holderId || !targetId) return result(next, effects);
  if (state.weaponId === 'all-in') effects.push(lufelEffect('all-in-main-target-recovery', targetId, { maxHpRecovery: 0.2 }));
  if (state.weaponId === 'ice-age' && !next.ancientFrostTargetIds.includes(targetId)) {
    next.ancientFrostTargetIds.push(targetId);
    effects.push(effect('ice-age-ancient-frost', targetId, { damageBonus: 0.16, iceDamageBonus: 0.22 }, 3));
  }
  return result(next, effects);
}

export function wonderWeaponThresholdEffects(state) {
  if (state.weaponId === 'starry-compass') {
    return deepFreeze([
      ...(state.guidance >= 5 ? [lufelEffect('starry-compass-defense-down', 'all_foes', { defenseDown: 0.22 })] : []),
      ...(state.guidance >= 10 ? [lufelEffect('starry-compass-ailment-accuracy', ALLY_SCOPE, { ailmentAccuracyBonus: 0.18 })] : []),
      ...(state.guidance >= 15 ? [lufelEffect('starry-compass-psychokinesis-damage', ALLY_SCOPE, { psychokinesisDamageBonus: 0.22 })] : [])
    ]);
  }
  return deepFreeze([]);
}

// Static and conditional descriptors are separate from lifecycle transitions.
// A parent engine can apply only the descriptors for timing systems it supports.
export function wonderWeaponPassiveEffects(state, {
  holderId = 'wonder', targetHasEvilEye = false, activeFlamesOfDesire = 0
} = {}) {
  const effects = [];
  const resolved = (id, changes) => effects.push(effect(id, HOLDER_SCOPE, changes));
  const lufel = (id, changes) => effects.push(lufelEffect(id, HOLDER_SCOPE, changes));
  switch (state.weaponId) {
    case 'damascus-knife': resolved('damascus-knife-attack', { attackBonus: 0.215 }); break;
    case 'fatal-knife': resolved('fatal-knife-per-persona-attack', { attackBonusPerEquippedPersona: 0.095 }); break;
    case 'midnight-sun': resolved('midnight-sun-attack', { attackBonus: 0.24 }); break;
    case 'sennight-inferno': lufel('sennight-inferno-static', { attackBonus: 0.56, damageBonusPerDistinctPersonaAttribute: 0.12, knockdownDefenseDown: 0.3 }); break;
    case 'all-in': lufel('all-in-static', { healingAndShieldBonus: 0.4, partyDefenseAura: 0.3 }); break;
    case 'arc-knife': lufel('arc-knife-static', { attackBonus: 0.56, elementalAilmentAccuracyBonus: 0.3, ailmentAttackBonus: 0.2, defenseDownPerElementalAilment: 0.09 }); break;
    case 'ex-machina': lufel('ex-machina-static', { attackBonus: 0.56, partyAttackFlatAura: 240, startingPersonaElementDamageBonus: 0.34 }); break;
    case 'glimmer': lufel('glimmer-static', { attackBonus: 0.56, blessDamageAndHealingBonus: 0.22 }); break;
    case 'eye-of-obsequies': lufel('eye-of-obsequies-static', { attackBonus: 0.56, ailmentResistanceDown: 0.12, defenseDown: 0.1, ailmentAttackBonus: 0.2, physicalDamageTakenBonus: 0.28 }); break;
    case 'starry-compass': lufel('starry-compass-static', { attackBonus: 0.56 }); break;
    case 'abyss-fang':
      lufel('abyss-fang-static', { attackBonus: 0.56 });
      if (state.hunterInstinct > 0) lufel('abyss-fang-hunter-instinct', { damageBonusPerStack: 0.066, stacks: state.hunterInstinct, duration: 1 });
      if (state.hunterInstinct >= 3) lufel('abyss-fang-three-stack-critical', { criticalRateBonus: 0.12, criticalDamageBonus: 0.24 });
      if (state.hunterInstinct >= 5) lufel('abyss-fang-five-stack-critical', { criticalRateBonus: 0.18, criticalDamageBonus: 0.36 });
      break;
    case 'purgatory':
      lufel('purgatory-static', { attackBonus: 0.607 });
      if (state.trialByFire >= 1) lufel('purgatory-one-stack', { holderAttackFlatBonus: 360, otherAlliesAttackFlatBonus: 300 });
      if (state.trialByFire >= 2) lufel('purgatory-two-stack', { holderDamageBonus: 0.16, otherAlliesDamageBonus: 0.06 });
      if (state.trialByFire >= 3) lufel('purgatory-three-stack', { partyFireDamageBonus: 0.24 });
      break;
    case 'plasma-blade':
      lufel('plasma-blade-static', { attackBonus: 0.607 });
      if (state.harmonicTurns > 0 && activeFlamesOfDesire >= 1) lufel('plasma-blade-harmonic-one', { holderAttackBonus: 0.3, holderAlmightyDamageBonus: 0.18, otherAlliesShare: 0.5 });
      if (state.harmonicTurns > 0 && activeFlamesOfDesire >= 2) lufel('plasma-blade-harmonic-two', { partyCriticalDamageBonus: 0.18 });
      break;
    case 'pheromone-sting':
      effects.push(effect('pheromone-sting-static', HOLDER_SCOPE, { ailmentAccuracyBonus: 0.68, elementalOrSpiritualAilmentChanceBonus: 0.25 }));
      if (state.infestationTargetIds.length) effects.push(effect('pheromone-sting-infestation-present', HOLDER_SCOPE, { ailmentAccuracyBonus: 0.08, attackBonus: 0.14 }));
      break;
    case 'cyclotron': effects.push(effect('cyclotron-attack', HOLDER_SCOPE, { attackBonus: 0.56 })); break;
    case 'cursed-ties':
      effects.push(effect('cursed-ties-ailment-accuracy', HOLDER_SCOPE, { ailmentAccuracyBonus: 0.68 }));
      if (targetHasEvilEye) effects.push(effect('cursed-ties-evil-eye-holder-attack', holderId, { attackBonus: 0.36 }));
      break;
    case 'ice-age':
      effects.push(effect('ice-age-attack', HOLDER_SCOPE, { attackBonus: 0.56 }));
      if (state.ancientFrostTargetIds.length) effects.push(effect('ice-age-ancient-frost-present', HOLDER_SCOPE, { damageBonus: 0.35 }));
      break;
    case 'event-horizon':
      effects.push(effect('event-horizon-attack', HOLDER_SCOPE, { attackBonus: 0.56 }));
      effects.push(effect('event-horizon-per-affected-ally', HOLDER_SCOPE, { attackFlatBonusPerAffectedAlly: 100, spaghettificationAttackBonus: 0.11, nuclearCriticalDamageBonus: 0.1 }));
      break;
    default: break;
  }
  return deepFreeze(effects);
}
