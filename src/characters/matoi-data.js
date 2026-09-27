// Reviewed 2026-09-12. Full source snapshot: data/character-research/matoi.json.
// Coverage is partial. Source descriptions are evidence, never executable effects.
export const characterResearch = {
  "slug": "matoi",
  "name": "Mio Natsukawa",
  "coverage": "partial: researched source; legacy engine methods integrated, weapon effects excluded",
  "sources": [
    {
      "url": "https://lufel.net/en/character/matoi/",
      "kind": "client-rendered-character-page",
      "accessedAt": "2026-09-12"
    },
    {
      "file": "skill.js",
      "url": "https://lufel.net/data/characters/%EB%AF%B8%EC%98%A4/skill.js",
      "sha256": "e4dfe935913062c9814de21f0ae82152a81e868c3128e294302f479fb6edc6e5",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "ritual.js",
      "url": "https://lufel.net/data/characters/%EB%AF%B8%EC%98%A4/ritual.js",
      "sha256": "827102657c20c77f44ccbfa46d9976a62fb82f1cec3b63a364b2b541af44cbeb",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "weapon.js",
      "url": "https://lufel.net/data/characters/%EB%AF%B8%EC%98%A4/weapon.js",
      "sha256": "89e77a0e053500b01e7751f7cfccf13077310fda8b913aedf7688cc110d24b04",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    }
  ],
  "implemented": [
    "Legacy engine methods mixed into BattleEngine: isMatoi, matoiSkill, applyMatoiTorrentEffects."
  ],
  "weaponEffects": "Excluded: source weapon rules are evidence only and do not create selectable loadout options or runtime effects.",
  "missing": [
    "Signature Attack text omits a numeric result: do not invent an ailment-accuracy-to-Attack coefficient.",
    "Signature/four-star ailment accuracy and Technical-trigger defense debuff await stat and Technical integration.",
    "Ailment-accuracy scaling of Defense/Cold Flames, Freeze duration and Icebound/Technical classification remain incomplete.",
    "A6 automatic Torrent and repeated-Guidance exposure need owner-action/target-history extraction without duplicate casts."
  ],
  "limitations": [
    "Existing kit is only partially modeled. Extracted methods preserve existing approximations; extraction does not verify them.",
    "No optional weapon is selected by default. Refinement indexes 0-6 use the seven published entries. Weapon base item HP/Attack/Defense are not added.",
    "Static weapon effects are skipped for equipped stat totals unless explicitly declared excluded. Attack buffs affect outgoing damage; mechanicAttack/support scaling and base-stat Desire are not recomputed.",
    "Signature Attack text omits a numeric result: do not invent an ailment-accuracy-to-Attack coefficient.",
    "Signature/four-star ailment accuracy and Technical-trigger defense debuff await stat and Technical integration.",
    "Ailment-accuracy scaling of Defense/Cold Flames, Freeze duration and Icebound/Technical classification remain incomplete.",
    "A6 automatic Torrent and repeated-Guidance exposure need owner-action/target-history extraction without duplicate casts."
  ],
  "engineOwned": [
    "matoiSkill owns Extinguish spend gate and Requiem transformation; applyMatoiTorrentEffects owns Freeze, Scald conversion and base defense reductions.",
    "resolveSkill owns Guidance spend, Damnation and Highlight extra hit; damage resolver owns Freeze/Icebound vulnerability and Ice resistance bypass."
  ],
  "integration": {
    "removeEngineMethods": [
      "isMatoi",
      "matoiSkill",
      "applyMatoiTorrentEffects"
    ],
    "mixIn": "Object.assign(BattleEngine.prototype, matoiLegacyMethods) before any engine construction; import legacyMethods under that alias. Remove named class definitions in the same change.",
    "dependencies": [
      "usesLiveMechanics",
      "emit",
      "applyEnemyStatus",
      "random",
      "convertBurnToScald"
    ],
    "hooks": [
      "initialize applies only reviewed four-star Attack. Signature selection records unsupported effects but executes no coefficient.",
      "Need afterTechnical(actor,target,result), stat sampling for ailmentAccuracy, and action-start auto-cast ownership before migrating other effects."
    ],
    "legacyPolicy": "Exact existing bodies, including incomplete rules and archived-profile behavior. Do not also call these methods from generic lifecycle hooks. Tangled resolver branches remain at original call sites."
  },
  "comparison": {
    "liveGeneratedAt": "2026-08-28T23:07:36.661Z",
    "skillChanges": [],
    "catalogGeneratedAt": "2026-09-12T21:05:39.231Z",
    "catalogId": "lufel-recent-matoi",
    "catalogSkills": [
      {
        "name": "Sub-Zero Torrent",
        "power": 1.136,
        "slot": "S1"
      },
      {
        "name": "Freezing Prison",
        "power": 2.272,
        "slot": "S2"
      },
      {
        "name": "Extinguishing Guidance",
        "power": 1.278,
        "slot": "S3"
      }
    ]
  },
  "reviewNotes": [
    "Existing catalog basic powers match English source; importer does not encode full conditional accuracy scaling."
  ],
  "awarenessRules": [
    {
      "level": 0,
      "name": "Smothering Agony",
      "description": "Some skills and Highlight can activate Ice Technicals. Also, when dealing Ice damage, ignore foes' Ice resistance.\nOn Natsukawa's action, gain 1 Extinguish stack. Stacks up to 4 times. When using Extinguishing Guidance, spend Extinguish stacks, and inflict 1 Damnation stack on all foes for each stack spent.\nDamnation: Increase damage taken by 6% for 2 turns. Stacks up to 4 times.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 1,
      "name": "Cooling Spray",
      "description": "When using Sub-Zero Torrent, gain 1 more Extinguish stack. When spending Extinguish stacks, increase all foes' critical damage taken by 30% for 2 turns.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 2,
      "name": "Frozen Gateway",
      "description": "When spending Extinguish stacks, increase party's Attack by 20%, Defense by 30%, and damage dealt by 15% for 2 turns.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 3,
      "name": "Whirlpool Cannon",
      "description": "Increase the skill levels of Extinguishing Guidance and Thief Tactics by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 4,
      "name": "Terrifying Chill",
      "description": "Highlight Enhanced: Extend the duration of the damage taken increase effect by 1 turn. Also, when the Highlight activates Deepfreeze, the chance to inflict Icebound becomes 44%.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 5,
      "name": "Wellspring of Grief",
      "description": "Increase the skill levels of Sub-Zero Torrent and Freezing Prison by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 6,
      "name": "Firefighter's Soul",
      "description": "If foes have Burn or Scald on Natsukawa's action, activate Sub-Zero Torrent on that foe 1 time.\nAlso, when the same foe is attacked repeatedly with Extinguishing Guidance or Requiem Guidance, increase the target's damage taken by 25% more for 1 turn.\nThe maximum number of Damnation stacks becomes 6.",
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
