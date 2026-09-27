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

export function applyRecordedDefaultStats(characterId, loadout = {}) {
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
