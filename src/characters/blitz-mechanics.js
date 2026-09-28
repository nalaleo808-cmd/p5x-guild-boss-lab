import { coefficients as C, owns, value, buff, initializeResearch, prepareSkill } from './blitz-data.js';

const party = engine => engine.state.party.filter(unit => unit.hp > 0);
const scaled = (unit, perTen, cap) => Math.min(value(unit, cap), Math.max(0, Number(unit.speed || 0)) / 10 * perTen);
function reduceDown(engine, actor, target, amount, sourceType) {
  if (target.downed || !(amount > 0)) return false;
  target.downPoints = Math.max(0, Number(target.downPoints || 0) - amount);
  if (target.downPoints > 0) return false;
  target.downed = true;
  engine.queueDownActions?.(actor, target, sourceType);
  return true;
}
// In the guild boss guide, S2 does not replace an active S1 Hard Knocks,
// even when its skill rank would give a stronger value. Same-skill recasts
// retain the normal refresh behavior. See https://www.youtube.com/watch?v=PqC0C_0F5-k&t=345s
function applySharedDebuff(engine, actor, target, status, sourceType, skillSlot) {
  const existing = (target.debuffs || []).find(effect => effect.id === status.id);
  if (existing?.blitzSkillSlot && existing.blitzSkillSlot !== skillSlot) return existing;
  return engine.applyEnemyStatus(target, 'debuffs', { ...status, blitzSkillSlot: skillSlot }, sourceType, actor.id);
}
function hardKnocks(engine, actor, target, duration, sourceType, skillSlot) {
  const bonus = (actor.buffs || []).find(effect => effect.stat === 'blitzHardKnocksDefense')?.value || 0;
  applySharedDebuff(engine, actor, target, { id: `blitz_hard_knocks_${actor.id}`, name: 'HARD KNOCKS DEF', stat: 'defenseDown',
    value: Math.min(value(actor, C.hardKnocksDefense), bonus + value(actor, C.hardKnocksDefenseBase) + scaled(actor, .0222, C.hardKnocksDefense)), duration }, sourceType, skillSlot);
  applySharedDebuff(engine, actor, target, { id: `blitz_hard_knocks_taken_${actor.id}`, name: 'HARD KNOCKS DAMAGE TAKEN', damageTaken: true,
    value: Math.min(value(actor, C.hardKnocksTaken), value(actor, C.hardKnocksTakenBase) + scaled(actor, .0178, C.hardKnocksTaken)), duration }, sourceType, skillSlot);
}
function detention(engine, actor, target, sourceType, skillSlot) {
  applySharedDebuff(engine, actor, target, { id: `blitz_detention_${actor.id}`, name: 'DETENTION', blitzDetention: true,
    value: Math.min(value(actor, C.detentionTaken), value(actor, C.detentionTakenBase) + scaled(actor, .0155, C.detentionTaken)), duration: 1 }, sourceType, skillSlot);
}
function knockdown(engine, owner, packet) {
  const { actor, target, skill, sourceType } = packet;
  if (actor !== owner || skill.blitzWasDown || !target.downed) return;
  if (owner.awareness >= 1) { target.downMax = Math.max(1, Number(target.downMax || 1) - 1); target.downPoints = Math.min(target.downPoints, target.downMax); }
  if (owner.awareness >= 2) {
    owner.blitz.a2Knockdowns = Math.min(3, (owner.blitz.a2Knockdowns || 0) + 1);
    for (const unit of party(engine)) buff(engine, unit, 'a2_party_attack', 'attack', owner.blitz.a2Knockdowns * .1, null, 'awareness');
    engine.applyEnemyStatus(target, 'debuffs', { id: `blitz_a2_down_${owner.id}`, name: 'ROLE MODEL', blitzDownedTaken: true, value: .1, duration: 1 }, sourceType, owner.id);
  }
  if (owner.blitz.highlightKnockdownPrimed) { engine.applyEnemyStatus(target, 'debuffs', { id: `blitz_a4_down_${owner.id}`, name: 'CLASS IN SESSION', damageTaken: true, value: .2, duration: null }, sourceType, owner.id); owner.blitz.highlightKnockdownPrimed = false; }
  if (owner.blitz.weapon === 'four-star') {
    const existing = (owner.buffs || []).find(effect => effect.id === 'blitz_weapon_knockdown');
    buff(engine, owner, 'weapon_knockdown', 'attack', Math.min(C.weaponKnockdownCap[owner.blitz.refinement], Number(existing?.value || 0) + C.weaponKnockdown[owner.blitz.refinement]), 1, 'equipment');
  }
}

export const characterMechanics = {
  slug: 'blitz',
  initialize(engine, unit) { if (initializeResearch(engine, unit)) Object.assign(unit.blitz, { lightningLegsAvailable: false, lightningLegsTurns: 0, a2Knockdowns: 0 }); },
  onTurnStart(engine, unit) {
    if (!owns(unit) || !unit.blitz?.lightningLegsExpiresAt) return;
    if (Number(unit.characterTurnsStarted || 0) >= unit.blitz.lightningLegsExpiresAt) unit.blitz.lightningLegsTurns = 0;
  },
  actionUnavailableReason(engine, unit, skill, sourceType) {
    if (owns(unit) && unit.blitz && sourceType === 'character_skill' && skill.slot === 'S3' && !unit.blitz.lightningLegsAvailable) return 'Use Discharge Sprocket to unlock one Lightning Legs cast.';
    return null;
  },
  beforeSkill(engine, actor, skill, targetId, sourceType) {
    const reason = characterMechanics.actionUnavailableReason(engine, actor, skill, sourceType); if (reason) throw new Error(reason);
    const prepared = prepareSkill(actor, skill, sourceType);
    if (prepared !== skill) {
      prepared.blitzLightningLegs = actor.blitz.lightningLegsTurns > 0;
      // S2/S3 supply their own affinity-independent Down reduction in onDamage.
      // Do not also apply the engine's weakness/critical reduction to these casts.
      if (sourceType === 'character_skill' && ['S2', 'S3'].includes(prepared.slot)) prepared.canReduceDown = false;
    }
    return prepared;
  },
  beforeDamage(engine, owner, actor, original, target) {
    if (!owns(owner) || !owner.blitz) return original;
    const skill = { ...original, blitzWasDown: target.downed === true };
    const detentionStatus = (target.debuffs || []).find(effect => effect.blitzDetention && target.downed);
    if (detentionStatus) skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + Number(detentionStatus.value || 0) + (owner.awareness >= 6 ? .2 : 0);
    if (target.downed && (target.debuffs || []).some(effect => effect.blitzDownedTaken)) skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + .1;
    return skill;
  },
  onDamage(engine, owner, packet) {
    if (!owns(owner) || !owner.blitz || packet.actor !== owner || packet.actualDamage <= 0) return;
    const { skill, target, sourceType } = packet;
    if (sourceType === 'character_skill' && skill.slot === 'S2') { reduceDown(engine, owner, target, skill.blitzLightningLegs ? 4 : 1, sourceType); if (skill.blitzLightningLegs) detention(engine, owner, target, sourceType, 'S2'); }
    if (sourceType === 'character_skill' && skill.slot === 'S3') { reduceDown(engine, owner, target, 5, sourceType); detention(engine, owner, target, sourceType, 'S3'); if (!skill.blitzWasDown && target.downed) owner.blitz.s3Knocked = true; }
    knockdown(engine, owner, packet);
  },
  afterSkill(engine, actor, skill, targetId, sourceType, context = {}) {
    if (!owns(actor) || skill.characterPrepared !== 'blitz') return;
    if (sourceType === 'character_skill' && skill.slot === 'S1') { actor.blitz.lightningLegsAvailable = true; for (const enemy of engine.enemies.filter(enemy => enemy.alive !== false)) hardKnocks(engine, actor, enemy, 3, sourceType, 'S1'); }
    if (sourceType === 'character_skill' && skill.slot === 'S2') for (const enemy of engine.enemies.filter(enemy => enemy.alive !== false)) hardKnocks(engine, actor, enemy, 1, sourceType, 'S2');
    if (sourceType === 'character_skill' && skill.slot === 'S3') { actor.blitz.lightningLegsAvailable = false; if (actor.blitz.s3Knocked) { actor.blitz.lightningLegsTurns = 2; actor.blitz.lightningLegsExpiresAt = Number(actor.characterTurnsStarted || 0) + 3; } actor.blitz.s3Knocked = false; if (context.packets?.some(packet => packet.actualDamage > 0)) buff(engine, actor, 'hard_knocks_a0', 'blitzHardKnocksDefense', .1, 2, 'passive'); if (actor.blitz.weapon === 'signature') buff(engine, actor, 'weapon_legs_crit', 'critRate', C.weaponLegsCrit[actor.blitz.refinement], 2, 'equipment'); }
    if (sourceType !== 'highlight' || skill.slot !== 'HL') return;
    actor.blitz.highlightKnockdownPrimed = actor.awareness >= 4;
    for (const enemy of engine.enemies.filter(enemy => enemy.alive !== false)) {
      engine.applyEnemyStatus(enemy, 'debuffs', { id: 'blitz_highlight_defense', name: 'BLITZ HL DEF', stat: 'defenseDown', value: value(actor, C.hlDefense), duration: null }, sourceType, actor.id);
      engine.applyEnemyStatus(enemy, 'debuffs', { id: 'blitz_highlight_taken', name: 'BLITZ HL DAMAGE TAKEN', damageTaken: true, value: value(actor, C.hlTaken), duration: 3 }, sourceType, actor.id);
    }
  }
};
