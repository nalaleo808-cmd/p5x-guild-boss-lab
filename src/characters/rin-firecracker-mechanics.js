const clone = value => structuredClone(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const legacyMethods = {
  isRin(unit) { return this.usesLiveMechanics() && unit?.slug === 'rin-firecracker'; },

  endRinFlamingSwordDance(actor, reason = 'turn end') {
    if (!this.isRin(actor) || !actor.rinFlamingSwordDance) return;
    actor.rinFlamingSwordDance = false;
    actor.rinYanhuaBonusPower = 0;
    actor.rinYanhuaFlamesChance = 0;
    actor.buffs = actor.buffs.filter(effect => effect.id !== 'rin_flaming_sword_dance');
    this.emit('status_expired', `${actor.codename}'s Flaming Sword Dance ended after ${reason}.`, { actorId: actor.id, sourceType: 'character_skill', tone: 'system' });
  },

  addRinYearEndFlames(actor, target, stacks = 1) {
    const existing = target.debuffs.find(effect => effect.id === 'rin_year_end_flames' && effect.sourceActorId === actor.id);
    if (existing) {
      existing.stacks = clamp((existing.stacks || 0) + stacks, 0, 4);
      existing.duration = 2;
      this.emit('debuff', `${target.name} now has ${existing.stacks} Year-End Flames stacks.`, { actorId: actor.id, targetId: target.id, status: clone(existing), sourceType: 'character_skill', tone: 'debuff' });
      return existing;
    }
    this.applyContinuousDamage(actor, target, {
      id: 'rin_year_end_flames', name: 'YEAR-END FLAMES', element: 'fire', powerPerStack: 0.738,
      stacks, duration: 2, maxStacks: 4, stacking: 'add', canCrit: false,
      timing: 'unverified', sourceUrl: actor.sourceUrl || null
    }, 'character_skill');
    const status = this.applyEnemyStatus(target, 'debuffs', {
      id: 'rin_year_end_flames', name: 'YEAR-END FLAMES', element: 'fire', continuousDamage: false, damageOmitted: true,
      powerPerStack: 0.738, stacks: clamp(stacks, 1, 4), duration: 2, durationKnown: true,
      stackCap: 4, sourceUrl: actor.sourceUrl || null
    }, 'character_skill', actor.id);
    if (status) this.emit('debuff', `${target.name} gained ${status.stacks} Year-End Flames stack.`, { actorId: actor.id, targetId: target.id, status: clone(status), sourceType: 'character_skill', tone: 'debuff' });
    return status;
  }
};
