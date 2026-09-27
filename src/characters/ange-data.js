// Reviewed public snapshot: 2026-09-12. Full provenance in data/character-research/ange.json.
export const characterResearch = {
  "slug": "ange",
  "name": "Manaka Nagao",
  "coverage": "source-verified-active-kit",
  "limitations": [
    "Not battle-replay calibrated. Disabled actions must be filtered by parent before spending cost or ammo.",
    "Source tiers explicitly ordered [10,10+5,13,13+5], selected by loadout characterResearch.sourceTier; default 3 follows Cosmic Yui. Skill-level awareness is not multiplied again.",
    "Static weapon passives use the selected refinement; equipped stats must set staticWeaponStatsIncluded to avoid double counting.",
    "English action-end timing is used for normal Musical Note gain; KR/CN text places the gain at turn start.",
    "Da Capo targets the currently acting ally, matching its before-action battle timing. Theurgy remains unavailable engine-wide, so A4 currently observes Highlights only.",
    "Automatic healing intentionally excludes the selected-cast cleanse and 50% bonus."
  ],
  "sources": [
    {
      "url": "https://lufel.net/en/character/ange/",
      "retrievedAt": "2026-09-12",
      "type": "community-game-data"
    },
    {
      "file": "skill.js",
      "url": "https://lufel.net/data/characters/%EB%A7%88%EB%82%98%EC%B9%B4/skill.js",
      "sha256": "d7ea4a26a13ebdb0870c868b590fa6411542821e2bc78ca34121bcfa7b65d04c",
      "retrievedAt": "2026-09-12",
      "httpStatus": 200
    },
    {
      "file": "ritual.js",
      "url": "https://lufel.net/data/characters/%EB%A7%88%EB%82%98%EC%B9%B4/ritual.js",
      "sha256": "101514f67f2368a13bfed511e012974bd1be08a589e25d9e35085a63cf7fd2cd",
      "retrievedAt": "2026-09-12",
      "httpStatus": 200
    },
    {
      "file": "weapon.js",
      "url": "https://lufel.net/data/characters/%EB%A7%88%EB%82%98%EC%B9%B4/weapon.js",
      "sha256": "1a90f325ed60eb3ddf01975ef036877562cd4708a46d703cc8eb3ab5afc53ae1",
      "retrievedAt": "2026-09-12",
      "httpStatus": 200
    }
  ],
  "implemented": [
    "Manual S1 damage scaling and four notes; S3 flat Attack plus note-based Attack/pierce, A1 critical rate",
    "Manual S2 50% healing, cleanse and sourced Musical Note cooldown reduction; automatic healing at each 12 actual notes gained",
    "Capped note ledger, lifetime pierce, A1/A4 opening notes and A1 opening cooldowns",
    "Navigator before/after hooks, including selectable-action cooldown preparation",
    "Static and supported dynamic weapon effects at refinement 0-6",
    "Da Capo battle action, pre-action state snapshot, rewind, special extra action and one-time Wonder recharge",
    "Action-end Musical Notes, A4 Highlight notes, A2 revival, Crescendo/A2 Da Capo bonuses and 20% core-stat sharing"
  ],
  "missing": [
    "A4 Theurgy note gain awaits the shared Theurgy activation system."
  ],
  "comparison": {
    "liveSnapshot": "data/lufel-live-recent.json",
    "englishSkillsExactlyMatch": true,
    "catalog": "data/lufel-catalog.json",
    "existingBespokeEngineLogic": false,
    "corrections": [
      "Manual S1 damage scaling and four notes; S3 flat Attack plus note-based Attack/pierce, A1 critical rate",
      "Manual S2 50% healing bonus and one debuff cleanse; automatic healing at each 12 actual notes gained",
      "Capped note ledger, lifetime pierce, A1/A4 opening notes and A1 opening cooldowns",
      "Explicit gainMusicalNotes helper for future verified timing dispatcher",
      "Opt-in static weapon stat at refinement 0-6"
    ]
  },
  "integration": {
    "initialize": "After live unit loadouts and party construction; once per unit. Ange uses state.navigator.",
    "beforeSkill": "Before SP/HP/ammo changes and before cloning damageSkill. Return value must replace skill.",
    "afterSkill": "Once per successful outer cast after damage, using prepared skill; never for unrelated source types.",
    "onTurnEnd": "After all counted actions of owner turn, before next turn starts. Howler stance clock only.",
    "navigator": "Navigator skills use before/after hooks. Da Capo is an independent battle action that snapshots the current ally and requests its special extra action from the shared scheduler."
  },
  "awareness": {
    "name": "Manaka Nagao",
    "r0": "Andante",
    "r0_detail": "On each ally's action, gain 1 Musical Note stack, up to a maximum of 12 stacks.\nBefore any ally's action, Manaka can activate Da Capo (the initial use count in each battle is 1). After activating Da Capo, when Wonder takes 7 actions other than additional actions, restore the use count by 1 (this effect activates only 1 time per battle).\nDa Capo: Remove 1 debuff effect from 1 ally. At the end of the target's next action, grant a special additional action. When entering this state, the target's HP, SP, buff/debuff effects, and skill cooldowns are reset to their state at the start of the previous action.",
    "r1": "Allegro",
    "r1_detail": "At the start of battle, gain the maximum number of Musical Note stacks, and reduce the first cooldown time by 4 actions.\nAlso, when using Melody of Steps, also increase party's critical rate by 12% for 2 turns.",
    "r2": "Fortissimo",
    "r2_detail": "Increase final damage amplification of allies with extra actions from Da Capo by 12%.\nWhen an ally is KO'd, restore their HP equal to 20% of Manaka's Attack + 2000. This effect can be activated once per battle.",
    "r3": "Vibrato",
    "r3_detail": "Increase the skill levels of Prayer Refrain and Melody of Steps by 3.",
    "r4": "Symphonia",
    "r4_detail": "At the start of battle, or when an ally activates a Highlight or Theurgy, gain 2 Musical Note stacks. Stacks gained from this effect can exceed the maximum limit up to 2 times.",
    "r5": "Molto Vivace",
    "r5_detail": "Increase the skill level of Winged Canon by 3.",
    "r6": "Con Anima",
    "r6_detail": "Increase the initial use count of Da Capo by 1."
  },
  "weapons": {
    "name": "Manaka Nagao",
    "weapon4-1": {
      "name": "Divine Muse",
      "health": 1776.03,
      "attack": 607.79,
      "defense": 317.1,
      "skill_name": "Luminous Glaze",
      "description": "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%.\nAfter using a skill, permanently increase Manaka's Attack by 11.0%/14.5%/14.5%/18.0%/18.0%/21.5%/21.5%. Stacks up to 2 times."
    },
    "weapon5-1": {
      "name": "Angel's Hymn",
      "health": 2219.84,
      "attack": 759.73,
      "defense": 396.41,
      "skill_name": "Divine Radiance",
      "description": "Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%.\nFor each Musical Note gained, grant 1 Angelic Chorus stack to all allies.\nAngelic Chorus: Permanently increase damage by 0.7%/0.9%/0.9%/1.1%/1.1%/1.3%/1.3%. Stacks up to 12 times. At 12 stacks, increase critical damage by 15.3%/19.9%/19.9%/24.5%/24.5%/29.1%/29.1%."
    }
  },
  "skills": {
    "name": "Manaka Nagao",
    "skill1": {
      "name": "Winged Canon",
      "element": "버프광역",
      "type": "버프",
      "cool": 0,
      "description": "Increase party's damage by 7.0%/7.7%/7.8%/8.5% for 2 turns (for every 164 points of Manaka's Attack, increase by 1% more, up to a maximum of 28.0%/30.8%/31.4%/34.2%).\nAlso, gain 4 Musical Note stacks.\nCooldown Time: 4 ally actions"
    },
    "skill2": {
      "name": "Prayer Refrain",
      "element": "치료광역",
      "type": "치료",
      "cool": 0,
      "description": "Restore HP to party equal to 10.0%/10.0%/11.2%/11.2% of Manaka's Attack + 681/816/989/1124, and remove 1 debuff.\nWhen Manaka has Musical Note, spend 1 Musical Note stack, and reduce skill cooldown by 1 action. (this effect can reduce cooldowns by up to 4 actions).\nIf this skill is selected and used, increase healing by 50%.\nCooldown Time: 8 ally actions\nAutomatic Effect: For every 12 Musical Note stacks gained during battle, activate this skill's healing effect 1 time."
    },
    "skill3": {
      "name": "Melody of Steps",
      "element": "버프광역",
      "type": "버프",
      "cool": 0,
      "description": "Increase party's Attack by 11% of Manaka's Attack + 128/140/143/156 for 2 turns.\nSpend all Musical Note stacks, and for each stack spent, increase party's pierce rate by 0.1% for every 460 points of Manaka's Attack, and increase party's Attack by 0.1% for every 460 points of Manaka's Attack. Lasts for 2 turns.\nThis skill applies up to 4600/5060/5980/6440 of Manaka's Attack.\nCooldown Time: 4 ally actions"
    },
    "skill_highlight": {
      "name": "Stat Buff",
      "element": "패시브",
      "description": "Increase party's stats by 20% of Manaka's stats."
    },
    "passive1": {
      "name": "Crescendo",
      "element": "패시브",
      "description": "Increase Attack of allies with Da Capo by 37.5%.",
      "cool": 0
    },
    "passive2": {
      "name": "Heavenly Voice",
      "element": "패시브",
      "description": "Based on the total number of Musical Note stacks gained, increase party's pierce rate by 1.0% for each stack. Counts up to 12 stacks.",
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
