import { sourceTier } from './joker-data.js';

const owns = unit => unit?.slug === 'joker';
const refresh = (engine, unit) => {
  engine.applyUnitBuff(unit, { id: 'joker_resistance', name: 'Resistance', stat: 'attack',
    value: unit.joker.will * .18, duration: null }, 'passive');
  // The scheduler owns the action itself. This request is intentionally data,
  // rather than an action-limit mutation, so a normal action is never silently
  // converted into an extra action.
  const ready = unit.joker.will >= 3 && !unit.joker.extraActionActive;
  unit.joker.extraActionReady = ready;
  if (ready && !unit.joker.extraActionRequest) unit.joker.extraActionRequest = {
    reason: 'joker_will_of_rebellion', preserveTimedEffects: true, spendWillOnEnd: 3
  };
};
const gain = (engine, unit, amount) => {
  unit.joker.will = Math.min(5, unit.joker.will + amount);
  refresh(engine, unit);
};

export const characterMechanics = {
  slug: 'joker',
  initialize(engine, unit) {
    if (!owns(unit) || unit.joker) return;
    sourceTier(engine, unit);
    unit.joker = { will: 0, thresholdFoes: [], extraActionReady: false, extraActionActive: false, extraActionRequest: null };
    refresh(engine, unit);
  },
  beforeSkill(engine, actor, skill, targetId, sourceType) {
    if (!owns(actor) || !actor.joker || !skill.characterAction?.startsWith('joker:')) return skill;
    if (!['character_skill', 'highlight'].includes(sourceType)) return skill;
    return { ...skill, power: skill.powerTiers[sourceTier(engine, actor)], jokerMainTargetId: targetId,
      jokerExtraAction: actor.joker.extraActionActive === true,
      jokerFoesAtCast: engine.enemies.filter(foe => foe.alive !== false && foe.hp > 0).length };
  },
  afterSkill(engine, actor, skill, targetId, sourceType) {
    if (!owns(actor) || !actor.joker) return;
    if (sourceType === 'character_skill' && skill.characterAction === 'joker:S1') gain(engine, actor, 1);
    if (sourceType === 'character_skill' && skill.characterAction === 'joker:S2' && skill.jokerFoesAtCast === 1) gain(engine, actor, 2);
    if (sourceType === 'highlight' && skill.characterAction === 'joker:HL') gain(engine, actor, actor.awareness >= 4 ? 3 : 1);
  },
  beforeDamage(engine, owner, actor, original, target, sourceType) {
    if (!owns(owner) || owner.hp <= 0 || actor.id !== owner.id || !owner.joker) return original;
    if (!['character_skill', 'highlight'].includes(sourceType)) return original;
    const skill = { ...original };
    if (owner.awareness >= 1 && skill.characterAction?.startsWith('joker:')) {
      skill.actionDamageBonus = Number(skill.actionDamageBonus || 0)
        + (target.id === skill.jokerMainTargetId ? .30 : .10);
    }
    if (skill.jokerExtraAction === true) {
      // Adverse Resolve applies to every damage packet on the scheduled extra action.
      skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + .72;
      if (skill.characterAction === 'joker:S3') skill.actionDamageBonus += .25;
    }
    if (skill.characterAction === 'joker:S3' && (target.debuffs || []).length > 0) {
      skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + .25;
    }
    return skill;
  },
  getExtraActionRequest(engine, unit) {
    if (!owns(unit) || !unit.joker?.extraActionRequest || unit.joker.extraActionActive) return null;
    // The scheduler asks after a normal action has been consumed. Return a
    // copy so scheduler bookkeeping cannot mutate the character state.
    return { ...unit.joker.extraActionRequest };
  },
  onExtraActionStart(engine, unit) {
    if (!owns(unit) || !unit.joker?.extraActionRequest) return false;
    unit.joker.extraActionActive = true;
    unit.joker.extraActionReady = false;
    unit.joker.extraActionRequest = null;
    return true;
  },
  onExtraActionEnd(engine, unit) {
    if (!owns(unit) || !unit.joker?.extraActionActive) return false;
    unit.joker.will = Math.max(0, unit.joker.will - 3);
    unit.joker.extraActionActive = false;
    refresh(engine, unit);
    return true;
  },
  onActionEnd(engine, unit, context = {}) {
    if (!owns(unit) || !unit.joker || unit.hp <= 0) return;
    // Parent integration may use this boundary instead of calling
    // onExtraActionEnd directly, but must call only one of them.
    if (context.isExtraAction === true) {
      characterMechanics.onExtraActionEnd(engine, unit);
      return;
    }
    for (const foe of engine.enemies) {
      // Infinite-HP score objects have no meaningful low-HP threshold.
      if (foe.finiteHp === false || !(foe.maxHp > 0) || foe.hp / foe.maxHp >= .6) continue;
      if (unit.joker.thresholdFoes.includes(foe.id)) continue;
      unit.joker.thresholdFoes.push(foe.id);
      gain(engine, unit, 1);
    }
  }
};
