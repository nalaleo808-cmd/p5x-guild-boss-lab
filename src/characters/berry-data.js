// Reviewed 2026-09-12. Full source snapshot: data/character-research/berry.json.
// Coverage is partial. Source descriptions are evidence, never executable effects.
export const characterResearch = {
  "slug": "berry",
  "name": "Ichigo Shikano",
  "coverage": "partial: researched source; legacy engine methods integrated, weapon effects excluded",
  "sources": [
    {
      "url": "https://lufel.net/en/character/berry/",
      "kind": "client-rendered-character-page",
      "accessedAt": "2026-09-12"
    },
    {
      "file": "skill.js",
      "url": "https://lufel.net/data/characters/%EC%9D%B4%EC%B9%98%EA%B3%A0/skill.js",
      "sha256": "1ebcf90fb286a74c498f673caf635d1fc4fb3489622b2c4c431dd0fdc0fcac18",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "ritual.js",
      "url": "https://lufel.net/data/characters/%EC%9D%B4%EC%B9%98%EA%B3%A0/ritual.js",
      "sha256": "86af6baa37964fcd2f5464c17528cf29aa0f95a36cc33556e2780524b97ef8ae",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "weapon.js",
      "url": "https://lufel.net/data/characters/%EC%9D%B4%EC%B9%98%EA%B3%A0/weapon.js",
      "sha256": "508748471901129b4eeab12ba8e835013807c0b827f77961b3e15a235b4f7522",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    }
  ],
  "implemented": [
    "Legacy engine methods mixed into BattleEngine: berrySkill, berryTierValue, refreshBerryPassives, gainBerryChain."
  ],
  "weaponEffects": "Excluded: source weapon rules are evidence only and do not create selectable loadout options or runtime effects.",
  "missing": [
    "Signature Chains-based damage tiers and four-star post-Highlight damage duration are deferred.",
    "Lovesick base definition is not in skill/ritual files; retain local talent and battle evidence. Highlight Pierce, cap refresh, transfer snapshot factors and critical-roll granularity remain unverified.",
    "A2 fatal-state boundary needs ally-turn/death interception; never use counted action hooks as a substitute."
  ],
  "limitations": [
    "Existing kit is only partially modeled. Extracted methods preserve existing approximations; extraction does not verify them.",
    "No optional weapon is selected by default. Refinement indexes 0-6 use the seven published entries. Weapon base item HP/Attack/Defense are not added.",
    "Static weapon effects are skipped for equipped stat totals unless explicitly declared excluded. Attack buffs affect outgoing damage; mechanicAttack/support scaling and base-stat Desire are not recomputed.",
    "Signature Chains-based damage tiers and four-star post-Highlight damage duration are deferred.",
    "Lovesick base definition is not in skill/ritual files; retain local talent and battle evidence. Highlight Pierce, cap refresh, transfer snapshot factors and critical-roll granularity remain unverified.",
    "A2 fatal-state boundary needs ally-turn/death interception; never use counted action hooks as a substitute."
  ],
  "engineOwned": [
    "berrySkill strips the catalog's unconditional S1 damage buff.",
    "refreshBerryPassives, gainBerryChain, addLovesick, captureLovesickSnapshot, calculateLovesickSnapshotDamage and triggerContinuousDamage own Chains, DoT snapshots, duration, defenses and critical rules.",
    "resolveSkill owns S1 defeat repeats, S3 per-stack and bonus hits, Highlight ticks; getBerryAltActions/stepBerryFreeHighlight own A6 once-per-battle actions; transferBerryLovesick owns death transfer."
  ],
  "integration": {
    "removeEngineMethods": [
      "berrySkill",
      "berryTierValue",
      "refreshBerryPassives",
      "gainBerryChain"
    ],
    "mixIn": "Object.assign(BattleEngine.prototype, berryLegacyMethods) before any engine construction; import legacyMethods under that alias. Remove named class definitions in the same change.",
    "dependencies": [
      "applyUnitBuff",
      "refreshLovesickDebuffs",
      "emit"
    ],
    "hooks": [
      "beforeSkill: returned temporaryCritDamage is read by calculateDamage. Call once per cast, including berry_repeat, before damage cloning.",
      "Extraction requires damage formula and enemy defeat/DoT hooks beyond afterSkill. Preserve shared Highlight nested-cast eligibility."
    ],
    "legacyPolicy": "Exact existing bodies, including incomplete rules and archived-profile behavior. Do not also call these methods from generic lifecycle hooks. Tangled resolver branches remain at original call sites."
  },
  "comparison": {
    "liveGeneratedAt": "2026-08-28T23:07:36.661Z",
    "skillChanges": [],
    "catalogGeneratedAt": "2026-09-12T21:05:39.231Z",
    "catalogId": "lufel-recent-berry",
    "catalogSkills": [
      {
        "name": "Vorpal Butterfly",
        "power": 1.5019999999999998,
        "buff": {
          "id": "damage_up",
          "name": "DMG ↑",
          "stat": "damage",
          "value": 2,
          "duration": 2
        },
        "slot": "S1"
      },
      {
        "name": "Obsessive Rose",
        "power": 1.244,
        "slot": "S2"
      },
      {
        "name": "My Beloved Prince",
        "power": 2.966,
        "slot": "S3"
      }
    ]
  },
  "reviewNotes": [
    "English S2/S3 and A0 exposure differ from Korean blocks in the same files; English matches local snapshot. Keep localized values separate.",
    "Catalog S1 buff +200% is conditional; engine correctly strips it. Do not reintroduce it."
  ],
  "awarenessRules": [
    {
      "level": 0,
      "name": "Mine Alone",
      "description": "The first time Ichigo activates Vorpal Butterfly, gain 1 Chains of Love stack. Also, each time she activates a Highlight, gain 1 Chains of Love stack. Chains of Love stacks up to 3 times.\nGain the following effects based on the number of Chains of Love stacks.\n1: For each Lovesick stack inflicted, increase target's damage taken by 4%.\n2: Increase critical rate by 15%. Also, all of Ichigo's skill damage is counted as continuous damage.\n3: Increase continuous damage by 25%.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 1,
      "name": "Pounding Heartbeat",
      "description": "For each Lovesick stack inflicted, decrease target's Defense by 3%.\nAlso, each time a skill is used, inflict 1 more Lovesick stack on the target.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 2,
      "name": "Power of Love",
      "description": "At the start of battle, gain 1 Chains of Love stack.\nChains of Love now stacks up to 5 times, and gain the following effects based on the number of stacks.\n4: Increase critical damage by 36%.\n5: The first time Ichigo takes fatal damage, survive with 1 HP and enter a special near-death state, and gain 4 Power of Love stacks. At the end each ally's turn, spend 1 Power of Love stack, and after all Power of Love stacks have been spent, Ichigo will be KO'd.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 3,
      "name": "Forever My Prince",
      "description": "Increase the skill levels of My Beloved Prince and Thief Tactics by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 4,
      "name": "Maiden's True Strength",
      "description": "Highlight Enhanced: Each time her Highlight is activated, permanently increase Ichigo's Attack by 6%. Stacks up to 5 times.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 5,
      "name": "Garden of Devotion",
      "description": "Increase the skill levels of Vorpal Butterfly and Obsessive Rose by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 6,
      "name": "A World of Our Own",
      "description": "Lovesick now stacks up to 15 times.\nBased on the total number of Chains of Love stacks, the following effects can be activated. \n1: After activating Vorpal Butterfly, activate Vorpal Butterfly 1 more time on the selected target.\n2: After activating Obsessive Rose, activate Obsessive Rose 1 more time on the selected target.\n3: After activating My Beloved Prince, activate My Beloved Prince 1 more time on the selected target.\n4: During Ichigo's turn, can activate Highlight 1 time on the selected target without spending the Highlight gauge (not affected by Highlight cooldown time).\n(Each effect can activate only once during battle. If a target is defeated or the skill is nullified, reflected, or absorbed, a different target is selected for the skill effect.)",
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
      "stat": "critRate",
      "values": [
        0.181,
        0.181,
        0.235,
        0.235,
        0.289,
        0.289,
        0.343
      ]
    },
    "princeCrit": [
      0.328,
      0.428,
      0.428,
      0.528,
      0.528,
      0.628,
      0.628
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
