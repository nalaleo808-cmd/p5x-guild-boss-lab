import { sourceTier } from './rin-data.js';

const owns = unit => unit?.slug === 'rin';
const speed = unit => Math.max(0, Number(unit.speed || 0));
const memory = (unit, amount) => {
  unit.rin.memory += amount;
  if (unit.rin.memory >= 40) {
    unit.rin.memory = 0; // Source says spend all, not subtract forty.
    unit.rin.soup += 1;
  }
};
const refresh = (engine, unit) => engine.applyUnitBuff(unit, {
  id: 'base_rin_kung_fu', name: 'Kung Fu Mastery', stat: 'attack',
  value: Math.min(.9, speed(unit) / 2 * .01), duration: null
}, 'passive');
const targets = (engine, targetId, result) => {
  if (Array.isArray(result?.targets)) return result.targets.map(target => typeof target === 'string'
    ? engine.enemies.find(foe => foe.id === target) : target).filter(Boolean);
  return engine.enemies.filter(foe => foe.alive !== false && foe.hp > 0 && (targetId === 'all_enemies' || foe.id === targetId));
};

export const characterMechanics = {
  slug: 'rin',
  initialize(engine, unit) {
    if (!owns(unit) || unit.rin) return;
    sourceTier(engine, unit);
    unit.rin = { memory: 0, soup: unit.awareness >= 1 ? 1 : 0 };
    refresh(engine, unit);
  },
  onTurnStart(engine, unit) {
    if (!owns(unit) || !unit.rin || unit.hp <= 0) return;
    memory(unit, Math.min(18, Math.floor(speed(unit) / 10)));
    refresh(engine, unit);
  },
  beforeSkill(engine, actor, skill, targetId, sourceType) {
    if (!owns(actor) || !actor.rin || !skill.characterAction?.startsWith('rin:')) return skill;
    if (!['character_skill', 'highlight'].includes(sourceType)) return skill;
    return { ...skill, power: skill.powerTiers[sourceTier(engine, actor)], rinSpeedAtCast: speed(actor) };
  },
  afterSkill(engine, actor, skill, targetId, sourceType, result) {
    if (!owns(actor) || !actor.rin || !['character_skill', 'highlight'].includes(sourceType)) return;
    const tier = sourceTier(engine, actor);
    const castSpeed = skill.rinSpeedAtCast ?? speed(actor);
    if (skill.characterAction === 'rin:S1') {
      const foes = targets(engine, targetId, result);
      memory(actor, new Set(foes.map(foe => foe.id)).size * 4);
      for (const foe of foes.filter(foe => foe.alive !== false && foe.hp > 0)) engine.applyEnemyStatus(foe, 'debuffs', {
        id: 'base_rin_ferry', name: 'Underworld Ferry', stat: 'defenseDown',
        value: Math.min([.497, .548, .535, .586][tier], castSpeed / 10 * .03), duration: 2
      }, sourceType, actor.id);
    }
    if (skill.characterAction === 'rin:S2') {
      for (const foe of targets(engine, targetId, result)) {
        if (foe.alive === false || foe.hp <= 0 || !foe.debuffs?.some(status => status.spiritualAilment === true
          || ['forget', 'sleep', 'confuse', 'confusion', 'fear', 'despair', 'rage', 'brainwash'].includes(status.id))) continue;
        engine.applyEnemyStatus(foe, 'debuffs', { id: 'base_rin_naihe', name: 'Flowers of Naihe', damageTaken: true,
          value: Math.min([.323, .323, .343, .343][tier], castSpeed / 10 * .02), duration: 1 }, sourceType, actor.id);
      }
    }
    if (skill.characterAction === 'rin:S3') {
      const exposure = Math.min([.485, .535, .522, .572][tier], castSpeed / 10 * .03);
      for (const foe of targets(engine, targetId, result).filter(foe => foe.alive !== false && foe.hp > 0)) {
        engine.applyEnemyStatus(foe, 'debuffs', { id: `base_rin_red_spider_${actor.id}`,
          name: 'Red Spider Lily', damageTaken: true, value: exposure, hitsRemaining: 2,
          sourceActorId: actor.id, duration: 2 }, sourceType, actor.id);
      }
    }
    if (skill.characterAction === 'rin:HL') {
      const exposure = [.488, .538, .518, .568][tier];
      for (const foe of targets(engine, targetId, result).filter(foe => foe.alive !== false && foe.hp > 0)) {
        engine.applyEnemyStatus(foe, 'debuffs', { id: `base_rin_highlight_${actor.id}`,
          name: 'Meng Po Soup', damageTaken: true, value: exposure, hitsRemaining: 1,
          sourceActorId: actor.id, duration: null }, sourceType, actor.id);
      }
    }
  },
  beforeDamage(engine, owner, actor, original, target, sourceType) {
    if (!owns(owner) || owner.hp <= 0 || actor.id !== owner.id || !owner.rin || original.element !== 'curse') return original;
    const skill = { ...original };
    const highHp = target.finiteHp === false || (!(target.maxHp > 0)) || target.hp / target.maxHp > .5;
    if (highHp) skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + .30;
    if (skill.characterAction === 'rin:S2' && (target.debuffs || []).length > 0) {
      skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + .20;
    }
    return skill;
  },
  onDamage(engine, owner, packet) {
    if (!owns(owner) || owner.hp <= 0 || !(packet.actualDamage > 0)) return;
    const consumables = (packet.target.debuffs || []).filter(status => status.sourceActorId === owner.id
      && ['base_rin_red_spider_', 'base_rin_highlight_'].some(prefix => status.id === `${prefix}${owner.id}`));
    for (const status of consumables) status.hitsRemaining -= 1;
    if (consumables.length) packet.target.debuffs = packet.target.debuffs.filter(status => !consumables.includes(status) || status.hitsRemaining > 0);
  }
};
