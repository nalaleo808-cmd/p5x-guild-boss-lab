// Equipped character-detail values transcribed from the user's screenshots.
// Percentages are stored as displayed; the engine converts them to fractions.
export const ichigoStatsPreset = Object.freeze({
  id: 'ichigo-character-details-2026-09-05',
  characterId: 'lufel-recent-berry',
  label: 'Ichigo Shikano character details',
  sourceImages: Object.freeze([
    'codex-clipboard-a1b23982-adaa-4170-8906-ef3f7190d76d.png',
    'codex-clipboard-9cbec272-a243-4a29-9f84-a2a28905a20d.png'
  ]),
  baseStats: Object.freeze({
    attack: 4927,
    defense: 1494,
    maxHp: 8634,
    maxSp: 100,
    speed: 96,
    critRate: 54.2,
    critMult: 235.5,
    spRecovery: 0,
    technicalPrecision: 0,
    pierceRate: 7.5,
    downPoints: 0,
    ailmentAccuracy: 3.1,
    ailmentResistance: 0,
    damageBonus: 55.9,
    damageReduction: 0
  })
});

export const berrySpPreset = Object.freeze({
  id: 'berry-sp-180-2026-09-05',
  characterId: ichigoStatsPreset.characterId,
  maxSp: 180,
  source: 'User-requested SP adjustment, 2026-09-05'
});

export const marianRevelationPreset = Object.freeze({
  id: 'marian-trust-prosperity-2026-09-05',
  characterId: 'lufel-recent-marian-beachflower',
  revelationMain: 'Trust',
  revelationSet: 'Prosperity',
  source: 'User-confirmed Hachiman battle loadout, 2026-09-05'
});

export const marianSpPreset = Object.freeze({
  id: 'marian-sp-180-2026-09-05',
  characterId: 'lufel-recent-marian-beachflower',
  maxSp: 180,
  source: 'User-requested SP adjustment, 2026-09-05'
});

export const wonderWeaponPreset = Object.freeze({
  id: 'wonder-cursed-ties-2026-09-05',
  weaponId: 'cursed-ties',
  weaponProfileId: 'cursed-ties-live-2026-09-05',
  source: 'Cursed Ties level 80 Forge Details read directly in the game, 2026-09-05'
});

// Equipped character-detail totals from the user's live screenshots, 2026-09-27.
// Totals already include weapon, Revelation and static passives. Applied once;
// later edits in Builds survive.
const signatureR6 = Object.freeze({ weapon: 'signature', refinement: 6, staticWeaponStatsIncluded: true });

export const kotoneStatsPreset = Object.freeze({
  id: 'kotone-a5-vetri-2-character-details-2026-09-27',
  characterId: 'kotone-shiomi',
  awareness: 5,
  kotone: Object.freeze({ weaponId: 'vetri-vel-muruga', enhancement: 2 }),
  baseStats: Object.freeze({ attack: 5596, defense: 1745, maxHp: 7989, maxSp: 100, speed: 106.8, critRate: 35.4, critMult: 163.4, spRecovery: 47, technicalPrecision: 0, pierceRate: 2.2, downPoints: 0, ailmentAccuracy: 23.2, ailmentResistance: 0, damageBonus: 8.2, damageReduction: 16 })
});

export const wavecatcherStatsPreset = Object.freeze({
  id: 'wavecatcher-a6-mermaid-dreamer-6-character-details-2026-09-27',
  characterId: 'lufel-recent-puppet-wavecatcher',
  awareness: 6,
  // Mermaid Dreamer: 779 Attack, 2259 HP, 391 Defense, +69% crit damage (in totals).
  characterResearch: signatureR6,
  baseStats: Object.freeze({ attack: 4633, defense: 1629, maxHp: 8181, maxSp: 200, speed: 96, critRate: 26.7, critMult: 308.5, spRecovery: 247.5, technicalPrecision: 0, pierceRate: 9.9, downPoints: 0, ailmentAccuracy: 0, ailmentResistance: 0, damageBonus: 19.3, damageReduction: 0 })
});

export const mikuStatsPreset = Object.freeze({
  id: 'miku-navigator-pt-effect-2026-09-27',
  characterId: 'navigator-miku',
  // Navigator panel. Her Pt Effect screen lists the exact party share, used
  // in place of 20% of the panel.
  // Revelation Integrity + Labor: the engine applies Labor's navigator 4-set and the Integrity + Labor per-attribute bonus.
  extraFields: Object.freeze({
    revelationMain: 'Integrity', revelationSet: 'Labor',
    navigatorShare: Object.freeze({ maxHp: 1808, attack: 1127, defense: 343, damageBonus: 7.5, critRate: 6.1, critMult: 16.8, pierceRate: 1.5 })
  }),
  baseStats: Object.freeze({ attack: 5635, defense: 1715, maxHp: 9037, maxSp: 100, speed: 100, critRate: 30.6, critMult: 84.2, spRecovery: 0, technicalPrecision: 0, pierceRate: 7.7 })
});

export const jcStatsPreset = Object.freeze({
  id: 'jc-a6-wardens-judgement-6-character-details-2026-09-27',
  characterId: 'lufel-recent-j-c',
  awareness: 6,
  // Warden's Judgement: Attack +57% is in totals.
  characterResearch: signatureR6,
  baseStats: Object.freeze({ attack: 4506, defense: 1877, maxHp: 8808, maxSp: 100, speed: 114, critRate: 42.7, critMult: 197.8, spRecovery: 0, technicalPrecision: 0, pierceRate: 20.7, downPoints: 0, ailmentAccuracy: 9.6, ailmentResistance: 0, damageBonus: 51.2, damageReduction: 0 })
});

export const wonderStatsPreset = Object.freeze({
  id: 'wonder-sahimochi-dionysus-yurlungur-skills-2026-09-27',
  characterId: 'wonder',
  // Battle trio from the live in-battle panel; Ice first sets Wonder's attribute.
  personaNames: Object.freeze(['Sahimochi-no-kami', 'Dionysus', 'Yurlungur']),
  // Equipped skills from the live Persona screens (2026-09-27), slot order.
  personaSkills: Object.freeze({
    'Sahimochi-no-kami': Object.freeze(['Ice Boost IV', 'Rebellion', 'Sonic Interference', 'Battle Acumen III', 'Agility Master II', "Warrior's Unity"]),
    Dionysus: Object.freeze(['Auto-Mataru IV', 'Rebellion', 'Universal Theoria', 'Auto-Maraku III', 'Agility Master II', "Warrior's Unity"]),
    Yurlungur: Object.freeze(['Elec Boost III', 'Shock Boost IV', 'Apt Pupil IV', 'Wild Thunder', 'Tarukaja'])
  }),
  // Ice Age: its +56% Attack is in the totals; Ancient Frost is modeled.
  wonderWeapon: Object.freeze({ weaponId: 'ice-age', weaponProfileId: null, weaponProcGranularity: null }),
  baseStats: Object.freeze({ attack: 3628, defense: 2365, maxHp: 11200, maxSp: 100, speed: 109, critRate: 39.8, critMult: 190, spRecovery: 0, technicalPrecision: 0, pierceRate: 0, downPoints: 0, ailmentAccuracy: 80, ailmentResistance: 40, damageBonus: 0, damageReduction: 0 })
});

export const liveStatsPresets = Object.freeze([kotoneStatsPreset, wavecatcherStatsPreset, mikuStatsPreset, jcStatsPreset, wonderStatsPreset]);

// Fields a live preset sets the first time it is applied. Returns null when
// the loadout already carries this preset.
export function liveStatsPresetFields(characterId, loadout = {}) {
  const preset = liveStatsPresets.find(item => item.characterId === characterId);
  if (!preset || loadout.statsPresetId === preset.id) return null;
  return {
    baseStats: { ...(loadout.baseStats || {}), ...preset.baseStats },
    statsMode: 'equipped',
    statsPresetId: preset.id,
    ...(preset.awareness != null ? { awareness: preset.awareness } : {}),
    ...(preset.characterResearch ? { characterResearch: { ...(loadout.characterResearch || {}), ...preset.characterResearch } } : {}),
    ...(preset.extraFields || {}),
    ...(preset.wonderWeapon ? { ...preset.wonderWeapon, weaponPresetId: wonderWeaponPreset.id } : {}),
    ...(preset.kotone ? { ...preset.kotone, equippedTotalsFor: `${preset.kotone.weaponId}+${preset.kotone.enhancement}` } : {})
  };
}

export function applyRecordedDefaultStats(characterId, loadout = {}) {
  const live = liveStatsPresetFields(characterId, loadout);
  if (live) loadout = { ...loadout, ...live };
  if (characterId === marianSpPreset.characterId && loadout.spPresetId !== marianSpPreset.id) {
    loadout = {
      ...loadout,
      baseStats: { ...loadout.baseStats, maxSp: marianSpPreset.maxSp },
      spPresetId: marianSpPreset.id
    };
  }
  if (characterId === 'wonder' && loadout.weaponPresetId !== wonderWeaponPreset.id) {
    return {
      ...loadout,
      weaponId: wonderWeaponPreset.weaponId,
      weaponProfileId: wonderWeaponPreset.weaponProfileId,
      weaponProcGranularity: null,
      weaponPresetId: wonderWeaponPreset.id
    };
  }
  if (characterId === marianRevelationPreset.characterId && loadout.revelationPresetId !== marianRevelationPreset.id) {
    // Apply the confirmed loadout once; preserve later deliberate card changes.
    return {
      ...loadout,
      revelationMain: marianRevelationPreset.revelationMain,
      revelationSet: marianRevelationPreset.revelationSet,
      revelationPresetId: marianRevelationPreset.id
    };
  }
  if (characterId !== ichigoStatsPreset.characterId) return loadout;
  // Upgrade older saved builds once. Later user edits survive subsequent loads.
  if (loadout.statsPresetId !== ichigoStatsPreset.id) {
    loadout = {
      ...loadout,
      baseStats: { ...loadout.baseStats, ...ichigoStatsPreset.baseStats },
      statsMode: 'equipped',
      statsPresetId: ichigoStatsPreset.id
    };
  }
  if (loadout.spPresetId !== berrySpPreset.id) {
    loadout = {
      ...loadout,
      baseStats: { ...loadout.baseStats, maxSp: berrySpPreset.maxSp },
      spPresetId: berrySpPreset.id
    };
  }
  return loadout;
}
