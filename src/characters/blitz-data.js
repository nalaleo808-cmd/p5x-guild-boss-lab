// Reviewed English upstream snapshot, 2026-09-12. Full evidence in data/character-research/blitz.json.
export const characterResearch = {
  "slug": "blitz",
  "name": "Kumi Katayama",
  "coverage": "partial-source-modeled",
  "sources": [
    {
      "url": "https://lufel.net/en/character/blitz/",
      "retrievedAt": "2026-09-12",
      "note": "Client-rendered shell; numeric verification uses public upstream English source."
    },
    {
      "url": "https://raw.githubusercontent.com/absolroot/lufelnet/main/data/characters/%EC%B9%B4%ED%83%80%EC%95%BC%EB%A7%88/skill.js",
      "sha256": "7894696d80c265d5b99876d2b82713e8593922ee661534ef2f295cf131e8ff0f",
      "retrievedAt": "2026-09-12",
      "language": "en"
    },
    {
      "url": "https://raw.githubusercontent.com/absolroot/lufelnet/main/data/characters/%EC%B9%B4%ED%83%80%EC%95%BC%EB%A7%88/ritual.js",
      "sha256": "25d55257e0284cf82f5ad12586014fdaf800b425afa78270410716342c4a6257",
      "retrievedAt": "2026-09-12",
      "language": "en"
    },
    {
      "url": "https://raw.githubusercontent.com/absolroot/lufelnet/main/data/characters/%EC%B9%B4%ED%83%80%EC%95%BC%EB%A7%88/weapon.js",
      "sha256": "870a3d1d439a14047944f6b72cb236180bc6b5aa23c7a9a43edfc7c450b3f872",
      "retrievedAt": "2026-09-12",
      "language": "en"
    }
  ],
  "implemented": [
    "S1/S2 Hard Knocks, S2/S3 affinity-independent per-target Down reductions, S3 Detention, and the two-owner-turn Lightning Legs state.",
    "Base A0 Hard Knocks enhancement at every awareness rank, A1/A2/A4 knockdown effects, Highlight permanent defense decrease and three-turn damage-taken debuff.",
    "Explicit four-star static and knockdown Attack, signature Lightning Legs critical rate, and reviewed base coefficients."
  ],
  "missing": [
    "A6 Wings of Guidance and fatal-damage evasion require damage prevention and owner-action scheduling. Signature crit-damage-taken has no critical-result status consumer.",
    "English/Japanese S1 enhancement 35% and downed-foe Attack 36% differ from Korean/Chinese 30%; cap interpretation of speed-scaled debuffs also differs. These contested effects are excluded.",
    "Dizzy/Shock accuracy and immunities; dynamic flat Attack conversion from live game stats to normalized simulator stats."
  ],
  "limitations": [
    "This is a partial source-based implementation, not a live-battle calibration.",
    "sourceTier explicitly selects one of four printed coefficient columns, default 3 to match the current catalog. A3/A5 skill ranks are not multiplied again.",
    "No weapon is assumed. characterOptions[slug].weapon accepts none, four-star, signature; refinement 0..6. staticWeaponStatsIncluded prevents double-counting passive equipment bonuses.",
    "A6 Wings of Guidance and fatal-damage evasion require damage prevention and owner-action scheduling. Signature crit-damage-taken has no critical-result status consumer.",
    "English/Japanese S1 enhancement 35% and downed-foe Attack 36% differ from Korean/Chinese 30%; cap interpretation of speed-scaled debuffs also differs. These contested effects are excluded.",
    "Dizzy/Shock accuracy and immunities; dynamic flat Attack conversion from live game stats to normalized simulator stats."
  ]
};
export const coefficients = {
  "powers": {
    "S1": [
      1.017,
      1.121,
      1.08,
      1.184
    ],
    "S2": [
      1.355,
      1.493,
      1.438,
      1.577
    ],
    "S3": [
      1.419,
      1.565,
      1.506,
      1.652
    ],
    "HL": [
      3.176,
      3.501,
      3.371,
      3.697
    ]
  },
  "hlDefense": [
    0.293,
    0.323,
    0.311,
    0.341
  ],
  "hlTaken": [
    0.195,
    0.215,
    0.207,
    0.227
  ],
  "hardKnocksDefense": [
    0.39, 0.43, 0.414, 0.454
  ],
  "hardKnocksDefenseBase": [
    0.098, 0.108, 0.104, 0.114
  ],
  "hardKnocksTaken": [
    0.312, 0.344, 0.332, 0.364
  ],
  "hardKnocksTakenBase": [
    0.078, 0.086, 0.083, 0.091
  ],
  "detentionDowned": [
    0.098, 0.108, 0.104, 0.114
  ],
  "detentionTaken": [
    0.273, 0.301, 0.29, 0.318
  ],
  "detentionTakenBase": [
    0.068, 0.075, 0.073, 0.08
  ],
  "weaponKnockdown": [
    0.075, 0.098, 0.098, 0.12, 0.12, 0.142, 0.142
  ],
  "weaponKnockdownCap": [
    0.225, 0.292, 0.292, 0.36, 0.36, 0.427, 0.427
  ],
  "weaponLegsCrit": [
    0.09, 0.117, 0.117, 0.143, 0.143, 0.17, 0.17
  ],
  "weaponDownCritTaken": [
    0.306, 0.398, 0.398, 0.49, 0.49, 0.582, 0.582
  ]
};
export const awarenessRules = {
  "name": "Kumi Katayama",
  "r0": "Tenacious Teacher",
  "r0_detail": "When Katayama uses Discharge Sprocket, Secret Technique: Lightning Legs is unlocked and becomes usable 1 time.\nWhen Secret Technique: Lightning Legs deals damage, greatly decrease the target's Down Points regardless of Electric affinity. Also, increase the Defense decrease effect of Hard Knocks by 10% for 2 turns (for every 10 points of Speed, increase by 2.22% more, up to a maximum bonus of 40%).",
  "r1": "Lightning Lecturer",
  "r1_detail": "When Katayama knocks down a foe, permanently decrease the target's Down Point maximum by 1.\nWhen a target is inflicted with Detention, increase critical damage taken by 30% more for 1 turn.\nWhen Katayama deals Electric damage, inflict Shock on the target.",
  "r2": "Role Model",
  "r2_detail": "When Katayama knocks down a foe with a skill, increase the target's damage taken while downed by 10% more for 1 turn. Also, permanently increase party's Attack by 10% (stacks up to 3 times).",
  "r3": "Electric Cycle",
  "r3_detail": "Increase the skill levels of Discharge Sprocket and Thunderbolt Outrage by 3.",
  "r4": "Class in Session",
  "r4_detail": "Highlight Enhanced: After activating a Highlight, the next time Katayama knocks down a foe, permanently increase the target's damage taken by 20% more. This effect does not stack.",
  "r5": "Unstoppable Light",
  "r5_detail": "Increase the skill levels of Secret Technique: Lightning Legs and Thief Tactics by 3.",
  "r6": "Unconditional Love",
  "r6_detail": "At the start of battle, gain 2 Wings of Guidance stacks. Gain 1 Wings of Guidance stack after every 2 skills used. Wings of Guidance stacks up to 3 times.\nAt the start of Katayama's turn, spend 1 Wings of Guidance stack to gain the following buffs for 1 turn. Increase Katayama's Attack by 50%, critical rate by 10%, critical damage by 30%, and allow her Highlight to activate critical hits. Also, increase damage taken by foes with Hard Knocks by 30% more, and increase damage taken by downed foes with Detention by 20% more.\nWhen Katayama takes fatal damage, if she has Wings of Guidance, spend 1 Wings of Guidance stack to evade that damage (this effect activates once per battle, and is not effective against certain skills)."
};
export const weaponRules = {
  "name": "Kumi Katayama",
  "weapon3-1": {
    "name": "Combat Boots",
    "health": 1343,
    "attack": 424,
    "defense": 237,
    "skill_name": "Endless Rush",
    "description": "When user has [Super Limit], increase Speed by 7.4/8.5/9.6/10.7/11.8/12.9/14.0."
  },
  "weapon4-1": {
    "name": "Blitzkrieg Bangs",
    "health": 1791.59,
    "attack": 565.81,
    "defense": 317.1,
    "skill_name": "",
    "description": "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.\nWhen Katayama knocks down foes, increase Attack by 7.5%/9.8%/9.8%/12.0%/12.0%/14.2%/14.2% for each foe knocked down (up to a maximum of 22.5%/29.2%/29.2%/36.0%/36.0%/42.7%/42.7%). Lasts for 1 turn."
  },
  "weapon5-1": {
    "name": "Lightning Riders",
    "health": 2239.65,
    "attack": 706.91,
    "defense": 396.41,
    "skill_name": "",
    "description": "Increase Speed by 15.0/15.0/20.0/20.0/25.0/25.0/30.0.\nAfter using Secret Technique: Lightning Legs, increase Katayama's critical rate by 9.0%/11.7%/11.7%/14.3%/14.3%/17.0%/17.0% for 2 turns.\nIf any foes are knocked down when Katayama is present, increase the target's critical damage taken by 30.6%/39.8%/39.8%/49.0%/49.0%/58.2%/58.2% for 1 turn."
  }
};
const targets = {"S1":"all_enemies","S2":"all_enemies","S3":"all_enemies","HL":"all_enemies"};
const blocked = {};
const staticWeapons = {"four-star":{"stat":"attack","values":[0.12,0.12,0.16,0.16,0.2,0.2,0.24]}};
export const owns = unit => unit?.slug === 'blitz' || unit?.id === 'lufel-recent-blitz';
export const value = (unit, values) => values[unit.blitz.sourceTier];
export function initializeResearch(engine, unit) {
  if (!owns(unit) || unit.blitz) return false;
  const options = engine.config?.characterOptions?.['blitz'] || {};
  const sourceTier = options.sourceTier ?? 3;
  const refinement = options.refinement ?? 0;
  if (!Number.isInteger(sourceTier) || sourceTier < 0 || sourceTier > 3) throw new RangeError('blitz: sourceTier must be 0..3');
  if (!Number.isInteger(refinement) || refinement < 0 || refinement > 6) throw new RangeError('blitz: refinement must be 0..6');
  const weapon = options.weapon ?? 'none';
  if (!['none', 'four-star', 'signature'].includes(weapon)) throw new RangeError('blitz: unknown weapon');
  unit.blitz = { sourceTier, refinement, weapon, flatAttackScale: options.flatAttackScale };
  engine.state.mechanicsLimitations ??= [];
  for (const limitation of characterResearch.limitations) {
    const message = 'blitz: ' + limitation;
    if (!engine.state.mechanicsLimitations.includes(message)) engine.state.mechanicsLimitations.push(message);
  }
  const effect = staticWeapons[weapon];
  if (effect && !options.staticWeaponStatsIncluded) buff(engine, unit, 'weapon_static', effect.stat, effect.values[refinement], null, 'equipment');
  return true;
}
export function buff(engine, unit, id, stat, amount, duration = 2, sourceType = 'character_skill') {
  return engine.applyUnitBuff(unit, { id: 'blitz_' + id, name: 'BLITZ ' + id,
    stat, value: amount, duration }, sourceType);
}
export function prepareSkill(actor, original, sourceType) {
  if (!owns(actor) || !actor.blitz || !['character_skill', 'highlight'].includes(sourceType) || !Object.hasOwn(targets, original.slot)) return original;
  const skill = { ...original, target: targets[original.slot], characterPrepared: 'blitz' };
  // Remove importer guesses. Dedicated afterSkill applies reviewed effects once.
  for (const key of ['buff', 'buffs', 'buffTarget', 'debuff', 'debuffs', 'heal', 'healFlat', 'healAttack', 'ailment']) delete skill[key];
  if (blocked[skill.slot]) throw new Error('blitz: ' + blocked[skill.slot]);
  skill.power = coefficients.powers[skill.slot] ? value(actor, coefficients.powers[skill.slot]) : 0;
  return skill;
}
export function adaptCharacterDefinition(record) {
  if (!owns(record)) return record;
  const adapt = original => {
    if (!original) return original;
    const skill = { ...original, target: targets[original.slot] ?? original.target };
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
