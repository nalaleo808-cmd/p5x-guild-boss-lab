// Reviewed public snapshot: 2026-09-12. Full provenance in data/character-research/wind-tempest.json.
export const characterResearch = {
  "slug": "wind-tempest",
  "name": "Tempest Riko",
  "coverage": "partial-source-verified",
  "limitations": [
    "Not battle-replay calibrated. Disabled actions must be filtered by parent before spending cost or ammo.",
    "Source tiers explicitly ordered [10,10+5,13,13+5], selected by loadout characterResearch.sourceTier; default 3 follows Cosmic Yui. Skill-level awareness is not multiplied again.",
    "Static weapon passives use the selected refinement; equipped stats must set staticWeaponStatsIncluded to avoid double counting.",
    "Blossoming Season spends all current SP and grants its sourced base critical-rate/Unravel effect; its 50/100/150 SP scaling interpretation remains unverified.",
    "Blossom and Falling Petals use packet timing; exact live duration clocks need replay confirmation."
  ],
  "sources": [
    {
      "url": "https://lufel.net/en/character/wind-tempest/",
      "retrievedAt": "2026-09-12",
      "type": "community-game-data"
    },
    {
      "file": "skill.js",
      "url": "https://lufel.net/data/characters/%EB%A6%AC%EC%BD%94%C2%B7%EB%A7%A4%ED%99%94/skill.js",
      "sha256": "1b5cb69c95a5daf4baa63ebe359571ed194c57c4718d3e5fb908ef02b194ab5d",
      "retrievedAt": "2026-09-12",
      "httpStatus": 200
    },
    {
      "file": "ritual.js",
      "url": "https://lufel.net/data/characters/%EB%A6%AC%EC%BD%94%C2%B7%EB%A7%A4%ED%99%94/ritual.js",
      "sha256": "03f7bdf433b558036040aec9d5012c55ff0d3c6b3dafdcff82bf45cc897fcc0d",
      "retrievedAt": "2026-09-12",
      "httpStatus": 200
    },
    {
      "file": "weapon.js",
      "url": "https://lufel.net/data/characters/%EB%A6%AC%EC%BD%94%C2%B7%EB%A7%A4%ED%99%94/weapon.js",
      "sha256": "74203970c41530f1fa30adca9635dfa12f5eb7925ece6b3d09a6f32c3f192de9",
      "retrievedAt": "2026-09-12",
      "httpStatus": 200
    }
  ],
  "implemented": [
    "A0/A2 SP cap, SP Recovery passive, S1 restore and Falling Petals/A1/A6 per-packet damage effects",
    "S2 party buffs, SP and one-time refund; S3 base effect, Unravel/Blossom; Highlight/A4 party support",
    "Static and supported dynamic weapon effects at refinement 0-6"
  ],
  "missing": [
    "Blossoming Season spends all current SP and grants its sourced base critical-rate/Unravel effect; its 50/100/150 SP scaling interpretation remains unverified.",
    "Blossom and Falling Petals use packet timing; exact live duration clocks need replay confirmation."
  ],
  "comparison": {
    "liveSnapshot": "data/lufel-live-recent.json",
    "englishSkillsExactlyMatch": true,
    "catalog": "data/lufel-catalog.json",
    "existingBespokeEngineLogic": false,
    "corrections": [
      "A0/A2 SP cap; S1 SP Recovery-scaled self restore",
      "S2 critical-multiplier-scaled party Attack and party SP, A1 Sweeper bonus",
      "Highlight single-ally/A4 party flat Attack and critical damage; excludes Riko from SP restoration",
      "Opt-in static weapon stat at refinement 0-6"
    ]
  },
  "integration": {
    "initialize": "After live unit loadouts and party construction; once per unit. Ange uses state.navigator.",
    "beforeSkill": "Before SP/HP/ammo changes and before cloning damageSkill. Return value must replace skill.",
    "afterSkill": "Once per successful outer cast after damage, using prepared skill; never for unrelated source types.",
    "onTurnEnd": "After all counted actions of owner turn, before next turn starts. Howler stance clock only.",
    "navigator": null
  },
  "awareness": {
    "name": "Tempest Riko",
    "r0": "Fragrant Gale",
    "r0_detail": "Increase Tempest Riko's max SP to 200, and increase her SP Recovery by 60%. When using a skill to restore her own SP, the amount recovered is affected by SP Recovery.\nWhen using Blossoming Season, spend all SP, and activate different effects based on the amount of SP spent.",
    "r1": "Colors of Dawn",
    "r1_detail": "The condition to activate the Falling Petals effect from Storm of Petals changes from Wind damage to any attribute damage. Also, increase the target's critical damage taken by 30%.\nArrival of Spring increases Sweeper allies' Attack by 25% more.",
    "r2": "East Wind",
    "r2_detail": "Increase Tempest Riko's max SP by 50 (also increase the maximum effect of Blossoming Season). Also, after activating Blossoming Season, immediately recover 50 SP.\nEnhance the effect of the Talent Vernal Splendor: Double the critical damage increase after gaining 5/10 Blossom stacks.",
    "r3": "Swaying Boughs",
    "r3_detail": "Increase the skill levels of Arrival of Spring and Blossoming Season by 3.",
    "r4": "Sea Breeze",
    "r4_detail": "Highlight Enhanced: The buff effect now applies to all allies besides Tempest Riko. Increase the main target's critical damage by 12% more, and restore 32 SP to all allies besides Tempest Riko.",
    "r5": "Rage of Spring",
    "r5_detail": "Increase the skill levels of Storm of Petals and Thief Tactics by 3.",
    "r6": "Full Blossom",
    "r6_detail": "Blossoming Season now affects all allies besides Tempest Riko. When the main target uses a skill, immediately activate Storm of Petals 1 time on the target foe. This effect can only be activated 1 time for each use of Blossoming Season. Also, extend the duration of Falling Petals from Storm of Petals by 1 turn.\nWhile Riko is on the field, when any ally deals damage, for every 1% of their critical rate that exceeds 100%, increase the critical damage of that damage by 2%."
  },
  "weapons": {
    "name": "Tempest Riko",
    "weapon4-1": {
      "name": "Sparrow's Leap",
      "health": 1918.23,
      "attack": 517.62,
      "defense": 338.09,
      "skill_name": "",
      "description": "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.\nWhen Tempest Riko restores SP with a skill, increase her critical damage by 8.7%/11.3%/11.3%/13.9%/13.9%/16.5%/16.5% for 2 turns. Stacks up to 2 times."
    },
    "weapon5-1": {
      "name": "Windplum Dance",
      "health": 2398.2,
      "attack": 647.48,
      "defense": 422.82,
      "skill_name": "",
      "description": "Increase critical damage by 36.3%/36.3%/47.2%/47.2%/58.1%/58.1%/69.0%.\nAfter using a skill on an ally, increase all allies' critical damage by 13.2%/17.2%/17.2%/21.2%/21.2%/25.2%/25.2% besides Tempest Riko for 2 turns. Also, when the main target deals damage with a skill, increase the damage by 3.3%/4.3%/4.3%/5.3%/5.3%/6.3%/6.3% for every 50 SP spent by that skill for 2 turns."
    }
  },
  "skills": {
    "name": "Tempest Riko",
    "skill1": {
      "name": "Storm of Petals",
      "element": "질풍",
      "type": "단일 피해",
      "cool": 0,
      "description": "Deal Wind damage to 1 foe equal to 183.0%/201.8%/194.2%/213.0% of Attack, and inflict Windswept and Falling Petals for 2 turns.\nFalling Petals: When taking Wind damage, increase Attack for that damage. The increase is equal to 18.3% of the portion of Tempest Riko's critical multiplier that exceeds 100% (up to 388.0%/418.0%/418.0%/448.0% of critical multiplier).\nAlso, restore Tempest Riko's SP by 16.",
      "sp": 0
    },
    "skill2": {
      "name": "Arrival of Spring",
      "element": "버프광역",
      "type": "버프",
      "cool": 0,
      "description": "Increase party's Attack for 2 turns. The increase is equal to 12.8% of the portion of Tempest Riko's critical multiplier that exceeds 100% (up to 388.0%/418.0%/418.0%/448.0% of critical multiplier). Also, restore party's SP by 4.\nFor one time only while this effect is active, when an ally deals damage with a skill, Resonance, Highlight, or Theurgy, restore Tempest Riko's SP by 12.",
      "sp": 0
    },
    "skill3": {
      "name": "Blossoming Season",
      "element": "버프",
      "type": "버프",
      "sp": "50 - 200",
      "cool": 0,
      "description": "Spend all SP, and increase 1 other ally's critical rate by 16.0%/17.0%/17.0%/18.0% for 2 turns. Also, apply the following effects based on the amount of SP spent. For every 2 SP spent, increase the effect by 1%.\n50 SP or higher: For every 1% of Tempest Riko's critical multiplier that exceeds 100%, increase Attack by 2.4.\n100 SP or higher: Increase critical damage by 12% of the portion of Tempest Riko's critical multiplier that exceeds 100%.\n150 SP or higher: Increase critical damage more by 6% of the portion of Tempest Riko's critical multiplier that exceeds 100%.\nThese effects count up to 388.0%/418.0%/418.0%/448.0% of Tempest Riko's critical multiplier."
    },
    "skill_highlight": {
      "element": "버프",
      "type": "버프",
      "description": "Increase 1 other ally's Attack (for every 1% of Tempest Riko's critical multiplier that exceeds 100%, increase Attack by 2.5, up to 388.0%/418.0%/418.0%/448.0% of critical multiplier) and increase critical damage by 24.4%/26.9%/25.9%/28.4% for 2 turns.\nAlso, restore 20 SP to all allies besides Tempest Riko.",
      "cool": 4
    },
    "passive1": {
      "name": "Vernal Splendor",
      "element": "패시브",
      "description": "After using Blossoming Season, grant Unravel to the target for 2 turns.\nUnravel: Each time skill damage is dealt, gain 1 Blossom stack.\nBlossom: Increase Attack by 30 for 3 turns. Stacks up to 10 times. After gaining 5 Blossom stacks, increase Attack more by 8.0% of the portion of Tempest Riko's critical multiplier that exceeds 100%, and increase critical damage by 5.0% of the portion of her critical multiplier that exceeds 100%. After gaining 10 Blossom stacks, critical damage is increased more. This increase is equal to 5.0% of the portion of her critical multiplier that exceeds 100%.",
      "cool": 0
    },
    "passive2": {
      "name": "Sun-kissed Blooms",
      "element": "패시브",
      "description": "During battle, increase critical damage and HP based on Tempest Riko's SP Recovery. At a maximum of 450.0% SP Recovery, increase critical damage by 84.0%, and HP by 1800.0.",
      "cool": 0
    }
  }
};

export function adaptCharacterDefinition(record) {
  if (record.slug !== characterResearch.slug) return record;
  const result = structuredClone(record);
  result.mechanicsCoverage = characterResearch.coverage;
  result.characterResearch = characterResearch;
  for (const skill of [...(result.skills || []), result.highlightSkill].filter(Boolean)) {
    for (const key of ['buff','buffTarget','debuff','heal','healAttack','healFlat','healTarget','spRestore','actionBonus']) delete skill[key];
  }
  return result;
}
