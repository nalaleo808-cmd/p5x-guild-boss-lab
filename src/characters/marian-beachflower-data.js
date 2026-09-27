// Reviewed 2026-09-12. Full source snapshot: data/character-research/marian-beachflower.json.
// Coverage is partial. Source descriptions are evidence, never executable effects.
export const characterResearch = {
  "slug": "marian-beachflower",
  "name": "Beachflower Minami",
  "coverage": "partial: researched source; legacy engine methods integrated, weapon effects excluded",
  "sources": [
    {
      "url": "https://lufel.net/en/character/marian-beachflower/",
      "kind": "client-rendered-character-page",
      "accessedAt": "2026-09-12"
    },
    {
      "file": "skill.js",
      "url": "https://lufel.net/data/characters/%EB%AF%B8%EB%82%98%EB%AF%B8%C2%B7%EC%97%AC%EB%A6%84/skill.js",
      "sha256": "e33398bacf6cc748c4600e2c06920e9fb009f232a3e92359ac1b0794961a8b1d",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "ritual.js",
      "url": "https://lufel.net/data/characters/%EB%AF%B8%EB%82%98%EB%AF%B8%C2%B7%EC%97%AC%EB%A6%84/ritual.js",
      "sha256": "c716ac15ae9fa458f1522b0cdb7a939520d479f1f7eeb91185efb89e777767a7",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "weapon.js",
      "url": "https://lufel.net/data/characters/%EB%AF%B8%EB%82%98%EB%AF%B8%C2%B7%EC%97%AC%EB%A6%84/weapon.js",
      "sha256": "c5282e6204249e39520fc2578735ff82ce3112c092f9940e9845de574159affe",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    }
  ],
  "implemented": [
    "Legacy engine methods mixed into BattleEngine: isMarian, marian, marianScalingCriticalMultiplier, applyMarianHighlightEffect."
  ],
  "weaponEffects": "Excluded: source weapon rules are evidence only and do not create selectable loadout options or runtime effects.",
  "missing": [
    "Signature medicine-target critical damage needs an afterMedicine hook; Summer Garden main-target selection remains unresolved.",
    "Four-star max HP changes require stat construction integration; four-star on-ally-skill critical multiplier has unspecified duration/stacking.",
    "Medicine observed 1.58 multiplier is unresolved. Weapon enablement is not a retrospective fit."
  ],
  "limitations": [
    "Existing kit is only partially modeled. Extracted methods preserve existing approximations; extraction does not verify them.",
    "No optional weapon is selected by default. Refinement indexes 0-6 use the seven published entries. Weapon base item HP/Attack/Defense are not added.",
    "Static weapon effects are skipped for equipped stat totals unless explicitly declared excluded. Attack buffs affect outgoing damage; mechanicAttack/support scaling and base-stat Desire are not recomputed.",
    "Signature medicine-target critical damage needs an afterMedicine hook; Summer Garden main-target selection remains unresolved.",
    "Four-star max HP changes require stat construction integration; four-star on-ally-skill critical multiplier has unspecified duration/stacking.",
    "Medicine observed 1.58 multiplier is unresolved. Weapon enablement is not a retrospective fit."
  ],
  "engineOwned": [
    "medicineAction/applyMedicineEffects/stepMedicine own medicine magnitude, healing, inventory and Pharmacy action budget.",
    "initializeCharacterPassives owns party Attack and A1 medicine bonus; resolveSkill and applyMarianHighlightEffect own HP/critical scaling, Blessings, debuffs and prescriptions."
  ],
  "integration": {
    "removeEngineMethods": [
      "isMarian",
      "marian",
      "marianScalingCriticalMultiplier",
      "applyMarianHighlightEffect"
    ],
    "mixIn": "Object.assign(BattleEngine.prototype, marian_beachflowerLegacyMethods) before any engine construction; import legacyMethods under that alias. Remove named class definitions in the same change.",
    "dependencies": [
      "usesLiveMechanics",
      "allyTargetsForSkill",
      "applyUnitBuff"
    ],
    "hooks": [
      "initialize after initializeCharacterPassives, which assigns medicineEffectBonus.",
      "afterSkill with character_skill Gentle Sea Breeze or highlight: resolve targetId to a living other party unit; apply equipment Attack for 2 shared-round turns.",
      "For remaining signature effect, call afterMedicine only after actual item resolution and use selected main target. Do not invoke through normal skill hooks."
    ],
    "legacyPolicy": "Exact existing bodies, including incomplete rules and archived-profile behavior. Do not also call these methods from generic lifecycle hooks. Tangled resolver branches remain at original call sites."
  },
  "comparison": {
    "liveGeneratedAt": "2026-08-28T23:07:36.661Z",
    "skillChanges": [],
    "catalogGeneratedAt": "2026-09-12T21:05:39.231Z",
    "catalogId": "lufel-recent-marian-beachflower",
    "catalogSkills": [
      {
        "name": "Beach Basket",
        "power": 0.75,
        "slot": "S1"
      },
      {
        "name": "Summer Garden",
        "power": 0,
        "buff": {
          "id": "damage_up",
          "name": "DMG ↑",
          "stat": "damage",
          "value": 0.091,
          "duration": 3
        },
        "slot": "S2"
      },
      {
        "name": "Gentle Sea Breeze",
        "power": 0,
        "buff": {
          "id": "crit_rate_up",
          "name": "CRIT RATE ↑",
          "stat": "critRate",
          "value": 0.182,
          "duration": 3
        },
        "slot": "S3"
      }
    ]
  },
  "reviewNotes": [
    "HP-scaled Beach Basket and capped critical sharing must retain engine override rather than generic catalog Attack scaling.",
    "Added timed weapon buff uses current shared round clock, including Surf extension; live timing unverified."
  ],
  "awarenessRules": [
    {
      "level": 0,
      "name": "Seaside First Aid",
      "description": "Beachflower Minami has 3 kinds of Everyday Medicine.\nWhen using medicine on allies, restore HP to the main target equal to 8% of Beachflower Minami's max HP.\nWhen using Gentle Sea Breeze, grant 1 Midsummer Prescription stack (stacks up to 1 time). At the start of Beachflower Minami's turn, she can spend 1 Midsummer Prescription stack to gain Flower Basket Pharmacy.\nFlower Basket Pharmacy: Use medicine without spending a turn, and extend the duration of Potent Medicine used by 1 turn. After using medicine 1 time, lose this effect.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 1,
      "name": "Summertime Cure-all",
      "description": "When using Gentle Sea Breeze, gain 1 more Midsummer Prescription stack. Midsummer Prescription now stacks up to 2 times (only 1 Midsummer Prescription stack can be used in a turn).\nIncrease the effects of medicine used by Beachflower Minami by 20%.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 2,
      "name": "Spellbinding Summer Scents",
      "description": "When using Beach Basket, inflict Perplexing Petals on the target.\nPerplexing Petals: Decrease the target's Defense by 30%, and increase critical damage taken by 30% for 3 turns.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 3,
      "name": "Relaxing Breeze",
      "description": "Increase the skill levels of Beach Basket and Gentle Sea Breeze by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 4,
      "name": "Lingering Ripples of Summer",
      "description": "Highlight Enhanced: Extend the duration of all buffs granted by Highlight to 3 turns. Also, when using medicine, increase medicine effects by 5%.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 5,
      "name": "White Flowers Swaying",
      "description": "Increase the skill levels of Summer Garden and Thief Tactics by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 6,
      "name": "Angel in White",
      "description": "When using any medicine, items are not spent upon use.\nExtend the duration of Potent Medicine effects by 1 turn. Also, when using medicine on allies with Flower Basket Pharmacy, also grant Summertime Refresh to the main target.\nSummertime Refresh: Increase final damage amplification by 15% for 1 turn.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    }
  ],
  "weaponRules": {
    "medicine": [
      0.2,
      0.2,
      0.26,
      0.26,
      0.32,
      0.32,
      0.38
    ],
    "allyAttack": [
      0.1,
      0.13,
      0.13,
      0.16,
      0.16,
      0.19,
      0.19
    ]
  },
  "configuration": {
    "path": "config.loadouts[unit.id].characterWeapon",
    "weapon": [
      "none",
      "four-star",
      "signature"
    ],
    "refinement": "integer 0..6 (default 0); invalid values throw",
    "staticWeaponStatsIncluded": "defaults true when unit.statsMode is equipped; otherwise false",
    "partyWeaponStatsIncluded": "MIKU only: suppress permanent party critical effect when already included in equipped party totals"
  }
};
export const weaponRules = characterResearch.weaponRules;
