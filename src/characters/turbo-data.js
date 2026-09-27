// Reviewed English upstream snapshot, 2026-09-12. Full evidence in data/character-research/turbo.json.
export const characterResearch = {
  "slug": "turbo",
  "name": "Mayumi Hashimoto",
  "coverage": "partial-source-modeled",
  "sources": [
    {
      "url": "https://lufel.net/en/character/turbo/",
      "retrievedAt": "2026-09-12",
      "note": "Client-rendered shell; numeric verification uses public upstream English source."
    },
    {
      "url": "https://raw.githubusercontent.com/absolroot/lufelnet/main/data/characters/%EB%A7%88%EC%9C%A0%EB%AF%B8/skill.js",
      "sha256": "6b8ea44f80ed36452a7063c95674c4af7d576f410f4738910dc5130f2f3f5322",
      "retrievedAt": "2026-09-12",
      "language": "en"
    },
    {
      "url": "https://raw.githubusercontent.com/absolroot/lufelnet/main/data/characters/%EB%A7%88%EC%9C%A0%EB%AF%B8/ritual.js",
      "sha256": "2f98289149b96b8431387b5469043f3d3cd0f7d5446e5fd3f35fe6dd0fd16b86",
      "retrievedAt": "2026-09-12",
      "language": "en"
    },
    {
      "url": "https://raw.githubusercontent.com/absolroot/lufelnet/main/data/characters/%EB%A7%88%EC%9C%A0%EB%AF%B8/weapon.js",
      "sha256": "8b0e3188f8714a22a5bc2b154d69970a8b9b36610bc3bd9e8f03106f055ee998",
      "retrievedAt": "2026-09-12",
      "language": "en"
    }
  ],
  "implemented": [
    "S1 damage and speed-scaled party damage; S2 Attack/Defense and S3 Attack/Pierce; corrected nondamaging ally-targeted Highlight with A4 duration/damage.",
    "A0/A6 initial Velocity, counted-action gain with A1 and lifetime Torque Boost thresholds; A2 party milestones.",
    "Explicit four-star static Attack."
  ],
  "missing": [
    "Extra-action scheduling, Velocity spend amount/cooldown and A6 40/80 selection require legal-action and scheduler integration. No extra action is silently awarded.",
    "Velocity gain is recorded only for counted party actions through onAllyActionEnd. Extra actions and other eligible action types need explicit engine dispatch after their source semantics are verified.",
    "Speed scaling uses continuous speed/10 with the printed cap on total bonus, following existing engine convention; localization cap wording needs live verification.",
    "Extra-action enhancements, downed-foe passives and knockdown follow-up require legal extra-action scheduling or a same-cast follow-up selection.",
    "Highlight's selected-recipient next direct-hit Down reduction and signature lifetime-Velocity party damage are modeled. Signature Speed/dynamic Attack and four-star conditional damage lifetime remain excluded."
  ],
  "limitations": [
    "This is a partial source-based implementation, not a live-battle calibration.",
    "sourceTier explicitly selects one of four printed coefficient columns, default 3 to match the current catalog. A3/A5 skill ranks are not multiplied again.",
    "No weapon is assumed. characterOptions[slug].weapon accepts none, four-star, signature; refinement 0..6. staticWeaponStatsIncluded prevents double-counting passive equipment bonuses.",
    "Extra-action scheduling, Velocity spend amount/cooldown and A6 40/80 selection require legal-action and scheduler integration. No extra action is silently awarded.",
    "Velocity gain is recorded only for counted party actions through onAllyActionEnd. Extra actions and other eligible action types need explicit engine dispatch after their source semantics are verified.",
    "Speed scaling uses continuous speed/10 with the printed cap on total bonus, following existing engine convention; localization cap wording needs live verification.",
    "Extra-action enhancements, downed-foe passives and knockdown follow-up require legal extra-action scheduling or a same-cast follow-up selection.",
    "Highlight's selected-recipient next direct-hit Down reduction and signature lifetime-Velocity party damage are modeled. Signature Speed/dynamic Attack and four-star conditional damage lifetime remain excluded."
  ]
};
export const coefficients = {
  "powers": {
    "S1": [
      1.342,
      1.48,
      1.425,
      1.562
    ]
  },
  "normalBase": [
    0.088,
    0.097,
    0.093,
    0.102
  ],
  "normalCap": [
    0.351,
    0.387,
    0.373,
    0.409
  ],
  "defBase": [
    0.098,
    0.108,
    0.104,
    0.114
  ],
  "defCap": [
    0.39,
    0.43,
    0.414,
    0.454
  ],
  "pierceBase": [
    0.01,
    0.011,
    0.01,
    0.011
  ],
  "pierceCap": [
    0.039,
    0.043,
    0.041,
    0.045
  ],
  "attackBase": [
    0.127,
    0.14,
    0.135,
    0.148
  ],
  "attackCap": [
    0.508,
    0.56,
    0.539,
    0.591
  ],
  "hlBase": [
    0.059,
    0.065,
    0.062,
    0.068
  ],
  "hlCap": [
    0.234,
    0.258,
    0.249,
    0.273
  ],
  "weaponVelocityDamage": [
    0.034, 0.044, 0.044, 0.054, 0.054, 0.064, 0.064
  ],
  "weaponVelocityCap": [
    0.17, 0.22, 0.22, 0.27, 0.27, 0.32, 0.32
  ]
};
export const awarenessRules = {
  "name": "Mayumi Hashimoto",
  "r0": "Racing Game Lover",
  "r0_detail": "At the start of battle, Mayumi gains 90 Velocity stacks. At the end of each action by an ally, gain 4 Velocity stacks (if Mayumi's Speed is over 100, gain 1 more Velocity stack for every 10 points of Speed over 100; up to 6 stacks).\nAt the start of Mayumi's turn, if Velocity is over 120 stacks, can spend Velocity to gain an extra action at the end of her current action (cooldown: 1 turn). When total Velocity stacks gained during battle reach 100/220/350 stacks, activate level 1/2/3 of Torque Boost.\nTorque Boost: Increase party's pierce rate by 5%/10%/15%.",
  "r1": "Tire Change",
  "r1_detail": "At the end of each action by an ally, gain 10 more Velocity stacks.\nOn an extra action, when using a skill different from the one used immediately before, activate the following additional effects.\nShockwave: When activating a skill, increase critical damage by 50%.\nAero Setup: Increase shield by 30%. Also, increase party's Defense by 30% more.\nPower Setup: Increase main target's pierce rate by 10% more.",
  "r2": "High-Spec Engine",
  "r2_detail": "When activating Torque Boost, activate the following additional effects.\nLevel 1: Increase party's critical damage by 20%.\nLevel 2: Increase party's damage by 20%.\nLevel 3: Increase party's Attack by 30%.",
  "r3": "Output Control",
  "r3_detail": "Increase the skill levels of Power Setup and Thief Tactics by 3.",
  "r4": "Pole Position",
  "r4_detail": "Highlight Enhanced: Increase party's damage by 10% more. Also, extend the duration of the Highlight's buffs by 1 turn.",
  "r5": "Aerodynamic Control",
  "r5_detail": "Increase the skill levels of Shockwave and Aero Setup by 3.",
  "r6": "Circuit Queen",
  "r6_detail": "The amount of Velocity stacks gained at the start of battle becomes 120. On Mayumi's extra action, spend 40 or 80 Velocity stacks, and activate the following additional effects the next time a skill is activated.\n40 Velocity spent\nShockwave: When activating a skill, increase Mayumi's critical rate by 20%. If the target is knocked down, increase party's Attack by 25% for 2 turns.\nAero Setup: Increase shield by 20%. Also, extend the shield duration by 1 turn.\nPower Setup: When used on an extra turn, change buff target from main target to all allies.\n80 Velocity spent\nShockwave: Increase party's damage dealt to downed foes by 15% for 1 turn.\nAero Setup: Decrease party's damage taken by 20% for 1 turn.\nPower Setup: Increase party's damage dealt by 25% for 1 turn."
};
export const weaponRules = {
  "name": "Mayumi Hashimoto",
  "weapon4-1": {
    "name": "Formula Pennant",
    "health": 1791.59,
    "attack": 554.96,
    "defense": 328.02,
    "skill_name": "Wake Effect",
    "description": "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.\nWhen activating Torque Boost, increase damage by 18.0%/23.4%/23.4%/28.8%/28.8%/34.2%/34.2%."
  },
  "weapon5-1": {
    "name": "Nebula Pennant",
    "health": 2239.65,
    "attack": 693.7,
    "defense": 409.62,
    "skill_name": "Gravity Acceleration",
    "description": "Increase Speed by 15/15/20/20/25/25/30. When Mayumi's Speed is over 100, for every 10 points of Speed above 100, increase Attack by 12.5%/16.2%/16.2%/20.0%/20.0%/23.8%/23.8% (up to a maximum of 100.0%/130.0%/130.0%/160.0%/160.0%/190.0%/190.0%).\nAfter activating a skill, for every 40 stacks of total Velocity, increase party's damage by 3.4%/4.4%/4.4%/5.4%/5.4%/6.4%/6.4% for 2 turns (up to a maximum of 17.0%/22.0%/22.0%/27.0%/27.0%/32.0%/32.0%)."
  }
};
const targets = {"S1":"all_enemies","S2":"party","S3":"ally","HL":"ally"};
const blocked = {};
const staticWeapons = {"four-star":{"stat":"attack","values":[0.12,0.12,0.16,0.16,0.2,0.2,0.24]}};
export const owns = unit => unit?.slug === 'turbo' || unit?.id === 'lufel-recent-turbo';
export const value = (unit, values) => values[unit.turbo.sourceTier];
export function initializeResearch(engine, unit) {
  if (!owns(unit) || unit.turbo) return false;
  const options = engine.config?.characterOptions?.['turbo'] || {};
  const sourceTier = options.sourceTier ?? 3;
  const refinement = options.refinement ?? 0;
  if (!Number.isInteger(sourceTier) || sourceTier < 0 || sourceTier > 3) throw new RangeError('turbo: sourceTier must be 0..3');
  if (!Number.isInteger(refinement) || refinement < 0 || refinement > 6) throw new RangeError('turbo: refinement must be 0..6');
  const weapon = options.weapon ?? 'none';
  if (!['none', 'four-star', 'signature'].includes(weapon)) throw new RangeError('turbo: unknown weapon');
  unit.turbo = { sourceTier, refinement, weapon, flatAttackScale: options.flatAttackScale };
  engine.state.mechanicsLimitations ??= [];
  for (const limitation of characterResearch.limitations) {
    const message = 'turbo: ' + limitation;
    if (!engine.state.mechanicsLimitations.includes(message)) engine.state.mechanicsLimitations.push(message);
  }
  const effect = staticWeapons[weapon];
  if (effect && !options.staticWeaponStatsIncluded) buff(engine, unit, 'weapon_static', effect.stat, effect.values[refinement], null, 'equipment');
  return true;
}
export function buff(engine, unit, id, stat, amount, duration = 2, sourceType = 'character_skill') {
  return engine.applyUnitBuff(unit, { id: 'turbo_' + id, name: 'TURBO ' + id,
    stat, value: amount, duration }, sourceType);
}
export function prepareSkill(actor, original, sourceType) {
  if (!owns(actor) || !actor.turbo || !['character_skill', 'highlight'].includes(sourceType) || !Object.hasOwn(targets, original.slot)) return original;
  const skill = { ...original, target: targets[original.slot], characterPrepared: 'turbo' };
  // Remove importer guesses. Dedicated afterSkill applies reviewed effects once.
  for (const key of ['buff', 'buffs', 'buffTarget', 'debuff', 'debuffs', 'heal', 'healFlat', 'healAttack', 'ailment']) delete skill[key];
  if (blocked[skill.slot]) throw new Error('turbo: ' + blocked[skill.slot]);
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
