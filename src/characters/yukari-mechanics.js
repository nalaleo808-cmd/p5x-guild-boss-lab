const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const legacyMethods = {
  isYukari(unit) { return this.usesLiveMechanics() && unit?.slug === 'yukari'; },

  applyYukariErosion(target, sourceType = 'character_skill') {
    const yukari = this.state.party.find(unit => this.isYukari(unit) && unit.hp > 0);
    if (!yukari || !target) return;
    for (const enemy of [this.state.boss, ...this.state.boss.summons]) enemy.debuffs = enemy.debuffs.filter(effect => effect.id !== 'yukari_erosion');
    this.applyEnemyStatus(target, 'debuffs', { id: 'windswept', name: 'WINDSWEPT', duration: 2 }, sourceType, yukari.id);
    this.applyEnemyStatus(target, 'debuffs', { id: 'yukari_erosion', name: 'EROSION', duration: 2 }, sourceType, yukari.id);
    this.emit('debuff', `${target.name} is marked by Windswept and Erosion.`, {
      actorId: yukari.id, targetId: target.id, status: { id: 'yukari_erosion', duration: 2 }, sourceType, tone: 'debuff'
    });
  },

  triggerYukariErosionSupport(actor, enemyTargets, sourceType) {
    if (!['character_skill', 'persona_skill'].includes(sourceType)) return;
    const yukari = this.state.party.find(unit => this.isYukari(unit) && unit.hp > 0);
    if (!yukari || actor.id === yukari.id || yukari.erosionTriggeredSinceTurn) return;
    if (!enemyTargets.some(enemy => enemy.debuffs.some(effect => effect.id === 'yukari_erosion'))) return;
    yukari.erosionTriggeredSinceTurn = true;
    let healed = 0;
    for (const unit of this.state.party.filter(unit => unit.hp > 0)) {
      healed += this.healUnit(yukari, unit, yukari.mechanicAttack * 0.245 + 2400);
    }
    yukari.whisperwindStacks = clamp(yukari.whisperwindStacks + 1, 0, yukari.whisperwindMax);
    this.emit('heal', `Erosion restored ${healed.toLocaleString()} party HP and granted Whisperwind ${yukari.whisperwindStacks}.`, {
      actorId: yukari.id, targetId: 'party', amount: healed, resource: 'whisperwindStacks',
      sourceType: 'awareness', tone: 'heal'
    });
  }
};
