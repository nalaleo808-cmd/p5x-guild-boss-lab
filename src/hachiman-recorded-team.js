// Shared definition of the recorded Multidimensional Dreamscape Hachiman run:
// the party, the observed stat evidence, the runner adapters for reference-only
// catalog skills, and the T1 through T8 route read from the recording. Both the
// comparison script and the browser preset use this module so the browser
// battle is the same engine configuration as the checkpoint comparison.
import { BattleEngine, CURRENT_MECHANICS_PROFILE } from './engine.js';
import { lufelCatalog } from './generated/lufel-catalog.js';
import { applyRecordedDefaultStats } from './default-presets.js';
import { buildPersonaLoadoutCatalog } from './persona-loadout.js';

export const HACHIMAN_RECORDED_SEED = 8;
export const HACHIMAN_RECORDED_FINAL_SCORE = 6101612096;
export const HACHIMAN_RECORDED_SURVIVAL_BONUS = 125000;
export const HACHIMAN_TURN_CHECKPOINTS = Object.freeze(['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8']);

const clone = value => structuredClone(value);
const normalizeText = value => String(value || '').replace(/[–—]/g, '-');

export function required(value, message) {
  if (!value) throw new Error(message);
  return value;
}

// Direct in-game observations from HACHIMAN-ROTATION-CHECK-2026-09-05.md and
// data/ichigo-live-t3-snapshot-2026-09-05.json. Maximum HP values are the
// full-heal totals after the T3 Two Masks as One (Berry reached her separately
// confirmed 11,334 maximum, so every member was capped at maximum). Lower
// bounds are derived from buff values that sit exactly at their sourced caps.
// None of these values were chosen to move the simulated score.
export const OBSERVED_STAT_EVIDENCE = Object.freeze({
  source: 'HACHIMAN-ROTATION-CHECK-2026-09-05.md T2/T3 checkpoints and the T3 BERRY stat snapshot',
  rule: 'Observed totals and sourced-cap lower bounds only; no value was fitted to the recorded score.',
  'j-c': {
    maxHp: { value: 11682, kind: 'observed', evidence: 'T3 full-heal HP after Two Masks as One' },
    attack: { value: 4500, kind: 'lower_bound', evidence: 'Mask of Mischief +54.5% = 45.4% x 1.20, so Desire Level was 120, the cap; the Attack term reaches its 45 cap only when Attack >= 4,500' },
    damageBonus: { value: 30, kind: 'lower_bound', evidence: 'Desire Level 120 requires the Damage Mult. term at its 15 cap, which needs >= 30%' },
    critMult: { value: 190, kind: 'lower_bound', evidence: 'Desire Level 120 requires the critical multiplier term at its 15 cap, which needs >= 190%' }
  },
  wonder: {
    maxHp: { value: 13455, kind: 'observed', evidence: 'T3 full-heal HP after Two Masks as One' }
  },
  'marian-beachflower': {
    maxHp: { value: 19595, kind: 'observed', evidence: 'T3 full-heal HP after Two Masks as One; above the 13,632 cap used by Summer Garden and Bewitching Blossoms' },
    critMult: { value: 246.4, kind: 'lower_bound', evidence: 'Gentle Sea Breeze +48.8% and medicine +24.4% critical damage equal the 246.4% critical multiplier cap exactly' }
  },
  berry: {
    maxHp: { value: 11334, kind: 'observed', evidence: 'T2 display 8,993 of 11,334 HP' },
    reconciled: 'The 2026-09-06 Ichigo panel matches the saved preset. With the MIKU share and the Labor 4-set, (8,634 + 1,808) x 1.08 = 11,277 HP and (1,494 + 321) x 1.08 = 1,960 Defense, within 1% of the in-battle 11,334 and 1,984. The recorded Berry is the preset Berry; Attack, critical and Pierce come from the panel plus the navigator share.'
  },
  navigatorRevelation: {
    main: 'Integrity', set: 'Labor',
    set4: 'When equipped by Navigator Thieves: Increase all allies HP, ATK and DEF by 8%.',
    applied: 'Attack and Defense +8% as a permanent party buff. HP is not re-applied because the observed maximum HP totals already include it.'
  },
  jcRevelation: {
    main: 'Creation', set: 'Reconcilation',
    set4: 'During combat your HP, ATK, DEF increase by 15%.',
    applied: 'Attack and Defense +15% as a permanent J&C buff. HP is not re-applied because the observed maximum HP already includes it. Whether the Desire Level base-stat check precedes this in-combat bonus is unresolved.'
  }
});
export const evidenceValue = (slug, key) => OBSERVED_STAT_EVIDENCE[slug][key].value;

// MIKU's Character Details "Pt Effect" panel, read by the user on 2026-09-06.
// Navigators share 20% of their stats with every party member; the panel
// lists the shared amounts directly. HP is not re-applied to the observed
// in-battle maximum HP totals, which already include it.
export const NAVIGATOR_SHARED_STATS = Object.freeze({
  source: 'Hatsune Miku Character Details, Pt Effect panel, user screenshot 2026-09-06',
  rule: 'Navigators share 20% of their stats with the party; the panel shows the shared amounts.',
  partyBonus: Object.freeze({ maxHp: 1808, attack: 1130, defense: 321, damageBonus: 8.5, critRate: 5.7, critMult: 15.2, pierceRate: 2.4 })
});

// Wonder's Character Details panel with Dionysus, Janosik and Vasuki equipped,
// user screenshot 2026-09-06. Maximum HP keeps the observed in-battle 13,455.
export const WONDER_PANEL_STATS = Object.freeze({
  source: 'Wonder Character Details, user screenshot 2026-09-06',
  baseStats: Object.freeze({ attack: 3000, defense: 2373, panelMaxHp: 10718, maxSp: 100, speed: 109, critRate: 39.8, critMult: 190, pierceRate: 0, damageBonus: 0, ailmentAccuracy: 142.3, ailmentResistance: 40 })
});

// In-battle Character Details panels read after T1 on 2026-09-06. These are
// battle-state totals: they already include the navigator share and the
// Revelation set effects, so neither is re-applied. Damage Mult. is not used
// because the displayed 222% / 190.9% visibly includes active party buffs
// (Oxymoron, Two Masks, Trust + Prosperity) that the engine applies itself.
export const IN_BATTLE_PANEL_STATS = Object.freeze({
  source: 'Justine & Caroline and Beachflower Minami Character Details after T1, user screenshots 2026-09-06',
  'j-c': Object.freeze({ attack: 7035, defense: 2803, maxHp: 12682, maxSp: 100, speed: 113.4, critRate: 48.6, critMult: 310.3, pierceRate: 18.1, damageMultDisplayed: 222 }),
  'marian-beachflower': Object.freeze({ attack: 4866, defense: 2220, maxHp: 19595, maxSp: 100, speed: 110.4, critRate: 11.9, critMult: 318.9, pierceRate: 20.5, damageMultDisplayed: 190.9 }),
  jcElementalMultDisplayed: Object.freeze({ physical: 5, gun: 5, fire: 6, ice: 4.8, electric: 5.8, wind: 5.8, psychic: 10, nuclear: 4.8, bless: 9.8, curse: 29.8 }),
  confirmation: 'The +200% Vorpal Butterfly condition (target above 70% HP) is active on the infinite-HP Hachiman.'
});

const catalogPercent = (unit, key) => ({
  attack: Number(unit.sourceStats?.a6_lv80?.attack ?? unit.attack ?? 0),
  defense: Number(unit.sourceStats?.a6_lv80?.defense ?? unit.defense ?? 0),
  critRate: Number(unit.crit ?? 0.05) * 100,
  critMult: Number(unit.critMult ?? 1.5) * 100,
  damageBonus: 0,
  pierceRate: 0
})[key];

// Adds the navigator share on top of the unit's panel or catalog value. Keys
// listed in skipKeys are in-battle observations that already include it.
export function withNavigatorShare(unit, loadout, skipKeys = []) {
  const base = { ...(loadout.baseStats || {}) };
  for (const [key, bonus] of Object.entries(NAVIGATOR_SHARED_STATS.partyBonus)) {
    if (key === 'maxHp' || skipKeys.includes(key)) continue;
    const current = Number.isFinite(Number(base[key])) ? Number(base[key]) : catalogPercent(unit, key);
    base[key] = Math.round((current + bonus) * 1000) / 1000;
  }
  return { ...loadout, baseStats: base, navigatorShareApplied: true };
}

// Reference-only catalog skills that the recording used, bridged from their
// explicit tooltip values (level-3 coefficients, observed live SP costs).
export const PERSONA_SKILL_ADAPTERS = Object.freeze({
  'Venomous Spiral': {
    cost: 24,
    debuff: { id: 'venomous_spiral_exposure', name: 'VENOMOUS SPIRAL', damageTaken: true, value: 0.176, duration: 3 },
    sourceConfidence: 'runner-adapted-source-tooltip',
    omitted: 'Serpent’s Bite per-turn Psy ticks are not modeled; Wonder’s equipped Attack is unknown.'
  },
  Rakunda: {
    cost: 22,
    debuff: { id: 'def_down', name: 'DEF DOWN', value: 0.427, duration: 3 },
    sourceConfidence: 'runner-adapted-source-tooltip'
  },
  // Source: "Remove Electric/Fire resistance from 1 target for 2 turns." The SP
  // cost is missing from the source data (catalog costType "missing"), so the
  // catalog's 0 is kept until an in-game cost is confirmed.
  'Elec Break': {
    debuff: { id: 'electric_break', name: 'ELEC BREAK', resistanceBreak: 'electric', duration: 2 },
    sourceConfidence: 'source-tooltip-sp-cost-missing',
    omitted: 'SP cost is missing from the source data; 0 SP is used until confirmed.'
  },
  'Fire Break': {
    debuff: { id: 'fire_break', name: 'FIRE BREAK', resistanceBreak: 'fire', duration: 2 },
    sourceConfidence: 'source-tooltip-sp-cost-missing',
    omitted: 'SP cost is missing from the source data; 0 SP is used until confirmed.'
  },
  Tarukaja: {
    cost: 22,
    buff: { id: 'attack_up', name: 'ATK UP', stat: 'attack', value: 0.171, duration: 3 },
    runnerPer500Attack: 0.014,
    runnerPer500AttackCap: 0.114,
    sourceConfidence: 'runner-adapted-observed-tooltip'
  }
});

// Returns the catalog skill with its adapter merged into an executable combat
// record, or the skill unchanged when no adapter exists.
export function adaptPersonaSkill(skill) {
  const adapter = PERSONA_SKILL_ADAPTERS[skill?.name];
  if (!adapter) return skill;
  const catalogCombat = skill.combat || {};
  const adaptedDebuff = adapter.debuff ? { ...(catalogCombat.debuff || {}), ...clone(adapter.debuff) } : null;
  const adaptedBuff = adapter.buff ? {
    ...(catalogCombat.buff || {}), ...clone(adapter.buff),
    ...(catalogCombat.buff?.scaling ? {
      scaling: { ...clone(catalogCombat.buff.scaling), base: Number(adapter.buff.value) }
    } : {})
  } : null;
  return {
    ...skill,
    cost: adapter.cost ?? skill.cost,
    ...(adapter.runnerPer500Attack ? { runnerPer500Attack: adapter.runnerPer500Attack, runnerPer500AttackCap: adapter.runnerPer500AttackCap } : {}),
    combat: {
      ...catalogCombat,
      executable: true,
      confidence: adapter.sourceConfidence,
      ...(adaptedDebuff ? { debuff: adaptedDebuff, debuffs: [adaptedDebuff] } : {}),
      ...(adaptedBuff ? { buff: adaptedBuff, buffs: [adaptedBuff] } : {})
    }
  };
}

export function character(slug) {
  const definition = required(
    lufelCatalog.characters.find(unit => unit.slug === slug),
    `Missing character definition for ${slug}.`
  );
  return { ...clone(definition), awareness: 6 };
}

export function navigatorDefinition() {
  const miku = character('miku');
  return {
    ...miku,
    id: 'navigator-miku',
    sourceCharacterId: miku.id,
    skills: miku.skills.map((skill, index) => ({
      ...clone(skill),
      id: `navigator-miku-${index + 1}`,
      power: 0,
      cooldown: skill.cooldown || 4,
      note: skill.description || skill.note || 'Navigator interrupt action.'
    }))
  };
}

export function combatSkill(skill, index, override = {}) {
  const combat = skill.combat || {};
  return {
    id: skill.id,
    slot: `S${index + 1}`,
    name: skill.name,
    element: skill.element || 'support',
    cost: Number(skill.cost || 0),
    hpCost: Number(skill.hpCost || 0),
    power: Number(combat.power || skill.power || 0),
    target: skill.target,
    scalingStat: skill.scalingStat,
    buff: combat.buff ? clone(combat.buff) : undefined,
    buffs: combat.buffs ? clone(combat.buffs) : undefined,
    buffTarget: combat.buffTarget,
    debuff: combat.debuff ? clone(combat.debuff) : undefined,
    debuffs: combat.debuffs ? clone(combat.debuffs) : undefined,
    critBonus: combat.critBonus,
    accuracyModifier: combat.accuracyModifier,
    hitCount: combat.hitCount,
    hitCountRange: combat.hitCountRange ? clone(combat.hitCountRange) : undefined,
    ignoreDefense: combat.ignoreDefense,
    technical: combat.technical ? clone(combat.technical) : undefined,
    heal: combat.heal,
    healAttack: combat.healAttack,
    healFlat: combat.healFlat,
    healTarget: combat.healTarget,
    spRestore: combat.spRestore,
    limitations: combat.limitations ? clone(combat.limitations) : undefined,
    note: normalizeText(skill.description || skill.note || ''),
    sourceConfidence: combat.confidence || 'reference-only',
    ...override
  };
}

export function dionysusDefinition() {
  const persona = required(lufelCatalog.personas.find(item => item.name === 'Dionysus'), 'Missing Dionysus.');
  const catalog = buildPersonaLoadoutCatalog(lufelCatalog);
  const transferable = name => required(
    catalog.transferableSkills.find(skill => skill.name === name),
    `Missing Persona skill ${name}.`
  );
  const revolution = required(
    persona.skills.find(skill => skill.kind === 'unique' && skill.name === 'Revolution'),
    'Missing Dionysus Revolution.'
  );
  const universalTheoria = transferable('Universal Theoria');
  const tarukaja = transferable('Tarukaja');
  const autoMataru = catalog.transferableSkills.find(skill => skill.name === 'Auto-Mataru IV')
    || transferable('Auto-Mataru');

  return {
    definition: {
      id: persona.id,
      name: persona.name,
      arcana: persona.position || `Grade ${persona.grade}`,
      element: persona.element,
      trait: persona.passive?.at(-1)?.name || persona.description,
      passive: clone(persona.passive || []),
      maxRankPassive: clone(persona.maxRankPassive || null),
      source: 'Local Lufelnet catalog with checkpoint-runner adapters',
      skills: [
        combatSkill(revolution, 0, { cost: 22 }),
        combatSkill(universalTheoria, 1, { cost: 24 }),
        combatSkill(tarukaja, 2, { cost: 22 })
      ]
    },
    equipment: [universalTheoria, tarukaja, revolution, autoMataru].map(skill => ({
      name: skill.name,
      executableInCatalog: skill.combat?.executable === true,
      confidence: skill.combat?.confidence || 'reference-only'
    })),
    equippedSkillIds: [universalTheoria.id, tarukaja.id, autoMataru.id],
    autoMataru: {
      name: autoMataru.name,
      value: 0.098,
      duration: 2,
      sourceText: normalizeText(autoMataru.description)
    }
  };
}

export function vasukiDefinition() {
  const persona = required(lufelCatalog.personas.find(item => item.name === 'Vasuki'), 'Missing Vasuki.');
  const catalog = buildPersonaLoadoutCatalog(lufelCatalog);
  const transferable = name => required(
    catalog.transferableSkills.find(skill => skill.name === name),
    `Missing Persona skill ${name}.`
  );
  const venomousSpiral = required(persona.skills.find(skill => skill.name === 'Venomous Spiral'), 'Missing Venomous Spiral.');
  const media = transferable('Media');
  const rakunda = transferable('Rakunda');
  return {
    definition: {
      id: persona.id,
      name: persona.name,
      arcana: persona.position || `Grade ${persona.grade}`,
      element: persona.element,
      trait: persona.passive?.at(-1)?.name || persona.description,
      source: 'Local Lufelnet catalog with checkpoint-runner adapters',
      skills: [
        combatSkill(venomousSpiral, 0, {
          cost: PERSONA_SKILL_ADAPTERS['Venomous Spiral'].cost,
          debuff: clone(PERSONA_SKILL_ADAPTERS['Venomous Spiral'].debuff),
          sourceConfidence: PERSONA_SKILL_ADAPTERS['Venomous Spiral'].sourceConfidence
        }),
        combatSkill(media, 1, { cost: 23 }),
        combatSkill(rakunda, 2, {
          cost: PERSONA_SKILL_ADAPTERS.Rakunda.cost,
          debuff: clone(PERSONA_SKILL_ADAPTERS.Rakunda.debuff),
          sourceConfidence: PERSONA_SKILL_ADAPTERS.Rakunda.sourceConfidence
        })
      ]
    },
    equipment: [venomousSpiral, media, rakunda].map(skill => ({
      name: skill.name,
      observedCost: skill.name === 'Venomous Spiral' ? 24 : skill.name === 'Media' ? 23 : 22,
      executableInCatalog: skill.combat?.executable === true,
      confidence: skill.combat?.confidence || 'reference-only'
    })),
    equippedSkillIds: [media.id, rakunda.id]
  };
}

export function janosikDefinition() {
  const persona = required(lufelCatalog.personas.find(item => item.name === 'Janosik'), 'Missing Janosik.');
  const catalog = buildPersonaLoadoutCatalog(lufelCatalog);
  const transferable = name => required(
    catalog.transferableSkills.find(skill => skill.name === name),
    `Missing Persona skill ${name}.`
  );
  const rakunda = transferable('Rakunda');
  const tarukaja = transferable('Tarukaja');
  return {
    definition: {
      id: persona.id,
      name: persona.name,
      arcana: persona.position || `Grade ${persona.grade}`,
      element: persona.element,
      trait: persona.passive?.at(-1)?.name || persona.description,
      source: 'Local Lufelnet catalog with checkpoint-runner adapters',
      skills: [
        combatSkill(rakunda, 0, {
          cost: 22,
          debuff: { id: 'def_down', name: 'DEF DOWN', value: 0.427, duration: 3 },
          sourceConfidence: 'runner-adapted-source-tooltip'
        }),
        combatSkill(tarukaja, 1, {
          cost: 22,
          buff: { id: 'attack_up', name: 'ATK UP', stat: 'attack', value: 0.171, duration: 3 },
          runnerPer500Attack: 0.014,
          runnerPer500AttackCap: 0.114,
          sourceConfidence: 'runner-adapted-observed-tooltip'
        })
      ]
    },
    equipment: [rakunda, tarukaja].map(skill => ({
      name: skill.name,
      observedCost: 22,
      executableInCatalog: skill.combat?.executable === true,
      confidence: skill.combat?.confidence || 'reference-only'
    })),
    equippedSkillIds: [rakunda.id, tarukaja.id]
  };
}

// Permanent effects read from Berry's in-battle status list at the start of
// T2 (user screenshots 2026-09-06) that no catalog record supplies. Values are
// the displayed ones. Party scope is assumed where the source is a party-wide
// talent or set; only Berry's list was captured.
export const OBSERVED_T2_STATUS_EFFECTS = Object.freeze({
  source: 'Ichigo Shikano in-battle Details status list at the start of T2, user screenshots 2026-09-06',
  permanent: Object.freeze([
    { id: 'observed_scythe_of_obsession', name: 'SCYTHE OF OBSESSION', stat: 'damage', value: 0.415, scope: 'berry', evidence: 'Berry weapon passive, displayed "Increase dmg by 41.5%", Perm.' },
    { id: 'observed_legendary_diva', name: 'LEGENDARY DIVA', stat: 'critDamage', value: 0.343, scope: 'party', evidence: 'Displayed "Increase crit dmg by 34.3%", Perm. Source presumed MIKU; party scope assumed.' },
    { id: 'observed_creation_reconciliation_damage', name: 'CREATION & RECONCILIATION', stat: 'damage', value: 0.12, scope: 'party', evidence: 'Displayed on Berry "Increase dmg by 12%", Perm. J&C Revelation pair; party scope assumed.' },
    { id: 'observed_perseverance_sorrow_dot', name: 'PERSEVERANCE & SORROW', stat: 'dotDamage', value: 0.16, scope: 'berry', evidence: 'Berry Revelation pair, displayed "Increase continuous dmg effect by 16%", Perm.' }
  ]),
  notModeled: Object.freeze([
    'One-Winged Butterfly x2, 1 turn: +25% dmg and +25% crit dmg. Trigger and source unknown.',
    'Sorrow, 2 turns: +20% dmg. Trigger unknown (Sorrow set proc).',
    'Sparkling Flower Basket, 1 turn: +19% Atk. Source unknown.',
    'Two Masks As One displayed 71.1% against the 61.3% the Desire Level 120 formula gives.',
    'Berry displayed "Cannot activate critical hits, but increase final dmg by 270.2%" at T2 start; the engine computes its own conversion from current stats.'
  ]),
  matarukajaNote: 'Auto-Mataru IV lasts only while Dionysus is out (Joker, 2026-09-06). The T2-start capture that still showed Matarukaja IV after the T1 switch is an unexplained exception.'
});

// The catalog keeps Rakunda and Auto-Mataru IV as reference-only, and the
// navigator and J&C Revelation 4-set effects are not passed by the engine.
// This engine bridges their explicit tooltip values locally so the recorded
// route can be exercised without changing the shared engine or catalog.
export class HachimanRecordedEngine extends BattleEngine {
  initializeCharacterPassives() {
    for (const unit of this.state.party) {
      // Units whose in-battle panel was read already carry the share and set effects.
      if (this.config.loadouts?.[unit.id]?.panelIncludesShareAndSetEffects) continue;
      // Labor's +8% scales the stat itself, it is not another entry in the
      // additive buff pool. Joker's in-battle capture settles it: HP 11,334 and
      // Defense 1,984 against (panel + navigator share) x 1.08 = 11,277 and
      // 1,960, both within 1%. The same buff names HP, ATK and DEF together, so
      // Attack takes the same form. As a pool entry it was diluted to about 1%
      // by the +600% of other Attack buffs, which the capture rules out.
      // Set hachimanLaborAsBuffPool to compare against the earlier reading.
      if (this.config.hachimanLaborAsBuffPool === true) {
        for (const stat of ['attack', 'defense']) {
          this.applyUnitBuff(unit, {
            id: `runner_labor_navigator_${stat}`,
            name: `LABOR NAVIGATOR ${stat.toUpperCase()}`,
            stat,
            value: 0.08,
            duration: 999,
            runnerAdapter: true
          }, 'runner_adapter');
        }
      } else {
        unit.attack = Math.round(unit.attack * 1.08);
        unit.defense = Math.round(unit.defense * 1.08);
        unit.laborSetApplied = { value: 0.08, form: 'stat_multiplier', evidence: 'observed_in_battle_hp_and_defense_reconcile_2026-09-06' };
      }
    }
    this.emit('runner_adapter', `Applied the MIKU Labor 4-set party Attack/Defense +8% as a ${this.config.hachimanLaborAsBuffPool === true ? 'buff-pool entry' : 'stat multiplier'}. J&C and Marian are read from in-battle panels that already carry their set effects.`, {
      sourceType: 'runner_adapter',
      tone: 'system'
    });
    for (const unit of this.state.party) {
      this.applyUnitBuff(unit, {
        id: 'runner_auto_mataru_iv',
        name: 'AUTO-MATARU IV',
        stat: 'attack',
        value: 0.098,
        duration: 2,
        runnerAdapter: true
      }, 'runner_adapter');
      for (const effect of OBSERVED_T2_STATUS_EFFECTS.permanent) {
        if (effect.scope === 'berry' && unit.slug !== 'berry') continue;
        this.applyUnitBuff(unit, { id: effect.id, name: effect.name, stat: effect.stat, value: effect.value, duration: 999, runnerAdapter: true, observedStatus: true }, 'runner_adapter');
      }
    }
    this.emit('runner_adapter', 'Applied the permanent effects read from Berry’s T2-start status list: Scythe of Obsession, Legendary Diva, Creation & Reconciliation, Perseverance & Sorrow.', {
      sourceType: 'runner_adapter',
      tone: 'system'
    });
    this.emit('runner_adapter', 'Applied Auto-Mataru IV from its local catalog tooltip before opening passives.', {
      sourceType: 'runner_adapter',
      value: 0.098,
      duration: 2,
      tone: 'system'
    });
    super.initializeCharacterPassives();
  }

  // Auto-Mataru IV lasts only while Dionysus is the active Persona (tooltip
  // "until user changes Personas", confirmed by Joker on 2026-09-06). The T2-start
  // capture that still showed Matarukaja IV after the T1 switch is recorded as
  // an unexplained exception in HACHIMAN-STAT-EVIDENCE-2026-09-06.md.
  selectPersona(personaId) {
    const leavingDionysus = this.activePersona?.name === 'Dionysus';
    const result = super.selectPersona(personaId);
    if (leavingDionysus && this.activePersona?.name !== 'Dionysus') {
      for (const unit of this.state.party) {
        unit.buffs = unit.buffs.filter(effect => effect.id !== 'runner_auto_mataru_iv');
      }
      const event = this.emit('runner_adapter', 'Auto-Mataru IV ended when Wonder changed Personas.', {
        actorId: 'wonder',
        sourceType: 'runner_adapter',
        tone: 'system'
      });
      result.events.push(clone(event));
      this.state.lastEvents = [];
    }
    return result;
  }

  livePersonaSkill(persona, skill) {
    const adjusted = super.livePersonaSkill(persona, skill);
    if (persona?.name !== 'Janosik' || skill?.name !== 'Tarukaja') return adjusted;
    const per500Attack = Number(skill.runnerPer500Attack || 0);
    const scalingCap = Number(skill.runnerPer500AttackCap || 0);
    const scalingValue = Math.min(scalingCap, Math.floor(Number(this.actor?.attack || 0) / 500) * per500Attack);
    return {
      ...adjusted,
      buff: {
        ...clone(adjusted.buff),
        value: Number(adjusted.buff?.value || 0) + scalingValue,
        runnerAdapter: true,
        runnerScalingValue: scalingValue
      }
    };
  }
}

export const LOVESICK_TICK_MODELS = Object.freeze(['per_stack_snapshot', 'flat_base_attack', 'flat_buffed_attack_defense']);
export const DEFAULT_LOVESICK_TICK_MODEL = 'per_stack_snapshot';

export function createHachimanRecordedConfig(seed = HACHIMAN_RECORDED_SEED, highlightChargeRule = 'normal_weakness_cast_rates', options = {}) {
  const lovesickTickModel = LOVESICK_TICK_MODELS.includes(options.lovesickTickModel) ? options.lovesickTickModel : DEFAULT_LOVESICK_TICK_MODEL;
  const twins = character('j-c');
  const marian = character('marian-beachflower');
  const berry = character('berry');
  const dionysus = dionysusDefinition();
  const vasuki = vasukiDefinition();
  const janosik = janosikDefinition();
  const berryLoadout = applyRecordedDefaultStats(berry.id);
  const marianLoadout = applyRecordedDefaultStats(marian.id);
  const marianSet = required(lufelCatalog.revelationSets.find(set => set.name === marianLoadout.revelationSet), 'Missing Marian Revelation set.');
  const config = {
    seed,
    bossId: 'hachiman',
    modeId: 'multidimensional',
    dreamscapeObservedCompositionEffect: true,
    mechanicsProfile: CURRENT_MECHANICS_PROFILE,
    highlightChargeRule,
    hachimanLovesickTickModel: lovesickTickModel,
    ...(Number.isFinite(Number(options.hachimanBaseDefense)) && Number(options.hachimanBaseDefense) > 0 ? { hachimanBaseDefense: Number(options.hachimanBaseDefense) } : {}),
    sharedHighlightEvidence: 'user_confirmed_marian_prosperity_opening_25_normal_17_weakness_21_concert_double',
    teamIds: [twins.id, 'wonder', marian.id, berry.id],
    characterDefinitions: [twins, marian, berry],
    navigatorDefinition: navigatorDefinition(),
    personaDefinitions: [dionysus.definition, vasuki.definition, janosik.definition],
    personaIds: [dionysus.definition.id, vasuki.definition.id, janosik.definition.id],
    jcMaskPair: ['mischief', 'service'],
    loadouts: {
      [twins.id]: {
        jcMasks: ['mischief', 'service'],
        jcDesireLevel: 120,
        characterResearch: { weapon: 'signature', refinement: 6, staticWeaponStatsIncluded: true },
        revelationMain: OBSERVED_STAT_EVIDENCE.jcRevelation.main,
        revelationSet: OBSERVED_STAT_EVIDENCE.jcRevelation.set,
        revelationName: `${OBSERVED_STAT_EVIDENCE.jcRevelation.main} / ${OBSERVED_STAT_EVIDENCE.jcRevelation.set}`,
        panelIncludesShareAndSetEffects: true,
        baseStats: {
          maxHp: IN_BATTLE_PANEL_STATS['j-c'].maxHp,
          attack: IN_BATTLE_PANEL_STATS['j-c'].attack,
          defense: IN_BATTLE_PANEL_STATS['j-c'].defense,
          speed: IN_BATTLE_PANEL_STATS['j-c'].speed,
          critRate: IN_BATTLE_PANEL_STATS['j-c'].critRate,
          critMult: IN_BATTLE_PANEL_STATS['j-c'].critMult,
          pierceRate: IN_BATTLE_PANEL_STATS['j-c'].pierceRate,
          damageBonus: evidenceValue('j-c', 'damageBonus')
        }
      },
      wonder: withNavigatorShare({ attack: 225, crit: 0.14 }, applyRecordedDefaultStats('wonder', {
        baseStats: {
          maxHp: evidenceValue('wonder', 'maxHp'),
          attack: WONDER_PANEL_STATS.baseStats.attack,
          defense: WONDER_PANEL_STATS.baseStats.defense,
          maxSp: WONDER_PANEL_STATS.baseStats.maxSp,
          speed: WONDER_PANEL_STATS.baseStats.speed,
          critRate: WONDER_PANEL_STATS.baseStats.critRate,
          critMult: WONDER_PANEL_STATS.baseStats.critMult,
          pierceRate: WONDER_PANEL_STATS.baseStats.pierceRate,
          damageBonus: WONDER_PANEL_STATS.baseStats.damageBonus,
          ailmentAccuracy: WONDER_PANEL_STATS.baseStats.ailmentAccuracy,
          ailmentResistance: WONDER_PANEL_STATS.baseStats.ailmentResistance
        }
      })),
      [marian.id]: {
        ...marianLoadout,
        panelIncludesShareAndSetEffects: true,
        baseStats: {
          ...(marianLoadout.baseStats || {}),
          maxHp: IN_BATTLE_PANEL_STATS['marian-beachflower'].maxHp,
          attack: IN_BATTLE_PANEL_STATS['marian-beachflower'].attack,
          defense: IN_BATTLE_PANEL_STATS['marian-beachflower'].defense,
          speed: IN_BATTLE_PANEL_STATS['marian-beachflower'].speed,
          critRate: IN_BATTLE_PANEL_STATS['marian-beachflower'].critRate,
          critMult: IN_BATTLE_PANEL_STATS['marian-beachflower'].critMult,
          pierceRate: IN_BATTLE_PANEL_STATS['marian-beachflower'].pierceRate
        },
        revelationName: `${marianLoadout.revelationMain} / ${marianLoadout.revelationSet}`,
        revelationCombat: clone(marianSet.combat || {})
      },
      [berry.id]: withNavigatorShare(berry, {
        ...berryLoadout,
        baseStats: { ...(berryLoadout.baseStats || {}), maxHp: evidenceValue('berry', 'maxHp') }
      })
    }
  };
  return { config, twins, marian, berry, dionysus, vasuki, janosik, berryLoadout, marianLoadout };
}

export function resolveTarget(engine, target) {
  if (target === 'boss') return engine.state.boss.id;
  if (target === 'berry') return required(engine.state.party.find(unit => unit.slug === 'berry'), 'Berry is missing.').id;
  if (target === 'first_add') return required(
    engine.state.boss.summons.find(enemy => enemy.alive !== false),
    'No living add is available.'
  ).id;
  return target;
}

export function findAction(engine, spec) {
  if (spec.kind === 'medicine') {
    return engine.getMedicineActions().find(action => action.enabled && (action.id === spec.id || action.name === spec.name));
  }
  if (spec.kind === 'item') {
    return engine.getItemActions().find(action => action.enabled && (action.itemId === spec.id || action.name === spec.name));
  }
  if (spec.kind === 'trueDesire') {
    return engine.canToggleTrueDesire() ? {
      id: 'runner:true-desire', type: 'true_desire', name: 'Power to Resist Ruin', target: 'self', enabled: true
    } : null;
  }
  if (spec.kind === 'berryAlt' || spec.kind === 'freeHL') {
    const expectedSlot = spec.kind === 'freeHL' ? 'HL' : spec.slot;
    return engine.getBerryAltActions().find(action => action.enabled
      && (!expectedSlot || action.skill?.slot === expectedSlot)
      && (!spec.name || action.name === spec.name));
  }
  if (spec.kind === 'selectedMaskHL') {
    return engine.getHighlightActions().find(action => action.enabled
      && action.actorId === spec.actorId
      && action.skill?.jcHighlightMask === spec.mask);
  }
  if (spec.kind === 'navigator') {
    return engine.getNavigatorActions().find(action => action.name === spec.name && action.enabled);
  }
  if (spec.kind === 'guard') {
    return engine.getAvailableActions().find(action => action.type === 'guard' && action.enabled);
  }
  if (spec.kind === 'lifeSustainment') {
    if (engine.state.boss.lifeSustainment === (spec.enabled === true)) return { id: 'runner:life-sustainment-noop', type: 'life_sustainment', name: 'HP Lock unchanged', target: 'boss', enabled: true };
    return engine.canToggleLifeSustainment() ? { id: 'runner:life-sustainment', type: 'life_sustainment', name: `HP Lock ${spec.enabled ? 'ON' : 'OFF'}`, target: 'boss', enabled: true } : null;
  }
  if (spec.kind === 'highlight') {
    return engine.getHighlightActions().find(action => action.actorId === spec.actorId && action.enabled);
  }
  return engine.getAvailableActions().find(action => {
    if (!action.enabled) return false;
    if (spec.type && action.type !== spec.type) return false;
    if (spec.name && action.name !== spec.name) return false;
    if (spec.slot && action.skill?.slot !== spec.slot) return false;
    return true;
  });
}

export function legalActionDigest(engine) {
  return {
    actor: engine.actor?.codename || engine.actor?.name || null,
    actions: engine.getAvailableActions().map(action => ({
      type: action.type,
      name: action.name,
      slot: action.skill?.slot || null,
      enabled: action.enabled,
      reason: action.unavailableReason || null
    })),
    highlights: engine.getHighlightActions().map(action => ({
      actorId: action.actorId,
      name: action.name,
      selectedMask: action.skill?.jcHighlightMask || null,
      enabled: action.enabled,
      reason: action.unavailableReason || null,
      cooldown: action.cooldownRemaining || 0
    })),
    navigator: engine.getNavigatorActions().map(action => ({
      name: action.name,
      enabled: action.enabled,
      reason: action.unavailableReason || null,
      cooldown: action.remaining || 0
    })),
    medicines: engine.getMedicineActions().map(action => ({
      id: action.id,
      name: action.name,
      enabled: action.enabled
    })),
    trueDesire: {
      canActivate: engine.canToggleTrueDesire(),
      primed: engine.state.party.find(unit => unit.slug === 'j-c')?.trueDesirePrimed ?? null,
      stacks: engine.state.party.find(unit => unit.slug === 'j-c')?.trueDesireStacks ?? null
    },
    concertActive: engine.isVirtualConcertActive()
  };
}

function guardRouteAction(engine, label, spec) {
  if (spec.expectedActorId && engine.actor?.id !== spec.expectedActorId) {
    const error = new Error(`${label} expected ${spec.expectedActorId} to be current, found ${engine.actor?.id || 'no actor'}.`);
    error.actionDigest = legalActionDigest(engine);
    throw error;
  }
  if (spec.expectedConcert != null && engine.isVirtualConcertActive() !== spec.expectedConcert) {
    const error = new Error(`${label} expected Virtual Concert ${spec.expectedConcert ? 'active' : 'inactive'}.`);
    error.actionDigest = legalActionDigest(engine);
    throw error;
  }
}

// Resolves one recorded route action against the engine. Throws, with a legal
// action digest attached, at the first actor, Concert, or legality mismatch.
export function performRouteAction(engine, label, spec) {
  guardRouteAction(engine, label, spec);
  let action = findAction(engine, spec);
  if (!action && spec.forceGauge && ['highlight', 'selectedMaskHL', 'freeHL'].includes(spec.kind)) {
    // Route adapter: the recorded run had the Highlight available here but the
    // gauge model is short. Top the shared gauge up, record the shortfall, retry.
    const gauge = engine.state.sharedCombat?.highlight;
    if (Number.isFinite(gauge) && gauge < 100) {
      const shortfall = 100 - gauge;
      engine.state.sharedCombat.highlight = 100;
      engine.runnerForcedGauge = [...(engine.runnerForcedGauge || []), { label, shortfall }];
      engine.emit('runner_adapter', `Shared Highlight topped up by ${shortfall.toFixed(0)} points for ${label} (recorded route had it available).`, { sourceType: 'runner_adapter', tone: 'system' });
      action = findAction(engine, spec);
    }
  }
  if (!action) {
    const error = new Error(`${label} is not legal at this checkpoint.`);
    error.actionDigest = legalActionDigest(engine);
    throw error;
  }
  const targetId = resolveTarget(engine, spec.target || action.target);
  let result;
  if (spec.kind === 'navigator') result = engine.stepNavigator(action.id);
  else if (spec.kind === 'highlight' || spec.kind === 'selectedMaskHL') result = engine.stepHighlight(action.skillId, targetId);
  else if (spec.kind === 'medicine') result = engine.stepMedicine(action.id, targetId);
  else if (spec.kind === 'trueDesire') result = engine.setTrueDesire(true);
  else if (spec.kind === 'lifeSustainment') result = engine.state.boss.lifeSustainment === (spec.enabled === true)
    ? { events: [engine.emit('runner_adapter', `HP Lock already ${spec.enabled ? 'on' : 'off'}.`, { sourceType: 'runner_adapter', tone: 'system' })], consumedAction: false }
    : engine.setLifeSustainment(spec.enabled === true);
  else if (spec.kind === 'guard') result = engine.step({ type: 'guard', skillId: 'guard', targetId: engine.actor.id });
  else if (spec.kind === 'switch') result = engine.selectPersona(action.personaId);
  else result = engine.step({ type: action.type, skillId: action.skillId, targetId });
  return { action, targetId, result };
}

// The recorded MIKU song selections are free actions the shared engine does
// not expose as commands, so the route changes the selected song directly.
export function performSongCycle(engine, label, spec) {
  guardRouteAction(engine, label, spec);
  if (spec.kind === 'setSong') {
    // Free song selection to a named song regardless of the current one.
    if (!engine.isMikuNavigator()) throw new Error(`${label}: MIKU is not the navigator.`);
    const from = engine.state.navigator.currentSong;
    if (from === spec.nextSong) return { event: engine.emit('runner_adapter', `MIKU already on ${spec.nextSong}.`, { actorId: engine.state.navigator.id, sourceType: 'runner_adapter', tone: 'navigator' }) };
    spec = { ...spec, expectedSong: from };
  }
  if (!engine.isMikuNavigator() || engine.state.navigator.currentSong !== spec.expectedSong) {
    const error = new Error(`${label} is not legal at this checkpoint. Expected ${spec.expectedSong}, found ${engine.state.navigator.currentSong || 'no song'}.`);
    error.actionDigest = legalActionDigest(engine);
    throw error;
  }
  engine.state.navigator.currentSong = spec.nextSong;
  engine.state.navigator.songIndex = ['Heaven', 'Spring Storm', 'Play-With-Fire'].indexOf(spec.nextSong);
  const event = engine.emit('runner_adapter', `MIKU changed the selected song from ${spec.expectedSong} to ${spec.nextSong}.`, {
    actorId: engine.state.navigator.id,
    sourceType: 'runner_adapter',
    fromSong: spec.expectedSong,
    song: spec.nextSong,
    tone: 'navigator'
  });
  return { event };
}

const T1 = Object.freeze([
  ['T1 Twins Gun boss', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, type: 'gun', name: 'Gun', target: 'boss' }],
  ['T1 Wonder switch Dionysus to Vasuki', { expectedActorId: 'wonder', expectedConcert: false, kind: 'switch', type: 'switch', name: 'Vasuki', target: 'self' }],
  ['T1 Vasuki Rakunda boss', { expectedActorId: 'wonder', expectedConcert: false, type: 'skill', name: 'Rakunda', target: 'boss' }],
  ['T1 Marian S3 on Berry', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: false, type: 'skill', slot: 'S3', target: 'berry' }],
  ['T1 Berry S1 on first living add', { expectedActorId: 'lufel-recent-berry', expectedConcert: false, type: 'skill', slot: 'S1', target: 'first_add' }]
]);

const T2 = Object.freeze([
  ['T2 MIKU Heaven S1', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, kind: 'navigator', name: 'Feel the Beat', target: 'party' }],
  ['T2 Berry Highlight boss', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, kind: 'highlight', actorId: 'lufel-recent-berry', target: 'boss' }],
  ['T2 Twins S1 boss', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, type: 'skill', slot: 'S1', target: 'boss' }],
  ['T2 Wonder switch Vasuki to Janosik', { expectedActorId: 'wonder', expectedConcert: false, kind: 'switch', type: 'switch', name: 'Janosik', target: 'self' }],
  ['T2 Wonder switch Janosik to Dionysus', { expectedActorId: 'wonder', expectedConcert: false, kind: 'switch', type: 'switch', name: 'Dionysus', target: 'self' }],
  ['T2 Dionysus Revolution', { expectedActorId: 'wonder', expectedConcert: false, type: 'skill', name: 'Revolution', target: 'party' }],
  ['T2 Marian S2', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: false, type: 'skill', slot: 'S2', target: 'party' }],
  ['T2 Berry S3 boss', { expectedActorId: 'lufel-recent-berry', expectedConcert: false, type: 'skill', slot: 'S3', target: 'boss' }]
]);

const T3 = Object.freeze([
  ['T3 MIKU cycle Spring Storm to Play-With-Fire', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, kind: 'songCycle', expectedSong: 'Spring Storm', nextSong: 'Play-With-Fire' }],
  ['T3 MIKU Play-With-Fire S1', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, kind: 'navigator', name: 'Feel the Beat', target: 'party' }],
  ['T3 Twins S2 Service and Admonition boss', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, type: 'skill', slot: 'S2', target: 'boss' }],
  ['T3 Wonder switch Dionysus to Vasuki', { expectedActorId: 'wonder', expectedConcert: false, kind: 'switch', type: 'switch', name: 'Vasuki', target: 'self' }],
  ['T3 Vasuki Venomous Spiral boss', { expectedActorId: 'wonder', expectedConcert: false, type: 'skill', name: 'Venomous Spiral', target: 'boss' }],
  ['T3 Marian Highlight on Berry', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: false, kind: 'highlight', actorId: 'lufel-recent-marian-beachflower', target: 'berry' }],
  ['T3 Marian DOT-Up on Berry', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: false, kind: 'medicine', id: 'dot_up', target: 'berry' }],
  ['T3 Marian S1 Beach Basket', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: false, type: 'skill', slot: 'S1', target: 'party' }],
  ['T3 Berry S3 boss', { expectedActorId: 'lufel-recent-berry', expectedConcert: false, type: 'skill', slot: 'S3', target: 'boss' }]
]);

const T4 = Object.freeze([
  ['T4 MIKU cycle Heaven to Spring Storm', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, kind: 'songCycle', expectedSong: 'Heaven', nextSong: 'Spring Storm' }],
  ['T4 MIKU Spring Storm S2', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, kind: 'navigator', name: 'Clear Sound', target: 'party' }],
  ['T4 Twins S1 Fire and Ice boss', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, type: 'skill', slot: 'S1', target: 'boss' }],
  ['T4 Wonder switch Vasuki to Janosik', { expectedActorId: 'wonder', expectedConcert: false, kind: 'switch', type: 'switch', name: 'Janosik', target: 'self' }],
  ['T4 Janosik Rakunda boss', { expectedActorId: 'wonder', expectedConcert: false, type: 'skill', name: 'Rakunda', target: 'boss' }],
  ['T4 Marian Fighter Salve on Berry', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: false, kind: 'medicine', id: 'fighter_salve', target: 'berry' }],
  ['T4 Marian S3 on Berry', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: false, type: 'skill', slot: 'S3', target: 'berry' }],
  ['T4 Berry S3 boss', { expectedActorId: 'lufel-recent-berry', expectedConcert: false, type: 'skill', slot: 'S3', target: 'boss' }]
]);

const T5 = Object.freeze([
  ['T5 Twins Fire and Ice Highlight', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, kind: 'selectedMaskHL', actorId: 'lufel-recent-j-c', mask: 'mischief', target: 'party' }],
  ['T5 MIKU Showstopper', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, kind: 'navigator', name: 'Showstopper', target: 'party' }],
  ['T5 Twins store Power to Resist Ruin', { expectedActorId: 'lufel-recent-j-c', expectedConcert: true, kind: 'trueDesire', target: 'self' }],
  ['T5 Twins S2 Electric and Wind boss', { expectedActorId: 'lufel-recent-j-c', expectedConcert: true, type: 'skill', slot: 'S2', target: 'boss' }],
  ['T5 Wonder switch Janosik to Dionysus', { expectedActorId: 'wonder', expectedConcert: true, kind: 'switch', type: 'switch', name: 'Dionysus', target: 'self' }],
  ['T5 Dionysus Universal Theoria on Berry', { expectedActorId: 'wonder', expectedConcert: true, type: 'skill', name: 'Universal Theoria', target: 'berry' }],
  ['T5 Marian Attacker Tablet on Berry', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: true, kind: 'medicine', id: 'attack_tablet', target: 'berry' }],
  ['T5 Marian S2 Summer Garden', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: true, type: 'skill', slot: 'S2', target: 'party' }],
  ['T5 Marian Highlight on Berry', { expectedActorId: 'lufel-recent-berry', expectedConcert: true, kind: 'highlight', actorId: 'lufel-recent-marian-beachflower', target: 'berry' }],
  ['T5 Berry S3 boss', { expectedActorId: 'lufel-recent-berry', expectedConcert: true, type: 'skill', slot: 'S3', target: 'boss' }]
]);

const T6 = Object.freeze([
  ['T6 Twins S1 Fire and Ice boss', { expectedActorId: 'lufel-recent-j-c', expectedConcert: true, type: 'skill', slot: 'S1', target: 'boss' }],
  ['T6 Wonder switch Dionysus to Vasuki', { expectedActorId: 'wonder', expectedConcert: true, kind: 'switch', type: 'switch', name: 'Vasuki', target: 'self' }],
  ['T6 Wonder switch Vasuki to Janosik', { expectedActorId: 'wonder', expectedConcert: true, kind: 'switch', type: 'switch', name: 'Janosik', target: 'self' }],
  ['T6 Janosik Tarukaja on Berry', { expectedActorId: 'wonder', expectedConcert: true, type: 'skill', name: 'Tarukaja', target: 'berry' }],
  ['T6 Marian DOT-Up on Berry', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: true, kind: 'medicine', id: 'dot_up', target: 'berry' }],
  ['T6 Berry Highlight during Marian turn', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: true, kind: 'highlight', actorId: 'lufel-recent-berry', target: 'boss' }],
  ['T6 Marian S1 Beach Basket', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: true, type: 'skill', slot: 'S1', target: 'party' }],
  ['T6 Berry free Highlight boss', { expectedActorId: 'lufel-recent-berry', expectedConcert: true, kind: 'freeHL', target: 'boss' }],
  ['T6 Berry Alt S3 boss', { expectedActorId: 'lufel-recent-berry', expectedConcert: true, kind: 'berryAlt', slot: 'S3', target: 'boss' }]
]);

const T7 = Object.freeze([
  ['T7 MIKU cycle Heaven to Spring Storm', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, kind: 'songCycle', expectedSong: 'Heaven', nextSong: 'Spring Storm' }],
  ['T7 MIKU Spring Storm S1', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, kind: 'navigator', name: 'Feel the Beat', target: 'party' }],
  ['T7 Twins S2 Electric and Wind boss', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, type: 'skill', slot: 'S2', target: 'boss' }],
  ['T7 Wonder switch Janosik to Dionysus', { expectedActorId: 'wonder', expectedConcert: false, kind: 'switch', type: 'switch', name: 'Dionysus', target: 'self' }],
  ['T7 Dionysus Universal Theoria on Berry', { expectedActorId: 'wonder', expectedConcert: false, type: 'skill', name: 'Universal Theoria', target: 'berry' }],
  ['T7 Twins Fire and Ice Highlight', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: false, kind: 'selectedMaskHL', actorId: 'lufel-recent-j-c', mask: 'mischief', target: 'party' }],
  ['T7 Marian S3 on Berry', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: false, type: 'skill', slot: 'S3', target: 'berry' }],
  ['T7 Berry Alt S1 boss', { expectedActorId: 'lufel-recent-berry', expectedConcert: false, kind: 'berryAlt', slot: 'S1', target: 'boss' }]
]);

const T8 = Object.freeze([
  ['T8 MIKU Play-With-Fire S1', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, kind: 'navigator', name: 'Feel the Beat', target: 'party' }],
  ['T8 Twins S1 Fire and Ice boss', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, type: 'skill', slot: 'S1', target: 'boss' }],
  ['T8 Wonder switch Dionysus to Vasuki', { expectedActorId: 'wonder', expectedConcert: false, kind: 'switch', type: 'switch', name: 'Vasuki', target: 'self' }],
  ['T8 Vasuki Venomous Spiral boss', { expectedActorId: 'wonder', expectedConcert: false, type: 'skill', name: 'Venomous Spiral', target: 'boss' }],
  ['T8 Marian Fighter Salve on Berry', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: false, kind: 'medicine', id: 'fighter_salve', target: 'berry' }],
  ['T8 Marian ordinary Attacker Tablet item on Berry', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: false, kind: 'item', id: 'attack_tablet', target: 'berry' }],
  ['T8 Berry S3 boss', { expectedActorId: 'lufel-recent-berry', expectedConcert: false, type: 'skill', slot: 'S3', target: 'boss' }]
]);

export const HACHIMAN_RECORDED_ROUTE = Object.freeze({ T1, T2, T3, T4, T5, T6, T7, T8 });

// Variant described by Joker on 2026-09-06 after a later run: J&C opens with S1
// and uses Gun on T2; Marian takes the T2 Highlight and Berry takes the T3
// Highlight, fired during Marian's turn after DOT-Up and before Beach Basket.
// T4 through T8 are unchanged.
const VARIANT_T1 = Object.freeze([
  ['T1 Twins S1 boss', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, type: 'skill', slot: 'S1', target: 'boss' }],
  ...T1.slice(1)
]);
const VARIANT_T2 = Object.freeze([
  T2[0],
  ['T2 Marian Highlight on Berry', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, kind: 'highlight', actorId: 'lufel-recent-marian-beachflower', target: 'berry' }],
  ['T2 Twins Gun boss', { expectedActorId: 'lufel-recent-j-c', expectedConcert: false, type: 'gun', name: 'Gun', target: 'boss' }],
  ...T2.slice(3)
]);
const VARIANT_T3 = Object.freeze([
  ...T3.slice(0, 5),
  ['T3 Marian DOT-Up on Berry', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: false, kind: 'medicine', id: 'dot_up', target: 'berry' }],
  ['T3 Berry Highlight during Marian turn', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: false, kind: 'highlight', actorId: 'lufel-recent-berry', target: 'boss' }],
  ['T3 Marian S1 Beach Basket', { expectedActorId: 'lufel-recent-marian-beachflower', expectedConcert: false, type: 'skill', slot: 'S1', target: 'party' }],
  ['T3 Berry S3 boss', { expectedActorId: 'lufel-recent-berry', expectedConcert: false, type: 'skill', slot: 'S3', target: 'boss' }]
]);
export const HACHIMAN_VARIANT_ROUTE = Object.freeze({ T1: VARIANT_T1, T2: VARIANT_T2, T3: VARIANT_T3, T4, T5, T6, T7, T8 });
export const HACHIMAN_ROUTES = Object.freeze({ recorded: HACHIMAN_RECORDED_ROUTE, variant: HACHIMAN_VARIANT_ROUTE });

// Plays the complete recorded route on a fresh engine. Returns the labels
// that resolved and the failure, if any, so a caller can show partial progress.
export function playHachimanRecordedRoute(engine, options = {}) {
  const route = HACHIMAN_ROUTES[options.route] || HACHIMAN_RECORDED_ROUTE;
  const resolved = [];
  for (const turn of HACHIMAN_TURN_CHECKPOINTS) {
    for (const [label, spec] of route[turn]) {
      try {
        if (spec.kind === 'songCycle' || spec.kind === 'setSong') performSongCycle(engine, label, spec);
        else performRouteAction(engine, label, spec);
      } catch (error) {
        return { completed: false, resolved, turn, failedLabel: label, error };
      }
      resolved.push(label);
      options.onAction?.(label, turn, engine);
    }
  }
  return { completed: true, resolved, turn: 'T8', failedLabel: null, error: null };
}

// Score arithmetic used by the checkpoint comparison, exposed so the browser
// results screen can show the same derivation from the engine state.
export function hachimanScoreDerivation(state) {
  const breakdown = state.scoreBreakdown || {};
  const buckets = (breakdown.turnScoreBuckets || []).map(bucket => ({ ...bucket }));
  const turnWeightedDamagePoints = Number(breakdown.turnWeightedDamagePoints || 0);
  const foeDefensePoints = Math.round(turnWeightedDamagePoints);
  const difficultyBonus = Number(state.boss?.difficultyBonus || breakdown.difficultyBonus || 8);
  const survivalBonus = HACHIMAN_RECORDED_SURVIVAL_BONUS;
  return {
    buckets,
    damagePreview: Number(breakdown.damagePreview || 0),
    turnWeightedDamagePoints,
    foeDefensePoints,
    survivalBonus,
    difficultyBonus,
    projectedFinalScore: (foeDefensePoints + survivalBonus) * difficultyBonus,
    recordedFinalScore: HACHIMAN_RECORDED_FINAL_SCORE,
    survivalBonusNote: 'The 125,000 survival bonus is the value observed on this recorded route, not a derived curve.',
    limitation: 'Turn multipliers and x8 difficulty are user-confirmed. Damage inputs remain provisional: Marian and J&C offensive stats are lower bounds or catalog defaults, and the Two Masks, Feel the Beat and critical-multiplier residuals are unresolved.'
  };
}
