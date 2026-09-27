const clone = value => structuredClone(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const legacyMethods = {
  isMatoi(unit) { return this.usesLiveMechanics() && unit?.slug === 'matoi'; },

  matoiSkill(actor, skill) {
    if (skill.name !== 'Extinguishing Guidance') return skill;
    const extinguishCost = actor.extinguishStacks >= 4 ? 4 : 2;
    return {
      ...clone(skill),
      name: extinguishCost === 4 ? 'Requiem Guidance' : skill.name,
      power: extinguishCost === 4 ? 1.534 : skill.power,
      matoiExtinguishCost: extinguishCost,
      matoiDefenseReduction: extinguishCost === 4 ? 0.102 : 0.085
    };
  },

  applyMatoiTorrentEffects(actor, targets) {
    actor.extinguishStacks = clamp((actor.extinguishStacks || 0) + 1, 0, 4);
    this.emit('resource', `${actor.codename} gained Extinguish ${actor.extinguishStacks}.`, { actorId: actor.id, resource: 'extinguishStacks', amount: actor.extinguishStacks, sourceType: 'character_skill', tone: 'buff' });
    for (const target of targets) {
      if (target.alive === false) continue;
      const defenseDown = this.applyEnemyStatus(target, 'debuffs', { id: 'matoi_torrent_def', name: 'SUB-ZERO DEF ↓', stat: 'defenseDown', value: 0.091, duration: 3, technicalPrecision: 207 }, 'character_skill', actor.id);
      if (defenseDown) this.emit('debuff', `${target.name}'s Defense fell by 9.1%.`, { actorId: actor.id, targetId: target.id, status: clone(defenseDown), sourceType: 'character_skill', tone: 'debuff' });
      if (this.random() < 0.5) {
        const freeze = this.applyEnemyStatus(target, 'debuffs', { id: 'matoi_freeze', name: 'FREEZE', duration: null, durationKnown: false, sourceUrl: actor.sourceUrl || null }, 'character_skill', actor.id);
        if (freeze) this.emit('debuff', `${target.name} was inflicted with Freeze.`, { actorId: actor.id, targetId: target.id, status: clone(freeze), sourceType: 'character_skill', tone: 'debuff' });
      }
    }
    this.convertBurnToScald(actor);
  }
};
