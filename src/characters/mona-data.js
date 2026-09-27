// Reviewed immutable upstream snapshot; runtime effects are explicitly partial.
export const characterResearch = {
  "slug": "mona",
  "name": "Morgana",
  "coverage": "source-backed-partial",
  "limitations": [
    "Partial mechanics, not a full-kit simulation. Source snapshot is community-maintained Lufelnet, not a live battle validation.",
    "Source tier 0 is the default; explicit loadouts[id].characterResearch.sourceTier takes precedence, followed by loadouts[id].sourceTier and unit.sourceTier. No automatic awareness tier inference.",
    "Stats default to sourced A0 level 80; equipment and potential bonuses are not silently included.",
    "Gentle Fist accuracy penalty before A6 is not applied; needs a hit/miss phase after cost payment.",
    "Chivalry party healing requires an ally attack trigger for skills, Highlight and Theurgy, not counted action end; omitted.",
    "Party SP cost reduction needs a cost quote hook covering Wonder persona skills and UI legality before payment; omitted.",
    "Highlight revival needs separate defeated-ally selection; A1/A2/A4, healing criticals and weapon effects are not applied.",
    "First skill is treated as a change from no previous skill; source does not specify this boundary."
  ],
  "sources": [
    {
      "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EB%AA%A8%EB%A5%B4%EA%B0%80%EB%82%98/skill.js",
      "file": "skill.js",
      "commit": "025fa21a111545d54a22044910935af3d8355a9d"
    },
    {
      "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EB%AA%A8%EB%A5%B4%EA%B0%80%EB%82%98/ritual.js",
      "file": "ritual.js",
      "commit": "025fa21a111545d54a22044910935af3d8355a9d"
    },
    {
      "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EB%AA%A8%EB%A5%B4%EA%B0%80%EB%82%98/base_stats.js",
      "file": "base_stats.js",
      "commit": "025fa21a111545d54a22044910935af3d8355a9d"
    },
    {
      "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EB%AA%A8%EB%A5%B4%EA%B0%80%EB%82%98/weapon.js",
      "file": "weapon.js",
      "commit": "025fa21a111545d54a22044910935af3d8355a9d"
    }
  ],
  "implemented": [
    "Sourced damage skills, party Attack-plus-flat healing and Gentle Fist HP cost/crit bonus",
    "Windswept; Chivalry cap, skill-change and critical-hit acquisition",
    "Healing Breeze removes one explicitly typed elemental ailment per living ally",
    "A6 Gentle Fist exposure"
  ],
  "missing": [
    "Gentle Fist accuracy penalty before A6 is not applied; needs a hit/miss phase after cost payment.",
    "Chivalry party healing requires an ally attack trigger for skills, Highlight and Theurgy, not counted action end; omitted.",
    "Party SP cost reduction needs a cost quote hook covering Wonder persona skills and UI legality before payment; omitted.",
    "Highlight revival needs separate defeated-ally selection; A1/A2/A4, healing criticals and weapon effects are not applied.",
    "First skill is treated as a change from no previous skill; source does not specify this boundary."
  ],
  "integration": {
    "afterAllyAttack": "Required for Chivalry: dispatch once after each successful ally skill, Highlight, or Theurgy damage attempt, before counted-action completion. Do not replace it with onActionEnd."
  }
};

export const characterDefinition = {
  "id": "mona",
  "slug": "mona",
  "name": "Morgana",
  "codename": "Mona",
  "role": "Medic",
  "element": "wind",
  "rarity": 5,
  "awareness": 0,
  "level": 80,
  "skillLevel": 10,
  "maxHp": 3300.03,
  "attack": 1100.01,
  "defense": 646.69,
  "maxSp": 100,
  "speed": 100,
  "crit": 0.05,
  "critMult": 1.5,
  "actionLimit": 1,
  "artwork": "/assets/characters/mona.webp",
  "sourceUrl": "https://lufel.net/en/character/mona/",
  "formulaStatus": "source-described",
  "mechanicsCoverage": "source-backed-partial",
  "sourceStats": {
    "a0_lv1": {
      "HP": 293.7,
      "SP": 100,
      "attack": 97.9,
      "defense": 57.55,
      "crit_rate": 5,
      "crit_mult": 150,
      "speed": 100
    },
    "awake7": {
      "crit_rate": 22.4
    },
    "a0_lv80": {
      "HP": 3300.03,
      "attack": 1100.01,
      "defense": 646.69
    },
    "a1_lv80": {
      "HP": 3359.23,
      "attack": 1120.01,
      "defense": 658.69
    },
    "a2_lv80": {
      "HP": 3419.23,
      "attack": 1140.01,
      "defense": 669.89
    },
    "a3_lv80": {
      "HP": 3478.43,
      "attack": 1159.21,
      "defense": 681.89
    },
    "a4_lv80": {
      "HP": 3537.63,
      "attack": 1179.21,
      "defense": 693.09
    },
    "a5_lv80": {
      "HP": 3596.83,
      "attack": 1199.21,
      "defense": 705.09
    },
    "a6_lv80": {
      "HP": 3656.83,
      "attack": 1219.21,
      "defense": 716.29
    }
  },
  "sourceEvidence": {
    "retrievedAt": "2026-09-12",
    "commit": "025fa21a111545d54a22044910935af3d8355a9d",
    "sources": [
      {
        "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EB%AA%A8%EB%A5%B4%EA%B0%80%EB%82%98/skill.js",
        "file": "skill.js",
        "commit": "025fa21a111545d54a22044910935af3d8355a9d"
      },
      {
        "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EB%AA%A8%EB%A5%B4%EA%B0%80%EB%82%98/ritual.js",
        "file": "ritual.js",
        "commit": "025fa21a111545d54a22044910935af3d8355a9d"
      },
      {
        "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EB%AA%A8%EB%A5%B4%EA%B0%80%EB%82%98/base_stats.js",
        "file": "base_stats.js",
        "commit": "025fa21a111545d54a22044910935af3d8355a9d"
      },
      {
        "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EB%AA%A8%EB%A5%B4%EA%B0%80%EB%82%98/weapon.js",
        "file": "weapon.js",
        "commit": "025fa21a111545d54a22044910935af3d8355a9d"
      }
    ]
  },
  "passives": [
    {
      "name": "Masked Gentleman",
      "element": "패시브",
      "description": "When healing with Chivalry, increase critical rate by 30.0%.\nWhen inflicting a critical hit, increase Chivalry's healing effect by 24.0% of Morgana's Attack + 720.",
      "cool": 0
    },
    {
      "name": "Morgana's Method",
      "element": "패시브",
      "description": "Decrease party's SP cost by 15.0%.",
      "cool": 0
    }
  ],
  "awarenessData": [
    {
      "level": 0,
      "name": "Morgana's Favor",
      "description": "When using a different skill than the previous skill, gain 1 Chivalry stack. This can stack up to 3 times.\nWhen an ally with less than 70% HP remaining attacks with a skill, Highlight, or Theurgy, activate a Resonance, spending 1 Chivalry stack to heal the party by 10% of Morgana's Attack + 150/225/300 (effect changes at Lv. 1/50/70, respectively)."
    },
    {
      "level": 1,
      "name": "Marvelous Pride",
      "description": "Add the following effect to Chivalry: Restore HP of allies with less than 50% HP remaining by 30% of Morgana's Attack."
    },
    {
      "level": 2,
      "name": "Black Cat Charm",
      "description": "When using Healing Breeze, increase HP recovery for main target by 33%."
    },
    {
      "level": 3,
      "name": "Grooming",
      "description": "Increase the skill levels of Healing Breeze and Thief Tactics by 3."
    },
    {
      "level": 4,
      "name": "Aftercare",
      "description": "Highlight Enhanced: When KO'd allies are revived, restore bonus HP equal to 60% of Morgana's Attack + 800."
    },
    {
      "level": 5,
      "name": "Airplane Ears Mode",
      "description": "Increase the skill levels of Missile Whirlwind and Gentle Fist by 3."
    },
    {
      "level": 6,
      "name": "Look, Treasure!",
      "description": "Remove Gentle Fist's decreased accuracy effect. Increase target's damage taken by 15% for 2 turns."
    }
  ],
  "weaponData": {
    "name": "Morgana",
    "weapon4-1": {
      "name": "Shamshir",
      "health": 1744.19,
      "attack": 581.37,
      "defense": 341.44,
      "description": "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%. When healing an ally with 80% or more HP, grant Moonlight. Moonlight: Increase HP by 10.0%/13.0%/13.0%/16.0%/16.0%/19.0%/19.0% and Attack by 4.0%/5.3%/5.3%/6.7%/6.7%/8.0%/8.0% for 2 turns."
    },
    "weapon4-2": {
      "name": "Headhunter Ladle",
      "health": 1902.74,
      "attack": 539.4,
      "defense": 341.44,
      "description": "Increase critical rate by 5.9%/5.9%/7.6%/7.6%/9.3%/9.3%/11.0%. When attacking with a skill, restore HP equal to 6.3%/8.0%/8.0%/9.7%/9.7%/11.4%/11.4% of Attack to the ally with the lowest HP. Also, 2.0%/3.0%/3.0%/4.0%/4.0%/5.0%/5.0% chance to inflict Forget on the target foe for 1 turn."
    },
    "weapon5-1": {
      "name": "Golden Legacy",
      "health": 2180.22,
      "attack": 726.72,
      "defense": 427.25,
      "description": "Increase critical rate by 18.0%/18.0%/23.4%/23.4%/28.8%/28.8%/34.2%. If a foe is critically hit with a skill, deal 10.0%/13.3%/13.3%/16.7%/16.7%/20.0%/20.0% of max HP as bonus damage (up to 100.0%/133.3%/133.3%/166.7%/166.7%/200.0%/200.0% of Attack). When using a healing skill, restore 9.0%/11.8%/11.8%/14.6%/14.6%/17.4%/17.4% of the target's max HP. If a skill misses, immediately gain Chivalry."
    }
  },
  "skills": [
    {
      "id": "mona-skill1",
      "slot": "S1",
      "name": "Missile Whirlwind",
      "element": "wind",
      "cost": 22,
      "cooldown": 0,
      "power": 1.464,
      "powerTiers": [
        1.464,
        1.614,
        1.554,
        1.704
      ],
      "target": "boss",
      "characterAction": "mona:S1",
      "formulaStatus": "source-described",
      "description": "Deal Wind damage to 1 foe equal to 146.4%/161.4%/155.4%/170.4% of Attack. Inflict Windswept on the foe for 2 turns. Chance to gain 1 Chivalry stack (chance is equal to current critical rate).",
      "note": "Deal Wind damage to 1 foe equal to 146.4%/161.4%/155.4%/170.4% of Attack. Inflict Windswept on the foe for 2 turns. Chance to gain 1 Chivalry stack (chance is equal to current critical rate)."
    },
    {
      "id": "mona-skill2",
      "slot": "S2",
      "name": "Healing Breeze",
      "element": "support",
      "cost": 33,
      "cooldown": 0,
      "power": 0,
      "powerTiers": [
        0,
        0,
        0,
        0
      ],
      "target": "party",
      "characterAction": "mona:S2",
      "formulaStatus": "source-described",
      "description": "Restore party's HP by 37.6%/37.6%/39.9%/39.9% of Morgana's Attack + 1069/1300/1315/1546, and heal 1 elemental ailment. When healing an elemental ailment, gain 1 Chivalry stack.",
      "note": "Restore party's HP by 37.6%/37.6%/39.9%/39.9% of Morgana's Attack + 1069/1300/1315/1546, and heal 1 elemental ailment. When healing an elemental ailment, gain 1 Chivalry stack."
    },
    {
      "id": "mona-skill3",
      "slot": "S3",
      "name": "Gentle Fist",
      "element": "physical",
      "cost": 0,
      "cooldown": 0,
      "power": 1.289,
      "powerTiers": [
        1.289,
        1.421,
        1.369,
        1.501
      ],
      "target": "boss",
      "characterAction": "mona:S3",
      "formulaStatus": "source-described",
      "description": "Decrease this skill's accuracy by 20%, increase critical rate by 30%, and deal Physical damage to 1 foe equal to 128.9%/142.1%/136.9%/150.1% of Attack. On a critical hit, gain 1 Chivalry stack.",
      "note": "Decrease this skill's accuracy by 20%, increase critical rate by 30%, and deal Physical damage to 1 foe equal to 128.9%/142.1%/136.9%/150.1% of Attack. On a critical hit, gain 1 Chivalry stack.",
      "hpCost": 12,
      "critBonus": 0.3
    }
  ],
  "highlightSkill": {
    "id": "mona-highlight",
    "slot": "HL",
    "name": "Highlight",
    "element": "wind",
    "cost": 0,
    "cooldown": 4,
    "power": 2.278,
    "powerTiers": [
      2.278,
      2.511,
      2.418,
      2.651
    ],
    "target": "boss",
    "characterAction": "mona:HL",
    "formulaStatus": "source-described",
    "description": "Deal Wind damage to 1 foe equal to 227.8%/251.1%/241.8%/265.1% of Attack, and revive 1 KO'd ally with 20% HP.",
    "note": "Deal Wind damage to 1 foe equal to 227.8%/251.1%/241.8%/265.1% of Attack, and revive 1 KO'd ally with 20% HP."
  }
};

export function sourceTier(engine, unit) {
  const loadout = engine.config?.loadouts?.[unit.id];
  const value = loadout?.characterResearch?.sourceTier ?? loadout?.sourceTier ?? unit.sourceTier ?? 0;
  if (!Number.isInteger(value) || value < 0 || value > 3) throw new RangeError('mona: sourceTier must be an integer from 0 through 3');
  return value;
}
