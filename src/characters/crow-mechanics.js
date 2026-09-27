import { coefficients as C, owns, value, buff, initializeResearch, prepareSkill } from './crow-data.js';

const aliveParty = engine => engine.state.party.filter(unit => unit.hp > 0);
const preferred = unit => ['sweeper', 'assassin'].includes(String(unit.role || unit.class || '').toLowerCase());
function mastermind(owner, actor) { return owner.awareness >= 6 ? actor !== owner : owner.crow.mastermindId === actor.id; }
function selectMastermind(engine, owner) {
  const candidates = aliveParty(engine).filter(preferred).sort((a, b) => Number(b.attack || 0) - Number(a.attack || 0));
  owner.crow.mastermindId = (candidates[0] || owner).id;
}
function deduction(engine, actor, sourceType) {
  for (const unit of engine.state.party.filter(unit => unit.hp > 0))
    buff(engine, unit, 'deduction', 'damage', value(actor, C.deduction), actor.awareness >= 1 ? 4 : 2, sourceType);
}
export const characterMechanics = {
  slug: 'crow',
  initialize(engine, unit) {
    if (!initializeResearch(engine, unit)) return;
    unit.crow.suspicion = false;
    unit.crow.recordedDamage = 0;
    selectMastermind(engine, unit);
    if (unit.awareness >= 1) deduction(engine, unit, 'awareness');
  },
  actionUnavailableReason(engine, unit, skill, sourceType) {
    if (!owns(unit) || !unit.crow || !['character_skill', 'highlight'].includes(sourceType)) return null;
    if (skill.slot === 'S3') return 'Rain of Justice requires Arrow of Truth recording and Perjury hit resolution.';
    return null;
  },
  beforeSkill(engine, actor, skill, targetId, sourceType) { return prepareSkill(actor, skill, sourceType); },
  beforeDamage(engine, owner, actor, original, target, sourceType) {
    if (!owns(owner) || !owner.crow) return original;
    const skill = { ...original };
    if (actor === owner && skill.element === 'almighty') {
      const defenseDown = (target.debuffs || []).filter(effect => effect.stat === 'defenseDown' || effect.id === 'def_down').reduce((sum, effect) => sum + Number(effect.value || 0), 0);
      skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + Math.min(1.2, defenseDown * .5);
      if (owner.crow.weapon === 'four-star') skill.actionDamageBonus += C.weaponAlmighty[owner.crow.refinement];
    }
    if (owner.awareness >= 1 && (target.debuffs || []).some(effect => effect.id === 'crow_stratagem') && (actor === owner || mastermind(owner, actor)) && (actor.buffs || []).some(effect => effect.id === 'crow_deduction')) {
      skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + .25;
      if (actor === owner) skill.critBonus = Number(skill.critBonus || 0) + .16;
    }
    return skill;
  },
  onDamage(engine, owner, packet) {
    if (!owns(owner) || !owner.crow || packet.actualDamage <= 0 || packet.actor === owner || !mastermind(owner, packet.actor)) return;
    if (!['character_skill', 'basic_attack', 'highlight', 'theurgy', 'resonance_follow_up'].includes(packet.sourceType)) return;
    const factor = packet.skill.target === 'all_enemies' ? 1 / Math.max(1, engine.enemies.filter(enemy => enemy.alive !== false).length) : .4;
    owner.crow.recordedDamage += packet.actualDamage * factor;
  },
  afterSkill(engine, actor, skill, targetId, sourceType) {
    if (!owns(actor) || skill.characterPrepared !== 'crow' || sourceType !== 'character_skill') return;
    if (!['S1', 'S2'].includes(skill.slot)) return;
    actor.crow.suspicion = true;
    if (skill.slot === 'S1') {
      const allies = engine.state.party.filter(unit => unit.hp > 0);
      for (const unit of allies) engine.healUnit(actor, unit, value(actor, C.heal));
      engine.grantBlessing(allies, 1, sourceType);
      deduction(engine, actor, sourceType);
    } else {
      for (const enemy of engine.enemies.filter(enemy => enemy.alive !== false)) engine.applyEnemyStatus(enemy, 'debuffs', {
        id: 'crow_stratagem', name: 'STRATAGEM', stat: 'defenseDown', value: value(actor, C.stratagem),
        duration: actor.awareness >= 1 ? 4 : 2
      }, sourceType, actor.id);
    }
  }
};
