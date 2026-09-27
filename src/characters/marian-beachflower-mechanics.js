export const legacyMethods = {
  isMarian(unit) {
    return unit?.slug === 'marian-beachflower';
  },

  marian() {
    return this.state.party.find(unit => this.isMarian(unit) && unit.hp > 0) || null;
  },

  marianScalingCriticalMultiplier(actor) {
    const activeBonus = this.usesLiveMechanics()
      ? actor.buffs.filter(effect => effect.stat === 'critDamage').reduce((sum, effect) => sum + Number(effect.value || 0), 0)
      : 0;
    return Math.min((actor.critMult || 1.5) + activeBonus, 2.464);
  },

  applyMarianHighlightEffect(actor, targetId) {
    const skill = { target: 'ally', buffTarget: 'ally' };
    const recipients = this.allyTargetsForSkill(actor, skill, targetId);
    const critMult = this.marianScalingCriticalMultiplier(actor);
    const critDamage = Math.max(0, (critMult - 1) / 6);
    const duration = actor.awareness >= 4 ? 3 : 2;
    for (const unit of recipients) {
      this.applyUnitBuff(unit, { id: 'marian_highlight_damage', name: 'MARIAN HL DMG', stat: 'damage', value: 0.284, duration }, 'highlight');
      this.applyUnitBuff(unit, { id: 'marian_highlight_crit_damage', name: 'MARIAN HL CRIT DMG', stat: 'critDamage', value: critDamage, duration }, 'highlight');
    }
    actor.nextMedicineEffectBonus = 0.114 + (actor.awareness >= 4 ? 0.05 : 0);
  }
};
