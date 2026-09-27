// Reviewed English upstream snapshot, 2026-09-12. Full evidence in data/character-research/luce.json.
export const characterResearch = {
  "slug": "luce",
  "name": "Shoki Ikenami",
  "coverage": "partial-source-modeled",
  "sources": [
    {
      "url": "https://lufel.net/en/character/luce/",
      "retrievedAt": "2026-09-12",
      "note": "Client-rendered shell; numeric verification uses public upstream English source."
    },
    {
      "url": "https://raw.githubusercontent.com/absolroot/lufelnet/main/data/characters/%EC%87%BC%ED%82%A4/skill.js",
      "sha256": "c9be4db1d2f85336e12ee4d3a7a12148527ec9f5854655c9a91032380be9610d",
      "retrievedAt": "2026-09-12",
      "language": "en"
    },
    {
      "url": "https://raw.githubusercontent.com/absolroot/lufelnet/main/data/characters/%EC%87%BC%ED%82%A4/ritual.js",
      "sha256": "c8b3430b02582b03eafa43d33b42dcd2757fe8e382b7bd1c839eaa254215fce9",
      "retrievedAt": "2026-09-12",
      "language": "en"
    },
    {
      "url": "https://raw.githubusercontent.com/absolroot/lufelnet/main/data/characters/%EC%87%BC%ED%82%A4/weapon.js",
      "sha256": "be4580cc78dfd5f8ff312b0c1618844a10852a8bd83edbe7715c058c862520c9",
      "retrievedAt": "2026-09-12",
      "language": "en"
    }
  ],
  "implemented": [
    "S1 damage, two party Blessings and Attack-scaled party damage; S2 non-self targeted defense.",
    "S3 and Highlight flat Attack grants with explicit unit conversion; electric crit damage, wind pierce and fire DOT bonus selected via Improv; A6 extends these selected effects to four turns.",
    "Highlight Blessings and A4 main-target Attack; Supporting Role refresh; explicit static weapon Attack."
  ],
  "missing": [
    "Improv selection requires a free start-turn action; set unit.luce.improv explicitly to fire/ice/electric/wind after selection. No default element is invented.",
    "A0 elemental ailment chance, Adlib control immunity, A2 next-hit mitigation, ailment resistance/accuracy and Technical Precision need engine consumers.",
    "Supporting Role requires a shared Blessing-change/expiry hook for gains by other characters; module refreshes after Luce skills and own turn only.",
    "Method Acting requires authoritative current ailment accuracy and dynamic Attack recomputation; weapon conditional procs await selection/Blessing hooks.",
    "Flat Attack uses mechanicAttack for source scaling but conversion to normalized attack must be configured explicitly via flatAttackScale; otherwise flat grants are omitted."
  ],
  "limitations": [
    "This is a partial source-based implementation, not a live-battle calibration.",
    "sourceTier explicitly selects one of four printed coefficient columns, default 3 to match the current catalog. A3/A5 skill ranks are not multiplied again.",
    "No weapon is assumed. characterOptions[slug].weapon accepts none, four-star, signature; refinement 0..6. staticWeaponStatsIncluded prevents double-counting passive equipment bonuses.",
    "Improv selection requires a free start-turn action; set unit.luce.improv explicitly to fire/ice/electric/wind after selection. No default element is invented.",
    "A0 elemental ailment chance, Adlib control immunity, A2 next-hit mitigation, ailment resistance/accuracy and Technical Precision need engine consumers.",
    "Supporting Role requires a shared Blessing-change/expiry hook for gains by other characters; module refreshes after Luce skills and own turn only.",
    "Method Acting requires authoritative current ailment accuracy and dynamic Attack recomputation; weapon conditional procs await selection/Blessing hooks.",
    "Flat Attack uses mechanicAttack for source scaling but conversion to normalized attack must be configured explicitly via flatAttackScale; otherwise flat grants are omitted."
  ]
};
export const coefficients = {
  "powers": {
    "S1": [
      1.518,
      1.673,
      1.58,
      1.735
    ]
  },
  "s1Cap": [
    0.351,
    0.387,
    0.366,
    0.402
  ],
  "s2Cap": [
    0.366,
    0.404,
    0.381,
    0.418
  ],
  "s3FlatCap": [
    569,
    627,
    592,
    650
  ],
  "hlFlatCap": [
    284,
    314,
    296,
    325
  ],
  "fire": [
    0.14,
    0.154,
    0.145,
    0.16
  ],
  "electric": [
    0.244,
    0.269,
    0.254,
    0.279
  ],
  "wind": [
    0.12,
    0.132,
    0.125,
    0.137
  ]
};
export const awarenessRules = {
  "name": "Shoki Ikenami",
  "r0": "High School Heartthrob",
  "r0_detail": "Shoki has 4 types of Improv states: Blazing Passion, Chilling Intensity, Electrifying Performance, and Tempestuous Drama. During battle, he can switch between states at the start of each turn.\nWhen dealing damage with a skill, there is a 75% chance to inflict all foes with an elemental ailment based on his current Improv state (Burn, Freeze, Shock, or Windswept).",
  "r1": "In the Limelight",
  "r1_detail": "When using a skill on an ally, for each Blessing stack on the target, increase the target's damage dealt by 3% (up to a maximum of 15%) for 2 turns.",
  "r2": "Flawless Performance",
  "r2_detail": "When using Adlib, also grant an additional effect: When the target next takes skill damage, decrease their final damage taken by 35% for 1 turn.",
  "r3": "Heroic Climax",
  "r3_detail": "Increase the skill levels of Followspot and Adlib by 2.",
  "r4": "Standing Ovation",
  "r4_detail": "Highlight Enhanced: Increase the main target's Attack by 10% for 2 turns, and grant 2 more Blessing stacks to all allies.",
  "r5": "Flowers on the Stage",
  "r5_detail": "Increase the skill levels of Improvise and Thief Tactics by 2.",
  "r6": "Bright Future",
  "r6_detail": "When the additional effects of Improvise are activated based on Improv state, extend the duration of the additional effects to 4 turns."
};
export const weaponRules = {
  "name": "Shoki Ikenami",
  "weapon4-1": {
    "name": "Mattatóre",
    "health": 1823.43,
    "attack": 539.4,
    "defense": 349.01,
    "skill_name": "Fated Enthroning",
    "description": "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%. When Shoki grants Blessing stacks, increase his Attack by 3.3%/4.3%/4.3%/5.3%/5.3%/6.3%/6.3% and ailment accuracy by 3.3%/4.3%/4.3%/5.3%/5.3%/6.3%/6.3% for 2 turns. Stacks up to 3 times."
  },
  "weapon4-2": {
    "name": "Sipario",
    "health": 2497.32,
    "attack": 594.58,
    "defense": 449.24,
    "skill_name": "Innumerable Stages",
    "description": "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.\nWhen using a skill on an ally, increase Shoki's ailment accuracy by 22.0%/28.0%/28.0%/34.0%/34.0%/40.0%/40.0% and grant 60% of this effect to all allies besides Shoki for 2 turns."
  },
  "weapon5-1": {
    "name": "Ribalta",
    "health": 2279.27,
    "attack": 673.89,
    "defense": 436.03,
    "skill_name": "Starstruck Throne",
    "description": "Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.\nWhen using a skill on an ally, if the target has Blessing stacks, increase damage by 11.0%/14.0%/14.0%/17.0%/17.0%/20.0%/20.0% for 2 turns.\nEach time Followspot or Improvise is activated with a different Improv state, permanently increase Shoki's Attack by 14.0%/18.0%/18.0%/22.0%/22.0%/26.0%/26.0%. This effect stacks up to 3 times. Also, allies besides Shoki gain 50% of this effect."
  }
};
const targets = {"S1":"boss","S2":"ally","S3":"ally","HL":"ally"};
const blocked = {};
const staticWeapons = {"four-star":{"stat":"attack","values":[0.12,0.12,0.16,0.16,0.2,0.2,0.24]},"signature":{"stat":"attack","values":[0.3,0.3,0.39,0.39,0.48,0.48,0.57]}};
export const owns = unit => unit?.slug === 'luce' || unit?.id === 'lufel-recent-luce';
export const value = (unit, values) => values[unit.luce.sourceTier];
export function initializeResearch(engine, unit) {
  if (!owns(unit) || unit.luce) return false;
  const options = engine.config?.characterOptions?.['luce'] || {};
  const sourceTier = options.sourceTier ?? 3;
  const refinement = options.refinement ?? 0;
  if (!Number.isInteger(sourceTier) || sourceTier < 0 || sourceTier > 3) throw new RangeError('luce: sourceTier must be 0..3');
  if (!Number.isInteger(refinement) || refinement < 0 || refinement > 6) throw new RangeError('luce: refinement must be 0..6');
  const weapon = options.weapon ?? 'none';
  if (!['none', 'four-star', 'signature'].includes(weapon)) throw new RangeError('luce: unknown weapon');
  unit.luce = { sourceTier, refinement, weapon, flatAttackScale: options.flatAttackScale };
  engine.state.mechanicsLimitations ??= [];
  for (const limitation of characterResearch.limitations) {
    const message = 'luce: ' + limitation;
    if (!engine.state.mechanicsLimitations.includes(message)) engine.state.mechanicsLimitations.push(message);
  }
  const effect = staticWeapons[weapon];
  if (effect && !options.staticWeaponStatsIncluded) buff(engine, unit, 'weapon_static', effect.stat, effect.values[refinement], null, 'equipment');
  return true;
}
export function buff(engine, unit, id, stat, amount, duration = 2, sourceType = 'character_skill') {
  return engine.applyUnitBuff(unit, { id: 'luce_' + id, name: 'LUCE ' + id,
    stat, value: amount, duration }, sourceType);
}
export function prepareSkill(actor, original, sourceType) {
  if (!owns(actor) || !actor.luce || !['character_skill', 'highlight'].includes(sourceType) || !Object.hasOwn(targets, original.slot)) return original;
  const skill = { ...original, target: targets[original.slot], characterPrepared: 'luce' };
  // Remove importer guesses. Dedicated afterSkill applies reviewed effects once.
  for (const key of ['buff', 'buffs', 'buffTarget', 'debuff', 'debuffs', 'heal', 'healFlat', 'healAttack', 'ailment']) delete skill[key];
  if (blocked[skill.slot]) throw new Error('luce: ' + blocked[skill.slot]);
  skill.power = coefficients.powers[skill.slot] ? value(actor, coefficients.powers[skill.slot]) : 0;
  return skill;
}
export function adaptCharacterDefinition(record) {
  if (!owns(record)) return record;
  const adapt = original => {
    if (!original) return original;
    const skill = { ...original, target: targets[original.slot] ?? original.target };
    if (skill.slot === 'S2') skill.excludeSelf = true;
    for (const key of ['buff', 'buffs', 'buffTarget', 'debuff', 'debuffs', 'heal', 'healFlat', 'healAttack', 'ailment']) delete skill[key];
    const powers = coefficients.powers[skill.slot];
    if (powers) { skill.powerTiers = [...powers]; skill.power = powers[3]; }
    else { skill.power = 0; skill.powerTiers = []; }
    if (blocked[skill.slot]) skill.characterUnavailable = blocked[skill.slot];
    return skill;
  };
  return { ...record, mechanicsCoverage: characterResearch.coverage,
    skills: record.skills.map(adapt), highlightSkill: adapt(record.highlightSkill) };
}
