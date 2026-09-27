const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const legacyMethods = {
  isMakoto(unit) { return this.usesLiveMechanics() && unit?.slug === 'makoto'; },

  gainMakotoMoonPhase(actor, amount = 1, sourceType = 'character_skill') {
    if (!this.isMakoto(actor) || amount <= 0) return 0;
    const before = actor.moonPhaseStacks;
    actor.moonPhaseStacks = clamp(before + amount, 0, 4);
    actor.moonPhaseDuration = 2;
    actor.moonPhaseGrace = true;
    const gained = actor.moonPhaseStacks - before;
    this.emit('resource', `${actor.codename} has ${actor.moonPhaseStacks} Moon Phase stacks.`, {
      actorId: actor.id, resource: 'moonPhaseStacks', amount: actor.moonPhaseStacks, gained, sourceType, tone: 'buff'
    });
    return gained;
  },

  triggerMakotoEntrustedHope(sourceActor, skill, targetId, sourceType) {
    if (!['character_skill', 'highlight', 'awareness_follow_up'].includes(sourceType)) return;
    const makoto = this.state.party.find(unit => this.isMakoto(unit) && unit.hp > 0);
    if (!makoto || sourceActor.id === makoto.id || Number(skill.power || 0) > 0 || skill.debuff) return;
    const hasAllyEffect = Boolean(skill.allyEffect || skill.buff || skill.heal || skill.healAttack || skill.healFlat || skill.shield);
    if (!hasAllyEffect) return;
    const receives = ['party', 'all_allies'].includes(skill.buffTarget || skill.healTarget || skill.target)
      || ((skill.buffTarget || skill.healTarget || skill.target) === 'ally' && targetId === makoto.id);
    if (!receives) return;
    makoto.entrustedHopeStacks = clamp(makoto.entrustedHopeStacks + 1, 0, 3);
    this.applyUnitBuff(makoto, {
      id: 'makoto_entrusted_hope', name: `ENTRUSTED HOPE x${makoto.entrustedHopeStacks}`,
      stat: 'critDamage', value: makoto.entrustedHopeStacks * 0.072, duration: 2,
      stacks: makoto.entrustedHopeStacks
    }, 'passive');
    if (makoto.entrustedHopeTriggerTurn !== this.state.attackTurn) {
      makoto.entrustedHopeTriggerTurn = this.state.attackTurn;
      this.gainMakotoMoonPhase(makoto, 1, 'awareness');
    }
  }
};
