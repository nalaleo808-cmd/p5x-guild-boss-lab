// Reviewed 2026-09-12. Full source snapshot: data/character-research/yukari.json.
// Coverage is partial. Source descriptions are evidence, never executable effects.
export const characterResearch = {
  "slug": "yukari",
  "name": "Yukari Takeba",
  "coverage": "partial: researched source; legacy engine methods integrated, weapon effects excluded",
  "sources": [
    {
      "url": "https://lufel.net/en/character/yukari/",
      "kind": "client-rendered-character-page",
      "accessedAt": "2026-09-12"
    },
    {
      "file": "skill.js",
      "url": "https://lufel.net/data/characters/%EC%9C%A0%EC%B9%B4%EB%A6%AC/skill.js",
      "sha256": "aeec6a2d7fb3130056a92fd70b93dd8fafb6e546f998968b5b26adbb374cd971",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "ritual.js",
      "url": "https://lufel.net/data/characters/%EC%9C%A0%EC%B9%B4%EB%A6%AC/ritual.js",
      "sha256": "2affb7ab17d975603d2ef53b006a3b99fa5422f7543b921ad2477cf59d44a132",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "weapon.js",
      "url": "https://lufel.net/data/characters/%EC%9C%A0%EC%B9%B4%EB%A6%AC/weapon.js",
      "sha256": "53256534b76f027bcf9fe92c0d2faf9a5aab3ce762d319fc75cabc5b4d371d69",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    }
  ],
  "implemented": [
    "Legacy engine methods mixed into BattleEngine: isYukari, applyYukariErosion, triggerYukariErosionSupport."
  ],
  "weaponEffects": "Excluded: source weapon rules are evidence only and do not create selectable loadout options or runtime effects.",
  "missing": [
    "Weapon Attack does not resample mechanicAttack or Archer HP; provide equipped Attack through existing loadout for support scaling.",
    "Signature Erosion healing bonus requires heal event with trigger context; Arrow damage stacks require pre-spend resource snapshot and timed party buff.",
    "Four-star Arrow HP Recovery requires cast-specific healing multiplier; Theurgy/Assist/reserve return and A6 Theurgy triggers remain unavailable."
  ],
  "limitations": [
    "Existing kit is only partially modeled. Extracted methods preserve existing approximations; extraction does not verify them.",
    "No optional weapon is selected by default. Refinement indexes 0-6 use the seven published entries. Weapon base item HP/Attack/Defense are not added.",
    "Static weapon effects are skipped for equipped stat totals unless explicitly declared excluded. Attack buffs affect outgoing damage; mechanicAttack/support scaling and base-stat Desire are not recomputed.",
    "Weapon Attack does not resample mechanicAttack or Archer HP; provide equipped Attack through existing loadout for support scaling.",
    "Signature Erosion healing bonus requires heal event with trigger context; Arrow damage stacks require pre-spend resource snapshot and timed party buff.",
    "Four-star Arrow HP Recovery requires cast-specific healing multiplier; Theurgy/Assist/reserve return and A6 Theurgy triggers remain unavailable."
  ],
  "engineOwned": [
    "constructor/grantTheurgyGauge own gauge and reserves; initializeCharacterPassives owns HP and party Highlight passive.",
    "applyYukariErosion/triggerYukariErosionSupport own unique Erosion and healing gate; defeat handler transfers Erosion.",
    "resolveSkill owns Tailwind, Arrow healing, Whisperwind spending and next-Highlight amplification."
  ],
  "integration": {
    "removeEngineMethods": [
      "isYukari",
      "applyYukariErosion",
      "triggerYukariErosionSupport"
    ],
    "mixIn": "Object.assign(BattleEngine.prototype, yukariLegacyMethods) before any engine construction; import legacyMethods under that alias. Remove named class definitions in the same change.",
    "dependencies": [
      "usesLiveMechanics",
      "applyEnemyStatus",
      "emit",
      "healUnit"
    ],
    "hooks": [
      "initialize applies outgoing Attack only, explicitly excluding stale mechanicAttack-based support scaling.",
      "Add beforeWhisperwindSpend/afterHealing with origin, target and consumed count. Do not reconstruct spent stacks from afterSkill after engine zeroes them."
    ],
    "legacyPolicy": "Exact existing bodies, including incomplete rules and archived-profile behavior. Do not also call these methods from generic lifecycle hooks. Tangled resolver branches remain at original call sites."
  },
  "comparison": {
    "liveGeneratedAt": "2026-08-28T23:07:36.661Z",
    "skillChanges": [],
    "catalogGeneratedAt": "2026-09-12T21:05:39.231Z",
    "catalogId": "lufel-recent-yukari",
    "catalogSkills": [
      {
        "name": "Gale Burst",
        "power": 2.329,
        "slot": "S1"
      },
      {
        "name": "Tailwind's Breath",
        "power": 0,
        "buff": {
          "id": "damage_up",
          "name": "DMG ↑",
          "stat": "damage",
          "value": 0.0024,
          "duration": 3
        },
        "slot": "S2"
      },
      {
        "name": "Arrow of Life",
        "power": 0,
        "buff": {
          "id": "attack_up",
          "name": "ATK ↑",
          "stat": "attack",
          "value": 0.341,
          "duration": 2
        },
        "slot": "S3"
      },
      {
        "name": "Assist",
        "power": 0,
        "slot": "S4"
      }
    ]
  },
  "reviewNotes": [
    "Catalog Tailwind damage .0024 is a per-100-Attack step; engine correctly overrides it. Catalog Arrow Attack applies after Theurgy, not immediately."
  ],
  "awarenessRules": [
    {
      "level": 0,
      "name": "Unforgettable Feeling",
      "description": "Yukari can inflict Erosion on foes.\nWhen other allies deal skill damage to a foe inflicted with Erosion, restore HP to all allies equal to 24.5% of Yukari's Attack + 800/1600/2400 (effect changes at Lv. 1/50/70, respectively), and gain 1 Whisperwind stack (stacks up to 2 times). This effect can only activate once between the start of Yukari's turn and the start of her next turn.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 1,
      "name": "Pull the Trigger",
      "description": "At the start of battle, gain up to the maximum number of Whisperwind stacks, and fill Theurgy gauge by 70. If the Theurgy gauge is increased above the maximum on the first turn, up to 35 above the maximum can be reserved.\nAlso, when using a skill on an ally, increase the main target's pierce rate by 20% more for 2 turns. If using Tailwind's Breath, restore 1200 more HP to all allies, and restore 30% more HP to the main target.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 2,
      "name": "Sign of the Lovers",
      "description": "When activating a Theurgy, nullify spiritual ailments on Yukari, and also increase party's critical damage by 30%. Lasts for 2 turns.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 3,
      "name": "Girl Clad in Pink",
      "description": "Increase the skill levels of Gale Burst and Arrow of Life by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 4,
      "name": "Healing Mastery",
      "description": "When using a Theurgy, also restore HP to the ally with the lowest HP by 5% of Yukari's Attack + 500, and also increase party's damage by 10% for 2 turns.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 5,
      "name": "Pursuit of Doubt",
      "description": "Increase the skill levels of Tailwind's Breath and Combat Tactics by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 6,
      "name": "Spring Day's Meeting",
      "description": "Double the Theurgy gauge increase from Arrow of Life.\nAlso, when an ally uses a Theurgy, increase critical damage by 30% for 2 turns.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    }
  ],
  "weaponRules": {
    "four-star": {
      "stat": "attack",
      "values": [
        0.12,
        0.12,
        0.16,
        0.16,
        0.2,
        0.2,
        0.24
      ]
    },
    "signature": {
      "stat": "attack",
      "values": [
        0.3,
        0.3,
        0.39,
        0.39,
        0.48,
        0.48,
        0.57
      ]
    }
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
