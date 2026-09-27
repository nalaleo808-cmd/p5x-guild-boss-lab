// Reviewed 2026-09-12. Full source snapshot: data/character-research/miku.json.
// Coverage is partial. Source descriptions are evidence, never executable effects.
export const characterResearch = {
  "slug": "miku",
  "name": "Hatsune Miku",
  "coverage": "partial: researched source; legacy engine methods integrated, weapon effects excluded",
  "sources": [
    {
      "url": "https://lufel.net/en/character/miku/",
      "kind": "client-rendered-character-page",
      "accessedAt": "2026-09-12"
    },
    {
      "file": "skill.js",
      "url": "https://lufel.net/data/characters/%EB%AF%B8%EC%BF%A0/skill.js",
      "sha256": "9287893eb620c559361c2f21cb222f47974928b2948d885151533cf06948b7cc",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "ritual.js",
      "url": "https://lufel.net/data/characters/%EB%AF%B8%EC%BF%A0/ritual.js",
      "sha256": "efcef305d3c2018c5d230222340d0645db0a288873c038b4f2a35dd43e88cf02",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    },
    {
      "file": "weapon.js",
      "url": "https://lufel.net/data/characters/%EB%AF%B8%EC%BF%A0/weapon.js",
      "sha256": "9171a3e4e24534b567f03dc03869147e18474f1bf080881b1425f2abbb65241a",
      "language": "en",
      "accessedAt": "2026-09-12",
      "kind": "site-owned-data"
    }
  ],
  "implemented": [
    "Legacy engine methods mixed into BattleEngine: isMikuNavigator, isVirtualConcertActive, applyMikuSongEffect, applyMikuTrackSkill."
  ],
  "weaponEffects": "Excluded: source weapon rules are evidence only and do not create selectable loadout options or runtime effects.",
  "missing": [
    "Navigator base Attack and weapon Attack require a real navigator stat/scaling pipeline; current song methods use capped constants.",
    "Weapon track gains, three-turn critical stacks, four-star Attack and Concert Skill Amplification require actual track-acquisition and concert-enter hooks.",
    "Current r0 says repeat a track's effect; skill text says only when absent. Source contradiction must not silently replace observed behavior.",
    "Awareness-dependent Concert final amplification versus ordinary damage and sync_description variants require review; sync text is not executed."
  ],
  "limitations": [
    "Existing kit is only partially modeled. Extracted methods preserve existing approximations; extraction does not verify them.",
    "No optional weapon is selected by default. Refinement indexes 0-6 use the seven published entries. Weapon base item HP/Attack/Defense are not added.",
    "Static weapon effects are skipped for equipped stat totals unless explicitly declared excluded. Attack buffs affect outgoing damage; mechanicAttack/support scaling and base-stat Desire are not recomputed.",
    "Navigator base Attack and weapon Attack require a real navigator stat/scaling pipeline; current song methods use capped constants.",
    "Weapon track gains, three-turn critical stacks, four-star Attack and Concert Skill Amplification require actual track-acquisition and concert-enter hooks.",
    "Current r0 says repeat a track's effect; skill text says only when absent. Source contradiction must not silently replace observed behavior.",
    "Awareness-dependent Concert final amplification versus ordinary damage and sync_description variants require review; sync text is not executed."
  ],
  "engineOwned": [
    "createNavigatorState/applyMikuTrackSkill/applyMikuSongEffect own songs and tracks; startVirtualConcert/endVirtualConcertRound/finishVirtualConcert own Concert timing and A6 echo.",
    "applyMikuPartyBuff owns extension/deduplication; stepHighlight owns A4; shared gauge resolver owns Concert gain rules."
  ],
  "integration": {
    "removeEngineMethods": [
      "isMikuNavigator",
      "isVirtualConcertActive",
      "applyMikuSongEffect",
      "applyMikuTrackSkill"
    ],
    "mixIn": "Object.assign(BattleEngine.prototype, mikuLegacyMethods) before any engine construction; import legacyMethods under that alias. Remove named class definitions in the same change.",
    "dependencies": [
      "applyMikuPartyBuff",
      "healMikuParty",
      "emit"
    ],
    "hooks": [
      "Registry must initialize state.navigator as well as party, identify sourceCharacterId lufel-recent-miku or navigator-miku.",
      "Use applyUnitBuff with equipment sourceType and mikuGranted for party critical buff; do not amplify equipment using applyMikuPartyBuff navigator sourceType.",
      "Remaining effects require onTrackGained, onConcertStart/onConcertEnd, and navigator stat sampling. Counted ally hooks cannot infer track acquisition."
    ],
    "legacyPolicy": "Exact existing bodies, including incomplete rules and archived-profile behavior. Do not also call these methods from generic lifecycle hooks. Tangled resolver branches remain at original call sites."
  },
  "comparison": {
    "liveGeneratedAt": "2026-08-28T23:07:36.661Z",
    "skillChanges": [],
    "catalogGeneratedAt": "2026-09-12T21:05:39.231Z",
    "catalogId": "lufel-recent-miku",
    "catalogSkills": [
      {
        "name": "Feel the Beat",
        "power": 0,
        "buff": {
          "id": "attack_up",
          "name": "ATK ↑",
          "stat": "attack",
          "value": 0.005699999999999999,
          "duration": 2
        },
        "slot": "S1"
      },
      {
        "name": "Clear Sound",
        "power": 0,
        "buff": {
          "id": "crit_rate_up",
          "name": "CRIT RATE ↑",
          "stat": "critRate",
          "value": 0.002,
          "duration": 3
        },
        "slot": "S2"
      },
      {
        "name": "Showstopper",
        "power": 0,
        "slot": "S3"
      }
    ]
  },
  "reviewNotes": [
    "Navigator record may be in catalog.navigators, not catalog.characters. Raw skill_highlight is stat transfer, not an executable Highlight attack."
  ],
  "awarenessRules": [
    {
      "level": 0,
      "name": "Virtual Stage",
      "description": "During battle, Miku can change the battle scenery and song playing during her allies' turns, and her skill effects are enhanced based on the current song playing. When Miku's skills become available, the current song will automatically switch.\nWhen using Feel the Beat or Clear Sound on songs where Miku has already gained the corresponding Track, reapply the same additional effect.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 1,
      "name": "Hologram Screen",
      "description": "Gain Skill Amplification equal to 15%.\nWhen Virtual Concert is activated, reset all allies' Highlight cooldowns.\nWhile Virtual Concert is active, increase Highlight and Theurgy Final Damage Amplification by 10%, and double the rate at which the Highlight and Theurgy gauges are filled.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 2,
      "name": "Blue-Green Sea",
      "description": "When Virtual Concert is activated, grant all effects of Feel the Beat and Clear Sound for 2 turns.\nWhile Virtual Concert is active, increase party's Final Damage Amplification by 8%.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 3,
      "name": "Echoing in your Heart",
      "description": "Increase the skill levels of Feel the Beat and Showstopper by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 4,
      "name": "Let's Sing Together",
      "description": "When an ally activates a Highlight or Theurgy, increase that ally's Attack by 25% for 2 turns.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 5,
      "name": "Reaching your Heart",
      "description": "Increase the skill level of Clear Sound by 3.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    },
    {
      "level": 6,
      "name": "Neverending Song",
      "description": "When Virtual Concert ends, all foes take a fixed amount of Almighty damage equal to 100% of each target's total damage taken during Virtual Concert.",
      "runtime": "existing-engine-partial; see engineOwned and missing, no automatic tooltip execution"
    }
  ],
  "weaponRules": {
    "partyCrit": [
      0.181,
      0.235,
      0.235,
      0.289,
      0.289,
      0.343,
      0.343
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
