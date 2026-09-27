// Reviewed immutable upstream snapshot; runtime effects are explicitly partial.
export const characterResearch = {
  "slug": "joker",
  "name": "Ren Amamiya",
  "coverage": "source-backed-partial",
  "limitations": [
    "Partial mechanics, not a full-kit simulation. Source snapshot is community-maintained Lufelnet, not a live battle validation.",
    "Source tier 0 is the default; explicit loadouts[id].characterResearch.sourceTier takes precedence, followed by loadouts[id].sourceTier and unit.sourceTier. No automatic awareness tier inference.",
    "Stats default to sourced A0 level 80; equipment and potential bonuses are not silently included.",
    "At three Will, Joker receives an extra action after his normal action. It spends three Will on completion and preserves timed effects. Extra-action shared Highlight and cooldown semantics still need live confirmation.",
    "A2 extra-action cost and SP-dependent Attack, A6 pursuit, Curse ailment, weapons and skill-level awareness upgrades are not applied."
  ],
  "sources": [
    {
      "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EB%A0%8C/skill.js",
      "file": "skill.js",
      "commit": "025fa21a111545d54a22044910935af3d8355a9d"
    },
    {
      "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EB%A0%8C/ritual.js",
      "file": "ritual.js",
      "commit": "025fa21a111545d54a22044910935af3d8355a9d"
    },
    {
      "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EB%A0%8C/base_stats.js",
      "file": "base_stats.js",
      "commit": "025fa21a111545d54a22044910935af3d8355a9d"
    },
    {
      "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EB%A0%8C/weapon.js",
      "file": "weapon.js",
      "commit": "025fa21a111545d54a22044910935af3d8355a9d"
    }
  ],
  "implemented": [
    "Sourced S1/S2/S3/Highlight coefficients, costs and targets",
    "Will of Rebellion skill gains, five-stack cap, unique below-60%-HP foe bookkeeping",
    "Resistance Attack buff and A4 Highlight stack gain",
    "A1 main/secondary target damage and S3 debuff/extra-action conditional damage through per-target damage hooks"
  ],
  "missing": [
    "At three Will, Joker receives an extra action after his normal action. It spends three Will on completion and preserves timed effects. Extra-action shared Highlight and cooldown semantics still need live confirmation.",
    "A2 extra-action cost and SP-dependent Attack, A6 pursuit, Curse ailment, weapons and skill-level awareness upgrades are not applied.",
    "Curse ailment, weapons and skill-level awareness upgrades are evidence only."
  ],
  "integration": {
    "beforeDamage": "Dispatch once per target before the damage formula. The prepared skill carries jokerMainTargetId and jokerExtraAction.",
    "extraAction": "After a normal action is consumed, call getExtraActionRequest. If it returns a request, retain Joker as actor without beginActorTurn, SP recovery, owner cooldown ticking, navigator cooldown decrement, action-number increment, or an extra turnActionsUsed increment. Call onExtraActionStart immediately before the extra action, then dispatch onActionEnd with isExtraAction true exactly once before clearing the scheduler marker. Timed effects preserve naturally because no status tick runs. Shared Highlight, score, and ally-counted-listener handling remain parent engine policy and are not asserted by this module."
  }
};

export const characterDefinition = {
  "id": "joker",
  "slug": "joker",
  "name": "Ren Amamiya",
  "codename": "Joker",
  "role": "Sweeper",
  "element": "curse",
  "rarity": 5,
  "awareness": 0,
  "level": 80,
  "skillLevel": 10,
  "maxHp": 3270.01,
  "attack": 1179.97,
  "defense": 560,
  "maxSp": 100,
  "speed": 102,
  "crit": 0.05,
  "critMult": 1.5,
  "actionLimit": 1,
  "artwork": "/assets/characters/joker.webp",
  "sourceUrl": "https://lufel.net/en/character/joker/",
  "formulaStatus": "source-described",
  "mechanicsCoverage": "source-backed-partial",
  "sourceStats": {
    "a0_lv1": {
      "HP": 291.03,
      "SP": 100,
      "attack": 105.02,
      "defense": 49.84,
      "crit_rate": 5,
      "crit_mult": 150,
      "speed": 102
    },
    "awake7": {
      "attack_per": 29
    },
    "a0_lv80": {
      "HP": 3270.01,
      "attack": 1179.97,
      "defense": 560
    },
    "a1_lv80": {
      "HP": 3329.21,
      "attack": 1201.57,
      "defense": 570.4
    },
    "a2_lv80": {
      "HP": 3387.61,
      "attack": 1222.37,
      "defense": 580
    },
    "a3_lv80": {
      "HP": 3446.81,
      "attack": 1243.97,
      "defense": 590.4
    },
    "a4_lv80": {
      "HP": 3505.21,
      "attack": 1264.77,
      "defense": 600
    },
    "a5_lv80": {
      "HP": 3564.41,
      "attack": 1286.37,
      "defense": 610.4
    },
    "a6_lv80": {
      "HP": 3622.81,
      "attack": 1307.17,
      "defense": 620.8
    },
    "a0_lv100": {
      "HP": 4045.47,
      "attack": 1459.79,
      "defense": 692.8
    },
    "a1_lv100": {
      "HP": 4119.47,
      "attack": 1486.79,
      "defense": 705.8
    },
    "a2_lv100": {
      "HP": 4192.47,
      "attack": 1512.79,
      "defense": 717.8
    },
    "a3_lv100": {
      "HP": 4266.47,
      "attack": 1539.79,
      "defense": 730.8
    },
    "a4_lv100": {
      "HP": 4339.47,
      "attack": 1565.79,
      "defense": 742.8
    },
    "a5_lv100": {
      "HP": 4413.47,
      "attack": 1592.79,
      "defense": 755.8
    },
    "a6_lv100": {
      "HP": 4486.47,
      "attack": 1618.79,
      "defense": 768.8
    }
  },
  "sourceEvidence": {
    "retrievedAt": "2026-09-12",
    "commit": "025fa21a111545d54a22044910935af3d8355a9d",
    "sources": [
      {
        "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EB%A0%8C/skill.js",
        "file": "skill.js",
        "commit": "025fa21a111545d54a22044910935af3d8355a9d"
      },
      {
        "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EB%A0%8C/ritual.js",
        "file": "ritual.js",
        "commit": "025fa21a111545d54a22044910935af3d8355a9d"
      },
      {
        "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EB%A0%8C/base_stats.js",
        "file": "base_stats.js",
        "commit": "025fa21a111545d54a22044910935af3d8355a9d"
      },
      {
        "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EB%A0%8C/weapon.js",
        "file": "weapon.js",
        "commit": "025fa21a111545d54a22044910935af3d8355a9d"
      }
    ]
  },
  "passives": [
    {
      "name": "Resistance",
      "element": "패시브",
      "description": "Increase Attack by 18.0% for each Will of Rebellion stack.",
      "cool": 0
    },
    {
      "name": "Adverse Resolve",
      "element": "패시브",
      "description": "Increase damage on extra actions by 72.0%.",
      "cool": 0
    }
  ],
  "awarenessData": [
    {
      "level": 0,
      "name": "Rebellion Resurgence",
      "description": "At the end of Ren's action, gain 1 Will of Rebellion stack for each foe with less than 60% HP (up to 5 stacks).\nWhen Will of Rebellion reaches 3 stacks, gain an extra action.\nAn additional extra action cannot be gained during the extra action. (Extra actions do not affect the duration of effects with turn limits).\nAt the end of an extra action, spend 3 Will of Rebellion stacks.\n*Can gain 1 Will of Rebellion stack per foe per battle."
    },
    {
      "level": 1,
      "name": "Calling Card",
      "description": "Increase skill damage to the main target by 30%, and increase skill damage to other targets by 10%."
    },
    {
      "level": 2,
      "name": "Meditate",
      "description": "On an extra action, decrease SP cost of skills by 80%. When Ren's SP is above 60%, increase Attack by 50%."
    },
    {
      "level": 3,
      "name": "Secret Maneuvers",
      "description": "Increase the skill levels of Arsène's Chains and Thief Tactics by 3."
    },
    {
      "level": 4,
      "name": "Highway Robbery",
      "description": "Highlight Enhanced: Increase number of Will of Rebellion stacks gained to 3."
    },
    {
      "level": 5,
      "name": "Moonlit Evening",
      "description": "Increase the skill levels of Trickster's Plunder and Phantom Omen by 3."
    },
    {
      "level": 6,
      "name": "Merciless Pursuit",
      "description": "After taking an extra action, if there are foes with below 25% HP, deal damage to those foes equal to up to 250% of Ren's Attack (once per enemy per battle).\nAfter using a skill on an extra action, deal Curse damage equal to 50% of Attack to all foes."
    }
  ],
  "weaponData": {
    "name": "Ren Amamiya",
    "weapon4-1": {
      "name": "Machete",
      "health": 1728.63,
      "attack": 623.35,
      "defense": 296.11,
      "description": "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%. When attacking a foe with an ailment, increase Attack by 19.1%/24.8%/24.8%/30.5%/30.5%/36.2%/36.2%."
    },
    "weapon5-1": {
      "name": "Phoenix Dagger",
      "health": 2160.41,
      "attack": 779.61,
      "defense": 370,
      "description": "Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%. After gaining Will of Rebellion, increase Ren's Curse damage by 10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0% for 2 turns. Stacks up to 3 times. At 3 or more Will of Rebellion stacks, increase Ren's next damage by 23.0%/30.0%/30.0%/37.0%/37.0%/44.0%/44.0%."
    }
  },
  "skills": [
    {
      "id": "joker-skill1",
      "slot": "S1",
      "name": "Trickster's Plunder",
      "element": "curse",
      "cost": 19,
      "cooldown": 0,
      "power": 0.83,
      "powerTiers": [
        0.83,
        0.915,
        0.881,
        0.966
      ],
      "target": "all_enemies",
      "characterAction": "joker:S1",
      "formulaStatus": "source-described",
      "description": "Deal Curse damage to all foes equal to 83.0%/91.5%/88.1%/96.6% of Attack. 20% chance to inflict Curse. Also gain 1 Will of Rebellion stack.",
      "note": "Deal Curse damage to all foes equal to 83.0%/91.5%/88.1%/96.6% of Attack. 20% chance to inflict Curse. Also gain 1 Will of Rebellion stack."
    },
    {
      "id": "joker-skill2",
      "slot": "S2",
      "name": "Phantom Omen",
      "element": "curse",
      "cost": 19,
      "cooldown": 0,
      "power": 0.976,
      "powerTiers": [
        0.976,
        1.076,
        1.036,
        1.136
      ],
      "target": "boss",
      "characterAction": "joker:S2",
      "formulaStatus": "source-described",
      "description": "Deal Curse damage to 1 foe equal to 97.6%/107.6%/103.6%/113.6% of Attack. When only 1 foe is present, gain 2 Will of Rebellion stacks.",
      "note": "Deal Curse damage to 1 foe equal to 97.6%/107.6%/103.6%/113.6% of Attack. When only 1 foe is present, gain 2 Will of Rebellion stacks."
    },
    {
      "id": "joker-skill3",
      "slot": "S3",
      "name": "Arsène's Chains",
      "element": "curse",
      "cost": 22,
      "cooldown": 0,
      "power": 0.742,
      "powerTiers": [
        0.742,
        0.818,
        0.787,
        0.863
      ],
      "target": "all_enemies",
      "characterAction": "joker:S3",
      "formulaStatus": "source-described",
      "description": "Deal Curse damage to all foes equal to 74.2%/81.8%/78.7%/86.3% of Attack. When used on an extra action, increase damage by 25%. When attacking foes with debuffs, increase damage by 25% more.",
      "note": "Deal Curse damage to all foes equal to 74.2%/81.8%/78.7%/86.3% of Attack. When used on an extra action, increase damage by 25%. When attacking foes with debuffs, increase damage by 25% more."
    }
  ],
  "highlightSkill": {
    "id": "joker-highlight",
    "slot": "HL",
    "name": "Highlight",
    "element": "curse",
    "cost": 0,
    "cooldown": 4,
    "power": 2.05,
    "powerTiers": [
      2.05,
      2.26,
      2.176,
      2.386
    ],
    "target": "all_enemies",
    "characterAction": "joker:HL",
    "formulaStatus": "source-described",
    "description": "Deal Curse damage to all foes equal to 205.0%/226.0%/217.6%/238.6% of Attack, and gain 1 Will of Rebellion stack.",
    "note": "Deal Curse damage to all foes equal to 205.0%/226.0%/217.6%/238.6% of Attack, and gain 1 Will of Rebellion stack."
  }
};

export function sourceTier(engine, unit) {
  const loadout = engine.config?.loadouts?.[unit.id];
  const value = loadout?.characterResearch?.sourceTier ?? loadout?.sourceTier ?? unit.sourceTier ?? 0;
  if (!Number.isInteger(value) || value < 0 || value > 3) throw new RangeError('joker: sourceTier must be an integer from 0 through 3');
  return value;
}
