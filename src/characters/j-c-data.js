// Reviewed 2026-09-12. Full source snapshot: data/character-research/j-c.json.
// Coverage is partial. Source descriptions are evidence, never executable effects.
export const characterResearch = {
  "slug": "j-c",
  "name": "Justine & Caroline",
  "coverage": "partial: researched source; legacy engine methods integrated, weapon effects excluded",
  "sources": [
    {
      "url": "https://lufel.net/en/character/j-c/",
      "kind": "client-rendered-character-page",
      "accessedAt": "2026-09-12"
    },
    {
      "file": "skill.js",
      "url": "https://lufel.net/data/characters/J%26C/skill.js",
      "sha256": "0a960d38b3d49cb5e28f1249d1ff67d0dc13cb568cd9dc6005c143f993c805f2",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "ritual.js",
      "url": "https://lufel.net/data/characters/J%26C/ritual.js",
      "sha256": "9fb482bec02869c8ada31a3b501a496d9eb70e10f9046ed1e9a9700e7cf6b60b",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "weapon.js",
      "url": "https://lufel.net/data/characters/J%26C/weapon.js",
      "sha256": "315a020db94b7e6f87329dfc2ccaff847673b039165da8b9b1ee79d3a744ea76",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    }
  ],
  "implemented": [
    "Legacy engine methods mixed into BattleEngine: isJc, grantJcFacade, applyJcFacadeAwareness."
  ],
  "weaponEffects": "Excluded: source weapon rules are evidence only and do not create selectable loadout options or runtime effects.",
  "missing": [
    "Signature Two Masks Desire increase and facade-gain party buffs require explicit gain callbacks; four-star post-Two-Masks Attack duration deferred.",
    "Optional Attack buff does not recalculate base-stat Desire. If weapon passive belongs in the source's base stats, provide already-equipped totals before constructor computes Desire.",
    "Rebel Surveillance stat list/sampling and A6 off-field Wonder ownership remain tied to existing user evidence."
  ],
  "limitations": [
    "Existing kit is only partially modeled. Extracted methods preserve existing approximations; extraction does not verify them.",
    "No optional weapon is selected by default. Refinement indexes 0-6 use the seven published entries. Weapon base item HP/Attack/Defense are not added.",
    "Static weapon effects are skipped for equipped stat totals unless explicitly declared excluded. Attack buffs affect outgoing damage; mechanicAttack/support scaling and base-stat Desire are not recomputed.",
    "Signature Two Masks Desire increase and facade-gain party buffs require explicit gain callbacks; four-star post-Two-Masks Attack duration deferred.",
    "Optional Attack buff does not recalculate base-stat Desire. If weapon passive belongs in the source's base stats, provide already-equipped totals before constructor computes Desire.",
    "Rebel Surveillance stat list/sampling and A6 off-field Wonder ownership remain tied to existing user evidence."
  ],
  "engineOwned": [
    "constructor computes base-stat Desire, roles and selected masks; initializeJcPassives owns pair passives.",
    "grantJcFacade/applyJcFacadeAwareness, applyJcMaskEffect/applyJcTwoMaskEffects/applyJcHighlightEffect own facade and pair rules.",
    "resolveJcAutoTwoMasks, True Desire action counters and shared Highlight nested-cast context own A1/A6 timing."
  ],
  "integration": {
    "removeEngineMethods": [
      "isJc",
      "grantJcFacade",
      "applyJcFacadeAwareness"
    ],
    "mixIn": "Object.assign(BattleEngine.prototype, j_cLegacyMethods) before any engine construction; import legacyMethods under that alias. Remove named class definitions in the same change.",
    "dependencies": [
      "emit",
      "applyUnitBuff"
    ],
    "hooks": [
      "initialize after existing passives: Attack buff only. Do not call grantJcFacade again.",
      "Extract grantJcFacade with event after successful acquisition, including opening facades and auto Two Masks; beforeSkill cannot infer gains from before/after stack count.",
      "Preserve True Desire's Wonder-action counter and recorded evidence; generic owner onActionEnd is not a substitute."
    ],
    "legacyPolicy": "Exact existing bodies, including incomplete rules and archived-profile behavior. Do not also call these methods from generic lifecycle hooks. Tangled resolver branches remain at original call sites."
  },
  "comparison": {
    "liveGeneratedAt": "2026-08-28T23:07:36.661Z",
    "skillChanges": [],
    "catalogGeneratedAt": "2026-09-12T21:05:39.231Z",
    "catalogId": "lufel-recent-j-c",
    "catalogSkills": [
      {
        "name": "Mask of Mischief & Innocence",
        "power": 0.867,
        "buff": {
          "id": "attack_up",
          "name": "ATK ↑",
          "stat": "attack",
          "value": 0.45399999999999996,
          "duration": 3
        },
        "slot": "S1"
      },
      {
        "name": "Mask of Service & Admonition",
        "power": 0.867,
        "slot": "S2"
      },
      {
        "name": "Mask of Absurdity & Nonsense",
        "power": 0.867,
        "slot": "S3"
      },
      {
        "name": "Mask of Luck & Loss",
        "power": 0.867,
        "buff": {
          "id": "crit_rate_up",
          "name": "CRIT RATE ↑",
          "stat": "critRate",
          "value": 0.057,
          "duration": 3
        },
        "slot": "S4"
      },
      {
        "name": "Two Masks as One",
        "power": 1.4769999999999999,
        "buff": {
          "id": "damage_up",
          "name": "DMG ↑",
          "stat": "damage",
          "value": 0.511,
          "duration": 2
        },
        "slot": "S5"
      }
    ]
  },
  "reviewNotes": [
    "Full raw source contains five skill choices, while catalog exposes selected mask configuration. Do not replace catalog skills with raw skill order."
  ],
  "awarenessRules": [
    {
      "level": 0,
      "name": "Twin Wardens",
      "description": "After obtaining Justine & Caroline, during battle, increase Wonder's skill and Thief Tactics levels by 1 (takes effect even when Justine & Caroline are not in battle).\nBefore entering battle, Justine & Caroline can select 2 of their 4 sets of Personas, and their Skill 1 and Skill 2 will change accordingly. During battle, Justine & Caroline will receive the following role effect based on the selected sets:\nMask of Mischief & Innocence + Mask of Service & Admonition: Medic\nMask of Mischief & Innocence + Mask of Absurdity & Nonsense: Strategist\nMask of Mischief & Innocence + Mask of Luck & Loss: Sweeper\nMask of Service & Admonition + Mask of Absurdity & Nonsense: Guardian\nMask of Service & Admonition + Mask of Luck & Loss: Saboteur\nMask of Absurdity & Nonsense + Mask of Luck & Loss: Assassin\nSkill effects are affected by Desire Level. At the start of battle, increase Desire Level by 25.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 1,
      "name": "Strict Tolerance",
      "description": "At the start of battle, depending on the selected Personas, gain 2 types of Facade.\nAt the start of Justine & Caroline's turn or end of their action, if they have 2 types of Facade, automatically activate Two Masks as One on a random target 1 time (prioritizing the target of the previous skill attack used).",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 2,
      "name": "Callous Kindness",
      "description": "When a Facade is gained, gain the following buff based on the type of Facade:\nFacade of Mischief & Innocence: Increase party's Attack by 30% for 2 turns.\nFacade of Service & Admonition: Decrease party's damage taken by 20% for 2 turns.\nFacade of Absurdity & Nonsense: Increase critical damage of the Assassin or Sweeper ally with the highest Attack by 20% for 2 turns.\nFacade of Luck & Loss: Increase Justine & Caroline's skill damage by 10% for 2 turns.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 3,
      "name": "Punitive Mercy",
      "description": "Increase the skill levels of Selected Skill 1 and Two Masks as One by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 4,
      "name": "Execution of Rebirth",
      "description": "When Justine & Caroline activate their Highlight, increase their Attack by 40%, damage dealt by 20%, and grant 50% of these effects to other allies for 2 turns.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 5,
      "name": "Humane Prison",
      "description": "Increase the skill levels of Selected Skill 2 and Thief Tactics by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 6,
      "name": "Power to Resist Ruin",
      "description": "When this Awareness is unlocked, during battle, increase Wonder's skill and Thief Tactics levels by 1 (takes effect even when Justine & Caroline are not in battle). Also, increase Desire Level by 20%.\nAt the start of battle, gain True Desire. Afterwards, regain True Desire every 8 actions if it has been spent.\nAt the start of Justine & Caroline's turn, they can spend 1 True Desire stack to enhance the next activated Two Masks as One.\nEnhanced effect: Activate all Facade effects for Two Masks as One. Also, deal bonus damage to the main target equal to 40% of Attack (8 hits. Increase this skill's effect by 1% for every 1 point of Desire Level. These bonus hits deal 1 hit of Fire, Ice, Electric, Wind, Psychokinesis, Nuclear, Bless, and Curse damage each.)",
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
