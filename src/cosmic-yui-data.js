// Verified numeric snapshot; see data/cosmic-yui-source-2026-09-12.json.
export const COSMIC_YUI_ID = "lufel-recent-bui-cosmic";
export const COSMIC_YUI_SOURCE = {
  "retrievedAt": "2026-09-12",
  "pageUrl": "https://lufel.net/en/character/bui-cosmic/",
  "repository": "https://github.com/absolroot/lufelnet",
  "sourceKey": "YUI·스텔라",
  "files": {
    "skill.js": "b10b2dbb4f4dfe6babf622027ec3676968b11c35",
    "ritual.js": "a1e826101e370d318e8d8c415bd7b7b6aa3d2fad",
    "base_stats.js": "74ef5abad1d9d56d6f29648bba3bd397133cb04d",
    "weapon.js": "489df0d4547849ed9b128385e4347e212672caad",
    "review.js": "adfe1863d6fb7e095e300ac967eb2a317cfe32e5"
  },
  "method": "English upstream source read through GitHub; site page is client-rendered. Numeric source data retained; descriptions are condensed. The uploaded fork is older and uses Prism/Smash/Mobilize names and superseded S1/S2/S3 coefficients."
};
export const COSMIC_YUI_WEAPONS = {
  "signature": {
    "name": "Starlight Decimators",
    "stats": {
      "HP": 2279.27,
      "attack": 773.01,
      "defense": 383.2
    },
    "critRate": [
      0.181,
      0.181,
      0.235,
      0.235,
      0.289,
      0.289,
      0.343
    ],
    "summonAttack": [
      0.107,
      0.138,
      0.138,
      0.169,
      0.169,
      0.2,
      0.2
    ],
    "vegOutCritDamage": [
      0.328,
      0.428,
      0.428,
      0.528,
      0.528,
      0.628,
      0.628
    ]
  },
  "four-star": {
    "name": "Sprouting Voyagers",
    "stats": {
      "HP": 1823.43,
      "attack": 618.71,
      "defense": 306.25
    },
    "attack": [
      0.12,
      0.12,
      0.16,
      0.16,
      0.2,
      0.2,
      0.24
    ],
    "resonanceVegOutAttack": [
      0.22,
      0.29,
      0.29,
      0.36,
      0.36,
      0.43,
      0.43
    ]
  }
};
export const COSMIC_YUI_AWARENESS = [
  {
    "level": 0,
    "name": "Vegetable Avatar",
    "description": "Eggplant: +1 energy after a normal skill. Potato: +15% own All-Out Attack damage. Mushroom: 4.5% Brainwash chance for 1 turn on skill/All-Out damage. Asparagus: heal own HP for 1% of damage, capped at 1000 per activation."
  },
  {
    "level": 1,
    "name": "Veggie Knight Rounds",
    "description": "Start with all 4 knight types and maximum energy. Critical damage +8% per knight, capped at 5. Start Potato Yellow, change to Eggplant Purple on the first own turn."
  },
  {
    "level": 2,
    "name": "Seed Potato Knight",
    "description": "Gain an additional unspendable Potato Knight. Harvest Havoc grants 10 percentage points more Potato Power. Start with Potato Power for 2 turns."
  },
  {
    "level": 3,
    "name": "Veggie Knight Master",
    "description": "Veggie Knights, Go! and Veg-Out Attack skill levels +3. Included in the selected source coefficient; no additional numeric multiplier is invented."
  },
  {
    "level": 4,
    "name": "Cyber Farmer",
    "description": "Highlight grants Attack +35% for 4 turns."
  },
  {
    "level": 5,
    "name": "Starlight Fest",
    "description": "Harvest Fest and Thief Tactics skill levels +3. Included in the selected source coefficient; no additional numeric multiplier is invented."
  },
  {
    "level": 6,
    "name": "Prismatic Vegetables",
    "description": "All four color abilities apply simultaneously. Huge Harvest is permanent from battle start. Harvest Havoc triggers after every ally ends their action. Active Veggie Knights, Go! summons one extra Potato Knight."
  }
];
export const COSMIC_YUI_COEFFICIENTS = Object.freeze({
  harvest: [1.208, 1.332, 1.283, 1.406],
  havoc: [.935, 1.031, .992, 1.088],
  assembleAttack: [.293, .323, .311, .341],
  assembleCrit: [.117, .129, .124, .136],
  mobilize: [1.302, 1.435, 1.382, 1.515],
  knight: [.293, .323, .311, .341],
  spentPotato: [.244, .269, .259, .284],
  potatoPower: [.146, .161, .155, .170],
  spores: [.195, .215, .207, .227],
  heal: [976, 1076, 1036, 1136],
  highlight: [4.392, 4.842, 4.662, 5.112]
});
export const COSMIC_KNIGHT_ORDER = Object.freeze(['eggplant', 'potato', 'mushroom', 'asparagus']);
export const COSMIC_YUI_LIMITATIONS = Object.freeze([
  'Cosmic Yui uses current Lufel source data, not a calibrated live-battle replay. The unspecified extra party All-Out Attack coefficient and Brainwash chance/accuracy interaction are excluded.',
  'Cosmic Yui timing model: capped summons are skipped in source order; A1 energy resolves after all battle-start passives; color changes precede end-action Harvest Havoc. A2 seed potato is additional to the regular four-potato cap. These boundary rules need live confirmation.',
  'Lower-awareness color selection is modeled as one free choice before the normal action. Energy is checked at cast boundaries; Asparagus self-healing is capped per cast. Four-star conditional Attack lasts two owner turns after Resonance. These details need live confirmation.',
  'Automatic Veg-Out divides each attack coefficient across the targets present when it starts; defense and affinity then apply per target. Exact split/critical behavior and Highlight-specific Havoc rules beyond one same-target strike need live confirmation.'
]);
export function normalizeCosmicYuiRecord(raw) {
  const c = COSMIC_YUI_COEFFICIENTS;
  // Source refresh must not silently combine changed tooltip numbers with the
  // pinned, reviewed runtime coefficients. A changed source requires review.
  for (const [key, expected] of [['skill1', c.harvest], ['skill2', c.assembleAttack], ['skill3', c.mobilize], ['skill_highlight', c.highlight]]) {
    const match = String(raw.skills?.[key]?.description || '').match(/([\d.]+)%\s*\/\s*([\d.]+)%\s*\/\s*([\d.]+)%\s*\/\s*([\d.]+)%/);
    if (!match || expected.some((value, index) => Math.abs(value - Number(match[index + 1]) / 100) > 1e-8)) {
      throw new Error(`Cosmic Yui ${key}: source coefficients differ from the reviewed 2026-09-12 snapshot. Update the numeric adapter and tests before importing.`);
    }
  }
  const tiers = [c.harvest, [0, 0, 0, 0], c.mobilize];
  const keys = ['skill1', 'skill2', 'skill3'];
  return {
    id: COSMIC_YUI_ID, slug: 'bui-cosmic', sourceKey: raw.sourceKey,
    name: 'Cosmic Yui', codename: 'Cosmic Yui', aliases: ['BUI·Cosmic', 'YUI·Prism', 'YUI·Stellar', 'Cosmic Smash'],
    role: 'Assassin', element: 'nuclear', persona: 'Apseudes (Cosmic)', accent: '#6be1cd', rarity: 5,
    awareness: 6, skillLevel: 13, releaseOrder: 21,
    maxHp: Math.round(raw.stats.a6_lv80.HP / 4.5), attack: Math.round(raw.stats.a6_lv80.attack / 4.6),
    defense: Math.round(raw.stats.a6_lv80.defense / 4.6), maxSp: 100, speed: 96, crit: .05, critMult: 1.5,
    maxAmmo: 6, actionLimit: 1, gunPower: .56,
    artwork: '/assets/characters/bui-cosmic-goofy.png', avatar: '/assets/characters/bui-cosmic-avatar.webp',
    formulaStatus: 'source-described', mechanicsCoverage: 'source-modeled-with-explicit-boundaries',
    sourceUrl: raw.pageUrl, sourceStats: raw.stats, sourceEvidence: raw.sourceEvidence || COSMIC_YUI_SOURCE,
    passives: [raw.skills.passive1, raw.skills.passive2], awarenessData: COSMIC_YUI_AWARENESS, weaponData: COSMIC_YUI_WEAPONS,
    recommendedRevelations: { main: [], sets: [] },
    skills: keys.map((key, i) => ({
      id: `${COSMIC_YUI_ID}-${key}`, slot: `S${i + 1}`, name: raw.skills[key].name,
      element: i === 1 ? 'support' : 'nuclear', cost: Number(raw.skills[key].sp), cooldown: Number(raw.skills[key].cool),
      target: i === 1 ? 'self' : 'boss', power: tiers[i][3], powerTiers: tiers[i],
      cosmicAction: ['harvest', 'assemble', 'mobilize'][i],
      ...(i === 1 ? { freeAction: true } : {}),
      description: raw.skills[key].description, note: raw.skills[key].description, formulaStatus: 'source-described'
    })),
    highlightSkill: {
      id: `${COSMIC_YUI_ID}-highlight`, slot: 'HL', name: 'Cosmic Yui Highlight', element: 'nuclear',
      cost: 0, cooldown: 0, target: 'boss', power: c.highlight[3], powerTiers: c.highlight,
      cosmicAction: 'highlight', description: raw.skills.skill_highlight.description,
      note: raw.skills.skill_highlight.description, formulaStatus: 'source-described'
    }
  };
}
