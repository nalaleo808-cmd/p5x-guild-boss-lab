import { characterResearch } from './noir-data.js';

const own = unit => unit?.slug === characterResearch.slug;
const options = (engine, unit) => engine.config?.loadouts?.[unit.id]?.characterResearch || {};
const tier = (engine, unit) => {
  const value = options(engine, unit).sourceTier ?? 3;
  if (!Number.isInteger(value) || value < 0 || value > 3) throw new RangeError('sourceTier must be 0..3');
  return value;
};
const source = {
  S1: [.758, .836, .805, .883], S2: [1.516, 1.671, 1.609, 1.764], S3: [1.421, 1.567, 1.508, 1.654], HL: [2.069, 2.281, 2.196, 2.408],
  focused: [.293, .323, .311, .341], painpoint: [.390, .430, .414, .454], spillover: [.293, .323, .311, .341], overloadCrit: [.146, .146, .155, .155],
  weapon4: [.033, .043, .043, .053, .053, .063, .063], weapon4Cap: [.099, .129, .129, .159, .159, .189, .189], weapon5Psychic: [.240, .310, .310, .380, .380, .450, .450], weapon5RoundAttack: [.340, .430, .430, .520, .520, .610, .610]
};
const clean = original => {
  const skill = { ...original };
  for (const key of ['buff', 'buffTarget', 'debuff', 'heal', 'healAttack', 'healFlat', 'healTarget', 'spRestore', 'actionBonus']) delete skill[key];
  return skill;
};
const buff = (engine, unit, id, stat, value, duration = null, sourceType = 'character_passive', extra = {}) => engine.applyUnitBuff(unit, { id: `noir_${id}`, name: id, stat, value, duration, ...extra }, sourceType);
function initializeBase(engine, unit) {
  if (!own(unit) || unit.researchedCharacter) return false;
  tier(engine, unit);
  const o = options(engine, unit), weapon = o.weapon === 'signature' ? 'weapon5-1' : o.weapon === 'four-star' ? 'weapon4-1' : null;
  if (o.weapon && !['none', 'signature', 'four-star'].includes(o.weapon)) throw new RangeError('Unknown weapon');
  const refinement = o.refinement ?? 0;
  if (!Number.isInteger(refinement) || refinement < 0 || refinement > 6) throw new RangeError('refinement must be 0..6');
  unit.researchedCharacter = { slug: characterResearch.slug };
  unit.buffs ||= [];
  unit.noir = { thoughtfulRounds: [], targetAudience: 0, weapon, refinement };
  if (weapon && !o.staticWeaponStatsIncluded) {
    const first = characterResearch.weapons[weapon].description.split('\n')[0];
    const values = first.match(/[\d.]+(?=%)/g)?.slice(0, 7).map(Number);
    if (!values || values.length !== 7) throw new Error('Noir weapon static values could not be parsed');
    buff(engine, unit, 'weapon_static', weapon === 'weapon5-1' ? 'ailmentAccuracy' : 'attack', values[refinement] / 100, null, 'equipment');
  }
  refreshLeadership(engine, unit);
  return true;
}
function accuracy(unit) { return Math.max(0, Number(unit.ailmentAccuracy || 0) + unit.buffs.filter(effect => effect.stat === 'ailmentAccuracy').reduce((sum, effect) => sum + Number(effect.value || 0), 0)); }
function refreshLeadership(engine, unit) {
  const a = accuracy(unit);
  buff(engine, unit, 'heiress_attack', 'attack', Math.min(1.65, a / 1.45));
  buff(engine, unit, 'heiress_critical', 'critDamage', Math.min(3, Math.floor(a / .5)) * .2);
}
function refreshAudience(engine, unit) {
  const stacks = unit.noir.targetAudience;
  if (unit.awareness >= 1) {
    buff(engine, unit, 'audience_attack', 'attack', stacks * .08, 3, 'awareness', { stacks });
    if (stacks) buff(engine, unit, 'audience_reduction', 'damageReduction', .25, 3, 'awareness');
  }
}
function grantRound(engine, unit, round) {
  if (unit.noir.thoughtfulRounds.includes(round) || unit.noir.thoughtfulRounds.length >= 3) return false;
  unit.noir.thoughtfulRounds.push(round);
  const count = unit.noir.thoughtfulRounds.length;
  if (count === 1) { buff(engine, unit, 'area_one_accuracy', 'ailmentAccuracy', .18); buff(engine, unit, 'area_one_resistance', 'ailmentResistance', .18); }
  if (count === 2) { buff(engine, unit, 'area_two_attack', 'attack', .18); buff(engine, unit, 'area_two_defense', 'defense', .18); }
  if (count === 3) buff(engine, unit, 'area_three_crit', 'critDamage', .18);
  if (unit.noir.weapon === 'signature') buff(engine, unit, 'weapon5_round_attack', 'attack', count * source.weapon5RoundAttack[unit.noir.refinement], 1, 'equipment', { stacks: count });
  refreshLeadership(engine, unit);
  return true;
}

export const characterMechanics = {
  slug: 'noir',
  initialize(engine, unit) { initializeBase(engine, unit); },
  beforeSkill(engine, actor, original, targetId, sourceType) {
    if (!own(actor) || !['character_skill', 'highlight', 'gun'].includes(sourceType)) return original;
    const skill = clean(original), t = tier(engine, actor), state = actor.noir;
    if (sourceType === 'gun') {
      skill.element = 'psychic'; skill.target = 'all_enemies'; skill.power = .66;
      const rounds = state.thoughtfulRounds;
      skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + [0, .20, .40, .50][rounds.length];
      if (rounds.length >= 2) skill.temporaryAttackBonus = Number(skill.temporaryAttackBonus || 0) + .25;
      if (rounds.includes('focused') && state.targetAudience > 0) skill.actionDamageBonus += source.focused[t];
      if (rounds.includes('painpoint')) skill.additionalHits = [...(skill.additionalHits || []), { power: source.painpoint[t], element: 'psychic', targetId }];
      if (rounds.includes('spillover')) skill.additionalHits = [...(skill.additionalHits || []), { power: source.spillover[t], element: 'psychic' }];
      if (actor.awareness >= 1) skill.critBonus = Number(skill.critBonus || 0) + state.targetAudience * .06;
      if (actor.awareness >= 4 && rounds.includes('overload')) skill.temporaryCritDamage = Number(skill.temporaryCritDamage || 0) + .30;
      if (actor.awareness >= 6 && rounds.length >= 2) skill.additionalHits = [...(skill.additionalHits || []), { power: .66 * .70, element: 'psychic' }];
    } else {
      const slot = sourceType === 'highlight' ? 'HL' : skill.slot;
      skill.power = source[slot][t];
      if (slot === 'S1') skill.additionalHits = [{ power: skill.power }];
      if (slot === 'S2' && state.targetAudience > 0) skill.temporaryPierce = Number(skill.temporaryPierce || 0) + [.195, .195, .207, .207][t];
      if (slot === 'S3' && state.targetAudience > 0) skill.critBonus = Number(skill.critBonus || 0) + [.195, .195, .207, .207][t];
      if (slot === 'HL' && !state.thoughtfulRounds.includes('overload')) skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + [.146, .161, .155, .170][t];
    }
    if (state.weapon === 'four-star') {
      const foes = engine.enemies.filter(foe => foe.alive !== false && foe.debuffs?.length > 0).length;
      skill.temporaryAttackBonus = Number(skill.temporaryAttackBonus || 0) + Math.min(source.weapon4Cap[state.refinement], foes * source.weapon4[state.refinement]);
    }
    return skill;
  },
  afterSkill(engine, actor, skill, targetId, sourceType, context = {}) {
    if (!own(actor) || !['character_skill', 'highlight', 'gun'].includes(sourceType)) return;
    const state = actor.noir, t = tier(engine, actor);
    if (sourceType === 'character_skill' && skill.slot === 'S1') {
      let gained = 0;
      for (const target of context.targets || []) {
        const chance = target.id === targetId ? [.976, .976, 1.036, 1.036][t] : [.537, .537, .570, .570][t];
        if (engine.random() < chance) gained += 1;
      }
      state.targetAudience = Math.min(3, state.targetAudience + gained);
      refreshAudience(engine, actor);
      grantRound(engine, actor, 'focused');
    }
    if (sourceType === 'character_skill' && skill.slot === 'S2' && state.targetAudience > 0) grantRound(engine, actor, 'painpoint');
    if (sourceType === 'character_skill' && skill.slot === 'S3' && state.targetAudience > 0) grantRound(engine, actor, 'spillover');
    if (sourceType === 'highlight' && !state.thoughtfulRounds.includes('overload') && state.thoughtfulRounds.length < 3) grantRound(engine, actor, 'overload');
    if (sourceType === 'gun') {
      state.thoughtfulRounds = [];
      state.targetAudience = 0;
      refreshAudience(engine, actor);
    }
  },
  beforeDamage(engine, owner, actor, original, target) {
    if (!own(owner) || owner.hp <= 0 || actor.id !== owner.id) return original;
    const skill = { ...original }, state = owner.noir;
    if (owner.awareness >= 2 && state.targetAudience >= 3 && skill.element === 'psychic') skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + .60;
    if (state.weapon === 'signature' && state.targetAudience > 0 && skill.element === 'psychic') skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + source.weapon5Psychic[state.refinement];
    return skill;
  }
};
