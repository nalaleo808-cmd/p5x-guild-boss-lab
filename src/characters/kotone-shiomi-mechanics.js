import { KOTONE_SHIOMI_ID, KOTONE_PROFILE_ID, kotoneWeapons, kotoneWeaponProfile,
  kotoneCoefficientsFor, KOTONE_MINDSCAPE_LEVELS, KOTONE_DEFAULT_MINDSCAPE, requireKotoneCombatData } from './kotone-shiomi-data.js';
import { forcedTheurgySkill } from '../combat/forced-theurgy.js';
import { equippedAttack } from '../combat/weapon-stats.js';

export const KOTONE_DRAFT_STORAGE_KEY = 'p5x-kotone-shiomi-draft-v1';
const level = (value, fallback = 0) => Number.isInteger(value) && value >= 0 && value <= 6 ? value : fallback;
const clone = value => structuredClone(value);
const clamp = (value, lo, hi) => Math.max(lo, Math.min(hi, value));
const copyRatio = value => Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 2 ? Number(value) : .375;
export function normalizeKotoneDraft(value = {}) {
  if (!value || typeof value !== 'object') value = {};
  const weaponId = kotoneWeapons.some(weapon => weapon.id === value.weaponId) ? value.weaponId : 'none';
  return { schemaVersion: 2, characterId: KOTONE_SHIOMI_ID, ruleset: 'global-ordinary', mindscapeCore: false,
    profileId: KOTONE_PROFILE_ID, awareness: level(value.awareness), weaponId,
    enhancement: weaponId === 'none' ? 0 : level(value.enhancement),
    statsMode: value.statsMode === 'equipped' ? 'equipped' : 'base',
    mindscape: KOTONE_MINDSCAPE_LEVELS.includes(value.mindscape) ? value.mindscape : KOTONE_DEFAULT_MINDSCAPE,
    a2CopyRatio: copyRatio(value.a2CopyRatio),
    // Lufel v5.1.0: 30% base copy x 1.25 at A2. Kept editable for comparison.
    copyRatioPolicy: value.copyRatioPolicy || (value.a2CopyRatio == null ? 'lufel-5.1.0-30-percent-times-1.25' : 'explicit-build-input') };
}
export function normalizeKotoneLoadout(value = {}) {
  if (value.ruleset && value.ruleset !== 'global-ordinary' || value.mindscapeCore === true) {
    throw new Error('Only ordinary Global Kotone is supported; no Sync Mindscape or Mindscape Core');
  }
  for (const key of ['awareness', 'enhancement']) if (value[key] != null && (!Number.isInteger(value[key]) || value[key] < 0 || value[key] > 6)) throw new RangeError(`${key} must be an integer 0–6`);
  if (value.mindscape != null && !KOTONE_MINDSCAPE_LEVELS.includes(value.mindscape)) throw new RangeError('Skill Mindscape must be 0 or 5');
  if (value.weaponId != null && !kotoneWeapons.some(w => w.id === value.weaponId)) throw new Error('Unknown Kotone weapon');
  for (const key of ['attack','maxHp','maxSp','defense']) if (value.baseStats?.[key] != null && (!Number.isFinite(Number(value.baseStats[key])) || Number(value.baseStats[key]) < (key === 'maxHp' ? 1 : 0))) throw new RangeError(`Invalid ${key} input`);
  const normalized = { ...clone(value), ...normalizeKotoneDraft(value) };
  kotoneWeaponProfile(normalized.weaponId, normalized.enhancement); // no silent +0 downgrade
  const expected = `${normalized.weaponId}+${normalized.enhancement}`;
  if (normalized.statsMode === 'equipped' && value.equippedTotalsFor && value.equippedTotalsFor !== expected) {
    throw new Error('Weapon/enhancement changed: enter fresh equipped totals or use non-weapon base inputs');
  }
  if (normalized.statsMode === 'equipped') normalized.equippedTotalsFor = expected;
  return normalized;
}
export function loadKotoneDraft(storage) {
  try { return normalizeKotoneDraft(JSON.parse(storage.getItem(KOTONE_DRAFT_STORAGE_KEY) || '{}')); }
  catch { return normalizeKotoneDraft(); }
}
export function saveKotoneDraft(storage, value) {
  const draft = normalizeKotoneDraft(value);
  storage.setItem(KOTONE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  return draft;
}
export function createGoForBrokeBudget(awareness) {
  if (!Number.isInteger(awareness) || awareness < 0 || awareness > 6) throw new RangeError('Awareness must be A0–A6');
  return { awareness, limit: awareness === 6 ? 2 : 1, used: 0, activationIds: [] };
}
export function spendGoForBrokeUse(budget, activationId) {
  if (typeof activationId !== 'string' || !activationId) throw new TypeError('Activation id is required');
  if (budget.activationIds.includes(activationId)) return { ok: false, reason: 'duplicate activation' };
  if (budget.used >= budget.limit) return { ok: false, reason: 'battle use limit reached' };
  budget.used += 1; budget.activationIds.push(activationId);
  return { ok: true, remaining: budget.limit - budget.used };
}
export function eligibleKotoneCopySources({ selectedId, linkedId, awareness, kotoneId = KOTONE_SHIOMI_ID, wonderPresent }) {
  if (!linkedId) return [];
  const sources = [];
  if (selectedId && selectedId !== kotoneId && selectedId !== linkedId) sources.push(selectedId);
  // A6 adds a SOURCE. It never changes the recipient to Wonder.
  if (awareness >= 6 && wonderPresent && selectedId !== 'wonder' && linkedId !== 'wonder') sources.push('wonder');
  return [...new Set(sources)];
}

/** All mutable combat state is serializable on the combat unit (unit.kotone).
 * Explicit timing policy: personal NORMAL turns, never the two Fortune extras.
 * The module requires only the BattleEngine hooks documented in registry.js.
 */
export class KotoneShiomiMechanics {
  constructor(engine) { this.engine = engine; }
  get unit() { return this.engine.state.party.find(unit => unit.id === KOTONE_SHIOMI_ID); }
  get state() { return this.unit?.kotone; }
  get C() { return this.state?.coefficients || kotoneCoefficientsFor({ awareness: this.unit?.awareness || 0 }); }
  get linked() { return this.engine.state.party.find(unit => unit.id === this.state?.linkedId); }
  get active() { return Boolean(this.unit?.hp > 0 && this.state); }
  event(type, message, data = {}) {
    return this.engine.emit(type, message, { actorId: KOTONE_SHIOMI_ID, sourceType: 'kotone_mechanic', tone: 'buff', ...data });
  }
  initialize() {
    const actor = this.unit;
    if (!actor) return;
    requireKotoneCombatData();
    const loadout = normalizeKotoneLoadout(this.engine.config.loadouts[actor.id] || {});
    actor.awareness = loadout.awareness;
    actor.kotone = {
      profileId: KOTONE_PROFILE_ID, build: loadout, linkedId: null, lunarBond: 0, powerfulBonds: {},
      fortune: false, fortuneActionsLeft: 0, fortuneChained: false, cold: 0, linkWindow: false, actionWindow: false,
      goForBroke: createGoForBrokeBudget(actor.awareness), weaponStacks: [],
      grantCastIds: [], ultimateActivationIds: [], sequence: 0,
      normalTurnsCompleted: 0, normalActions: 0, extraActions: 0,
      coefficients: kotoneCoefficientsFor({ awareness: loadout.awareness, mindscape: loadout.mindscape }),
      unresolved: ['event-timing', 'copy-eligibility', 's2-fortune-damage-term', 'skill-amplification-formula']
    };
    this.configureEquipment(loadout, { initial: true });
    const eligible = this.engine.state.party.filter(unit => unit.id !== actor.id && unit.hp > 0 && ['Sweeper', 'Assassin'].includes(unit.role));
    eligible.sort((a, b) => this.currentAttack(b) - this.currentAttack(a));
    if (eligible[0]) this.selectLink(eligible[0].id, { initial: true });
    this.refreshAuras();
    this.engine.state.mechanicsLimitations = this.engine.state.mechanicsLimitations.filter(note => !note.startsWith('Kotone Shiomi:'));
    this.engine.state.mechanicsLimitations.push('With Kotone, forced Ardhanari/Cyclone Arrow/Lightning Spike are executable using the uploaded beta tooltip. Natural Theurgy gauges and manual Theurgy remain outside this adapter.');
    this.engine.state.mechanicsLimitations.push('Kotone: Lufel v5.1.0 ordinary Global values. Fortune, copy and Cold timing are engine policies because the source is tooltip data, not combat scripts.');
    const levels = this.C.skillLevels;
    this.event('kotone_profile', `Kotone: ordinary Global, skill Mindscape ${loadout.mindscape}, S1 LV${levels.S1}, S2/S3 LV${levels.S2}, Highlight LV${levels.HL}.`, {
      profileId: KOTONE_PROFILE_ID, copyRatio: this.copyMultiplier(), mindscape: loadout.mindscape, skillLevels: levels, tone: 'system'
    });
  }
  configureEquipment(value, { initial = false } = {}) {
    const actor = this.unit;
    if (!actor?.kotone) throw new Error('Kotone is not initialized');
    if (!initial && (this.engine.state.actionNumber > 1 || actor.characterTurnsStarted > 1 || this.state.normalActions || this.state.extraActions || this.state.goForBroke.used)) {
      throw new Error('Equipment is locked after combat actions; edit the build and reset the battle');
    }
    const build = normalizeKotoneLoadout(initial ? value : { ...this.state.build, ...value });
    if (!initial && build.awareness !== actor.awareness) throw new Error('Reset the battle to change awareness');
    if (!initial && build.mindscape !== this.state.build.mindscape) throw new Error('Reset the battle to change skill Mindscape');
    const weapon = kotoneWeaponProfile(build.weaponId, build.enhancement);
    const base = this.state.baseInputs || clone(actor.kotoneInputStats || { attack: actor.attack, maxHp: actor.maxHp, defense: actor.defense || 0 });
    if (!initial && build.baseStats) {
      for (const key of Object.keys(base)) if (Number.isFinite(Number(build.baseStats[key]))) base[key] = Number(build.baseStats[key]);
    }
    this.state.baseInputs = clone(base);
    const stats = equippedAttack({ mode: build.statsMode,
      baseAttack: base.attack, totalAttack: base.attack, componentAttack: weapon.component.attack,
      staticAttackRatio: weapon.staticAttack, selectedWeaponId: `${weapon.id}+${weapon.enhancement}`,
      totalIncludesWeaponId: build.equippedTotalsFor || `${weapon.id}+${weapon.enhancement}` });
    const revAttack = build.statsMode === 'base' ? Number(build.revelationCombat?.attackPercent || 0) : 0;
    const revHp = build.statsMode === 'base' ? Number(build.revelationCombat?.hpPercent || 0) : 0;
    const weaponAttack = stats.permanentAttack;
    stats.revelationAttackAdded = weaponAttack * revAttack;
    stats.weaponEquippedAttack = weaponAttack;
    stats.permanentAttack = stats.attack = weaponAttack * (1 + revAttack);
    actor.attack = actor.mechanicAttack = stats.permanentAttack;
    actor.statsMode = build.statsMode;
    actor.maxHp = Math.round((base.maxHp + (build.statsMode === 'base' ? weapon.component.maxHp : 0)) * (1 + revHp));
    actor.mechanicMaxHp = actor.maxHp;
    actor.hp = initial ? actor.maxHp : Math.min(actor.hp, actor.maxHp);
    actor.defense = base.defense + (build.statsMode === 'base' ? weapon.component.defense : 0);
    actor.supportEquipmentAccounting = { ...stats, weaponId: weapon.id, enhancement: weapon.enhancement,
      component: clone(weapon.component), input: clone(base), statsMode: build.statsMode,
      formula: build.statsMode === 'base' ? '(non-weapon Attack + weapon component) × (1 + weapon static Attack) × (1 + Revelation Attack)' : 'entered equipped totals; add no component/static bonus' };
    this.state.build = build; this.state.weapon = weapon; this.state.weaponStacks = [];
    this.refreshAuras();
    this.event('equipment_stats', `${kotoneWeapons.find(item => item.id === weapon.id).name} +${weapon.enhancement}: permanent Attack ${actor.attack.toFixed(2)}.`, { attack: actor.attack, accounting: clone(actor.supportEquipmentAccounting), tone: 'system' });
    return actor.supportEquipmentAccounting;
  }
  currentAttack(unit = this.unit) {
    if (!unit) return 0;
    const attackBuff = (unit.buffs || []).filter(b => b.stat === 'attack').reduce((n, b) => n + b.value, 0);
    const flatAttack = (unit.buffs || []).filter(b => b.stat === 'flatAttack').reduce((n, b) => n + b.value, 0);
    return this.engine?.buffedAttack ? this.engine.buffedAttack(unit, attackBuff, flatAttack) : unit.attack * (1 + attackBuff) + flatAttack;
  }
  // Each skill scales to the Attack cap published for its own skill level.
  scale(slot = 'S1') { return clamp(this.currentAttack() / this.C.attackCaps[slot], 0, 1); }
  duration(base, fortuneBonus = 0) { return base + (this.state.fortune ? fortuneBonus + (this.unit.awareness >= 2 ? 1 : 0) : 0); }
  copyMultiplier() { return this.unit.awareness >= 2 ? this.state.build.a2CopyRatio : this.C.s3Copy; }
  countPowerful(unitId = this.state.linkedId) { return (this.state.powerfulBonds[unitId] || []).length; }
  nextId(label) { return `${label}-${++this.state.sequence}`; }
  selectLink(targetId, { initial = false } = {}) {
    const target = this.engine.state.party.find(unit => unit.id === targetId && unit.hp > 0 && unit.id !== KOTONE_SHIOMI_ID);
    if (!target) throw new Error('Arcana Link must target a living ally other than Kotone');
    if (!initial && (!this.state.linkWindow || this.engine.actor?.id !== KOTONE_SHIOMI_ID || this.state.fortune || this.state.cold)) throw new Error('Arcana Link can only be reselected at the start of Kotone’s normal turn');
    if (targetId === this.state.linkedId) throw new Error('That ally is already linked; no reset or free Bond refresh');
    for (const id of Object.keys(this.state.powerfulBonds)) this.state.powerfulBonds[id] = this.state.powerfulBonds[id].filter(stack => !stack.permanent);
    this.state.linkedId = targetId; this.state.lunarBond = this.unit.awareness >= 1 ? 5 : 0;
    this.state.linkWindow = false;
    if (this.unit.awareness >= 1) this.addPowerful(target, { permanent: true, amplification: 0 });
    this.refreshAuras();
    this.event('arcana_link', `Arcana Link → ${target.codename}; Lunar Bond ${this.state.lunarBond}/10.`, { targetId, lunarBond: this.state.lunarBond });
  }
  clock(recipient, duration) {
    return { duration, supportClock: { clock: 'recipient_normal_turn_end', ownerId: recipient.id,
      // A self-granted three-turn effect survives this casting turn plus three
      // subsequent normal ends. Copies onto another ally have no such grace.
      skipOwnerEnd: this.engine.actor?.id === recipient.id ? recipient.characterTurnsStarted : null } };
  }
  grant(target, id, name, stat, value, duration, { sourceType = 'character_skill', amplification = true, copyEligible = true } = {}) {
    const origin = this.engine.supportCastContext || { casterId: KOTONE_SHIOMI_ID, skillId: 'kotone-passive', castId: this.nextId('passive') };
    const status = { id, name, stat, value, ...this.clock(target, duration), copyEligible,
      ...(amplification ? {} : { amplifiedBySkillAmplification: true }) };
    const applied = this.engine.applyUnitBuff(target, status, sourceType, origin);
    this.event('buff', `${name} → ${target.codename}: ${(applied.value * 100).toFixed(2)}% (${duration} normal turns).`, { targetId: target.id, status: clone(applied) });
    return applied;
  }
  addPowerful(target, { permanent = false, amplification = this.engine.skillAmplificationFor(this.unit) } = {}) {
    const stacks = this.state.powerfulBonds[target.id] ||= [];
    if (permanent && stacks.some(stack => stack.permanent)) return;
    if (stacks.length >= 3) {
      const candidates = stacks.map((stack, index) => ({ stack, index })).filter(item => !item.stack.permanent).sort((a, b) => a.stack.remaining - b.stack.remaining);
      if (!candidates.length) return;
      stacks.splice(candidates[0].index, 1); // explicit per-stack oldest refresh policy
    }
    stacks.push({ id: this.nextId('powerful'), permanent, remaining: permanent ? null : this.duration(3, 2),
      amplification, skipOwnerEnd: this.engine.actor?.id === target.id ? target.characterTurnsStarted : null });
    this.grant(target, 'kotone-passive-pierce', 'Powerful Bond passive pierce', 'pierce', this.C.passivePierce, 2,
      { sourceType: 'passive', amplification: false, copyEligible: false });
    this.refreshAuras();
    this.event('powerful_bond', `${target.codename}: Powerful Bond ${stacks.length}/3${permanent ? ' (one permanent while linked)' : ''}.`, { targetId: target.id, stacks: stacks.length, permanent });
  }
  aura(target, id, name, stat, value) {
    if (!(value > 0)) return;
    target.buffs.push({ id, name, stat, value, duration: 999, sourceType: 'kotone_aura', sourceActorId: KOTONE_SHIOMI_ID,
      kotoneAura: true, copyEligible: false });
  }
  refreshAuras() {
    const e = this.engine;
    if (!e.state) return;
    for (const unit of e.state.party) unit.buffs = unit.buffs.filter(buff => !buff.kotoneAura);
    const owned = Boolean(this.state) || e.config.kotoneOwned === true;
    if (owned) {
      const wonderMain = e.personaDefinitions.find(persona => persona.id === e.config.personaIds[0]);
      const strategists = e.state.party.filter(unit => unit.hp > 0 && (unit.id === 'wonder' ? (wonderMain?.role === 'Strategist' || wonderMain?.position === '우월') : unit.role === 'Strategist')).length;
      for (const unit of e.state.party) this.aura(unit, 'kotone-account-final', 'Kotone owned: Strategist final damage', 'finalDamage', strategists * this.C.strategistFinal);
    }
    if (!this.active) return;
    const linked = this.linked;
    if (linked?.hp > 0) {
      if (this.state.lunarBond >= 1) this.aura(linked, 'kotone-lunar-atk', 'Lunar Bond Attack', 'attack', this.C.lunarAttack);
      if (this.state.lunarBond >= 5) this.aura(linked, 'kotone-lunar-pierce', 'Lunar Bond pierce', 'pierce', this.C.lunarPierce);
      if (this.state.lunarBond >= 10) this.aura(linked, 'kotone-lunar-crit', 'Lunar Bond critical damage', 'critDamage', this.C.lunarCrit);
    }
    for (const target of e.state.party) {
      const stacks = this.state.powerfulBonds[target.id] || [];
      if (stacks.length >= 1) this.aura(target, 'kotone-pb-atk', 'Powerful Bond Attack', 'attack', this.C.powerfulAttack * (1 + stacks[0].amplification));
      if (stacks.length >= 2) this.aura(target, 'kotone-pb-pierce', 'Powerful Bond pierce', 'pierce', this.C.powerfulPierce * (1 + stacks[1].amplification));
      if (stacks.length >= 3) this.aura(target, 'kotone-pb-final', 'Powerful Bond final damage', 'finalDamage', this.C.powerfulFinal * (1 + stacks[2].amplification));
      this.aura(target, 'kotone-weapon-pb-crit', 'Vetri Vel Muruga: Powerful Bond critical damage', 'critDamage', stacks.length * this.state.weapon.powerfulCrit);
    }
    if (linked?.hp > 0 && this.state.lunarBond >= 5) this.aura(this.unit, 'kotone-weapon-amp', 'Vetri Vel Muruga: Kotone Skill Amplification', 'skillAmplification', this.state.weapon.skillAmplification);
    this.aura(this.unit, 'kotone-weapon-grant-atk', 'Ame-no-Nuboko: buff-grant Attack', 'attack', this.state.weaponStacks.length * this.state.weapon.grantAttack);
  }
  afterSkill(actor, skill, targetId, sourceType) {
    if (!this.active || !['character_skill', 'persona_skill', 'highlight'].includes(sourceType)) return;
    const hitsLinked = targetId === this.state.linkedId || ['all_allies', 'party'].includes(skill.target) || skill.kotoneSkill === 'S3';
    if (actor.id === this.state.linkedId || actor.id === KOTONE_SHIOMI_ID && hitsLinked) {
      const old = this.state.lunarBond;
      this.state.lunarBond = Math.min(10, old + 1);
      if (old !== this.state.lunarBond) this.event('lunar_bond', `Lunar Bond ${this.state.lunarBond}/10.`, { targetId: this.state.linkedId, amount: this.state.lunarBond, triggerActorId: actor.id });
    }
    this.refreshAuras();
  }
  onBuffGrant(selectedTarget, castId) {
    if (this.state.grantCastIds.includes(castId)) return;
    this.state.grantCastIds.push(castId);
    if (selectedTarget?.hp > 0) this.grant(selectedTarget, 'kotone-passive-atk', 'Leading the team', 'attack', this.C.passiveAttack, 3, { sourceType: 'passive', amplification: false, copyEligible: false });
    if (this.state.weapon.grantAttack) {
      if (this.state.weaponStacks.length >= 3) this.state.weaponStacks.shift();
      this.state.weaponStacks.push({ castId, remaining: 3, skipOwnerEnd: this.unit.characterTurnsStarted });
      this.refreshAuras();
      this.event('weapon_trigger', `Ame-no-Nuboko ${this.state.weaponStacks.length}/3 stacks; one trigger for this Kotone buff-grant cast.`, { castId, stacks: this.state.weaponStacks.length });
    }
  }
  copyBuffs(selectedId, castId) {
    if (!this.linked || this.linked.hp <= 0) return [];
    const sourceCasterIds = eligibleKotoneCopySources({ selectedId, linkedId: this.linked.id, awareness: this.unit.awareness,
      wonderPresent: this.engine.state.party.some(unit => unit.id === 'wonder' && unit.hp > 0) });
    if (!sourceCasterIds.length) return [];
    const originals = this.linked.buffs.filter(buff => buff.provenance?.originalCasterId && sourceCasterIds.includes(buff.provenance.originalCasterId));
    const results = this.engine.copySupportEffects(originals, {
      sourceCasterIds, recipientId: this.linked.id, copyingActorId: KOTONE_SHIOMI_ID,
      copySkillId: `${KOTONE_SHIOMI_ID}-s3`, batchId: castId, multiplier: this.copyMultiplier(),
      amplification: this.engine.skillAmplificationFor(this.unit), duration: this.duration(1, 1),
      clock: 'recipient_normal_turn_end', countsAsGrant: true, allowOriginalOnRecipient: true
    });
    this.event('kotone_copy_selection', `Lunar Phaseshift sources: ${sourceCasterIds.join(', ')} → ${this.linked.codename}; ${results.filter(item => item.applied).length} eligible copies.`, {
      selectedId, targetId: this.linked.id, sourceCasterIds, copyMultiplier: this.copyMultiplier(),
      rejected: results.filter(item => !item.applied).map(item => item.reason)
    });
    return results;
  }
  resolve(actor, skill, targetId, sourceType, options = {}) {
    if (!this.active || actor.id !== KOTONE_SHIOMI_ID || !skill.kotoneSkill) throw new Error('Invalid Kotone skill dispatch');
    if (this.state.cold && !options.automatic) throw new Error('Kotone cannot act during Cold');
    const e = this.engine;
    const target = e.state.party.find(unit => unit.id === targetId && unit.hp > 0);
    if (['S1', 'S3'].includes(skill.kotoneSkill) && !target) throw new Error('Select a living ally');
    if (!options.ignoreCost && actor.sp < skill.cost) throw new Error('Not enough SP');
    if (!options.ignoreCost) actor.sp -= skill.cost;
    if (sourceType !== 'highlight') { this.state.linkWindow = false; this.state.actionWindow = false; }
    const castId = e.supportCastContext.castId;
    const scale = this.scale(skill.kotoneSkill);
    let damage = 0;
    this.event('move', `${actor.codename} used ${skill.name}.`, { skillId: skill.id, sourceType, targetId, fortune: this.state.fortune });
    if (skill.kotoneSkill === 'S1') {
      const existing = target.buffs.filter(buff => /^kotone-s1-crit-\d$/.test(buff.id));
      const available = [0,1,2].find(index => !existing.some(buff => buff.id === `kotone-s1-crit-${index}`));
      const id = available == null ? [...existing].sort((a,b) => a.duration - b.duration)[0].id : `kotone-s1-crit-${available}`;
      this.grant(target, id, "Lyre's Melody", 'critDamage', this.C.s1Crit * scale, this.duration(3, 2));
      if (target.id === this.state.linkedId) this.addPowerful(target);
      if (actor.awareness >= 1 && this.countPowerful(target.id) >= 3) this.grant(target, 'kotone-a1-crit', 'A1: three Powerful Bonds', 'critDamage', this.C.a1Crit, this.duration(5), { sourceType: 'awareness', amplification: false, copyEligible: false });
      this.onBuffGrant(target, castId);
    } else if (skill.kotoneSkill === 'S2') {
      damage = this.resolveFire(skill, options);
      if (this.countPowerful() >= 3) {
        for (const enemy of e.enemies.filter(enemy => this.canHit(enemy))) {
          const status = { id: 'kotone-s2-damage-taken', name: "Burning Moon's Cry: damage taken", damageTaken: true,
            value: this.C.s2DamageTaken * scale * (1 + e.skillAmplificationFor(actor)), duration: this.duration(1, 2) };
          e.applyEnemyStatus(enemy, 'debuffs', status, 'character_skill', actor.id);
          this.event('debuff', `${enemy.name}: damage taken +${(status.value * 100).toFixed(2)}%.`, { targetId: enemy.id, status });
        }
      }
    } else if (skill.kotoneSkill === 'S3') {
      for (const ally of e.state.party.filter(unit => unit.hp > 0)) this.grant(ally, 'kotone-s3-atk', 'Lunar Phaseshift Attack', 'attack', this.C.s3Attack * scale, this.duration(1, 1));
      this.copyBuffs(target.id, castId);
      this.onBuffGrant(target, castId);
      actor.skillCooldowns[skill.id] = 2;
    } else if (skill.kotoneSkill === 'HL') {
      for (const ally of e.state.party.filter(unit => unit.hp > 0)) {
        this.grant(ally, 'kotone-hl-crit', 'Kotone Highlight critical damage', 'critDamage', this.C.highlightCrit, this.duration(2, 2), { sourceType: 'highlight' });
        if (actor.awareness >= 4) this.grant(ally, 'kotone-a4-damage', 'A4 Highlight damage', 'damage', this.C.a4Damage, this.duration(2, 2), { sourceType: 'highlight' });
      }
      if (this.linked?.hp > 0) this.grant(this.linked, 'kotone-hl-atk', 'Kotone Highlight linked Attack', 'attack', this.C.highlightAttack, this.duration(2, 2), { sourceType: 'highlight' });
      this.onBuffGrant(this.linked || actor, castId);
    } else throw new Error(`Unknown Kotone skill ${skill.kotoneSkill}`);
    // Record non-damaging casts once, not once per buff or copied effect.
    if (skill.kotoneSkill !== 'S2') e.recordSharedHighlightCast(options.highlightActionContext || null, { actor, skill, sourceType });
    if (skill.kotoneSkill !== 'S2') e.triggerMakotoEntrustedHope(actor, { ...skill, power: 0, allyEffect: true, target: ['S3', 'HL'].includes(skill.kotoneSkill) ? 'party' : skill.target }, targetId, sourceType);
    e.triggerSoothingSunlight(actor, skill, targetId);
    e.triggerTrustProsperity(actor, skill, sourceType);
    return damage;
  }
  // Like the engine's own attacks, the boss stays targetable at 0 HP: during a
  // weakened window its HP is spent but damage still scores.
  canHit(enemy) { return enemy.alive !== false && (enemy.hp > 0 || enemy.id === this.engine.state.boss.id); }
  resolveFire(skill, options) {
    const e = this.engine, actor = this.unit;
    const enemies = e.enemies.filter(enemy => this.canHit(enemy));
    const perHit = (this.C.s2Hit + (this.state.fortune ? this.C.s2FortuneAddedPower : 0)) * (1 + Math.max(0, 5 - enemies.length) * this.C.s2MissingEnemyBonus);
    const hitSkill = { ...skill, power: perHit };
    const context = options.highlightActionContext || null;
    const cast = e.recordSharedHighlightCast(context, { actor, skill, sourceType: 'character_skill' });
    let damage = 0;
    for (const enemy of enemies) {
      let last = null;
      for (let hit = 0; hit < this.C.s2Hits && this.canHit(enemy); hit++) {
        const result = e.calculateDamage(actor, hitSkill, enemy, 'character_skill'); last = result;
        const before = enemy.hp, actual = e.applyEnemyDamage(enemy, result.amount);
        actor.damageDone += actual; e.state.totalDamage += actual; damage += actual;
        e.addDamageScore(actual, actor, enemy); e.recordVirtualConcertDamage(enemy.id, actual, 'character_skill');
        e.recordSharedHighlightPacket(context, cast, { target: enemy, result, actualDamage: actual, element: 'fire', packetKind: 'primary', sourceType: 'character_skill' });
        this.event('damage', `${enemy.name}: Fire hit ${hit + 1}/3 — ${actual.toLocaleString()} damage.`, { targetId: enemy.id, amount: actual, hit: hit + 1, critical: result.critical, weakness: result.weakness, calculation: result, tone: result.critical ? 'critical' : 'damage' });
        if (enemy.id !== e.state.boss.id && !enemy.scoreAttack && enemy.hp <= 0) e.defeatSummon(enemy);
        e.processEncounterDamageTriggers(actor, enemy, before, enemy.hp);
      }
      if (last && !enemy.downed && enemy.alive !== false) {
        if (this.state.fortune) {
          const before = enemy.downPoints;
          enemy.downPoints = Math.max(0, before - this.C.s2FortuneDown);
          this.event('down_damage', `${enemy.name}: Fortune removes ${Math.min(before, 2)} Down points, ignoring affinity.`, { targetId: enemy.id, downPoints: enemy.downPoints });
          if (enemy.downPoints === 0) {
            enemy.downed = true; e.queueDownActions(actor, enemy, 'character_skill');
            this.event('down', `${enemy.name} was knocked Down by Fortune.`, { targetId: enemy.id, tone: 'phase' });
          }
        } else e.updateDownState(enemy, last, hitSkill, actor, 'character_skill');
      }
    }
    return damage;
  }
  turnStart(actor) {
    if (!this.state) { this.refreshAuras(); return; }
    if (actor.id === KOTONE_SHIOMI_ID) {
      // Go for Broke can open a normal or a Concert turn. Cold blocks both and
      // each Cold turn, Concert or normal, counts toward its two (user,
      // 2026-09-28; 2026-09-26 DOD rotation, A6: Go for Broke in Concert round 1,
      // Cold in round 2 and B3, acts again in B4). Arcana Link stays normal-turn only.
      const opening = !this.state.cold && !this.state.fortune;
      this.state.linkWindow = opening && !this.engine.isVirtualConcertActive();
      this.state.actionWindow = opening;
    }
    this.refreshAuras();
  }
  normalTurnEnd(actorId) {
    if (!this.state) return;
    const actor = this.engine.state.party.find(unit => unit.id === actorId);
    const stacks = this.state.powerfulBonds[actorId] || [];
    this.state.powerfulBonds[actorId] = stacks.filter(stack => {
      if (stack.permanent || stack.skipOwnerEnd === actor.characterTurnsStarted) return true;
      return --stack.remaining > 0;
    });
    if (stacks.length !== this.countPowerful(actorId)) this.event('powerful_expired', `${actor.codename}: Powerful Bond ${this.countPowerful(actorId)}/3 after normal turn end.`, { targetId: actorId, stacks: this.countPowerful(actorId) });
    if (actorId === KOTONE_SHIOMI_ID) {
      this.state.normalTurnsCompleted++;
      this.state.linkWindow = false; this.state.actionWindow = false;
      this.state.weaponStacks = this.state.weaponStacks.filter(stack => stack.skipOwnerEnd === actor.characterTurnsStarted || --stack.remaining > 0);
    }
    this.refreshAuras();
  }
  decorateActions(actions) {
    if (!this.active || this.engine.actor?.id !== KOTONE_SHIOMI_ID) return actions;
    if (this.state.cold > 0) return [{ type: 'kotone_cold', actorId: KOTONE_SHIOMI_ID, skillId: 'kotone-cold', name: `Cold — wait (${this.state.cold} turns)`, target: 'self', enabled: true, cost: 0 }];
    const controls = [];
    if (this.state.linkWindow) controls.push({ type: 'kotone_link', actorId: KOTONE_SHIOMI_ID, skillId: 'kotone-link', name: 'Select / reselect Arcana Link', target: 'ally', enabled: true, cost: 0, statusLabel: 'FREE' });
    const remaining = this.state.goForBroke.limit - this.state.goForBroke.used;
    controls.push({ type: 'kotone_assist', actorId: KOTONE_SHIOMI_ID, skillId: 'kotone-go-for-broke', name: `Go for Broke (${remaining} left)`, target: 'self', enabled: remaining > 0 && this.canGoForBroke(), cost: 0, statusLabel: remaining ? 'FREE' : 'SPENT' });
    return [...controls, ...actions];
  }
  // A second use replaces the last Fortune action with a fresh three, as in the
  // 2026-09-26 DOD rotation (Go for Broke, two actions, Go for Broke, three
  // actions = five in one turn). It is not offered earlier in the Fortune.
  isFortuneChain() { return this.state.fortune && this.state.fortuneActionsLeft === 1; }
  canGoForBroke() {
    return this.active && this.engine.actor?.id === KOTONE_SHIOMI_ID && this.linked?.hp > 0
      && (this.state.actionWindow || this.isFortuneChain());
  }
  activateGoForBroke() {
    const chained = this.isFortuneChain();
    if (!this.canGoForBroke()) throw new Error('Go for Broke requires the opening of Kotone’s normal or Concert turn, or her last Fortune action, and a living linked ally');
    const activationId = `gfb-${this.state.goForBroke.used + 1}`;
    const result = spendGoForBrokeUse(this.state.goForBroke, activationId);
    if (!result.ok) throw new Error(`Go for Broke unavailable: ${result.reason}`);
    this.state.fortune = true; this.state.fortuneActionsLeft = 3; this.state.linkWindow = false; this.state.actionWindow = false;
    this.state.activeFortuneId = activationId; this.state.fortuneChained = chained;
    const kinds = chained || this.engine.isVirtualConcertActive() ? 'three extra actions' : 'one normal action + two extra actions';
    this.event('fortune', `Go for Broke ${this.state.goForBroke.used}/${this.state.goForBroke.limit}: Fortune, ${kinds}.`, { activationId, actionsLeft: 3, remainingUses: result.remaining, tone: 'phase' });
    if (this.unit.awareness >= 1) this.automaticUltimate(this.unit, `${activationId}-own`);
  }
  automaticUltimate(actor, activationId) {
    if (this.state.ultimateActivationIds.includes(activationId)) return;
    this.state.ultimateActivationIds.push(activationId);
    if (!actor || actor.hp <= 0) { this.event('ultimate_unavailable', 'Automatic linked ultimate: linked ally is not alive.', { activationId, tone: 'system' }); return; }
    let skill = actor.highlightSkill;
    if (this.engine.isJc(actor)) skill = this.engine.jcHighlightSkill(actor.selectedMasks[0]);
    if (!skill) skill = { id: `kotone-forced-${actor.id}-hl`, slot: 'HL', name: `${actor.codename} Highlight`, element: actor.id === 'wonder' ? this.engine.activePersona.element : actor.element, power: 2.8, target: 'boss', cost: 0, note: 'Existing beta generic Highlight fallback, identical to getHighlightActions; not a newly sourced character coefficient.' };
    // An explicitly implemented Theurgy is supported without any gauge blocker.
    // Legacy descriptive-only Theurgies must not turn into invented damage.
    const theurgy = forcedTheurgySkill(actor) || actor.skills?.find(item => item.supportActionKind === 'theurgy' && item.supportExecutable === true);
    if (theurgy) skill = theurgy;
    if (!skill || this.engine.unsupportedActionReason(skill) && skill.supportExecutable !== true) {
      this.event('ultimate_unavailable', `${actor.codename}'s automatic Highlight/Theurgy has no executable implementation in this beta. Fortune still completes; no gauge is spent.`, { targetId: actor.id, activationId, tone: 'system' });
      this.state.unresolvedUltimate = { actorId: actor.id, activationId };
      return;
    }
    const gauge = this.engine.state.sharedCombat.highlight;
    this.event('automatic_ultimate', `${actor.codename}: automatic ${skill.supportActionKind === 'theurgy' ? 'Theurgy' : 'Highlight'} (no gauge, SP or turn cost).`, { targetId: actor.id, activationId, skillId: skill.id, tone: 'phase' });
    if (skill.supportActionKind !== 'theurgy') {
      skill = { ...skill, actionDamageBonus: Number(skill.actionDamageBonus || 0) + Number(actor.yukariPendingHighlightAmp || 0) };
      actor.yukariPendingHighlightAmp = 0;
    }
    this.engine.resolveSkill(actor, skill, ['ally', 'all_allies', 'party'].includes(skill.target) ? (this.linked?.id || actor.id) : this.engine.state.boss.id, 'highlight', { ignoreCost: true, grantsHighlight: false, automatic: true });
    this.engine.state.sharedCombat.highlight = gauge;
    const yukari = this.engine.state.party.find(unit => this.engine.isYukari(unit) && unit.hp > 0);
    if (yukari) this.engine.applyUnitBuff(actor, { id: 'yukari_tailwinds_air_trigger', name: "TAILWIND'S AIR DAMAGE", stat: 'damage', value: .2, duration: 2 }, 'passive', { casterId: yukari.id, skillId: 'yukari-tailwinds-air', castId: activationId });
    if (skill.supportActionKind !== 'theurgy' && this.engine.isMikuNavigator() && Number(this.engine.state.navigator.awareness || 0) >= 4) {
      this.engine.applyUnitBuff(actor, { id: 'miku_a4_highlight_attack', name: 'MIKU A4 HIGHLIGHT ATK', stat: 'attack', value: .25, duration: 2, mikuGranted: true }, 'awareness', { casterId: this.engine.state.navigator.id, skillId: 'miku-a4-highlight', castId: activationId });
    }
    this.engine.advanceSupportTiming(actor.id, 'interrupt');
  }
  /** Return true to defer the normal-turn completion until both extras finish. */
  deferCompletion() {
    if (!this.active || this.engine.actor?.id !== KOTONE_SHIOMI_ID) return false;
    this.state.linkWindow = false; this.state.actionWindow = false;
    const concert = this.engine.isVirtualConcertActive();
    if (concert && !this.state.fortune) { this.state.extraActions++; return false; }
    if (!this.state.fortune) { this.state.normalActions++; return false; }
    const before = this.state.fortuneActionsLeft;
    // Concert turns are uncounted; after a chain every remaining action is extra.
    const normalAction = before === 3 && !this.state.fortuneChained && !concert;
    if (normalAction) this.state.normalActions++;
    else { this.state.extraActions++; this.engine.advanceSupportTiming(KOTONE_SHIOMI_ID, 'extra_action'); }
    this.state.fortuneActionsLeft--;
    this.event('fortune_action', `Fortune actions left: ${this.state.fortuneActionsLeft}.`, { actionsLeft: this.state.fortuneActionsLeft, actionKind: normalAction ? 'normal' : 'extra' });
    if (this.state.fortuneActionsLeft > 0) {
      // The next Fortune action is an extra action.
      this.engine.notifyExtraActionStart?.(this.unit, 'Fortune extra action');
      return true;
    }
    this.automaticUltimate(this.linked, `${this.state.activeFortuneId}-linked`);
    this.state.fortune = false; this.state.fortuneChained = false; this.state.cold = 2;
    this.event('cold', 'Fortune ended. Cold: Kotone skips her next two normal turns.', { cold: 2, tone: 'phase' });
    return false;
  }
  stepControl(action, targetId) {
    if (action.type === 'kotone_link') this.selectLink(targetId);
    else if (action.type === 'kotone_assist') this.activateGoForBroke();
    else if (action.type === 'kotone_cold') {
      if (!this.state.cold) throw new Error('Cold is not active');
      const concert = this.engine.isVirtualConcertActive();
      this.state.cold--;
      this.event('cold', `Cold ${concert ? 'Concert' : 'normal'} turn passed without acting; ${this.state.cold} remaining.`, { cold: this.state.cold, tone: 'system' });
      this.engine.completeCountedAction({ actionType: 'kotone_cold', grantsSharedHighlight: false, wasConcertAction: concert });
    } else throw new Error('Unknown Kotone control');
    this.engine.recordFrame(action.name);
    return { nextState: this.engine.config.fastMode ? null : this.engine.getObservation(), reward: 0,
      done: this.engine.state.phase !== 'battle', consumedAction: action.type === 'kotone_cold', events: this.engine.config.fastMode ? [] : clone(this.engine.state.history.at(-1).events) };
  }
  recommend(actions) {
    if (!this.active || this.engine.actor?.id !== KOTONE_SHIOMI_ID) return null;
    const enabled = actions.filter(action => action.enabled);
    let action = enabled.find(action => action.type === 'kotone_cold');
    const linkedAlive = this.linked?.hp > 0;
    if (!action && !linkedAlive) {
      const ally = this.engine.state.party.filter(unit => unit.hp > 0 && unit.id !== KOTONE_SHIOMI_ID).sort((a,b) => this.currentAttack(b) - this.currentAttack(a))[0];
      action = enabled.find(item => item.type === 'kotone_link');
      if (action) return { ...action, targetId: ally.id, reason: 'Establish Arcana Link.', confidence: 1 };
    }
    if (!action && this.countPowerful() >= 1) action = enabled.find(item => item.type === 'kotone_assist');
    if (!action && linkedAlive && this.countPowerful() < 3) action = enabled.find(item => item.skill?.kotoneSkill === 'S1');
    if (!action && this.state.fortune && this.state.fortuneActionsLeft <= 1) action = enabled.find(item => item.skill?.kotoneSkill === 'S2');
    if (!action) action = enabled.find(item => item.skill?.kotoneSkill === 'S3');
    if (!action) action = enabled.find(item => item.skill?.kotoneSkill === 'S2') || enabled.find(item => item.type === 'guard');
    if (!action) return null;
    let targetId = action.skill?.kotoneSkill === 'S1' ? this.linked?.id : this.engine.state.boss.id;
    if (action.skill?.kotoneSkill === 'S3') {
      targetId = this.engine.state.party.find(unit => unit.hp > 0 && unit.id !== KOTONE_SHIOMI_ID && unit.id !== this.state.linkedId && (this.unit.awareness < 6 || unit.id !== 'wonder'))?.id || KOTONE_SHIOMI_ID;
    }
    return { ...action, targetId, reason: 'Kotone policy: build Bonds, use Fortune, copy support, then burst.', confidence: .8 };
  }
}
