// Reviewed 2026-09-12. Full source snapshot: data/character-research/akihiko.json.
// Core kit and weapon effects are source-modeled; explicit boundaries remain below.
export const characterResearch = {
  "slug": "akihiko",
  "name": "Akihiko Sanada",
  "coverage": "source-verified core kit and weapons; legacy resolver integration",
  "sources": [
    {
      "url": "https://lufel.net/en/character/akihiko/",
      "kind": "client-rendered-character-page",
      "accessedAt": "2026-09-12"
    },
    {
      "file": "skill.js",
      "url": "https://lufel.net/data/characters/%EC%82%AC%EB%82%98%EB%8B%A4/skill.js",
      "sha256": "f0328ed9307393c3b479d3cbb774f7ac776fd29fcb3d92855024d935a86a9021",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "ritual.js",
      "url": "https://lufel.net/data/characters/%EC%82%AC%EB%82%98%EB%8B%A4/ritual.js",
      "sha256": "b21f83217faf3d8ecac3c444ae49efd58760fe02b197d28f62a65f36a6f431f5",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "weapon.js",
      "url": "https://lufel.net/data/characters/%EC%82%AC%EB%82%98%EB%8B%A4/weapon.js",
      "sha256": "077737ecfb057fcbccd0e3a74cae7cb10077dac61b50efb61ce154e7f67b3fb4",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    }
  ],
  "implemented": [
    "Legacy resource methods plus engine-owned Grit, Mettle, Flash Blow, Lightning Fist, Finishing Blow, downed bonuses and Rough Combo.",
    "Four-star static and two-Grit conditional Attack at refinement 0-6.",
    "Sabazios static critical damage, Mettle-trigger critical-rate stacks, and per-hit critical damage amplification at refinement 0-6."
  ],
  "weaponEffects": "Selectable from the researched mechanics loadout controls; no weapon remains the default.",
  "missing": [
    "A1 Grit critical bonus duration/stacking is unspecified. Theurgy and Assist remain unavailable until the shared activation system is implemented."
  ],
  "limitations": [
    "Existing kit is only partially modeled. Extracted methods preserve existing approximations; extraction does not verify them.",
    "No optional weapon is selected by default. Refinement indexes 0-6 use the seven published entries. Weapon base item HP/Attack/Defense are not added.",
    "Static weapon effects are skipped for equipped stat totals unless explicitly declared excluded. Attack buffs affect outgoing damage; mechanicAttack/support scaling and base-stat Desire are not recomputed.",
    "A1 Grit critical bonus duration/stacking is unspecified. Theurgy and Assist remain unavailable until the shared activation system is implemented."
  ],
  "engineOwned": [
    "gainAkihikoGrit/gainAkihikoMettle and constructor own resource caps/opening values; stepAkihikoFlash owns free Resonance.",
    "resolveSkill owns Grit-scaled Lightning Fist, A6 Finishing Blow and critical Rough Combo; damage resolver owns downed bonuses."
  ],
  "integration": {
    "removeEngineMethods": [
      "isAkihiko",
      "gainAkihikoGrit",
      "gainAkihikoMettle"
    ],
    "mixIn": "Object.assign(BattleEngine.prototype, akihikoLegacyMethods) before any engine construction; import legacyMethods under that alias. Remove named class definitions in the same change.",
    "dependencies": [
      "usesLiveMechanics",
      "emit"
    ],
    "hooks": [
      "initialize applies selected static weapon stats and opening Sabazios stacks while preserving engine-owned Grit/Mettle.",
      "afterMettleGain refreshes Sabazios critical stacks; beforeDamage applies Wicked Cestus Attack; criticalHitDamageMultiplier runs after the per-hit critical result."
    ],
    "legacyPolicy": "Exact existing bodies, including incomplete rules and archived-profile behavior. Do not also call these methods from generic lifecycle hooks. Tangled resolver branches remain at original call sites."
  },
  "comparison": {
    "liveGeneratedAt": "2026-08-28T23:07:36.661Z",
    "skillChanges": [],
    "catalogGeneratedAt": "2026-09-12T21:05:39.231Z",
    "catalogId": "lufel-recent-akihiko",
    "catalogSkills": [
      {
        "name": "Blitzkrieg",
        "power": 1.429,
        "slot": "S1"
      },
      {
        "name": "Spark Impact",
        "power": 1.072,
        "slot": "S2"
      },
      {
        "name": "Lightning Fist",
        "power": 1.588,
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
    "Raw skill_highlight is Theurgy, not shared Highlight. Keep it unavailable until Theurgy activation exists."
  ],
  "awarenessRules": [
    {
      "level": 0,
      "name": "Reason to Fight",
      "description": "At the start of battle, gain 2 Mettle stacks. Also, when dealing Electric damage with a skill or Theurgy, gain 1 Mettle stack. Stacks up to 12 times.\nAt the start of Sanada's turn, he can spend 6 Mettle stacks to activate Flash Blow 1 time.\nFlash Blow: Deal Physical damage to all foes equal to 55.9% of Attack, and increase downed foes' damage taken by 8% for 1 turn. This skill is counted as a Resonance. Also, gain 1 Grit stack.\nGrit: Increase pierce rate by 4%. Stacks up to 3 times.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 1,
      "name": "Boxing Team Captain",
      "description": "At the start of battle, increase the Theurgy gauge by 70.\nWhen gaining Grit stacks, increase critical rate by 20%.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 2,
      "name": "Guardian Fist",
      "description": "When dealing damage to downed foes, increase Down Bonus by 10%.\nAfter spending Mettle stacks to activate Flash Blow, increase Sanada's damage by 30% for 3 turns.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 3,
      "name": "Stoic Heart",
      "description": "Increase the skill levels of Spark Impact and Lightning Fist by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 4,
      "name": "Results of Training",
      "description": "When activating a Theurgy, increase critical damage by 50% (between a minimum of 300% and maximum of 400%).",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 5,
      "name": "Buried Emotions",
      "description": "Increase the skill levels of Blitzkrieg and Combat Tactics by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 6,
      "name": "Striving for Power",
      "description": "At the start of battle, gain 6 Mettle stacks. The maximum number of Mettle stacks is increased to 18. Also, for each Grit stack gained, increase Sanada's damage by 8%. The maximum number of Grit stacks is increased to 4.\nWhen spending Grit to use Lightning Fist, also activate Finishing Blow 1 time.\nFinishing Blow: Based on the number of Grit stacks spent during Sanada's turn, deal Electric damage to all foes equal to 13.5% of Attack for each stack, with Ignore Defense. This skill is counted as a Resonance, and is guaranteed to activate a critical. Also, gain 1 Grit stack.",
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
      "stat": "critDamage",
      "values": [
        0.363,
        0.363,
        0.472,
        0.472,
        0.581,
        0.581,
        0.69
      ]
    }
  },
  "configuration": {
    "path": "config.loadouts[unit.id].characterResearch (characterWeapon is also accepted)",
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
