// Reviewed 2026-09-12. Full source snapshot: data/character-research/puppet-wavecatcher.json.
// Coverage is partial. Source descriptions are evidence, never executable effects.
export const characterResearch = {
  "slug": "puppet-wavecatcher",
  "name": "Wavecatcher Miyu",
  "coverage": "partial: researched source; legacy engine methods integrated, weapon effects excluded",
  "sources": [
    {
      "url": "https://lufel.net/en/character/puppet-wavecatcher/",
      "kind": "client-rendered-character-page",
      "accessedAt": "2026-09-12"
    },
    {
      "file": "skill.js",
      "url": "https://lufel.net/data/characters/%EB%AF%B8%EC%9C%A0%C2%B7%EC%97%AC%EB%A6%84/skill.js",
      "sha256": "cbd0a8c1e5ed09a2d0deca4c3c9a5f424cfc456cfc150d76f65855f222a85f6c",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "ritual.js",
      "url": "https://lufel.net/data/characters/%EB%AF%B8%EC%9C%A0%C2%B7%EC%97%AC%EB%A6%84/ritual.js",
      "sha256": "f0a4d0a7c2b1ef6f06d65278c230a36f8fddee8dedb839e2c4a289094dd60f81",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "weapon.js",
      "url": "https://lufel.net/data/characters/%EB%AF%B8%EC%9C%A0%C2%B7%EC%97%AC%EB%A6%84/weapon.js",
      "sha256": "7bd400399c3034292de1337b9c0ba94c6f86cc9baeb712a3e5f5a0b85d813c98",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    }
  ],
  "implemented": [
    "Legacy engine methods mixed into BattleEngine: isWavecatcher, cleanseWavecatcher, surfAdjustedStatus."
  ],
  "weaponEffects": "Excluded: source weapon rules are evidence only and do not create selectable loadout options or runtime effects.",
  "missing": [
    "A1 cost reduction and Offshore cap, A2 every-fourth free wave and A6 full turn-end reset need audit/extraction. Existing resolveAllyTurnFollowUps uses cost 30*(stacks+1) and cap 4.",
    "Four-star Surf Attack and signature SP-spend damage stacks deferred pending gain/spend event ownership.",
    "Surf follow-up timing must distinguish ally turn end from counted action end, including Concert; exact boundaries need live evidence."
  ],
  "limitations": [
    "Existing kit is only partially modeled. Extracted methods preserve existing approximations; extraction does not verify them.",
    "No optional weapon is selected by default. Refinement indexes 0-6 use the seven published entries. Weapon base item HP/Attack/Defense are not added.",
    "Static weapon effects are skipped for equipped stat totals unless explicitly declared excluded. Attack buffs affect outgoing damage; mechanicAttack/support scaling and base-stat Desire are not recomputed.",
    "A1 cost reduction and Offshore cap, A2 every-fourth free wave and A6 full turn-end reset need audit/extraction. Existing resolveAllyTurnFollowUps uses cost 30*(stacks+1) and cap 4.",
    "Four-star Surf Attack and signature SP-spend damage stacks deferred pending gain/spend event ownership.",
    "Surf follow-up timing must distinguish ally turn end from counted action end, including Concert; exact boundaries need live evidence."
  ],
  "engineOwned": [
    "initializeCharacterPassives owns Hang Ten; constructor and SP recovery helpers own starting Surf, max SP and recovered-SP accounting.",
    "resolveSkill owns Paddle Out, Aerial Tide and Highlight bonus hit; resolveAllyTurnFollowUps owns automatic Catch a Wave; surfAdjustedStatus and cleanseWavecatcher own duration/control handling."
  ],
  "integration": {
    "removeEngineMethods": [
      "isWavecatcher",
      "cleanseWavecatcher",
      "surfAdjustedStatus"
    ],
    "mixIn": "Object.assign(BattleEngine.prototype, puppet_wavecatcherLegacyMethods) before any engine construction; import legacyMethods under that alias. Remove named class definitions in the same change.",
    "dependencies": [
      "isSpiritualOrControlStatus"
    ],
    "hooks": [
      "beforeSkill signature critBonus must cover Aerial Tide (a character_skill that counts as Resonance), Catch a Wave and future free special waves only.",
      "Extract resolveAllyTurnFollowUps as a unit; remove old invocation when migrated. Need onAllyTurnEnd for all owners, not onAllyActionEnd, until actual turn semantics verified.",
      "Paddle Out legality/free state toggles and SP overflow remain engine-owned."
    ],
    "legacyPolicy": "Exact existing bodies, including incomplete rules and archived-profile behavior. Do not also call these methods from generic lifecycle hooks. Tangled resolver branches remain at original call sites."
  },
  "comparison": {
    "liveGeneratedAt": "2026-08-28T23:07:36.661Z",
    "skillChanges": [],
    "catalogGeneratedAt": "2026-09-12T21:05:39.231Z",
    "catalogId": "lufel-recent-puppet-wavecatcher",
    "catalogSkills": [
      {
        "name": "Jellyfish Splash",
        "power": 1.172,
        "slot": "S1"
      },
      {
        "name": "Aerial Tide",
        "power": 2.08,
        "slot": "S2"
      },
      {
        "name": "Paddle Out",
        "power": 0.584,
        "slot": "S3"
      }
    ]
  },
  "reviewNotes": [
    "Catalog Paddle Out power .584 describes nested Catch a Wave; resolveSkill correctly zeroes stance damage."
  ],
  "awarenessRules": [
    {
      "level": 0,
      "name": "Surfing Mermaid",
      "description": "Wavecatcher Miyu can enter Surf state, spending SP to automatically attack foes.\nIncrease Wavecatcher Miyu's max SP to 200, and at the start of battle, set her SP to 0. At the start of other allies' turns, restore 15 SP to Wavecatcher Miyu (affected by SP Recovery).\nDuring battle, based on the total of her recovered SP (including SP above the maximum), gain the following effects.\n100: Increase Attack by 25%.\n200: Increase damage by 25%.\n300: Increase critical rate by 12%.\n400: Increase critical damage by 24%.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 1,
      "name": "Offshore Paradise",
      "description": "Decrease SP cost of Catch a Wave by 40%, and increase max Offshore stacks by 2.\nWhen entering Surf state, extend duration of all buffs/debuffs applied by 1 turn.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 2,
      "name": "Roaring Surf Line",
      "description": "While Surf is active, increase Wavecatcher Miyu's critical damage by 20%.\nEvery 4 times Catch a Wave is activated, activate a special Catch a Wave 1 more time without spending SP. This Catch a Wave does not count toward skill activation counts, and cannot grant Offshore stacks.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 3,
      "name": "Sea Breeze Paddling",
      "description": "Increase the skill levels of Paddle Out and Thief Tactics by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 4,
      "name": "Refreshing Beach Resort",
      "description": "Highlight Enhanced: Increase Wavecatcher Miyu's Resonance damage by 30% for 2 turns.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 5,
      "name": "Southern High Tide",
      "description": "Increase the skill levels of Jellyfish Splash and Aerial Tide by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 6,
      "name": "Summer Sea Mermaid",
      "description": "Increase Wavecatcher Miyu's max SP by 250 more.\nAt the start of battle, recover max SP, and enter Surf state. Also increase max Offshore stacks by 2.\nAdditional effects are added to the following skills.\nJellyfish Splash: Increase SP recovered when used by 50%.\nAerial Tide: Surf state is not removed after using this skill, and Offshore stacks are lost after the turn ends. When stacks are lost, recover max SP.",
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
    },
    "resonanceCrit": [
      0.164,
      0.214,
      0.214,
      0.264,
      0.264,
      0.314,
      0.314
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
