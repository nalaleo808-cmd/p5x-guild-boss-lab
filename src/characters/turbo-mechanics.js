import { coefficients as C, owns, value, buff, initializeResearch, prepareSkill } from './turbo-data.js';

const party = engine => engine.state.party.filter(unit => unit.hp > 0);
const scaled = (actor, base, increment, cap) => Math.min(value(actor, cap), value(actor, base) + Math.max(0, actor.speed) / 10 * increment);
function torque(engine, actor) {
  const total = actor.turbo.totalVelocity;
  const level = total >= 350 ? 3 : total >= 220 ? 2 : total >= 100 ? 1 : 0;
  actor.turbo.torqueLevel = level;
  if (!level) return;
  for (const unit of party(engine)) {
    buff(engine, unit, 'torque', 'pierce', level * .05, null, 'passive');
    if (actor.awareness >= 2) {
      buff(engine, unit, 'torque_crit', 'critDamage', .2, null, 'awareness');
      if (level >= 2) buff(engine, unit, 'torque_damage', 'damage', .2, null, 'awareness');
      if (level >= 3) buff(engine, unit, 'torque_attack', 'attack', .3, null, 'awareness');
    }
  }
}
export const characterMechanics = {
  slug: 'turbo',
  initialize(engine, unit) {
    if (!initializeResearch(engine, unit)) return;
    unit.turbo.velocity = unit.awareness >= 6 ? 120 : 90;
    unit.turbo.totalVelocity = unit.turbo.velocity;
    torque(engine, unit);
  },
  beforeSkill(engine, actor, skill, targetId, sourceType) { return prepareSkill(actor, skill, sourceType); },
  afterSkill(engine, actor, skill, targetId, sourceType) {
    if (!owns(actor) || skill.characterPrepared !== 'turbo') return;
    const grant = (id, stat, amount, duration = 2) => {
      for (const unit of party(engine)) buff(engine, unit, id, stat, amount, duration, sourceType);
    };
    if (skill.slot === 'S1') grant('shockwave', 'damage', scaled(actor, C.normalBase, .02, C.normalCap));
    if (skill.slot === 'S2') {
      grant('aero_attack', 'attack', scaled(actor, C.normalBase, .02, C.normalCap));
      grant('aero_defense', 'defense', scaled(actor, C.defBase, .0222, C.defCap));
    }
    if (skill.slot === 'S3') {
      grant('power_attack', 'attack', scaled(actor, C.attackBase, .0289, C.attackCap));
      grant('power_pierce', 'pierce', scaled(actor, C.pierceBase, .0022, C.pierceCap));
    }
    if (skill.slot === 'HL' && sourceType === 'highlight') {
      const duration = actor.awareness >= 4 ? 3 : 2;
      const amount = scaled(actor, C.hlBase, .0133, C.hlCap);
      grant('highlight_attack', 'attack', amount, duration);
      grant('highlight_damage', 'damage', amount + (actor.awareness >= 4 ? .1 : 0), duration);
      actor.turbo.highlightDownRecipientId = targetId;
    }
    if (actor.turbo.weapon === 'signature' && sourceType === 'character_skill') {
      const steps = Math.floor(actor.turbo.totalVelocity / 40);
      const amount = Math.min(C.weaponVelocityCap[actor.turbo.refinement], steps * C.weaponVelocityDamage[actor.turbo.refinement]);
      for (const unit of party(engine)) buff(engine, unit, 'weapon_velocity', 'damage', amount, 2, 'equipment');
    }
  },
  onDamage(engine, owner, packet) {
    if (!owns(owner) || !owner.turbo || !owner.turbo.highlightDownRecipientId || packet.actualDamage <= 0) return;
    if (packet.actor.id !== owner.turbo.highlightDownRecipientId || !['basic_attack', 'character_skill', 'persona_skill', 'highlight', 'theurgy'].includes(packet.sourceType)) return;
    const target = packet.target;
    if (!target.downed && target.downPoints > 0) target.downPoints = Math.max(0, target.downPoints - 1);
    owner.turbo.highlightDownRecipientId = null;
  },
  onAllyActionEnd(engine, owner, completedActor, context = {}) {
    if (!owns(owner) || !owner.turbo || owner.hp <= 0 || !completedActor || !engine.state.party.some(unit => unit.id === completedActor.id)) return;
    // Parent dispatches this only for counted actions; reject explicitly non-counted events defensively.
    if (['highlight', 'theurgy', 'follow_up', 'resonance_follow_up', 'one_more', 'medicine', 'free_toggle'].includes(context.actionType)) return;
    const gained = 4 + Math.min(6, Math.floor(Math.max(0, owner.speed - 100) / 10)) + (owner.awareness >= 1 ? 10 : 0);
    owner.turbo.velocity += gained;
    owner.turbo.totalVelocity += gained;
    torque(engine, owner);
  }
};
