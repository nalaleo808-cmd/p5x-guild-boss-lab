// Reviewed English upstream snapshot, 2026-09-12. Full evidence in data/character-research/violet.json.
export const characterResearch = {
  "slug": "violet",
  "name": "Kasumi Yoshizawa",
  "coverage": "partial-source-modeled",
  "sources": [
    {
      "url": "https://lufel.net/en/character/violet/",
      "retrievedAt": "2026-09-12",
      "note": "Client-rendered shell; numeric verification uses public upstream English source."
    },
    {
      "url": "https://raw.githubusercontent.com/absolroot/lufelnet/main/data/characters/%EC%B9%B4%EC%8A%A4%EB%AF%B8/skill.js",
      "sha256": "46925bbdad2f2dbfdfa10adebbd0272a7eedcb9d8ce7de3c4537e9927b0c6e62",
      "retrievedAt": "2026-09-12",
      "language": "en"
    },
    {
      "url": "https://raw.githubusercontent.com/absolroot/lufelnet/main/data/characters/%EC%B9%B4%EC%8A%A4%EB%AF%B8/ritual.js",
      "sha256": "82e30286bc5a67c56c6a9993f5c183d25c9cbbbeb2d2f04e859913d74afbd80f",
      "retrievedAt": "2026-09-12",
      "language": "en"
    },
    {
      "url": "https://raw.githubusercontent.com/absolroot/lufelnet/main/data/characters/%EC%B9%B4%EC%8A%A4%EB%AF%B8/weapon.js",
      "sha256": "c4f2e99090a730a91d5269f1d6ba501797436306fadc993b04fb009a25faa1fd",
      "retrievedAt": "2026-09-12",
      "language": "en"
    }
  ],
  "implemented": [
    "S1 damage and capped Lead Step, S2 ally targeting/Attack/Follow Step with A1 crit buff, base S3 damage with erroneous lasting buff removed.",
    "Bless-only Rhythm Count and four-star Step conditional at per-damage timing, permanent A2 milestone buffs, and explicit weapon static/Step-trigger effects.",
    "Highlight blocked pending Masquerade integration; Dance Partner identity and source duration recorded for future event hook."
  ],
  "missing": [
    "Spellbound Cinders free activation, Masquerade duration/cooldown, no-gauge Highlight legality and A6 second cast require scheduler and shared Highlight integration. Highlight is blocked until implemented.",
    "Dance Partner immediate reaction requires an afterAllySkill hook with main enemy target. Counted action-end cannot substitute for skill timing; follow-up remains excluded.",
    "Masquerade S3 enhancement and A4 Highlight bonus/evasion remain excluded. English/Japanese own-turn Masquerade expiry differs.",
    "Steps of Faith and signature Glass Slipper need shared Highlight/Theurgy event dispatch, including off-turn casts. Weapon Step-gain Attack and four-star conditional damage are supported.",
    "Rhythm Count is a Bless-only buff; Steps currently persist because Masquerade clearing is not implemented. A2 milestone buffs are permanent once reached."
  ],
  "limitations": [
    "This is a partial source-based implementation, not a live-battle calibration.",
    "sourceTier explicitly selects one of four printed coefficient columns, default 3 to match the current catalog. A3/A5 skill ranks are not multiplied again.",
    "No weapon is assumed. characterOptions[slug].weapon accepts none, four-star, signature; refinement 0..6. staticWeaponStatsIncluded prevents double-counting passive equipment bonuses.",
    "Spellbound Cinders free activation, Masquerade duration/cooldown, no-gauge Highlight legality and A6 second cast require scheduler and shared Highlight integration. Highlight is blocked until implemented.",
    "Dance Partner immediate reaction requires an afterAllySkill hook with main enemy target. Counted action-end cannot substitute for skill timing; follow-up remains excluded.",
    "Masquerade S3 enhancement and A4 Highlight bonus/evasion remain excluded. English/Japanese own-turn Masquerade expiry differs.",
    "Steps of Faith and signature Glass Slipper need shared Highlight/Theurgy event dispatch, including off-turn casts. Weapon Step-gain Attack and four-star conditional damage are supported.",
    "Rhythm Count is a Bless-only buff; Steps currently persist because Masquerade clearing is not implemented. A2 milestone buffs are permanent once reached."
  ]
};
export const coefficients = {
  "powers": {
    "S1": [
      1.869,
      2.061,
      1.984,
      2.175
    ],
    "S3": [
      2.491,
      2.746,
      2.644,
      2.899
    ]
  },
  "invitation": [
    0.324,
    0.357,
    0.344,
    0.377
  ],
  "weaponStepAttack": [
    0.21,
    0.27,
    0.27,
    0.33,
    0.33,
    0.39,
    0.39
  ],
  "weaponTwoSteps": [
    0.24,
    0.31,
    0.31,
    0.38,
    0.38,
    0.45,
    0.45
  ]
};
export const awarenessRules = {
  "name": "Kasumi Yoshizawa",
  "r0": "Masked Ball",
  "r0_detail": "Kasumi's Highlight does not deplete the Highlight gauge, and can activate critical hits.\nOn an ally's action, with 2 or more Step stacks, can use Spellbound Cinders to enter Masquerade mode, and can activate Highlight 1 time (Spellbound Cinders has a cooldown time of 3 turns). This effect lasts until the start of Kasumi's second turn after entering Masquerade (or if Spellbound Cinders is used during her own turn, until the end of the following turn).\nAlso, for every Step stack gained while in Masquerade mode, increase Attack by 10% and critical rate by 4%.\nWhen Masquerade ends, lose all Step stacks. If Masquerade ends and Highlight has not been used, activate Highlight on 1 random foe.",
  "r1": "Charming Invite",
  "r1_detail": "Extend the duration of Dance Partner by 1 turn.\nWhen using Invitation, increase critical rate of Kasumi and her Dance Partner by 15% for 3 turns.",
  "r2": "Blossoming Dance Floor",
  "r2_detail": "With 2 Step stacks, increase Attack by 33%. With 3 or more stacks, increase critical damage by 33%. These effects are permanent.",
  "r3": "Glittering Night",
  "r3_detail": "Increase the skill levels of Cinderella Glow and Thief Tactics by 3.",
  "r4": "Toll the Hour",
  "r4_detail": "When activating a Highlight, gain 1 Stroke of Midnight stack. Spend 1 Stroke of Midnight stack when taking damage, and evade that damage (not activated by some skills).\nAlso, with 4 Step stacks, increase Highlight damage by 50%.",
  "r5": "Neverending Dream",
  "r5_detail": "Increase the skill levels of Invitation and Midnight Magic by 3.",
  "r6": "Unmasked Ball",
  "r6_detail": "After Kasumi activates her Highlight, she can activate her Highlight 1 more time while in Masquerade mode. This Highlight has 80% of its normal damage, and can be activated 1 time each time Masquerade mode is entered. Also, it will not activate automatically when Masquerade mode ends."
};
export const weaponRules = {
  "name": "Kasumi Yoshizawa",
  "weapon4-1": {
    "name": "Divine Sword of Sinai",
    "health": 1791.59,
    "attack": 613.28,
    "defense": 296.11,
    "skill_name": "Blessing",
    "description": "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.\nWith 2 or more Step stacks, increase damage by 24.0%/31.0%/31.0%/38.0%/38.0%/45.0%/45.0%."
  },
  "weapon5-1": {
    "name": "Royal Étoile",
    "health": 2239.65,
    "attack": 766.41,
    "defense": 370,
    "skill_name": "Sunrise",
    "description": "Increase critical damage by 36.3%/36.3%/47.2%/47.2%/58.1%/58.1%/69.0%.\nWhen gaining a Step stack, increase Attack by 21.0%/27.0%/27.0%/33.0%/33.0%/39.0%/39.0% for 2 turns. This effect does not stack.\nWhen an ally activates a Highlight or Theurgy, gain 1 Glass Slipper stack, and increase Kasumi's damage by 8.4%/11.1%/11.1%/13.8%/13.8%/16.5%/16.5% for 3 turns. Stacks up to 2 times.\nWhen Glass Slipper is at 2 stacks, increase Kasumi's Highlight damage by 30.0%/39.0%/39.0%/48.0%/48.0%/57.0%/57.0% more."
  }
};
const targets = {"S1":"boss","S2":"ally","S3":"boss","HL":"boss"};
const blocked = {"HL":"Masquerade legal action and shared Highlight integration required."};
const staticWeapons = {"four-star":{"stat":"attack","values":[0.12,0.12,0.16,0.16,0.2,0.2,0.24]},"signature":{"stat":"critDamage","values":[0.363,0.363,0.472,0.472,0.581,0.581,0.69]}};
export const owns = unit => unit?.slug === 'violet' || unit?.id === 'lufel-recent-violet';
export const value = (unit, values) => values[unit.violet.sourceTier];
export function initializeResearch(engine, unit) {
  if (!owns(unit) || unit.violet) return false;
  const options = engine.config?.characterOptions?.['violet'] || {};
  const sourceTier = options.sourceTier ?? 3;
  const refinement = options.refinement ?? 0;
  if (!Number.isInteger(sourceTier) || sourceTier < 0 || sourceTier > 3) throw new RangeError('violet: sourceTier must be 0..3');
  if (!Number.isInteger(refinement) || refinement < 0 || refinement > 6) throw new RangeError('violet: refinement must be 0..6');
  const weapon = options.weapon ?? 'none';
  if (!['none', 'four-star', 'signature'].includes(weapon)) throw new RangeError('violet: unknown weapon');
  unit.violet = { sourceTier, refinement, weapon, flatAttackScale: options.flatAttackScale };
  engine.state.mechanicsLimitations ??= [];
  for (const limitation of characterResearch.limitations) {
    const message = 'violet: ' + limitation;
    if (!engine.state.mechanicsLimitations.includes(message)) engine.state.mechanicsLimitations.push(message);
  }
  const effect = staticWeapons[weapon];
  if (effect && !options.staticWeaponStatsIncluded) buff(engine, unit, 'weapon_static', effect.stat, effect.values[refinement], null, 'equipment');
  return true;
}
export function buff(engine, unit, id, stat, amount, duration = 2, sourceType = 'character_skill') {
  return engine.applyUnitBuff(unit, { id: 'violet_' + id, name: 'VIOLET ' + id,
    stat, value: amount, duration }, sourceType);
}
export function prepareSkill(actor, original, sourceType) {
  if (!owns(actor) || !actor.violet || !['character_skill', 'highlight'].includes(sourceType) || !Object.hasOwn(targets, original.slot)) return original;
  const skill = { ...original, target: targets[original.slot], characterPrepared: 'violet' };
  // Remove importer guesses. Dedicated afterSkill applies reviewed effects once.
  for (const key of ['buff', 'buffs', 'buffTarget', 'debuff', 'debuffs', 'heal', 'healFlat', 'healAttack', 'ailment']) delete skill[key];
  if (blocked[skill.slot]) throw new Error('violet: ' + blocked[skill.slot]);
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
