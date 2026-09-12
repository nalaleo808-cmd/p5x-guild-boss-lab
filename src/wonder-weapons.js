// Wonder weapon records are intentionally bounded to observed live profiles.
// Do not extrapolate level, forge, or rank values from a single readback.
export const CURSED_TIES_WEAPON_ID = 'cursed-ties';
export const CURSED_TIES_LIVE_PROFILE_ID = 'cursed-ties-live-2026-09-05';

export const WONDER_WEAPON_CATALOG = Object.freeze({
  [CURSED_TIES_WEAPON_ID]: Object.freeze({
    id: CURSED_TIES_WEAPON_ID,
    name: 'Cursed Ties',
    holderId: 'wonder',
    profiles: Object.freeze({
      [CURSED_TIES_LIVE_PROFILE_ID]: Object.freeze({
        id: CURSED_TIES_LIVE_PROFILE_ID,
        provenance: 'direct_game_gui_2026-09-05',
        observed: Object.freeze({ level: 80, userRank: 6 }),
        // Weapon-panel component values. Wonder's full equipped totals are not
        // known, so the engine stores rather than injects these values.
        weaponStats: Object.freeze({ maxHp: 1926, attack: 654, defense: 396 }),
        forge: Object.freeze({
          name: 'Evil Eye',
          ailmentAccuracyBonus: 0.623,
          trigger: Object.freeze({
            element: 'curse',
            chance: 0.7,
            triggerActor: 'ally',
            holderEligibility: 'unverified',
            procGranularity: null
          }),
          evilEye: Object.freeze({
            id: 'cursed_ties_evil_eye',
            name: 'EVIL EYE',
            duration: 3,
            defenseDown: 0.229,
            curseDamageTaken: 0.147
          }),
          holderAttackAgainstEvilEye: 0.33
        })
      })
    })
  })
});

export function getWonderWeaponDefinition(weaponId) {
  return WONDER_WEAPON_CATALOG[weaponId] || null;
}

export function getWonderWeaponProfile(weaponId, profileId) {
  const weapon = getWonderWeaponDefinition(weaponId);
  return weapon?.profiles?.[profileId] || null;
}
