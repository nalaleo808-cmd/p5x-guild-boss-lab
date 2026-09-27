// Reviewed immutable upstream snapshot; runtime effects are explicitly partial.
export const characterResearch = {
  "slug": "rin",
  "name": "Yaoling Li",
  "coverage": "source-backed-partial",
  "limitations": [
    "Partial mechanics, not a full-kit simulation. Source snapshot is community-maintained Lufelnet, not a live battle validation.",
    "Source tier 0 is the default; explicit loadouts[id].characterResearch.sourceTier takes precedence, followed by loadouts[id].sourceTier and unit.sourceTier. No automatic awareness tier inference.",
    "Stats default to sourced A0 level 80; equipment and potential bonuses are not silently included.",
    "Red Spider Lily's two-hit exposure and the KR-pinned Highlight next-hit exposure consume only after an actual per-target damage packet; Forget chance and duration are still omitted.",
    "Soup is tracked but not spent: enhanced skills, Forget application/accuracy, A2/A4/A6 and weapons are not applied.",
    "Memory gain is modeled once at owner turn start; exact extra-action interaction needs confirmation. Speed scaling uses continuous ratios, not an invented rounding rule."
  ],
  "sources": [
    {
      "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EC%95%BC%EC%98%A4%EB%A7%81/skill.js",
      "file": "skill.js",
      "commit": "025fa21a111545d54a22044910935af3d8355a9d"
    },
    {
      "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EC%95%BC%EC%98%A4%EB%A7%81/ritual.js",
      "file": "ritual.js",
      "commit": "025fa21a111545d54a22044910935af3d8355a9d"
    },
    {
      "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EC%95%BC%EC%98%A4%EB%A7%81/base_stats.js",
      "file": "base_stats.js",
      "commit": "025fa21a111545d54a22044910935af3d8355a9d"
    },
    {
      "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EC%95%BC%EC%98%A4%EB%A7%81/weapon.js",
      "file": "weapon.js",
      "commit": "025fa21a111545d54a22044910935af3d8355a9d"
    }
  ],
  "implemented": [
    "Correct base Yaoling identity and Curse element, sourced skill coefficients/costs/targets",
    "Speed-based Attack passive; Memory conversion and A1 starting Soup",
    "Underworld Ferry Defense reduction and Memory per foe hit",
    "Flowers of Naihe exposure only for an already present spiritual ailment",
    "Flowers debuff-conditioned damage, above-50%-HP Curse aura, Red Spider Lily two-hit exposure and Highlight next-hit exposure through per-target hooks"
  ],
  "missing": [
    "Red Spider Lily's two-hit exposure and the KR-pinned Highlight next-hit exposure consume only after an actual per-target damage packet; Forget chance and duration are still omitted.",
    "Soup is tracked but not spent: enhanced skills, Forget application/accuracy, A2/A4/A6 and weapons are not applied.",
    "Memory gain is modeled once at owner turn start; exact extra-action interaction needs confirmation. Speed scaling uses continuous ratios, not an invented rounding rule."
  ],
  "integration": {
    "beforeDamage": "Dispatch once per target before formula evaluation.",
    "onDamage": "Dispatch once for each actual damage packet after Down resolution so both temporary exposures consume from the same packet."
  }
};

export const characterDefinition = {
  "id": "rin",
  "slug": "rin",
  "name": "Yaoling Li",
  "codename": "Rin",
  "role": "Saboteur",
  "element": "curse",
  "rarity": 5,
  "awareness": 0,
  "level": 80,
  "skillLevel": 10,
  "maxHp": 3180.02,
  "attack": 1089.98,
  "defense": 633.37,
  "maxSp": 100,
  "speed": 106,
  "crit": 0.05,
  "critMult": 1.5,
  "actionLimit": 1,
  "artwork": "/assets/characters/rin.webp",
  "sourceUrl": "https://lufel.net/en/character/rin/",
  "formulaStatus": "source-described",
  "mechanicsCoverage": "source-backed-partial",
  "sourceStats": {
    "a0_lv1": {
      "HP": 283.02,
      "SP": 100,
      "attack": 97.01,
      "defense": 56.37,
      "crit_rate": 5,
      "crit_mult": 150,
      "speed": 106
    },
    "awake7": {
      "speed": 124.89
    },
    "a0_lv80": {
      "HP": 3180.02,
      "attack": 1089.98,
      "defense": 633.37
    },
    "a1_lv80": {
      "HP": 3237.62,
      "attack": 1109.98,
      "defense": 644.57
    },
    "a2_lv80": {
      "HP": 3294.42,
      "attack": 1129.18,
      "defense": 656.57
    },
    "a3_lv80": {
      "HP": 3352.02,
      "attack": 1149.18,
      "defense": 667.77
    },
    "a4_lv80": {
      "HP": 3408.82,
      "attack": 1168.38,
      "defense": 678.97
    },
    "a5_lv80": {
      "HP": 3466.42,
      "attack": 1188.38,
      "defense": 690.17
    },
    "a6_lv80": {
      "HP": 3523.22,
      "attack": 1207.58,
      "defense": 702.17
    }
  },
  "sourceEvidence": {
    "retrievedAt": "2026-09-12",
    "commit": "025fa21a111545d54a22044910935af3d8355a9d",
    "sources": [
      {
        "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EC%95%BC%EC%98%A4%EB%A7%81/skill.js",
        "file": "skill.js",
        "commit": "025fa21a111545d54a22044910935af3d8355a9d"
      },
      {
        "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EC%95%BC%EC%98%A4%EB%A7%81/ritual.js",
        "file": "ritual.js",
        "commit": "025fa21a111545d54a22044910935af3d8355a9d"
      },
      {
        "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EC%95%BC%EC%98%A4%EB%A7%81/base_stats.js",
        "file": "base_stats.js",
        "commit": "025fa21a111545d54a22044910935af3d8355a9d"
      },
      {
        "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EC%95%BC%EC%98%A4%EB%A7%81/weapon.js",
        "file": "weapon.js",
        "commit": "025fa21a111545d54a22044910935af3d8355a9d"
      }
    ]
  },
  "passives": [
    {
      "name": "Kung Fu Mastery",
      "element": "패시브",
      "description": "Increase Attack by 1% for every 2 points of Yaoling's Speed (up to 90.0%).",
      "cool": 0
    },
    {
      "name": "Up to Chance",
      "element": "패시브",
      "description": "When attacking a foe with more than 50% HP, increase foe's Curse damage taken by 30.0%.",
      "cool": 0
    }
  ],
  "awarenessData": [
    {
      "level": 0,
      "name": "Goddess of Oblivion",
      "description": "On Yaoling's action, gain 1 Memory stack for every 10 points of Speed (up to 18 stacks per turn). When Memory reaches 40 stacks, spend all stacks to gain 1 Meng Po Soup stack.\nWhen using a skill, spend 1 Meng Po Soup stack for a 50% chance to inflict Forget on 1 foe for 1 turn, and enhance effects of Flowers of Naihe and Lion Dance of Oblivion."
    },
    {
      "level": 1,
      "name": "Road to Rebirth",
      "description": "At the start of battle, gain 1 Meng Po Soup stack."
    },
    {
      "level": 2,
      "name": "Soul Reaper",
      "description": "Increase Attack by 10% for each debuff inflicted on foes for 2 turns. Stacks up to 5 times."
    },
    {
      "level": 3,
      "name": "Beyond the Bend",
      "description": "Increase the skill levels of Lion Dance of Oblivion and Thief Tactics by 3."
    },
    {
      "level": 4,
      "name": "Training Results",
      "description": "Highlight Enhanced: Increase damage taken effect by 20%. Inflict Curse on all foes for 2 turns."
    },
    {
      "level": 5,
      "name": "Meng Po's Medicine",
      "description": "Increase the skill levels of Underworld Ferry and Flowers of Naihe by 3."
    },
    {
      "level": 6,
      "name": "Wisps of Crimson",
      "description": "When spending Meng Po Soup, increase party's Curse damage by 20% for 1 turn. Also, 60% chance to gain 1 Meng Po Soup stack. This effect won't activate again on the next turn."
    }
  ],
  "weaponData": {
    "name": "Yaoling Li",
    "weapon4-1": {
      "name": "Sunstaff",
      "health": 1680.44,
      "attack": 575.95,
      "defense": 334.73,
      "description": "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%. After inflicting a debuff, increase Speed by 8/11/11/14/14/17/17 for 2 turns. Stacks up to 2 times. Gain 2 stacks at the start of battle."
    },
    "weapon5-1": {
      "name": "Infinite Moment",
      "health": 2100.91,
      "attack": 720.11,
      "defense": 418.4,
      "description": "Increase Speed by 15.0/15.0/20.0/20.0/25.0/25.0/30.0. After attacking a foe with a skill, inflict Waters of Oblivion on the main target. Waters of Oblivion: Increase foe's damage taken by 1.2%/1.6%/1.6%/2.0%/2.0%/2.4%/2.4% for every 10 of Yaoling's Speed for 1 turn. Increase Yaoling's Speed by 15 for 2 turns. After spending Meng Po Soup to use a skill on a foe, inflict this effect on all foes."
    }
  },
  "skills": [
    {
      "id": "rin-skill1",
      "slot": "S1",
      "name": "Underworld Ferry",
      "element": "curse",
      "cost": 20,
      "cooldown": 0,
      "power": 0.732,
      "powerTiers": [
        0.732,
        0.807,
        0.777,
        0.852
      ],
      "target": "all_enemies",
      "characterAction": "rin:S1",
      "formulaStatus": "source-described",
      "description": "Deal Curse damage to all foes equal to 73.2%/80.7%/77.7%/85.2% of Attack. Decrease foes' Defense by 3% for every 10 points of Yaoling's Speed for 2 turns (up to 49.7%/54.8%/53.5%/58.6%). Also gain 4 Memory stacks for each foe attacked.",
      "note": "Deal Curse damage to all foes equal to 73.2%/80.7%/77.7%/85.2% of Attack. Decrease foes' Defense by 3% for every 10 points of Yaoling's Speed for 2 turns (up to 49.7%/54.8%/53.5%/58.6%). Also gain 4 Memory stacks for each foe attacked."
    },
    {
      "id": "rin-skill2",
      "slot": "S2",
      "name": "Flowers of Naihe",
      "element": "curse",
      "cost": 22,
      "cooldown": 0,
      "power": 0.976,
      "powerTiers": [
        0.976,
        1.076,
        1.036,
        1.136
      ],
      "target": "boss",
      "characterAction": "rin:S2",
      "formulaStatus": "source-described",
      "description": "Deal Curse damage to 1 foe equal to 97.6%/107.6%/103.6%/113.6% of Attack. If foe has a debuff, increase damage by 20%. When spending Meng Po Soup, inflict Forget on the main target for 2 turns.\nIf foe is inflicted with Forget or another spiritual ailment, increase their damage taken by 2% for every 10 points of Yaoling's Speed (up to 32.3%/32.3%/34.3%/34.3%) for 1 turn.",
      "note": "Deal Curse damage to 1 foe equal to 97.6%/107.6%/103.6%/113.6% of Attack. If foe has a debuff, increase damage by 20%. When spending Meng Po Soup, inflict Forget on the main target for 2 turns.\nIf foe is inflicted with Forget or another spiritual ailment, increase their damage taken by 2% for every 10 points of Yaoling's Speed (up to 32.3%/32.3%/34.3%/34.3%) for 1 turn."
    },
    {
      "id": "rin-skill3",
      "slot": "S3",
      "name": "Lion Dance of Oblivion",
      "element": "curse",
      "cost": 24,
      "cooldown": 0,
      "power": 0.781,
      "powerTiers": [
        0.781,
        0.861,
        0.829,
        0.909
      ],
      "target": "all_enemies",
      "characterAction": "rin:S3",
      "formulaStatus": "source-described",
      "description": "Deal Curse damage to all foes equal to 78.1%/86.1%/82.9%/90.9% of Attack, and inflict Red Spider Lily for 2 turns. When spending Meng Po Soup, double Red Spider Lily's damage increase.\nRed Spider Lily: Increase foes' damage taken by 3% for every 10 points of Yaoling's Speed (up to 48.5%/53.5%/52.2%/57.2%). Lasts for 2 turns, or until damage is taken 2 times.",
      "note": "Deal Curse damage to all foes equal to 78.1%/86.1%/82.9%/90.9% of Attack, and inflict Red Spider Lily for 2 turns. When spending Meng Po Soup, double Red Spider Lily's damage increase.\nRed Spider Lily: Increase foes' damage taken by 3% for every 10 points of Yaoling's Speed (up to 48.5%/53.5%/52.2%/57.2%). Lasts for 2 turns, or until damage is taken 2 times."
    }
  ],
  "highlightSkill": {
    "id": "rin-highlight",
    "slot": "HL",
    "name": "Highlight",
    "element": "curse",
    "cost": 0,
    "cooldown": 4,
    "power": 1.464,
    "powerTiers": [
      1.464,
      1.614,
      1.554,
      1.704
    ],
    "target": "all_enemies",
    "characterAction": "rin:HL",
    "formulaStatus": "source-described",
    "description": "Deal Curse damage to all foes equal to 146.4%/161.4%/155.4%/170.4% of Attack, and increase target's damage taken by 48.8%/53.8%/51.8%/56.8%. 30% chance to inflict Forget on foes for 2 turns.",
    "note": "Deal Curse damage to all foes equal to 146.4%/161.4%/155.4%/170.4% of Attack, and increase target's damage taken by 48.8%/53.8%/51.8%/56.8%. 30% chance to inflict Forget on foes for 2 turns."
  }
};

export function sourceTier(engine, unit) {
  const loadout = engine.config?.loadouts?.[unit.id];
  const value = loadout?.characterResearch?.sourceTier ?? loadout?.sourceTier ?? unit.sourceTier ?? 0;
  if (!Number.isInteger(value) || value < 0 || value > 3) throw new RangeError('rin: sourceTier must be an integer from 0 through 3');
  return value;
}
