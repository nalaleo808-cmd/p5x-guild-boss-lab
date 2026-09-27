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
// Totals already include weapon, Revelation and static passives.
export const kotoneStatsPreset = Object.freeze({
  id: 'kotone-a5-vetri-2-character-details-2026-09-27',
  characterId: 'kotone-shiomi',
  label: 'Kotone Shiomi A5, Vetri Vel Muruga +2 character details',
  awareness: 5,
  weaponId: 'vetri-vel-muruga',
  enhancement: 2,
  baseStats: Object.freeze({
    attack: 5596,
    defense: 1745,
    maxHp: 7989,
    maxSp: 100,
    speed: 106.8,
    critRate: 35.4,
    critMult: 163.4,
    spRecovery: 47,
    technicalPrecision: 0,
    pierceRate: 2.2,
    downPoints: 0,
    ailmentAccuracy: 23.2,
    ailmentResistance: 0,
    damageBonus: 8.2,
    damageReduction: 16
  })
});

export const wavecatcherStatsPreset = Object.freeze({
  id: 'wavecatcher-a6-mermaid-dreamer-6-character-details-2026-09-27',
  characterId: 'lufel-recent-puppet-wavecatcher',
  label: 'Wavecatcher Miyu A6, Mermaid Dreamer level 6 character details',
  // Mermaid Dreamer: 779 Attack, 2259 HP, 391 Defense; its static stats and
  // +69% crit damage are in these totals. Passives are modeled in the engine.
  weaponId: 'mermaid-dreamer',
  weaponLevel: 6,
  baseStats: Object.freeze({
    attack: 4633,
    defense: 1629,
    maxHp: 8181,
    maxSp: 200,
    speed: 96,
    critRate: 26.7,
    critMult: 308.5,
    spRecovery: 247.5,
    technicalPrecision: 0,
    pierceRate: 9.9,
    downPoints: 0,
    ailmentAccuracy: 0,
    ailmentResistance: 0,
    damageBonus: 19.3,
    damageReduction: 0
  })
});

export const mikuStatsPreset = Object.freeze({
  id: 'miku-character-details-2026-09-27',
  characterId: 'lufel-recent-miku',
  label: 'Hatsune Miku character details',
  // Displayed Crit Mult 84.2% is below the 150% base, so it is not taken as a
  // total multiplier until confirmed. Unshown fields keep their prior values.
  unconfirmed: Object.freeze({ critMult: 84.2 }),
  baseStats: Object.freeze({
    attack: 5635,
    defense: 1715,
    maxHp: 9037,
    maxSp: 100,
    speed: 100,
    critRate: 30.6,
    spRecovery: 0,
    technicalPrecision: 0,
    pierceRate: 7.7
  })
});

export const jcStatsPreset = Object.freeze({
  id: 'jc-a6-wardens-judgement-6-character-details-2026-09-27',
  characterId: 'lufel-recent-j-c',
  label: "Justine & Caroline A6, Warden's Judgement level 6 character details",
  weaponId: 'wardens-judgement',
  weaponLevel: 6,
  baseStats: Object.freeze({
    attack: 4506,
    defense: 1877,
    maxHp: 8808,
    maxSp: 100,
    speed: 114,
    critRate: 42.7,
    critMult: 197.8,
    spRecovery: 0,
    technicalPrecision: 0,
    pierceRate: 20.7,
    downPoints: 0,
    ailmentAccuracy: 9.6,
    ailmentResistance: 0,
    damageBonus: 51.2,
    damageReduction: 0
  })
});

export const wonderStatsPreset = Object.freeze({
  id: 'wonder-dionysus-janosik-vasuki-character-details-2026-09-27',
  characterId: 'wonder',
  label: 'Wonder character details',
  personaNames: Object.freeze(['Dionysus', 'Janosik', 'Vasuki']),
  baseStats: Object.freeze({
    attack: 3628,
    defense: 2365,
    maxHp: 11200,
    maxSp: 100,
    speed: 109,
    critRate: 39.8,
    critMult: 190,
    spRecovery: 0,
    technicalPrecision: 0,
    pierceRate: 0,
    downPoints: 0,
    ailmentAccuracy: 80,
    ailmentResistance: 40,
    damageBonus: 0,
    damageReduction: 0
  })
});

export const liveStatsPresets = Object.freeze([kotoneStatsPreset, wavecatcherStatsPreset, mikuStatsPreset, jcStatsPreset, wonderStatsPreset]);

export function applyRecordedDefaultStats(characterId, loadout = {}) {
  const genericLive = liveStatsPresets.find(preset => preset !== kotoneStatsPreset && preset.characterId === characterId);
  if (genericLive && loadout.statsPresetId !== genericLive.id) {
    loadout = {
      ...loadout,
      baseStats: { ...loadout.baseStats, ...genericLive.baseStats },
      statsMode: 'equipped',
      ...(genericLive.weaponId ? { weaponId: genericLive.weaponId } : {}),
      ...(genericLive.weaponLevel ? { weaponLevel: genericLive.weaponLevel } : {}),
      statsPresetId: genericLive.id
    };
  }
  if (characterId === kotoneStatsPreset.characterId && loadout.statsPresetId !== kotoneStatsPreset.id) {
    const p = kotoneStatsPreset;
    return {
      ...loadout,
      awareness: p.awareness,
      weaponId: p.weaponId,
      enhancement: p.enhancement,
      statsMode: 'equipped',
      equippedTotalsFor: `${p.weaponId}+${p.enhancement}`,
      baseStats: { ...loadout.baseStats, ...p.baseStats },
      statsPresetId: p.id
    };
  }
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
