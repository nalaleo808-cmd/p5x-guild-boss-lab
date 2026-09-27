// Reviewed 2026-09-12. Full source snapshot: data/character-research/makoto.json.
// Coverage is partial. Source descriptions are evidence, never executable effects.
export const characterResearch = {
  "slug": "makoto",
  "name": "Makoto Yuki",
  "coverage": "partial: researched source; legacy engine methods integrated, weapon effects excluded",
  "sources": [
    {
      "url": "https://lufel.net/en/character/makoto/",
      "kind": "client-rendered-character-page",
      "accessedAt": "2026-09-12"
    },
    {
      "file": "skill.js",
      "url": "https://lufel.net/data/characters/%EC%9C%A0%ED%82%A4%20%EB%A7%88%EC%BD%94%ED%86%A0/skill.js",
      "sha256": "09430a94f3b43dc00cbb6dd00466e5bfdd16feebc39e9f80b5cc327315ca3d3c",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "ritual.js",
      "url": "https://lufel.net/data/characters/%EC%9C%A0%ED%82%A4%20%EB%A7%88%EC%BD%94%ED%86%A0/ritual.js",
      "sha256": "7e520bd841cd50f84815efc5f0d16c4ec525fb1aecb862585a22f2fdc2d2abdf",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "weapon.js",
      "url": "https://lufel.net/data/characters/%EC%9C%A0%ED%82%A4%20%EB%A7%88%EC%BD%94%ED%86%A0/weapon.js",
      "sha256": "737fe29e24826aecea63fa2b440571a56964c922be5283c0a6fcf90454cfb231",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    }
  ],
  "implemented": [
    "Legacy engine methods mixed into BattleEngine: isMakoto, gainMakotoMoonPhase, triggerMakotoEntrustedHope."
  ],
  "weaponEffects": "Excluded: source weapon rules are evidence only and do not create selectable loadout options or runtime effects.",
  "missing": [
    "Signature every-three phase gains needs cumulative actual resource-gain event, not net stacks after a cast.",
    "Signature four-hit damage needs final resolved hit list; A1 Melody extra hit coefficient is unstated.",
    "Four-star ally-buff party/self damage needs actual buff-grant event including A2 automatic Nocturne.",
    "Theurgy/Assist, Full Moon generation, A6 fatal-state ending boundary and recovery cancellation remain incomplete.",
    "Source Nocturne buffs last 2 turns; engine currently applies duration 3. Clock/grace must be audited before correction."
  ],
  "limitations": [
    "Existing kit is only partially modeled. Extracted methods preserve existing approximations; extraction does not verify them.",
    "No optional weapon is selected by default. Refinement indexes 0-6 use the seven published entries. Weapon base item HP/Attack/Defense are not added.",
    "Static weapon effects are skipped for equipped stat totals unless explicitly declared excluded. Attack buffs affect outgoing damage; mechanicAttack/support scaling and base-stat Desire are not recomputed.",
    "Signature every-three phase gains needs cumulative actual resource-gain event, not net stacks after a cast.",
    "Signature four-hit damage needs final resolved hit list; A1 Melody extra hit coefficient is unstated.",
    "Four-star ally-buff party/self damage needs actual buff-grant event including A2 automatic Nocturne.",
    "Theurgy/Assist, Full Moon generation, A6 fatal-state ending boundary and recovery cancellation remain incomplete.",
    "Source Nocturne buffs last 2 turns; engine currently applies duration 3. Clock/grace must be audited before correction."
  ],
  "engineOwned": [
    "gainMakotoMoonPhase/triggerMakotoEntrustedHope own phase gains and received-support gating; constructor owns Theurgy start.",
    "resolveSkill owns Melody hits, Nocturne, Scarlet stack spending and A2 autocast; existing damage hooks own Full Moon and four-stack modifiers."
  ],
  "integration": {
    "removeEngineMethods": [
      "isMakoto",
      "gainMakotoMoonPhase",
      "triggerMakotoEntrustedHope"
    ],
    "mixIn": "Object.assign(BattleEngine.prototype, makotoLegacyMethods) before any engine construction; import legacyMethods under that alias. Remove named class definitions in the same change.",
    "dependencies": [
      "usesLiveMechanics",
      "emit",
      "applyUnitBuff"
    ],
    "hooks": [
      "initialize only applies weapon Attack.",
      "Future onResourceGain for Moon Phase/Full Moon and finalized-cast-hit-count modifier; damage bonuses must attach to final expanded hit list.",
      "A6 survival requires preFatalDamage and verified turn-end boundary; onActionEnd is not a safe substitute."
    ],
    "legacyPolicy": "Exact existing bodies, including incomplete rules and archived-profile behavior. Do not also call these methods from generic lifecycle hooks. Tangled resolver branches remain at original call sites."
  },
  "comparison": {
    "liveGeneratedAt": "2026-08-28T23:07:36.661Z",
    "skillChanges": [],
    "catalogGeneratedAt": "2026-09-12T21:05:39.231Z",
    "catalogId": "lufel-recent-makoto",
    "catalogSkills": [
      {
        "name": "Melody of Flames",
        "power": 0.696,
        "slot": "S1"
      },
      {
        "name": "Nocturne of Battle",
        "power": 0,
        "slot": "S2"
      },
      {
        "name": "Scarlet Hades",
        "power": 1.065,
        "buff": {
          "id": "damage_up",
          "name": "DMG ↑",
          "stat": "damage",
          "value": 0.284,
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
    "Makoto means Makoto Yuki (SEES), not Queen. Raw alternate Theurgy Cadenza must not be normalized into shared Highlight."
  ],
  "awarenessRules": [
    {
      "level": 0,
      "name": "Pathfinder",
      "description": "Makoto has 2 Theurgy: Cadenza and Ardhanari. At the start of battle, if Makoto's Theurgy Gauge is below 35, fill up to 35.\nWhen receiving buff, healing, or shield skill effects from an ally (excluding effects that also target foes), gain 1 Moon Phase stack (up to 1 stack per turn). This effect lasts for 2 turns, and stacks up to 4 times.\nWith Moon Phase, increase pierce rate by 4%/8%/12% (effect changes at Lv. 1/50/70, respectively).",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 1,
      "name": "Result of Coincidence",
      "description": "Additional effects are added to the following skills.\nMelody of Flames: This skill deals 1 more hit of Fire damage.\nNocturne of Battle: Increase party's pierce rate by 10% for 2 turns.\nScarlet Hades: When this skill is activated with 4 Moon Phase stacks, increase Makoto's critical rate by 16%.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 2,
      "name": "Immovable Soul",
      "description": "When Makoto has 4 Moon Phase stacks on his action, automatically activate Nocturne of Battle 1 time.\nCooldown time: 1 turn.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 3,
      "name": "Under the Full Moon",
      "description": "Increase the skill levels of Scarlet Hades and Combat Tactics by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 4,
      "name": "Thorny Path",
      "description": "Additional effects are added to the following Theurgy.\nCadenza: Increase party's damage by 10% more for 2 turns.\nArdhanari: This skill deals 2 more hits of Fire damage.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 5,
      "name": "Soul Flames",
      "description": "Increase the skill levels of Melody of Flames and Nocturne of Battle by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 6,
      "name": "Burn My Dread",
      "description": "When Makoto activates a Theurgy, the effects of the other Theurgy are activated at the same time.\nIncrease skill damage dealt by spending Full Moon stacks with Scarlet Hades by 35%.\nThe first time that Makoto takes fatal damage, he enters a special near-death state and survives with 1 HP, and will be KO'd at the end of the turn. If Makoto's HP is restored above 25%, this state is removed.",
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
