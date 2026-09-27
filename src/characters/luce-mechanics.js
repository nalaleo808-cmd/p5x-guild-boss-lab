import { coefficients as C, owns, value, buff, initializeResearch, prepareSkill } from './luce-data.js';

const party = engine => engine.state.party.filter(unit => unit.hp > 0);
const attack = actor => Math.max(0, Number(actor.mechanicAttack ?? actor.attack));
function supportingRole(engine) {
  for (const unit of party(engine)) buff(engine, unit, 'supporting_role', 'damage', Math.min(.25, (unit.blessingStacks || 0) * .05), null, 'passive');
}
function flatGrant(engine, actor, id, amount, sourceType) {
  // Source stats and simulation stats use different units. Never guess their conversion.
  const scale = actor.luce.flatAttackScale;
  if (!Number.isFinite(scale) || scale <= 0) return;
  for (const unit of party(engine)) buff(engine, unit, id, 'flatAttack', amount * scale, 2, sourceType);
}
export const characterMechanics = {
  slug: 'luce',
  initialize(engine, unit) {
    if (initializeResearch(engine, unit)) { unit.luce.improv = null; supportingRole(engine); }
  },
  actionUnavailableReason(engine, unit, skill, sourceType) {
    if (owns(unit) && unit.luce && sourceType === 'character_skill' && skill.slot === 'S3' && !['fire', 'ice', 'electric', 'wind'].includes(unit.luce.improv))
      return 'Select Luce Improv state before Improvise.';
    return null;
  },
  beforeSkill(engine, actor, skill, targetId, sourceType) {
    const reason = characterMechanics.actionUnavailableReason(engine, actor, skill, sourceType);
    if (reason) throw new Error(reason);
    const prepared = prepareSkill(actor, skill, sourceType);
    if (prepared === skill) return skill;
    if (['S2', 'S3', 'HL'].includes(skill.slot)) {
      const target = party(engine).find(unit => unit.id === targetId);
      if (!target || (skill.slot === 'S2' && target.id === actor.id)) throw new Error('Luce requires a living ally target; Adlib cannot target Luce.');
    }
    return prepared;
  },
  afterSkill(engine, actor, skill, targetId, sourceType) {
    if (!owns(actor) || skill.characterPrepared !== 'luce') return;
    const allies = party(engine);
    const target = allies.find(unit => unit.id === targetId);
    const a = attack(actor);
    if (skill.slot === 'S1') {
      engine.grantBlessing(allies, 2, sourceType);
      for (const unit of allies) buff(engine, unit, 'followspot', 'damage', Math.min(value(actor, C.s1Cap), a / 100 * .008), 2, sourceType);
    }
    if (skill.slot === 'S2' && target) buff(engine, target, 'adlib', 'defense', Math.min(value(actor, C.s2Cap), a / 100 * .0083), 2, sourceType);
    if (skill.slot === 'S3') {
      flatGrant(engine, actor, 'improvise', Math.min(value(actor, C.s3FlatCap), a * .15), sourceType);
      const duration = actor.awareness >= 6 ? 4 : 2;
      const state = actor.luce.improv;
      if (target && state === 'electric') buff(engine, target, 'electric', 'critDamage', value(actor, C.electric), duration, sourceType);
      if (target && state === 'wind') buff(engine, target, 'wind', 'pierce', value(actor, C.wind), duration, sourceType);
      if (target && state === 'fire') buff(engine, target, 'fire', 'dotDamage', value(actor, C.fire), duration, sourceType);
    }
    if (skill.slot === 'HL' && sourceType === 'highlight') {
      flatGrant(engine, actor, 'highlight', Math.min(value(actor, C.hlFlatCap), a * .065), sourceType);
      engine.grantBlessing(allies, actor.awareness >= 4 ? 3 : 1, sourceType);
      if (target && actor.awareness >= 4) buff(engine, target, 'a4', 'attack', .1, 2, sourceType);
    }
    supportingRole(engine);
  },
  onTurnStart(engine, unit) { if (owns(unit) && unit.luce && unit.hp > 0) supportingRole(engine); }
};
