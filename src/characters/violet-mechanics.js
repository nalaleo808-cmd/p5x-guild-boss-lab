import { coefficients as C, owns, value, buff, initializeResearch, prepareSkill } from './violet-data.js';

const count = unit => unit.violet.leadSteps + unit.violet.followStep;
function gainedStep(engine, actor, gained) {
  const steps = count(actor);
  if (actor.awareness >= 2 && steps >= 2) buff(engine, actor, 'a2_attack', 'attack', .33, null, 'awareness');
  if (actor.awareness >= 2 && steps >= 3) buff(engine, actor, 'a2_crit', 'critDamage', .33, null, 'awareness');
  if (gained && actor.violet.weapon === 'signature') buff(engine, actor, 'weapon_step', 'attack', C.weaponStepAttack[actor.violet.refinement], 2, 'equipment');
}
export const characterMechanics = {
  slug: 'violet',
  initialize(engine, unit) {
    if (initializeResearch(engine, unit)) Object.assign(unit.violet, { leadSteps: 0, followStep: 0, dancePartnerId: null });
  },
  actionUnavailableReason(engine, unit, skill, sourceType) {
    if (owns(unit) && unit.violet && sourceType === 'highlight') return 'Masquerade activation and shared Highlight integration required.';
    return null;
  },
  beforeSkill(engine, actor, skill, targetId, sourceType) {
    const prepared = prepareSkill(actor, skill, sourceType);
    if (prepared === skill) return skill;
    if (skill.slot === 'S2' && !engine.state.party.some(unit => unit.id === targetId && unit.id !== actor.id && unit.hp > 0))
      throw new Error('Invitation requires another living ally.');
    return prepared;
  },
  beforeDamage(engine, owner, actor, original) {
    if (!owns(owner) || owner !== actor || !owner.violet) return original;
    const skill = { ...original };
    if (skill.element === 'bless') skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + Math.min(.45, count(owner) * .15);
    if (owner.violet.weapon === 'four-star' && count(owner) >= 2) skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + C.weaponTwoSteps[owner.violet.refinement];
    return skill;
  },
  afterSkill(engine, actor, skill, targetId, sourceType) {
    if (!owns(actor) || skill.characterPrepared !== 'violet' || sourceType !== 'character_skill') return;
    if (skill.slot === 'S1') {
      const before = actor.violet.leadSteps;
      actor.violet.leadSteps = Math.min(3, before + 1);
      gainedStep(engine, actor, actor.violet.leadSteps > before);
    }
    if (skill.slot === 'S2') {
      const target = engine.state.party.find(unit => unit.id === targetId && unit.hp > 0 && unit.id !== actor.id);
      if (!target) return;
      actor.violet.dancePartnerId = target.id;
      // Metadata only: reaction and duration consumption await an afterAllySkill hook.
      actor.violet.dancePartnerSourceDuration = actor.awareness >= 1 ? 2 : 1;
      const gained = actor.violet.followStep === 0;
      actor.violet.followStep = 1;
      for (const unit of [actor, target]) {
        buff(engine, unit, 'invitation', 'attack', value(actor, C.invitation), 3, sourceType);
        if (actor.awareness >= 1) buff(engine, unit, 'a1_invitation', 'critRate', .15, 3, 'awareness');
      }
      gainedStep(engine, actor, gained);
    }
  }
};
