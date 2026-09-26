/** Gauge-free automatic S.E.E.S. ultimates used by Kotone's Go for Broke.
 * This adapts the existing UPLOADED beta catalog's structured A6/Lv13 tooltip
 * snapshot. It does not claim to add or verify natural Theurgy gauge charging.
 * References: sourceUrl and highlightSkill.description on the supplied actor.
 */
const clone = value => structuredClone(value);
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
export function forcedTheurgySkill(actor) {
  const source = actor?.highlightSkill;
  const expected = { makoto: 'Ardhanari', yukari: 'Cyclone Arrow', akihiko: 'Lightning Spike' }[actor?.slug];
  if (!expected || source?.name !== expected || !(source.power > 0)) return null;
  return { ...clone(source), id: `forced-theurgy:${actor.id}`, sourceSkillId: source.id,
    supportExecutable: true, supportActionKind: 'theurgy', forcedTheurgy: actor.slug,
    guaranteedCritical: actor.slug === 'akihiko',
    ...(actor.slug === 'akihiko' ? { criticalMultiplierMin: 2.5, criticalMultiplierMax: 3.5 } : {}),
    hitCount: actor.slug === 'makoto' ? 4 : 1, cost: 0 };
}
export function resolveForcedTheurgy(engine, actor, skill, targetId, options) {
  if (!options?.automatic || !skill.forcedTheurgy || skill.forcedTheurgy !== actor.slug) throw new Error('This adapter is only for an explicitly forced, matching Theurgy');
  const targets = skill.target === 'all_enemies' ? engine.enemies : [engine.findEnemy(targetId) || engine.state.boss];
  const origin = engine.supportCastContext;
  const buff = (recipient, id, name, stat, value, caster = actor, skillId = origin.skillId) => engine.applyUnitBuff(recipient,
    { id, name, stat, value, duration: 2, supportClock: { clock: 'recipient_normal_turn_end', ownerId: recipient.id,
      skipOwnerEnd: engine.actor?.id === recipient.id ? recipient.characterTurnsStarted : null } },
    'passive', { ...origin, casterId: caster.id, skillId });
  const currentAttack = unit => unit.attack * (1 + unit.buffs.filter(effect => effect.stat === 'attack').reduce((sum, effect) => sum + effect.value, 0));
  let damage = 0;
  for (const target of targets) {
    let last = null;
    for (let hit = 0; hit < skill.hitCount && target.hp > 0 && target.alive !== false; hit++) {
      const result = engine.calculateDamage(actor, skill, target, 'highlight'); last = result;
      const before = target.hp, actual = engine.applyEnemyDamage(target, result.amount);
      actor.damageDone += actual; engine.state.totalDamage += actual; damage += actual;
      engine.addDamageScore(actual, actor, target); engine.recordVirtualConcertDamage(target.id, actual, 'highlight');
      engine.emit('damage', `${skill.name} ${hit + 1}/${skill.hitCount}: ${actual.toLocaleString()} damage.`, {
        actorId: actor.id, targetId: target.id, amount: actual, hit: hit + 1,
        critical: result.critical, weakness: result.weakness, calculation: result, sourceType: 'theurgy', tone: 'damage' });
      if (target.id !== engine.state.boss.id && !target.scoreAttack && target.hp <= 0) engine.defeatSummon(target);
      engine.processEncounterDamageTriggers(actor, target, before, target.hp);
    }
    if (last && target.alive !== false) engine.updateDownState(target, last, skill, actor, 'highlight');
  }
  if (actor.slug === 'makoto') {
    actor.fullMoonStacks = Math.min(4, actor.fullMoonStacks + 1);
    actor.fullMoonDuration = 2; actor.fullMoonGrace = true;
    for (const ally of engine.state.party.filter(unit => unit.hp > 0)) {
      const sees = ['makoto','yukari','akihiko','kotone-shiomi'].includes(ally.slug);
      buff(ally, 'makoto-onsite-leader', 'On-Site Leader', 'attack', .4 + (sees ? .3 : 0));
    }
    engine.emit('resource', `Ardhanari: Full Moon ${actor.fullMoonStacks}/4.`, { actorId: actor.id, resource: 'fullMoonStacks', amount: actor.fullMoonStacks, sourceType: 'theurgy', tone: 'buff' });
  } else if (actor.slug === 'yukari') {
    const target = targets[0];
    target.buffs.splice(0, 2);
    engine.applyYukariErosion(target, 'highlight');
    const amount = Math.min(.227, Math.floor(currentAttack(actor) / 100) * .0048);
    for (const ally of engine.state.party.filter(unit => unit.hp > 0)) buff(ally, 'yukari-cyclone-damage', 'Cyclone Arrow damage', 'damage', amount);
  } else if (actor.slug === 'akihiko') {
    engine.gainAkihikoMettle(actor, 1, 'highlight');
    const current = actor.buffs.find(effect => effect.id === 'akihiko_rough_combo');
    const stacks = clamp((current?.stacks || 0) + 1, 0, 3);
    engine.applyUnitBuff(actor, { id: 'akihiko_rough_combo', name: `ROUGH COMBO x${stacks}`, stat: 'attack', value: .135 * stacks, stacks, duration: 3 }, 'passive', origin);
  }
  const yukari = engine.state.party.find(unit => unit.slug === 'yukari' && unit.hp > 0);
  if (yukari && actor.yukariPendingTheurgyAttackStacks > 0) {
    for (let i = 0; i < Math.min(2, actor.yukariPendingTheurgyAttackStacks); i++) buff(actor, `yukari-arrow-after-theurgy-${i}`, 'Arrow of Life after Theurgy', 'attack', .341, yukari, 'yukari-arrow-of-life');
    actor.yukariPendingTheurgyAttackStacks = 0;
    // This is the Theurgy branch, not the alternative Highlight branch.
    actor.yukariPendingHighlightAmp = 0;
  }
  actor.forcedTheurgyUses = (actor.forcedTheurgyUses || 0) + 1;
  return damage;
}
