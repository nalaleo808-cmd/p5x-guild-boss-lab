// Reviewed 2026-09-12. Full source snapshot: data/character-research/rin-firecracker.json.
// Coverage is partial. Source descriptions are evidence, never executable effects.
export const characterResearch = {
  "slug": "rin-firecracker",
  "name": "Firecracker Yaoling",
  "coverage": "partial: researched source; legacy engine methods integrated, weapon effects excluded",
  "sources": [
    {
      "url": "https://lufel.net/en/character/rin-firecracker/",
      "kind": "client-rendered-character-page",
      "accessedAt": "2026-09-12"
    },
    {
      "file": "skill.js",
      "url": "https://lufel.net/data/characters/%EC%95%BC%EC%98%A4%EB%A7%81%C2%B7%EC%82%AC%EC%9E%90%EB%AC%B4/skill.js",
      "sha256": "bb4cacea3e77c7517c4ab0710651eb030c7ce1bc84c69a33f19e67e6c3d9a1d9",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "ritual.js",
      "url": "https://lufel.net/data/characters/%EC%95%BC%EC%98%A4%EB%A7%81%C2%B7%EC%82%AC%EC%9E%90%EB%AC%B4/ritual.js",
      "sha256": "a9bd3b93394de43ff9ca1087fd25423587da418c9edae4a3ef737cc4ee352f27",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "weapon.js",
      "url": "https://lufel.net/data/characters/%EC%95%BC%EC%98%A4%EB%A7%81%C2%B7%EC%82%AC%EC%9E%90%EB%AC%B4/weapon.js",
      "sha256": "03381b45dab37d8d252eecfac0f43062c25c8b2391e5e10f6dacdbb87f1e1566",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    }
  ],
  "implemented": [
    "Legacy engine methods mixed into BattleEngine: isRin, endRinFlamingSwordDance, addRinYearEndFlames."
  ],
  "weaponEffects": "Excluded: source weapon rules are evidence only and do not create selectable loadout options or runtime effects.",
  "missing": [
    "Four-star Yanhua Attack and signature Fire Technical damage need cast-stat and verified Technical hooks.",
    "Burn base DoT coefficient/duration, Year-End Flames tick clock, Technical thresholds and Fireburn rules remain unverified.",
    "A2 limit-breaking Burn reapplication cooldown and enemy-spawn behavior need explicit status-remove/spawn hooks."
  ],
  "limitations": [
    "Existing kit is only partially modeled. Extracted methods preserve existing approximations; extraction does not verify them.",
    "No optional weapon is selected by default. Refinement indexes 0-6 use the seven published entries. Weapon base item HP/Attack/Defense are not added.",
    "Static weapon effects are skipped for equipped stat totals unless explicitly declared excluded. Attack buffs affect outgoing damage; mechanicAttack/support scaling and base-stat Desire are not recomputed.",
    "Four-star Yanhua Attack and signature Fire Technical damage need cast-stat and verified Technical hooks.",
    "Burn base DoT coefficient/duration, Year-End Flames tick clock, Technical thresholds and Fireburn rules remain unverified.",
    "A2 limit-breaking Burn reapplication cooldown and enemy-spawn behavior need explicit status-remove/spawn hooks."
  ],
  "engineOwned": [
    "constructor/getRinActions/endRinFlamingSwordDance own stance, evolved melee and A1/A6 usage.",
    "resolveSkill owns Scarlet bonus power, Firework statuses, Highlight buffs; applyRinFireworkFinale/addRinYearEndFlames own status application."
  ],
  "integration": {
    "removeEngineMethods": [
      "isRin",
      "endRinFlamingSwordDance",
      "addRinYearEndFlames"
    ],
    "mixIn": "Object.assign(BattleEngine.prototype, rin_firecrackerLegacyMethods) before any engine construction; import legacyMethods under that alias. Remove named class definitions in the same change.",
    "dependencies": [
      "usesLiveMechanics",
      "emit",
      "applyContinuousDamage",
      "applyEnemyStatus"
    ],
    "hooks": [
      "beforeSkill returns critBonus while actor.rinFlamingSwordDance is true; do not read guessed buff names.",
      "Technical weapon damage must run after confirmed per-hit Technical classification in calculateDamage, not afterSkill."
    ],
    "legacyPolicy": "Exact existing bodies, including incomplete rules and archived-profile behavior. Do not also call these methods from generic lifecycle hooks. Tangled resolver branches remain at original call sites."
  },
  "comparison": {
    "liveGeneratedAt": "2026-08-28T23:07:36.661Z",
    "skillChanges": [],
    "catalogGeneratedAt": "2026-09-12T21:05:39.231Z",
    "catalogId": "lufel-recent-rin-firecracker",
    "catalogSkills": [
      {
        "name": "Scarlet Surprise",
        "power": 1.402,
        "buff": {
          "id": "crit_rate_up",
          "name": "CRIT RATE ↑",
          "stat": "critRate",
          "value": 0.1,
          "duration": 2
        },
        "slot": "S1"
      },
      {
        "name": "Firework Finale",
        "power": 0.8590000000000001,
        "slot": "S2"
      },
      {
        "name": "Orange Blossom Blade",
        "power": 0.39899999999999997,
        "buff": {
          "id": "damage_up",
          "name": "DMG ↑",
          "stat": "damage",
          "value": 0.39899999999999997,
          "duration": 2
        },
        "slot": "S3"
      }
    ]
  },
  "reviewNotes": [
    "Orange Blossom Blade includes nested attack coefficient in tooltip; engine zeroes stance power and owns its special action path."
  ],
  "awarenessRules": [
    {
      "level": 0,
      "name": "New Year's Blast",
      "description": "Firecracker Yaoling's melee attack can evolve to Yanhua Slash. When evolved, deal heavy Fire damage to targets, and can activate Fire Technical. Also, when Fireburn is activated, the damage increase effect becomes 20%.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 1,
      "name": "Lunar Lanterns",
      "description": "Reduce the first cooldown time for Orange Blossom Blade by 1 turn. Also, extend the duration of Flaming Sword Dance by 1 turn, and Yanhua Slash can be activated up to 2 times. Also, when Flaming Sword Dance is active, enhance Scarlet Surprise and Firework Finale.\nScarlet Surprise: When enhanced, increase the critical damage of Yanhua Slash by 40% more.\nFirework Finale: When enhanced, Yanhua Slash inflicts 1 more Year-End Flames stack.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 2,
      "name": "Festival Colors",
      "description": "When Firecracker Yaoling is present, for each foe that appears, permanently inflict 1 special limit-breaking Burn stack. When this Burn is removed, 1 more stack is immediately inflicted. This effect's cooldown time is 2 turns, calculated individually for each foe.\nDuring battle, when 1 foe is inflicted with Burn, increase Firecracker Yaoling's critical rate by 10%. Also, for each additional foe inflicted with Burn, increase by 3% more (up to a maximum of 16%).",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 3,
      "name": "Cleansing Blaze",
      "description": "Increase the skill levels of Firework Finale and Orange Blossom Blade by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 4,
      "name": "Grand Lion Dance",
      "description": "Highlight Enhanced: Increase Firecracker Yaoling's critical damage by 15% more for 2 turns. Also, extend the duration of all buffs gained from this Highlight by 2 turns.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 5,
      "name": "Lucky Red",
      "description": "Increase the skill levels of Scarlet Surprise and Thief Tactics by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 6,
      "name": "Sky Lantern Festival",
      "description": "Flaming Sword Dance becomes permanent. Yanhua Slash evolves to Liuxing Slash, increasing damage dealt by 80%. Flaming Sword Dance is not removed even after Liuxing Slash is activated.\nAlso, Scarlet Surprise permanently maintains the critical rate increase and enhanced effects on Liuxing Slash. The duration of Firework Finale's Burn and enhanced effects on Liuxing Slash are extended by 1 turn.",
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
    },
    "stanceCrit": [
      0.16,
      0.21,
      0.21,
      0.26,
      0.26,
      0.31,
      0.31
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
