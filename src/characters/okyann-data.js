// Reviewed immutable upstream snapshot; runtime effects are explicitly partial.
export const characterResearch = {
  "slug": "okyann",
  "name": "Kayo Tomiyama",
  "coverage": "source-backed-partial",
  "limitations": [
    "Partial mechanics, not a full-kit simulation. Source snapshot is community-maintained Lufelnet, not a live battle validation.",
    "Source tier 0 is the default; explicit loadouts[id].characterResearch.sourceTier takes precedence, followed by loadouts[id].sourceTier and unit.sourceTier. No automatic awareness tier inference.",
    "Stats default to sourced A0 level 80; equipment and potential bonuses are not silently included.",
    "Navigator skill hooks must be dispatched by stepNavigator. Existing generic cooldown decrement owns the ally-action clock; do not also decrement in character hooks.",
    "Random elemental ailment, Outdated Slang, A4 Highlight/Theurgy, A6 Encore and weapons need separate events or remain omitted.",
    "Retro elemental-ailment multiplier needs per-target damage hook; do not multiply all outgoing damage by 1.5.",
    "Navigator 15% stat transfer is omitted until attribute scope and equipped-stat inclusion are verified.",
    "Pulsating Rhythm uses one refreshed two-turn stack group, capped at three; independent-stack expiry is not resolved by source.",
    "Opening preparation follows KR/CN 4/8/8 action text; EN cooldown fields are zero but descriptions specify 4/8/8."
  ],
  "sources": [
    {
      "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EC%B9%B4%EC%9A%94/skill.js",
      "file": "skill.js",
      "commit": "025fa21a111545d54a22044910935af3d8355a9d"
    },
    {
      "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EC%B9%B4%EC%9A%94/ritual.js",
      "file": "ritual.js",
      "commit": "025fa21a111545d54a22044910935af3d8355a9d"
    },
    {
      "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EC%B9%B4%EC%9A%94/base_stats.js",
      "file": "base_stats.js",
      "commit": "025fa21a111545d54a22044910935af3d8355a9d"
    },
    {
      "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EC%B9%B4%EC%9A%94/weapon.js",
      "file": "weapon.js",
      "commit": "025fa21a111545d54a22044910935af3d8355a9d"
    }
  ],
  "implemented": [
    "Three correct navigator skills, preparation/cooldown counts 4/8/8",
    "Club flat Attack and ailment accuracy; Intermission SP; Retro base damage and capped Attack scaling",
    "Beat gain and four-Beat Pulsating Rhythm; A1 opening buffs and A2 refund"
  ],
  "missing": [
    "Navigator skill hooks must be dispatched by stepNavigator. Existing generic cooldown decrement owns the ally-action clock; do not also decrement in character hooks.",
    "Random elemental ailment, Outdated Slang, A4 Highlight/Theurgy, A6 Encore and weapons need separate events or remain omitted.",
    "Retro elemental-ailment multiplier needs per-target damage hook; do not multiply all outgoing damage by 1.5.",
    "Navigator 15% stat transfer is omitted until attribute scope and equipped-stat inclusion are verified.",
    "Pulsating Rhythm uses one refreshed two-turn stack group, capped at three; independent-stack expiry is not resolved by source.",
    "Opening preparation follows KR/CN 4/8/8 action text; EN cooldown fields are zero but descriptions specify 4/8/8."
  ],
  "integration": {
    "navigator": "Pass selected actions through beforeNavigatorSkill and afterNavigatorSkill. The generic ally-action cooldown clock remains the sole cooldown owner."
  }
};

export const characterDefinition = {
  "id": "okyann",
  "slug": "okyann",
  "name": "Kayo Tomiyama",
  "codename": "Okyann",
  "role": "Elucidator",
  "element": "support",
  "rarity": 4,
  "awareness": 0,
  "level": 80,
  "skillLevel": 10,
  "maxHp": 2655.42,
  "attack": 787.7,
  "defense": 479.97,
  "maxSp": 100,
  "speed": 100,
  "crit": 0,
  "critMult": 0,
  "actionLimit": 1,
  "artwork": "/assets/characters/okyann.webp",
  "sourceUrl": "https://lufel.net/en/character/okyann/",
  "formulaStatus": "source-described",
  "mechanicsCoverage": "source-backed-partial",
  "sourceStats": {
    "a0_lv1": {
      "HP": 236.3,
      "SP": 100,
      "attack": 70.09,
      "defense": 42.72,
      "crit_rate": 0,
      "crit_mult": 0,
      "speed": 100
    },
    "awake7": {
      "attack_per": 21.8
    },
    "a0_lv80": {
      "HP": 2655.42,
      "attack": 787.7,
      "defense": 479.97
    },
    "a1_lv80": {
      "HP": 2685.82,
      "attack": 796.5,
      "defense": 485.57
    },
    "a2_lv80": {
      "HP": 2717.02,
      "attack": 806.1,
      "defense": 491.17
    },
    "a3_lv80": {
      "HP": 2747.42,
      "attack": 814.9,
      "defense": 496.77
    },
    "a4_lv80": {
      "HP": 2777.82,
      "attack": 823.7,
      "defense": 502.37
    },
    "a5_lv80": {
      "HP": 2808.22,
      "attack": 833.3,
      "defense": 507.97
    },
    "a6_lv80": {
      "HP": 2839.42,
      "attack": 842.1,
      "defense": 513.57
    }
  },
  "sourceEvidence": {
    "retrievedAt": "2026-09-12",
    "commit": "025fa21a111545d54a22044910935af3d8355a9d",
    "sources": [
      {
        "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EC%B9%B4%EC%9A%94/skill.js",
        "file": "skill.js",
        "commit": "025fa21a111545d54a22044910935af3d8355a9d"
      },
      {
        "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EC%B9%B4%EC%9A%94/ritual.js",
        "file": "ritual.js",
        "commit": "025fa21a111545d54a22044910935af3d8355a9d"
      },
      {
        "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EC%B9%B4%EC%9A%94/base_stats.js",
        "file": "base_stats.js",
        "commit": "025fa21a111545d54a22044910935af3d8355a9d"
      },
      {
        "url": "https://github.com/absolroot/lufelnet/blob/025fa21a111545d54a22044910935af3d8355a9d/data/characters/%EC%B9%B4%EC%9A%94/weapon.js",
        "file": "weapon.js",
        "commit": "025fa21a111545d54a22044910935af3d8355a9d"
      }
    ]
  },
  "passives": [
    {
      "name": "Toe-Tapping",
      "element": "패시브",
      "description": "For every 4 Beat stacks gained, inflict 1 random elemental ailment on the foe with the highest remaining HP.",
      "cool": 0
    },
    {
      "name": "Outdated Slang",
      "element": "패시브",
      "description": "When an ally inflicts an elemental ailment on a foe, increase that ally's damage by 15% for 2 turns. Also, 21% chance to grant 1 Beat stack.",
      "cool": 0
    }
  ],
  "awarenessData": [
    {
      "level": 0,
      "name": "Fever Time",
      "description": "When using a skill, gain Beat stacks. When Beat stacks reach 4 or more, activate a Resonance, spending 4 Beat stacks to grant 1 Pulsating Rhythm stack to all allies. When allies have Pulsating Rhythm, increase Attack by 10%/15%/20%, Defense by 10%/15%/20% and ailment accuracy by 5%/7.5%/10% based on Tomiyama's level (effect increases at level 1/50/70). Lasts for 2 turns. Stacks up to 3 times, and effects increase based on number of stacks."
    },
    {
      "level": 1,
      "name": "Finish with a Smile",
      "description": "At the start of battle, gain 2 Beat stacks, and increase party's ailment accuracy by 35% for 1 turn."
    },
    {
      "level": 2,
      "name": "Disco Ball",
      "description": "After granting Pulsating Rhythm, 20% chance to gain 1 Beat stack."
    },
    {
      "level": 3,
      "name": "Pop and Show It",
      "description": "Increase the skill levels of Club Okyann and Intermission by 2."
    },
    {
      "level": 4,
      "name": "Queen of the Stage",
      "description": "When an ally uses a Highlight or Theurgy, 67% chance to gain 1 Beat stack."
    },
    {
      "level": 5,
      "name": "Raise the Roof",
      "description": "Increase the skill level of Retro Dance Number by 2."
    },
    {
      "level": 6,
      "name": "Hey, DJ!",
      "description": "After activating Pulsating Rhythm, 25% chance to activate Encore, granting 1 additional Pulsating Rhythm.\nEncore will not activate consecutively."
    }
  ],
  "weaponData": {
    "name": "Kayo Tomiyama",
    "weapon4-1": {
      "name": "Emerald Charmer",
      "health": 1870.83,
      "attack": 554.96,
      "defense": 338.09,
      "description": "Increase Attack by 12.0%/12.0%/16.0%/16.0%/20.0%/20.0%/24.0%. After using a support skill, 43.0%/56.0%/56.0%/69.0%/69.0%/82.0%/82.0% chance to gain 1 Beat stack."
    },
    "weapon5-1": {
      "name": "Retro Disco Style",
      "health": 2338.77,
      "attack": 693.7,
      "defense": 422.82,
      "description": "Increase Attack by 30.0%/30.0%/39.0%/39.0%/48.0%/48.0%/57.0%. After granting Pulsating Rhythm, 41.0%/54.0%/54.0%/67.0%/67.0%/80.0%/80.0% chance to gain 1 Beat stack. Increase buffs from Pulsating Rhythm by 26.0%/34.0%/34.0%/42.0%/42.0%/50.0%/50.0% more."
    }
  },
  "skills": [
    {
      "id": "okyann-skill1",
      "slot": "S1",
      "name": "Club Okyann",
      "element": "support",
      "cost": 0,
      "cooldown": 4,
      "power": 0,
      "powerTiers": [
        0,
        0,
        0,
        0
      ],
      "target": "party",
      "characterAction": "okyann:S1",
      "formulaStatus": "source-described",
      "description": "Increase party's Attack by 12% of Tomiyama's Attack for 1 turn (up to 4500/4950/5400/5850 of Attack), increase ailment accuracy by 35.0%/38.5%/37.8%/41.3%, and gain 1 Beat stack.\nCooldown Time: 4 ally actions.",
      "note": "Increase party's Attack by 12% of Tomiyama's Attack for 1 turn (up to 4500/4950/5400/5850 of Attack), increase ailment accuracy by 35.0%/38.5%/37.8%/41.3%, and gain 1 Beat stack.\nCooldown Time: 4 ally actions.",
      "cooldownClock": "ally_action",
      "initialCooldown": 4
    },
    {
      "id": "okyann-skill2",
      "slot": "S2",
      "name": "Intermission",
      "element": "support",
      "cost": 0,
      "cooldown": 8,
      "power": 0,
      "powerTiers": [
        0,
        0,
        0,
        0
      ],
      "target": "party",
      "characterAction": "okyann:S2",
      "formulaStatus": "source-described",
      "description": "Restore party's SP by 22/27/26/31, and grant 3 Beat stacks.\nCooldown Time: 8 ally actions.",
      "note": "Restore party's SP by 22/27/26/31, and grant 3 Beat stacks.\nCooldown Time: 8 ally actions.",
      "cooldownClock": "ally_action",
      "initialCooldown": 8
    },
    {
      "id": "okyann-skill3",
      "slot": "S3",
      "name": "Retro Dance Number",
      "element": "support",
      "cost": 0,
      "cooldown": 8,
      "power": 0,
      "powerTiers": [
        0,
        0,
        0,
        0
      ],
      "target": "party",
      "characterAction": "okyann:S3",
      "formulaStatus": "source-described",
      "description": "Increase party's damage by 10.0%/11.0%/10.8%/11.8% for 3 turns. Increase damage by 1% for every 225 of Tomiyama's Attack (up to 4500/4950/5400/5850 of Attack).\nAlso increase damage dealt to foes with an elemental ailment by 1.5 times and gain 2 Beat stacks.\nCooldown Time: 8 ally actions.",
      "note": "Increase party's damage by 10.0%/11.0%/10.8%/11.8% for 3 turns. Increase damage by 1% for every 225 of Tomiyama's Attack (up to 4500/4950/5400/5850 of Attack).\nAlso increase damage dealt to foes with an elemental ailment by 1.5 times and gain 2 Beat stacks.\nCooldown Time: 8 ally actions.",
      "cooldownClock": "ally_action",
      "initialCooldown": 8
    }
  ],
  "isNavigator": true
};

export function sourceTier(engine, unit) {
  const loadout = engine.config?.loadouts?.[unit.id];
  const value = loadout?.characterResearch?.sourceTier ?? loadout?.sourceTier ?? unit.sourceTier ?? 0;
  if (!Number.isInteger(value) || value < 0 || value > 3) throw new RangeError('okyann: sourceTier must be an integer from 0 through 3');
  return value;
}
