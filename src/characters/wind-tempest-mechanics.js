import { characterResearch } from './wind-tempest-data.js';

const own = unit => unit?.slug === characterResearch.slug;
const values = { cap: [3.88, 4.18, 4.18, 4.48], highlightCrit: [.244, .269, .259, .284], weapon4Crit: [.087, .113, .113, .139, .139, .165, .165], weapon5PartyCrit: [.132, .172, .172, .212, .212, .252, .252] };
const options = (engine, unit) => engine.config?.loadouts?.[unit.id]?.characterResearch || {};
const tier = (engine, unit) => {
  const value = options(engine, unit).sourceTier ?? 3;
  if (!Number.isInteger(value) || value < 0 || value > 3) throw new RangeError('sourceTier must be 0..3');
  return value;
};
const clean = original => {
  const skill = { ...original };
  for (const key of ['buff', 'buffTarget', 'debuff', 'heal', 'healAttack', 'healFlat', 'healTarget', 'spRestore', 'actionBonus']) delete skill[key];
  return skill;
};
const buff = (engine, unit, id, stat, value, duration = null, source = 'character_passive', extra = {}) => engine.applyUnitBuff(unit, { id: `${characterResearch.slug}_${id}`, name: id, stat, value, duration, ...extra }, source);
const alive = engine => engine.state.party.filter(unit => unit.hp > 0);
const restore = (engine, unit, amount, sourceType = 'character_passive') => {
  const restored = Math.max(0, Math.min(Math.round(amount), engine.spCap(unit) - unit.sp));
  unit.sp += restored;
  if (restored) engine.emit('resource', `${unit.codename} recovered ${restored} SP.`, { actorId: unit.id, resource: 'sp', amount: restored, sourceType, tone: 'heal' });
  return restored;
};
function initializeBase(engine, unit) {
  if (!own(unit) || unit.researchedCharacter) return false;
  tier(engine, unit);
  const o = options(engine, unit), weapon = o.weapon === 'signature' ? 'weapon5-1' : o.weapon === 'four-star' ? 'weapon4-1' : null;
  if (o.weapon && !['none', 'signature', 'four-star'].includes(o.weapon)) throw new RangeError('Unknown weapon');
  const refinement = o.refinement ?? 0;
  if (!Number.isInteger(refinement) || refinement < 0 || refinement > 6) throw new RangeError('refinement must be 0..6');
  unit.researchedCharacter = { slug: characterResearch.slug };
  unit.buffs ||= [];
  unit.windTempest = { weapon, refinement, arrivalRefundAvailable: false };
  unit.spRecovery = Number(unit.spRecovery ?? 100) + 60;
  unit.maxSp = unit.awareness >= 2 ? 250 : 200;
  unit.sp = Math.min(unit.sp, engine.spCap(unit));
  const recoveryRatio = Math.min(1, Math.max(0, Number(unit.spRecovery || 0) / 450));
  buff(engine, unit, 'sun_kissed_crit', 'critDamage', .84 * recoveryRatio);
  unit.maxHp += Math.round(1800 * recoveryRatio);
  unit.hp = Math.min(unit.hp, unit.maxHp);
  if (weapon && !o.staticWeaponStatsIncluded) {
    const first = characterResearch.weapons[weapon].description.split('\n')[0];
    const nums = first.match(/[\d.]+(?=%)/g)?.slice(0, 7).map(Number);
    if (!nums || nums.length !== 7) throw new Error('Wind Tempest weapon static values could not be parsed');
    buff(engine, unit, 'weapon_static', weapon === 'weapon5-1' ? 'critDamage' : 'attack', nums[refinement] / 100, null, 'equipment');
  }
  return true;
}
function critMultiplier(unit) { return Number(unit.critMult || 1.5) + unit.buffs.filter(b => b.stat === 'critDamage').reduce((sum, b) => sum + Number(b.value || 0), 0); }
function excess(engine, unit) { return Math.max(0, Math.min(critMultiplier(unit), values.cap[tier(engine, unit)]) - 1); }
function rawCrit(unit) { return Number(unit.crit || 0) + unit.buffs.filter(b => b.stat === 'critRate').reduce((sum, b) => sum + Number(b.value || 0), 0); }
function hasBuff(unit, id) { return unit.buffs.some(effect => effect.id === `${characterResearch.slug}_${id}`); }
function grantBlossom(engine, riko, target) {
  const state = target.windTempestUnravel;
  if (!state || state.ownerId !== riko.id) return;
  state.stacks = Math.min(10, state.stacks + 1);
  const x = excess(engine, riko);
  buff(engine, target, `blossom_${riko.id}`, 'flatAttack', state.stacks * 30, 3, 'passive');
  if (state.stacks >= 5) {
    const multiplier = riko.awareness >= 2 ? 2 : 1;
    buff(engine, target, `blossom_attack_${riko.id}`, 'attack', .08 * x * multiplier, 3, 'passive');
    buff(engine, target, `blossom_crit_${riko.id}`, 'critDamage', .05 * x * multiplier * (state.stacks >= 10 ? 2 : 1), 3, 'passive');
  }
}

export const characterMechanics = {
  slug: 'wind-tempest',
  initialize(engine, unit) { initializeBase(engine, unit); },
  beforeSkill(engine, actor, original, targetId, sourceType) {
    if (!own(actor) || !['character_skill', 'highlight'].includes(sourceType)) return original;
    const skill = clean(original);
    if (sourceType === 'highlight' || skill.slot === 'S2' || skill.slot === 'S3') skill.power = 0;
    if (sourceType === 'highlight' || skill.slot === 'S3') skill.target = 'ally';
    if (skill.slot === 'S3') {
      const spent = Math.max(0, Math.floor(actor.sp));
      skill.cost = spent;
      skill.windTempestSpent = spent;
    }
    return skill;
  },
  afterSkill(engine, actor, skill, targetId, sourceType) {
    if (!own(actor) || !['character_skill', 'highlight'].includes(sourceType)) return;
    const allies = alive(engine), weapon = actor.windTempest.weapon;
    if (sourceType === 'character_skill' && skill.slot === 'S1') {
      restore(engine, actor, 16 * Number(actor.spRecovery || 100) / 100, sourceType);
      if (weapon === 'four-star') {
        const prior = actor.buffs.find(effect => effect.id === 'wind-tempest_weapon4_sp_restore');
        const stacks = Math.min(2, Number(prior?.stacks || 0) + 1);
        buff(engine, actor, 'weapon4_sp_restore', 'critDamage', values.weapon4Crit[actor.windTempest.refinement] * stacks, 2, 'equipment', { stacks });
      }
    }
    if (sourceType === 'character_skill' && skill.slot === 'S2') {
      for (const ally of allies) {
        buff(engine, ally, 'arrival', 'attack', .128 * excess(engine, actor) + (actor.awareness >= 1 && ally.role === 'Sweeper' ? .25 : 0), 2, sourceType);
        restore(engine, ally, ally.id === actor.id ? 4 * Number(actor.spRecovery || 100) / 100 : 4, sourceType);
      }
      actor.windTempest.arrivalRefundAvailable = true;
      buff(engine, actor, 'arrival_refund', 'arrivalRefund', 1, 2, sourceType);
    }
    if (sourceType === 'character_skill' && skill.slot === 'S3') {
      const target = allies.find(ally => ally.id === targetId && ally.id !== actor.id) || allies.find(ally => ally.id !== actor.id);
      if (target) {
        buff(engine, target, 'blossoming_crit_rate', 'critRate', [.16, .17, .17, .18][tier(engine, actor)], 2, sourceType);
        target.windTempestUnravel = { ownerId: actor.id, stacks: 0 };
        buff(engine, target, `unravel_${actor.id}`, 'unravel', 1, 2, sourceType);
      }
      if (actor.awareness >= 2) restore(engine, actor, 50, 'awareness');
    }
    if (sourceType === 'character_skill' && weapon === 'signature' && ['S2', 'S3'].includes(skill.slot)) {
      const main = allies.find(ally => ally.id === targetId && ally.id !== actor.id) || allies.find(ally => ally.id !== actor.id);
      for (const ally of allies.filter(ally => ally.id !== actor.id)) buff(engine, ally, 'windplum_party_crit', 'critDamage', values.weapon5PartyCrit[actor.windTempest.refinement], 2, 'equipment');
      if (main) buff(engine, main, 'windplum_spent_damage', 'damage', Math.floor(Number(skill.windTempestSpent ?? skill.cost ?? 0) / 50) * [.033, .043, .043, .053, .053, .063, .063][actor.windTempest.refinement], 2, 'equipment');
    }
    if (sourceType === 'highlight') {
      const others = allies.filter(ally => ally.id !== actor.id);
      const targets = actor.awareness >= 4 ? others : others.filter(ally => ally.id === targetId);
      for (const ally of targets) {
        buff(engine, ally, 'highlight_attack', 'flatAttack', 250 * excess(engine, actor), 2, sourceType);
        buff(engine, ally, 'highlight_critical', 'critDamage', values.highlightCrit[tier(engine, actor)] + (actor.awareness >= 4 && ally.id === targetId ? .12 : 0), 2, sourceType);
      }
      for (const ally of others) restore(engine, ally, actor.awareness >= 4 ? 32 : 20, sourceType);
    }
  },
  beforeDamage(engine, owner, actor, original, target) {
    if (!own(owner) || owner.hp <= 0) return original;
    const skill = { ...original };
    const petals = target.debuffs?.find(status => status.id === `wind-tempest_falling_petals_${owner.id}`);
    if (petals && skill.element === 'wind') {
      skill.temporaryAttackBonus = Number(skill.temporaryAttackBonus || 0) + .183 * excess(engine, owner);
      if (owner.awareness >= 1) skill.temporaryCritDamage = Number(skill.temporaryCritDamage || 0) + .30;
    }
    if (owner.awareness >= 6) skill.temporaryCritDamage = Number(skill.temporaryCritDamage || 0) + Math.max(0, rawCrit(actor) - 1) * 2;
    return skill;
  },
  onDamage(engine, owner, packet) {
    if (!own(owner) || packet.actualDamage <= 0 || !packet.actor) return;
    const { actor, skill, target, sourceType } = packet;
    if (actor.id === owner.id && skill.slot === 'S1' && skill.element === 'wind') engine.applyEnemyStatus(target, 'debuffs', {
      id: `wind-tempest_falling_petals_${owner.id}`, name: 'FALLING PETALS', duration: owner.awareness >= 6 ? 3 : 2
    }, sourceType, owner.id);
    if (owner.windTempest.arrivalRefundAvailable && hasBuff(owner, 'arrival_refund') && actor.id !== owner.id && ['character_skill', 'resonance_follow_up', 'highlight', 'theurgy'].includes(sourceType)) {
      owner.windTempest.arrivalRefundAvailable = false;
      owner.buffs = owner.buffs.filter(effect => effect.id !== 'wind-tempest_arrival_refund');
      restore(engine, owner, 12, 'passive');
    }
    if (actor.windTempestUnravel?.ownerId === owner.id && ['character_skill', 'resonance_follow_up', 'highlight', 'theurgy'].includes(sourceType)) grantBlossom(engine, owner, actor);
  }
};
