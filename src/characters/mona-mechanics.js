import { sourceTier } from './mona-data.js';

const owns = unit => unit?.slug === 'mona';
const gain = (unit, amount = 1) => { unit.mona.chivalry = Math.min(3, unit.mona.chivalry + amount); };
const attack = unit => Number(unit.attack || 0) * (1 + (unit.buffs || []).filter(buff => buff.stat === 'attack')
  .reduce((sum, buff) => sum + buff.value, 0)) + (unit.buffs || []).filter(buff => buff.stat === 'flatAttack')
  .reduce((sum, buff) => sum + buff.value, 0);

export const characterMechanics = {
  slug: 'mona',
  initialize(engine, unit) {
    if (!owns(unit) || unit.mona) return;
    sourceTier(engine, unit);
    unit.mona = { chivalry: 0, previousSkill: null };
  },
  beforeSkill(engine, actor, skill, targetId, sourceType) {
    if (!owns(actor) || !actor.mona || !skill.characterAction?.startsWith('mona:')) return skill;
    if (!['character_skill', 'highlight'].includes(sourceType)) return skill;
    const tier = sourceTier(engine, actor);
    const prepared = { ...skill, power: skill.powerTiers[tier] };
    if (skill.characterAction === 'mona:S2') {
      // Use the current Attack snapshot and the public healing API after the cast.
      // Do not put heal/healFlat on this skill as that would heal twice.
      prepared.monaHealing = attack(actor) * [.376, .376, .399, .399][tier] + [1069, 1300, 1315, 1546][tier];
    }
    return prepared;
  },
  afterSkill(engine, actor, skill, targetId, sourceType, result = {}) {
    if (!owns(actor) || !actor.mona || sourceType !== 'character_skill' || !skill.characterAction?.startsWith('mona:')) return;
    if (actor.mona.previousSkill !== skill.characterAction) gain(actor);
    actor.mona.previousSkill = skill.characterAction;
    const foe = engine.enemies.find(target => target.id === targetId);
    if (skill.characterAction === 'mona:S1') {
      if (foe?.hp > 0 && foe.alive !== false) engine.applyEnemyStatus(foe, 'debuffs', {
        id: 'windswept', name: 'Windswept', elementalAilment: true, duration: 2
      }, sourceType, actor.id);
      const criticalRate = actor.crit + (actor.buffs || []).filter(buff => buff.stat === 'critRate').reduce((sum, buff) => sum + buff.value, 0);
      if (engine.random() < Math.max(0, Math.min(1, criticalRate))) gain(actor);
    }
    if (skill.characterAction === 'mona:S2') {
      let healed = 0, cleansed = false;
      for (const ally of engine.state.party.filter(unit => unit.hp > 0)) {
        healed += engine.healUnit(actor, ally, skill.monaHealing);
        const index = ally.debuffs.findIndex(status => status.elementalAilment === true
          || ['burn', 'freeze', 'shock', 'windswept'].includes(status.id));
        if (index >= 0) { ally.debuffs.splice(index, 1); cleansed = true; }
      }
      if (cleansed) gain(actor);
      engine.emit('heal', 'Healing Breeze restored party HP.', { actorId: actor.id, amount: healed, targetId: 'party', sourceType, tone: 'heal' });
    }
    if (skill.characterAction === 'mona:S3') {
      if (result.critical === true) gain(actor);
      if (actor.awareness >= 6 && foe?.hp > 0 && foe.alive !== false) engine.applyEnemyStatus(foe, 'debuffs', {
        id: 'mona_gentle_fist_exposure', name: 'Look, Treasure!', damageTaken: true, value: .15, duration: 2
      }, sourceType, actor.id);
    }
  }
};
