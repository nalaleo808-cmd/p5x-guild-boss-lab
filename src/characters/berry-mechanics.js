const clone = value => structuredClone(value);

// Exact legacy bodies staged for the engine integration described in research.
export const legacyMethods = {
  berrySkill(skill) {
    // The generic importer misreads S1's conditional +200% as a persistent buff.
    return { ...clone(skill), buff: undefined, buffTarget: undefined };
  },

  berryTierValue(actor, skill, values) {
    const index = skill.powerTiers?.findIndex(value => Math.abs(value - skill.power) < 1e-8);
    return values[index >= 0 ? index : actor.awareness >= 3 ? 3 : 1];
  },

  refreshBerryPassives(actor) {
    const chain = actor.chainsOfLove;
    for (const [id, stat, value] of [
      ['berry_chains_attack', 'attack', chain * 0.15],
      ['berry_chains_crit', 'critRate', chain >= 2 ? 0.15 : 0],
      ['berry_chains_dot', 'dotDamage', chain >= 3 ? 0.25 : 0],
      ['berry_chains_crit_damage', 'critDamage', chain >= 4 ? 0.36 : 0],
      ['berry_highlight_attack', 'attack', actor.awareness >= 4 ? Math.min(actor.berryHighlightUses, 5) * 0.06 : 0]
    ]) this.applyUnitBuff(actor, { id, name: id.replaceAll('_', ' ').toUpperCase(), stat, value, duration: 999 }, 'passive');
    for (const target of this.enemies) this.refreshLovesickDebuffs(target, actor);
  },

  gainBerryChain(actor) {
    actor.chainsOfLove = Math.min(actor.awareness >= 2 ? 5 : 3, actor.chainsOfLove + 1);
    this.refreshBerryPassives(actor);
    this.emit('resource', `${actor.codename} has ${actor.chainsOfLove} Chains of Love.`, { actorId: actor.id, resource: 'chainsOfLove', amount: actor.chainsOfLove, sourceType: 'awareness', tone: 'buff' });
  }
};
