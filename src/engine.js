import { awarenessStatDefaults, loadoutForUnit, resolveAwareness } from './awareness.js';
import { cosmicYuiMethods } from './cosmic-yui-mechanics.js';
import { characterHook, characterModuleFor, initializeRegisteredCharacters, notifyCharacterActionEnd, prepareCharacterDamage, notifyCharacterDamage, notifyCharacterSpecialAction, notifyCharacterKnockout, registeredLegacyMethods } from './characters/registry.js';
import { resolveForcedTheurgy } from './combat/forced-theurgy.js';
import { equippedAttack } from './combat/weapon-stats.js';
import { createSupportRuntime, effectProvenance, prepareSupportCopy, commitSupportCopy, advanceSupportClocks } from './combat/support-effects.js';
import { enqueueSupportAction, completeSupportAction } from './combat/support-actions.js';
import { KOTONE_SHIOMI_ID } from './characters/kotone-shiomi-data.js';
import { withLocalCharacters, createCharacterMechanics } from './characters/kotone-overlay.js';
import { bosses, navigator, personas, roster, multidimensionalDreamscapeEvidence } from './data.js';
import { calculateDreamscapeResult, getMultidimensionalDreamscapeTurnScoreMultiplier, getObservedDreamscapeMultiplier } from './mode-scoring.js';
import {
  CURSED_TIES_WEAPON_ID,
  getWonderWeaponDefinition,
  getWonderWeaponProfile
} from './wonder-weapons.js';
import {
  WONDER_WEAPON_EFFECT_LIMITATIONS,
  createWonderWeaponEffectState,
  wonderWeaponBattleStart,
  wonderWeaponOnDamage,
  wonderWeaponOnKnockdown,
  wonderWeaponOnPersonaChange,
  wonderWeaponOnSkillTargetAlly,
  wonderWeaponOnTurnEnd
} from './wonder-weapon-effects.js';

const clone = value => structuredClone(value);
const byId = (list, id) => list.find(item => item.id === id);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const scorePoint = value => Math.max(0, Math.round(Number(value) || 0));
const isWeakTo = (target, element) => target?.weakness === element || target?.weaknesses?.includes(element) === true;
const jcMaskByName = Object.freeze({
  'Mask of Mischief & Innocence': 'mischief',
  'Mask of Service & Admonition': 'service',
  'Mask of Absurdity & Nonsense': 'absurdity',
  'Mask of Luck & Loss': 'luck'
});
const jcSecondaryElement = Object.freeze({ mischief: 'ice', service: 'wind', absurdity: 'nuclear', luck: 'curse' });
const defaultJcMasks = Object.freeze(['mischief', 'absurdity']);
const jcPairKey = masks => [...masks].sort().join('+');
const mikuSongs = Object.freeze(['Heaven', 'Spring Storm', 'Play-With-Fire']);
const mikuTrackBySong = Object.freeze({ Heaven: 'Break', 'Spring Storm': 'Critical', 'Play-With-Fire': 'Expert' });
// Direct live tooltip/readback costs from the 2026-09-05 Hachiman run. The
// imported Lufel Persona records currently omit these costs, so only observed
// persona-and-skill pairs are corrected here.
const observedLivePersonaCosts = Object.freeze({
  Dionysus: Object.freeze({ Revolution: 22, 'Universal Theoria': 24, Tarukaja: 22 }),
  Vasuki: Object.freeze({ 'Venomous Spiral': 24, Media: 23, Rakunda: 22 }),
  Janosik: Object.freeze({ Rakunda: 22, Tarukaja: 22 })
});
export const CURRENT_MECHANICS_PROFILE = 'live-2026-09-04';
export const RECORDED_MECHANICS_PROFILE = 'recorded-2026-08-29';

export function calculateNightmareScore({ baseDamagePoints = 0, weakenedDamagePoints = 0, bossAttackPoints = 0, difficultyBonus = 1 } = {}) {
  return (scorePoint(baseDamagePoints) + scorePoint(weakenedDamagePoints) + scorePoint(bossAttackPoints)) * scorePoint(difficultyBonus);
}

const marianMedicines = [
  { id: 'attack_tablet', name: 'Attack Tablet', note: 'Increase one ally’s Attack by 30% for 2 turns.', buff: { id: 'medicine_attack', name: 'ATTACK TABLET', stat: 'attack', value: 0.3, duration: 2, potentMedicineType: 'attack' } },
  { id: 'defender_tonic', name: 'Defender Tonic', note: 'Increase one ally’s Defense by 45% for 2 turns.', buff: { id: 'medicine_defense', name: 'DEFENDER TONIC', stat: 'defense', value: 0.45, duration: 2, potentMedicineType: 'defense' } },
  { id: 'fighter_salve', name: 'Fighter Salve', note: 'Increase one ally’s damage dealt by 25% for 1 turn.', buff: { id: 'medicine_damage', name: 'FIGHTER SALVE', stat: 'damage', value: 0.25, duration: 1, potentMedicineType: 'damage' } },
  { id: 'dot_up', name: 'DOT-Up', note: 'Increase one ally’s damage over time effect by 10% for 1 turn.', buff: { id: 'medicine_dot_damage', name: 'DOT-UP', stat: 'dotDamage', value: 0.1, duration: 1, potentMedicineType: 'dot' } },
  { id: 'reso_up', name: 'Reso-Up', note: 'Increase one ally’s Resonance damage by 10% for 1 turn.', buff: { id: 'medicine_resonance_damage', name: 'RESO-UP', stat: 'resonanceDamage', value: 0.1, duration: 1, potentMedicineType: 'resonance' } },
  { id: 'one_more_up', name: '1More-Up', note: 'Increase one ally’s ONE MORE and All-Out Attack damage by 10% for 1 turn.', buff: { id: 'medicine_one_more_damage', name: '1MORE-UP', stat: 'oneMoreDamage', value: 0.1, duration: 1, potentMedicineType: 'one_more' } },
  { id: 'highlight_up', name: 'HL-Up', note: 'Increase one ally’s Highlight and Theurgy damage by 10% for 1 turn.', buff: { id: 'medicine_highlight_damage', name: 'HL-UP', stat: 'highlightDamage', value: 0.1, duration: 1, potentMedicineType: 'highlight' } },
  { id: 'technica_up', name: 'Technica-Up', note: 'Increase one ally’s Technical Precision by 600 for 1 turn.', buff: { id: 'medicine_technical_precision', name: 'TECHNICA-UP', stat: 'technicalPrecision', value: 600, duration: 1, potentMedicineType: 'technical' } }
];
// Attacker Tablet and Fighter Salve were observed in the Dreamscape recording;
// DOT-Up and HL-Up items are listed in Sleepy's DOD rotation (2026-09-09).
const observedDreamscapeItems = Object.freeze(['attack_tablet', 'fighter_salve', 'dot_up', 'highlight_up']);

export class BattleEngine {
  constructor(config = {}) {
    if ((config.teamIds || []).includes(KOTONE_SHIOMI_ID) && config.mechanicsProfile === RECORDED_MECHANICS_PROFILE) throw new Error('Kotone is available in the live ordinary Global profile, not archived recorded replays');
    if (config.mechanicsProfile && ![CURRENT_MECHANICS_PROFILE, RECORDED_MECHANICS_PROFILE].includes(config.mechanicsProfile)) throw new Error('Unknown mechanics profile');
    this.personaDefinitions = [...personas, ...(config.personaDefinitions || [])];
    this.characterDefinitions = withLocalCharacters([...(config.characterDefinitions || []), ...roster]);
    this.bossDefinitions = [...(config.bossDefinitions || []), ...bosses];
    this.bossDefinition = config.bossDefinition ? clone(config.bossDefinition) : null;
    this.navigatorDefinition = clone(config.navigatorDefinition || navigator);
    this.config = {
      mechanicsProfile: config.mechanicsProfile || CURRENT_MECHANICS_PROFILE,
      seed: Number(config.seed ?? 808),
      bossId: config.bossId || bosses[0].id,
      modeId: config.modeId || null,
      teamIds: config.teamIds || roster.map(member => member.id),
      personaIds: config.personaIds || personas.map(persona => persona.id),
      loadouts: clone(config.loadouts || {}),
      characterOptions: clone(config.characterOptions || {}),
      ...(typeof config.kotoneOwned === 'boolean' ? { kotoneOwned: config.kotoneOwned } : {}),
      // The UI persists these on Wonder's loadout. Top-level fields keep the
      // engine usable by direct callers and replay fixtures.
      weaponId: config.weaponId || null,
      weaponProfileId: config.weaponProfileId || null,
      weaponProcGranularity: ['per-hit', 'per-cast'].includes(config.weaponProcGranularity)
        ? config.weaponProcGranularity : null,
      jcMaskPair: Array.isArray(config.jcMaskPair) ? config.jcMaskPair : null,
      jcOpeningAutoTargetId: config.jcOpeningAutoTargetId || null,
      // When omitted, the live bonus follows an A6 J&C in the selected party.
      // Callers that model the account-wide A6 effect while J&C is off-party
      // can provide an explicit boolean.
      jcA6Unlocked: typeof config.jcA6Unlocked === 'boolean' ? config.jcA6Unlocked : null,
      encounterThresholds: Array.isArray(config.encounterThresholds) ? clone(config.encounterThresholds) : null,
      lifeSustainment: config.lifeSustainment == null ? null : config.lifeSustainment === true,
      wavecatcherFollowUps: config.wavecatcherFollowUps !== false,
      wavecatcherSourceMechanics: typeof config.wavecatcherSourceMechanics === 'boolean'
        ? config.wavecatcherSourceMechanics
        : (config.mechanicsProfile || CURRENT_MECHANICS_PROFILE) === CURRENT_MECHANICS_PROFILE,
      itemInventory: config.itemInventory && typeof config.itemInventory === 'object' ? clone(config.itemInventory) : null,
      fastMode: config.fastMode === true,
      sharedMechanics: clone(config.sharedMechanics || {}),
      // Explicit recorded encounter state; does not redefine character roles.
      dreamscapeObservedCompositionEffect: config.dreamscapeObservedCompositionEffect === true,
      hachimanLovesickTickModel: ['flat_base_attack', 'flat_buffed_attack_defense', 'per_stack_snapshot'].includes(config.hachimanLovesickTickModel)
        ? config.hachimanLovesickTickModel : 'per_stack_snapshot',
      hachimanBaseDefense: Number.isFinite(Number(config.hachimanBaseDefense)) && Number(config.hachimanBaseDefense) > 0 ? Number(config.hachimanBaseDefense) : null,
      // What-if: model the MIKU Labor 4-set as an additive Attack-buff entry
      // instead of the stat multiplier the in-battle capture supports.
      hachimanLaborAsBuffPool: config.hachimanLaborAsBuffPool === true,
      // Optional finite medicine budget for what-ifs; A6 Summer Marian is unlimited.
      marianPrescriptions: Number.isFinite(Number(config.marianPrescriptions)) && Number(config.marianPrescriptions) > 0 ? Number(config.marianPrescriptions) : null,
      // Optional replay overrides. They preserve the observed 25 start / 17 gain
      // without treating that single observation as the general live formula.
      sharedHighlightStart: config.sharedHighlightStart != null && Number.isFinite(Number(config.sharedHighlightStart)) ? Number(config.sharedHighlightStart) : null,
      sharedHighlightGain: config.sharedHighlightGain != null && Number.isFinite(Number(config.sharedHighlightGain)) ? Number(config.sharedHighlightGain) : null,
      // Opt-in hypothesis from the T5/T7 gauge captures. Keep the established
      // live rate model as the default until the cast-bonus rule is confirmed.
      highlightChargeRule: config.highlightChargeRule === 'base_double_weak_cast_bonus'
        ? config.highlightChargeRule : 'normal_weakness_cast_rates',
      sharedHighlightEvidence: config.sharedHighlightEvidence || null
    };
    this.initialSeed = this.config.seed >>> 0;
    this.reset();
  }

  random() {
    let value = this.state.rng >>> 0;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state.rng = value >>> 0;
    return this.state.rng / 4294967296;
  }

  reset() {
    this.kotoneMechanics = null;
    this.supportCastContext = null;
    const bossData = clone(this.bossDefinition || byId(this.bossDefinitions, this.config.bossId) || bosses[0]);
    const modeId = this.config.modeId || bossData.defaultMode || 'nexus';
    const dreamscapeRun = this.usesLiveMechanics() && modeId === 'multidimensional';
    const dreamscapePreview = dreamscapeRun && bossData.dreamscapeScoreVerified !== true;
    const liveHachimanDreamscape = this.usesLiveMechanics() && bossData.id === 'hachiman' && modeId === 'multidimensional';
    const liveHachimanDevourer = this.usesLiveMechanics() && bossData.id === 'hachiman' && modeId === 'devourer';
    const liveHachiman = liveHachimanDreamscape || liveHachimanDevourer;
    const liveSurt = this.usesLiveMechanics() && bossData.id === 'surt'
      && ['multidimensional', 'nexus', 'devourer'].includes(modeId);
    const liveScoreAttackMode = this.usesLiveMechanics() && bossData.scoreAttack === true
      && ['multidimensional', 'nexus', 'devourer'].includes(modeId);
    if (liveHachimanDevourer) {
      // User-supplied Devourer of Dreams rules (2026-09-09): HP capped at 410,000
      // before the break, HP Lock only prevents HP going under 1, the break opens
      // when HP reaches 0 with the lock off, damage during the break scores 3x,
      // shields work normally, turn limit 120. The difficulty bonus and any
      // survival bonus are NOT supplied; the score is reported as points.
      // Sleepy's run and Joker's live run (2026-09-10) both stopped at exactly
      // 401,445 with the lock on and both show Base Damage Points 405,499. Max
      // HP is therefore 405,499 and Life Sustainment holds HP at 1% of max
      // (4,054), not at 1 HP; the "410k" figure was a rounding.
      bossData.maxHp = 405499;
      bossData.finiteHp = true;
      bossData.lifeSustainmentFloorRatio = 0.01;
      bossData.turnLimit = 120;
      bossData.previewAttackTurns = 120;
      bossData.scoreModel = 'hachiman_devourer_observed_rules';
      bossData.dodRules = { preBreakHpCap: 405499, lockFloor: 4054, breakPointMultiplier: 3, turnLimit: 120, hpLock: 'holds HP at 1% of max (4,054)', shields: 'normal', evidence: 'two_runs_401445_locked_405499_base_2026-09-10' };
    }
    // User-confirmed turn limits (2026-09-27), live profile only. Devourer of
    // Dreams allows 110 Attack Turns before the break, then its 2-turn
    // Weakened window. Nexus of Dreams allows 6. Miku's Showstopper adds two
    // Concert rounds (extra actions for every character), not Attack Turns.
    // Supersedes the 120-turn Hachiman DOD rule of 2026-09-09.
    if (this.usesLiveMechanics() && modeId === 'devourer') {
      bossData.turnLimit = 110;
      bossData.previewAttackTurns = 110;
      if (bossData.dodRules) bossData.dodRules.turnLimit = 110;
    } else if (this.usesLiveMechanics() && modeId === 'nexus') {
      bossData.turnLimit = 6;
    } else if (this.usesLiveMechanics() && modeId === 'multidimensional') {
      // Multidimensional Dreamscape stops after 6 Attack Turns on every boss.
      // turnLimit stays the HUD turns-left count (5 at Turn 1) used by the
      // observed survival multiplier, as on Hachiman and Surt.
      bossData.previewAttackTurns = 6;
      bossData.turnLimit = 5;
    }
    if (liveHachimanDreamscape && this.config.hachimanBaseDefense) {
      // Explicit base Defense override for what-if comparisons; the boss
      // coefficient from the encounter data is retained.
      const coefficient = Number(bossData.defenseCoefficient || 1);
      bossData.baseDefense = this.config.hachimanBaseDefense;
      bossData.defense = this.config.hachimanBaseDefense * coefficient;
      for (const phase of bossData.phases || []) { phase.baseDefense = bossData.baseDefense; phase.defense = bossData.defense; }
    }
    if (liveHachiman && bossData.liveDaisoujouProfile) {
      const profile = bossData.liveDaisoujouProfile;
      bossData.daisoujouDefeatStacks = 0;
      bossData.summons = (bossData.summons || []).map(summon => summon.species === 'daisoujou' ? {
        ...summon, level: profile.level, speed: profile.speed,
        weakness: profile.weakness, resistance: profile.resistance,
        resistances: [...profile.resistances], affinityEvidence: profile.evidence
      } : summon);
    }
    const itemInventory = Object.fromEntries(observedDreamscapeItems.map(itemId => {
      const configured = this.config.itemInventory?.[itemId];
      const defaultCount = liveScoreAttackMode ? 1 : 0;
      return [itemId, clamp(Math.floor(Number(configured ?? defaultCount) || 0), 0, 10)];
    }));
    const lifeSustainment = liveHachimanDevourer
      ? this.config.lifeSustainment === true
      : bossData.encounter?.lifeSustainment === true
        && (modeId === 'nexus' || (modeId === 'devourer' && this.config.lifeSustainment === true));
    if (this.config.encounterThresholds && bossData.encounter?.cloneThresholds) {
      bossData.encounter.cloneThresholds = bossData.encounter.cloneThresholds.map((threshold, index) => {
        const override = this.config.encounterThresholds[index];
        const hpRatio = Number(typeof override === 'object' ? override?.hpRatio : override);
        return Number.isFinite(hpRatio) ? { ...threshold, hpRatio: clamp(hpRatio, 0, 1) } : threshold;
      });
    }
    const party = this.config.teamIds.map(id => clone(byId(this.characterDefinitions, id))).filter(Boolean).map(unit => {
      const loadout = loadoutForUnit(this.config.loadouts, unit);
      const weaponId = unit.id === 'wonder' ? (loadout.weaponId || this.config.weaponId) : null;
      const weaponProfileId = unit.id === 'wonder' ? (loadout.weaponProfileId || this.config.weaponProfileId) : null;
      const weaponProcGranularity = unit.id === 'wonder' && ['per-hit', 'per-cast'].includes(loadout.weaponProcGranularity)
        ? loadout.weaponProcGranularity : this.config.weaponProcGranularity;
      const weapon = unit.id === 'wonder' ? getWonderWeaponDefinition(weaponId) : null;
      const weaponProfile = weapon ? getWonderWeaponProfile(weaponId, weaponProfileId) : null;
      const stats = loadout.baseStats || {};
      const equippedStats = loadout.statsMode === 'equipped' || stats.statsMode === 'equipped';
      const weaponStats = weaponProfile?.weaponStats || {};
      const weaponComponentStatsApplied = Boolean(weapon && weaponProfile && !equippedStats);
      const weaponComponentStat = key => {
        if (!weaponComponentStatsApplied) return 0;
        const value = Number(weaponStats[key]);
        return Number.isFinite(value) ? value : 0;
      };
      const hasStat = key => Number.isFinite(Number(stats[key]));
      const displayedPercent = key => hasStat(key) ? Number(stats[key]) / 100 : 0;
      const awareness = resolveAwareness(unit, loadout);
      Object.assign(unit, awarenessStatDefaults(unit, awareness));
      const sourceLevelStats = unit.sourceStats?.[`a${awareness}_lv80`] || unit.sourceStats?.a6_lv80 || unit.sourceStats?.a0_lv80 || {};
      const sourceAttack = Number(sourceLevelStats.attack ?? unit.attack ?? 0);
      const sourceMaxHp = Number(sourceLevelStats.HP ?? sourceLevelStats.maxHp ?? unit.maxHp ?? 1);
      // Imported display defaults were reduced for the archived damage scale.
      // Hachiman's source-scale formula uses level-80 stats unless equipped
      // totals exist. Other encounters still retain their older damage scale.
      if (liveHachiman) {
        if (!hasStat('attack')) unit.attack = sourceAttack;
        if (!hasStat('maxHp')) unit.maxHp = sourceMaxHp;
        if (!hasStat('defense') && Number.isFinite(Number(sourceLevelStats.defense))) unit.defense = Number(sourceLevelStats.defense);
      }
      for (const key of ['maxHp', 'maxSp', 'attack', 'defense', 'speed']) {
        if (hasStat(key)) unit[key] = Number(stats[key]);
      }
      if (this.config.wavecatcherSourceMechanics && unit.slug === 'puppet-wavecatcher'
        && awareness >= 6 && !hasStat('maxSp')) unit.maxSp = 450;
      if (weaponComponentStatsApplied) {
        unit.maxHp = Number(unit.maxHp || 0) + weaponComponentStat('maxHp');
        unit.attack = Number(unit.attack || 0) + weaponComponentStat('attack');
        unit.defense = Number(unit.defense || 0) + weaponComponentStat('defense');
      }
      if (hasStat('critRate')) unit.crit = displayedPercent('critRate');
      if (hasStat('critMult')) unit.critMult = displayedPercent('critMult');
      const revelation = unit.id === 'wonder' ? {} : (loadout.revelationCombat || {});
      if (unit.id === KOTONE_SHIOMI_ID) unit.kotoneInputStats = { attack: unit.attack, maxHp: unit.maxHp, defense: unit.defense || 0 };
      const attackPercent = equippedStats && hasStat('attack') ? 0 : Number(revelation.attackPercent || 0);
      const hpPercent = equippedStats && hasStat('maxHp') ? 0 : Number(revelation.hpPercent || 0);
      const critRateBonus = equippedStats && hasStat('critRate') ? 0 : Number(revelation.critRate || 0);
      const damageBonus = displayedPercent('damageBonus')
        + (equippedStats && hasStat('damageBonus') ? 0 : Number(revelation.damageBonus || 0));
      unit.attack = Math.round(unit.attack * (1 + attackPercent));
      unit.maxHp = Math.round(unit.maxHp * (1 + hpPercent));
      // Dreamscape's sourced Skill/Resonance damage formula can use a full
      // 100% crit rate. Ordinary critical-hit rolls retain their 95% cap.
      const dreamscapeCritRateCap = liveHachiman ? 1 : 0.95;
      unit.crit = clamp(unit.crit + critRateBonus, 0, dreamscapeCritRateCap);
      const mechanicAttackBase = (hasStat('attack') ? Number(stats.attack) : sourceAttack)
        + weaponComponentStat('attack');
      const mechanicMaxHpBase = (hasStat('maxHp') ? Number(stats.maxHp) : sourceMaxHp)
        + weaponComponentStat('maxHp');
      const spRecovery = hasStat('spRecovery')
        ? Number(stats.spRecovery)
        : Number(unit.sourceStats?.awake7?.sp_recover ?? 100);
      const selectedMasks = unit.slug === 'j-c'
        ? this.validJcMasks(loadout.jcMasks || this.config.jcMaskPair || defaultJcMasks)
        : [];
      const combatUnit = {
        ...unit, hp: unit.maxHp,
        sp: this.config.wavecatcherSourceMechanics && unit.slug === 'puppet-wavecatcher' && awareness < 6 ? 0 : unit.maxSp,
        ammo: unit.maxAmmo || 8,
        awareness,
        // Recorded replays retain their individual 35-base gauges. Live Highlight
        // is a party resource initialized after every member's Revelation is known.
        highlight: this.usesLiveMechanics() ? 0 : clamp(35 + (revelation.highlightStart || 0), 0, 100),
        highlightStart: Number.isFinite(Number(revelation.highlightStart)) ? Number(revelation.highlightStart) : 0, actionLimit: unit.actionLimit || 1,
        statsMode: equippedStats ? 'equipped' : null,
        // Character level-80 base plus weapon stats. Attack % buffs scale this,
        // not the panel total (live Miyu 2026-09-27: -30% Attack = -626 = 30% of
        // 1,307.17 + 779.61). Only set for equipped totals with a known weapon.
        statBase: this.usesLiveMechanics() && equippedStats && Number(loadout.statBase?.attack) > 0 ? { ...loadout.statBase } : null,
        damageBonus, elementBonus: revelation.elementBonus || null,
        ...(revelation.weakElementAttack ? { revelationWeakElementAttack: revelation.weakElementAttack } : {}),
        revelationName: unit.id === 'wonder' ? null : (loadout.revelationName || null),
        revelationMain: unit.id === 'wonder' ? null : (loadout.revelationMain || null),
        revelationSet: unit.id === 'wonder' ? null : (loadout.revelationSet || null),
        buffs: [], debuffs: [], guarding: false, damageDone: 0,
        mechanicAttack: mechanicAttackBase * (1 + attackPercent),
        mechanicMaxHp: mechanicMaxHpBase * (1 + hpPercent),
        spRecovery: Math.max(0, spRecovery),
        pierceRate: displayedPercent('pierceRate'), ailmentAccuracy: displayedPercent('ailmentAccuracy'),
        ailmentResistance: displayedPercent('ailmentResistance'), damageReduction: displayedPercent('damageReduction'),
        technicalPrecision: hasStat('technicalPrecision') ? Number(stats.technicalPrecision) : 0,
        blessingStacks: 0, downPoints: hasStat('downPoints') ? Number(stats.downPoints) : 0,
        ragnarokStacks: liveSurt ? Number(bossData.encounter?.initialRagnarokStacks || 0) : 0,
        midsummerPrescription: 0, medicinePrescriptionMax: 2, medicineUses: 0, lastMedicineCharacterTurn: 0,
        characterTurnsStarted: 0,
        highlightCooldowns: {}, highlightCooldownGrace: {},
        skillCooldowns: Object.fromEntries((unit.skills || []).map(skill => [skill.id, 0])),
        surfActive: unit.slug === 'puppet-wavecatcher' && awareness >= 6, offshoreStacks: 0, surfReentryLocked: false,
        catchAWaveCount: 0, totalRecoveredSp: 0, pendingOffshoreReset: false,
        spCapMultiplier: unit.skills?.some(skill => skill.name === 'Jellyfish Splash') ? 2 : 1,
        healingBonus: 0, shieldBonus: 0, nextMedicineEffectBonus: 0
      };
      if (weapon && weaponProfile) {
        combatUnit.wonderWeapon = {
          weaponId: weapon.id,
          profileId: weaponProfile.id,
          observed: clone(weaponProfile.observed),
          weaponStats: clone(weaponProfile.weaponStats),
          forge: clone(weaponProfile.forge),
          procGranularity: weaponProcGranularity,
          componentStatsApplied: weaponComponentStatsApplied
        };
      }
      if (unit.slug === 'rin-firecracker') Object.assign(combatUnit, {
        rinFlamingSwordDance: false, rinYanhuaBonusPower: 0, rinYanhuaFlamesChance: 0
      });
      if (unit.slug === 'matoi') Object.assign(combatUnit, { extinguishStacks: 0 });
      if (unit.slug === 'j-c') {
        const attackDesire = Math.min(45, Math.floor(combatUnit.mechanicAttack / 100));
        const damageDesire = Math.min(15, Math.floor((combatUnit.damageBonus || 0) * 100 / 2));
        const critDesire = Math.min(15, Math.floor(Math.max(0, (combatUnit.critMult || 1.5) * 100 - 100) / 6));
        const configuredDesire = Number(loadout.jcDesireLevel);
        Object.assign(combatUnit, {
          selectedMasks,
          facades: awareness >= 1 ? [...selectedMasks] : [],
          desireLevel: Number.isFinite(configuredDesire)
            ? clamp(configuredDesire, 0, 120)
            : 25 + attackDesire + damageDesire + critDesire + (awareness >= 6 ? 20 : 0),
          trueDesireStacks: awareness >= 6 ? 1 : 0,
          trueDesirePrimed: false,
          jcTurnsStarted: 0,
          ...(this.usesLiveMechanics() && awareness >= 6 ? {
            // Observed A6 recharge: it is a periodic clock of Wonder's
            // completed normal-turn actions, starting at battle start.
            trueDesireWonderActions: 0,
            trueDesireRechargeProgress: 0,
            trueDesireRechargeInterval: 8,
            // Hachiman live (user confirmed 2026-09-09): every counted party
            // action advances the clock, Concert turns included. Elsewhere the
            // earlier Wonder-only observation stands.
            ...(liveHachiman ? {
              trueDesireRechargeOwner: 'jc',
              trueDesireRechargeCountBasis: 'jc_counted_actions_including_concert',
              trueDesireRechargeExcludesExtraActions: false,
              trueDesireRechargeEvidence: 'joker_live_dod_run_2026-09-10'
            } : {
              trueDesireRechargeOwner: 'wonder',
              trueDesireRechargeCountBasis: 'normal_turn_wonder_actions',
              trueDesireRechargeExcludesExtraActions: true
            }),
            trueDesireRechargeCountedActionTypes: ['attack', 'skill', 'gun', 'guard', 'item']
          } : {}),
          jcMaskActionsTaken: 0,
          jcNextMaskSlot: null,
          jcLastSkillAttackTargetId: null
        });
        combatUnit.highlightCooldowns = Object.fromEntries(selectedMasks.map(mask => [mask, 0]));
      }
      if (unit.slug === 'berry' && this.config.mechanicsProfile === CURRENT_MECHANICS_PROFILE) Object.assign(combatUnit, {
        chainsOfLove: awareness >= 2 ? 1 : 0, firstButterflyUsed: false,
        doubleBerryUsed: { S1: false, S2: false, S3: false, HL: false },
        berryHighlightUses: 0, powerOfLoveUsed: false, powerOfLove: 0,
        lovesickDefinition: clone(loadout.lovesickDefinition || unit.lovesickDefinition || this.defaultLovesickDefinition({ ...combatUnit, level: loadout.level ?? combatUnit.level }))
      });
      if (unit.slug === 'akihiko' && this.config.mechanicsProfile === CURRENT_MECHANICS_PROFILE) Object.assign(combatUnit, {
        gritStacks: 0, gritMax: awareness >= 6 ? 4 : 3,
        mettleStacks: awareness >= 6 ? 8 : 2, mettleMax: awareness >= 6 ? 18 : 12,
        lastFlashCharacterTurn: null,
        theurgyGauge: awareness >= 1 ? 70 : 0, theurgyMax: 140, theurgyReserve: 0, theurgyReserveTurns: 0
      });
      if (unit.slug === 'yukari' && this.config.mechanicsProfile === CURRENT_MECHANICS_PROFILE) Object.assign(combatUnit, {
        whisperwindStacks: awareness >= 1 ? 2 : 0, whisperwindMax: 2,
        erosionTriggeredSinceTurn: false, theurgyGauge: awareness >= 1 ? 70 : 0,
        theurgyMax: 70, theurgyReserve: 0, theurgyReserveTurns: 0
      });
      if (unit.slug === 'makoto' && this.config.mechanicsProfile === CURRENT_MECHANICS_PROFILE) Object.assign(combatUnit, {
        moonPhaseStacks: 0, moonPhaseDuration: 0, fullMoonStacks: 0, fullMoonDuration: 0,
        theurgyGauge: 35, theurgyMax: 100, theurgyReserve: 0, theurgyReserveTurns: 0,
        entrustedHopeStacks: 0, entrustedHopeTriggerTurn: null, nocturneAutoCooldown: 0
      });
      return combatUnit;
    });
    const wonderLevelBonus = this.usesLiveMechanics()
      && (this.config.jcA6Unlocked ?? party.some(unit => unit.slug === 'j-c' && unit.awareness >= 6))
      ? 1 : 0;
    const summons = (bossData.summons || []).map((summon, index) => ({
      ...summon, hp: summon.maxHp, alive: true, downMax: summon.downMax || 1,
      downPoints: summon.downMax || 1, downed: false, buffs: [], debuffs: [],
      berserkStacks: Number(summon.berserkStacks || 0),
      ragnarokStacks: Number(summon.ragnarokStacks ?? bossData.encounter?.initialRagnarokStacks ?? 0),
      spawnOrdinal: Number(summon.spawnOrdinal ?? index + 1), spawnedAttackTurn: 1,
      eligibleAttackTurn: 1, lastActedAttackTurn: 0
    }));
    this.state = {
      ...(this.usesLiveMechanics() ? { supportRuntime: createSupportRuntime() } : {}),
      mechanicsProfile: this.config.mechanicsProfile,
      mechanicsLimitations: this.usesLiveMechanics() ? [
        ...(party.some(unit => unit.awareness < 6) || resolveAwareness(this.navigatorDefinition, loadoutForUnit(this.config.loadouts, this.navigatorDefinition)) < 6
          ? ['Awareness profiles use source-specific base stats and existing rank-gated mechanics. Imported skill coefficients and unimplemented awareness effects are not automatically re-derived.'] : []),
        'Highlight owner-action clocks use an explicit same-owner-turn grace rule; live same-turn grace remains unverified.',
        ...(wonderLevelBonus ? ['J&C A6 grants Wonder +1 Skill Level and +1 Thief Tactics Level. Per-level coefficients are unavailable, so no numeric multiplier is applied.'] : []),
        ...(party.some(unit => unit.slug === 'berry') ? ['Lovesick uses sourced level-based damage and noncritical snapshots. Highlight-trigger Pierce is unverified and excluded; the first all-DoT Highlight activation conservatively cannot crit. Reapplication at the stack cap preserves existing snapshots; transferred snapshots retain their original factors pending isolated evidence. Per-stack critical-roll granularity is unverified; each activation uses one roll.'] : []),
        ...(party.some(unit => unit.slug === 'rin-firecracker') ? ['RIN Firecracker records Burn and Year-End Flames state. Burn’s base DoT coefficient and duration, Year-End Flames tick timing, and Fire Technical thresholds and results remain unverified; unsupported damage is omitted.'] : []),
        ...(party.some(unit => unit.slug === 'matoi') ? ['MATOI records Extinguish gates, Freeze, Burn-to-Scald conversion, and sourced base Defense reductions. Ailment-accuracy scaling, Technical thresholds and result tiers, Icebound chance timing, and Cold Flames conversion remain unverified.'] : []),
        ...(party.some(unit => unit.slug === 'akihiko') ? ['Akihiko Theurgy and Assist timing remain unavailable. The A1 Grit critical-rate duration and stacking rule are not stated, so that critical-rate bonus is omitted.'] : []),
        ...(party.some(unit => unit.slug === 'yukari') ? ['Yukari can fill and reserve Theurgy gauge, but Theurgy activation and reserve return remain unavailable. Reserve expiry uses the shared party-round clock.'] : []),
        ...(party.some(unit => unit.slug === 'makoto') ? ['Makoto Theurgy and Assist timing remain unavailable. Full Moon has no substitute generator while Theurgy is disabled. The A1 Melody extra-hit coefficient and A6 fatal-state ending boundary are not assumed.'] : []),
        ...(this.personaDefinitions.some(persona => (this.config.personaIds || []).includes(persona.id)
          && persona.skills?.some(skill => skill.sourceConfidence === 'source-tooltip-sp-cost-missing'))
          ? ['Elec Break / Fire Break SP cost is missing from the source data; 0 SP is used until an in-game cost is confirmed.'] : []),
        ...(dreamscapePreview ? ['Multidimensional Dreamscape shows simulated damage only. Game point accumulation, survival bonus and the actual ending trigger remain unverified.'] : []),
        ...(liveHachimanDreamscape ? ['Hachiman Daisoujou defeat stacks add 10% boss damage taken each, up to four stacks. Their duration is unknown, so the stored stack bonus remains active without an invented expiry rule.'] : []),
        ...(liveSurt ? ['Surt Berserk damage and Ragnarok HP loss are shown only as set amounts. Their numeric values are unknown, so Berserk is tracked without a damage multiplier and Ragnarok HP loss is omitted.'] : []),
        ...(liveSurt && modeId !== 'multidimensional' ? ['Surt is selectable in NOD and DOD, but the supplied screenshots only confirm the MLD encounter. NOD and DOD HP, score, and ending rules remain provisional.'] : []),
        ...(party.some(unit => unit.slug && unit.id !== KOTONE_SHIOMI_ID && !characterModuleFor(unit)) ? ['Some selected characters use generic direct effects; their full stateful kits are not implemented. Assist and Theurgy actions are unavailable.'] : []),
        ...(party.some(unit => unit.wonderWeapon?.weaponId === CURSED_TIES_WEAPON_ID && !unit.wonderWeapon.procGranularity) ? ['Cursed Ties is equipped, but Evil Eye does not proc until its timing is configured as per-hit or per-cast.'] : []),
        ...(party.some(unit => unit.wonderWeapon?.weaponId === CURSED_TIES_WEAPON_ID) ? ["Cursed Ties applies its 36% Attack condition to holder Wonder only. Whether 'an ally' includes Wonder, ailment-accuracy interaction with the stated 70% chance, and Evil Eye reapplication behavior remain unverified."] : [])
      ] : ['Archived mechanics reproduce the recorded 2026-08-29 replay and do not include confirmed live corrections.'],
      rng: this.initialSeed || 1,
      sharedCombat: {
        limitations: [], pendingActions: [], pendingTurnCompletion: false, uses: {},
        highlight: this.usesLiveMechanics()
          ? clamp(this.config.sharedHighlightStart ?? Math.max(0, ...party.map(unit => unit.highlightStart || 0)), 0, 100)
          : null,
        highlightStart: this.usesLiveMechanics()
          ? clamp(this.config.sharedHighlightStart ?? Math.max(0, ...party.map(unit => unit.highlightStart || 0)), 0, 100)
          : null,
        // A configured scalar is a replay compatibility override.  The live
        // default is contextual: one counted Thief action earns 17, or 21
        // when that action records a qualifying weakness packet.
        highlightGain: this.usesLiveMechanics() ? clamp(this.config.sharedHighlightGain ?? 17, 0, 100) : null,
        highlightNormalActionGain: this.usesLiveMechanics() ? 17 : null,
        highlightWeaknessActionGain: this.usesLiveMechanics() ? 21 : null,
        highlightConcertNormalActionGain: this.usesLiveMechanics() ? 34 : null,
        highlightConcertWeaknessActionGain: this.usesLiveMechanics()
          ? (this.config.sharedHighlightGain == null && this.config.highlightChargeRule === 'base_double_weak_cast_bonus' ? 38 : 42) : null,
        highlightWeaknessCastBonus: this.usesLiveMechanics() ? 4 : null,
        highlightChargeRule: this.config.highlightChargeRule,
        highlightRuleStatus: this.usesLiveMechanics()
          ? (this.config.sharedHighlightGain != null ? 'explicit_replay_scalar_override'
            : this.config.highlightChargeRule === 'base_double_weak_cast_bonus'
              ? 'opt_in_observed_base_double_weak_cast_bonus' : 'confirmed_normal_weakness_action_total')
          : 'recorded_personal_meter',
        highlightScalarOverride: this.usesLiveMechanics() && this.config.sharedHighlightGain != null,
        nextHighlightActionId: 1,
        lastHighlightActionContext: null,
        highlightEvidence: this.usesLiveMechanics()
          ? (this.config.sharedHighlightEvidence || (this.config.sharedHighlightStart != null || this.config.sharedHighlightGain != null
            ? 'observed_replay_override' : 'confirmed_user_live_rates_2026-09-05'))
          : null
      },
      itemInventory,
      // A6 Summer Marian does not consume medicine (Joker, 2026-09-11): the basket
      // is unlimited, one use per Marian turn. The earlier 10-use cap and the
      // 7-prescription reading from the live run are withdrawn; a finite count
      // can still be set with config.marianPrescriptions for what-ifs.
      itemMaxUses: liveScoreAttackMode ? (Number(this.config.marianPrescriptions) > 0 ? Number(this.config.marianPrescriptions) : Infinity) : 0,
      itemUsesRemaining: liveScoreAttackMode ? (Number(this.config.marianPrescriptions) > 0 ? Number(this.config.marianPrescriptions) : Infinity) : 0,
      followUpRng: (this.initialSeed ^ 0x9e3779b9) >>> 0 || 1,
      attackTurn: 1, attackTurnsLeft: bossData.turnLimit, round: 1,
      actorIndex: 0, turnActionsUsed: 0, turnActionsTotal: party[0]?.actionLimit || 1,
      actionNumber: 1, phase: 'battle', score: 0, totalDamage: 0,
      wonderLevelBonus,
      scoreBreakdown: dreamscapeRun ? {
        model: dreamscapePreview ? 'multidimensional_dreamscape_preview' : 'multidimensional_dreamscape_observed',
        evidenceStatus: dreamscapePreview ? 'damage_preview_only' : 'verified_result_formula',
        damagePreview: 0,
        turnWeightedDamagePoints: 0, turnScoreBuckets: [], foeDefensePoints: 0,
        foeDefensePointsRounding: 'The preview rounds cumulative turn-weighted damage once to derive Foe Defense Points. The observed game rounding convention remains unverified.',
        turnsSurvivedBonus: dreamscapePreview ? null : Number(bossData.turnsSurvivedBonus || 0),
        difficultyBonus: bossData.difficultyBonus || 1,
        observedSurvivalMultiplier: getObservedDreamscapeMultiplier(bossData.turnLimit),
        formulaEvidence: clone(multidimensionalDreamscapeEvidence.resultFormula)
      } : {
        baseRawDamage: 0, weakenedRawDamage: 0,
        baseDamagePoints: 0, weakenedDamagePoints: 0, bossAttackPoints: 0,
        difficultyBonus: bossData.difficultyBonus || 1
      },
      activePersonaId: this.config.personaIds[0] || personas[0].id,
      party,
      boss: {
        ...bossData, hp: bossData.maxHp, buffs: [], debuffs: [], phaseIndex: 0,
        berserkStacks: Number(bossData.berserkStacks || 0),
        ragnarokStacks: Number(bossData.ragnarokStacks ?? bossData.encounter?.initialRagnarokStacks ?? 0),
        modeId,
        ...(dreamscapeRun ? { scoreModel: dreamscapePreview ? 'multidimensional_dreamscape_preview' : 'multidimensional_dreamscape_observed', scoreEvidence: clone(multidimensionalDreamscapeEvidence) } : {}),
        lifeSustainment,
        hpLockDamage: Number(bossData.hpLockDamage || 0), breakPending: false,
        weakenedActive: false, weakenedPending: false, weakenedTurnsLeft: 0, breakTurn: null,
        downMax: bossData.downMax || 6, downPoints: bossData.downMax || 6, downed: false,
        summons, summonWave: 1, waveBonusTriggered: false,
        spawnOrdinal: 0, spawnedAttackTurn: 1, eligibleAttackTurn: 1, lastActedAttackTurn: 0,
        encounterState: { processedThresholdIds: [], spawnSerial: summons.length }
      },
      navigator: this.createNavigatorState(),
      log: [], history: [], lastEvents: [], result: null
    };
    if (this.usesEnemyTimeline()) this.initializeEnemyTimeline();
    this.initializeCharacterPassives();
    // A6 Wavecatcher begins at full SP because Aerial Tide restores her max SP
    // at battle start. That restoration also counts toward her cumulative
    // recovered-SP thresholds before the opening automatic follow-up.
    if (this.config.wavecatcherSourceMechanics) {
      for (const unit of this.state.party.filter(member => this.isWavecatcher(member) && member.awareness >= 6)) {
        this.recordWavecatcherRecovery(unit, unit.maxSp, 'a6_battle_start');
      }
    }
    this.syncPersonaPassiveEffects();
    this.initializeWonderWeaponEffects();
    initializeRegisteredCharacters(this);
    this.initializeCosmicYui();
    for (const unit of this.state.party.filter(member => this.isCosmicYui(member))) this.resolveCosmicAutomatic(unit);
    this.kotoneMechanics = createCharacterMechanics(KOTONE_SHIOMI_ID, this);
    this.kotoneMechanics.initialize();
    if (this.config.kotoneOwned === true) this.kotoneMechanics.refreshAuras();
    // After Kotone's setup, which rebuilds her Attack from her entered stats.
    this.applyMikuNavigatorShare();
    for (const unit of this.state.party) this.triggerNativityStrife(unit, 'battle start');
    this.emit('battle_start', `${this.state.boss.name} enters the score-attack field.`, { tone: 'system' });
    if (this.state.boss.encounter?.soulLink) {
      this.emit('mechanic', 'Soul Link is active. Slaughter Drive and all four Scarlet Turrets share one HP percentage.', { tone: 'phase' });
      this.emit('mechanic', this.isDreamscapePreview()
        ? 'Linked HP uses a provisional damage preview. Dreamscape HP and phase rules for this encounter are unverified.'
        : `Life Sustainment is ${this.state.boss.lifeSustainment ? 'ON. Every linked enemy stops at 1 HP.' : 'OFF. Linked HP can reach 0 and open the infinite HP Weakened phase.'}`, { tone: 'phase' });
    }
    if (this.state.boss.scoreModel === 'recorded_nightmare' && this.state.boss.modeId === 'nexus') {
      this.emit('mechanic', `Nexus HP lock: ${this.state.boss.hpLockDamage.toLocaleString()} credited pre-break damage, then 2 Weakened Attack Turns.`, { tone: 'phase' });
    }
    if (liveSurt) {
      this.emit('mechanic', 'Surt field effect: party Ice damage +20%, Attack +25%, and Resonance critical damage +25%.', { tone: 'phase' });
      this.emit('mechanic', this.hasDreamscapeGuardianOrMedic()
        ? 'Guardian or Medic active: foes deal 60% less final damage and take 20% more.'
        : 'No Guardian or Medic: foes deal 60% more final damage.', { tone: 'phase' });
      this.emit('mechanic', 'All combatants begin with 2 Ragnarok. At each Attack Turn end, every living combatant gains 2 more and enemy Shadows gain 1 Berserk.', { tone: 'phase' });
    }
    this.emit('round', `Attack Turn ${this.state.attackTurn} begins — ${this.state.attackTurnsLeft} remaining.`, { tone: 'turn' });
    if (this.usesEnemyTimeline()) this.startTimelinePartySlot(0);
    else this.beginActorTurn();
    if (this.state.party.some(unit => this.isCosmicYui(unit)) && this.allEnemiesDefeated()) this.finish('victory');
    this.recordFrame('Battle start');
    return this.getObservation();
  }

  createNavigatorState() {
    const definition = clone(this.navigatorDefinition);
    const loadout = loadoutForUnit(this.config.loadouts, definition);
    definition.awareness = resolveAwareness(definition, loadout);
    const stats = loadout.baseStats || {};
    const hasStat = key => stats[key] != null && String(stats[key]).trim() !== '' && Number.isFinite(Number(stats[key]));
    for (const key of ['maxHp', 'maxSp', 'attack', 'defense', 'speed', 'spRecovery']) {
      if (hasStat(key)) definition[key] = Number(stats[key]);
    }
    for (const key of ['ailmentAccuracy', 'ailmentResistance', 'damageReduction']) {
      if (hasStat(key)) definition[key] = Number(stats[key]) / 100;
    }
    const isMiku = definition.codename === 'MIKU';
    const cooldowns = Object.fromEntries(definition.skills.map(skill => [
      skill.id,
      isMiku && ['Feel the Beat', 'Clear Sound'].includes(skill.name) ? 4 : 0
    ]));
    return {
      ...definition,
      cooldowns,
      uses: 0,
      damageDone: 0,
      lastUsedAttackTurn: 0,
      ...(isMiku ? {
        tracks: [],
        currentSong: 'Heaven',
        songIndex: 0,
        openingCooldown: true,
        virtualConcert: {
          active: false,
          roundsRemaining: 0,
          damageByTarget: {},
          totalRecordedDamage: 0,
          savedTurn: null
        }
      } : {})
    };
  }

  get actor() { return this.state.party[this.state.actorIndex]; }
  get activePersona() { return byId(this.personaDefinitions, this.state.activePersonaId) || this.personaDefinitions[0]; }
  get enemies() { return [this.state.boss, ...this.state.boss.summons.filter(enemy => enemy.alive)]; }

  activePersonaPassive() {
    const persona = this.activePersona;
    if (!persona) return null;
    if (!Array.isArray(persona.passive)) return persona.passive || persona.maxRankPassive || null;
    return persona.maxRankPassive || [...persona.passive].sort((left, right) => Number(right.rankValue || 0) - Number(left.rankValue || 0)
      || Number(right.sourceIndex || 0) - Number(left.sourceIndex || 0))[0] || null;
  }

  clearPersonaPassiveEffects() {
    for (const unit of this.state.party) {
      unit.buffs = unit.buffs.filter(effect => effect.personaPassivePersistent !== true);
    }
  }

  syncPersonaPassiveEffects() {
    this.clearPersonaPassiveEffects();
    const wonder = this.state.party.find(unit => unit.id === 'wonder');
    const persona = this.activePersona;
    const passive = this.activePersonaPassive();
    if (!wonder || !persona || !passive) return;
    const supportedStats = new Set(['attack', 'defense', 'critRate', 'critDamage', 'healing', 'elementDamage']);
    for (const [index, effect] of (passive.combat?.effects || []).entries()) {
      if (effect.runtimeSupported !== true || effect.scope !== 'self' || effect.timing !== 'while_active'
        || !supportedStats.has(effect.stat) || !Number.isFinite(Number(effect.value))) continue;
      this.applyUnitBuff(wonder, {
        id: `persona_passive_${persona.id}_${effect.id || index}`,
        name: passive.name, stat: effect.stat, value: Number(effect.value), duration: null,
        ...(effect.element ? { element: effect.element } : {}),
        personaPassivePersistent: true, sourcePersonaId: persona.id, sourcePassiveName: passive.name
      }, 'persona_passive');
    }
    for (const limitation of passive.combat?.limitations || []) {
      const message = `${persona.name} passive ${passive.name}: ${limitation}`;
      if (!this.state.mechanicsLimitations.includes(message)) this.state.mechanicsLimitations.push(message);
    }
  }

  usesEnemyTimeline() {
    return this.state?.boss?.enemyTimingModel === 'anchored_enemy_turns';
  }

  resolveEnemyAnchor(anchor = this.state.boss.encounter?.initialEnemyAnchor) {
    if (this.state.party.some(unit => unit.id === anchor)) return anchor;
    if (anchor === 'before_first_party') return this.state.party[0]?.id || null;
    if (anchor === 'before_last_party') return this.state.party.at(-1)?.id || null;
    if (anchor && typeof anchor === 'object' && Number.isFinite(Number(anchor.partyIndex))) {
      return this.state.party[clamp(Number(anchor.partyIndex), 0, Math.max(0, this.state.party.length - 1))]?.id || null;
    }
    return null;
  }

  initializeEnemyTimeline() {
    const initialAnchor = this.resolveEnemyAnchor();
    this.state.enemyTimeline = { enabled: true, actedEnemyIds: [], spawnSerial: this.state.boss.summons.length };
    for (const enemy of [this.state.boss, ...this.state.boss.summons]) {
      if (!Object.hasOwn(enemy, 'actsBeforeActorId')) enemy.actsBeforeActorId = initialAnchor;
      enemy.spawnedAttackTurn = Number(enemy.spawnedAttackTurn || 1);
      enemy.eligibleAttackTurn = Number(enemy.eligibleAttackTurn || 1);
      enemy.lastActedAttackTurn = Number(enemy.lastActedAttackTurn || 0);
    }
  }

  getActionQueue() {
    if (!this.usesEnemyTimeline()) return null;
    if (this.isVirtualConcertActive()) {
      return this.state.party.map((unit, index) => ({
        actorType: 'party', actorId: unit.id, name: unit.codename, portrait: unit.portrait,
        alive: unit.hp > 0, done: index < this.state.actorIndex || unit.hp <= 0,
        current: index === this.state.actorIndex && unit.hp > 0 && this.state.phase === 'battle', pending: false
      }));
    }
    const enemies = [this.state.boss, ...this.state.boss.summons]
      .filter(enemy => enemy.alive !== false)
      .sort((left, right) => Number(left.spawnOrdinal || 0) - Number(right.spawnOrdinal || 0));
    const queue = [];
    const pushEnemy = enemy => queue.push({
      actorType: 'enemy', actorId: enemy.id, name: enemy.name, portrait: enemy.id === this.state.boss.id ? 'Ω' : '♟',
      alive: enemy.alive !== false, done: enemy.lastActedAttackTurn === this.state.attackTurn,
      current: false, pending: enemy.eligibleAttackTurn > this.state.attackTurn,
      actsBeforeActorId: enemy.actsBeforeActorId || null
    });
    for (const [index, unit] of this.state.party.entries()) {
      enemies.filter(enemy => enemy.actsBeforeActorId === unit.id).forEach(pushEnemy);
      queue.push({
        actorType: 'party', actorId: unit.id, name: unit.codename, portrait: unit.portrait,
        alive: unit.hp > 0, done: index < this.state.actorIndex || unit.hp <= 0,
        current: index === this.state.actorIndex && unit.hp > 0 && this.state.phase === 'battle', pending: false
      });
    }
    enemies.filter(enemy => !enemy.actsBeforeActorId || !this.state.party.some(unit => unit.id === enemy.actsBeforeActorId)).forEach(pushEnemy);
    return queue;
  }

  spCap(unit) {
    return unit.maxSp * (unit.spCapMultiplier || 1);
  }

  validJcMasks(masks) {
    const valid = [...new Set(masks)].filter(mask => defaultJcMasks.includes(mask) || ['service', 'luck'].includes(mask));
    return valid.length === 2 ? valid : [...defaultJcMasks];
  }


  usesLiveMechanics() { return this.config.mechanicsProfile === CURRENT_MECHANICS_PROFILE; }

  isDreamscapeRun() { return this.usesLiveMechanics() && this.state.boss.modeId === 'multidimensional'; }

  isDreamscapePreview() { return this.isDreamscapeRun() && this.state.boss.dreamscapeScoreVerified !== true; }

  isDreamscapeTurnWeightedMode() {
    return this.usesLiveMechanics()
      && ['multidimensional', 'nexus', 'devourer'].includes(this.state.boss.modeId);
  }

  usesSourceScaleDamageFormula() {
    return this.usesLiveMechanics()
      && this.state.boss.scoreAttack === true
      && ['multidimensional', 'nexus', 'devourer'].includes(this.state.boss.modeId);
  }

  isHachimanDreamscape() {
    return this.usesLiveMechanics()
      && this.state.boss.id === 'hachiman'
      && this.state.boss.modeId === 'multidimensional';
  }

  // Hachiman's kit and damage rules apply in Multidimensional Dreamscape and in
  // Devourer of Dreams (user-supplied DOD rules, 2026-09-09); only the score
  // model differs between the two modes.
  isHachimanLive() {
    return this.usesLiveMechanics()
      && this.state.boss.id === 'hachiman'
      && ['multidimensional', 'devourer'].includes(this.state.boss.modeId);
  }

  isHachimanDevourer() {
    return this.isHachimanLive() && this.state.boss.modeId === 'devourer';
  }

  isSurtLive() {
    return this.usesLiveMechanics()
      && this.state.boss.id === 'surt'
      && ['multidimensional', 'nexus', 'devourer'].includes(this.state.boss.modeId);
  }

  canUseDreamscapeItems() {
    return this.usesSourceScaleDamageFormula() && this.state.itemMaxUses > 0;
  }

  hasDreamscapeGuardianOrMedic() {
    return (this.isHachimanLive() || this.isSurtLive())
      && (this.config.dreamscapeObservedCompositionEffect
        || this.state.party.some(unit => ['Guardian', 'Medic'].includes(unit.combatRole || unit.role)));
  }

  dreamscapeDamageTakenMultiplier(target) {
    if (this.isHachimanLive() || this.isSurtLive()) return this.hasDreamscapeGuardianOrMedic() ? 1.2 : 1;
    return Number(target.finalDamageTakenMultiplier ?? 1);
  }

  dreamscapeDamageDealtMultiplier(enemy) {
    if (this.isHachimanLive()) return this.hasDreamscapeGuardianOrMedic() ? 0.4 : 1.6;
    if (this.isSurtLive()) {
      const compositionMultiplier = this.hasDreamscapeGuardianOrMedic() ? 0.4 : 1.6;
      return compositionMultiplier * (1 + Number(enemy.ragnarokStacks || 0) * 0.05);
    }
    return Number(enemy.finalDamageDealtMultiplier ?? 1);
  }

  advanceSurtEncounterStacks() {
    if (!this.isSurtLive()) return;
    const encounter = this.state.boss.encounter || {};
    const berserkGain = Number(encounter.berserkStacksPerTurn || 1);
    const berserkCap = Number(encounter.berserkStackCap || 3);
    const ragnarokGain = Number(encounter.ragnarokStacksPerTurn || 2);
    const ragnarokCap = Number(encounter.ragnarokStackCap || 10);
    for (const enemy of this.enemies) {
      enemy.berserkStacks = clamp(Number(enemy.berserkStacks || 0) + berserkGain, 0, berserkCap);
      enemy.ragnarokStacks = clamp(Number(enemy.ragnarokStacks || 0) + ragnarokGain, 0, ragnarokCap);
    }
    for (const unit of this.state.party.filter(member => member.hp > 0)) {
      unit.ragnarokStacks = clamp(Number(unit.ragnarokStacks || 0) + ragnarokGain, 0, ragnarokCap);
    }
    this.emit('mechanic', `Surt's Shadows reached Berserk ${this.state.boss.berserkStacks}/${berserkCap} and Ragnarok ${this.state.boss.ragnarokStacks}/${ragnarokCap}.`, {
      actorId: this.state.boss.id, sourceType: 'encounter', tone: 'boss'
    });
  }

  // Mode Special Effects that raise damage dealt, from boss modeEffects.
  stageDamageBonuses(unit, element) {
    if (!this.usesLiveMechanics()) return [];
    const effects = this.state.boss.modeEffects?.[this.state.boss.modeId];
    if (!effects) return [];
    const bonuses = [];
    if (Number(effects.elementDamage?.[element])) bonuses.push([`stage_${element}_damage`, Number(effects.elementDamage[element])]);
    if (unit.role && Number(effects.roleDamage?.[unit.role])) bonuses.push([`stage_${unit.role.toLowerCase()}_damage`, Number(effects.roleDamage[unit.role])]);
    return bonuses;
  }

  isDreamscapeScoreEligibleTarget(target) {
    return !this.isHachimanLive()
      || (target?.species !== 'daisoujou' && target?.id !== 'daisoujou');
  }

  // Skill/Resonance crit conversion: final damage x (1 + min(crit, 100%) x
  // (crit damage - 100%)) with no crit roll. User-confirmed for every boss in
  // the live profile (2026-09-27); recorded replays keep ordinary crit rolls.
  usesStableDomainCritConversion(actor, sourceType) {
    return this.usesLiveMechanics()
      && (['character_skill', 'persona_skill', 'berry_repeat', 'resonance_follow_up'].includes(sourceType)
        || (sourceType === 'awareness_follow_up' && this.isJc(actor)));
  }

  usesDreamscapeSkillCritBonus(actor, sourceType) {
    return this.usesStableDomainCritConversion(actor, sourceType);
  }

  surtAttackBonus() {
    return this.isSurtLive() ? Number(this.state.boss.encounter?.partyAttackBonus || 0) : 0;
  }

  surtResonanceCritDamageBonus(sourceType) {
    return this.isSurtLive() && sourceType === 'resonance_follow_up'
      ? Number(this.state.boss.encounter?.resonanceCritDamageBonus || 0)
      : 0;
  }

  reportCombatLimitation(system, missing, context = {}) {
    const key = `${system}:${context.skillId || context.statusId || ''}:${missing.join(',')}`;
    if (this.state.sharedCombat.limitations.some(item => item.key === key)) return;
    const limitation = { key, system, missing: [...missing], ...context };
    this.state.sharedCombat.limitations.push(limitation);
    const message = `${system} is not resolved: missing ${missing.join(', ')}. No effect is invented.`;
    this.state.mechanicsLimitations.push(message);
    this.emit('unmodeled_mechanic', message, { ...limitation, tone: 'system' });
  }

  // Miku navigating shares 20% of her panel stats with every ally, and her
  // Integrity & Labor 4-set then multiplies party HP, Attack and Defense by
  // 1.08: (panel + share) x 1.08 reconciled Berry's in-battle HP and Defense
  // within 1% on 2026-09-06. Recorded Hachiman routes add their own share.
  applyMikuNavigatorShare() {
    if (!this.usesLiveMechanics() || this.navigatorDefinition?.codename !== 'MIKU') return;
    const loadouts = Object.values(this.config.loadouts || {});
    if (loadouts.some(loadout => loadout?.navigatorShareApplied || loadout?.panelIncludesShareAndSetEffects)) return;
    const navigatorLoadout = loadoutForUnit(this.config.loadouts, this.navigatorDefinition) || {};
    const stats = navigatorLoadout.baseStats || {};
    const value = key => Number.isFinite(Number(stats[key])) ? Number(stats[key]) : 0;
    const share = {
      maxHp: Math.round(value('maxHp') * 0.2), attack: value('attack') * 0.2, defense: value('defense') * 0.2,
      crit: value('critRate') * 0.002, critMult: value('critMult') * 0.002,
      pierceRate: value('pierceRate') * 0.002, damageBonus: value('damageBonus') * 0.002
    };
    const labor = Number(navigatorLoadout.partyStatMultiplier || 0);
    if (!share.maxHp && !share.attack && !share.defense && !labor) return;
    for (const ally of this.state.party) {
      // Labor scales the level-80 base plus weapon when known, like other
      // % buffs; otherwise it multiplies the stat (2026-09-06 reading).
      const base = ally.statBase;
      const scaled = (value, add, key) => base?.[key] > 0
        ? Number(value || 0) + add + base[key] * labor
        : (Number(value || 0) + add) * (1 + labor);
      ally.maxHp = Math.round(scaled(ally.maxHp, share.maxHp, 'maxHp'));
      ally.hp = ally.maxHp;
      if (Number.isFinite(Number(ally.mechanicMaxHp))) ally.mechanicMaxHp = Math.round(scaled(ally.mechanicMaxHp, share.maxHp, 'maxHp'));
      ally.attack = scaled(ally.attack, share.attack, 'attack');
      if (Number.isFinite(Number(ally.mechanicAttack))) ally.mechanicAttack = scaled(ally.mechanicAttack, share.attack, 'attack');
      ally.defense = scaled(ally.defense, share.defense, 'defense');
      ally.crit = Number(ally.crit || 0) + share.crit;
      ally.critMult = Number(ally.critMult ?? 1.5) + share.critMult;
      ally.pierceRate = Number(ally.pierceRate || 0) + share.pierceRate;
      ally.damageBonus = Number(ally.damageBonus || 0) + share.damageBonus;
      ally.navigatorShare = { ...share, labor };
    }
    this.emit('mechanic', `MIKU navigator share: +${share.maxHp} HP, +${Math.round(share.attack)} Attack, +${Math.round(share.defense)} Defense, +${(share.crit * 100).toFixed(1)}% crit, +${(share.critMult * 100).toFixed(1)}% crit mult${labor ? `, then Labor +${Math.round(labor * 100)}% HP/Attack/Defense` : ''}.`, { sourceType: 'navigator', tone: 'buff' });
  }

  // Attack with Attack % buffs: on the level-80 base plus weapon when known,
  // otherwise on the whole Attack value (older model).
  buffedAttack(actor, attackBuff = 0, flatAttack = 0) {
    const base = Number(actor?.statBase?.attack);
    return base > 0
      ? Number(actor.attack || 0) + base * attackBuff + flatAttack
      : Number(actor?.attack || 0) * (1 + attackBuff) + flatAttack;
  }

  wonderWeaponHolder() {
    return this.state?.party?.find(unit => unit.id === 'wonder' && unit.wonderWeapon) || null;
  }

  initializeWonderWeaponEffects() {
    const holder = this.wonderWeaponHolder();
    if (!holder) return;
    const startingPersona = byId(this.personaDefinitions, this.state.activePersonaId);
    const start = wonderWeaponBattleStart(createWonderWeaponEffectState(holder.wonderWeapon.weaponId), {
      partyIds: this.state.party.map(unit => unit.id),
      startingPersonaElement: startingPersona?.element || null
    });
    holder.wonderWeapon.effectState = clone(start.state);
    holder.wonderWeapon.startingPersonaElement = startingPersona?.element || null;
    this.syncWonderWeaponStaticEffects();
    const limitation = WONDER_WEAPON_EFFECT_LIMITATIONS[holder.wonderWeapon.weaponId];
    if (limitation) {
      const message = `${holder.wonderWeapon.forge.name}: ${limitation}`;
      this.state.mechanicsLimitations.push(message);
      this.emit('unmodeled_mechanic', message, {
        actorId: holder.id, weaponId: holder.wonderWeapon.weaponId,
        sourceType: 'wonder_weapon', tone: 'system'
      });
    }
  }

  clearWonderWeaponPersistentEffects(weaponId) {
    for (const unit of this.state.party) {
      unit.buffs = unit.buffs.filter(effect => !(effect.wonderWeaponPersistent && effect.sourceWeaponId === weaponId));
    }
    for (const enemy of this.enemies) {
      enemy.debuffs = enemy.debuffs.filter(effect => !(effect.wonderWeaponPersistent && effect.sourceWeaponId === weaponId));
    }
  }

  applyWonderWeaponPersistentBuff(unit, weaponId, id, stat, value, extra = {}) {
    if (!unit || !Number.isFinite(Number(value)) || Number(value) === 0) return null;
    return this.applyUnitBuff(unit, {
      id: `wonder_weapon_${weaponId}_${id}`, name: id.replaceAll('_', ' ').toUpperCase(),
      stat, value: Number(value), duration: null, wonderWeaponPersistent: true,
      sourceWeaponId: weaponId, ...extra
    }, 'wonder_weapon');
  }

  applyWonderWeaponPersistentDebuff(enemy, weaponId, id, stat, value, extra = {}) {
    if (!enemy || !Number.isFinite(Number(value)) || Number(value) === 0) return null;
    return this.applyEnemyStatus(enemy, 'debuffs', {
      id: `wonder_weapon_${weaponId}_${id}`, name: id.replaceAll('_', ' ').toUpperCase(),
      stat, value: Number(value), duration: null, wonderWeaponPersistent: true,
      sourceWeaponId: weaponId, ...extra
    }, 'wonder_weapon', 'wonder');
  }

  syncWonderWeaponStaticEffects() {
    const holder = this.wonderWeaponHolder();
    if (!holder?.wonderWeapon?.effectState) return;
    const weaponId = holder.wonderWeapon.weaponId;
    const effectState = holder.wonderWeapon.effectState;
    this.clearWonderWeaponPersistentEffects(weaponId);
    // Equipped character-detail totals already include the weapon's static
    // Attack passive, as for the J&C and Wavecatcher signature weapons.
    const holderBuff = (id, stat, value, extra) => (id === 'attack' && stat === 'attack' && holder.statsMode === 'equipped')
      ? null
      : this.applyWonderWeaponPersistentBuff(holder, weaponId, id, stat, value, extra);
    const partyBuff = (id, stat, value, extra) => {
      for (const unit of this.state.party) this.applyWonderWeaponPersistentBuff(unit, weaponId, id, stat, value, extra);
    };
    const otherPartyBuff = (id, stat, value, extra) => {
      for (const unit of this.state.party.filter(unit => unit.id !== holder.id)) this.applyWonderWeaponPersistentBuff(unit, weaponId, id, stat, value, extra);
    };
    const foeDebuff = (id, stat, value, extra) => {
      for (const enemy of this.enemies.filter(enemy => enemy.alive !== false)) this.applyWonderWeaponPersistentDebuff(enemy, weaponId, id, stat, value, extra);
    };
    const personaCount = this.config.personaIds.filter(id => byId(this.personaDefinitions, id)).length;
    const personaAttributeCount = Math.min(3, new Set(this.config.personaIds
      .map(id => byId(this.personaDefinitions, id)?.element).filter(Boolean)).size);

    switch (weaponId) {
      case 'damascus-knife': holderBuff('attack', 'attack', 0.215); break;
      case 'fatal-knife': holderBuff('attack_per_persona', 'attack', 0.095 * personaCount); break;
      case 'midnight-sun': holderBuff('attack', 'attack', 0.24); break;
      case 'sennight-inferno':
        holderBuff('attack', 'attack', 0.56);
        holderBuff('persona_attribute_damage', 'damage', 0.12 * personaAttributeCount);
        break;
      case 'all-in':
        holderBuff('healing', 'healing', 0.4);
        holderBuff('shield', 'shieldPotency', 0.4);
        partyBuff('defense_aura', 'defense', 0.3);
        break;
      case 'arc-knife':
        holderBuff('attack', 'attack', 0.56);
        holderBuff('elemental_ailment_accuracy', 'elementalAilmentAccuracy', 0.3);
        break;
      case 'ex-machina': {
        holderBuff('attack', 'attack', 0.56);
        partyBuff('flat_attack_aura', 'flatAttack', 240);
        const element = holder.wonderWeapon.startingPersonaElement;
        if (element) {
          holderBuff('starting_element_damage', 'elementDamage', 0.34, { element });
          otherPartyBuff('starting_element_damage_share', 'elementDamage', 0.136, { element });
        }
        break;
      }
      case 'glimmer':
        holderBuff('attack', 'attack', 0.56);
        holderBuff('bless_damage', 'elementDamage', 0.22, { element: 'bless' });
        holderBuff('healing', 'healing', 0.22);
        break;
      case 'eye-of-obsequies': holderBuff('attack', 'attack', 0.56); break;
      case 'starry-compass':
        holderBuff('attack', 'attack', 0.56);
        if (effectState.guidance >= 5) foeDebuff('guidance_defense', 'defenseDown', 0.22);
        if (effectState.guidance >= 10) partyBuff('guidance_ailment_accuracy', 'ailmentAccuracy', 0.18);
        if (effectState.guidance >= 15) partyBuff('guidance_psychic_damage', 'elementDamage', 0.22, { element: 'psychic' });
        break;
      case 'abyss-fang': {
        holderBuff('attack', 'attack', 0.56);
        const stacks = Number(effectState.hunterInstinct || 0);
        if (stacks > 0) holderBuff('hunter_damage', 'damage', 0.066 * stacks);
        if (stacks >= 5) {
          holderBuff('hunter_crit_rate', 'critRate', 0.18);
          holderBuff('hunter_crit_damage', 'critDamage', 0.36);
        } else if (stacks >= 3) {
          holderBuff('hunter_crit_rate', 'critRate', 0.12);
          holderBuff('hunter_crit_damage', 'critDamage', 0.24);
        }
        break;
      }
      case 'purgatory':
        holderBuff('attack', 'attack', 0.607);
        if (effectState.trialByFire >= 1) {
          holderBuff('trial_holder_attack', 'flatAttack', 360);
          otherPartyBuff('trial_party_attack', 'flatAttack', 300);
        }
        if (effectState.trialByFire >= 2) {
          holderBuff('trial_holder_damage', 'damage', 0.16);
          otherPartyBuff('trial_party_damage', 'damage', 0.06);
        }
        if (effectState.trialByFire >= 3) partyBuff('trial_fire_damage', 'elementDamage', 0.24, { element: 'fire' });
        break;
      case 'plasma-blade': holderBuff('attack', 'attack', 0.607); break;
      case 'pheromone-sting':
        holderBuff('ailment_accuracy', 'ailmentAccuracy', 0.68);
        holderBuff('ailment_chance', 'ailmentChance', 0.25, { ailmentKinds: ['elemental', 'spiritual'] });
        break;
      case 'cyclotron':
        holderBuff('attack', 'attack', 0.56);
        holderBuff('critical_rate', 'critRate', 0.19);
        break;
      case CURSED_TIES_WEAPON_ID: holderBuff('ailment_accuracy', 'ailmentAccuracy', 0.68); break;
      case 'ice-age':
        holderBuff('attack', 'attack', 0.56);
        if (this.state.party.some(unit => unit.buffs.some(effect => effect.sourceWeaponId === 'ice-age' && effect.id.includes('ice-age-ancient-frost')))) {
          holderBuff('ancient_frost_holder_damage', 'damage', 0.35);
        }
        break;
      case 'event-horizon': {
        holderBuff('attack', 'attack', 0.56);
        const stacksByUnit = effectState.spaghettificationStacks || {};
        const affected = this.state.party.filter(unit => Number(stacksByUnit[unit.id] || 0) > 0);
        holderBuff('affected_ally_attack', 'flatAttack', 100 * affected.length);
        for (const unit of affected) {
          const stacks = Math.min(2, Number(stacksByUnit[unit.id] || 0));
          this.applyWonderWeaponPersistentBuff(unit, weaponId, 'spaghettification_attack', 'attack', 0.11 * stacks);
          this.applyWonderWeaponPersistentBuff(unit, weaponId, 'spaghettification_nuclear_crit', 'elementCritDamage', 0.1 * stacks, { element: 'nuclear' });
        }
        break;
      }
      default: break;
    }
  }

  applyWonderWeaponTimedEffects(effects) {
    const holder = this.wonderWeaponHolder();
    if (!holder) return;
    for (const descriptor of effects || []) {
      const duration = descriptor.duration;
      const changes = descriptor.changes || {};
      const unitTargets = descriptor.target === 'all_allies' ? this.state.party
        : descriptor.target === 'holder' ? [holder]
          : [byId(this.state.party, descriptor.target)].filter(Boolean);
      const enemyTargets = descriptor.target === 'all_foes' ? this.enemies
        : [this.findEnemy(descriptor.target)].filter(Boolean);
      const addUnit = (stat, value, suffix, extra = {}) => {
        for (const unit of unitTargets) this.applyUnitBuff(unit, {
          id: `wonder_weapon_${holder.wonderWeapon.weaponId}_${descriptor.id}_${suffix}`,
          name: suffix.replaceAll('_', ' ').toUpperCase(), stat, value, duration,
          sourceWeaponId: holder.wonderWeapon.weaponId, ...extra
        }, 'wonder_weapon');
      };
      if (changes.additionalAttackBonus) addUnit('attack', changes.additionalAttackBonus * (changes.doubled ? 2 : 1), 'persona_change_attack');
      if (changes.damageBonus) addUnit('damage', changes.damageBonus, 'timed_damage');
      if (changes.iceDamageBonus) addUnit('elementDamage', changes.iceDamageBonus, 'ancient_frost_ice', { element: 'ice' });
      if (changes.electricCriticalDamageBonus) addUnit('elementCritDamage', changes.electricCriticalDamageBonus, 'magnetized_electric_crit', { element: 'electric' });
      if (changes.maxHpRecovery) {
        for (const unit of unitTargets) this.healUnit(holder, unit, unit.maxHp * changes.maxHpRecovery);
      }
      if (changes.defenseDown) {
        for (const enemy of enemyTargets) this.applyEnemyStatus(enemy, 'debuffs', {
          id: `wonder_weapon_${holder.wonderWeapon.weaponId}_${descriptor.id}_defense`,
          name: descriptor.id.replaceAll('-', ' ').toUpperCase(), stat: 'defenseDown',
          value: changes.defenseDown, duration, sourceWeaponId: holder.wonderWeapon.weaponId
        }, 'wonder_weapon', holder.id);
      }
    }
  }

  isWonderWeaponSkillDamage(sourceType) {
    return ['persona_skill', 'character_skill', 'highlight', 'resonance_follow_up', 'awareness_follow_up', 'berry_repeat'].includes(sourceType);
  }

  resolveWonderWeaponDamagePacket(actor, skill, target, actualDamage, sourceType) {
    const holder = this.wonderWeaponHolder();
    if (!holder || !(actualDamage > 0)) return;
    const weaponId = holder.wonderWeapon.weaponId;
    if (!['starry-compass', 'abyss-fang', 'purgatory', 'cyclotron', 'event-horizon'].includes(weaponId)) return;
    const transition = wonderWeaponOnDamage(holder.wonderWeapon.effectState, {
      actorId: actor.id, holderId: holder.id, actorSide: 'ally', targetId: target.id,
      element: skill.element, isSkillDamage: this.isWonderWeaponSkillDamage(sourceType),
      partyIds: this.state.party.map(unit => unit.id)
    });
    holder.wonderWeapon.effectState = clone(transition.state);
    this.applyWonderWeaponTimedEffects(transition.effects);
    this.syncWonderWeaponStaticEffects();
  }

  resolveWonderWeaponPersonaChange() {
    const holder = this.wonderWeaponHolder();
    if (!holder || holder.wonderWeapon.weaponId !== 'midnight-sun') return;
    const transition = wonderWeaponOnPersonaChange(holder.wonderWeapon.effectState);
    holder.wonderWeapon.effectState = clone(transition.state);
    this.applyWonderWeaponTimedEffects(transition.effects);
  }

  resolveWonderWeaponKnockdown(target) {
    const holder = this.wonderWeaponHolder();
    if (!holder || holder.wonderWeapon.weaponId !== 'sennight-inferno') return;
    const transition = wonderWeaponOnKnockdown(holder.wonderWeapon.effectState, { targetId: target.id });
    holder.wonderWeapon.effectState = clone(transition.state);
    this.applyWonderWeaponTimedEffects(transition.effects);
  }

  resolveWonderWeaponAllyTarget(actor, skill, targetId) {
    const holder = this.wonderWeaponHolder();
    if (!holder || actor.id !== holder.id || !['all-in', 'ice-age'].includes(holder.wonderWeapon.weaponId)) return;
    const targetType = skill.buffTarget || skill.healTarget || skill.target;
    if (targetType !== 'ally') return;
    const target = byId(this.state.party, targetId);
    if (!target || target.hp <= 0) return;
    const transition = wonderWeaponOnSkillTargetAlly(holder.wonderWeapon.effectState, {
      actorId: actor.id, holderId: holder.id, targetId: target.id
    });
    holder.wonderWeapon.effectState = clone(transition.state);
    this.applyWonderWeaponTimedEffects(transition.effects);
    this.syncWonderWeaponStaticEffects();
  }

  resolveWonderWeaponTurnEnd(actor) {
    const holder = this.wonderWeaponHolder();
    if (!holder?.wonderWeapon?.effectState) return;
    const transition = wonderWeaponOnTurnEnd(holder.wonderWeapon.effectState, {
      actorId: actor.id,
      holderId: holder.id
    });
    holder.wonderWeapon.effectState = clone(transition.state);
    this.syncWonderWeaponStaticEffects();
  }

  cursedTiesHolder() {
    if (!this.usesLiveMechanics()) return null;
    const wonder = this.state.party.find(unit => unit.id === 'wonder' && unit.hp > 0);
    return wonder?.wonderWeapon?.weaponId === CURSED_TIES_WEAPON_ID ? wonder : null;
  }

  cursedTiesAttackBonus(actor, target) {
    const holder = this.cursedTiesHolder();
    if (!holder || actor?.id !== holder.id) return 0;
    const evilEye = holder.wonderWeapon.forge.evilEye;
    return target?.debuffs?.some(effect => effect.id === evilEye.id)
      ? Number(holder.wonderWeapon.forge.holderAttackAgainstEvilEye || 0) : 0;
  }

  applyCursedTiesEvilEye(target, triggeringActorId, triggerRule) {
    const holder = this.cursedTiesHolder();
    if (!holder || !target || target.alive === false) return false;
    const { forge } = holder.wonderWeapon;
    const { evilEye, trigger } = forge;
    const existing = target.debuffs.find(effect => effect.id === evilEye.id);
    if (existing) {
      // The tooltip gives the initial duration but does not establish whether
      // another proc refreshes it. Preserve the visible status unchanged.
      this.reportCombatLimitation('Cursed Ties Evil Eye', ['reapplication and refresh rule'], {
        statusId: evilEye.id, actorId: holder.id, targetId: target.id
      });
      return false;
    }
    // Use the stated chance directly and keep the seeded battle RNG
    // reproducible. Ailment Accuracy's interaction with this listed chance is
    // deliberately not inferred.
    if (this.random() >= trigger.chance) return false;
    const status = this.applyEnemyStatus(target, 'debuffs', {
      id: evilEye.id,
      name: evilEye.name,
      stat: 'defenseDown',
      value: evilEye.defenseDown,
      elementDamageTaken: 'curse',
      elementDamageTakenValue: evilEye.curseDamageTaken,
      duration: evilEye.duration,
      sourceWeaponId: holder.wonderWeapon.weaponId,
      sourceWeaponProfileId: holder.wonderWeapon.profileId,
      triggerRule
    }, 'wonder_weapon', holder.id);
    if (!status) return false;
    this.emit('debuff', `${target.name} was afflicted with Evil Eye. Defense -${(evilEye.defenseDown * 100).toFixed(1)}%; Curse damage taken +${(evilEye.curseDamageTaken * 100).toFixed(1)}% for ${evilEye.duration} turns.`, {
      actorId: holder.id, targetId: target.id, status: clone(status), sourceType: 'wonder_weapon', tone: 'debuff',
      triggeringActorId
    });
    return true;
  }

  recordCursedTiesCurseDamage(actor, target, element, amount, candidates) {
    const holder = this.cursedTiesHolder();
    if (!holder || element !== 'curse' || amount <= 0) return;
    if (actor.id === holder.id) {
      this.reportCombatLimitation('Cursed Ties Evil Eye', ['whether the holder qualifies as an ally trigger'], {
        statusId: holder.wonderWeapon.forge.evilEye.id, actorId: holder.id, targetId: target?.id
      });
      return;
    }
    const policy = holder.wonderWeapon.procGranularity;
    if (!policy) {
      this.reportCombatLimitation('Cursed Ties Evil Eye', ['proc granularity (per-hit or per-cast)'], {
        statusId: holder.wonderWeapon.forge.evilEye.id, actorId: holder.id, targetId: target?.id
      });
      return;
    }
    if (policy === 'per-hit') {
      this.applyCursedTiesEvilEye(target, actor.id, 'per-hit');
      return;
    }
    candidates.set(target.id, target);
  }

  resolveCursedTiesCastProc(actor, candidates) {
    const holder = this.cursedTiesHolder();
    if (!holder || holder.wonderWeapon.procGranularity !== 'per-cast' || !candidates.size) return;
    if (candidates.size !== 1) {
      this.reportCombatLimitation('Cursed Ties Evil Eye', ['multi-target per-cast target rule'], {
        statusId: holder.wonderWeapon.forge.evilEye.id, actorId: holder.id
      });
      return;
    }
    this.applyCursedTiesEvilEye([...candidates.values()][0], actor.id, 'per-cast');
  }

  applyContinuousDamage(actor, target, definition, sourceType = 'character_skill') {
    if (!this.usesLiveMechanics() || !actor || !target || target.alive === false) return null;
    const missing = [];
    if (!definition?.id) missing.push('status id');
    if (!definition?.sourceUrl) missing.push('source');
    if (!(Number.isFinite(definition?.power) && definition.power > 0) && !(Number.isFinite(definition?.powerPerStack) && definition.powerPerStack > 0)) missing.push('damage coefficient');
    if (!Number.isInteger(definition?.duration) || definition.duration <= 0) missing.push('duration');
    if (definition?.timing !== 'target_turn_end') missing.push('supported tick timing');
    if (!['replace', 'refresh', 'add'].includes(definition?.stacking)) missing.push('stack and refresh rule');
    if (typeof definition?.canCrit !== 'boolean') missing.push('critical rule');
    if (definition?.stacking === 'add' && (!Number.isInteger(definition.maxStacks) || definition.maxStacks < 1)) missing.push('stack cap');
    if (definition?.stacking === 'add' && (!Number.isInteger(definition.stacks) || definition.stacks < 1)) missing.push('stacks per application');
    if (missing.length) {
      this.reportCombatLimitation('DoT', missing, { statusId: definition?.id, actorId: actor.id, targetId: target.id });
      return null;
    }
    const existing = target.debuffs.find(effect => effect.id === definition.id && effect.sourceActorId === actor.id);
    const requestedStacks = Number.isInteger(definition.stacks) && definition.stacks > 0 ? definition.stacks : 1;
    const stacks = definition.stacking === 'add'
      ? Math.min(definition.maxStacks, (existing?.stacks || 0) + requestedStacks)
      : definition.stacking === 'refresh' && existing ? existing.stacks : requestedStacks;
    const status = { ...clone(definition), stacks, continuousDamage: true, sharedDot: true,
      sourceActorId: actor.id, ownerId: target.id, durationKnown: true, durationClock: 'owner_action' };
    // Separate owners may apply identically named DoTs without overwriting each other.
    if (existing) Object.assign(existing, status, { sourceType });
    else target.debuffs.push({ ...status, sourceType });
    this.emit('dot_applied', `${status.name || status.id} applied with ${stacks} stack(s).`, {
      actorId: actor.id, targetId: target.id, status: clone(status), sourceType, tone: 'debuff'
    });
    return status;
  }

  technicalOutcome(actor, skill, target, sourceType) {
    if (!this.usesLiveMechanics() || sourceType === 'dot') return null;
    if (!skill.technical) {
      if (/\bTechnical\b/.test(skill.description || skill.note || '')) this.reportCombatLimitation('Technical', ['activation and damage rules'], { skillId: skill.id });
      return null;
    }
    const rule = skill.technical;
    const missing = [];
    if (!rule.sourceUrl) missing.push('source');
    if (!Array.isArray(rule.ailmentIds) || !rule.ailmentIds.length) missing.push('ailment compatibility');
    const deterministicActivation = rule.activation === 'compatible_ailment';
    if (!deterministicActivation && (!Number.isFinite(rule.chance) || rule.chance < 0 || rule.chance > 1)) missing.push('activation rule');
    if (!Number.isFinite(rule.damageMultiplier) || rule.damageMultiplier <= 0) missing.push('damage multiplier');
    const precision = Number(actor.technicalPrecision || 0)
      + actor.buffs.filter(effect => effect.stat === 'technicalPrecision').reduce((sum, effect) => sum + effect.value, 0);
    if (precision && !Number.isFinite(rule.chancePerPrecision)) missing.push('Technical Precision scaling');
    if (missing.length) {
      this.reportCombatLimitation('Technical', missing, { skillId: skill.id, actorId: actor.id, targetId: target.id });
      return null;
    }
    const ailment = target.debuffs.find(effect => rule.ailmentIds.includes(effect.id));
    if (!ailment) return null;
    const chance = deterministicActivation ? 1 : clamp(rule.chance + precision * (rule.chancePerPrecision || 0), 0, 1);
    const activated = deterministicActivation || chance === 1 || (chance > 0 && this.random() < chance);
    return { activated, ailmentId: ailment.id, damageMultiplier: activated ? rule.damageMultiplier : 1,
      consumeAilment: activated && rule.consumeAilment === true, canCrit: rule.canCrit, sourceUrl: rule.sourceUrl };
  }

  queueDownActions(actor, target, sourceType) {
    if (!this.usesLiveMechanics() || actor?.id !== this.actor?.id || !['character_skill', 'persona_skill', 'basic_attack', 'gun'].includes(sourceType)) return;
    for (const [type, trigger] of [['one_more', 'enemy_downed'], ['all_out_attack', 'all_living_enemies_downed']]) {
      if (type === 'all_out_attack' && !this.enemies.every(enemy => enemy.downed)) continue;
      const rule = this.config.sharedMechanics[type];
      const missing = [];
      if (!rule?.sourceUrl) missing.push('source');
      if (rule?.trigger !== trigger) missing.push('trigger');
      if (rule?.timing !== 'after_counted_action') missing.push('action timing');
      if (rule?.consumesCountedAction !== false) missing.push('supported action-count rule');
      if (rule?.damageActor !== 'triggering_actor') missing.push('supported damage owner');
      if (typeof rule?.grantsHighlight !== 'boolean') missing.push('Highlight gain rule');
      if (!Number.isInteger(rule?.maxPerOwnerTurn) || rule.maxPerOwnerTurn < 1) missing.push('owner-turn limit');
      if (!(Number.isFinite(rule?.skill?.power) && rule.skill.power > 0)) missing.push('damage coefficient');
      if (!['boss', 'all_enemies'].includes(rule?.skill?.target)) missing.push('target rule');
      if (!rule?.skill?.element || !['attack', 'maxHp'].includes(rule?.skill?.scalingStat)) missing.push('damage element and scaling stat');
      if (!Number.isFinite(rule?.skill?.cost) || rule.skill.cost < 0) missing.push('SP cost');
      if (typeof rule?.skill?.canCrit !== 'boolean') missing.push('critical rule');
      if (typeof rule?.consumeDown !== 'boolean') missing.push('Down consumption rule');
      if (missing.length) {
        this.reportCombatLimitation(type, missing, { actorId: actor.id, targetId: target.id });
        continue;
      }
      const usageKey = `${type}:${actor.id}:${actor.characterTurnsStarted}`;
      if ((this.state.sharedCombat.uses[usageKey] || 0) >= rule.maxPerOwnerTurn
        || this.state.sharedCombat.pendingActions.some(action => action.type === type)) continue;
      const skill = { ...clone(rule.skill), id: `shared:${type}`, slot: type === 'one_more' ? '1M' : 'AOA' };
      this.state.sharedCombat.pendingActions.push({ type, actorId: actor.id, skillId: skill.id,
        name: skill.name || type, target: skill.target, targetId: target.id, skill, rule: clone(rule), usageKey, enabled: true, cost: skill.cost });
      this.emit('extra_action_ready', `${skill.name || type} is ready after this counted action.`, { actorId: actor.id, sourceType: type, tone: 'phase' });
    }
  }

  getSharedCombatActions() {
    if (!this.state.sharedCombat.pendingTurnCompletion || this.state.phase !== 'battle' || this.actor?.hp <= 0) return [];
    const pending = this.state.sharedCombat.pendingActions.filter(action => action.actorId === this.actor.id)
      .map(action => ({ ...action, enabled: this.actor.sp >= action.cost }));
    if (!pending.length) return [];
    return [...clone(pending), { type: 'skip_extra_actions', skillId: 'shared:skip', actorId: this.actor.id,
      name: 'Continue without extra actions', target: 'self', enabled: true, cost: 0 }];
  }

  stepSharedCombat(action, targetId) {
    const shared = this.state.sharedCombat;
    let reward = 0;
    if (action.type === 'skip_extra_actions') shared.pendingActions = [];
    else {
      const target = this.findEnemy(targetId || action.targetId);
      if (action.target === 'boss' && (!target || target.alive === false)) throw new Error('Extra action target unavailable');
      shared.pendingActions = shared.pendingActions.filter(item => item.type !== action.type);
      shared.uses[action.usageKey] = (shared.uses[action.usageKey] || 0) + 1;
      reward = this.resolveSkill(this.actor, action.skill, target?.id || 'all_enemies', action.type, {
        grantsHighlight: action.rule.grantsHighlight, canReduceDown: false, skipBerryMechanics: true
      });
      if (action.rule.consumeDown) for (const enemy of action.target === 'all_enemies' ? this.enemies : [target]) {
        enemy.downed = false;
        enemy.downPoints = enemy.downMax;
      }
      shared.pendingActions = shared.pendingActions.filter(item => item.type !== 'all_out_attack' || this.enemies.every(enemy => enemy.downed));
    }
    this.updateBossPhase();
    if (this.allEnemiesDefeated()) this.finish('victory');
    else if (!shared.pendingActions.length) {
      shared.pendingTurnCompletion = false;
      this.consumeTurnAction();
    }
    this.recordFrame(action.name);
    return { nextState: this.config.fastMode ? null : this.getObservation(), reward,
      done: this.state.phase !== 'battle', consumedAction: false,
      events: this.config.fastMode ? [] : clone(this.state.history.at(-1).events) };
  }

  resolveTechnicalEffect(result, actor, target, skill) {
    if (!result.technical?.activated) return;
    if (result.technical.consumeAilment) target.debuffs = target.debuffs.filter(effect => effect.id !== result.technical.ailmentId);
    this.emit('technical', `${skill.name} activated a Technical on ${target.name}.`, {
      actorId: actor.id, targetId: target.id, skillId: skill.id, ...result.technical, tone: 'critical'
    });
  }

  unsupportedActionReason(skill) {
    if (!this.usesLiveMechanics()) return null;
    if (skill?.name === 'Assist') return 'Assist timing is not yet implemented.';
    if (/^Can be activated when Theurgy gauge is at/i.test((skill?.description || skill?.note || '').trim())) return 'Theurgy gauge and activation rules are not yet implemented.';
    return null;
  }

  isBerry(unit) { return this.usesLiveMechanics() && unit?.slug === 'berry'; }







  livePersonaSkill(persona, skill) {
    if (!this.usesLiveMechanics()) return skill;
    const observedCost = observedLivePersonaCosts[persona?.name]?.[skill?.name];
    const skillLevelBonus = this.state.wonderLevelBonus || 0;
    const dionysusOverride = persona?.name === 'Dionysus' && ['Revolution', 'Universal Theoria'].includes(skill?.name);
    if (observedCost == null && skillLevelBonus === 0 && !dionysusOverride) return skill;
    const adjusted = {
      ...clone(skill),
      ...(observedCost != null ? { cost: observedCost } : {}),
      ...(skillLevelBonus ? { skillLevelBonus } : {})
    };
    if (skillLevelBonus && skill.level != null && Number.isFinite(Number(skill.level))) adjusted.effectiveLevel = Number(skill.level) + skillLevelBonus;
    if (persona.name === 'Dionysus' && skill.name === 'Universal Theoria') {
      // Tooltip: party ATK +33% and chosen main ally damage +22%, both 2 turns.
      adjusted.target = 'ally';
      adjusted.buffTarget = 'party';
      adjusted.buff = clone(skill.combat?.buff || {
        id: 'attack_up', name: 'ATK ↑', stat: 'attack', value: 0.33, duration: 2
      });
      adjusted.buffs = [clone(adjusted.buff)];
      adjusted.selectedAllyBuff = {
        id: 'universal_theoria_damage', name: 'UNIVERSAL THEORIA DMG', stat: 'finalDamage', value: 0.22, duration: 2
      };
    }
    if (persona.name === 'Dionysus' && skill.name === 'Revolution') {
      // Lufel level-three tooltip: party CRIT +7.2%, then +1.2% for each
      // 10% of the user's CRIT rate, capped at +4.8%, for 3 turns.
      adjusted.buff = {
        ...clone(skill.combat?.buff || {
          id: 'crit_rate_up', name: 'CRIT RATE ↑', stat: 'critRate', value: 0.072, duration: 3
        }),
        scaling: { stat: 'crit', base: 0.072, per: 0.1, step: 0.012, cap: 0.4 }
      };
      adjusted.buffs = [clone(adjusted.buff)];
    }
    return adjusted;
  }






  isBossWeakened() {
    if (this.isDreamscapePreview()) return false;
    if (this.state.boss.scoreModel === 'recorded_nightmare') {
      return ['nexus', 'devourer'].includes(this.state.boss.modeId) && this.state.boss.weakenedActive === true;
    }
    if (this.state.boss.weakenedActive === true) return true;
    const turns = Number(this.state.boss.weakenedTurns || 0);
    return turns > 0 && this.state.attackTurn > this.state.boss.turnLimit - turns;
  }

  weakenedTurnsLeft() {
    if (this.state.boss.scoreModel === 'recorded_nightmare') {
      return ['nexus', 'devourer'].includes(this.state.boss.modeId) ? Number(this.state.boss.weakenedTurnsLeft || 0) : 0;
    }
    if (this.state.boss.weakenedActive === true) return Number(this.state.boss.weakenedTurnsLeft || 0);
    return this.isBossWeakened() ? this.state.boss.turnLimit - this.state.attackTurn + 1 : 0;
  }

  addDamageScore(amount, actor, target = null) {
    const damageWasWeakened = this.lastDamageWasWeakened ?? this.isBossWeakened();
    this.lastDamageWasWeakened = undefined;
    if (this.isDreamscapeRun()) {
      if (!this.isDreamscapeScoreEligibleTarget(target)) return;
      this.state.scoreBreakdown.damagePreview += amount;
      const normalTurn = this.state.attackTurn;
      const multiplier = getMultidimensionalDreamscapeTurnScoreMultiplier(normalTurn);
      const weightedPoints = amount * multiplier;
      let bucket = this.state.scoreBreakdown.turnScoreBuckets
        .find(entry => entry.normalTurn === normalTurn);
      if (!bucket) {
        bucket = { normalTurn, rawDamage: 0, multiplier, weightedPoints: 0 };
        this.state.scoreBreakdown.turnScoreBuckets.push(bucket);
      }
      bucket.rawDamage += amount;
      bucket.weightedPoints += weightedPoints;
      this.state.scoreBreakdown.turnWeightedDamagePoints += weightedPoints;
      this.state.scoreBreakdown.foeDefensePoints = Math.round(this.state.scoreBreakdown.turnWeightedDamagePoints);
      this.state.score = this.isDreamscapePreview()
        ? this.state.scoreBreakdown.damagePreview
        : this.state.scoreBreakdown.foeDefensePoints;
      return;
    }
    if (this.isHachimanDevourer()) {
      if (!this.isDreamscapeScoreEligibleTarget(target)) return;
      const breakdown = this.state.scoreBreakdown;
      breakdown.model ||= 'hachiman_devourer_observed_rules';
      breakdown.preBreakDamage ||= 0; breakdown.breakDamage ||= 0; breakdown.points ||= 0;
      const weightedAmount = amount * getMultidimensionalDreamscapeTurnScoreMultiplier(this.state.attackTurn);
      if (damageWasWeakened) { breakdown.breakDamage += amount; breakdown.points += weightedAmount * 3; }
      else { breakdown.preBreakDamage += amount; breakdown.points += weightedAmount; }
      breakdown.breakPointMultiplier = 3;
      // Sleepy's DOD result screen (2026-09-09): Base Damage Points 405,499 +
      // Weakened Damage Points 1,195,200,896 + Boss Attack Points 125,000, x8 =
      // 9,565,851,160. Same difficulty bonus and boss attack points as Dreamscape.
      breakdown.bossAttackPoints = 125000;
      breakdown.difficultyBonus = 8;
      breakdown.evidence = 'sleepy_dod_result_screen_2026-09-09';
      breakdown.limitation = 'User-supplied DOD rules: pre-break damage is bounded by the 410,000 HP cap, break damage scores 3x, plus 125,000 Boss Attack Points, x8 difficulty (observed result screen).';
      this.state.score = Math.round((breakdown.points + 125000) * 8);
      return;
    }
    if (this.state.boss.scoreModel !== 'recorded_nightmare') {
      const roleMultiplier = this.state.boss.scoreRoles?.includes(actor.role) ? (this.state.boss.roleScoreMultiplier || 1) : 1;
      const turnMultiplier = this.isDreamscapeTurnWeightedMode()
        ? getMultidimensionalDreamscapeTurnScoreMultiplier(this.state.attackTurn)
        : 1;
      this.state.score += Math.round(amount * turnMultiplier * this.state.boss.scoreMultiplier * roleMultiplier);
      return;
    }
    if (damageWasWeakened) {
      this.state.scoreBreakdown.weakenedRawDamage += amount;
    } else if (this.state.boss.modeId === 'nexus' && this.state.boss.hpLockDamage > 0) {
      const remainingCredit = Math.max(0, this.state.boss.hpLockDamage - this.state.scoreBreakdown.baseRawDamage);
      const credited = Math.min(amount, remainingCredit);
      this.state.scoreBreakdown.baseRawDamage += credited;
      if (!this.state.boss.breakPending && this.state.scoreBreakdown.baseRawDamage >= this.state.boss.hpLockDamage) {
        this.state.boss.breakPending = true;
        this.state.boss.breakTurn = this.state.attackTurn;
        this.emit('hp_lock', `${this.state.boss.name} reached its HP lock. Further damage this Attack Turn grants no points.`, { tone: 'phase' });
      }
    } else {
      this.state.scoreBreakdown.baseRawDamage += amount;
    }
    this.state.scoreBreakdown.baseDamagePoints = Math.round(this.state.scoreBreakdown.baseRawDamage * this.state.boss.basePointScale);
    this.state.scoreBreakdown.weakenedDamagePoints = Math.round(this.state.scoreBreakdown.weakenedRawDamage * this.weakenedPointMultiplier());
    this.state.score = calculateNightmareScore(this.state.scoreBreakdown);
  }

  weakenedPointMultiplier() {
    return this.state.boss.modeId === 'devourer' ? 3 : Number(this.state.boss.weakenedPointScale || 1);
  }

  startDevourerWeakenedPhase() {
    if (this.state.boss.modeId !== 'devourer' || !this.state.boss.weakenedPending) return false;
    this.state.boss.weakenedPending = false;
    this.state.boss.weakenedActive = true;
    this.state.boss.weakenedTurnsLeft = 2;
    // DOD Hachiman (Sleepy route, 2026-09-09): the boss action of the turn that
    // opened the break does not count as one of the two Weakened boss turns.
    if (this.isHachimanDevourer()) this.state.boss.weakenedGraceTurn = this.state.attackTurn;
    this.state.attackTurnsLeft = Math.max(this.state.attackTurnsLeft, 2);
    this.state.boss.phaseIndex = Math.min(1, this.state.boss.phases.length - 1);
    this.emit('break', `${this.state.boss.name} reached 0 HP. Weakened is active for 2 boss turns with infinite HP and 3x damage points.`, { tone: 'phase' });
    return true;
  }

  soulLinkedEnemies() {
    return [this.state.boss, ...this.state.boss.summons.filter(enemy => enemy.alive !== false)];
  }

  usesSoulLink(target) {
    if (!this.state.boss.encounter?.soulLink || !target) return false;
    return target.id === this.state.boss.id || this.state.boss.summons.some(enemy => enemy.id === target.id);
  }

  synchronizeSoulLinkHp(enemies, requestedTotal) {
    const minimumHp = this.state.boss.lifeSustainment ? 1 : 0;
    const minimumTotal = minimumHp * enemies.length;
    const maximumTotal = enemies.reduce((sum, enemy) => sum + enemy.maxHp, 0);
    const total = Math.round(clamp(requestedTotal, minimumTotal, maximumTotal));
    const distributable = total - minimumTotal;
    const capacity = enemies.reduce((sum, enemy) => sum + Math.max(0, enemy.maxHp - minimumHp), 0);
    const allocations = enemies.map((enemy, index) => {
      const exact = minimumHp + (capacity > 0 ? distributable * Math.max(0, enemy.maxHp - minimumHp) / capacity : 0);
      const hp = Math.floor(exact);
      return { enemy, hp, fraction: exact - hp, index };
    });
    let remainder = total - allocations.reduce((sum, allocation) => sum + allocation.hp, 0);
    allocations.sort((left, right) => right.fraction - left.fraction || left.index - right.index);
    for (let index = 0; index < allocations.length && remainder > 0; index += 1, remainder -= 1) allocations[index].hp += 1;
    for (const allocation of allocations) allocation.enemy.hp = allocation.hp;
  }

  applyEnemyDamage(target, amount) {
    const requested = Math.max(0, Math.round(Number(amount) || 0));
    if (!target || requested <= 0) return 0;
    this.lastDamageWasWeakened = this.isBossWeakened();
    if (this.usesSoulLink(target)) {
      if (this.isBossWeakened()) return requested;
      const linked = this.soulLinkedEnemies();
      const currentTotal = linked.reduce((sum, enemy) => sum + enemy.hp, 0);
      const floor = this.state.boss.lifeSustainment ? linked.length : 0;
      const actual = Math.min(requested, Math.max(0, currentTotal - floor));
      if (actual <= 0) return 0;
      const remainingTotal = currentTotal - actual;
      this.synchronizeSoulLinkHp(linked, remainingTotal);
      if (!this.state.boss.lifeSustainment && remainingTotal <= 0) {
        if (this.state.boss.modeId === 'devourer') {
          this.state.boss.weakenedPending = true;
          this.startDevourerWeakenedPhase();
        } else {
          for (const enemy of this.state.boss.summons.filter(enemy => enemy.alive)) this.defeatSummon(enemy);
        }
      }
      return actual;
    }
    if (this.isHachimanDevourer() && target.id === this.state.boss.id) {
      if (this.state.boss.weakenedActive) {
        // The action that opened the break earns no Weakened credit: Joker's live
        // run (2026-09-10) started B1 at exactly the base 405,499 after the S3
        // that broke the boss, so its remaining hits and ticks did not score.
        if (this.state.boss.breakOpeningActionNumber === this.state.actionNumber
          && this.state.boss.breakOpeningActorId === this.actor?.id) return 0;
        // Break: infinite HP, every point of damage counts.
        this.state.boss.breakDamageDealt = (this.state.boss.breakDamageDealt || 0) + requested;
        return requested;
      }
      const floorRatio = Number(this.state.boss.lifeSustainmentFloorRatio || 0);
      const lockFloor = this.state.boss.lifeSustainment ? (floorRatio > 0 ? Math.floor(target.maxHp * floorRatio) : 1) : 0;
      const dealt = Math.min(requested, Math.max(0, target.hp - lockFloor));
      target.hp = Math.max(lockFloor, target.hp - dealt);
      if (!this.state.boss.lifeSustainment && target.hp <= 0) {
        this.state.boss.weakenedPending = true;
        this.state.boss.breakOpeningActionNumber = this.state.actionNumber;
        this.state.boss.breakOpeningActorId = this.actor?.id ?? null;
        this.startDevourerWeakenedPhase();
      }
      return dealt;
    }
    if (target.scoreAttack && !target.finiteHp) {
      target.hp = Math.max(1, target.hp - requested);
      return requested;
    }
    // DOD Hachiman: the HP Lock protects only the boss; idols can still be defeated.
    const floor = this.state.boss.lifeSustainment && !(this.isHachimanDevourer() && target.id !== this.state.boss.id) ? 1 : 0;
    const actual = Math.min(requested, Math.max(0, target.hp - floor));
    target.hp = Math.max(floor, target.hp - actual);
    return actual;
  }

  allEnemiesDefeated() {
    if (this.state.boss.modeId === 'devourer' && (this.state.boss.weakenedPending || this.state.boss.weakenedActive)) return false;
    return this.state.boss.hp <= 0 && this.state.boss.summons.every(enemy => enemy.alive === false || enemy.hp <= 0);
  }

  findEnemy(id) {
    if (!id || id === 'boss' || id === this.state.boss.id) return this.state.boss;
    return this.state.boss.summons.find(enemy => enemy.id === id && enemy.alive) || null;
  }

  emit(type, message, payload = {}) {
    const event = { id: `${this.state.actionNumber}-${this.state.log.length}-${type}`, type, message, attackTurn: this.state.attackTurn, round: this.state.round, ...payload };
    if (this.config.fastMode) return event;
    this.state.log.push(event);
    this.state.lastEvents.push(event);
    return event;
  }

  recordFrame(label) {
    if (this.config.fastMode) {
      this.state.lastEvents = [];
      return;
    }
    this.state.history.push({
      label, round: this.state.round, attackTurn: this.state.attackTurn, attackTurnsLeft: this.state.attackTurnsLeft,
      actorIndex: this.state.actorIndex, turnActionsUsed: this.state.turnActionsUsed, turnActionsTotal: this.state.turnActionsTotal,
      actionNumber: this.state.actionNumber, score: this.state.score, totalDamage: this.state.totalDamage,
      scoreBreakdown: clone(this.state.scoreBreakdown), weakened: this.isBossWeakened(), weakenedTurnsLeft: this.weakenedTurnsLeft(),
      activePersonaId: this.state.activePersonaId, party: clone(this.state.party), boss: clone(this.state.boss),
      highlight: clone(this.getHighlightState()),
      actionQueue: clone(this.getActionQueue()), events: clone(this.state.lastEvents)
    });
    this.state.lastEvents = [];
  }

  skillsFor(unit = this.actor) {
    if (!unit) return [];
    if (unit.id === 'wonder') return this.activePersona.skills.map(skill => this.livePersonaSkill(this.activePersona, skill));
    if (this.isJc(unit)) {
      return unit.selectedMasks.map((mask, index) => {
        const skill = unit.skills.find(candidate => jcMaskByName[candidate.name] === mask);
        return skill ? { ...skill, slot: `S${index + 1}` } : null;
      }).filter(Boolean);
    }
    if (this.isBerry(unit)) return unit.skills.map(skill => this.berrySkill(skill));
    if (this.isMatoi(unit)) return unit.skills.map(skill => this.matoiSkill(unit, skill));
    if (this.isYukari(unit) || this.isMakoto(unit)) return unit.skills.map(skill => this.liveSeesSkill(unit, skill));
    return unit.skills;
  }

  liveSeesSkill(actor, skill) {
    const projected = clone(skill);
    if (this.isYukari(actor) && skill.name === "Tailwind's Breath") {
      projected.target = 'ally';
      projected.allyEffect = true;
      delete projected.buff;
      delete projected.buffTarget;
    }
    if (this.isYukari(actor) && skill.name === 'Arrow of Life') {
      projected.target = 'ally';
      projected.allyEffect = true;
      delete projected.buff;
      delete projected.buffTarget;
      delete projected.heal;
      delete projected.healAttack;
      delete projected.healFlat;
      delete projected.healTarget;
    }
    if (this.isMakoto(actor) && skill.name === 'Scarlet Hades') {
      delete projected.buff;
      delete projected.buffTarget;
    }
    return projected;
  }


  jcHighlightSkill(mask) {
    const definitions = {
      mischief: { element: 'support', power: 0, target: 'party', note: 'A6 level 13: party Attack +28.4% and damage +39.8% for 2 turns.' },
      service: { element: 'support', power: 0, target: 'party', note: 'A6 level 13: restore party HP and increase max HP for 2 turns.' },
      absurdity: { element: 'psychic', power: 2.84, target: 'boss', note: 'A6 level 13: Psychic and Nuclear damage, then buff J&C and the highest-Attack attacker.' },
      luck: { element: 'bless', power: 1.42, target: 'all_enemies', note: 'A6 level 13: Bless and Curse damage, then buff J&C Attack and critical damage.' }
    };
    const definition = definitions[mask] || definitions.mischief;
    return { id: `highlight:j-c:${mask}`, slot: 'HL', name: `J&C Highlight: ${mask}`, jcHighlightMask: mask, cost: 0, ...definition };
  }

  getAvailableActions() {
    if (this.state.phase === 'battle' && this.supportActionDescriptor()) return [this.supportActionDescriptor()];
    if (this.state.phase !== 'battle' || !this.actor || this.actor.hp <= 0) return [];
    const sharedActions = this.getSharedCombatActions();
    if (sharedActions.length) return sharedActions;
    const actor = this.actor;
    const jcExpectedSlot = this.isJc(actor) ? actor.jcNextMaskSlot : null;
    const actions = this.skillsFor(actor).map(skill => {
      const cooldownRemaining = Number(actor.skillCooldowns?.[skill.id] || 0);
      const stackRequirement = Number(skill.matoiExtinguishCost || 0);
      const unavailableReason = (actor.slug === 'bui-cosmic' && !this.usesLiveMechanics() ? 'Cosmic Yui requires the live mechanics profile.' : null) || this.unsupportedActionReason(skill)
        || characterHook(this, actor, 'actionUnavailableReason', skill, 'character_skill')
        || (skill.excludeSelf && !this.state.party.some(unit => unit.hp > 0 && unit.id !== actor.id) ? 'Requires another living ally.' : null)
        || (stackRequirement > actor.extinguishStacks ? `Requires ${stackRequirement} Extinguish stacks.` : null)
        || (this.isMakoto(actor) && skill.name === 'Scarlet Hades' && actor.moonPhaseStacks < 2 ? 'Requires 2 Moon Phase stacks.' : null);
      const enabled = actor.sp >= (skill.cost || 0)
        && !unavailableReason
        && actor.hp > Math.round(actor.maxHp * ((skill.hpCost || 0) / 100))
        && !(skill.name === 'Paddle Out' && actor.surfReentryLocked)
        && !(this.isMarian(actor) && (skill.buffTarget || skill.target) === 'ally' && !this.state.party.some(unit => unit.id !== actor.id && unit.hp > 0))
        && cooldownRemaining === 0
        && (!jcExpectedSlot || skill.slot === jcExpectedSlot);
      return {
        type: this.isCosmicYui(actor) && skill.cosmicAction === 'assemble' ? 'cosmic_assemble' : this.isRin(actor) && skill.name === 'Orange Blossom Blade' ? 'rin_stance' : 'skill', actorId: actor.id, skillId: skill.id, name: skill.name, target: skill.target,
        cost: skill.cost || 0, enabled, cooldownRemaining, unavailableReason,
        statusLabel: unavailableReason ? 'LOCKED' : cooldownRemaining > 0 ? `CD ${cooldownRemaining}` : 'READY',
        skill: clone(skill)
      };
    });
    const rinYanhua = this.isRin(actor) && actor.rinFlamingSwordDance;
    actions.push({ type: rinYanhua ? 'rin_yanhua' : 'attack', actorId: actor.id, skillId: rinYanhua ? 'rin_yanhua_slash' : 'basic_attack', name: rinYanhua ? 'Yanhua Slash' : 'Attack', target: 'boss', cost: 0, enabled: !actor.surfActive,
      skill: rinYanhua
        ? { id: 'rin_yanhua_slash', slot: 'ATK', name: 'Yanhua Slash', element: 'fire', cost: 0, power: 1.482, target: 'all_enemies', rinYanhua: true, note: 'Flaming Sword Dance replacement melee action. Fire Technical resolution remains unverified.' }
        : { id: 'basic_attack', slot: 'ATK', name: 'Attack', element: 'physical', cost: 0, power: 0.82, target: 'boss', note: 'Basic Physical attack.' } });
    actions.push({ type: 'gun', actorId: actor.id, skillId: 'gun_attack', name: 'Gun', target: 'boss', cost: 0, enabled: actor.ammo > 0 && !actor.surfActive,
      skill: { id: 'gun_attack', slot: 'GUN', name: 'Gun', element: 'gun', cost: 0, power: actor.gunPower || 0.55, target: 'boss', note: `Ranged attack. ${actor.ammo}/${actor.maxAmmo || 8} ammo.` } });
    actions.push({ type: 'guard', actorId: actor.id, skillId: 'guard', name: 'Guard', target: 'self', cost: 0, enabled: true });
    if (actor.id === 'wonder') {
      for (const personaId of this.config.personaIds) {
        const persona = byId(this.personaDefinitions, personaId);
        if (!persona) continue;
        actions.push({ type: 'switch', actorId: actor.id, personaId, skillId: `switch:${personaId}`,
          name: persona.name, target: 'self', cost: 0, enabled: personaId !== this.state.activePersonaId, persona: clone(persona) });
      }
    }
    if (this.isAkihiko(actor) && actor.mettleStacks >= 6 && actor.lastFlashCharacterTurn !== actor.characterTurnsStarted) actions.push({
      type: 'akihiko_flash', actorId: actor.id, skillId: 'akihiko_flash_blow', name: 'Flash Blow',
      target: 'all_enemies', cost: 0, enabled: true, statusLabel: 'READY',
      skill: { id: 'akihiko_flash_blow', slot: 'ALT', name: 'Flash Blow', element: 'physical',
        cost: 0, power: 0.559, target: 'all_enemies', note: 'Spend 6 Mettle. Free Resonance action.' }
    });
    const available = [...actions, ...this.cosmicColorActions(actor), ...this.getBerryAltActions(), ...this.getItemActions()];
    return this.kotoneMechanics?.decorateActions(available) || available;
  }

  getBerryAltActions() {
    const actor = this.actor;
    if (this.state.phase !== 'battle' || !this.isBerry(actor) || actor.awareness < 6 || actor.hp <= 0) return [];
    return [...this.skillsFor(actor), { ...this.berrySkill(actor.highlightSkill), slot: 'HL' }].map((skill, index) => {
      const used = actor.doubleBerryUsed[skill.slot];
      const requiredChains = index + 1;
      const cooldownRemaining = skill.slot === 'HL' ? 0 : Number(actor.skillCooldowns[skill.id] || 0);
      const unavailableReason = used ? 'Used this battle.' : actor.chainsOfLove < requiredChains ? `Needs ${requiredChains} Chains.` : cooldownRemaining ? `Cooldown ${cooldownRemaining}.` : actor.sp < (skill.cost || 0) ? 'Not enough SP.' : null;
      return { type: 'berry_alt', actorId: actor.id, skillId: `berry_alt:${skill.id}`, name: `DOUBLE BERRY: ${skill.name}`,
        target: skill.target, cost: skill.cost || 0, requiredChains, used, cooldownRemaining, unavailableReason,
        enabled: !used && actor.chainsOfLove >= requiredChains && !cooldownRemaining && actor.sp >= (skill.cost || 0),
        statusLabel: used ? 'USED' : actor.chainsOfLove < requiredChains ? `CHAINS ${requiredChains}` : cooldownRemaining ? `CD ${cooldownRemaining}` : 'READY',
        skill: { ...skill, berryAlt: true } };
    });
  }

  getNavigatorActions() {
    if (this.state.phase !== 'battle') return [];
    const additional = characterHook(this, this.state.navigator, 'getAdditionalNavigatorActions') || [];
    return [...this.state.navigator.skills, ...additional].map(skill => {
      const concertActive = this.isVirtualConcertActive();
      const missingMikuTracks = this.isMikuNavigator() && skill.name === 'Showstopper'
        && (this.state.navigator.tracks?.length || 0) < 3;
      const usedThisTurn = skill.navigatorIndependent !== true && this.state.navigator.lastUsedAttackTurn === this.state.attackTurn;
      const remaining = Number(this.state.navigator.cooldowns[skill.id] || 0);
      const moduleReason = characterHook(this, this.state.navigator, 'actionUnavailableReason', skill, 'navigator');
      const pendingExtraAction = this.state.sharedCombat.pendingTurnCompletion;
      const unavailableReason = moduleReason || (pendingExtraAction ? 'Resolve or skip the pending extra actions first.' : concertActive
        ? 'Support skills are disabled during Virtual Concert.'
        : missingMikuTracks
          ? `Requires three Track types. Current Tracks: ${this.state.navigator.tracks.length}/3.`
          : usedThisTurn
            ? 'A navigator skill was already used this Attack Turn.'
            : remaining > 0
              ? `${remaining} required action${remaining === 1 ? '' : 's'} remaining.`
              : null);
      return { ...clone(skill), type: 'navigator',
        enabled: !unavailableReason && !pendingExtraAction && !concertActive && remaining === 0 && !usedThisTurn && !missingMikuTracks,
        unavailableReason,
        statusLabel: moduleReason ? (skill.unavailableStatusLabel || 'LOCKED')
          : concertActive ? 'CONCERT' : missingMikuTracks ? `TRACKS ${this.state.navigator.tracks.length}/3`
            : usedThisTurn ? 'USED' : remaining > 0 ? `CD ${remaining}` : 'READY',
        remaining };
    });
  }

  getMedicineActions() {
    if (this.state.phase !== 'battle' || !this.isMarian(this.actor) || this.actor.midsummerPrescription <= 0) return [];
    if (this.actor.lastMedicineCharacterTurn === this.actor.characterTurnsStarted) return [];
    return marianMedicines.map(medicine => ({
      ...this.medicineAction(medicine, this.actor), type: 'medicine', actorId: this.actor.id, enabled: true
    }));
  }

  medicineAction(medicine, actor) {
    const action = { ...clone(medicine), target: 'ally' };
    if (!this.usesLiveMechanics()) return action;
    action.buff.duration = 1;
    action.baseValue = action.buff.value;
    action.baseDuration = 1;
    const marianModifier = this.usesLiveMechanics() && this.isMarian(actor)
      ? 1 + (actor.medicineEffectBonus || 0) + (actor.nextMedicineEffectBonus || 0)
      : 1;
    action.effectiveValue = action.baseValue * marianModifier;
    action.effectiveDuration = this.usesLiveMechanics() && this.isMarian(actor)
      ? 2 + (actor.awareness >= 6 ? 1 : 0)
      : action.baseDuration;
    if (this.usesLiveMechanics() && this.isMarian(actor)) {
      action.name = action.id === 'attack_tablet' ? 'Attacker Tablet' : action.name;
      action.note = `${action.name}: base ${action.baseValue < 1 ? `${action.baseValue * 100}%` : action.baseValue} for 1 turn; applied duration ${action.effectiveDuration} turns. Magnitude includes sourced A1 and any preceding Highlight bonus; the observed 1.58 multiplier is unresolved.`;
    }
    return action;
  }

  getItemActions() {
    if (this.state.phase !== 'battle' || !this.actor || this.actor.hp <= 0 || !this.canUseDreamscapeItems()
      || this.state.sharedCombat.pendingTurnCompletion || this.state.sharedCombat.pendingActions.length) return [];
    return marianMedicines.filter(medicine => observedDreamscapeItems.includes(medicine.id)).map(medicine => {
      const action = this.medicineAction(medicine, this.actor);
      const remaining = Number(this.state.itemInventory[medicine.id] || 0);
      const usesRemaining = Number(this.state.itemUsesRemaining || 0);
      const unavailableReason = remaining <= 0 ? 'Out of stock.' : usesRemaining <= 0 ? 'Item use limit reached.' : null;
      return {
        ...action, type: 'item', actorId: this.actor.id, itemId: medicine.id, skillId: medicine.id,
        enabled: !unavailableReason, unavailableReason, remaining, usesRemaining,
        maxUses: this.state.itemMaxUses, item: clone(medicine)
      };
    });
  }

  getHighlightState() {
    const members = this.state.party.filter(unit => unit.hp > 0).map(unit => unit.id);
    if (!this.usesLiveMechanics()) return {
      mode: 'personal', current: null, max: 100, gain: null, start: null, evidence: 'recorded_personal_meter', members
    };
    const shared = this.state.sharedCombat;
    return {
      mode: 'shared', current: Number(shared.highlight || 0), max: 100,
      gain: Number(shared.highlightGain || 0), start: Number(shared.highlightStart || 0),
      normalActionGain: Number(shared.highlightNormalActionGain || 0),
      weaknessActionGain: Number(shared.highlightWeaknessActionGain || 0),
      concertNormalActionGain: Number(shared.highlightConcertNormalActionGain || 0),
      concertWeaknessActionGain: Number(shared.highlightConcertWeaknessActionGain || 0),
      weaknessCastBonus: Number(shared.highlightWeaknessCastBonus || 0),
      chargeRule: shared.highlightScalarOverride ? 'explicit_replay_scalar_override' : shared.highlightChargeRule,
      concertActive: this.isVirtualConcertActive(),
      chargeRuleStatus: shared.highlightRuleStatus,
      scalarOverride: shared.highlightScalarOverride === true,
      actionContext: shared.lastHighlightActionContext ? clone(shared.lastHighlightActionContext) : null,
      limitations: clone(shared.limitations), evidence: shared.highlightEvidence, members
    };
  }

  setSharedHighlight(value, sourceType = 'system', details = {}) {
    if (!this.usesLiveMechanics()) return null;
    const shared = this.state.sharedCombat;
    shared.highlight = clamp(Number(value || 0), 0, 100);
    this.emit('resource', `Shared Highlight is ${shared.highlight}%.`, {
      resource: 'sharedHighlight', amount: shared.highlight, sourceType, tone: 'phase',
      evidence: shared.highlightEvidence, ...details
    });
    return shared.highlight;
  }

  gainSharedHighlight(amount = this.state.sharedCombat.highlightGain, sourceType = 'character_action', details = {}) {
    if (!this.usesLiveMechanics()) return null;
    const shared = this.state.sharedCombat;
    const before = Number(shared.highlight || 0);
    const requestedGain = Math.max(0, Number(amount || 0));
    const next = clamp(before + requestedGain, 0, 100);
    const appliedGain = next - before;
    return this.setSharedHighlight(next, sourceType, {
      highlightGain: appliedGain, requestedGain, nominalGain: requestedGain,
      appliedGain, overflow: requestedGain - appliedGain, before, after: next, ...details
    });
  }

  createSharedHighlightActionContext({ actor, actionType, skill, concertAtActionStart = false } = {}) {
    if (!this.usesLiveMechanics()) return null;
    const shared = this.state.sharedCombat;
    const actionId = `highlight-action-${shared.nextHighlightActionId++}`;
    return {
      actionId, actorId: actor?.id || null, actionType: actionType || 'character_action', skillId: skill?.id || null,
      concertAtActionStart: concertAtActionStart === true,
      concertRoundAtActionStart: this.state.navigator?.virtualConcert?.roundsRemaining ?? null,
      casts: [], packets: [], unresolved: []
    };
  }

  recordSharedHighlightCast(context, { actor, skill, sourceType, nested = false, repeatReason = null } = {}) {
    if (!context) return null;
    const cast = {
      castId: `${context.actionId}:cast-${context.casts.length + 1}`,
      parentCastId: context.casts[0]?.castId || null,
      actorId: actor?.id || null, skillId: skill?.id || null, sourceType,
      root: !nested, automatic: ['awareness_follow_up', 'resonance_follow_up'].includes(sourceType),
      repeat: sourceType === 'berry_repeat', repeatReason,
      nestedWeaknessEligibility: nested && this.isJc(actor) && skill?.name === 'Two Masks as One' && sourceType === 'awareness_follow_up'
        ? 'jc_auto_two_masks'
        : nested && this.isBerry(actor) && sourceType === 'berry_repeat' && repeatReason === 'berry_alt_repeat'
          ? 'berry_alt_repeat' : null
    };
    context.casts.push(cast);
    return cast;
  }

  recordSharedHighlightPacket(context, cast, { target, result, actualDamage, element, packetKind, sourceType } = {}) {
    if (!context || !cast) return;
    context.packets.push({
      castId: cast.castId, targetId: target?.id || null, targetKind: target?.id === this.state.boss?.id ? 'boss' : 'enemy',
      element, weakness: result?.weakness === true, actualDamage: Number(actualDamage || 0),
      elementalWeakness: isWeakTo(target, element),
      targetDownedBefore: target?.downed === true, downPointsBefore: target?.downPoints ?? null,
      sourceType, packetKind, rootCast: cast.root, repeat: cast.repeat, repeatReason: cast.repeatReason
    });
  }

  reportSharedHighlightLimitation(context, missing) {
    if (!this.usesLiveMechanics()) return;
    const shared = this.state.sharedCombat;
    const key = `Highlight:${missing}`;
    if (!shared.limitations.some(item => item.key === key)) {
      const message = `Shared Highlight ${missing}. No unverified additional charge is added.`;
      const limitation = { key, system: 'Highlight', missing, message, actionId: context?.actionId || null };
      shared.limitations.push(limitation);
      this.state.mechanicsLimitations.push(message);
      this.emit('unmodeled_mechanic', message, { ...limitation, tone: 'system' });
    }
    if (context && !context.unresolved.includes(missing)) context.unresolved.push(missing);
  }

  resolveCountedActionHighlight(context, sourceType = 'character_action') {
    if (!this.usesLiveMechanics() || !context) return null;
    const shared = this.state.sharedCombat;
    const hasRootWeakness = context.packets.some(packet => packet.rootCast && packet.weakness && packet.actualDamage > 0);
    const confirmedBerryKillReset = 'berry_s1_kill_reset';
    const usesCastBonus = !shared.highlightScalarOverride && shared.highlightChargeRule === 'base_double_weak_cast_bonus';
    const knownNestedCast = cast => usesCastBonus && ['jc_auto_two_masks', 'berry_alt_repeat'].includes(cast?.nestedWeaknessEligibility);
    const hasUnconfirmedRepeatDamage = context.casts.some(cast => cast.repeat && cast.repeatReason !== confirmedBerryKillReset && !knownNestedCast(cast))
      || context.packets.some(packet => packet.repeat && packet.repeatReason !== confirmedBerryKillReset
        && !knownNestedCast(context.casts.find(cast => cast.castId === packet.castId)));
    const hasNestedAutomaticDamage = context.casts.some(cast => !cast.root && cast.automatic && !knownNestedCast(cast));
    let contributions;
    let ruleId;
    if (shared.highlightScalarOverride) {
      contributions = [{ cast: context.casts.find(cast => cast.root) || null,
        requestedGain: shared.highlightGain * (context.concertAtActionStart ? 2 : 1), weaknessQualified: hasRootWeakness,
        baseGain: shared.highlightGain * (context.concertAtActionStart ? 2 : 1), weaknessGain: 0,
        eligibilityReason: 'explicit_replay_scalar_override',
        packetCount: context.packets.filter(packet => packet.rootCast && packet.actualDamage > 0).length }];
      ruleId = context.concertAtActionStart
        ? 'explicit_replay_scalar_override_concert'
        : 'explicit_replay_scalar_override';
    } else if (usesCastBonus) {
      // The candidate doubles only the action base. Each eligible cast can
      // supply one weakness supplement, regardless of hit or target count.
      const actionBaseGain = context.concertAtActionStart ? shared.highlightConcertNormalActionGain : shared.highlightNormalActionGain;
      let rootBaseGranted = false;
      contributions = context.casts.filter(cast => cast.root || cast.repeatReason === confirmedBerryKillReset || knownNestedCast(cast)).map(cast => {
        const packets = context.packets.filter(packet => packet.castId === cast.castId && packet.actualDamage > 0);
        const weaknessQualified = packets.some(packet => packet.weakness);
        const isKillReset = cast.repeatReason === confirmedBerryKillReset;
        const grantsBase = cast.root ? !rootBaseGranted : isKillReset && packets.length > 0;
        if (cast.root) rootBaseGranted = true;
        const baseGain = grantsBase ? actionBaseGain : 0;
        const weaknessGain = weaknessQualified ? shared.highlightWeaknessCastBonus : 0;
        return { cast, baseGain, weaknessGain, requestedGain: baseGain + weaknessGain,
          weaknessQualified, packetCount: packets.length,
          eligibilityReason: cast.root ? 'counted_action'
            : isKillReset ? 'confirmed_berry_s1_kill_reset' : `${cast.nestedWeaknessEligibility}_weakness_only` };
      });
      // Guard and other counted actions without a root skill still earn the base.
      if (!rootBaseGranted) contributions.unshift({ cast: null, baseGain: actionBaseGain, weaknessGain: 0,
        requestedGain: actionBaseGain, weaknessQualified: false, packetCount: 0, eligibilityReason: 'counted_action_without_skill' });
      ruleId = 'opt_in_observed_base_double_weak_cast_bonus';
    } else {
      const qualifyingCasts = context.casts.filter(cast => cast.root || cast.repeatReason === confirmedBerryKillReset);
      // A root support action has no damage packets but still receives its one
      // confirmed action charge. A kill-reset cast must have resolved actual
      // damage before it can contribute its own one-time action-equivalent rate.
      contributions = qualifyingCasts.filter(cast => cast.root
        || context.packets.some(packet => packet.castId === cast.castId && packet.actualDamage > 0)).map(cast => {
        const packets = context.packets.filter(packet => packet.castId === cast.castId && packet.actualDamage > 0);
        const weaknessQualified = packets.some(packet => packet.weakness);
        const requestedGain = context.concertAtActionStart
          ? (weaknessQualified ? shared.highlightConcertWeaknessActionGain : shared.highlightConcertNormalActionGain)
          : (weaknessQualified ? shared.highlightWeaknessActionGain : shared.highlightNormalActionGain);
        const baseGain = context.concertAtActionStart ? shared.highlightConcertNormalActionGain : shared.highlightNormalActionGain;
        return { cast, requestedGain, baseGain, weaknessGain: requestedGain - baseGain,
          eligibilityReason: cast.root ? 'counted_action' : 'confirmed_berry_s1_kill_reset',
          weaknessQualified, packetCount: packets.length };
      });
      // Guard has no skill cast, but it remains a confirmed counted action.
      if (!contributions.length) contributions = [{ cast: null,
        requestedGain: context.concertAtActionStart ? shared.highlightConcertNormalActionGain : shared.highlightNormalActionGain,
        baseGain: context.concertAtActionStart ? shared.highlightConcertNormalActionGain : shared.highlightNormalActionGain,
        weaknessGain: 0, eligibilityReason: 'counted_action_without_skill',
        weaknessQualified: false, packetCount: 0 }];
      ruleId = context.concertAtActionStart
        ? 'confirmed_concert_normal_weakness_cast_rates'
        : 'confirmed_normal_weakness_cast_rates';
    }
    if (hasUnconfirmedRepeatDamage) this.reportSharedHighlightLimitation(context, 'additional repeat contribution is unconfirmed');
    if (hasNestedAutomaticDamage) this.reportSharedHighlightLimitation(context, 'automatic follow-up contribution is unconfirmed');
    context.weaknessQualified = hasRootWeakness;
    context.contributions = contributions.map(({ cast, requestedGain, baseGain, weaknessGain, eligibilityReason, weaknessQualified, packetCount }) => ({
      castId: cast?.castId || null, rootCast: cast?.root ?? true, repeatReason: cast?.repeatReason || null,
      requestedGain, baseGain, weaknessGain, eligibilityReason, weaknessQualified, packetCount
    }));
    context.requestedGain = contributions.reduce((sum, contribution) => sum + contribution.requestedGain, 0);
    context.ruleId = ruleId;
    shared.lastHighlightActionContext = clone(context);
    let result = null;
    for (const [index, contribution] of contributions.entries()) {
      const userCorrection = contribution.cast?.repeatReason === confirmedBerryKillReset;
      result = this.gainSharedHighlight(contribution.requestedGain, sourceType, {
        actionId: context.actionId, actionContext: clone(context), castId: contribution.cast?.castId || null,
        castOrdinal: index + 1, castGain: contribution.requestedGain, packetCount: contribution.packetCount,
        baseGain: contribution.baseGain, weaknessGain: contribution.weaknessGain, eligibilityReason: contribution.eligibilityReason,
        repeatReason: contribution.cast?.repeatReason || null, weaknessQualified: contribution.weaknessQualified,
        concertAtActionStart: context.concertAtActionStart, ruleId,
        evidence: usesCastBonus ? 'opt_in_hypothesis_hachiman_t5_t7_2026-09-05'
          : userCorrection ? 'user_correction_berry_s1_kill_reset_2026-09-05' : shared.highlightEvidence
      });
    }
    return result;
  }

  getHighlightActions() {
    if (this.state.phase !== 'battle' || this.state.sharedCombat.pendingTurnCompletion) return [];
    const sharedReady = this.usesLiveMechanics() && Number(this.state.sharedCombat.highlight || 0) >= 100;
    return this.state.party.filter(unit => unit.hp > 0 && !unit.kotone?.cold && (this.usesLiveMechanics() ? sharedReady : unit.highlight >= 100)).flatMap(unit => {
      if (this.isJc(unit)) {
        return unit.selectedMasks.map(mask => {
          const skill = this.jcHighlightSkill(mask);
          return { type: 'highlight_interrupt', actorId: unit.id, skillId: skill.id, name: skill.name, target: skill.target, enabled: true, skill };
        });
      }
      if (this.isMarian(unit)) {
        const skill = {
          ...clone(unit.highlightSkill), id: `highlight:${unit.id}`, slot: 'HL', target: 'ally',
          marianHighlight: true, buff: undefined, buffTarget: undefined
        };
        return [{ type: 'highlight_interrupt', actorId: unit.id, skillId: skill.id, name: `${unit.codename} Highlight`, target: 'ally', enabled: true, skill }];
      }
      const skill = unit.highlightSkill ? { ...clone(unit.highlightSkill), id: `highlight:${unit.id}`, slot: 'HL' } : { id: `highlight:${unit.id}`, slot: 'HL', name: `${unit.codename} Highlight`,
        element: unit.id === 'wonder' ? this.activePersona.element : unit.element, power: 2.8, target: 'boss',
        note: 'Interrupt action. Does not consume the current turn action.' };
      return [{
        type: 'highlight_interrupt', actorId: unit.id, skillId: `highlight:${unit.id}`, name: `${unit.codename} Highlight`,
        target: skill.target, enabled: true, skill
      }];
    }).map(action => {
      const unit = byId(this.state.party, action.actorId);
      const key = action.skill.jcHighlightMask || 'HL';
      const cooldownRemaining = this.usesLiveMechanics() ? Number(unit.highlightCooldowns[key] || 0) : 0;
      const unavailableReason = (unit.slug === 'bui-cosmic' && !this.usesLiveMechanics() ? 'Cosmic Yui requires the live mechanics profile.' : this.unsupportedActionReason(action.skill))
        || characterHook(this, unit, 'actionUnavailableReason', action.skill, 'highlight');
      return { ...action, cooldownRemaining, unavailableReason, enabled: !unavailableReason && cooldownRemaining === 0, statusLabel: unavailableReason ? 'NOT IMPLEMENTED' : cooldownRemaining ? `CD ${cooldownRemaining}` : 'READY' };
    });
  }

  getObservation() {
    return clone({ ...this.state, enemies: this.enemies, currentActorId: this.actor?.id || null,
      highlight: this.getHighlightState(),
      actionQueue: this.getActionQueue(),
      weakened: this.isBossWeakened(), weakenedTurnsLeft: this.weakenedTurnsLeft(),
      canBreakBoss: this.canBreakBoss(),
      canToggleTrueDesire: this.canToggleTrueDesire(),
      berryAltActions: this.getBerryAltActions(),
      availableActions: this.getAvailableActions(), navigatorActions: this.getNavigatorActions(), highlightActions: this.getHighlightActions(), medicineActions: this.getMedicineActions(), itemActions: this.getItemActions() });
  }

  canBreakBoss() {
    return this.state.phase === 'battle'
      && this.state.boss.modeId === 'nexus'
      && this.state.boss.breakPending
      && !this.state.boss.weakenedActive
      && this.state.actorIndex === 0
      && this.state.turnActionsUsed === 0;
  }

  stepBreak() {
    if (!this.canBreakBoss()) throw new Error('Boss break is only available at an Attack Turn boundary after reaching the HP lock');
    this.state.lastEvents = [];
    this.state.boss.breakPending = false;
    this.state.boss.weakenedActive = true;
    this.state.boss.weakenedTurnsLeft = this.state.boss.weakenedTurns || 2;
    this.state.attackTurnsLeft = Math.max(this.state.attackTurnsLeft, this.state.boss.weakenedTurnsLeft);
    this.state.boss.breakTurn = this.state.attackTurn;
    this.state.boss.phaseIndex = Math.min(1, this.state.boss.phases.length - 1);
    this.emit('break', `${this.state.boss.name} broke on Attack Turn ${this.state.attackTurn}. The 2-turn Weakened scoring window is active.`, { tone: 'phase' });
    this.recordFrame('Break HP Lock');
    return { nextState: this.config.fastMode ? null : this.getObservation(), reward: 0, done: false, consumedAction: false, events: this.config.fastMode ? [] : clone(this.state.history.at(-1).events) };
  }

  canToggleLifeSustainment() {
    return this.state.phase === 'battle'
      && this.state.boss.modeId === 'devourer'
      && (this.state.boss.encounter?.soulLink === true || this.isHachimanDevourer())
      && !this.state.boss.weakenedPending
      && !this.state.boss.weakenedActive;
  }

  setLifeSustainment(enabled) {
    if (!this.canToggleLifeSustainment()) throw new Error('Life Sustainment can only be changed during a Devourer of Dreams player turn');
    this.state.lastEvents = [];
    this.state.boss.lifeSustainment = enabled === true;
    this.emit('mechanic', `Life Sustainment switched ${this.state.boss.lifeSustainment ? 'ON. Linked enemies stop at 1 HP.' : 'OFF. Linked HP can now reach 0 and open the infinite HP Weakened phase.'}`, { tone: 'phase' });
    this.recordFrame(`Life Sustainment ${this.state.boss.lifeSustainment ? 'On' : 'Off'}`);
    return { nextState: this.config.fastMode ? null : this.getObservation(), reward: 0, done: false, consumedAction: false, events: this.config.fastMode ? [] : clone(this.state.history.at(-1).events) };
  }

  canToggleTrueDesire() {
    const actor = this.actor;
    return this.state.phase === 'battle'
      && this.isJc(actor)
      && actor.awareness >= 6
      && (!this.usesLiveMechanics() || !actor.trueDesirePrimed)
      // Power to Resist Ruin is stored at the start of J&C's turn. Automatic
      // opening S3 resolves before this boundary without consuming an action.
      && (!this.usesLiveMechanics() || this.state.turnActionsUsed === 0)
      && (actor.trueDesireStacks > 0 || actor.trueDesirePrimed);
  }

  setTrueDesire(enabled) {
    if (this.usesLiveMechanics() && enabled !== true) throw new Error('Power to Resist Ruin is a stored enhancement and cannot be canceled');
    if (!this.canToggleTrueDesire()) throw new Error('True Desire can only be changed during an A6 J&C player turn while a stack is available');
    const actor = this.actor;
    const next = enabled === true;
    if (actor.trueDesirePrimed === next) {
      return { nextState: this.config.fastMode ? null : this.getObservation(), reward: 0, done: false, consumedAction: false, events: [] };
    }
    this.state.lastEvents = [];
    actor.trueDesirePrimed = next;
    if (this.usesLiveMechanics() && next) actor.trueDesireStacks = Math.max(0, actor.trueDesireStacks - 1);
    this.emit('resource', this.usesLiveMechanics() ? `${actor.codename} spent 1 True Desire to store Power to Resist Ruin for the next Two Masks as One.` : `${actor.codename} switched True Desire ${next ? 'ON. The next Two Masks as One will spend 1 stack.' : 'OFF. The stack remains available.'}`, {
      actorId: actor.id, resource: 'trueDesire', amount: actor.trueDesireStacks, enabled: next, tone: 'phase'
    });
    this.recordFrame(`True Desire ${next ? 'On' : 'Off'}`);
    return { nextState: this.config.fastMode ? null : this.getObservation(), reward: 0, done: false, consumedAction: false, events: this.config.fastMode ? [] : clone(this.state.history.at(-1).events) };
  }

  liveDamageFactors(unit, element, target, sourceType = null, actionDamageBonus = 0, additionalBonuses = []) {
    // Original combat research: https://forum.gamer.com.tw/G2.php?bsn=71034&sn=112
    // Damage bonus, elemental bonus and damage taken share one additive bucket.
    // Source-specific and kit-only categories below retain provisional placement.
    const bonuses = [];
    const add = (id, value) => { if (Number(value)) bonuses.push({ id, value: Number(value) }); };
    add('equipped_damage_bonus', unit.damageBonus);
    if (this.isSurtLive()) add('surt_ragnarok_damage', Number(unit.ragnarokStacks || 0) * 0.05);
    if (unit.elementBonus?.element === element) add('equipped_element_bonus', unit.elementBonus.value);
    for (const buff of unit.buffs.filter(effect => !effect.stat || effect.stat === 'damage')) add(buff.id, buff.value);
    for (const buff of unit.buffs.filter(effect => effect.stat === 'elementDamage' && effect.element === element)) add(buff.id, buff.value);
    if (this.isHachimanLive() && element === 'curse') add('dreamscape_curse_bonus', 0.2);
    if (this.isSurtLive() && element === 'ice') add('surt_party_ice_damage', this.state.boss.encounter?.partyIceDamageBonus);
    if (this.isSurtLive() && sourceType === 'gun') {
      add('surt_ranged_damage', this.state.boss.encounter?.rangedDamageBonus);
      add('surt_gun_damage', this.state.boss.encounter?.gunDamageBonus);
    }
    add('action_damage_bonus', actionDamageBonus);
    for (const [id, value] of this.stageDamageBonuses(unit, element)) add(id, value);
    if (target.downed) add('downed_damage_taken', target.downedDamageTaken ?? 0.1);
    const elementalExposure = target.debuffs.find(effect => effect.id === `${element}_vuln`);
    if (elementalExposure) add(elementalExposure.id, elementalExposure.value);
    for (const exposure of target.debuffs.filter(effect => effect.elementDamageTaken === element)) {
      add(exposure.id, exposure.elementDamageTakenValue ?? exposure.value);
    }
    for (const exposure of target.debuffs.filter(effect => effect.damageTaken || effect.id === 'damage_taken' || effect.id === 'minion_break')) add(exposure.id, exposure.value);
    // Skill-conditional bonuses worded "increase skill damage by N%" (Vorpal
    // Butterfly's +200% above 70% HP) add into this bucket on the Hachiman path.
    // Established from the fully itemized T1 Berry hit (431,626) and her T2-start
    // status list on 2026-09-06; see HACHIMAN-STAT-EVIDENCE-2026-09-06.md.
    for (const [id, value] of additionalBonuses) add(id, value);
    const damageBonusMultiplier = Math.max(0, 1 + bonuses.reduce((sum, entry) => sum + entry.value, 0));
    let affinityMultiplier = isWeakTo(target, element) ? 1.25 : 1;
    if (isWeakTo(target, element)) affinityMultiplier *= 1 + unit.buffs.filter(effect => effect.stat === 'weaknessDamage').reduce((sum, effect) => sum + (effect.value || 0), 0);
    if (this.resistsElement(target, element)) affinityMultiplier *= 0.7;
    const sourceStat = { resonance_follow_up: 'resonanceDamage', highlight: 'highlightDamage', dot: 'dotDamage', one_more: 'oneMoreDamage', all_out_attack: 'oneMoreDamage', cosmic_all_out_attack: 'allOutDamage' }[sourceType];
    let sourceMultiplier = 1;
    if (sourceStat) {
      sourceMultiplier *= 1 + unit.buffs.filter(effect => (effect.stat === sourceStat || (sourceType === 'cosmic_all_out_attack' && effect.stat === 'oneMoreDamage'))).reduce((sum, effect) => sum + (effect.value || 0), 0) + (sourceType === 'dot' ? 0.3 : 0);
    }
    // Mine Alone Chain 2 (in-game text 2026-09-06): "all of Ichigo's skill damage is
    // counted as continuous damage". Skills and their repeats convert; the
    // Highlight is not skill damage and keeps its own category.
    if (this.isBerry(unit) && unit.chainsOfLove >= 2 && ['character_skill', 'berry_repeat'].includes(sourceType)) {
      sourceMultiplier *= 1.3 + unit.buffs.filter(effect => effect.stat === 'dotDamage').reduce((sum, effect) => sum + (effect.value || 0), 0);
    }
    let kitMultiplier = 1;
    if (this.isWavecatcher(unit) && unit.surfActive) kitMultiplier *= 1.3;
    if (target.downed && this.isAkihiko(unit)) kitMultiplier *= unit.awareness >= 2 ? 1.4 : 1.3;
    if (this.isAkihiko(unit) && unit.awareness >= 6) kitMultiplier *= 1 + unit.gritStacks * 0.08;
    if (this.isRin(unit) && target.debuffs.some(effect => effect.countsAsBurn === true || effect.id === 'rin_burn')) kitMultiplier *= 1.36;
    if (this.state.party.some(member => this.isMatoi(member)) && target.debuffs.some(effect => ['matoi_freeze', 'matoi_icebound'].includes(effect.id))) kitMultiplier *= 1.27;
    let finalDamageMultiplier = this.dreamscapeDamageTakenMultiplier(target);
    for (const buff of unit.buffs.filter(effect => effect.stat === 'finalDamage')) finalDamageMultiplier *= 1 + (buff.value || 0);
    if (this.isVirtualConcertActive() && ['highlight', 'theurgy'].includes(sourceType)) finalDamageMultiplier *= 1.1;
    return {
      bonuses, damageBonusMultiplier, affinityMultiplier, sourceMultiplier, kitMultiplier, finalDamageMultiplier,
      multiplier: damageBonusMultiplier * affinityMultiplier * sourceMultiplier * kitMultiplier * finalDamageMultiplier,
      provisionalCategories: ['Affinity coefficients and weakness-bonus placement', 'Source-specific damage and Berry continuous-damage conversion', 'Kit-only conditional multipliers', 'Stacking between separate final-damage effects']
    };
  }

  hachimanDamageFactors(unit, element, target, sourceType = null, actionDamageBonus = 0, additionalBonuses = []) {
    return this.liveDamageFactors(unit, element, target, sourceType, actionDamageBonus, additionalBonuses);
  }

  statusMultiplier(unit, element, target, sourceType = null) {
    if (this.usesLiveMechanics()) return this.liveDamageFactors(unit, element, target, sourceType).multiplier;
    let multiplier = 1 + (unit.damageBonus || 0);
    if (this.isWavecatcher(unit) && unit.surfActive) multiplier *= 1.3;
    if (unit.elementBonus?.element === element) multiplier *= 1 + unit.elementBonus.value;
    for (const buff of unit.buffs.filter(effect => !effect.stat || effect.stat === 'damage')) multiplier *= 1 + (buff.value || 0);
    multiplier *= 1 + this.stageDamageBonuses(unit, element).reduce((sum, [, value]) => sum + value, 0);
    for (const buff of unit.buffs.filter(effect => effect.stat === 'elementDamage' && effect.element === element)) multiplier *= 1 + (buff.value || 0);
    if (isWeakTo(target, element)) multiplier *= 1.25;
    if (isWeakTo(target, element)) {
      const weaknessDamage = unit.buffs.filter(effect => effect.stat === 'weaknessDamage').reduce((sum, effect) => sum + (effect.value || 0), 0);
      multiplier *= 1 + weaknessDamage;
    }
    if ((target.resistance === element || (this.usesLiveMechanics() && target.resistances?.includes(element))) && !this.hasResistanceBreak(target, element)) multiplier *= 0.7;
    if (this.isHachimanLive() && element === 'curse') multiplier *= 1.2;
    if (this.usesLiveMechanics()) multiplier *= this.dreamscapeDamageTakenMultiplier(target);
    if (this.isSurtLive() && element === 'ice') multiplier *= 1 + Number(this.state.boss.encounter?.partyIceDamageBonus || 0);
    if (this.isSurtLive() && sourceType === 'gun') {
      const encounter = this.state.boss.encounter || {};
      multiplier *= 1 + Number(encounter.rangedDamageBonus || 0) + Number(encounter.gunDamageBonus || 0);
    }
    if (target.downed) multiplier *= 1 + Number(target.downedDamageTaken ?? 0.1);
    if (target.downed && this.isAkihiko(unit)) multiplier *= unit.awareness >= 2 ? 1.4 : 1.3;
    if (this.isAkihiko(unit) && unit.awareness >= 6) multiplier *= 1 + unit.gritStacks * 0.08;
    const targetHas = id => target.debuffs?.some(effect => effect.id === id) === true;
    const targetCountsAsBurn = target.debuffs?.some(effect => effect.countsAsBurn === true || effect.id === 'rin_burn') === true;
    if (this.isRin(unit) && targetCountsAsBurn) multiplier *= 1.36;
    if (this.state.party.some(member => this.isMatoi(member)) && (targetHas('matoi_freeze') || targetHas('matoi_icebound'))) multiplier *= 1.27;
    const elementalExposure = target.debuffs.find(effect => effect.id === `${element}_vuln`);
    if (elementalExposure) multiplier *= 1 + elementalExposure.value;
    for (const exposure of target.debuffs.filter(effect => effect.elementDamageTaken === element)) {
      multiplier *= 1 + (exposure.elementDamageTakenValue ?? exposure.value ?? 0);
    }
    for (const exposure of target.debuffs.filter(effect => effect.damageTaken || effect.id === 'damage_taken' || effect.id === 'minion_break')) {
      multiplier *= 1 + (exposure.value || 0);
    }
    const sourceStat = {
      resonance_follow_up: 'resonanceDamage',
      highlight: 'highlightDamage',
      dot: 'dotDamage',
      one_more: 'oneMoreDamage',
      all_out_attack: 'oneMoreDamage',
      cosmic_all_out_attack: 'allOutDamage'
    }[sourceType];
    if (sourceStat) {
      const sourceBonus = unit.buffs.filter(effect => (effect.stat === sourceStat || (sourceType === 'cosmic_all_out_attack' && effect.stat === 'oneMoreDamage'))).reduce((sum, effect) => sum + (effect.value || 0), 0);
      const dreamscapeContinuousDamageBonus = this.isHachimanLive() && sourceType === 'dot' ? 0.3 : 0;
      multiplier *= 1 + sourceBonus + dreamscapeContinuousDamageBonus;
    }
    if (this.isBerry(unit) && unit.chainsOfLove >= 2 && ['character_skill', 'highlight', 'berry_repeat'].includes(sourceType)) {
      const convertedContinuousDamage = unit.buffs.filter(effect => effect.stat === 'dotDamage').reduce((sum, effect) => sum + (effect.value || 0), 0);
      // Berry's confirmed Chain conversion treats continuous-damage bonuses as
      // direct-skill amplification. Add Dreamscape's mode bonus here, once,
      // rather than as a general party buff that would double-count it.
      const dreamscapeConvertedContinuousDamage = this.isHachimanLive() ? 0.3 : 0;
      multiplier *= 1 + convertedContinuousDamage + dreamscapeConvertedContinuousDamage;
    }
    for (const buff of unit.buffs.filter(effect => effect.stat === 'finalDamage')) multiplier *= 1 + (buff.value || 0);
    if (this.usesLiveMechanics() && this.isVirtualConcertActive()
      && ['highlight', 'theurgy'].includes(sourceType)) {
      multiplier *= 1.1;
    }
    return multiplier;
  }

  potentMedicineAttackBonus(unit) {
    if (!this.marian()) return 0;
    const types = new Set(unit.buffs.filter(effect => effect.potentMedicineType).map(effect => effect.potentMedicineType));
    return types.size * 0.15;
  }

  calculateDamage(actor, skill, target, sourceType = null, { prepared = false } = {}) {
    if (this.kotoneMechanics?.state) this.kotoneMechanics.refreshAuras();
    if (!prepared) skill = prepareCharacterDamage(this, actor, skill, target, sourceType);
    const damageSourceType = skill.damageClass || sourceType;
    if (sourceType === 'dot' && skill.lovesickSnapshots) return this.calculateLovesickSnapshotDamage(actor, skill, target);
    const technical = this.technicalOutcome(actor, skill, target, sourceType);
    const phase = target.id === this.state.boss.id ? this.state.boss.phases[this.state.boss.phaseIndex] : null;
    const sourcedHachiman = this.isHachimanLive();
    const sourcedLive = this.usesLiveMechanics();
    const sourceScaleFormula = this.usesSourceScaleDamageFormula();
    const defDown = sourceScaleFormula
      ? target.debuffs.filter(effect => effect.id === 'def_down' || effect.stat === 'defenseDown' || effect.id === 'berry_lovesick_defense').reduce((sum, effect) => sum + Number(effect.value || 0), 0)
      : Math.max(
      target.debuffs.filter(effect => effect.id === 'def_down').reduce((max, effect) => Math.max(max, effect.value), 0),
      target.debuffs.filter(effect => effect.stat === 'defenseDown').reduce((max, effect) => Math.max(max, effect.value), 0)
    )
      + target.debuffs.filter(effect => effect.id === 'berry_lovesick_defense').reduce((sum, effect) => sum + effect.value, 0);
    const effectiveDefDown = defDown + Number(skill.temporaryDefenseDown || 0);
    const gritPierce = this.isAkihiko(actor) ? actor.gritStacks * 0.04 : 0;
    const moonPierce = this.isMakoto(actor) ? actor.moonPhaseStacks * 0.12 : 0;
    const pierce = skill.lovesickSnapshotCapture ? 0 : Number(actor.pierceRate || 0)
      + actor.buffs.filter(effect => effect.stat === 'pierce').reduce((value, effect) => (sourceScaleFormula || this.kotoneMechanics?.active) ? value + (effect.value || 0) : Math.max(value, effect.value || 0), 0)
      + gritPierce + moonPierce + Number(skill.temporaryPierce || 0);
    const totalDefense = phase?.defense ?? target.defense ?? this.state.boss.defense;
    // Hachiman's actual total/base Defense remains unknown. Existing encounter
    // values (boss 385, idols 240) are explicit provisional inputs, not fitted.
    const baseDefense = phase?.baseDefense ?? target.baseDefense ?? totalDefense;
    const defense = sourceScaleFormula
      ? Math.max(0, totalDefense - baseDefense * Math.max(0, effectiveDefDown)) * (1 - clamp(pierce, 0, 1))
      : (phase?.defense || target.defense || this.state.boss.defense) * (1 - clamp(effectiveDefDown, 0, 0.7)) * (1 - clamp(pierce, 0, 0.7));
    const variance = skill.lovesickSnapshotCapture ? 1 : sourceScaleFormula ? 0.95 + this.random() * 0.1 : 0.96 + this.random() * 0.08;
    const criticalBuff = actor.buffs.filter(effect => effect.stat === 'critRate').reduce((sum, effect) => sum + (effect.value || 0), 0);
    const rawCritRate = skill.forcedTheurgy && skill.guaranteedCritical ? 1 : actor.crit + criticalBuff + (skill.critBonus || 0);
    const critRoll = skill.lovesickSnapshotCapture ? 1 : this.random();
    const stableDomainCritConversion = this.usesStableDomainCritConversion(actor, damageSourceType);
    const critical = !stableDomainCritConversion
      && skill.canCrit !== false && !(technical?.activated && technical.canCrit === false) && (skill.guaranteedCritical === true
      || critRoll < clamp(rawCritRate, 0, 0.95));
    const cursedTiesAttackBonus = skill.lovesickSnapshotCapture ? 0 : this.cursedTiesAttackBonus(actor, target);
    const attackBuff = actor.buffs.filter(effect => effect.stat === 'attack').reduce((sum, effect) => sum + (effect.value || 0), 0)
      + this.potentMedicineAttackBonus(actor) + Number(skill.temporaryAttackBonus || 0) + cursedTiesAttackBonus + this.surtAttackBonus()
      + this.revelationWeakElementAttackBonus(actor, target);
    const flatAttack = actor.buffs.filter(effect => effect.stat === 'flatAttack').reduce((sum, effect) => sum + (effect.value || 0), 0);
    const critDamageBuff = actor.buffs.filter(effect => effect.stat === 'critDamage'
      || (effect.stat === 'elementCritDamage' && effect.element === skill.element)).reduce((sum, effect) => sum + (effect.value || 0), 0);
    const skillAmplification = skill.lovesickSnapshotCapture ? 0 : actor.buffs.filter(effect => effect.stat === 'skillAmplification').reduce((sum, effect) => sum + (effect.value || 0), 0);
    const scalingValue = skill.scalingStat === 'maxHp' ? actor.maxHp : this.buffedAttack(actor, attackBuff, flatAttack);
    let power = skill.power;
    const hachimanAdditionalBonuses = [];
    // An infinite-HP score target always counts as above 70% HP (Joker confirmed the
    // condition active on Hachiman); its tracked hp only records damage dealt.
    const targetHpRatio = target.finiteHp === false || target.scoreAttack ? 1 : target.hp / target.maxHp;
    if (this.isBerry(actor) && skill.name === 'Vorpal Butterfly' && targetHpRatio > 0.7) {
      // Sourced text: "increase skill damage by 200%". On the Hachiman path it
      // adds into the single damage bucket; elsewhere it retains the x3 power.
      if (sourcedLive) hachimanAdditionalBonuses.push(['vorpal_butterfly_high_hp', 2]);
      else power *= 3;
    }
    if (this.isBerry(actor) && skill.name === 'My Beloved Prince') power += this.lovesickStacks(target, actor) * this.berryTierValue(actor, skill, [0.117, 0.129, 0.124, 0.136]);
    const defenseMultiplier = sourceScaleFormula
      ? 1400 / (1400 + (skill.ignoreDefense ? 0 : defense))
      : 760 / (260 + (skill.ignoreDefense ? 0 : defense));
    const base = sourceScaleFormula
      ? scalingValue * power * (1 + skillAmplification) * defenseMultiplier
      : scalingValue * power * (1 + skillAmplification) * 760 / (260 + (skill.ignoreDefense ? 0 : defense));
    const statusFactors = sourcedLive ? this.liveDamageFactors(actor, skill.element, target, damageSourceType, skill.actionDamageBonus, hachimanAdditionalBonuses) : null;
    const multiplier = statusFactors?.multiplier ?? this.statusMultiplier(actor, skill.element, target, damageSourceType) * (1 + Number(skill.actionDamageBonus || 0));
    const uncappedCriticalMultiplier = (actor.critMult || 1.5) + critDamageBuff + Number(skill.temporaryCritDamage || 0)
      + this.surtResonanceCritDamageBonus(damageSourceType);
    // Forced Theurgy skills (Kotone support) carry an explicit critical multiplier range.
    const criticalMultiplier = skill.criticalMultiplierMin != null
      ? clamp(uncappedCriticalMultiplier, skill.criticalMultiplierMin, skill.criticalMultiplierMax)
      : uncappedCriticalMultiplier;
    const criticalHitDamageMultiplier = Math.max(0, Number(characterHook(this, actor,
      'criticalHitDamageMultiplier', skill, target, sourceType) || 1));
    const dreamscapeSkillCritBonus = stableDomainCritConversion
      ? clamp(rawCritRate, 0, 1) * Math.max(0, criticalMultiplier * criticalHitDamageMultiplier - 1)
      : null;
    const critDamageMultiplier = dreamscapeSkillCritBonus == null
      ? (critical ? criticalMultiplier * criticalHitDamageMultiplier : 1)
      : 1 + dreamscapeSkillCritBonus;
    const normalization = sourceScaleFormula ? 1 : 100;
    const amount = Math.max(1, Math.round(base * multiplier * variance * critDamageMultiplier * (technical?.damageMultiplier || 1) * normalization));
    return { amount, critical, ...(skill.damageClass ? { damageClass: skill.damageClass } : {}), weakness: isWeakTo(target, skill.element), defense: Math.round(defense), multiplier,
      ...(skill.lovesickSnapshotCapture ? { lovesickSnapshot: {
        base, multiplier, normalization, noncriticalDamage: base * multiplier * normalization,
        scalingValue, power, defenseMultiplier, defenseDown: defDown, pierce: 0, actorAttack: actor.attack,
        targetId: target.id, ...(statusFactors ? { factors: clone(statusFactors) } : {})
      } } : {}),
      ...(sourceScaleFormula ? { damageFormula: {
        model: sourcedLive ? 'current_source_scale_formula_provisional_inputs' : 'archived_formula', sourceUrl: 'https://forum.gamer.com.tw/G2.php?bsn=71034&sn=112',
        totalDefense, baseDefense, baseDefenseFallback: phase?.baseDefense == null && target.baseDefense == null,
        defenseInputsStatus: 'unverified_encounter_inputs', defenseDown: effectiveDefDown, pierce, effectiveDefense: defense, defenseMultiplier,
        actorAttack: actor.attack, attackBuff, flatAttack, scalingValue, power, skillAmplification, base,
        ...statusFactors, variance, rawCritRate, criticalMultiplier, criticalHitDamageMultiplier, dreamscapeSkillCritBonus,
        critDamageMultiplier, technicalMultiplier: technical?.damageMultiplier || 1, normalization, amount
      } } : {}),
      ...(cursedTiesAttackBonus ? { cursedTiesAttackBonus } : {}), ...(technical ? { technical } : {}) };
  }

  applyStatus(list, status, sourceType = 'skill') {
    const sourced = { ...clone(status), sourceType };
    const statusKey = effect => `${this.usesLiveMechanics() && effect.provenance?.originalCasterId ? `${effect.provenance.originalCasterId}:` : ''}${effect.sourceSkillId ? `${effect.sourceSkillId}:` : ''}${effect.id}`;
    const existing = list.find(effect => statusKey(effect) === statusKey(sourced));
    if (existing) Object.assign(existing, sourced);
    else list.push(sourced);
    return sourced;
  }

  liveSkillBuffStatus(skill, status) {
    const buff = clone(status);
    // Generic catalog statuses reuse IDs such as crit_rate_up. In the live
    // profile, retain the originating skill so separately sourced effects can
    // coexist while a cast of the same skill still refreshes its own status.
    if (this.usesLiveMechanics() && skill?.id && buff?.id) buff.sourceSkillId = skill.id;
    return buff;
  }

  applyEnemyStatus(enemy, listName, status, sourceType = 'skill', sourceActorId = null) {
    if (!enemy || !['buffs', 'debuffs'].includes(listName)) return null;
    if (this.usesLiveMechanics() && listName === 'debuffs' && this.isSpiritualOrControlStatus(status)
      && enemy.immunities?.some(kind => ['spiritual_ailment', 'control_ailment'].includes(kind))) {
      this.emit('immune', `${enemy.name} is immune to ${status.name || status.id}.`, { targetId: enemy.id, sourceType, tone: 'system' });
      return null;
    }
    const owned = this.usesEnemyTimeline()
      ? { ...clone(status), ownerId: enemy.id, sourceActorId, durationClock: 'owner_action' }
      : status;
    return this.applyStatus(enemy[listName], owned, sourceType);
  }


  // Hachiman (T6 status list, 2026-09-06): buff values granted by skills, Highlights,
  // medicines and navigator songs while Skill Amplification is active are scaled by
  // (1 + amplification) at cast time (Universal Theoria 33 to 38.6, Summer Garden
  // 45.5 to 53.2, Tarukaja 28.5 to 33.3 under the +17% Two Masks amplification).
  // Navigator effects use the highest party amplification; that scope is assumed.
  skillAmplificationFor(caster) {
    return (caster?.buffs || []).filter(effect => effect.stat === 'skillAmplification').reduce((sum, effect) => sum + Number(effect.value || 0), 0);
  }

  amplifiedSkillStatus(status, sourceType, explicitCaster = null) {
    if ((!this.isHachimanLive() && explicitCaster?.id !== KOTONE_SHIOMI_ID) || !status || status.amplifiedBySkillAmplification) return status;
    const amplifiable = ['character_skill', 'persona_skill', 'highlight', 'medicine', 'navigator', 'skill'].includes(sourceType);
    const percentStat = ['attack', 'damage', 'critDamage', 'critRate', 'pierce', 'defense', 'dotDamage', 'weaknessDamage', 'highlightDamage', 'finalDamage'].includes(status.stat);
    if (!amplifiable || !percentStat || !Number.isFinite(Number(status.value))) return status;
    const amplification = sourceType === 'navigator'
      ? Math.max(0, ...this.state.party.map(unit => this.skillAmplificationFor(unit)))
      : this.skillAmplificationFor(explicitCaster || this.actor);
    if (!(amplification > 0)) return status;
    return { ...status, baseValue: status.value, value: Number(status.value) * (1 + amplification), amplifiedBySkillAmplification: amplification };
  }

  applyUnitBuff(unit, status, sourceType = 'skill', origin = null) {
    // Only instrument normal skill/Highlight scope; never infer passive ownership.
    if (!origin && this.kotoneMechanics?.active && ['character_skill', 'persona_skill', 'highlight'].includes(sourceType)) origin = this.supportCastContext;
    const caster = origin?.casterId ? byId(this.state.party, origin.casterId) : null;
    const resolved = this.surfAdjustedStatus(unit, this.amplifiedSkillStatus(status, sourceType, caster));
    if (!this.usesLiveMechanics()) return this.applyStatus(unit.buffs, resolved, sourceType);
    // Do not infer the caster from the recipient or the actor whose turn it is.
    // Uninstrumented legacy passives remain explicitly unknown, and non-copyable.
    const owned = effectProvenance(this.state.supportRuntime, resolved, {
      casterId: origin?.casterId || null, skillId: origin?.skillId || null,
      castId: origin?.castId || null, recipientId: unit.id, kind: 'buff', sourceType
    });
    return this.applyStatus(unit.buffs, owned, sourceType);
  }

  setSupportEquipmentStats(actorId, specification) {
    if (!this.usesLiveMechanics()) throw new Error('Support equipment is not enabled in recorded replays');
    const actor = byId(this.state.party, actorId);
    if (!actor) throw new Error('Unknown equipment owner');
    // Caller supplies an explicit accounting model. This is NOT a Kotone weapon profile.
    const stats = equippedAttack(specification);
    actor.attack = stats.attack;
    actor.mechanicAttack = stats.attack;
    actor.supportEquipmentAccounting = { ...clone(specification), ...stats };
    this.emit('equipment_stats', `${actor.codename} Attack and support scaling updated.`, { actorId, attack: stats.attack, statsMode: specification.mode, sourceType: 'support_equipment', tone: 'system' });
    return stats;
  }

  copySupportEffects(effects, policy) {
    if (!this.usesLiveMechanics()) throw new Error('Support copies are not enabled in recorded replays');
    const recipient = byId(this.state.party, policy?.recipientId);
    if (!recipient || recipient.hp <= 0) throw new Error('Copy recipient must be a living ally');
    if (!byId(this.state.party, policy.copyingActorId) ||
        !policy.sourceCasterIds?.every(id => this.state.party.some(unit => unit.id === id))) throw new Error('Copy source/copying actor must be allies');
    const results = effects.map(effect => {
      const liveOriginal = this.state.party.flatMap(unit => unit.buffs)
        .find(buff => buff.provenance?.instanceId && buff.provenance.instanceId === effect?.provenance?.instanceId);
      if (!liveOriginal) return { applied: false, reason: 'effect is not a current ally buff' };
      const prepared = prepareSupportCopy(liveOriginal, policy);
      const result = prepared.eligible ? commitSupportCopy(this.state.supportRuntime, recipient, prepared) : { applied: false, reason: prepared.reason };
      if (result.applied) this.emit('support_copy', `${result.effect.name} applied to ${recipient.codename}.`, {
        actorId: policy.copyingActorId, targetId: recipient.id, originalCasterId: result.effect.provenance.originalCasterId,
        status: clone(result.effect), sourceType: 'support_copy', tone: 'buff'
      });
      return result;
    });
    return results;
  }

  advanceSupportTiming(actorId, kind) {
    if (!this.usesLiveMechanics()) return;
    const expired = advanceSupportClocks(this.state.supportRuntime, this.state.party, { actorId, kind });
    for (const item of expired) this.emit('status_expired', `${item.effect.name} expired.`, {
      actorId, targetId: item.recipientId, status: item.effect, sourceType: 'support_clock', tone: 'system'
    });
  }

  queueSupportAction(action) {
    if (!this.usesLiveMechanics()) throw new Error('Support scheduling is not enabled in recorded replays');
    if (this.state.phase !== 'battle') throw new Error('Encounter is over');
    const owner = byId(this.state.party, action?.actorId);
    const skill = owner && [...this.skillsFor(owner), ...(owner.highlightSkill ? [owner.highlightSkill] : [])].find(skill => skill.id === action.skillId);
    // A missing Theurgy is a hard error, never an invented generic Highlight.
    if (!owner || owner.hp <= 0 || !skill || skill.supportExecutable !== true) throw new Error('Support action requires a living owner and an explicitly implemented executable skill');
    if (action.kind === 'automatic_theurgy' && skill.supportActionKind !== 'theurgy') throw new Error('A Theurgy action requires an implemented Theurgy skill');
    if (action.kind === 'automatic_highlight' && skill.slot !== 'HL') throw new Error('A Highlight action requires an implemented Highlight skill');
    const added = enqueueSupportAction(this.state.supportRuntime, action);
    if (added) this.emit('support_queued', `${owner.codename}: ${skill.name} queued as ${action.kind}.`, { actorId: owner.id, sourceType: 'support_queue', tone: 'phase' });
    return added;
  }

  supportActionDescriptor() {
    const queued = this.state.supportRuntime?.actions[0];
    if (!queued) return null;
    const owner = byId(this.state.party, queued.actorId);
    const skill = owner && [...this.skillsFor(owner), ...(owner.highlightSkill ? [owner.highlightSkill] : [])].find(skill => skill.id === queued.skillId);
    return { type: 'support_extra', skillId: `support/${queued.idempotencyKey}`, actorId: queued.actorId,
      name: `${owner?.codename || queued.actorId} · ${skill?.name || queued.skillId}`, enabled: true,
      target: skill?.target || 'boss', skill, queued: clone(queued) };
  }

  resolveNextSupportAction() {
    if (this.state.phase !== 'battle') throw new Error('Encounter is over');
    const descriptor = this.supportActionDescriptor();
    if (!descriptor) throw new Error('No scheduled support action');
    const queued = descriptor.queued;
    const owner = byId(this.state.party, queued.actorId);
    this.state.lastEvents = [];
    if (!owner || owner.hp <= 0) {
      completeSupportAction(this.state.supportRuntime, queued);
      this.emit('support_cancelled', 'Scheduled action cancelled: its owner is defeated.', { actorId: queued.actorId, tone: 'system' });
      this.recordFrame('Cancelled extra action');
      return { reward: 0, done: false, consumedAction: false, events: clone(this.state.log.slice(-1)) };
    }
    if (!queued.ignoreCost && owner.sp < Number(descriptor.skill.cost || 0)) throw new Error('Scheduled skill has insufficient SP');
    const sourceType = queued.kind === 'automatic_highlight' ? 'highlight' : queued.kind === 'automatic_theurgy' ? 'theurgy' : owner.id === 'wonder' ? 'persona_skill' : 'character_skill';
    const reward = this.resolveSkill(owner, descriptor.skill, queued.targetId, sourceType, { ignoreCost: queued.ignoreCost, grantsHighlight: false });
    completeSupportAction(this.state.supportRuntime, queued);
    this.advanceSupportTiming(owner.id, queued.kind === 'extra_skill' ? 'extra_action' : 'interrupt');
    // No normal action budget, cooldown, gauge consumption or owner-turn recovery.
    this.emit('support_resolved', `${descriptor.name} resolved without advancing the normal turn.`, { actorId: owner.id, sourceType, kind: queued.kind, tone: 'phase' });
    this.updateBossPhase();
    if (this.allEnemiesDefeated()) this.finish('victory');
    const events = clone(this.state.lastEvents);
    this.recordFrame(descriptor.name);
    return { nextState: this.config.fastMode ? null : this.getObservation(), reward,
      done: this.state.phase !== 'battle', consumedAction: false, events };
  }

  isSpiritualOrControlStatus(status) {
    const id = String(status?.id || '').toLowerCase();
    return status?.spiritualAilment === true || status?.controlAilment === true || status?.unableToAct === true
      || ['fear', 'despair', 'brainwash', 'forget', 'sleep', 'rage', 'confuse', 'confusion', 'dizzy'].includes(id);
  }

  applyUnitDebuff(unit, status, sourceType = 'skill') {
    if (this.isWavecatcher(unit) && unit.surfActive && this.isSpiritualOrControlStatus(status)) return null;
    return this.applyStatus(unit.debuffs, this.surfAdjustedStatus(unit, status), sourceType);
  }

  hasEnemyStatus(target, id) {
    return target?.debuffs?.some(effect => effect.id === id) === true;
  }


  applyRinFireworkFinale(actor, targets) {
    for (const target of targets) {
      if (target.alive === false) continue;
      if (this.random() < 0.9) {
        const burn = this.applyEnemyStatus(target, 'debuffs', {
          id: 'rin_burn', name: 'BURN', element: 'fire', countsAsBurn: true, continuousDamage: false, damageOmitted: true,
          powerPerStack: null, duration: null, durationKnown: false, sourceUrl: actor.sourceUrl || null
        }, 'character_skill', actor.id);
        if (burn) this.emit('debuff', `${target.name} was inflicted with Burn.`, { actorId: actor.id, targetId: target.id, status: clone(burn), sourceType: 'character_skill', tone: 'debuff' });
      }
      if (this.random() < 0.9) this.addRinYearEndFlames(actor, target);
    }
    actor.rinYanhuaFlamesChance = 0.9;
  }


  convertBurnToScald(actor) {
    const targets = this.enemies.filter(target => target.alive !== false);
    if (!targets.some(target => target.debuffs.some(effect => effect.countsAsBurn === true || effect.id === 'rin_burn'))) return false;
    for (const target of targets) {
      target.debuffs = target.debuffs.filter(effect => !(effect.countsAsBurn === true || effect.id === 'rin_burn'));
      if (this.hasEnemyStatus(target, 'matoi_scald')) continue;
      const scald = this.applyEnemyStatus(target, 'debuffs', {
        id: 'matoi_scald', name: 'SCALD', countsAsBurn: true, duration: 3, durationKnown: true,
        technicalPrecision: 1381, sourceUrl: actor.sourceUrl || null
      }, 'character_skill', actor.id);
      if (scald) this.emit('debuff', `${target.name}'s Burn became Scald.`, { actorId: actor.id, targetId: target.id, status: clone(scald), sourceType: 'character_skill', tone: 'debuff' });
    }
    return true;
  }



  grantBlessing(recipients, amount = 1, sourceType = 'skill') {
    const marianPresent = Boolean(this.marian());
    for (const unit of recipients.filter(Boolean)) {
      unit.blessingStacks = clamp((unit.blessingStacks || 0) + amount, 0, 6);
      if (marianPresent) {
        this.applyUnitBuff(unit, {
          id: 'marian_blessing_damage', name: `BLESSING x${unit.blessingStacks}`,
          stat: 'damage', value: unit.blessingStacks * 0.06, duration: 999,
          stacks: unit.blessingStacks
        }, sourceType);
      }
      this.emit('resource', `${unit.codename} gained Blessing ${unit.blessingStacks}.`, {
        actorId: unit.id, resource: 'blessingStacks', amount: unit.blessingStacks, sourceType, tone: 'buff'
      });
    }
  }

  allyTargetsForSkill(actor, skill, targetId) {
    const targetType = skill.buffTarget || skill.healTarget || skill.target;
    if (targetType === 'party') return this.state.party.filter(unit => unit.hp > 0);
    if (targetType !== 'ally') return [];
    const selected = byId(this.state.party, targetId);
    if (selected && selected.hp > 0 && selected.id !== actor.id) return [selected];
    const fallback = this.state.party.filter(unit => unit.hp > 0 && unit.id !== actor.id).sort((a, b) => b.attack - a.attack)[0];
    return fallback ? [fallback] : [];
  }

  triggerSoothingSunlight(actor, skill, targetId, sourceType = 'passive') {
    if (!this.isMarian(actor)) return;
    const recipients = this.allyTargetsForSkill(actor, skill, targetId);
    if (recipients.length) this.grantBlessing(recipients, 1, sourceType);
  }

  hasTrustProsperityRevelation(unit) {
    return this.usesLiveMechanics()
      && unit?.revelationMain === 'Trust'
      && unit?.revelationSet === 'Prosperity';
  }

  // Strife 4-set: a further Attack bonus against an enemy weak to the set's element.
  revelationWeakElementAttackBonus(actor, target) {
    const bonus = actor?.revelationWeakElementAttack;
    if (!this.usesLiveMechanics() || !bonus || !target || !isWeakTo(target, bonus.element)) return 0;
    return Number(bonus.value || 0);
  }

  // Elec Break / Fire Break style debuffs remove one element's resistance while active.
  hasResistanceBreak(target, element) {
    return (target?.debuffs || []).some(effect => effect.resistanceBreak === element && (effect.duration == null || effect.duration > 0));
  }

  resistsElement(target, element) {
    return (target?.resistance === element || target?.resistances?.includes(element) === true) && !this.hasResistanceBreak(target, element);
  }

  hasNativityStrifeRevelation(unit) {
    return this.usesLiveMechanics()
      && unit?.revelationMain === 'Nativity'
      && unit?.revelationSet === 'Strife';
  }

  // Nativity + Strife: at battle start or at the start of the wearer's extra action,
  // party critical damage +10%, permanent, up to 2 stacks. Stacks are tracked per
  // wearer; the source does not say whether two wearers share one cap.
  triggerNativityStrife(unit, reason) {
    if (!this.hasNativityStrifeRevelation(unit) || unit.hp <= 0) return;
    const stacks = Number(unit.nativityStrifeStacks || 0);
    if (stacks >= 2) return;
    unit.nativityStrifeStacks = stacks + 1;
    const buff = {
      id: `revelation_nativity_strife_crit_${unit.id}`, name: 'NATIVITY + STRIFE',
      stat: 'critDamage', value: 0.1 * unit.nativityStrifeStacks, duration: null,
      stacks: unit.nativityStrifeStacks, maxStacks: 2, evidence: 'lufelnet_revelations_nativity_strife'
    };
    for (const ally of this.state.party.filter(member => member.hp > 0)) this.applyUnitBuff(ally, buff, 'revelation');
    this.emit('buff', `Nativity + Strife (${unit.codename}, ${reason}): party critical damage +${10 * unit.nativityStrifeStacks}% (${unit.nativityStrifeStacks}/2).`, {
      actorId: unit.id, targetId: 'party', status: { ...clone(buff), sourceType: 'revelation' },
      sourceType: 'revelation', tone: 'buff'
    });
  }

  notifyExtraActionStart(actor, reason = 'extra action') {
    this.triggerNativityStrife(actor, reason);
  }

  triggerTrustProsperity(actor, skill, sourceType = 'character_skill') {
    if (!this.hasTrustProsperityRevelation(actor)) return;
    const targetType = skill.buffTarget || skill.healTarget || skill.target;
    if (!['ally', 'party', 'all_allies'].includes(targetType)) return;
    // The source states two rounds but not its precise clock. Unit buffs already
    // use the simulator's shared end-of-round duration tick, so this effect does too.
    const buff = {
      id: 'revelation_trust_prosperity_damage', name: 'TRUST + PROSPERITY',
      stat: 'damage', value: 0.08, duration: 2, durationClock: 'shared_round_end',
      evidence: 'lufelnet_revelations_trust_prosperity'
    };
    for (const unit of this.state.party.filter(unit => unit.hp > 0)) this.applyUnitBuff(unit, buff, sourceType);
    this.emit('buff', 'Trust + Prosperity increased party damage by 8% for 2 rounds.', {
      actorId: actor.id, targetId: 'party', status: { ...clone(buff), sourceType },
      sourceType, tone: 'buff'
    });
  }

  healingMultiplier(actor) {
    const weaponHealing = actor?.buffs?.filter(effect => effect.stat === 'healing').reduce((sum, effect) => sum + Number(effect.value || 0), 0) || 0;
    return 1 + Number(actor?.healingBonus || 0) + weaponHealing;
  }

  shieldMultiplier(actor) {
    const weaponShield = actor?.buffs?.filter(effect => effect.stat === 'shieldPotency').reduce((sum, effect) => sum + Number(effect.value || 0), 0) || 0;
    return 1 + Number(actor?.shieldBonus || 0) + weaponShield;
  }

  healUnit(actor, unit, rawAmount) {
    if (this.usesLiveMechanics() && unit.hp <= 0) return 0;
    const amount = Math.max(0, Math.round(rawAmount * this.healingMultiplier(actor)));
    const actual = Math.min(amount, unit.maxHp - unit.hp);
    unit.hp += actual;
    return actual;
  }




  grantTheurgyGauge(unit, amount, sourceType = 'character_skill') {
    if (!unit || !Number.isFinite(Number(unit.theurgyMax)) || amount <= 0) return { granted: 0, reserved: 0 };
    const nominalAmount = Number(amount);
    const concertMultiplier = this.usesLiveMechanics() && this.isVirtualConcertActive() ? 2 : 1;
    const requestedAmount = nominalAmount * concertMultiplier;
    const room = Math.max(0, unit.theurgyMax - unit.theurgyGauge);
    const granted = Math.min(room, requestedAmount);
    const reserved = Math.min(35, Math.max(0, requestedAmount - granted));
    unit.theurgyGauge += granted;
    if (reserved > 0) {
      unit.theurgyReserve = Math.min(35, (unit.theurgyReserve || 0) + reserved);
      unit.theurgyReserveTurns = 2;
    }
    this.emit('resource', `${unit.codename} gained ${granted} Theurgy gauge${reserved ? ` and reserved ${reserved}` : ''}.`, {
      actorId: unit.id, resource: 'theurgyGauge', amount: unit.theurgyGauge,
      reserve: unit.theurgyReserve || 0, requestedAmount, nominalAmount, concertMultiplier,
      sourceType, tone: 'buff'
    });
    return { granted, reserved, requestedAmount, nominalAmount, concertMultiplier };
  }




  applyMikuPartyBuff(status) {
    const sourced = { ...status, mikuGranted: true };
    for (const unit of this.state.party) {
      // Virtual Concert copies of a song effect do not stack with the same
      // effect already granted by the current song. Joker's T6 status list
      // (2026-09-06, mid-Concert) shows one Feel the Beat ATK, one Clear Sound
      // DMG, one Play-With-Fire crit damage and one Spring Storm weakness entry,
      // not two of each. An active regular copy is kept and extended instead.
      // Current-profile boss encounters share this rule. Archived recorded
      // profiles retain their captured stacking behavior.
      if (sourced.regularId && this.usesLiveMechanics()) {
        const existing = unit.buffs.find(effect => effect.id === sourced.regularId);
        if (existing) {
          if (Number.isFinite(existing.duration) && Number.isFinite(sourced.duration)) existing.duration = Math.max(existing.duration, sourced.duration);
          continue;
        }
      }
      this.applyUnitBuff(unit, sourced, 'navigator');
    }
  }

  healMikuParty(percent) {
    let healed = 0;
    for (const unit of this.state.party) {
      if (this.usesLiveMechanics() && unit.hp <= 0) continue;
      const amount = Math.round(unit.maxHp * percent);
      const actual = Math.min(amount, unit.maxHp - unit.hp);
      unit.hp += actual;
      healed += actual;
    }
    this.emit('heal', `The party recovered ${healed.toLocaleString()} HP from MIKU.`, {
      amount: healed, targetId: 'party', sourceType: 'navigator', tone: 'heal'
    });
  }



  startVirtualConcert(action) {
    const concert = this.state.navigator.virtualConcert;
    concert.active = true;
    concert.roundsRemaining = 2;
    concert.damageByTarget = {};
    concert.totalRecordedDamage = 0;
    concert.savedTurn = {
      actorIndex: this.state.actorIndex,
      turnActionsUsed: this.state.turnActionsUsed,
      turnActionsTotal: this.state.turnActionsTotal
    };
    this.state.navigator.tracks = [];
    this.state.navigator.currentSong = 'Ghost Rule';

    for (const unit of this.state.party) {
      for (const buff of unit.buffs.filter(effect => effect.mikuGranted)) buff.duration += 2;
      unit.sp = clamp(unit.sp + 35, 0, this.spCap(unit));
      if (Number(this.state.navigator.awareness || 0) >= 1 && !this.usesLiveMechanics()) unit.highlight = 100;
      if (this.usesLiveMechanics()) {
        // J&C keeps one independent clock per selected mask. Reset every
        // stored key and its grace marker with the rest of the party.
        for (const key of Object.keys(unit.highlightCooldowns)) unit.highlightCooldowns[key] = 0;
        unit.highlightCooldownGrace = {};
        this.emit('cooldown_reset', `${unit.codename}'s Highlight cooldowns reset immediately.`, { actorId: unit.id, sourceType: 'virtual_concert', tone: 'buff' });
      }
    }
    // Recorded live T5 activation preserves the shared gauge at 0%.
    // Resetting Highlight cooldowns does not refill the party's gauge.

    if (Number(this.state.navigator.awareness || 0) >= 2) {
      this.applyMikuPartyBuff({ id: 'miku_concert_feel_attack', name: 'CONCERT FEEL ATK', stat: 'attack', value: 0.305, duration: 2, concertOnly: true, regularId: 'miku_feel_attack' });
      this.applyMikuPartyBuff({ id: 'miku_concert_clear_damage', name: 'CONCERT CLEAR DMG', stat: 'damage', value: 0.183, duration: 2, concertOnly: true, regularId: 'miku_clear_damage' });
      for (const song of mikuSongs) {
        this.applyMikuSongEffect('Feel the Beat', song, 2, 'miku_concert');
        this.applyMikuSongEffect('Clear Sound', song, 2, 'miku_concert');
      }
      this.applyMikuPartyBuff({ id: 'miku_concert_a2_damage', name: 'VIRTUAL CONCERT AMP', stat: 'finalDamage', value: 0.08, duration: 2, concertOnly: true });
    }
    this.applyMikuPartyBuff({ id: 'miku_concert_fan_favorite', name: 'FAN FAVORITE', stat: 'damage', value: 0.24, duration: 2, concertOnly: true });
    this.applyMikuPartyBuff({ id: 'miku_concert_crit_damage', name: 'GHOST RULE CRIT DMG', stat: 'critDamage', value: 0.183, duration: 2, concertOnly: true });
    for (const track of ['Break', 'Critical', 'Expert']) {
      this.applyMikuPartyBuff({ id: `miku_concert_setlist_${track.toLowerCase()}`, name: `CONCERT SETLIST ${track.toUpperCase()}`, stat: 'attack', value: 0.12, duration: 2, concertOnly: true, regularId: `miku_setlist_${track.toLowerCase()}` });
    }

    this.state.navigator.cooldowns[action.id] = 6;
    this.state.actorIndex = this.state.party.findIndex(unit => unit.hp > 0);
    if (this.state.actorIndex < 0) return this.finish('defeat');
    this.state.turnActionsUsed = 0;
    this.state.turnActionsTotal = this.actor?.actionLimit || 1;
    this.beginActorTurn();
    this.emit('concert_start', 'Virtual Concert began. Ghost Rule grants two uncounted ally turns and freezes support cooldowns.', {
      actorId: this.state.navigator.id, sourceType: 'navigator', roundsRemaining: 2, tone: 'phase'
    });
  }

  recordVirtualConcertDamage(targetId, amount, sourceType) {
    if (!this.isVirtualConcertActive() || sourceType === 'miku_a6_echo' || amount <= 0) return;
    const concert = this.state.navigator.virtualConcert;
    concert.damageByTarget[targetId] = (concert.damageByTarget[targetId] || 0) + amount;
    concert.totalRecordedDamage += amount;
  }

  finishVirtualConcert() {
    const concert = this.state.navigator.virtualConcert;
    if (!concert?.active) return;
    const awareness = Number(this.state.navigator.awareness || 0);
    if (awareness >= 6) {
      const triggerActor = this.state.party[concert.savedTurn?.actorIndex] || null;
      for (const target of this.enemies) {
        const recorded = Math.max(0, Math.round(concert.damageByTarget[target.id] || 0));
        if (recorded <= 0) continue;
        const hpBefore = target.hp;
        const actual = this.applyEnemyDamage(target, recorded);
        this.state.navigator.damageDone += actual;
        this.state.totalDamage += actual;
        this.addDamageScore(actual, this.state.navigator, target);
        this.emit('damage', `${target.name} took ${actual.toLocaleString()} fixed Almighty damage from Neverending Song.`, {
          amount: actual, targetId: target.id, element: 'almighty', sourceType: 'miku_a6_echo', fixedDamage: true,
          recordedConcertDamage: recorded, tone: 'critical'
        });
        if (target.id !== this.state.boss.id && !target.scoreAttack && target.hp <= 0) this.defeatSummon(target);
        this.processEncounterDamageTriggers(triggerActor, target, hpBefore, target.hp);
      }
    }
    for (const unit of this.state.party) unit.buffs = unit.buffs.filter(effect => !effect.concertOnly);
    const savedTurn = concert.savedTurn;
    concert.active = false;
    concert.roundsRemaining = 0;
    concert.savedTurn = null;
    this.state.navigator.songIndex = 0;
    this.state.navigator.currentSong = 'Heaven';
    if (this.usesLiveMechanics()) {
      // Live T7 permits a ready support skill after Concert despite returning
      // to the same normal Attack Turn in which Showstopper was activated.
      this.state.navigator.lastUsedAttackTurn = 0;
    }
    if (savedTurn) {
      this.state.actorIndex = savedTurn.actorIndex;
      this.state.turnActionsUsed = savedTurn.turnActionsUsed;
      this.state.turnActionsTotal = savedTurn.turnActionsTotal;
    }
    this.emit('concert_end', `Virtual Concert ended. Neverending Song repeated ${concert.totalRecordedDamage.toLocaleString()} recorded damage across living targets.`, {
      actorId: this.state.navigator.id, sourceType: 'miku_a6_echo', recordedDamage: concert.totalRecordedDamage, tone: 'phase'
    });
    if (this.state.party.every(unit => unit.hp <= 0)) return this.finish('defeat');
    if (this.actor?.hp <= 0) this.advanceActor();
  }

  resolveStatus(status, actor) {
    const resolved = clone(status);
    if (!resolved.scaling) return resolved;
    const scaling = resolved.scaling;
    const stat = Number(actor[scaling.stat] || 0);
    const capped = Math.min(stat, Number(scaling.cap ?? stat));
    const steps = scaling.per ? Math.floor(capped / scaling.per) : 0;
    const uncappedBonus = steps * Number(scaling.step || 0);
    const bonus = Number.isFinite(Number(scaling.maxBonus))
      ? Math.min(uncappedBonus, Number(scaling.maxBonus))
      : uncappedBonus;
    resolved.value = Number(scaling.base || 0) + bonus;
    return resolved;
  }

  initializeCharacterPassives() {
    for (const rin of this.state.party.filter(unit => this.isRin(unit))) {
      this.applyUnitBuff(rin, { id: 'rin_happy_new_year', name: 'HAPPY NEW YEAR!', stat: 'attack', value: 0.42, duration: 2 }, 'passive');
    }
    for (const berry of this.state.party.filter(unit => this.isBerry(unit))) {
      this.refreshBerryPassives(berry);
      for (const unit of this.state.party) this.applyUnitBuff(unit, { id: 'berry_party_dot', name: 'MELTING ICHI-GO BUTTER', stat: 'dotDamage', value: 0.15, duration: 999 }, 'passive');
    }
    const miyu = this.state.party.find(unit => this.isWavecatcher(unit));
    if (miyu) {
      const hangTen = Math.min(miyu.spRecovery, 280) * (0.98 / 280);
      this.applyUnitBuff(miyu, {
        id: 'miyu_hang_ten_attack', name: 'HANG TEN ATK', stat: 'attack',
        value: hangTen, duration: 999, spRecovery: miyu.spRecovery
      }, 'passive');
    }

    const marian = this.state.party.find(unit => this.isMarian(unit));
    if (marian) {
      marian.medicineEffectBonus = marian.awareness >= 1 ? 0.20 : 0;
      for (const unit of this.state.party) {
        this.applyUnitBuff(unit, {
          id: 'marian_blossoms_attack', name: 'BLOSSOMS BY THE BEACH',
          stat: 'attack', value: 0.12, duration: 999
        }, 'passive');
      }
    }

    const yukari = this.state.party.find(unit => this.isYukari(unit));
    if (yukari) {
      const hpIncrease = Math.min(2700, Math.floor(yukari.mechanicAttack / 100) * 60);
      yukari.maxHp += hpIncrease;
      yukari.hp += hpIncrease;
      for (const unit of this.state.party) {
        this.applyUnitBuff(unit, {
          id: 'yukari_tailwinds_air', name: "TAILWIND'S AIR",
          stat: 'highlightDamage', value: 0.45, duration: 999
        }, 'passive');
      }
    }

    this.initializeJcPassives();
  }




  lovesickStatus(target, actor) { return target.debuffs.find(effect => effect.id === 'berry_lovesick' && effect.sourceActorId === actor.id); }
  lovesickStacks(target, actor) { return this.lovesickStatus(target, actor)?.stacks || 0; }

  defaultLovesickDefinition(actor) {
    // Game glossary transcription, independent of the recorded battle score.
    // https://megatenwiki.com/wiki/Ichigo_Shikano
    const level = Number(actor.level ?? 80);
    return { powerPerStack: level >= 70 ? 0.18 : level >= 50 ? 0.12 : 0.06,
      duration: 4, stackCap: 10, level, element: 'curse',
      sourceUrl: 'https://megatenwiki.com/wiki/Ichigo_Shikano' };
  }

  captureLovesickSnapshot(actor, target, powerPerStack) {
    // Lufel's original mechanics table freezes noncritical factors at application.
    // https://lufel.net/character.html?lang=en&name=%EC%9D%B4%EC%B9%98%EA%B3%A0
    return this.calculateDamage(actor, { name: 'Lovesick snapshot', element: 'curse',
      power: powerPerStack, canCrit: false, lovesickSnapshotCapture: true }, target, 'dot').lovesickSnapshot;
  }

  calculateLovesickSnapshotDamage(actor, skill, target) {
    const rawCritRate = actor.crit + actor.buffs.filter(effect => effect.stat === 'critRate').reduce((sum, effect) => sum + (effect.value || 0), 0);
    const criticalMultiplier = (actor.critMult || 1.5) + actor.buffs.filter(effect => effect.stat === 'critDamage').reduce((sum, effect) => sum + (effect.value || 0), 0);
    const variance = this.isHachimanLive() ? 0.95 + this.random() * 0.1 : 0.96 + this.random() * 0.08;
    const critRoll = this.random();
    const critical = skill.canCrit === true && critRoll < clamp(rawCritRate, 0, 0.95);
    // Hachiman: the tick is a "set amount" (status text) reconstructed from T1
    // as stacks x 18% x Attack with no damage bucket. Two forms fit the T1 tick
    // within 5%; the configured model selects one. See the 2026-09-06 evidence.
    // The 2026-09-06 T6 capture showed a single Lovesick activation of 2,043,037, so
    // activations carry the buffed snapshot; the flat forms remain what-if options.
    const tickModel = this.isHachimanLive() ? (this.config.hachimanLovesickTickModel || 'per_stack_snapshot') : 'per_stack_snapshot';
    const noncriticalDamage = skill.lovesickSnapshots.reduce((sum, cohort) => {
      const snapshot = cohort.snapshot;
      if (tickModel === 'flat_base_attack') return sum + cohort.stacks * snapshot.power * Number(snapshot.actorAttack ?? snapshot.scalingValue);
      if (tickModel === 'flat_buffed_attack_defense') return sum + cohort.stacks * snapshot.power * snapshot.scalingValue * Number(snapshot.defenseMultiplier ?? 1);
      return sum + cohort.stacks * snapshot.noncriticalDamage;
    }, 0);
    const critDamageMultiplier = critical ? criticalMultiplier : 1;
    const amount = Math.max(1, Math.round(noncriticalDamage * variance * critDamageMultiplier));
    return { amount, critical, weakness: isWeakTo(target, 'curse'), multiplier: 1,
      damageFormula: { model: tickModel === 'per_stack_snapshot' ? 'lovesick_per_stack_snapshot' : `lovesick_${tickModel}`,
        sourceUrl: actor.lovesickDefinition?.sourceUrl, trigger: skill.lovesickTrigger,
        snapshots: clone(skill.lovesickSnapshots), noncriticalDamage, variance,
        rawCritRate, criticalMultiplier, critDamageMultiplier, dreamscapeSkillCritBonus: null,
        pierce: 0, amount, limitations: ['Highlight-trigger Pierce excluded pending evidence',
          'First all-DoT Highlight tick conservatively noncritical', 'One critical roll per activation; per-stack roll granularity unverified'] } };
  }

  refreshLovesickDebuffs(target, actor) {
    const status = this.lovesickStatus(target, actor);
    if (!status) return;
    this.applyEnemyStatus(target, 'debuffs', { id: 'berry_lovesick_exposure', name: 'LOVESICK EXPOSURE', value: actor.chainsOfLove >= 1 ? status.stacks * 0.04 : 0,
      damageTaken: true, duration: status.duration, sourceActorId: actor.id }, 'awareness', actor.id);
    if (actor.awareness >= 1) this.applyEnemyStatus(target, 'debuffs', { id: 'berry_lovesick_defense', name: 'LOVESICK DEFENSE DOWN', value: status.stacks * 0.03,
      duration: status.duration, sourceActorId: actor.id }, 'awareness', actor.id);
  }

  addLovesick(actor, target, count, transferredSnapshots = null) {
    if (!count || target.alive === false) return;
    const definition = actor.lovesickDefinition || this.defaultLovesickDefinition(actor);
    const knownCap = actor.awareness >= 6 ? 15 : Number.isInteger(definition?.stackCap) && definition.stackCap > 0 ? definition.stackCap : Infinity;
    const previous = this.lovesickStatus(target, actor);
    const previousStacks = previous?.stacks || 0;
    const stacks = Math.min(knownCap, previousStacks + count);
    const status = { id: 'berry_lovesick', name: `LOVESICK x${stacks}`, stacks, sourceActorId: actor.id,
      duration: definition?.duration ?? null, durationClock: 'owner_action', durationKnown: Boolean(definition?.duration),
      continuousDamage: true, powerPerStack: definition?.powerPerStack ?? null, sourceUrl: definition?.sourceUrl || null,
      snapshots: clone(previous?.snapshots || []) };
    this.applyEnemyStatus(target, 'debuffs', status, 'character_skill', actor.id);
    this.refreshLovesickDebuffs(target, actor);
    const applied = this.lovesickStatus(target, actor);
    let remaining = stacks - previousStacks;
    if (transferredSnapshots) {
      for (const cohort of transferredSnapshots) {
        const accepted = Math.min(remaining, cohort.stacks);
        if (accepted > 0) applied.snapshots.push({ stacks: accepted, snapshot: clone(cohort.snapshot) });
        remaining -= accepted;
      }
    }
    if (remaining > 0 && definition.powerPerStack > 0) applied.snapshots.push({ stacks: remaining,
      snapshot: this.captureLovesickSnapshot(actor, target, definition.powerPerStack) });
    this.emit('resource', `${target.name} has ${stacks} Lovesick stacks.`, { actorId: actor.id, targetId: target.id, resource: 'lovesick', amount: stacks, durationKnown: status.durationKnown, tone: 'debuff' });
  }

  triggerContinuousDamage(target, { lovesickOnly = false, trigger = 'owner_action', includeSharedDot = true } = {}) {
    let damage = 0;
    for (const status of [...target.debuffs].filter(effect => effect.continuousDamage && (!lovesickOnly || effect.id === 'berry_lovesick'))) {
      if (status.sharedDot && !includeSharedDot) continue;
      if (status.sharedDot && trigger === 'owner_action' && status.timing !== 'target_turn_end') continue;
      const actor = byId(this.state.party, status.sourceActorId);
      if (!actor) continue;
      const power = status.powerPerStack == null ? status.power : status.powerPerStack * (status.stacks || 1);
      if (!(power > 0)) {
        this.emit('unmodeled_dot', `${status.name} triggered. Its source does not specify the base damage coefficient; damage is omitted.`, { actorId: actor.id, targetId: target.id, trigger, statusId: status.id, sourceType: 'dot', tone: 'system' });
        continue;
      }
      const skill = { id: `${status.id}_tick`, name: `${status.name} tick`, element: status.element || 'curse', power, target: 'boss', cost: 0,
        canCrit: status.id === 'berry_lovesick' ? trigger !== 'berry_highlight' && target.debuffs.some(effect => effect.id === 'berry_lovesick_crit') : status.canCrit === true,
        ...(status.id === 'berry_lovesick' && status.snapshots?.length ? { lovesickSnapshots: clone(status.snapshots), lovesickTrigger: trigger } : {}) };
      damage += this.resolveSkill(actor, skill, target.id, 'dot', { ignoreCost: true, grantsHighlight: false, canReduceDown: false, skipBerryMechanics: true });
    }
    return damage;
  }



  initializeJcPassives() {
    const actor = this.state.party.find(unit => this.isJc(unit));
    if (!actor) return;
    const pair = jcPairKey(actor.selectedMasks);
    if (pair === 'mischief+service') {
      actor.healingBonus += 0.21;
      for (const unit of this.state.party) this.applyUnitBuff(unit, { id: 'jc_oxymoron_damage', name: 'OXYMORON DMG', stat: 'damage', value: 0.24, duration: 999 }, 'passive');
    } else if (pair === 'absurdity+mischief') {
      actor.speed += 5;
      for (const unit of this.state.party) this.applyUnitBuff(unit, { id: 'jc_oxymoron_attack', name: 'OXYMORON ATK', stat: 'attack', value: 0.3, duration: 999 }, 'passive');
    } else if (pair === 'luck+mischief') {
      this.applyUnitBuff(actor, { id: 'jc_oxymoron_crit', name: 'OXYMORON CRIT', stat: 'critRate', value: 0.15, duration: 999 }, 'passive');
    } else if (pair === 'absurdity+service') {
      actor.shieldBonus += 0.21;
    } else if (pair === 'luck+service') {
      actor.speed += 5;
      for (const enemy of this.enemies) this.applyEnemyStatus(enemy, 'debuffs', { id: 'jc_oxymoron_exposure', name: 'OXYMORON EXPOSURE', damageTaken: true, value: 0.24, duration: 999 }, 'passive', actor.id);
    } else if (pair === 'absurdity+luck') {
      this.applyUnitBuff(actor, { id: 'jc_oxymoron_crit_damage', name: 'OXYMORON CRIT DMG', stat: 'critDamage', value: 0.3, duration: 999 }, 'passive');
    }
    if (actor.awareness >= 2) {
      for (const facade of actor.facades) this.applyJcFacadeAwareness(actor, facade);
    }
  }



  applyJcMaskEffect(actor, mask) {
    const desireRatio = actor.desireLevel / 100;
    if (mask === 'mischief') {
      const buff = { id: 'jc_mischief_attack', name: 'MISCHIEF ATK', stat: 'attack', value: 0.454 * desireRatio, duration: 3 };
      for (const unit of this.state.party) this.applyUnitBuff(unit, buff, 'character_skill');
    } else if (mask === 'service') {
      let healed = 0;
      for (const unit of this.state.party) {
        healed += this.healUnit(actor, unit, actor.attack * 0.404 + 3480);
        this.applyUnitBuff(unit, {
          id: 'jc_service_reduction', name: 'SERVICE DAMAGE REDUCTION', stat: 'damageReduction',
          value: 0.114 * (1 + desireRatio), duration: 3
        }, 'character_skill');
      }
      this.emit('heal', `${actor.codename} restored ${healed.toLocaleString()} party HP.`, { amount: healed, targetId: 'party', sourceType: 'character_skill', tone: 'heal' });
    } else if (mask === 'absurdity') {
      const pierce = 0.057 * (1 + desireRatio);
      this.applyUnitBuff(actor, { id: 'jc_absurdity_pierce', name: 'ABSURDITY PIERCE', stat: 'pierce', value: pierce, duration: 3 }, 'character_skill');
      const target = this.state.party.filter(unit => unit.id !== actor.id && ['Sweeper', 'Assassin'].includes(unit.role)).sort((a, b) => b.attack - a.attack)[0];
      if (target) this.applyUnitBuff(target, { id: 'jc_absurdity_pierce', name: 'ABSURDITY PIERCE', stat: 'pierce', value: pierce, duration: 3 }, 'character_skill');
    } else if (mask === 'luck') {
      const factor = 1 + desireRatio;
      this.applyUnitBuff(actor, { id: 'jc_luck_attack', name: 'LUCK ATK', stat: 'attack', value: 0.17 * factor, duration: 3 }, 'character_skill');
      this.applyUnitBuff(actor, { id: 'jc_luck_damage', name: 'LUCK DMG', stat: 'damage', value: 0.114 * factor, duration: 3 }, 'character_skill');
      this.applyUnitBuff(actor, { id: 'jc_luck_crit', name: 'LUCK CRIT', stat: 'critRate', value: 0.057 * factor, duration: 3 }, 'character_skill');
    }
  }

  applyJcTwoMaskEffects(actor, facadePair, enhanced, mainTarget = this.state.boss) {
    const pairs = enhanced
      ? ['mischief+service', 'absurdity+mischief', 'luck+mischief', 'absurdity+service', 'luck+service', 'absurdity+luck']
      : [jcPairKey(facadePair)];
    const desireRatio = this.jcEffectiveDesire(actor, true) / 100;
    for (const pair of pairs) {
      if (pair === 'mischief+service') {
        let healed = 0;
        for (const unit of this.state.party) {
          healed += this.healUnit(actor, unit, actor.attack * 0.608 + 5230);
          this.applyUnitBuff(unit, { id: 'jc_two_masks_damage', name: 'TWO MASKS DMG', stat: 'damage', value: 0.511 * desireRatio, duration: 2 }, 'character_skill');
        }
        this.emit('heal', `${actor.codename} restored ${healed.toLocaleString()} party HP with Two Masks as One.`, { amount: healed, targetId: 'party', sourceType: 'character_skill', tone: 'heal' });
      } else if (pair === 'absurdity+mischief') {
        for (const unit of this.state.party.filter(unit => unit.id !== actor.id)) {
          this.applyUnitBuff(unit, { id: 'jc_two_masks_amp', name: 'SKILL AMPLIFICATION', stat: 'skillAmplification', value: 0.17, duration: 2 }, 'character_skill');
        }
        for (const unit of this.state.party) this.applyUnitBuff(unit, { id: 'jc_two_masks_crit_damage', name: 'TWO MASKS CRIT DMG', stat: 'critDamage', value: 0.227 * desireRatio, duration: 2 }, 'character_skill');
        if (this.usesLiveMechanics()) this.reportCombatLimitation('J&C Two Masks as One', ['Skill Amplification scope beyond direct skill damage'], { actorId: actor.id, facadePair: pair });
      } else if (pair === 'absurdity+service') {
        const shield = Math.round((actor.attack * 0.486 + 4184) * this.shieldMultiplier(actor));
        for (const unit of this.state.party) {
          this.applyUnitBuff(unit, { id: 'jc_two_masks_shield', name: 'TWO MASKS SHIELD', stat: 'shield', value: shield, duration: 2 }, 'character_skill');
          this.applyUnitBuff(unit, { id: 'jc_two_masks_defense', name: 'TWO MASKS DEF', stat: 'defense', value: 0.568 * desireRatio, duration: 2 }, 'character_skill');
          unit.downPoints = Math.max(1, unit.downPoints || 0);
        }
        if (this.usesLiveMechanics()) this.reportCombatLimitation('J&C Two Masks as One', ['Down Point duration and expiry'], { actorId: actor.id, facadePair: pair });
      } else if (pair === 'luck+service') {
        const value = 0.295 * (1 + desireRatio);
        for (const enemy of this.enemies) {
          // Own id so it coexists with Rakunda instead of replacing it (found 2026-09-06:
          // the T5 enhanced Two Masks overwrote the T4 Rakunda and dropped it early).
          this.applyEnemyStatus(enemy, 'debuffs', { id: 'jc_two_masks_def_down', name: 'TWO MASKS DEF DOWN', stat: 'defenseDown', value, duration: 2 }, 'character_skill', actor.id);
          if (!this.usesLiveMechanics()) {
            this.applyEnemyStatus(enemy, 'debuffs', { id: 'jc_shock', name: 'SHOCK', ailment: true, duration: 2 }, 'character_skill', actor.id);
            this.applyEnemyStatus(enemy, 'debuffs', { id: 'jc_windswept', name: 'WINDSWEPT', ailment: true, duration: 2 }, 'character_skill', actor.id);
            this.applyEnemyStatus(enemy, 'debuffs', { id: 'jc_curse_stacks', name: 'CURSE x2', stacks: 2, duration: 2 }, 'character_skill', actor.id);
          }
        }
        if (this.usesLiveMechanics()) {
          this.applyEnemyStatus(mainTarget, 'debuffs', { id: 'jc_shock', name: 'SHOCK', ailment: true, duration: 2 }, 'character_skill', actor.id);
          this.applyEnemyStatus(mainTarget, 'debuffs', { id: 'jc_windswept', name: 'WINDSWEPT', ailment: true, duration: 2 }, 'character_skill', actor.id);
          this.applyEnemyStatus(mainTarget, 'debuffs', { id: 'jc_curse_stacks', name: 'CURSE x2', stacks: 2, duration: 2 }, 'character_skill', actor.id);
        }
        this.grantBlessing([actor], 2, 'character_skill');
        if (this.usesLiveMechanics()) this.reportCombatLimitation('J&C Two Masks as One', ['Blessing duration and expiry'], { actorId: actor.id, facadePair: pair });
      } else if (pair === 'absurdity+luck') {
        this.applyUnitBuff(actor, { id: 'jc_rebel_surveillance', name: 'REBEL SURVEILLANCE', stat: 'effectsShare', value: 0.057, duration: 2 }, 'character_skill');
        if (this.usesLiveMechanics()) this.reportCombatLimitation('J&C Two Masks as One', ['Rebel Surveillance Effects Share stat effect'], { actorId: actor.id, facadePair: pair });
      }
    }
    this.emit('mechanic', `${actor.codename} activated ${enhanced ? 'enhanced Two Masks and every Facade effect supported by the simulator; see recorded limitations' : `the ${jcPairKey(facadePair)} Facade effect`}.`, { actorId: actor.id, sourceType: 'awareness', tone: 'phase' });
  }

  applyJcHighlightEffect(actor, mask) {
    if (mask === 'mischief') {
      for (const unit of this.state.party) {
        this.applyUnitBuff(unit, { id: 'jc_highlight_attack', name: 'J&C HL ATK', stat: 'attack', value: 0.284, duration: 2 }, 'highlight');
        this.applyUnitBuff(unit, { id: 'jc_highlight_damage', name: 'J&C HL DMG', stat: 'damage', value: 0.398, duration: 2 }, 'highlight');
      }
    } else if (mask === 'service') {
      let healed = 0;
      for (const unit of this.state.party) {
        healed += this.healUnit(actor, unit, actor.attack * 0.506 + 4350);
        this.applyUnitBuff(unit, { id: 'jc_highlight_service_max_hp', name: 'SERVICE HL MAX HP', stat: 'maxHpPercent', value: 0.114, duration: 2 }, 'highlight');
      }
      this.emit('heal', `${actor.codename} restored ${healed.toLocaleString()} party HP with Highlight.`, { amount: healed, targetId: 'party', sourceType: 'highlight', tone: 'heal' });
    } else if (mask === 'absurdity') {
      const target = this.state.party.filter(unit => unit.id !== actor.id && ['Sweeper', 'Assassin'].includes(unit.role)).sort((a, b) => b.attack - a.attack)[0]
        || this.state.party.filter(unit => unit.id !== actor.id).sort((a, b) => b.attack - a.attack)[0];
      for (const unit of [actor, target].filter(Boolean)) this.applyUnitBuff(unit, { id: 'jc_highlight_absurdity_attack', name: 'ABSURDITY HL ATK', stat: 'attack', value: 0.398, duration: 2 }, 'highlight');
    } else if (mask === 'luck') {
      this.applyUnitBuff(actor, { id: 'jc_highlight_luck_attack', name: 'LUCK HL ATK', stat: 'attack', value: 0.341, duration: 2 }, 'highlight');
      this.applyUnitBuff(actor, { id: 'jc_highlight_luck_crit_damage', name: 'LUCK HL CRIT DMG', stat: 'critDamage', value: 0.227, duration: 2 }, 'highlight');
    }
    if (actor.awareness >= 4) {
      this.applyUnitBuff(actor, { id: 'jc_a4_self_attack', name: 'A4 HL ATK', stat: 'attack', value: 0.4, duration: 2 }, 'awareness');
      this.applyUnitBuff(actor, { id: 'jc_a4_self_damage', name: 'A4 HL DMG', stat: 'damage', value: 0.2, duration: 2 }, 'awareness');
      for (const unit of this.state.party.filter(unit => unit.id !== actor.id)) {
        this.applyUnitBuff(unit, { id: 'jc_a4_party_attack', name: 'A4 HL ATK', stat: 'attack', value: 0.2, duration: 2 }, 'awareness');
        this.applyUnitBuff(unit, { id: 'jc_a4_party_damage', name: 'A4 HL DMG', stat: 'damage', value: 0.1, duration: 2 }, 'awareness');
      }
    }
  }

  beginActorTurn() {
    const actor = this.actor;
    if (!actor) return;
    // Kotone's Virtual Concert turns are extra turns, not new turn starts.
    const kotoneExtraTurn = actor.id === KOTONE_SHIOMI_ID && this.isVirtualConcertActive();
    if (!kotoneExtraTurn) actor.characterTurnsStarted += 1;
    this.kotoneMechanics?.turnStart(actor);
    const wavecatcher = this.state.party.find(unit => this.isWavecatcher(unit));
    if (this.config.wavecatcherSourceMechanics && this.usesLiveMechanics() && wavecatcher?.hp > 0 && actor.id !== wavecatcher.id && !kotoneExtraTurn) {
      const recovered = 15 * (Number(wavecatcher.spRecovery || 100) / 100);
      wavecatcher.sp = Math.min(this.spCap(wavecatcher), wavecatcher.sp + recovered);
      this.recordWavecatcherRecovery(wavecatcher, recovered, 'ally_turn_start');
    }
    if (this.usesLiveMechanics() && actor.hp > 0 && !kotoneExtraTurn) {
      // Natural recovery belongs to the owner's turn, including Concert turns.
      // Base 10 is guide-sourced; existing spRecovery values mix percentage
      // conventions, so their modifiers are not applied to this baseline yet.
      const restored = Math.min(10, Math.max(0, actor.maxSp - actor.sp));
      actor.sp += restored;
      if (restored > 0) this.emit('resource', `${actor.codename} recovered ${restored} SP at turn start.`, {
        actorId: actor.id, targetId: actor.id, resource: 'sp', amount: restored,
        sourceType: 'turn_start_recovery', baseRecovery: 10,
        recoveryModifiersApplied: false, concertActive: this.isVirtualConcertActive(), tone: 'heal'
      });
    }
    if (actor.characterTurnsStarted > 1 && !kotoneExtraTurn) {
      for (const skillId of Object.keys(actor.skillCooldowns || {})) {
        actor.skillCooldowns[skillId] = Math.max(0, actor.skillCooldowns[skillId] - 1);
      }
    }
    this.cosmicBeginTurn(actor);
    characterHook(this, actor, 'onTurnStart');
    if (this.isYukari(actor)) actor.erosionTriggeredSinceTurn = false;
    if (this.isMakoto(actor)) {
      actor.nocturneAutoCooldown = Math.max(0, actor.nocturneAutoCooldown - 1);
      if (actor.awareness >= 2 && actor.moonPhaseStacks >= 4 && actor.nocturneAutoCooldown === 0) {
        const nocturne = this.liveSeesSkill(actor, actor.skills.find(skill => skill.name === 'Nocturne of Battle'));
        if (nocturne) {
          actor.nocturneAutoCooldown = 1;
          this.emit('follow_up', `${actor.codename} automatically activated Nocturne of Battle.`, {
            actorId: actor.id, skillId: nocturne.id, sourceType: 'awareness_follow_up', tone: 'navigator'
          });
          this.resolveSkill(actor, nocturne, actor.id, 'awareness_follow_up', { ignoreCost: true, grantsHighlight: false });
        }
      }
    }
    if (this.isJc(actor)) {
      actor.jcTurnsStarted += 1;
      if (!this.usesLiveMechanics() && actor.awareness >= 6 && actor.jcTurnsStarted > 1 && (actor.jcTurnsStarted - 1) % 8 === 0) {
        const gainsTrueDesire = true;
        if (gainsTrueDesire) actor.trueDesireStacks += 1;
        if (gainsTrueDesire) {
          this.emit('resource', `${actor.codename} gained 1 True Desire.`, { actorId: actor.id, resource: 'trueDesire', amount: actor.trueDesireStacks, tone: 'buff' });
        }
      }
      // Directly read Strict Tolerance tooltip: at J&C turn start or action end,
      // two Facades automatically activate Two Masks as One once, prioritizing
      // the previous skill-attack target and otherwise choosing randomly.
      // The current immediate post-mask resolution is retained as action-end.
      // Recorded Nexus replays retain their deferred profile behavior.
      if (this.usesLiveMechanics() && actor.facades.length >= 2) {
        this.resolveJcAutoTwoMasks(actor, 'turn_start');
        // A turn-start S3 has no enclosing player step to reconcile phase or
        // terminal state. Resolve it before exposing the command wheel.
        this.updateBossPhase();
        if (this.allEnemiesDefeated()) this.finish('victory');
      }
    }
  }

  isJcAutoTwoMasksTargetEligible(target) {
    if (!target || target.alive === false) return false;
    // Finite bosses remain in the generic enemy list at 0 HP. They are no
    // longer valid automatic targets, while score-attack/infinite HP bosses
    // such as Hachiman and HP-floor bosses remain eligible.
    // A Weakened DOD boss sits at 0 tracked HP with infinite effective HP and stays eligible.
    return target.id !== this.state.boss.id || target.finiteHp === false || target.hp > 0 || this.state.boss.weakenedActive === true;
  }

  jcAutoTwoMasksTarget(actor) {
    const preferredId = actor.jcLastSkillAttackTargetId;
    const preferred = preferredId ? this.findEnemy(preferredId) : null;
    if (this.isJcAutoTwoMasksTargetEligible(preferred)) return { target: preferred, rule: 'previous_skill_attack' };
    const observedOpeningId = actor.jcTurnsStarted === 1 ? this.config.jcOpeningAutoTargetId : null;
    const observedOpening = observedOpeningId ? this.findEnemy(observedOpeningId) : null;
    if (this.isJcAutoTwoMasksTargetEligible(observedOpening)) {
      return { target: observedOpening, rule: 'observed_opening_target' };
    }
    const living = this.enemies.filter(enemy => this.isJcAutoTwoMasksTargetEligible(enemy));
    if (!living.length) return null;
    const index = Math.floor(this.random() * living.length);
    return { target: living[index], rule: 'seeded_random' };
  }

  resolveJcAutoTwoMasks(actor, timing, highlightActionContext = null) {
    if (!this.isJc(actor) || actor.awareness < 1 || actor.facades.length < 2) return 0;
    const skill = actor.skills.find(item => item.name === 'Two Masks as One');
    if (!skill) return 0;
    const autoTarget = this.usesLiveMechanics()
      ? this.jcAutoTwoMasksTarget(actor)
      : { target: this.state.boss, rule: 'recorded_boss_target' };
    // A lethal mask can leave no eligible target before its immediate Facade
    // trigger. Do not spend Facades, True Desire, or selection RNG on a corpse.
    if (!autoTarget?.target) return 0;
    const timingLabel = timing === 'turn_start'
      ? 'turn start'
      : timing === 'facades_ready'
        ? 'the moment both Facades became ready'
        : 'turn end';
    this.emit('follow_up', `${actor.codename} automatically activated Two Masks as One at ${timingLabel}.`, {
      actorId: actor.id, skillId: skill.id, targetId: autoTarget.target.id, targetRule: autoTarget.rule,
      sourceType: 'awareness_follow_up', tone: 'navigator'
    });
    return this.resolveSkill(actor, skill, autoTarget.target.id, 'awareness_follow_up', {
      ignoreCost: true,
      // Live T5's enhanced elemental follow-up knocks zero-shield Hachiman
      // Down. Ordinary Almighty Two Masks keeps its previous behavior.
      canReduceDown: this.usesLiveMechanics() && actor.trueDesirePrimed === true,
      highlightActionContext, highlightNested: highlightActionContext != null
    });
  }

  updateDownState(target, result, skill, actor = null, sourceType = null) {
    const qualifyingHit = result.weakness || (['physical', 'gun'].includes(skill.element) && result.critical);
    if (!qualifyingHit || target.downed) return;
    if (target.downPoints > 0) {
      target.downPoints -= 1;
      this.emit('down_damage', `${target.name} lost 1 Down point.`, { targetId: target.id, downPoints: target.downPoints, tone: 'debuff' });
      return;
    }
    target.downed = true;
    const downedDamageTaken = Math.round(Number(target.downedDamageTaken ?? 0.1) * 100);
    this.emit('down', `${target.name} was knocked Down! Damage taken +${downedDamageTaken}%.`, { targetId: target.id, tone: 'phase' });
    this.resolveWonderWeaponKnockdown(target);
    this.queueDownActions(actor, target, sourceType);
  }

  defeatSummon(target) {
    if (!target?.alive) return;
    target.alive = false;
    target.hp = 0;
    this.emit('defeat_enemy', `${target.name} was defeated.`, { targetId: target.id, tone: 'victory' });
    if (this.isHachimanLive() && target.species === 'daisoujou') {
      const profile = this.state.boss.liveDaisoujouProfile || {};
      const cap = Number(profile.damageTakenStackCap || 4);
      const perStack = Number(profile.damageTakenPerStack || 0.1);
      const stacks = Math.min(cap, Number(this.state.boss.daisoujouDefeatStacks || 0) + 1);
      this.state.boss.daisoujouDefeatStacks = stacks;
      const bonus = this.applyEnemyStatus(this.state.boss, 'debuffs', {
        id: 'minion_break', name: `DAISOUJOU DEFEAT x${stacks}`,
        damageTaken: true, value: perStack * stacks, stacks, stackCap: cap,
        duration: profile.stackDuration ?? null, durationKnown: profile.durationKnown === true,
        evidence: profile.damageTakenEvidence
      }, 'encounter');
      this.reportCombatLimitation('hachiman_minion_break', ['stack_duration'], {
        statusId: 'minion_break', targetId: this.state.boss.id, observedStackCap: cap,
        evidence: profile.evidence
      });
      this.emit('debuff', `${this.state.boss.name} damage taken +${Math.round(perStack * stacks * 100)}% from Daisoujou defeats (${stacks}/${cap}). Duration unknown.`, {
        targetId: this.state.boss.id, resource: 'daisoujouDefeatStacks', amount: stacks,
        max: cap, defeatedTargetId: target.id, status: clone(bonus), durationKnown: false,
        sourceType: 'encounter', tone: 'debuff'
      });
    }
    this.transferBerryLovesick(target);
    if (target.debuffs.some(effect => effect.id === 'yukari_erosion')) {
      const next = this.enemies.filter(enemy => enemy.id !== target.id && enemy.alive !== false)
        .sort((left, right) => right.hp - left.hp)[0];
      if (next) {
        this.applyYukariErosion(next, 'erosion_transfer');
        this.emit('status_transfer', `Erosion transferred to ${next.name}.`, {
          targetId: next.id, sourceType: 'erosion_transfer', tone: 'debuff'
        });
      }
    }
    if (['threshold_clones', 'fixed_five_targets'].includes(this.state.boss.encounter?.kind)) return;
    if (!this.state.boss.waveBonusTriggered && this.state.boss.summons.every(enemy => !enemy.alive)) {
      this.state.boss.waveBonusTriggered = true;
      const bonus = this.state.boss.minionKillBonus;
      if (this.isHachimanLive() && bonus?.id === 'minion_break') {
        // Each defeat already updated the one aggregate live debuff. Do not
        // apply the older generic full-wave value a second time.
        this.emit('mechanic', 'Minion wave cleared. The accumulated Daisoujou defeat bonus remains active; its duration is unknown.', {
          targetId: this.state.boss.id, status: clone(this.state.boss.debuffs.find(effect => effect.id === 'minion_break')), tone: 'phase'
        });
      } else {
        if (bonus) this.applyEnemyStatus(this.state.boss, 'debuffs', bonus, 'encounter');
        this.emit('mechanic', `Minion wave cleared. ${bonus?.name || 'Damage window'} activated!`, { targetId: this.state.boss.id, status: clone(bonus), tone: 'phase' });
      }
    }
  }

  isCurseTransferEligible(target) {
    const affinity = String(target?.curseAffinity || target?.affinities?.curse || target?.elementalAffinities?.curse || '').toLowerCase();
    return target?.alive !== false
      && !['null', 'repel', 'drain'].includes(affinity)
      && !target?.immunities?.includes('curse')
      && !target?.nullifies?.includes('curse')
      && !target?.repels?.includes('curse')
      && !target?.drains?.includes('curse');
  }

  transferBerryLovesick(target) {
    if (!this.usesLiveMechanics()) return;
    const lovesick = target.debuffs.filter(effect => effect.id === 'berry_lovesick' && effect.stacks > 0);
    if (!lovesick.length) return;
    // Secondary reference, not a live tooltip capture:
    // https://megatenwiki.com/wiki/Ichigo_Shikano says defeated Lovesick holders
    // transfer stacks to the highest-HP foe, excluding Null, Repel, and Drain
    // Curse affinities. The user-observed Hachiman opening corroborates that
    // outcome, while later summon scripting remains unobserved.
    const next = this.enemies.filter(enemy => this.isCurseTransferEligible(enemy))
      .sort((left, right) => right.hp - left.hp)[0];
    if (!next) return;
    for (const status of lovesick) {
      const actor = byId(this.state.party, status.sourceActorId);
      if (!actor) continue;
      this.addLovesick(actor, next, status.stacks, status.snapshots);
      this.emit('status_transfer', `Lovesick transferred to ${next.name}.`, {
        actorId: actor.id, targetId: next.id, amount: status.stacks, sourceType: 'lovesick_transfer', tone: 'debuff'
      });
    }
  }

  nextBerryS1TargetAfterDefeat(defeatedTarget) {
    // Vorpal Butterfly's sourced effect creates another cast after a defeat.
    // Keep its chain on remaining minions before falling back to the boss: the
    // old enemy-order lookup selected the boss first, so the visible minion
    // clear stopped after its first kill even though another target remained.
    return this.state.boss.summons.find(enemy => enemy.alive !== false && enemy.id !== defeatedTarget.id)
      || (this.state.boss.alive !== false ? this.state.boss : null);
  }

  scheduleEnemySpawn(definitionOrId, beforeActorId = this.actor?.id || null) {
    if (!this.usesEnemyTimeline()) return null;
    const definitions = this.state.boss.encounter?.cloneDefinitions || [];
    const definition = typeof definitionOrId === 'string'
      ? definitions.find(candidate => candidate.id === definitionOrId) || { id: definitionOrId }
      : definitionOrId || {};
    if (this.state.boss.summons.some(enemy => enemy.id === definition.id)) return null;
    const serial = Number(this.state.enemyTimeline?.spawnSerial || 0) + 1;
    if (this.state.enemyTimeline) this.state.enemyTimeline.spawnSerial = serial;
    this.state.boss.encounterState.spawnSerial = serial;
    const maxHp = Number(definition.maxHp || this.state.boss.maxHp);
    const enemy = {
      ...clone(definition),
      id: definition.id || `${this.state.boss.id}_copy_${serial + 1}`,
      name: definition.name || `${this.state.boss.name} Copy ${serial + 1}`,
      maxHp, hp: maxHp, defense: Number(definition.defense || this.state.boss.defense),
      weakness: definition.weakness || this.state.boss.weakness,
      resistance: definition.resistance || this.state.boss.resistance,
      actionScale: Number(definition.actionScale ?? this.state.boss.cloneActionScale ?? this.state.boss.actionScale ?? 1),
      alive: true, downMax: Number(definition.downMax || this.state.boss.downMax || 1),
      downPoints: Number(definition.downMax || this.state.boss.downMax || 1), downed: false,
      buffs: [], debuffs: [], spawnOrdinal: serial, spawnedAttackTurn: this.state.attackTurn,
      eligibleAttackTurn: this.state.attackTurn + 1, lastActedAttackTurn: 0,
      actsBeforeActorId: this.state.party.some(unit => unit.id === beforeActorId) ? beforeActorId : this.actor?.id || null
    };
    this.state.boss.summons.push(enemy);
    this.emit('enemy_spawn', `${enemy.name} entered the action order before ${this.state.party.find(unit => unit.id === enemy.actsBeforeActorId)?.codename || 'the party end'}.`, {
      actorId: enemy.id, targetId: enemy.id, beforeActorId: enemy.actsBeforeActorId,
      eligibleAttackTurn: enemy.eligibleAttackTurn, sourceType: 'encounter', tone: 'boss'
    });
    return enemy;
  }

  processEncounterDamageTriggers(actor, target, hpBefore, hpAfter) {
    const encounter = this.state.boss.encounter;
    if (!this.usesEnemyTimeline() || encounter?.kind !== 'threshold_clones' || target.id !== this.state.boss.id) return [];
    const beforeRatio = Number(hpBefore) / this.state.boss.maxHp;
    const afterRatio = Number(hpAfter) / this.state.boss.maxHp;
    const spawned = [];
    for (const [index, threshold] of (encounter.cloneThresholds || []).entries()) {
      const id = threshold.id || `clone_threshold_${index + 1}`;
      const hpRatio = Number(threshold.hpRatio);
      if (!Number.isFinite(hpRatio) || this.state.boss.encounterState.processedThresholdIds.includes(id)) continue;
      if (beforeRatio > hpRatio && afterRatio <= hpRatio) {
        this.state.boss.encounterState.processedThresholdIds.push(id);
        const anchorId = this.state.party.some(unit => unit.id === actor?.id) ? actor.id : this.actor?.id || null;
        for (const cloneId of threshold.cloneIds || []) {
          const enemy = this.scheduleEnemySpawn(cloneId, anchorId);
          if (enemy) spawned.push(enemy);
        }
        this.state.boss.phaseIndex = Math.min(index + 1, this.state.boss.phases.length - 1);
        this.emit('encounter_threshold', `${this.state.boss.name} crossed the provisional ${Math.round(hpRatio * 100)}% gate. ${this.enemies.length} targets are active.`, {
          thresholdId: id, hpRatio, activeEnemies: this.enemies.length, beforeActorId: anchorId,
          sourceType: 'encounter', tone: 'phase'
        });
      }
    }
    return spawned;
  }

  resolveSkill(actor, skill, targetId, sourceType = actor.id === 'wonder' ? 'persona_skill' : 'character_skill', options = {}) {
    if (!this.usesLiveMechanics()) return this.resolveSkillBody(actor, skill, targetId, sourceType, options);
    const parent = this.supportCastContext;
    this.supportCastContext = { casterId: actor.id, skillId: skill.id, castId: `cast-${++this.state.supportRuntime.castSequence}` };
    try {
      const result = actor.id === KOTONE_SHIOMI_ID && skill.kotoneSkill
        ? this.kotoneMechanics.resolve(actor, skill, targetId, sourceType, options)
        : skill.forcedTheurgy ? resolveForcedTheurgy(this, actor, skill, targetId, options)
          : this.resolveSkillBody(actor, skill, targetId, sourceType, options);
      this.kotoneMechanics?.afterSkill(actor, skill, targetId, sourceType);
      return result;
    }
    finally { this.supportCastContext = parent; }
  }

  resolveSkillBody(actor, skill, targetId, sourceType, options = {}) {
    skill = characterHook(this, actor, 'beforeSkill', skill, targetId, sourceType) || skill;
    skill = this.cosmicPrepareSkill(actor, skill, sourceType);
    if (this.isBerry(actor) && !options.skipBerryMechanics && ['character_skill', 'highlight', 'berry_repeat'].includes(sourceType)) skill = this.berrySkill(skill);
    const highlightActionContext = options.highlightActionContext || null;
    const highlightCast = this.recordSharedHighlightCast(highlightActionContext, {
      actor, skill, sourceType, nested: options.highlightNested === true, repeatReason: options.highlightRepeatReason || null
    });
    const surfWasActive = actor.surfActive;
    const isPaddleOut = skill.name === 'Paddle Out';
    const isAerialTide = skill.name === 'Aerial Tide';
    const isOrangeBlossomBlade = this.isRin(actor) && skill.name === 'Orange Blossom Blade';
    const isYanhuaSlash = this.isRin(actor) && skill.rinYanhua === true;
    const isRinScarletSurprise = this.isRin(actor) && skill.name === 'Scarlet Surprise';
    const isRinFireworkFinale = this.isRin(actor) && skill.name === 'Firework Finale';
    const isMatoiTorrent = this.isMatoi(actor) && skill.name === 'Sub-Zero Torrent';
    const isMatoiTechnicalSkill = this.isMatoi(actor) && ['Freezing Prison', 'Extinguishing Guidance', 'Requiem Guidance', 'Highlight'].includes(skill.name);
    const isMatoiGuidance = this.isMatoi(actor) && ['Extinguishing Guidance', 'Requiem Guidance'].includes(skill.name);
    const isAkihikoS1 = this.isAkihiko(actor) && skill.name === 'Blitzkrieg';
    const isAkihikoS2 = this.isAkihiko(actor) && skill.name === 'Spark Impact';
    const isAkihikoS3 = this.isAkihiko(actor) && skill.name === 'Lightning Fist';
    const akihikoGritBefore = isAkihikoS3 ? actor.gritStacks : 0;
    const isYukariGale = this.isYukari(actor) && skill.name === 'Gale Burst';
    const isYukariTailwind = this.isYukari(actor) && skill.name === "Tailwind's Breath";
    const isYukariArrow = this.isYukari(actor) && skill.name === 'Arrow of Life';
    const isMakotoS1 = this.isMakoto(actor) && skill.name === 'Melody of Flames';
    const isMakotoS2 = this.isMakoto(actor) && skill.name === 'Nocturne of Battle';
    const isMakotoS3 = this.isMakoto(actor) && skill.name === 'Scarlet Hades';
    const makotoMoonBefore = isMakotoS3 ? actor.moonPhaseStacks : 0;
    const makotoFullMoonBefore = isMakotoS3 ? actor.fullMoonStacks : 0;
    const jcMask = this.isJc(actor) ? jcMaskByName[skill.name] : null;
    const isTwoMasks = this.isJc(actor) && skill.name === 'Two Masks as One';
    const jcHighlightMask = this.isJc(actor) ? skill.jcHighlightMask : null;
    const facadePair = isTwoMasks ? [...actor.facades] : [];
    const trueDesireEnhanced = isTwoMasks && actor.trueDesirePrimed;
    const damageSkill = clone(skill);
    if (isAerialTide) damageSkill.damageClass = 'resonance_follow_up';
    const hitRange = Array.isArray(damageSkill.hitCountRange) ? damageSkill.hitCountRange.map(Number) : null;
    const validHitRange = hitRange?.length === 2 && hitRange.every(Number.isInteger) && hitRange[0] > 0 && hitRange[1] >= hitRange[0];
    const resolvedHitCount = Number.isInteger(damageSkill.hitCount) && damageSkill.hitCount > 0
      ? damageSkill.hitCount
      : validHitRange ? hitRange[0] + Math.floor(this.random() * (hitRange[1] - hitRange[0] + 1)) : 1;
    if (!this.usesLiveMechanics() && sourceType === 'highlight' && this.isVirtualConcertActive() && Number(this.state.navigator.awareness || 0) >= 1) {
      damageSkill.power *= 1.1;
    }
    if (isPaddleOut) damageSkill.power = 0;
    if (isAerialTide && surfWasActive) damageSkill.power *= 1 + actor.offshoreStacks * 0.1;
    if (isOrangeBlossomBlade) damageSkill.power = 0;
    if (isYanhuaSlash) {
      const yanhuaDamageBonus = actor.buffs.filter(effect => effect.stat === 'rinYanhuaDamage').reduce((sum, effect) => sum + (effect.value || 0), 0);
      damageSkill.power = (1.482 + Number(actor.rinYanhuaBonusPower || 0)) * (1 + yanhuaDamageBonus);
      damageSkill.technical = { sourceUrl: actor.sourceUrl || null };
    }
    if (isMatoiTechnicalSkill) damageSkill.technical = { sourceUrl: actor.sourceUrl || null };
    if (isAkihikoS3 && akihikoGritBefore >= 2) damageSkill.power += 0.568 * akihikoGritBefore;
    if (isMakotoS3 && makotoMoonBefore >= 2) {
      damageSkill.power += Number(actor.scarletHadesMultiplierBonus || 0);
      if (makotoMoonBefore === 4) {
        damageSkill.temporaryPierce = 0.136;
        damageSkill.actionDamageBonus = 0.284;
        if (actor.awareness >= 1) damageSkill.critBonus = Number(damageSkill.critBonus || 0) + 0.16;
      }
    }
    if (jcMask) damageSkill.power = (skill.power || 0.867) * (1 + actor.desireLevel / 100);
    if (isTwoMasks) damageSkill.power = (skill.power || 1.477) * (1 + this.jcEffectiveDesire(actor, true) / 100);
    if (!options.ignoreCost) actor.sp = clamp(actor.sp - (skill.cost || 0), 0, this.spCap(actor));
    if (skill.hpCost) actor.hp = Math.max(1, actor.hp - Math.round(actor.maxHp * skill.hpCost / 100));
    this.emit('move', `${actor.codename} used ${skill.name}.`, { actorId: actor.id, skillId: skill.id, sourceType, tone: 'move' });
    const twoMasksHitsAll = isTwoMasks && (trueDesireEnhanced || jcPairKey(facadePair) === 'luck+mischief');
    const enemyTargets = skill.cosmicTargetIds ? skill.cosmicTargetIds.map(id => this.findEnemy(id)).filter(Boolean) : skill.target === 'all_enemies' || twoMasksHitsAll ? [...this.enemies] : [this.findEnemy(targetId) || this.state.boss];
    const mainTarget = this.findEnemy(targetId) || this.state.boss;
    const yukari = this.state.party.find(unit => this.isYukari(unit) && unit.hp > 0);
    if (yukari && actor.id !== yukari.id && ['character_skill', 'persona_skill'].includes(sourceType)
      && enemyTargets.some(enemy => enemy.debuffs.some(effect => effect.id === 'yukari_erosion'))) {
      damageSkill.temporaryAttackBonus = Math.min(0.341, 0.102 + Math.floor(yukari.mechanicAttack / 100) * 0.0072);
    }
    const berrySkill = this.isBerry(actor) && !options.skipBerryMechanics && ['character_skill', 'highlight', 'berry_repeat'].includes(sourceType);
    const berryStacksBefore = berrySkill ? this.lovesickStacks(enemyTargets[0], actor) : 0;
    const berryAddedStacks = berrySkill
      ? (skill.name === 'Vorpal Butterfly' ? 2 : skill.name === 'Obsessive Rose' ? 4 : 0) + (actor.awareness >= 1 ? 1 : 0)
      : 0;
    let damage = 0;
    let triggeredCritical = false;
    const packets = [];
    const cursedTiesProcCandidates = new Map();
    if (damageSkill.power > 0) {
      for (const target of enemyTargets) {
        if (target.id !== this.state.boss.id && target.alive === false) continue;
        const resolvedDamageSkill = prepareCharacterDamage(this, actor, damageSkill, target, sourceType);
        const result = this.calculateDamage(actor, resolvedDamageSkill, target, sourceType, { prepared: true });
        triggeredCritical ||= result.critical;
        const hpBefore = target.hp;
        const actual = this.applyEnemyDamage(target, result.amount);
        damage += actual;
        actor.damageDone += actual;
        this.state.totalDamage += actual;
        this.addDamageScore(actual, actor, target);
        this.recordVirtualConcertDamage(target.id, actual, sourceType);
        this.recordSharedHighlightPacket(highlightActionContext, highlightCast, {
          target, result, actualDamage: actual, element: damageSkill.element, packetKind: 'primary', sourceType
        });
        this.emit('damage', `${target.name} took ${actual.toLocaleString()} damage${result.critical ? ' — critical hit!' : ''}${result.weakness ? ' — weakness!' : ''}`, {
          amount: actual, targetId: target.id, critical: result.critical, weakness: result.weakness,
          sourceType, tone: result.critical ? 'critical' : 'damage', calculation: result
        });
        this.recordCursedTiesCurseDamage(actor, target, damageSkill.element, actual, cursedTiesProcCandidates);
        this.resolveTechnicalEffect(result, actor, target, damageSkill);
        if (options.canReduceDown !== false && resolvedDamageSkill.canReduceDown !== false) this.updateDownState(target, result, resolvedDamageSkill, actor, sourceType);
        const packet = { actor, skill: resolvedDamageSkill, target, result, actualDamage: actual, sourceType, hpBefore, hpAfter: target.hp };
        packets.push(packet);
        notifyCharacterDamage(this, packet);
        this.resolveWonderWeaponDamagePacket(actor, resolvedDamageSkill, target, actual, sourceType);
        // Apply before resolving a lethal defeat so the status can move with
        // the holder during Berry's sourced kill chain.
        if (berryAddedStacks > 0) this.addLovesick(actor, target, berryAddedStacks);
        if (target.id !== this.state.boss.id && !target.scoreAttack && target.hp <= 0) this.defeatSummon(target);
        this.processEncounterDamageTriggers(actor, target, hpBefore, target.hp);
      }
      if (options.grantsHighlight !== false && !this.usesLiveMechanics()) {
        actor.highlight = clamp(actor.highlight + (this.isVirtualConcertActive() ? 36 : 18), 0, 100);
      }
      const extraHitSkills = (skill.cosmicExtraHitPowers || []).map((power, index) => ({
        ...clone(damageSkill), power, id: `${skill.id}-knight-hit-${index + 1}`, name: `Veg-Out knight hit ${index + 1}`, canReduceDown: false
      }));
      for (let index = 1; index < resolvedHitCount; index += 1) {
        extraHitSkills.push({
          ...clone(damageSkill), hitCount: 1, hitCountRange: undefined,
          id: `${skill.id}-hit-${index + 1}`, name: `${skill.name} hit ${index + 1}`, canReduceDown: false
        });
      }
      for (const [index, hit] of (skill.additionalHits || []).entries()) {
        if (!Number.isFinite(hit.power) || hit.power <= 0) throw new Error('Additional hit requires a positive sourced power.');
        extraHitSkills.push({ ...clone(damageSkill), ...clone(hit),
          id: hit.id || `${skill.id}-additional-${index + 1}`, name: hit.name || `${skill.name} additional hit ${index + 1}`,
          canReduceDown: hit.canReduceDown === true });
      }
      if (berrySkill && skill.name === 'My Beloved Prince' && berryStacksBefore >= 10) extraHitSkills.push({
        id: `${skill.id}_lovesick_bonus`, name: 'My Beloved Prince bonus', element: 'curse', target: 'boss',
        power: this.berryTierValue(actor, skill, [1.187, 1.309, 1.261, 1.382]),
        // The confirmed live S3 bonus is additional damage within the same
        // cast, not a second Down-point hit. A DOUBLE BERRY repeat invokes a
        // distinct resolveSkill cast and therefore receives its own allowance.
        canReduceDown: false
      });
      if (jcMask) extraHitSkills.push({ ...clone(damageSkill), element: jcSecondaryElement[jcMask] });
      if (isTwoMasks && (trueDesireEnhanced || jcPairKey(facadePair) === 'absurdity+luck')) extraHitSkills.push(clone(damageSkill));
      if (actor.slug === 'puppet-wavecatcher' && sourceType === 'highlight' && surfWasActive) {
        extraHitSkills.push({ ...clone(damageSkill), id: `${damageSkill.id}-surf-bonus`, name: 'Surf Highlight Bonus', power: damageSkill.power * 0.5 });
      }
      if (this.isMatoi(actor) && sourceType === 'highlight') {
        extraHitSkills.push({ ...clone(damageSkill), id: `${damageSkill.id}-matoi-highlight-bonus`, name: 'MATOI Highlight bonus', power: 1.363 });
      }
      if (isMakotoS3 && makotoMoonBefore >= 2) {
        for (let index = 1; index < makotoMoonBefore; index += 1) {
          extraHitSkills.push({ ...clone(damageSkill), id: `${damageSkill.id}-moon-${index + 1}`, name: `Scarlet Hades Moon hit ${index + 1}` });
        }
        for (let index = 0; index < makotoFullMoonBefore; index += 1) {
          extraHitSkills.push({ ...clone(damageSkill), id: `${damageSkill.id}-full-moon-${index + 1}`,
            name: `Scarlet Hades Full Moon hit ${index + 1}`, power: 1.755 * (actor.awareness >= 6 ? 1.35 : 1) });
        }
      }
      if (isAkihikoS3 && akihikoGritBefore >= 2 && actor.awareness >= 6) extraHitSkills.push({
        ...clone(damageSkill), id: `${damageSkill.id}-finishing-blow`, name: 'Finishing Blow',
        power: 0.135 * akihikoGritBefore, ignoreDefense: true, guaranteedCritical: true,
        sourceTypeOverride: 'resonance_follow_up'
      });
      if (jcHighlightMask === 'absurdity') extraHitSkills.push({ ...clone(damageSkill), element: 'nuclear' });
      if (jcHighlightMask === 'luck') extraHitSkills.push({ ...clone(damageSkill), element: 'curse' });
      if (trueDesireEnhanced) {
        for (const element of ['fire', 'ice', 'electric', 'wind', 'psychic', 'nuclear', 'bless', 'curse']) {
          extraHitSkills.push({ ...clone(damageSkill), id: `${damageSkill.id}-true-desire-${element}`, name: `True Desire ${element}`, element, power: 0.4 * (1 + this.jcEffectiveDesire(actor, true) / 100), trueDesireMainTarget: true });
        }
      }
      for (const target of enemyTargets) {
        for (const hitSkill of extraHitSkills) {
          if (hitSkill.targetId && hitSkill.targetId !== target.id) continue;
          if (hitSkill.trueDesireMainTarget && target.id !== mainTarget.id) continue;
          if (target.id !== this.state.boss.id && target.alive === false) continue;
          const hitSourceType = hitSkill.sourceTypeOverride || sourceType;
          const resolvedHitSkill = prepareCharacterDamage(this, actor, hitSkill, target, hitSourceType);
          const result = this.calculateDamage(actor, resolvedHitSkill, target, hitSourceType, { prepared: true });
          triggeredCritical ||= result.critical;
          const hpBefore = target.hp;
          const actual = this.applyEnemyDamage(target, result.amount);
          damage += actual;
          actor.damageDone += actual;
          this.state.totalDamage += actual;
          this.addDamageScore(actual, actor, target);
          this.recordVirtualConcertDamage(target.id, actual, hitSourceType);
          this.recordSharedHighlightPacket(highlightActionContext, highlightCast, {
            target, result, actualDamage: actual, element: hitSkill.element, packetKind: 'extra', sourceType: hitSourceType
          });
          this.emit('damage', `${target.name} took ${actual.toLocaleString()} ${hitSkill.element} damage.`, {
            amount: actual, targetId: target.id, critical: result.critical, weakness: result.weakness,
            element: hitSkill.element, sourceType: hitSourceType, tone: result.critical ? 'critical' : 'damage', calculation: result
          });
          this.recordCursedTiesCurseDamage(actor, target, hitSkill.element, actual, cursedTiesProcCandidates);
          this.resolveTechnicalEffect(result, actor, target, hitSkill);
          if (options.canReduceDown !== false && resolvedHitSkill.canReduceDown !== false) {
            this.updateDownState(target, result, resolvedHitSkill, actor, hitSourceType);
          } else if (hitSkill.canReduceDown === false
            && (result.weakness || (['physical', 'gun'].includes(hitSkill.element) && result.critical))
            && !target.downed && !this.isCosmicYui(actor)) {
            this.emit('down_suppressed', `${hitSkill.name} dealt bonus damage but did not remove a Down point; My Beloved Prince already resolved Down for this cast.`, {
              actorId: actor.id, targetId: target.id, skillId: hitSkill.id, sourceType: hitSourceType,
              reason: 'berry_s3_bonus_same_cast_down_limit', tone: 'system'
            });
          }
          const packet = { actor, skill: resolvedHitSkill, target, result, actualDamage: actual, sourceType: hitSourceType, hpBefore, hpAfter: target.hp };
          packets.push(packet);
          notifyCharacterDamage(this, packet);
          this.resolveWonderWeaponDamagePacket(actor, resolvedHitSkill, target, actual, hitSourceType);
          if (target.id !== this.state.boss.id && !target.scoreAttack && target.hp <= 0) this.defeatSummon(target);
          this.processEncounterDamageTriggers(actor, target, hpBefore, target.hp);
        }
      }
    }
    this.resolveCursedTiesCastProc(actor, cursedTiesProcCandidates);
    if (this.usesLiveMechanics() && skill.continuousDamage) {
      for (const target of enemyTargets) this.applyContinuousDamage(actor, target, skill.continuousDamage, sourceType);
    }
    const skillDebuffs = Array.isArray(skill.debuffs) && skill.debuffs.length ? skill.debuffs : skill.debuff ? [skill.debuff] : [];
    for (const definition of skillDebuffs) {
      const debuff = this.resolveStatus(definition, actor);
      for (const target of enemyTargets) {
        if (target.id !== this.state.boss.id && target.alive === false) continue;
        const chance = Number(debuff.chance);
        if (Number.isFinite(chance) && chance < 1 && (chance <= 0 || this.random() >= chance)) {
          this.emit('debuff_miss', `${skill.name} failed to inflict ${debuff.name} on ${target.name}.`, {
            actorId: actor.id, targetId: target.id, skillId: skill.id, statusId: debuff.id,
            chance, sourceType, tone: 'system'
          });
          continue;
        }
        const applied = this.applyEnemyStatus(target, 'debuffs', debuff, sourceType, actor.id);
        if (applied) this.emit('debuff', `${target.name} is afflicted with ${debuff.name}.`, { targetId: target.id, status: { ...clone(debuff), sourceType }, sourceType, tone: 'debuff' });
      }
    }
    const skillBuffs = Array.isArray(skill.buffs) && skill.buffs.length ? skill.buffs : skill.buff ? [skill.buff] : [];
    if (skillBuffs.length && !this.isJc(actor) && !isOrangeBlossomBlade) {
      const buffTarget = skill.buffTarget || skill.target;
      const recipients = buffTarget === 'party' ? this.state.party
        : buffTarget === 'ally' && this.isMarian(actor) ? this.allyTargetsForSkill(actor, skill, targetId)
          : buffTarget === 'ally' ? [byId(this.state.party, targetId) || actor] : [actor];
      for (const definition of skillBuffs) {
        const buff = this.liveSkillBuffStatus(skill, this.resolveStatus(definition, actor));
        if (this.isMarian(actor) && skill.name === 'Summer Garden') {
          const cappedHp = Math.min(actor.mechanicMaxHp || actor.maxHp, 13632);
          buff.value = 0.091 + (this.usesLiveMechanics() ? cappedHp / 1200 : Math.floor(cappedHp / 1200)) * 0.032;
        }
        for (const unit of recipients) this.applyUnitBuff(unit, buff, sourceType, this.supportCastContext);
        const recipientLabel = buffTarget === 'party' ? 'the party' : recipients[0].codename;
        this.emit('buff', `${buff.name} applied to ${recipientLabel}.`, { targetId: buffTarget === 'party' ? 'party' : recipients[0].id, status: { ...clone(buff), sourceType }, sourceType, tone: 'buff' });
      }
    }
    if (skill.selectedAllyBuff) {
      const target = byId(this.state.party, targetId);
      if (target?.hp > 0) {
        const buff = this.liveSkillBuffStatus(skill, this.resolveStatus(skill.selectedAllyBuff, actor));
        this.applyUnitBuff(target, buff, sourceType, this.supportCastContext);
        this.emit('buff', `${buff.name} applied to ${target.codename}.`, {
          targetId: target.id, status: { ...clone(buff), sourceType }, sourceType, tone: 'buff'
        });
      }
    }
    if ((skill.heal || skill.healAttack || skill.healFlat || skill.spRestore) && !this.isJc(actor)) {
      const healTarget = skill.healTarget || skill.target;
      const recipients = healTarget === 'party' ? this.state.party : [byId(this.state.party, targetId) || actor];
      let healed = 0;
      for (const unit of recipients) {
        const actual = this.healUnit(actor, unit, unit.maxHp * (skill.heal || 0) + actor.attack * (skill.healAttack || 0) + (skill.healFlat || 0));
        unit.sp = clamp(unit.sp + (skill.spRestore || 0), 0, this.spCap(unit));
        healed += actual;
      }
      this.emit('heal', `${skill.name} restored ${healed.toLocaleString()} HP and ${skill.spRestore || 0} SP.`, { amount: healed, targetId: healTarget === 'party' ? 'party' : recipients[0].id, sourceType, tone: 'heal' });
    }
    if (skill.medicinePrescription) {
      const prescriptionCount = this.usesLiveMechanics() && this.isMarian(actor) ? (actor.awareness >= 1 ? 2 : 1) : skill.medicinePrescription.amount;
      actor.medicinePrescriptionMax = this.usesLiveMechanics() && this.isMarian(actor) ? prescriptionCount : skill.medicinePrescription.max;
      actor.midsummerPrescription = clamp(actor.midsummerPrescription + prescriptionCount, 0, actor.medicinePrescriptionMax);
      if (this.usesLiveMechanics()) actor.lastMedicineCharacterTurn = actor.characterTurnsStarted;
      this.emit('resource', `${actor.codename} gained ${skill.medicinePrescription.amount} Midsummer Prescription uses. Flower Basket Pharmacy will be ready on her next turn.`, { actorId: actor.id, resource: 'midsummerPrescription', amount: actor.midsummerPrescription, tone: 'buff' });
    }
    if (this.isMarian(actor) && skill.name === 'Summer Garden') {
      for (const unit of this.state.party) {
        if (unit.debuffs.length) unit.debuffs.shift();
      }
      this.grantBlessing(this.state.party, 1, 'character_skill');
    }
    if (this.isMarian(actor) && skill.name === 'Gentle Sea Breeze') {
      const recipients = this.allyTargetsForSkill(actor, skill, targetId);
      const critMult = this.marianScalingCriticalMultiplier(actor);
      const critDamage = Math.max(0, (critMult - 1) / 3);
      for (const unit of recipients) this.applyUnitBuff(unit, {
        id: 'marian_breeze_crit_damage', name: 'SEA BREEZE CRIT DMG',
        stat: 'critDamage', value: critDamage, duration: 3
      }, 'character_skill');
    }
    if (this.isAkihiko(actor)) {
      if (isAkihikoS1 || isAkihikoS2) this.gainAkihikoGrit(actor, 1, sourceType);
      if (skill.element === 'electric' && ['character_skill', 'highlight'].includes(sourceType)) this.gainAkihikoMettle(actor, 1, sourceType);
      if (isAkihikoS2) this.gainAkihikoMettle(actor, 2, sourceType);
      if (isAkihikoS1) this.applyUnitBuff(actor, {
        id: 'akihiko_blitzkrieg_crit_damage', name: 'BLITZKRIEG CRIT DMG',
        stat: 'critDamage', value: 0.273, duration: 3
      }, sourceType);
      if (isAkihikoS3 && akihikoGritBefore >= 2) {
        actor.gritStacks = 0;
        if (actor.awareness >= 6) this.gainAkihikoGrit(actor, 1, 'resonance_follow_up');
        this.emit('resource', `${actor.codename} spent ${akihikoGritBefore} Grit on Lightning Fist.`, {
          actorId: actor.id, resource: 'gritStacks', amount: actor.gritStacks, sourceType, tone: 'phase'
        });
      }
      if (triggeredCritical) {
        const existing = actor.buffs.find(effect => effect.id === 'akihiko_rough_combo');
        const stacks = clamp((existing?.stacks || 0) + 1, 0, 3);
        this.applyUnitBuff(actor, {
          id: 'akihiko_rough_combo', name: `ROUGH COMBO x${stacks}`,
          stat: 'attack', value: stacks * 0.135, duration: 3, stacks
        }, 'passive');
      }
    }
    if (isYukariGale) this.applyYukariErosion(enemyTargets[0], sourceType);
    if (isYukariTailwind) {
      const mainTarget = byId(this.state.party, targetId) || actor;
      const attackValue = Math.min(0.364, 0.091 + Math.floor(actor.mechanicAttack / 100) * 0.0078);
      const damageValue = Math.min(0.114, Math.floor(actor.mechanicAttack / 100) * 0.0024);
      for (const unit of this.state.party.filter(unit => unit.hp > 0)) {
        this.applyUnitBuff(unit, { id: 'yukari_tailwind_reduction', name: 'TAILWIND REDUCTION', stat: 'damageReduction', value: 0.341, duration: 3 }, sourceType);
        if (actor.awareness >= 1) this.healUnit(actor, unit, 1200);
      }
      this.applyUnitBuff(mainTarget, { id: 'yukari_tailwind_attack', name: 'TAILWIND ATK', stat: 'attack', value: attackValue, duration: 2 }, sourceType);
      this.applyUnitBuff(mainTarget, { id: 'yukari_tailwind_damage', name: 'TAILWIND DMG', stat: 'damage', value: damageValue, duration: 2 }, sourceType);
      if (actor.awareness >= 1) {
        this.applyUnitBuff(mainTarget, { id: 'yukari_tailwind_pierce', name: 'TAILWIND PIERCE', stat: 'pierce', value: 0.2, duration: 2 }, 'awareness');
        this.healUnit(actor, mainTarget, 360);
      }
    }
    if (isYukariArrow) {
      const mainTarget = byId(this.state.party, targetId) || actor;
      let healed = 0;
      for (const unit of this.state.party.filter(unit => unit.hp > 0)) healed += this.healUnit(actor, unit, actor.mechanicAttack * 0.456 + 3773);
      const spent = actor.whisperwindStacks;
      actor.whisperwindStacks = 0;
      if (spent > 0) {
        this.grantTheurgyGauge(mainTarget, spent * 17.5, sourceType);
        mainTarget.yukariPendingTheurgyAttackStacks = clamp((mainTarget.yukariPendingTheurgyAttackStacks || 0) + spent, 0, 2);
        if (mainTarget.highlightSkill) mainTarget.yukariPendingHighlightAmp = 0.114 * spent;
      }
      this.emit('heal', `Arrow of Life restored ${healed.toLocaleString()} party HP and spent ${spent} Whisperwind.`, {
        actorId: actor.id, targetId: mainTarget.id, amount: healed, resource: 'whisperwindStacks',
        sourceType, tone: 'heal'
      });
    }
    if (this.isMakoto(actor)) {
      if (isMakotoS1 || isMakotoS2) this.gainMakotoMoonPhase(actor, 2, sourceType);
      if (isMakotoS1) {
        actor.scarletHadesMultiplierBonus = 0.378;
        actor.scarletHadesBonusDuration = 2;
        actor.scarletHadesBonusGrace = true;
      }
      if (isMakotoS2) {
        for (const unit of this.state.party.filter(unit => unit.hp > 0)) {
          this.applyUnitBuff(unit, { id: 'makoto_nocturne_crit_damage', name: 'NOCTURNE CRIT DMG', stat: 'critDamage', value: 0.273, duration: 3 }, sourceType);
          if (actor.awareness >= 1) this.applyUnitBuff(unit, { id: 'makoto_nocturne_pierce', name: 'NOCTURNE PIERCE', stat: 'pierce', value: 0.1, duration: 3 }, 'awareness');
        }
        this.applyUnitBuff(actor, { id: 'makoto_nocturne_attack', name: 'NOCTURNE ATK', stat: 'attack', value: 0.227, duration: 3 }, sourceType);
      }
      if (isMakotoS3) {
        actor.moonPhaseStacks = 0;
        actor.moonPhaseDuration = 0;
        actor.fullMoonStacks = 0;
        actor.fullMoonDuration = 0;
        actor.scarletHadesMultiplierBonus = 0;
        actor.scarletHadesBonusDuration = 0;
        this.emit('resource', `${actor.codename} spent ${makotoMoonBefore} Moon Phase and ${makotoFullMoonBefore} Full Moon stacks.`, {
          actorId: actor.id, resource: 'moonPhaseStacks', amount: 0, fullMoonStacks: 0, sourceType, tone: 'phase'
        });
      }
    }
    this.triggerYukariErosionSupport(actor, enemyTargets, sourceType);
    this.triggerMakotoEntrustedHope(actor, skill, targetId, sourceType);
    if (jcMask) {
      this.grantJcFacade(actor, jcMask);
      this.applyJcMaskEffect(actor, jcMask);
      if (sourceType === 'character_skill') {
        actor.jcMaskActionsTaken += 1;
        actor.jcNextMaskSlot = skill.slot === 'S1' ? 'S2' : 'S1';
        // Strict Tolerance names a previous "skill attack." Gun uses sourceType
        // gun and is deliberately excluded. Highlights use their own sourceType
        // in this engine, so they stay excluded until a tooltip rules that they
        // count as a skill attack for this priority.
        actor.jcLastSkillAttackTargetId = enemyTargets[0]?.id || null;
        // Two Masks as One is an automatic skill. Resolve it at the Facade
        // transition itself so a queued extra action or a defeat cannot defer
        // or suppress the automatic S3.
        if (actor.facades.length >= 2) damage += this.resolveJcAutoTwoMasks(actor, 'facades_ready', highlightActionContext);
      }
    }
    if (isTwoMasks) {
      this.applyJcTwoMaskEffects(actor, facadePair, trueDesireEnhanced, mainTarget);
      actor.facades = [];
      if (trueDesireEnhanced && !this.usesLiveMechanics()) actor.trueDesireStacks = Math.max(0, actor.trueDesireStacks - 1);
      actor.trueDesirePrimed = false;
      this.emit('resource', `${actor.codename} spent all Facades.`, { actorId: actor.id, resource: 'facade', amount: 0, tone: 'phase' });
    }
    if (isOrangeBlossomBlade) {
      actor.rinFlamingSwordDance = true;
      actor.rinYanhuaBonusPower = 0;
      actor.rinYanhuaFlamesChance = 0;
      this.applyUnitBuff(actor, { id: 'rin_flaming_sword_dance', name: 'FLAMING SWORD DANCE', stat: 'damage', value: 0.399, duration: null }, sourceType);
      this.emit('buff', `${actor.codename} entered Flaming Sword Dance. Attack is replaced with Yanhua Slash until it is used or the turn ends.`, { actorId: actor.id, sourceType, tone: 'buff' });
    }
    if (isRinScarletSurprise) actor.rinYanhuaBonusPower = 0.847;
    if (isRinFireworkFinale) this.applyRinFireworkFinale(actor, enemyTargets);
    if (this.isRin(actor) && sourceType === 'highlight') {
      this.applyUnitBuff(actor, { id: 'rin_highlight_attack', name: 'FIRECRACKER HL ATK', stat: 'attack', value: 0.227, duration: 2 }, 'highlight');
      this.applyUnitBuff(actor, { id: 'rin_highlight_yanhua', name: 'FIRECRACKER HL YANHUA', stat: 'rinYanhuaDamage', value: 0.227, duration: 2 }, 'highlight');
    }
    if (isYanhuaSlash) {
      for (const target of enemyTargets) if (actor.rinYanhuaFlamesChance > 0 && this.random() < actor.rinYanhuaFlamesChance) this.addRinYearEndFlames(actor, target);
      this.endRinFlamingSwordDance(actor, 'Yanhua Slash');
    }
    if (isMatoiTorrent) this.applyMatoiTorrentEffects(actor, enemyTargets);
    if (isMatoiGuidance) {
      actor.extinguishStacks = Math.max(0, actor.extinguishStacks - Number(skill.matoiExtinguishCost || 2));
      this.emit('resource', `${actor.codename} spent ${skill.matoiExtinguishCost || 2} Extinguish stacks.`, { actorId: actor.id, resource: 'extinguishStacks', amount: actor.extinguishStacks, sourceType, tone: 'buff' });
      for (const target of enemyTargets) {
        const defenseDown = this.applyEnemyStatus(target, 'debuffs', { id: 'matoi_guidance_def', name: 'GUIDANCE DEF ↓', stat: 'defenseDown', value: Number(skill.matoiDefenseReduction || 0.085), duration: 2 }, sourceType, actor.id);
        if (defenseDown) this.emit('debuff', `${target.name}'s Defense fell by ${(defenseDown.value * 100).toFixed(1)}%.`, { actorId: actor.id, targetId: target.id, status: clone(defenseDown), sourceType, tone: 'debuff' });
      }
    }
    if (jcHighlightMask) this.applyJcHighlightEffect(actor, jcHighlightMask);
    if (skill.marianHighlight) this.applyMarianHighlightEffect(actor, targetId);
    if (berrySkill) {
      const target = enemyTargets[0];
      const isHighlight = skill.slot === 'HL';
      if (skill.name === 'Vorpal Butterfly' && !actor.firstButterflyUsed) {
        actor.firstButterflyUsed = true;
        this.gainBerryChain(actor);
      }
      if (isHighlight) {
        actor.berryHighlightUses += 1;
        this.gainBerryChain(actor);
        this.applyEnemyStatus(target, 'debuffs', { id: 'berry_lovesick_crit', name: 'LOVESICK CAN CRIT', duration: 3 }, 'highlight', actor.id);
      }
      if (skill.name === 'My Beloved Prince') {
        const status = this.lovesickStatus(target, actor);
        if (status) {
          status.duration = actor.lovesickDefinition?.duration ?? null;
          this.refreshLovesickDebuffs(target, actor);
          if (status.powerPerStack > 0) status.snapshots = [{ stacks: status.stacks,
            snapshot: this.captureLovesickSnapshot(actor, target, status.powerPerStack) }];
          this.emit('status_refresh', 'My Beloved Prince refreshed Lovesick duration.', { actorId: actor.id, targetId: target.id, duration: status.duration, sourceType, tone: 'debuff' });
        }
      }
      if (isHighlight) {
        damage += this.triggerContinuousDamage(target, { trigger: 'berry_highlight' });
        damage += this.triggerContinuousDamage(target, { lovesickOnly: true, trigger: 'berry_highlight_extra' });
        damage += this.triggerContinuousDamage(target, { lovesickOnly: true, trigger: 'berry_highlight_extra' });
      }
      // Kill chains are additional casts with no second SP charge. They resolve
      // sequentially, so each defeated minion picks the next living minion and
      // cannot loop after the field is cleared.
      if (skill.name === 'Vorpal Butterfly' && target.alive === false) {
        const nextTarget = this.nextBerryS1TargetAfterDefeat(target);
        if (nextTarget) damage += this.resolveSkill(actor, skill, nextTarget.id, 'berry_repeat', {
          ignoreCost: true, grantsHighlight: false, highlightActionContext, highlightNested: true,
          highlightRepeatReason: 'berry_s1_kill_reset'
        });
      }
    }
    if (isPaddleOut) {
      const cleansed = this.cleanseWavecatcher(actor);
      if (cleansed) this.emit('cleanse', `${actor.codename} removed ${cleansed} spiritual ailment${cleansed === 1 ? '' : 's'}.`, { actorId: actor.id, amount: cleansed, sourceType, tone: 'heal' });
      if (surfWasActive) {
        actor.surfActive = false;
        actor.offshoreStacks = 0;
        actor.surfReentryLocked = true;
        this.emit('stance', `${actor.codename} left Surf state.`, { actorId: actor.id, stance: 'surf', active: false, sourceType, tone: 'phase' });
      } else {
        actor.surfActive = true;
        this.emit('stance', `${actor.codename} entered Surf state.`, { actorId: actor.id, stance: 'surf', active: true, sourceType, tone: 'buff' });
        // Observed live: entering Surf ends her turn and triggers two Catch a Waves,
        // one on entry and the usual one at the end of her turn.
        if (this.config.wavecatcherSourceMechanics && this.config.wavecatcherFollowUps && sourceType === 'character_skill') this.resolveCatchAWave(actor, 'on entering Surf');
      }
    }
    if (skill.name === 'Jellyfish Splash') {
      const recoveryBase = this.config.wavecatcherSourceMechanics && actor.awareness >= 6 ? 60 : 40;
      const recoveryAmount = Math.round(recoveryBase * (Number.isFinite(Number(actor.spRecovery)) ? actor.spRecovery : 100) / 100);
      const restored = Math.min(recoveryAmount, this.spCap(actor) - actor.sp);
      actor.sp += restored;
      if (this.config.wavecatcherSourceMechanics) this.recordWavecatcherRecovery(actor, recoveryAmount, 'jellyfish_splash');
      this.emit('resource', `${actor.codename} recovered ${restored} SP.`, { actorId: actor.id, resource: 'sp', amount: restored, sourceType, tone: 'heal' });
    }
    if (isAerialTide && surfWasActive) {
      if (this.config.wavecatcherSourceMechanics && actor.awareness >= 6) {
        actor.pendingOffshoreReset = true;
        this.emit('stance', `${actor.codename} retained Surf after Aerial Tide; Offshore will reset at turn end.`, { actorId: actor.id, stance: 'surf', active: true, sourceType, tone: 'phase' });
      } else {
        actor.surfActive = false;
        actor.offshoreStacks = 0;
        actor.surfReentryLocked = true;
        this.emit('stance', `${actor.codename} spent Surf and Offshore on Aerial Tide.`, { actorId: actor.id, stance: 'surf', active: false, sourceType, tone: 'phase' });
      }
    }
    if (['character_skill', 'highlight'].includes(sourceType)) {
      this.triggerSoothingSunlight(actor, skill, targetId);
      this.triggerTrustProsperity(actor, skill, sourceType);
    }
    this.resolveWonderWeaponAllyTarget(actor, skill, targetId);
    damage += this.cosmicAfterSkill(actor, skill, targetId, sourceType, damage);
    damage += Number(characterHook(this, actor, 'afterSkill', skill, targetId, sourceType,
      { damage, critical: triggeredCritical, targets: enemyTargets, packets }) || 0);
    return damage;
  }

  resolveAllyTurnFollowUps(completedActorId) {
    if (!this.config.wavecatcherFollowUps) return;
    for (const unit of this.state.party) {
      if ((!this.config.wavecatcherSourceMechanics && unit.id === completedActorId) || unit.hp <= 0 || !unit.surfActive) continue;
      this.resolveCatchAWave(unit, 'after an ally turn');
    }
  }

  // One automatic Catch a Wave, if the unit has enough SP. Returns whether it fired.
  resolveCatchAWave(unit, reason = 'after an ally turn') {
    const cost = 30 * (unit.offshoreStacks + 1) * (this.config.wavecatcherSourceMechanics && unit.awareness >= 1 ? 0.6 : 1);
    if (unit.sp < cost) return false;
    const power = 0.584 * (1 + unit.offshoreStacks * 0.05);
    this.emit('follow_up', `${unit.codename} activated Catch a Wave ${reason}.`, {
      actorId: unit.id, skillId: 'catch_a_wave', sourceType: 'resonance_follow_up', tone: 'navigator'
    });
    const primaryRng = this.state.rng;
    this.state.rng = this.state.followUpRng;
    this.resolveSkill(unit, {
      id: 'catch_a_wave', slot: 'FU', name: 'Catch a Wave', element: 'ice', cost, power,
      target: 'all_enemies', note: 'Automatic Resonance follow up. Does not consume an Action or reduce Down points.'
    }, this.state.boss.id, 'resonance_follow_up', { canReduceDown: false, grantsHighlight: false });
    this.state.followUpRng = this.state.rng;
    this.state.rng = primaryRng;
    unit.catchAWaveCount = Number(unit.catchAWaveCount || 0) + 1;
    const offshoreCap = this.config.wavecatcherSourceMechanics
      ? 4 + (unit.awareness >= 1 ? 2 : 0) + (unit.awareness >= 6 ? 2 : 0)
      : 4;
    unit.offshoreStacks = clamp(unit.offshoreStacks + 1, 0, offshoreCap);
    this.emit('resource', `${unit.codename} gained Offshore ${unit.offshoreStacks}.`, {
      actorId: unit.id, resource: 'offshoreStacks', amount: unit.offshoreStacks, sourceType: 'resonance_follow_up', tone: 'buff'
    });
    if (this.config.wavecatcherSourceMechanics && unit.awareness >= 2 && unit.catchAWaveCount % 4 === 0) {
      const bonusRng = this.state.rng;
      this.state.rng = this.state.followUpRng;
      this.resolveSkill(unit, {
        id: 'catch_a_wave_special', slot: 'FU', name: 'Roaring Surf Line', element: 'ice', cost: 0, power,
        target: 'all_enemies', note: 'Every fourth Catch a Wave repeats without SP cost and cannot reduce Down points.'
      }, this.state.boss.id, 'resonance_follow_up', { ignoreCost: true, canReduceDown: false, grantsHighlight: false });
      this.state.followUpRng = this.state.rng;
      this.state.rng = bonusRng;
    }
    return true;
  }

  recordWavecatcherRecovery(unit, amount, sourceType) {
    if (!this.isWavecatcher(unit) || amount <= 0) return;
    unit.totalRecoveredSp = Number(unit.totalRecoveredSp || 0) + amount;
    const thresholds = [
      [100, 'miyu_recovered_attack', 'RECOVERED SP ATK', 'attack', 0.25],
      [200, 'miyu_recovered_damage', 'RECOVERED SP DMG', 'damage', 0.25],
      [300, 'miyu_recovered_crit', 'RECOVERED SP CRIT', 'critRate', 0.12],
      [400, 'miyu_recovered_crit_damage', 'RECOVERED SP CRIT DMG', 'critDamage', 0.24]
    ];
    for (const [threshold, id, name, stat, value] of thresholds) {
      if (unit.totalRecoveredSp >= threshold && !unit.buffs.some(buff => buff.id === id)) {
        this.applyUnitBuff(unit, { id, name, stat, value, duration: 999 }, 'awareness');
      }
    }
    this.emit('resource', `${unit.codename} total recovered SP reached ${Math.floor(unit.totalRecoveredSp)}.`, {
      actorId: unit.id, resource: 'totalRecoveredSp', amount: unit.totalRecoveredSp, sourceType, tone: 'heal'
    });
  }

  stepMedicine(medicineId, targetId) {
    if (this.state.phase !== 'battle') throw new Error('Encounter is over');
    const action = this.getMedicineActions().find(candidate => candidate.id === medicineId);
    const target = byId(this.state.party, targetId);
    if (!action || !target || target.hp <= 0) throw new Error('Medicine action unavailable');
    const actor = this.actor;
    this.state.lastEvents = [];
    actor.midsummerPrescription -= 1;
    actor.medicineUses += 1;
    actor.lastMedicineCharacterTurn = actor.characterTurnsStarted;
    this.emit('medicine', `${actor.codename} used ${action.name} on ${target.codename} through Flower Basket Pharmacy.`, { actorId: actor.id, targetId: target.id, medicineId, sourceType: 'medicine', tone: 'navigator' });
    this.applyMedicineEffects(action, target, actor, 'medicine');
    this.recordFrame(`Medicine · ${action.name}`);
    return { nextState: this.config.fastMode ? null : this.getObservation(), reward: 0, done: false, consumedAction: false, events: this.config.fastMode ? [] : clone(this.state.history.at(-1).events) };
  }

  applyMedicineEffects(action, target, actor, sourceType) {
    const isMarianMedicine = this.isMarian(actor);
    const isLiveMarianMedicine = this.usesLiveMechanics() && isMarianMedicine;
    const legacyOrLiveMultiplier = isLiveMarianMedicine
      ? Number(action.effectiveValue ?? action.buff.value)
      : Number(action.buff.value) * (1 + (actor.medicineEffectBonus || 0) + (actor.nextMedicineEffectBonus || 0));
    const medicineBuff = { ...clone(action.buff), value: legacyOrLiveMultiplier };
    if (isLiveMarianMedicine) Object.assign(medicineBuff, {
      duration: action.effectiveDuration, baseValue: action.baseValue, baseDuration: action.baseDuration,
      effectiveValue: action.effectiveValue, effectiveDuration: action.effectiveDuration,
      magnitudeSource: 'Base tooltip plus sourced A1 and preceding Highlight bonus; observed 1.58 remains unresolved.'
    });
    this.applyUnitBuff(target, medicineBuff, sourceType);
    this.emit('buff', `${medicineBuff.name} applied to ${target.codename}.`, { targetId: target.id, status: { ...clone(medicineBuff), sourceType }, sourceType, tone: 'buff' });
    if (!isMarianMedicine) return { medicineBuff, healed: 0 };
    const critMult = this.marianScalingCriticalMultiplier(actor);
    const critDamage = Math.max(0, (critMult - 1) / 6);
    if (critDamage > 0) this.applyUnitBuff(target, { id: 'medicine_crit_damage', name: 'MEDICINE CRIT DMG', stat: 'critDamage', value: critDamage, duration: 1 }, sourceType);
    if (actor.awareness >= 6) this.applyUnitBuff(target, { id: 'marian_a6_refresh', name: 'SUMMERTIME REFRESH', stat: 'finalDamage', value: 0.15, duration: 1 }, 'awareness');
    const healed = Math.min(Math.round(actor.maxHp * 0.08), target.maxHp - target.hp);
    target.hp += healed;
    actor.nextMedicineEffectBonus = 0;
    this.emit('heal', `${target.codename} recovered ${healed.toLocaleString()} HP from Seaside First Aid.`, { amount: healed, targetId: target.id, sourceType, tone: 'heal' });
    return { medicineBuff, healed };
  }

  // Recharge clock (Joker, 2026-09-09, from Sleepy's DOD run pressing the A6 button at
  // T1, T18 and B3): every counted action by any party member, Concert turns
  // included, on an 8-action period. Replaces the earlier Wonder-only reading.
  recordTrueDesireWonderAction(actionType, wasConcertAction = false) {
    if (!this.usesLiveMechanics()) return;
    // Hachiman live (Joker's DOD run, 2026-09-10): the button pressed at T1 was
    // back at the start of T10 and not before, and after the T18 press it was
    // absent at B3 and B4. That fits a clock of J&C's own counted actions
    // (eight, Concert turns included) and rules out the party-action reading,
    // under which it would have returned at T3 and again at B3. Other encounters
    // keep the Wonder-only normal-turn clock their benchmarks were built on.
    if (this.isHachimanLive()) {
      if (!this.isJc(this.actor)) return;
    } else if (wasConcertAction || this.actor?.id !== 'wonder') return;
    if (!this.actor || this.actor.hp <= 0) return;
    const recipients = this.state.party.filter(unit => this.isJc(unit) && unit.awareness >= 6
      && Array.isArray(unit.trueDesireRechargeCountedActionTypes)
      && unit.trueDesireRechargeCountedActionTypes.includes(actionType));
    for (const jc of recipients) {
      const interval = Number(jc.trueDesireRechargeInterval || 8);
      jc.trueDesireWonderActions = Number(jc.trueDesireWonderActions || 0) + 1;
      jc.trueDesireRechargeProgress = jc.trueDesireWonderActions % interval;
      if (jc.trueDesireRechargeProgress !== 0) continue;

      // A recharge is periodic even when the existing stack is unspent. Keep
      // the live resource capped at one and leave a stored enhancement alone.
      jc.trueDesireStacks = clamp(Number(jc.trueDesireStacks || 0), 0, 1);
      if (jc.trueDesireStacks >= 1) continue;
      jc.trueDesireStacks = 1;
      this.emit('resource', `${jc.codename} regained 1 True Desire after ${interval} counted ${this.isHachimanLive() ? 'J&C' : 'Wonder'} actions.`, {
        actorId: jc.id, resource: 'trueDesire', amount: jc.trueDesireStacks, tone: 'buff',
        rechargeOwner: jc.trueDesireRechargeOwner,
        rechargeCountBasis: jc.trueDesireRechargeCountBasis,
        countedActionType: actionType,
        trueDesireWonderActions: jc.trueDesireWonderActions,
        trueDesireRechargeProgress: jc.trueDesireRechargeProgress,
        trueDesireRechargeInterval: interval,
        evidence: jc.trueDesireRechargeEvidence
      });
    }
  }

  completeCountedAction({ actionType = null, wasConcertAction = false, rinStanceAction = false, grantsSharedHighlight = false, highlightSource = 'character_action', highlightActionContext = null } = {}) {
    if (grantsSharedHighlight) this.resolveCountedActionHighlight(highlightActionContext, highlightSource);
    // Kotone's Fortune extra actions are not counted actions.
    if (this.kotoneMechanics?.deferCompletion()) {
      this.updateBossPhase();
      if (this.allEnemiesDefeated()) this.finish('victory');
      return { done: this.state.phase !== 'battle', consumedAction: false, extraActionPending: true };
    }
    if (!rinStanceAction) this.cosmicEndCountedAction(this.actor.id);
    if (!rinStanceAction) notifyCharacterActionEnd(this, this.actor, { actionType, wasConcertAction,
      isExtraAction: this.state.characterExtraAction?.actorId === this.actor.id });
    this.recordTrueDesireWonderAction(actionType, wasConcertAction);
    this.updateBossPhase();
    if (!wasConcertAction && !rinStanceAction) this.state.actionNumber += 1;
    if (this.allEnemiesDefeated()) {
      this.finish('victory');
      return { done: true, consumedAction: !rinStanceAction };
    }
    if (rinStanceAction) return { done: false, consumedAction: false };
    if (this.state.sharedCombat.pendingActions.length) this.state.sharedCombat.pendingTurnCompletion = true;
    else this.consumeTurnAction();
    return { done: this.state.phase !== 'battle', consumedAction: true };
  }

  stepItem(itemId, targetId) {
    if (this.state.phase !== 'battle') throw new Error('Encounter is over');
    const action = this.getItemActions().find(candidate => candidate.itemId === itemId);
    const target = byId(this.state.party, targetId);
    if (!action?.enabled || !target || target.hp <= 0) throw new Error('Item action unavailable');
    const actor = this.actor;
    this.state.lastEvents = [];
    const highlightActionContext = this.createSharedHighlightActionContext({
      actor, actionType: 'item', skill: action, concertAtActionStart: this.isVirtualConcertActive()
    });
    this.state.itemInventory[itemId] -= 1;
    this.state.itemUsesRemaining -= 1;
    this.emit('item', `${actor.codename} used ${action.name} on ${target.codename}.`, { actorId: actor.id, targetId: target.id, itemId, remaining: this.state.itemInventory[itemId], usesRemaining: this.state.itemUsesRemaining, sourceType: 'item', tone: 'navigator' });
    this.applyMedicineEffects(action, target, actor, 'item');
    const completion = this.completeCountedAction({
      actionType: 'item',
      wasConcertAction: highlightActionContext?.concertAtActionStart === true,
      grantsSharedHighlight: this.usesLiveMechanics(), highlightSource: 'item', highlightActionContext
    });
    this.recordFrame(`Item · ${action.name}`);
    return { nextState: this.config.fastMode ? null : this.getObservation(), reward: 0, done: completion.done, consumedAction: completion.consumedAction, events: this.config.fastMode ? [] : clone(this.state.history.at(-1).events) };
  }

  selectPersona(personaId) {
    if (this.actor?.id !== 'wonder') throw new Error('Persona selection is only available during Wonder’s turn');
    const persona = byId(this.personaDefinitions, personaId);
    if (!persona || !this.config.personaIds.includes(personaId)) throw new Error('Persona unavailable');
    this.state.lastEvents = [];
    const changed = this.state.activePersonaId !== personaId;
    this.state.activePersonaId = personaId;
    if (changed) {
      this.syncPersonaPassiveEffects();
      this.resolveWonderWeaponPersonaChange();
    }
    this.emit('switch', `Wonder equipped ${persona.name}. Choose a skill to continue.`, { actorId: 'wonder', personaId, tone: 'switch' });
    this.recordFrame(`Select ${persona.name}`);
    return { nextState: this.config.fastMode ? null : this.getObservation(), reward: 0, done: false, events: this.config.fastMode ? [] : clone(this.state.history.at(-1).events), consumedAction: false };
  }

  stepAkihikoFlash(action) {
    const actor = this.actor;
    if (!this.isAkihiko(actor) || actor.mettleStacks < 6) throw new Error('Flash Blow requires 6 Mettle');
    this.state.lastEvents = [];
    actor.mettleStacks -= 6;
    actor.lastFlashCharacterTurn = actor.characterTurnsStarted;
    if (actor.awareness >= 2) this.applyUnitBuff(actor, {
      id: 'akihiko_flash_damage', name: 'GUARDIAN FIST', stat: 'damage', value: 0.3, duration: 3
    }, 'awareness');
    const downedBefore = new Set(this.enemies.filter(enemy => enemy.downed).map(enemy => enemy.id));
    const reward = this.resolveSkill(actor, action.skill, this.state.boss.id, 'resonance_follow_up', {
      ignoreCost: true, grantsHighlight: false, canReduceDown: false
    });
    for (const target of this.enemies.filter(enemy => downedBefore.has(enemy.id))) {
      this.applyEnemyStatus(target, 'debuffs', {
        id: 'akihiko_flash_down_bonus', name: 'FLASH BLOW DOWN BONUS',
        damageTaken: true, value: 0.08, duration: 1
      }, 'resonance_follow_up', actor.id);
    }
    this.gainAkihikoGrit(actor, 1, 'resonance_follow_up');
    this.emit('resource', `${actor.codename} spent 6 Mettle on Flash Blow.`, {
      actorId: actor.id, resource: 'mettleStacks', amount: actor.mettleStacks,
      sourceType: 'resonance_follow_up', tone: 'phase'
    });
    this.recordFrame('Flash Blow');
    return { nextState: this.config.fastMode ? null : this.getObservation(), reward, done: false,
      events: this.config.fastMode ? [] : clone(this.state.history.at(-1).events), consumedAction: false };
  }

  step(action) {
    if (this.state.phase !== 'battle') return { nextState: this.getObservation(), reward: 0, done: true, events: [] };
    this.state.lastEvents = [];
    const legal = this.getAvailableActions().find(candidate => candidate.skillId === action.skillId && candidate.type === action.type);
    if (!legal || !legal.enabled) throw new Error('Unavailable action');
    if (legal.type === 'cosmic_color') return this.stepCosmicColor(legal);
    if (legal.type === 'cosmic_assemble') return this.stepCosmicAssemble(legal);
    if (legal.type.startsWith('kotone_')) return this.kotoneMechanics.stepControl(legal, action.targetId);
    if (legal.type === 'support_extra') return this.resolveNextSupportAction();
    if (legal.type === 'akihiko_flash') return this.stepAkihikoFlash(legal);
    if (['one_more', 'all_out_attack', 'skip_extra_actions'].includes(legal.type)) return this.stepSharedCombat(legal, action.targetId);
    if (legal.type === 'switch') return this.selectPersona(legal.personaId);
    if (legal.type === 'item') return this.stepItem(legal.itemId, action.targetId);
    if (legal.type === 'berry_alt' && legal.skill.slot === 'HL') return this.stepBerryFreeHighlight(legal, action.targetId);
    const wasConcertAction = this.isVirtualConcertActive();
    const actor = this.actor;
    // Leaving Surf with Paddle Out does not use the action (source: other skills
    // can be used that turn, but Surf cannot be re-entered).
    const surfExitAction = this.config.wavecatcherSourceMechanics && legal.type === 'skill'
      && legal.skill?.name === 'Paddle Out' && this.isWavecatcher(actor) && actor.surfActive === true;
    const rinStanceAction = legal.type === 'rin_stance' || surfExitAction;
    const highlightActionContext = this.usesLiveMechanics() && !rinStanceAction
      ? this.createSharedHighlightActionContext({ actor, actionType: legal.type, skill: legal.skill, concertAtActionStart: wasConcertAction })
      : null;
    if (this.isJc(actor) && !this.usesLiveMechanics()) this.resolveJcAutoTwoMasks(actor, 'turn_start');
    let reward = 0;
    if (legal.type === 'guard') {
      actor.guarding = true;
      actor.sp = clamp(actor.sp + 12, 0, actor.maxSp);
      if (this.usesLiveMechanics()) this.resolveCountedActionHighlight(highlightActionContext, 'guard');
      else actor.highlight = clamp(actor.highlight + (wasConcertAction ? 16 : 8), 0, 100);
      this.emit('guard', `${actor.codename} guarded and recovered 12 SP.`, { actorId: actor.id, sourceType: 'character_action', tone: 'guard' });
    } else {
      if (legal.type === 'gun') actor.ammo -= 1;
      const sourceType = legal.type === 'gun' ? 'gun'
        : ['attack', 'rin_yanhua'].includes(legal.type) ? (legal.type === 'rin_yanhua' ? 'character_skill' : 'basic_attack')
          : actor.id === 'wonder' ? 'persona_skill' : 'character_skill';
      reward = this.resolveSkill(actor, legal.skill, action.targetId, sourceType, { highlightActionContext });
      if (legal.type === 'berry_alt') {
        actor.doubleBerryUsed[legal.skill.slot] = true;
        const target = this.findEnemy(action.targetId);
        const repeatTarget = target?.alive === false ? this.enemies.find(enemy => enemy.alive !== false) : target || this.state.boss;
        if (repeatTarget) reward += this.resolveSkill(actor, legal.skill, repeatTarget.id, 'berry_repeat', {
          ignoreCost: true, grantsHighlight: false, highlightActionContext, highlightNested: true,
          highlightRepeatReason: 'berry_alt_repeat'
        });
        this.emit('berry_alt_used', `${legal.skill.name}'s DOUBLE BERRY repeat is spent for this battle.`, { actorId: actor.id, slot: legal.skill.slot, sourceType: 'awareness', tone: 'phase' });
      }
      if (['skill', 'berry_alt', 'rin_stance'].includes(legal.type) && Number(legal.skill.cooldown || 0) > 0) {
        actor.skillCooldowns[legal.skill.id] = this.usesLiveMechanics() && this.isMarian(actor) && legal.skill.name === 'Gentle Sea Breeze' ? 3 : Number(legal.skill.cooldown);
      }
    }
    // Resolve the counted action's charge plus eligible Berry S1 kill-reset
    // casts at this boundary. Free recasts do not consume another turn or SP.
    const damageBeforeCompletion = this.state.totalDamage;
    const completion = this.completeCountedAction({
      actionType: legal.type,
      wasConcertAction, rinStanceAction,
      // Live Hachiman (Joker's DOD run, 2026-09-10): Guard fills the shared gauge
      // like any counted action (0 to 17 to 34 to 51 across the T1 guards).
      grantsSharedHighlight: this.usesLiveMechanics() && (legal.type !== 'guard' || this.isHachimanLive()) && !rinStanceAction,
      highlightActionContext
    });
    if (this.state.party.some(unit => this.isCosmicYui(unit))) reward += this.state.totalDamage - damageBeforeCompletion;
    if (rinStanceAction) {
      this.recordFrame(legal.name);
      return { nextState: this.config.fastMode ? null : this.getObservation(), reward, done: completion.done, events: this.config.fastMode ? [] : clone(this.state.history.at(-1).events), consumedAction: false };
    }
    this.recordFrame(legal.name);
    return { nextState: this.config.fastMode ? null : this.getObservation(), reward, done: completion.done, events: this.config.fastMode ? [] : clone(this.state.history.at(-1).events), consumedAction: completion.consumedAction };
  }

  stepNavigator(skillId) {
    if (this.state.phase !== 'battle') throw new Error('Encounter is over');
    this.state.lastEvents = [];
    let action = this.getNavigatorActions().find(skill => skill.id === skillId);
    if (!action?.enabled) throw new Error('Navigator action unavailable');
    action = characterHook(this, this.state.navigator, 'beforeNavigatorSkill', action) || action;
    this.emit('navigator', `${this.state.navigator.codename} cut in with ${action.name}!`, { actorId: this.state.navigator.id, skillId, sourceType: 'navigator', tone: 'navigator' });
    const mikuTrackSkill = this.isMikuNavigator() && ['Feel the Beat', 'Clear Sound'].includes(action.name);
    const mikuShowstopper = this.isMikuNavigator() && action.name === 'Showstopper';
    if (mikuTrackSkill) {
      this.applyMikuTrackSkill(action);
    } else if (mikuShowstopper) {
      this.startVirtualConcert(action);
    } else if (action.buff) {
      for (const unit of this.state.party) this.applyUnitBuff(unit, action.buff, 'navigator');
      this.emit('buff', `${action.buff.name} applied to the party.`, { targetId: 'party', status: { ...clone(action.buff), sourceType: 'navigator' }, sourceType: 'navigator', tone: 'buff' });
    }
    if (action.actionBonus && !mikuShowstopper) {
      this.state.turnActionsTotal += action.actionBonus;
      this.emit('action_bonus', `Current turn action limit increased to ${this.state.turnActionsTotal}.`, { amount: action.actionBonus, tone: 'navigator' });
    }
    if (!mikuTrackSkill && !mikuShowstopper && (action.heal || action.healAttack || action.healFlat || action.spRestore)) {
      let healed = 0;
      for (const unit of this.state.party) {
        const amount = Math.round(unit.maxHp * (action.heal || 0) + this.state.navigator.attack * (action.healAttack || 0) + (action.healFlat || 0));
        const actual = Math.min(amount, unit.maxHp - unit.hp);
        unit.hp += actual;
        unit.sp = clamp(unit.sp + (action.spRestore || 0), 0, unit.maxSp);
        healed += actual;
      }
      this.emit('heal', `The party recovered ${healed.toLocaleString()} HP and ${action.spRestore || 0} SP.`, { amount: healed, targetId: 'party', sourceType: 'navigator', tone: 'heal' });
    }
    if (!mikuTrackSkill && !mikuShowstopper && action.navigatorIndependent !== true) this.state.navigator.cooldowns[skillId] = action.cooldown;
    this.state.navigator.uses += 1;
    if (action.navigatorIndependent !== true) this.state.navigator.lastUsedAttackTurn = this.state.attackTurn;
    characterHook(this, this.state.navigator, 'afterNavigatorSkill', action);
    this.recordFrame(`Navigator · ${action.name}`);
    return { nextState: this.config.fastMode ? null : this.getObservation(), done: false, consumedAction: false, events: this.config.fastMode ? [] : clone(this.state.history.at(-1).events) };
  }

  stepBerryFreeHighlight(action, targetId = this.state.boss.id) {
    const actor = this.actor;
    actor.doubleBerryUsed.HL = true;
    const gaugeBefore = this.usesLiveMechanics() ? this.state.sharedCombat.highlight : actor.highlight;
    const reward = this.resolveSkill(actor, action.skill, targetId, 'highlight');
    if (this.usesLiveMechanics()) this.state.sharedCombat.highlight = gaugeBefore;
    else actor.highlight = gaugeBefore;
    this.emit('berry_alt_used', 'DOUBLE BERRY Highlight is spent for this battle. Gauge and cooldown are unchanged.', { actorId: actor.id, slot: 'HL', sourceType: 'awareness', tone: 'phase' });
    this.updateBossPhase();
    if (this.allEnemiesDefeated()) this.finish('victory');
    this.recordFrame(action.name);
    return { nextState: this.config.fastMode ? null : this.getObservation(), reward, done: this.state.phase !== 'battle', consumedAction: false, events: this.config.fastMode ? [] : clone(this.state.history.at(-1).events) };
  }

  stepHighlight(actorOrSkillId, targetId = this.state.boss.id) {
    if (this.state.phase !== 'battle') throw new Error('Encounter is over');
    this.state.lastEvents = [];
    const action = this.getHighlightActions().find(candidate => candidate.enabled && candidate.skillId === actorOrSkillId)
      || this.getHighlightActions().find(candidate => candidate.enabled && candidate.actorId === actorOrSkillId);
    if (!action) throw new Error('Highlight unavailable');
    const actor = byId(this.state.party, action.actorId);
    const wasConcertAction = this.isVirtualConcertActive();
    if (this.usesLiveMechanics()) this.setSharedHighlight(0, 'highlight');
    else actor.highlight = 0;
    const highlightSkill = { ...action.skill, actionDamageBonus: Number(actor.yukariPendingHighlightAmp || 0) };
    actor.yukariPendingHighlightAmp = 0;
    const reward = this.resolveSkill(actor, highlightSkill, targetId, 'highlight');
    if (this.state.party.some(unit => this.isYukari(unit) && unit.hp > 0)) {
      this.applyUnitBuff(actor, { id: 'yukari_tailwinds_air_trigger', name: "TAILWIND'S AIR DAMAGE", stat: 'damage', value: 0.2, duration: 2 }, 'passive');
    }
    if (this.usesLiveMechanics()) {
      const key = action.skill.jcHighlightMask || 'HL';
      actor.highlightCooldowns[key] = this.isJc(actor) ? 4 : Number(action.skill.cooldown || 0);
      // Explicit unresolved timing policy: the owner's current turn gets grace.
      // Other allies never decrement this clock. Concert owner actions do.
      actor.highlightCooldownGrace[key] = this.actor.id === actor.id ? actor.characterTurnsStarted : null;
      this.emit('cooldown', `${actor.codename} Highlight cooldown: ${actor.highlightCooldowns[key]}.`, { actorId: actor.id, key, amount: actor.highlightCooldowns[key], durationClock: 'owner_counted_action_end', sameTurnGrace: 'provisional', tone: 'system' });
    }
    if (this.isMikuNavigator() && Number(this.state.navigator.awareness || 0) >= 4) {
      this.applyUnitBuff(actor, { id: 'miku_a4_highlight_attack', name: 'MIKU A4 HIGHLIGHT ATK', stat: 'attack', value: 0.25, duration: 2, mikuGranted: true }, 'awareness');
    }
    notifyCharacterSpecialAction(this, actor, { actionType: 'highlight', skill: highlightSkill });
    this.updateBossPhase();
    if (!wasConcertAction && !this.usesLiveMechanics()) this.state.actionNumber += 1;
    if (this.allEnemiesDefeated()) this.finish('victory');
    this.recordFrame(action.name);
    return { nextState: this.config.fastMode ? null : this.getObservation(), reward, done: this.state.phase !== 'battle', consumedAction: false, events: this.config.fastMode ? [] : clone(this.state.history.at(-1).events) };
  }

  consumeTurnAction() {
    if (this.state.characterExtraAction?.actorId === this.actor.id) {
      this.state.characterExtraAction = null;
      return this.finishOwnerTurnIfReady();
    }
    if (this.isRin(this.actor) && this.actor.rinFlamingSwordDance) this.endRinFlamingSwordDance(this.actor, 'turn end');
    if (this.usesLiveMechanics()) {
      for (const key of Object.keys(this.actor.highlightCooldowns)) {
        if (this.actor.highlightCooldownGrace[key] === this.actor.characterTurnsStarted) continue;
        this.actor.highlightCooldowns[key] = Math.max(0, this.actor.highlightCooldowns[key] - 1);
      }
    }
    this.state.turnActionsUsed += 1;
    if (!this.isVirtualConcertActive()) {
      const completedActorId = this.actor.id;
      const mikuTrackSkills = this.isMikuNavigator()
        ? this.state.navigator.skills.filter(skill => ['Feel the Beat', 'Clear Sound'].includes(skill.name))
        : [];
      const sharedBefore = mikuTrackSkills.length ? Math.max(...mikuTrackSkills.map(skill => this.state.navigator.cooldowns[skill.id])) : 0;
      for (const skill of this.state.navigator.skills) {
        if (this.isMikuNavigator() && skill.name === 'Showstopper' && completedActorId !== 'wonder') continue;
        this.state.navigator.cooldowns[skill.id] = Math.max(0, this.state.navigator.cooldowns[skill.id] - 1);
      }
      const sharedAfter = mikuTrackSkills.length ? Math.max(...mikuTrackSkills.map(skill => this.state.navigator.cooldowns[skill.id])) : 0;
      if (sharedBefore > 0 && sharedAfter === 0) {
        if (this.state.navigator.openingCooldown) {
          this.state.navigator.openingCooldown = false;
        } else {
          this.state.navigator.songIndex = (this.state.navigator.songIndex + 1) % mikuSongs.length;
          this.state.navigator.currentSong = mikuSongs[this.state.navigator.songIndex];
          this.emit('song', `MIKU changed the battle song to ${this.state.navigator.currentSong}.`, {
            actorId: this.state.navigator.id, sourceType: 'navigator', song: this.state.navigator.currentSong, tone: 'navigator'
          });
        }
      }
    }
    let extraController = this.actor;
    let extraRequest = characterHook(this, this.actor, 'getExtraActionRequest');
    if (!extraRequest) {
      const navigatorRequest = characterHook(this, this.state.navigator, 'getAllyExtraActionRequest', this.actor);
      if (navigatorRequest) {
        extraRequest = navigatorRequest;
        extraController = this.state.navigator;
      }
    }
    const extraStarted = extraRequest && this.actor.hp > 0 && (extraController.id === this.actor.id
      ? characterHook(this, this.actor, 'onExtraActionStart')
      : characterHook(this, extraController, 'onAllyExtraActionStart', this.actor, extraRequest)) === true;
    if (extraStarted) {
      this.state.characterExtraAction = { actorId: this.actor.id, reason: extraRequest.reason, controllerId: extraController.id };
      this.emit('extra_action', `${this.actor.codename} can take an extra action.`, { actorId: this.actor.id, sourceType: 'character_extra_action', tone: 'phase' });
      this.notifyExtraActionStart(this.actor, 'extra action');
      return;
    }
    return this.finishOwnerTurnIfReady();
  }

  finishOwnerTurnIfReady() {
    if (this.state.turnActionsUsed < this.state.turnActionsTotal) return;
    const completedActorId = this.actor.id;
    if (!this.isVirtualConcertActive()) {
      this.advanceSupportTiming(completedActorId, 'normal_turn_end');
      this.kotoneMechanics?.normalTurnEnd(completedActorId);
    }
    this.resolveAllyTurnFollowUps(completedActorId);
    if (this.config.wavecatcherSourceMechanics && this.isWavecatcher(this.actor) && this.actor.awareness >= 6 && this.actor.pendingOffshoreReset) {
      this.actor.pendingOffshoreReset = false;
      this.actor.offshoreStacks = 0;
      const recovered = Math.min(this.actor.maxSp, this.spCap(this.actor) - this.actor.sp);
      this.actor.sp += recovered;
      this.recordWavecatcherRecovery(this.actor, recovered, 'a6_aerial_tide_reset');
      this.emit('resource', `${this.actor.codename} lost Offshore and recovered max SP at turn end.`, {
        actorId: this.actor.id, resource: 'sp', amount: this.actor.sp, recovered, sourceType: 'awareness', tone: 'heal'
      });
    }
    this.cosmicEndOwnerTurn(this.actor);
    characterHook(this, this.actor, 'onTurnEnd');
    this.resolveWonderWeaponTurnEnd(this.actor);
    for (const unit of this.state.party.filter(unit => this.isBerry(unit) && unit.powerOfLove > 0)) {
      unit.powerOfLove -= 1;
      if (!unit.powerOfLove) {
        unit.hp = 0;
        this.emit('knockout', `${unit.codename}'s Power of Love expired.`, { actorId: unit.id, sourceType: 'awareness', tone: 'damage' });
        notifyCharacterKnockout(this, unit, { sourceType: 'awareness', reason: 'power_of_love_expired' });
      }
    }
    this.updateBossPhase();
    if (this.state.party.every(unit => unit.hp <= 0)) return this.finish('defeat');
    if (this.allEnemiesDefeated()) return this.finish('victory');
    this.advanceActor();
  }

  advanceActor() {
    if (this.usesEnemyTimeline() && !this.isVirtualConcertActive()) return this.advanceActorWithEnemyTimeline();
    if (this.actor) this.actor.surfReentryLocked = false;
    this.state.actorIndex += 1;
    while (this.state.actorIndex < this.state.party.length && this.state.party[this.state.actorIndex].hp <= 0) this.state.actorIndex += 1;
    if (this.state.actorIndex >= this.state.party.length) {
      if (this.isVirtualConcertActive()) return this.endVirtualConcertRound();
      return this.endAttackTurn();
    }
    this.state.turnActionsUsed = 0;
    this.state.turnActionsTotal = this.actor.actionLimit || 1;
    this.beginActorTurn();
  }

  advanceActorWithEnemyTimeline() {
    if (this.actor) this.actor.surfReentryLocked = false;
    if (this.startTimelinePartySlot(this.state.actorIndex + 1)) return;
    this.runEnemiesBefore(null);
    return this.endAttackTurn();
  }

  startTimelinePartySlot(startIndex = 0) {
    for (let index = startIndex; index < this.state.party.length; index += 1) {
      this.state.actorIndex = index;
      this.runEnemiesBefore(this.state.party[index].id);
      if (this.state.party.every(unit => unit.hp <= 0)) {
        this.finish('defeat');
        return true;
      }
      if (this.state.party[index].hp <= 0) continue;
      this.state.turnActionsUsed = 0;
      this.state.turnActionsTotal = this.actor.actionLimit || 1;
      this.beginActorTurn();
      return true;
    }
    this.state.actorIndex = this.state.party.length;
    return false;
  }

  endVirtualConcertRound() {
    const concert = this.state.navigator.virtualConcert;
    // Concert freezes normal action slots, not duration countdowns. Every
    // Concert party turn advances both party and enemy status durations.
    this.tickStatuses({ sharedDotTicks: false });
    if (this.state.party.every(unit => unit.hp <= 0)) return this.finish('defeat');
    concert.roundsRemaining -= 1;
    if (concert.roundsRemaining > 0) {
      this.state.actorIndex = this.state.party.findIndex(unit => unit.hp > 0);
      this.state.turnActionsUsed = 0;
      this.state.turnActionsTotal = this.actor?.actionLimit || 1;
      this.beginActorTurn();
      this.emit('concert_round', `Virtual Concert extra turn 2 begins. Normal Actions and foe turns remain frozen.`, {
        actorId: this.state.navigator.id, sourceType: 'navigator', roundsRemaining: concert.roundsRemaining, tone: 'phase'
      });
      return;
    }
    this.finishVirtualConcert();
    this.updateBossPhase();
    if (this.allEnemiesDefeated()) this.finish('victory');
  }

  endAttackTurn() {
    if (this.usesEnemyTimeline()) return this.endAttackTurnWithEnemyTimeline();
    const completedWeakenedTurn = this.isBossWeakened() && this.state.boss.weakenedGraceTurn !== this.state.attackTurn;
    this.bossAction();
    this.tickStatuses();
    this.advanceSurtEncounterStacks();
    for (const enemy of [this.state.boss, ...this.state.boss.summons]) {
      if (enemy.downed) { enemy.downed = false; enemy.downPoints = enemy.downMax; }
    }
    const genericSummonRespawn = !this.usesLiveMechanics() || this.state.boss.summonRespawnPolicy !== 'scripted_only';
    if (genericSummonRespawn && this.state.boss.encounter?.kind !== 'fixed_five_targets' && this.state.boss.summons.length && this.state.boss.summons.every(enemy => !enemy.alive)) this.respawnSummons();
    this.state.attackTurnsLeft -= 1;
    if (this.state.party.every(unit => unit.hp <= 0)) return this.finish('defeat');
    if (completedWeakenedTurn && ['nexus', 'devourer'].includes(this.state.boss.modeId)) {
      this.state.boss.weakenedTurnsLeft -= 1;
      if (this.state.boss.weakenedTurnsLeft <= 0) return this.finish('break_window_complete');
    }
    if (this.isDreamscapeRun()) {
      this.state.attackTurnsLeft = Math.max(0, this.state.attackTurnsLeft);
      this.state.scoreBreakdown.observedSurvivalMultiplier = getObservedDreamscapeMultiplier(this.state.attackTurnsLeft);
      if (this.state.attackTurn >= Number(this.state.boss.previewAttackTurns || this.state.boss.turnLimit)) return this.finish(this.isDreamscapePreview() ? 'preview_complete' : 'timeout');
    } else if (this.state.attackTurnsLeft <= 0) return this.finish('timeout');
    this.state.attackTurn += 1;
    this.state.round = this.state.attackTurn;
    this.state.actorIndex = this.state.party.findIndex(unit => unit.hp > 0);
    this.state.turnActionsUsed = 0;
    this.state.turnActionsTotal = this.actor?.actionLimit || 1;
    this.beginActorTurn();
    this.emit('round', `Attack Turn ${this.state.attackTurn} begins — ${this.state.attackTurnsLeft} remaining.`, { tone: 'turn' });
  }

  endAttackTurnWithEnemyTimeline() {
    const completedWeakenedTurn = this.isBossWeakened() && this.state.boss.weakenedGraceTurn !== this.state.attackTurn;
    this.runEnemiesBefore(null);
    this.tickPartyStatuses();
    this.advanceSurtEncounterStacks();
    this.state.attackTurnsLeft -= 1;
    if (this.state.party.every(unit => unit.hp <= 0)) return this.finish('defeat');
    if (completedWeakenedTurn && ['nexus', 'devourer'].includes(this.state.boss.modeId)) {
      this.state.boss.weakenedTurnsLeft -= 1;
      if (this.state.boss.weakenedTurnsLeft <= 0) return this.finish('break_window_complete');
    }
    if (this.isDreamscapeRun()) {
      this.state.attackTurnsLeft = Math.max(0, this.state.attackTurnsLeft);
      this.state.scoreBreakdown.observedSurvivalMultiplier = getObservedDreamscapeMultiplier(this.state.attackTurnsLeft);
      if (this.state.attackTurn >= Number(this.state.boss.previewAttackTurns || this.state.boss.turnLimit)) return this.finish(this.isDreamscapePreview() ? 'preview_complete' : 'timeout');
    } else if (this.state.attackTurnsLeft <= 0) return this.finish('timeout');
    this.state.attackTurn += 1;
    this.state.round = this.state.attackTurn;
    this.state.actorIndex = 0;
    this.state.turnActionsUsed = 0;
    this.state.turnActionsTotal = this.actor?.actionLimit || 1;
    this.state.enemyTimeline.actedEnemyIds = [];
    this.emit('round', `Attack Turn ${this.state.attackTurn} begins. ${this.state.attackTurnsLeft} remaining.`, { tone: 'turn' });
    if (!this.startTimelinePartySlot(0)) {
      this.runEnemiesBefore(null);
      if (this.state.party.every(unit => unit.hp <= 0)) this.finish('defeat');
    }
  }

  respawnSummons() {
    this.state.boss.summonWave += 1;
    this.state.boss.waveBonusTriggered = false;
    for (const enemy of this.state.boss.summons) Object.assign(enemy, { hp: enemy.maxHp, alive: true, downPoints: enemy.downMax, downed: false, buffs: [], debuffs: [] });
    this.emit('summon', `${this.state.boss.name} called minion wave ${this.state.boss.summonWave}.`, { tone: 'boss' });
  }

  bossAction() {
    if (this.isBossWeakened()) {
      this.emit('boss_weakened', `${this.state.boss.name} cannot act during Weakened.`, { actorId: this.state.boss.id, sourceType: 'encounter', tone: 'phase' });
      return;
    }
    const living = this.state.party.filter(unit => unit.hp > 0);
    if (!living.length) return;
    const target = living[Math.floor(this.random() * living.length)];
    const phaseScale = 1 + this.state.boss.phaseIndex * 0.18;
    const defenseBuff = target.buffs.filter(effect => effect.stat === 'defense').reduce((sum, effect) => sum + (effect.value || 0), 0);
    const flatDefense = target.buffs.filter(effect => effect.stat === 'flatDefense').reduce((sum, effect) => sum + (effect.value || 0), 0);
    const effectiveDefense = (target.defense || 0) * (1 + defenseBuff) + flatDefense;
    let damage = Math.round((155 + this.random() * 70) * phaseScale * 500 / (500 + effectiveDefense));
    if (this.usesLiveMechanics()) damage = Math.round(damage * this.dreamscapeDamageDealtMultiplier(this.state.boss));
    const damageReduction = Math.max(Number(target.damageReduction || 0), target.buffs.filter(effect => effect.stat === 'damageReduction').reduce((max, effect) => Math.max(max, effect.value || 0), 0));
    damage = Math.round(damage * (1 - clamp(damageReduction, 0, 0.9)));
    if (target.guarding) damage = Math.round(damage * 0.45);
    let absorbed = 0;
    for (const shield of target.buffs.filter(effect => effect.stat === 'shield' && effect.value > 0)) {
      const used = Math.min(shield.value, damage);
      shield.value -= used;
      damage -= used;
      absorbed += used;
      if (damage <= 0) break;
    }
    this.applyPartyDamage(target, damage);
    this.emit('boss_move', `${this.state.boss.name} used Calamity Pulse.`, { actorId: this.state.boss.id, sourceType: 'encounter', tone: 'boss' });
    if (absorbed) this.emit('shield', `${target.codename}'s shield absorbed ${absorbed.toLocaleString()} damage.`, { amount: absorbed, targetId: target.id, sourceType: 'character_skill', tone: 'buff' });
    this.emit('party_damage', `${target.codename} took ${damage.toLocaleString()} damage.`, { amount: damage, targetId: target.id, sourceType: 'encounter', tone: 'damage' });
    target.guarding = false;
  }

  runEnemiesBefore(actorId) {
    if (!this.usesEnemyTimeline() || this.isVirtualConcertActive() || this.state.phase !== 'battle') return [];
    const normalizedActorId = this.state.party.some(unit => unit.id === actorId) ? actorId : null;
    const candidates = [this.state.boss, ...this.state.boss.summons]
      .filter(enemy => enemy.alive !== false
        && enemy.eligibleAttackTurn <= this.state.attackTurn
        && enemy.lastActedAttackTurn !== this.state.attackTurn
        && (this.state.party.some(unit => unit.id === enemy.actsBeforeActorId) ? enemy.actsBeforeActorId : null) === normalizedActorId)
      .sort((left, right) => Number(left.spawnOrdinal || 0) - Number(right.spawnOrdinal || 0));
    for (const enemy of candidates) {
      enemy.lastActedAttackTurn = this.state.attackTurn;
      this.state.enemyTimeline.actedEnemyIds.push(enemy.id);
      this.takeEnemyTurn(enemy);
      if (this.state.party.every(unit => unit.hp <= 0)) break;
    }
    return candidates;
  }

  takeEnemyTurn(enemy) {
    if (this.isBossWeakened()) {
      this.emit('boss_weakened', `${enemy.name} skipped its action during Weakened. Status durations and Down are preserved.`, {
        actorId: enemy.id, sourceType: 'encounter', tone: 'phase'
      });
      return false;
    }
    this.resolveEnemyAttack(enemy);
    this.tickEnemyStatuses(enemy);
    if (enemy.downed) {
      enemy.downed = false;
      enemy.downPoints = enemy.downMax;
      this.emit('enemy_recovered', `${enemy.name} recovered from Down after its action.`, { actorId: enemy.id, sourceType: 'encounter', tone: 'boss' });
    }
    return true;
  }

  resolveEnemyAttack(enemy) {
    const living = this.state.party.filter(unit => unit.hp > 0);
    if (!living.length) return;
    const target = living[Math.floor(this.random() * living.length)];
    // Additional Vishnus add action slots. They do not receive an inferred
    // damage increase just because the encounter moved to a later phase.
    const phaseScale = Number(enemy.actionScale || 1);
    const defenseBuff = target.buffs.filter(effect => effect.stat === 'defense').reduce((sum, effect) => sum + (effect.value || 0), 0);
    const flatDefense = target.buffs.filter(effect => effect.stat === 'flatDefense').reduce((sum, effect) => sum + (effect.value || 0), 0);
    const effectiveDefense = (target.defense || 0) * (1 + defenseBuff) + flatDefense;
    let damage = Math.round((155 + this.random() * 70) * phaseScale * 500 / (500 + effectiveDefense));
    if (this.usesLiveMechanics()) damage = Math.round(damage * this.dreamscapeDamageDealtMultiplier(enemy));
    const damageReduction = Math.max(Number(target.damageReduction || 0), target.buffs.filter(effect => effect.stat === 'damageReduction').reduce((max, effect) => Math.max(max, effect.value || 0), 0));
    damage = Math.round(damage * (1 - clamp(damageReduction, 0, 0.9)));
    if (target.guarding) damage = Math.round(damage * 0.45);
    let absorbed = 0;
    for (const shield of target.buffs.filter(effect => effect.stat === 'shield' && effect.value > 0)) {
      const used = Math.min(shield.value, damage);
      shield.value -= used;
      damage -= used;
      absorbed += used;
      if (damage <= 0) break;
    }
    this.applyPartyDamage(target, damage);
    this.emit('boss_move', `${enemy.name} used ${enemy.actionName || 'Calamity Pulse'}.`, { actorId: enemy.id, sourceType: 'encounter', tone: 'boss' });
    if (absorbed) this.emit('shield', `${target.codename}'s shield absorbed ${absorbed.toLocaleString()} damage.`, { amount: absorbed, targetId: target.id, sourceType: 'character_skill', tone: 'buff' });
    this.emit('party_damage', `${target.codename} took ${damage.toLocaleString()} damage.`, { amount: damage, targetId: target.id, actorId: enemy.id, sourceType: 'encounter', tone: 'damage' });
    target.guarding = false;
  }

  applyPartyDamage(target, damage) {
    const hpBefore = target.hp;
    const nextHp = target.hp - damage;
    if (this.isBerry(target) && target.awareness >= 2 && target.chainsOfLove >= 5 && nextHp <= 0 && (!target.powerOfLoveUsed || target.powerOfLove > 0)) {
      target.hp = 1;
      if (!target.powerOfLoveUsed) {
        target.powerOfLoveUsed = true;
        target.powerOfLove = 4;
        this.emit('resource', 'BERRY survived fatal damage with 4 Power of Love stacks.', { actorId: target.id, resource: 'powerOfLove', amount: 4, sourceType: 'awareness', tone: 'buff' });
      }
    } else target.hp = Math.max(0, nextHp);
    if (hpBefore > 0 && target.hp <= 0) notifyCharacterKnockout(this, target, { sourceType: 'encounter', damage });
  }

  tickStatusList(list, { sharedDotTicks = true } = {}) {
    return list.map(effect => effect.durationClock === 'cosmic_owner_end' || effect.supportClock || effect.duration == null || (effect.sharedDot && !sharedDotTicks) ? effect : ({ ...effect, duration: effect.duration - 1 })).filter(effect => effect.duration == null || effect.duration > 0);
  }

  tickEnemyStatuses(enemy, { sharedDotTicks = true } = {}) {
    // Live Hachiman (Joker, 2026-09-11): the boss's status durations only count
    // down when the boss acts. Rakunda cast at T17 was still on the boss at B4
    // after two Concert rounds and two Weakened turns, none of which the boss
    // acted in. The model had been ticking it at every Concert round end and
    // every Weakened turn end, expiring it before B3.
    if (this.isHachimanLive() && enemy.id === this.state.boss.id && (this.isVirtualConcertActive() || this.isBossWeakened())) {
      this.emit('mechanic', `${enemy.name} did not act, so its status durations hold.`, { tone: 'phase' });
      return;
    }
    // DOD Hachiman (Joker, 2026-09-09): on the turn the break opens, enemy debuff
    // durations do not count down at that turn's end.
    if (this.isHachimanDevourer() && this.state.boss.weakenedGraceTurn === this.state.attackTurn && !this.state.boss.breakTurnDebuffFreezeApplied) {
      this.state.boss.breakTurnDebuffFreezeApplied = true;
      this.emit('mechanic', `${enemy.name}'s debuffs do not count down on the turn the break opened.`, { tone: 'phase' });
      return;
    }
    if (this.usesLiveMechanics() && enemy.alive !== false) this.triggerContinuousDamage(enemy, { includeSharedDot: sharedDotTicks });
    enemy.buffs = this.tickStatusList(enemy.buffs, { sharedDotTicks });
    enemy.debuffs = this.tickStatusList(enemy.debuffs, { sharedDotTicks });
  }

  tickPartyStatuses() {
    for (const unit of this.state.party) {
      unit.buffs = this.tickStatusList(unit.buffs);
      unit.debuffs = this.tickStatusList(unit.debuffs);
      if (Number(unit.theurgyReserveTurns || 0) > 0) {
        unit.theurgyReserveTurns -= 1;
        if (unit.theurgyReserveTurns === 0) unit.theurgyReserve = 0;
      }
      if (this.isMakoto(unit)) {
        if (unit.moonPhaseGrace) unit.moonPhaseGrace = false;
        else if (unit.moonPhaseDuration > 0) unit.moonPhaseDuration -= 1;
        if (unit.moonPhaseDuration === 0) unit.moonPhaseStacks = 0;
        if (unit.fullMoonGrace) unit.fullMoonGrace = false;
        else if (unit.fullMoonDuration > 0) unit.fullMoonDuration -= 1;
        if (unit.fullMoonDuration === 0) unit.fullMoonStacks = 0;
        if (unit.scarletHadesBonusGrace) unit.scarletHadesBonusGrace = false;
        else if (unit.scarletHadesBonusDuration > 0) unit.scarletHadesBonusDuration -= 1;
        if (!unit.buffs.some(effect => effect.id === 'makoto_entrusted_hope')) unit.entrustedHopeStacks = 0;
      }
    }
  }

  tickStatuses(options = {}) {
    this.tickEnemyStatuses(this.state.boss, options);
    for (const enemy of this.state.boss.summons) this.tickEnemyStatuses(enemy, options);
    this.tickPartyStatuses();
  }

  updateBossPhase() {
    if (this.state.boss.scoreAttack) return;
    const ratio = this.state.boss.hp / this.state.boss.maxHp;
    let next = 0;
    this.state.boss.phases.forEach((phase, index) => { if (ratio <= phase.threshold) next = index; });
    if (next !== this.state.boss.phaseIndex) {
      this.state.boss.phaseIndex = next;
      this.emit('phase', `${this.state.boss.name} entered ${this.state.boss.phases[next].name}!`, { tone: 'phase', phaseIndex: next });
    }
  }

  finish(outcome) {
    this.state.phase = 'results';
    if (outcome === 'break_window_complete') {
      this.state.boss.weakenedActive = false;
      this.state.boss.weakenedPending = false;
      this.state.boss.weakenedTurnsLeft = 0;
    }
    const cleared = outcome === 'victory';
    if (this.state.boss.scoreModel === 'recorded_nightmare') {
      this.state.scoreBreakdown.bossAttackPoints = ['timeout', 'break_window_complete'].includes(outcome) ? this.state.boss.bossAttackPoints : 0;
      this.state.score = calculateNightmareScore(this.state.scoreBreakdown);
    }
    if (this.isDreamscapeRun() && !this.isDreamscapePreview()) {
      const survived = ['timeout', 'break_window_complete'].includes(outcome);
      this.state.scoreBreakdown.turnsSurvivedBonus = survived ? Number(this.state.boss.turnsSurvivedBonus || 0) : 0;
      this.state.score = calculateDreamscapeResult({
        foeDefensePoints: this.state.scoreBreakdown.foeDefensePoints,
        turnsSurvivedBonus: this.state.scoreBreakdown.turnsSurvivedBonus,
        difficultyBonus: this.state.scoreBreakdown.difficultyBonus
      });
    }
    this.state.result = {
      mechanicsProfile: this.config.mechanicsProfile,
      mechanicsLimitations: clone(this.state.mechanicsLimitations),
      outcome, cleared, score: this.state.score, totalDamage: this.state.totalDamage,
      scoreStatus: this.isDreamscapePreview() ? 'damage_preview_only' : 'simulated_score',
      scoreLabel: this.isDreamscapePreview() ? 'Simulated damage' : 'Simulated score',
      preview: this.isDreamscapePreview(),
      scoreBreakdown: clone(this.state.scoreBreakdown),
      rounds: this.isDreamscapePreview() ? this.state.attackTurn : Math.min(this.state.attackTurn, this.state.boss.turnLimit), attackTurns: this.state.attackTurn,
      remainingHp: this.state.boss.hp,
      damageByActor: this.state.party.map(unit => ({ id: unit.id, name: unit.codename, damage: unit.damageDone })),
      awarenessProfiles: Object.fromEntries([...this.state.party, this.state.navigator].map(unit => [unit.id, unit.awareness])),
      navigatorUses: this.state.navigator.uses, seed: this.initialSeed
    };
    this.emit('end', outcome === 'preview_complete' ? 'The configured damage preview ended. The actual game ending trigger and score calculation are unverified.' : cleared
      ? `${this.state.boss.name} was defeated!`
      : outcome === 'break_window_complete'
        ? this.state.boss.modeId === 'devourer' ? 'The 2 boss turn infinite HP Weakened window ended. Score locked.' : 'The 2 Attack Turn Weakened window ended. Score locked.'
        : outcome === 'timeout' ? 'The final Attack Turn ended. Score locked.' : 'The Phantom Thieves were defeated.', {
      tone: cleared ? 'victory' : ['break_window_complete', 'timeout', 'preview_complete'].includes(outcome) ? 'phase' : 'defeat'
    });
  }

  recommend() {
    const actor = this.actor;
    const sharedOptions = this.getSharedCombatActions();
    const sharedAction = sharedOptions.find(action => action.enabled && action.type !== 'skip_extra_actions') || sharedOptions.find(action => action.type === 'skip_extra_actions');
    if (sharedAction) return { ...sharedAction, reason: 'Resolve the available source-defined extra action.', confidence: 1 };
    // Items are available for deliberate player selection only. Until a
    // source-backed item policy exists, Auto and recommendations must neither
    // score them as skills nor spend their limited inventory.
    const candidates = this.getAvailableActions().filter(action => action.enabled && !['switch', 'item', 'cosmic_color'].includes(action.type));
    const kotoneRecommendation = this.kotoneMechanics?.recommend(candidates);
    if (kotoneRecommendation) return kotoneRecommendation;
    if (this.state.boss.id === 'slaughter_drive' && actor.id === 'wonder') {
      const preferredName = ({ 1: 'Guard', 2: 'Guard', 3: 'Maziodyne', 4: 'Guard', 5: 'Revolution', 6: 'Guard', 7: 'One-Fathom Fang', 8: 'One-Fathom Fang' })[this.state.attackTurn];
      const preferred = candidates.find(action => action.name === preferredName);
      if (preferred) return { ...clone(preferred), targetId: preferred.target === 'all_enemies' ? preferred.target : this.state.boss.id,
        reason: preferredName === 'Revolution' ? 'Open the critical rate bucket before the late burst.'
          : preferredName === 'One-Fathom Fang' ? 'Refresh the Ice and Resonance setup for Miyu.'
            : 'Hit the recorded Electric weakness.', confidence: 0.94 };
    }
    if (this.state.boss.id === 'slaughter_drive' && actor.slug === 'marian-beachflower') {
      const preferredName = ({ 1: 'Guard', 2: 'Summer Garden', 3: 'Guard', 4: 'Guard', 5: 'Summer Garden', 6: 'Gentle Sea Breeze', 7: 'Beach Basket', 8: 'Beach Basket' })[this.state.attackTurn];
      const preferred = candidates.find(action => action.name === preferredName);
      if (preferred) return { ...clone(preferred), targetId: preferred.target === 'ally'
        ? this.state.party.find(unit => unit.slug === 'puppet-wavecatcher')?.id || actor.id : this.state.boss.id,
        reason: preferredName === 'Gentle Sea Breeze' ? 'Prepare Marian medicine for Miyu.' : 'Keep Bewitching Blossoms on the boss.', confidence: 0.94 };
    }
    const cosmicRecommendation = this.cosmicRecommendation(candidates);
    if (cosmicRecommendation) return cosmicRecommendation;
    if (actor.slug === 'puppet-wavecatcher') {
      const preferredName = this.state.boss.id === 'slaughter_drive'
        ? this.state.attackTurn === 6 ? 'Guard'
          : this.state.attackTurn === 8 && actor.surfActive ? 'Aerial Tide' : 'Jellyfish Splash'
        : actor.surfActive && actor.offshoreStacks >= 2 ? 'Aerial Tide'
          : actor.surfActive ? 'Jellyfish Splash' : 'Paddle Out';
      const preferred = candidates.find(action => action.name === preferredName);
      if (preferred) return { ...clone(preferred), targetId: preferred.target === 'all_enemies' ? preferred.target : this.state.boss.id,
        reason: preferredName === 'Paddle Out' ? 'Enter Surf before the Resonance window.'
          : preferredName === 'Aerial Tide' ? 'Cash the stored Offshore stacks inside the scoring window.'
            : 'Bank SP so Catch a Wave can continue triggering.', confidence: 0.94 };
    }
    if (this.isJc(actor)) {
      const selectedSkills = this.skillsFor(actor);
      const nextSlot = actor.jcNextMaskSlot || 'S2';
      const preferredSkill = selectedSkills.find(skill => skill.slot === nextSlot) || selectedSkills[0];
      const preferred = candidates.find(action => action.skillId === preferredSkill?.id);
      if (preferred) return { ...clone(preferred), targetId: this.state.boss.id,
        reason: actor.jcNextMaskSlot
          ? `${nextSlot} is the required opposite mask. Two Masks as One fires automatically when both Facades are ready.`
          : 'Both opening masks are legal. The optimizer prefers S2, then alternates to S1.',
        confidence: 0.99 };
    }
    if (this.state.boss.id === 'slaughter_drive') {
      const strongest = [...candidates].sort((a, b) => (b.skill?.power || 0) - (a.skill?.power || 0))[0];
      if (strongest) {
        const targetId = strongest.target === 'all_enemies' || ['self', 'party'].includes(strongest.target)
          ? strongest.target : this.state.boss.id;
        return { ...clone(strongest), targetId, reason: 'Use the strongest legal fallback in the recorded rotation.', confidence: 0.94 };
      }
    }
    const livingSummons = this.state.boss.summons.filter(enemy => enemy.alive);
    let best = candidates[0];
    let bestScore = -Infinity;
    for (const action of candidates) {
      let score = 0;
      if (action.type === 'guard') score = actor.sp < 22 ? 45000 : 1000;
      else if (action.type === 'gun') score = livingSummons.length ? 30000 : 6000;
      else if (action.skill.power) {
        const target = livingSummons[0] || this.state.boss;
        const weakness = action.skill.element === target.weakness ? 1.25 : 1;
        const resist = action.skill.element === target.resistance ? 0.7 : 1;
        score = actor.attack * action.skill.power * weakness * resist * 100;
        if (action.skill.target === 'all_enemies') score *= this.enemies.length;
      } else if (action.skill.debuff) {
        const active = this.state.boss.debuffs.some(effect => effect.id === action.skill.debuff.id && effect.duration > 1);
        score = active ? 4000 : 62000;
      } else if (action.skill.buff) {
        const active = actor.buffs.some(effect => effect.id === action.skill.buff.id && effect.duration > 1);
        score = active ? 3000 : 51000;
      } else if (action.skill.heal) {
        const missing = this.state.party.reduce((sum, unit) => sum + (unit.maxHp - unit.hp), 0);
        score = missing * 120;
      }
      if (action.type === 'berry_alt') score *= action.skill.slot === 'HL' ? 3 : 2;
      if (score > bestScore) { bestScore = score; best = action; }
    }
    if (!best) return null;
    const targetId = this.usesLiveMechanics() && best.target === 'ally' && (best.skill?.selectedAllyBuff || best.skill?.excludeSelf)
      ? this.recommendedAllyTarget(best)
      : best.target === 'all_enemies' || ['self', 'party'].includes(best.target)
        ? best.target : (livingSummons.sort((a, b) => a.hp - b.hp)[0]?.id || this.state.boss.id);
    return { ...clone(best), targetId, reason: this.recommendationReason(best), confidence: clamp(0.68 + bestScore / 600000, 0.68, 0.96) };
  }

  recommendedAllyTarget(action) {
    const living = this.state.party.filter(unit => unit.hp > 0 && (!action.skill?.excludeSelf || unit.id !== this.actor.id));
    const selectedBuffId = action.skill?.selectedAllyBuff?.id;
    // Prefer a living highest-Attack ally that has not received the action's
    // selected-target effect. This changes targeting only, not recommendation
    // scoring, so an existing buff does not force a redundant recommendation.
    const candidates = selectedBuffId
      ? living.filter(unit => !unit.buffs.some(buff => buff.id === selectedBuffId && buff.duration > 0))
      : living;
    return [...(candidates.length ? candidates : living)].sort((left, right) => right.attack - left.attack)[0]?.id || this.actor?.id;
  }

  recommendationReason(action) {
    if (action.type === 'gun') return 'Gun pressure removes Down points while preserving SP.';
    if (action.type === 'guard') return 'Recover SP now to protect the remaining damage window.';
    if (action.skill?.debuff) return `${action.skill.name} establishes the strongest missing damage amplifier.`;
    if (action.skill?.buff) return `${action.skill.name} improves the upcoming party actions.`;
    if (action.skill?.heal) return 'Party HP is low enough for healing to protect the remaining rotation.';
    if (action.skill?.target === 'all_enemies') return `${action.name} pressures the full minion wave.`;
    return `${action.name} has the best deterministic damage estimate among legal actions.`;
  }
}

export function simulate(config, policy = engine => engine.recommend()) {
  const engine = new BattleEngine(config);
  let guard = 0;
  while (engine.state.phase === 'battle' && guard++ < 250) {
    if (engine.canBreakBoss() && engine.state.attackTurn >= 7) {
      engine.stepBreak();
      continue;
    }
    const medicine = engine.getMedicineActions().find(action => action.id === 'fighter_salve') || engine.getMedicineActions()[0];
    if (medicine) {
      const target = engine.state.party.filter(unit => unit.hp > 0 && unit.id !== engine.actor.id).sort((a, b) => b.attack - a.attack)[0] || engine.actor;
      engine.stepMedicine(medicine.id, target.id);
    }
    const nav = engine.getNavigatorActions().find(action => action.enabled);
    const navigatorWindow = engine.state.boss.scoreModel === 'recorded_nightmare' ? [1, 7].includes(engine.state.attackTurn) : engine.state.attackTurn === 1;
    if (nav && navigatorWindow && engine.state.actorIndex === 0 && engine.state.turnActionsUsed === 0) engine.stepNavigator(nav.id);
    const highlight = engine.state.boss.scoreModel !== 'recorded_nightmare' || engine.isBossWeakened() ? engine.getHighlightActions().find(action => action.enabled) : null;
    if (highlight) engine.stepHighlight(highlight.skillId, engine.state.boss.id);
    const action = policy(engine);
    if (!action) break;
    engine.step({ type: action.type, skillId: action.skillId, targetId: action.targetId || action.target });
  }
  return engine.getObservation();
}

// Kept outside the class to isolate the source-modeled character adapter.
Object.assign(BattleEngine.prototype, cosmicYuiMethods);
Object.assign(BattleEngine.prototype, registeredLegacyMethods);
