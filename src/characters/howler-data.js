// Reviewed public snapshot: 2026-09-12. Full provenance in data/character-research/howler.json.
export const characterResearch = {
  "slug": "howler",
  "name": "Runa Dogenzaka",
  "coverage": "partial-source-verified",
  "limitations": [
    "Not battle-replay calibrated. Disabled actions must be filtered by parent before spending cost or ammo.",
    "Source tiers explicitly ordered [10,10+5,13,13+5], selected by loadout characterResearch.sourceTier; default 3 follows Cosmic Yui. Skill-level awareness is not multiplied again.",
    "Static weapon passives use the selected refinement; equipped stats must set staticWeaponStatsIncluded to avoid double counting.",
    "Burn and A0's level-dependent chance/effects need an ailment accuracy and resistance resolver.",
    "S1/S2 and weapon stance durations use the simulator owner-turn clock; exact live expiry ordering remains unverified."
  ],
  "sources": [
    {
      "url": "https://lufel.net/en/character/howler/",
      "retrievedAt": "2026-09-12",
      "type": "community-game-data"
    },
    {
      "file": "skill.js",
      "url": "https://lufel.net/data/characters/%EB%A3%A8%EC%9A%B0%EB%82%98/skill.js",
      "sha256": "303d7d0d2c9e7fe8c3a9aeebb9694c17aeb1f880bff755263d328671673e77ec",
      "retrievedAt": "2026-09-12",
      "httpStatus": 200
    },
    {
      "file": "ritual.js",
      "url": "https://lufel.net/data/characters/%EB%A3%A8%EC%9A%B0%EB%82%98/ritual.js",
      "sha256": "d6d87e1b1e5c20511411a2e67a148920edc42000fce53f898f043465ac76209a",
      "retrievedAt": "2026-09-12",
      "httpStatus": 200
    },
    {
      "file": "weapon.js",
      "url": "https://lufel.net/data/characters/%EB%A3%A8%EC%9A%B0%EB%82%98/weapon.js",
      "sha256": "3ecad814f514976d7822aed58cd68efd1609d283273ebbddb19e3a468f1e3340",
      "retrievedAt": "2026-09-12",
      "httpStatus": 200
    }
  ],
  "implemented": [
    "S1/S2 Defense reduction, stances, Peppy Guard Dog, Faithful Dog, A1/A2 and A6 extensions",
    "Woof Woof Blaze branches, A6 dual cast, typed exposure and signature Defense reductions",
    "Highlight Enthusiastic Fuse application and per-packet consumption",
    "Static and supported dynamic weapon effects at refinement 0-6"
  ],
  "missing": [
    "Burn and A0's level-dependent chance/effects need an ailment accuracy and resistance resolver.",
    "S1/S2 and weapon stance durations use the simulator owner-turn clock; exact live expiry ordering remains unverified."
  ],
  "comparison": {
    "liveSnapshot": "data/lufel-live-recent.json",
    "englishSkillsExactlyMatch": true,
    "catalog": "data/lufel-catalog.json",
    "existingBespokeEngineLogic": false,
    "corrections": [
      "S1/S2 corrected ailment-accuracy-scaled shared Defense reduction, A6 duration",
      "S1/S2 stance tracking and A6 opening stances; expiration on owner turn end",
      "Peppy Guard Dog Attack conversion",
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
    "name": "Runa Dogenzaka",
    "r0": "Station Square Mascot",
    "r0_detail": "When Big Welcome or Furrocious Follow-Up are active, Runa can use Woof Woof Blaze. When using Woof Woof Blaze, 60% chance to decrease target's healing received by 30%/40%/50%, and Defense by 6%/12%/18% (effect changes at Lv. 1/50/70, respectively) for 2 turns.",
    "r1": "Legendary Devotion",
    "r1_detail": "After using Woof Woof Blaze and activating the effects of Big Welcome, increase target's Fire, Ice, Electric and Wind damage taken by 36% for 2 turns. When activating the effects of Furrocious Follow-Up, increase target's Resonance damage taken by 50% for 2 turns.",
    "r2": "Trapped in Shibuya",
    "r2_detail": "When a foe has a debuff inflicted by Runa, increase target's critical damage taken by 36%, and decrease healing received by 20%.",
    "r3": "I ♥ Shichi-kun!",
    "r3_detail": "Increase the skill levels of Woof Woof Blaze and Thief Tactics by 3.",
    "r4": "Welcome to Shibuya!",
    "r4_detail": "Highlight Enhanced: Increase number of Enthusiastic Fuse stacks inflicted on foes to 4, and increase the maximum number of stacks to 4.",
    "r5": "I ♥ Shibuya!",
    "r5_detail": "Increase the skill levels of Welcome Hug and Furrious Bark by 3.",
    "r6": "Station Square Superstar",
    "r6_detail": "At the start of battle, gain Big Welcome and Furrocious Follow-Up for 2 turns.\nExtend the duration of debuffs from Welcome Hug, Furrious Bark, and Woof Woof Blaze by 1 turn.\nWhen Big Welcome and Furrocious Follow-Up are both active, increase Woof Woof Blaze's Fire, Ice, Electric, and Wind damage taken effect on all foes by 30%, increase the Resonance damage taken effect on the main target by 60%, and the effects granted by Big Welcome and Furrocious Follow-Up will both activate (the damage taken increase effects do not stack, and the greater effect is applied)."
  },
  "weapons": {
    "weapon5-1": {
      "name": "Cerberus Claws",
      "health": 2140.53,
      "attack": 700.3,
      "defense": 431.6,
      "skill_name": "",
      "description": "Increase ailment accuracy by 36.0%/36.0%/47.0%/47.0%/58.0%/58.0%/69.0%.\nWhen an ally uses a Fire, Ice, Electric or Wind skill or activates a Resonance, increase Runa's ailment accuracy by 23.0%/28.0%/28.0%/33.0%/33.0%/38.0%/38.0% for 2 turns. This effect does not stack.\nWhen using Woof Woof Blaze and activating the effect of Big Welcome, decrease the target's Defense by 16.6%/21.6%/21.6%/26.6%/26.6%/31.6%/31.6% more for 3 turns. When the effect of Furrocious Follow-Up is activated, decrease the target's Defense by 33.3%/43.3%/43.3%/53.3%/53.3%/63.3%/63.3% more for 3 turns. These 2 debuffs do not stack."
    },
    "weapon4-1": {
      "name": "Hunting Hound Claws",
      "health": 1712.28,
      "attack": 560.39,
      "defense": 345.66,
      "skill_name": "",
      "description": "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%. When Big Welcome or Furrocious Follow-Up is active, increase Runa's ailment accuracy by 22.0%/28.5%/28.5%/35.0%/35.0%/41.5%/41.5%."
    }
  },
  "skills": {
    "skill1": {
      "name": "Welcome Hug",
      "element": "화염광역",
      "type": "디버프",
      "sp": 22,
      "cool": 0,
      "description": "Deal Fire damage to all foes equal to 73.2%/80.7%/77.7%/85.2% of Attack.\nDecrease target's Defense by 15.4% of Runa's ailment accuracy for 2 turns (up to 26.4%/29.1%/28.0%/30.7%). Also, when the target of this effect takes Fire, Ice, Electric, or Wind skill damage, decrease Defense by 26.4%/26.4%/28.0%/28.0% more. The Defense decrease effects from this skill and Furrious Bark do not stack.\nAlso, 50% chance to inflict Burn on the target, and gain Big Welcome for 2 turns."
    },
    "skill2": {
      "name": "Furrious Bark",
      "element": "화염",
      "type": "디버프",
      "sp": 22,
      "cool": 0,
      "description": "Deal Fire damage to 1 foe equal to 170.8%/188.3%/181.3%/198.8% of Attack.\nDecrease target's Defense by 14.6%/14.6%/15.5%/15.5% + 31.4% of Runa's ailment accuracy (up to 53.7%/59.2%/57.0%/62.5%) for 2 turns. The Defense decrease effects from this skill and Welcome Hug do not stack.\nAlso, gain Furrocious Follow-Up for 2 turns."
    },
    "skill3": {
      "name": "Woof Woof Blaze",
      "element": "화염광역",
      "type": "디버프",
      "sp": 26,
      "cool": 0,
      "description": "Usable when Big Welcome or Furrocious Follow-Up are active, and activates various effects based on which is active. If both effects are active at the same time, prioritize Big Welcome.\nRemove Big Welcome and Furrocious Follow-Up after effect activates.\nBig Welcome: Deal Fire damage to all foes equal to 109.8%/109.8%/116.6%/116.6% of Attack. This skill's damage is counted as a Resonance.\nIncrease target's damage taken by 24% of Runa's ailment accuracy (up to 41.0%/45.2%/43.5%/47.7%), and Fire, Ice, Electric and Wind damage taken by 20.5%/22.6%/21.8%/23.9% for 2 turns.\nFurrocious Follow-Up: Deal Fire damage to 1 foe equal to 219.6%/219.6%/233.1%/233.1% of Attack. This skill's damage is counted as a Resonance.\nIncrease target's damage taken by 34.3% of Runa's ailment accuracy (up to 58.6%/64.6%/62.2%/68.2%), and Resonance damage taken by 39.0%/43.0%/41.4%/45.4% for 2 turns."
    },
    "passive1": {
      "name": "Peppy Guard Dog",
      "element": "패시브",
      "cool": 0,
      "description": "During battle, increase Runa's Attack by 60.0% of her ailment accuracy."
    },
    "passive2": {
      "name": "Faithful Dog",
      "element": "패시브",
      "cool": 0,
      "description": "When Runa inflicts a debuff on a foe with a skill, increase her Attack by 33.0% for 1 turn. When an ally deals Fire, Ice, Electric or Wind damage or Resonance damage, grant them the same Attack increase effect."
    },
    "skill_highlight": {
      "element": "화염광역",
      "type": "디버프",
      "cool": 4,
      "description": "Deal Fire damage to all foes equal to 214.7%/236.7%/227.9%/249.9% of Attack.\nPermanently inflict 2 Enthusiastic Fuse stacks on foes. Stacks up to 2 times (remove as wave progresses).\nEnthusiastic Fuse: When any foe takes Fire, Ice, Electric, or Wind skill damage or Resonance damage, spend 1 Enthusiastic Fuse stack, and increase the damage by 22.9% of Runa's ailment accuracy (up to 53.7%/59.2%/57.0%/62.5%). If Runa's skills and Resonance activate this effect, Enthusiastic Fuse will not be spent."
    },
    "name": "Runa Dogenzaka"
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
