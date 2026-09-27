import { characterResearch } from './mont-frostgale-data.js';

const own = unit => unit?.slug === characterResearch.slug;
const options = (engine, unit) => engine.config?.loadouts?.[unit.id]?.characterResearch || {};
const tier = (engine, unit) => {
  const value = options(engine, unit).sourceTier ?? 3;
  if (!Number.isInteger(value) || value < 0 || value > 3) throw new RangeError('sourceTier must be 0..3');
  return value;
};
const source = {
  spring: { S1: [.738, .813, .783, .859], S2: [.313, .345, .333, .365], S3: [.928, 1.023, .985, 1.080], HL: [2.125, 2.342, 2.255, 2.473] },
  winter: { S1: [1.527, 1.684, 1.621, 1.778], S2: [.838, .924, .890, .976], S3: [2.290, 2.525, 2.431, 2.665], HL: [3.806, 4.196, 4.040, 4.430] },
  weapon4Vestige: [.018, .023, .023, .028, .028, .033, .033], weapon5Crit: [.054, .070, .070, .086, .086, .102, .102], weapon5Element: [.270, .350, .350, .430, .430, .510, .510]
};
const clean = original => {
  const skill = { ...original };
  for (const key of ['buff', 'buffTarget', 'debuff', 'heal', 'healAttack', 'healFlat', 'healTarget', 'spRestore', 'actionBonus']) delete skill[key];
  return skill;
};
const buff = (engine, unit, id, stat, value, duration = null, sourceType = 'character_passive', extra = {}) => engine.applyUnitBuff(unit, { id: `mont-frostgale_${id}`, name: id, stat, value, duration, ...extra }, sourceType);
function initializeBase(engine, unit) {
  if (!own(unit) || unit.researchedCharacter) return false;
  tier(engine, unit);
  const o = options(engine, unit), weapon = o.weapon === 'signature' ? 'weapon5-1' : o.weapon === 'four-star' ? 'weapon4-1' : null;
  if (o.weapon && !['none', 'signature', 'four-star'].includes(o.weapon)) throw new RangeError('Unknown weapon');
  const refinement = o.refinement ?? 0;
  if (!Number.isInteger(refinement) || refinement < 0 || refinement > 6) throw new RangeError('refinement must be 0..6');
  unit.researchedCharacter = { slug: characterResearch.slug };
  unit.buffs ||= [];
  const allies = engine.state.party.filter(member => member.id !== unit.id);
  const wind = allies.filter(member => member.element === 'wind').length, ice = allies.filter(member => member.element === 'ice').length;
  unit.frostgale = { mode: ice > wind ? 'winter' : 'spring', edge: null, windBonus: wind > 0, iceBonus: ice > 0, vestiges: 0, weapon, refinement, packetKeys: new Set() };
  if (weapon && !o.staticWeaponStatsIncluded) {
    const first = characterResearch.weapons[weapon].description.split('\n')[0];
    const values = first.match(/[\d.]+(?=%)/g)?.slice(0, 7).map(Number);
    if (!values || values.length !== 7) throw new Error('Frostgale weapon static values could not be parsed');
    buff(engine, unit, 'weapon_static', 'attack', values[refinement] / 100, null, 'equipment');
  }
  return true;
}
function gainVestige(engine, unit, count = 1, sourceType = 'passive', allowOverflow = false) {
  const state = unit.frostgale, prior = state.vestiges;
  state.vestiges = Math.min(allowOverflow ? 99 : 7, state.vestiges + count);
  const gained = state.vestiges - prior;
  if (!gained) return 0;
  buff(engine, unit, 'vestige_attack', 'attack', Math.min(7, state.vestiges) * .05, null, sourceType, { stacks: state.vestiges });
  if (state.weapon === 'four-star') {
    const priorWeapon = unit.buffs.find(effect => effect.id === 'mont-frostgale_weapon4_vestige');
    const stacks = Math.min(10, Number(priorWeapon?.stacks || 0) + gained);
    buff(engine, unit, 'weapon4_vestige', 'attack', stacks * source.weapon4Vestige[state.refinement], null, 'equipment', { stacks });
  }
  if (state.weapon === 'signature') {
    const priorWeapon = unit.buffs.find(effect => effect.id === 'mont-frostgale_weapon5_vestige');
    const stacks = Math.min(3, Number(priorWeapon?.stacks || 0) + gained);
    buff(engine, unit, 'weapon5_vestige', 'critRate', stacks * source.weapon5Crit[state.refinement], 2, 'equipment', { stacks });
  }
  return gained;
}
function packetKey(engine, packet) { return `${engine.state.attackTurn}:${packet.actor.id}:${packet.skill.id}:${packet.sourceType}`; }

export function setFrostgaleMode(unit, mode) {
  if (!own(unit) || !unit.frostgale) throw new Error('Frostgale not initialized');
  if (!['spring', 'winter'].includes(mode)) throw new RangeError('Unknown Frostgale mode');
  if (unit.frostgale.edge) throw new Error('Cannot change mode while Edge is active');
  unit.frostgale.mode = mode;
}

export const characterMechanics = {
  slug: 'mont-frostgale',
  initialize(engine, unit) { initializeBase(engine, unit); },
  beforeSkill(engine, actor, original, targetId, sourceType) {
    if (!own(actor) || !['character_skill', 'highlight'].includes(sourceType)) return original;
    const skill = clean(original), state = actor.frostgale, slot = sourceType === 'highlight' ? 'HL' : skill.slot;
    const power = source[state.mode][slot];
    if (!power) return skill;
    skill.element = state.mode === 'spring' ? 'wind' : 'ice';
    skill.power = power[tier(engine, actor)];
    skill.powerTiers = power;
    if (state.mode === 'spring' && ['S1', 'S2', 'S3', 'HL'].includes(slot)) skill.additionalHits = [{ power: skill.power }, { power: skill.power }];
    if ((state.mode === 'spring' && state.windBonus) || (state.mode === 'winter' && state.iceBonus)) skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + .33;
    if (slot === 'HL' && !state.edge) skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + .20 + (actor.awareness >= 4 ? .35 : 0);
    if (slot === 'S3') skill.frostgaleStartsEdge = true;
    return skill;
  },
  afterSkill(engine, actor, skill, targetId, sourceType) {
    if (!own(actor) || !['character_skill', 'highlight'].includes(sourceType)) return;
    const state = actor.frostgale, slot = sourceType === 'highlight' ? 'HL' : skill.slot;
    if (skill.frostgaleStartsEdge) {
      state.edge = { mode: state.mode, targetId: targetId || engine.state.boss.id, openedTurn: actor.characterTurnsStarted, extended: false };
      if (state.weapon === 'signature') buff(engine, actor, 'weapon5_edge_element', 'elementDamage', source.weapon5Element[state.refinement], 2, 'equipment', { element: skill.element });
      if (actor.awareness >= 1) gainVestige(engine, actor, 1, 'awareness');
    }
    if (state.edge && ['S1', 'S2'].includes(slot)) gainVestige(engine, actor, slot === 'S1' ? 1 : 2, sourceType);
    if (slot === 'HL' && state.edge && actor.awareness >= 4) gainVestige(engine, actor, 1, sourceType, true);
  },
  beforeDamage(engine, owner, actor, original, target, sourceType) {
    if (!own(owner) || !owner.frostgale.edge || owner.hp <= 0) return original;
    const skill = { ...original }, edge = owner.frostgale.edge;
    if (edge.mode === 'spring') skill.temporaryDefenseDown = Number(skill.temporaryDefenseDown || 0) + (owner.awareness >= 2 ? .40 : 0);
    if (edge.mode === 'winter' && skill.element === 'ice') skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + (owner.awareness >= 2 ? .30 : 0);
    if (owner.frostgale.weapon === 'signature' && actor.id === owner.id && skill.element === (edge.mode === 'spring' ? 'wind' : 'ice')) skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + source.weapon5Element[owner.frostgale.refinement];
    return skill;
  },
  onDamage(engine, owner, packet) {
    if (!own(owner) || packet.actualDamage <= 0 || !packet.actor) return;
    const key = packetKey(engine, packet), state = owner.frostgale;
    if (state.packetKeys.has(key)) return;
    state.packetKeys.add(key);
    if (state.packetKeys.size > 80) state.packetKeys.clear();
    if (state.mode === 'spring' && packet.skill.element === 'wind') {
      const prior = owner.buffs.find(effect => effect.id === 'mont-frostgale_technical_scoring');
      const stacks = Math.min(5, Number(prior?.stacks || 0) + 1);
      for (const ally of engine.state.party.filter(unit => unit.hp > 0)) buff(engine, ally, 'technical_scoring', 'attack', stacks * .081, 2, 'passive', { stacks });
    }
    const edge = state.edge;
    if (!edge || packet.sourceType === 'mont_edge_follow_up' || packet.actor.id === owner.id || packet.skill.element !== (edge.mode === 'spring' ? 'wind' : 'ice')) return;
    const target = engine.findEnemy(edge.targetId) || engine.state.boss;
    if (!target || target.alive === false) return;
    gainVestige(engine, owner, 1, 'resonance_follow_up');
    engine.resolveSkill(owner, { id: `${owner.id}-edge-follow-up-${engine.state.attackTurn}`, slot: 'FU', name: `${edge.mode === 'spring' ? "Spring's" : "Winter's"} Edge`, element: packet.skill.element, target: 'boss', power: .20, cost: 0 }, target.id, 'mont_edge_follow_up', { ignoreCost: true, grantsHighlight: false });
  },
  onTurnEnd(engine, unit) {
    if (!own(unit) || !unit.frostgale.edge) return;
    const edge = unit.frostgale.edge;
    if (unit.characterTurnsStarted <= edge.openedTurn) return;
    const target = engine.findEnemy(edge.targetId) || engine.state.boss;
    const coefficient = edge.mode === 'spring' ? [.364, .401, .386, .423][tier(engine, unit)] : [.279, .308, .296, .325][tier(engine, unit)];
    const stacks = unit.frostgale.vestiges;
    if (target?.alive !== false && stacks > 0) engine.resolveSkill(unit, { id: `${unit.id}-edge-finale-${engine.state.attackTurn}`, slot: 'FU', name: `${edge.mode === 'spring' ? "Spring's" : "Winter's"} Edge Finale`, element: edge.mode === 'spring' ? 'wind' : 'ice', target: 'boss', power: (stacks + 4) * coefficient, cost: 0, damageClass: 'resonance_follow_up' }, target.id, 'resonance_follow_up', { ignoreCost: true, grantsHighlight: false });
    unit.frostgale.vestiges = 0;
    unit.frostgale.edge = null;
  }
};
