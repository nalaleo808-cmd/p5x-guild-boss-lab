/**
 * One awareness value per existing character, shared by the editor and engine.
 * Only source-provided stat rows and already-modeled rank conditions are used.
 * This module does not invent perks or infer skill-level coefficients.
 */
export const AWARENESS_LEVELS = Object.freeze([0, 1, 2, 3, 4, 5, 6]);

const usableNumber = value => (typeof value === 'number' || typeof value === 'string')
  && String(value).trim() !== '' && Number.isFinite(Number(value));

export function normalizeAwareness(value, fallback = 6) {
  const resolved = usableNumber(value) ? Number(value) : usableNumber(fallback) ? Number(fallback) : 6;
  return Math.max(0, Math.min(6, Math.floor(resolved)));
}

export function resolveAwareness(unit = {}, loadout = {}) {
  const legacy = unit.slug === 'bui-cosmic' ? loadout.cosmicYui?.awareness : undefined;
  const value = usableNumber(loadout.awareness) ? loadout.awareness
    : usableNumber(legacy) ? legacy : unit.awareness;
  return normalizeAwareness(value);
}

export function setLoadoutAwareness(unit, loadout, value) {
  loadout.awareness = normalizeAwareness(value, resolveAwareness(unit, loadout));
  // Keep previously saved Cosmic Yui builds compatible with older packages.
  if (unit.slug === 'bui-cosmic' && loadout.cosmicYui) loadout.cosmicYui.awareness = loadout.awareness;
  return loadout.awareness;
}

export function loadoutForUnit(loadouts, unit) {
  return loadouts?.[unit.id] || (unit.sourceCharacterId && loadouts?.[unit.sourceCharacterId]) || {};
}

export function awarenessStatDefaults(unit, awareness, { sourceScale = false } = {}) {
  const rank = normalizeAwareness(awareness);
  const result = {};
  for (const key of ['maxHp', 'maxSp', 'attack', 'defense', 'speed']) {
    if (usableNumber(unit[key])) result[key] = Number(unit[key]);
  }
  const requested = unit.sourceStats?.[`a${rank}_lv80`];
  if (!requested) return result;
  // Imported stat values use an archived encounter scale. Preserve that scale
  // and its A6 defaults, applying only ratios from the source's actual rows.
  const basis = normalizeAwareness(unit.statBasisAwareness ?? unit.awareness);
  const reference = unit.sourceStats?.[`a${basis}_lv80`];
  for (const [key, sourceKey] of [['maxHp', 'HP'], ['attack', 'attack'], ['defense', 'defense']]) {
    const value = requested[sourceKey];
    if (!usableNumber(value)) continue;
    if (sourceScale) result[key] = Number(value);
    else if (rank !== basis && reference && Number(reference[sourceKey]) > 0 && usableNumber(unit[key])) {
      result[key] = Math.round(Number(unit[key]) * Number(value) / Number(reference[sourceKey]));
    }
  }
  return result;
}

export function awarenessCoverage(unit) {
  const levels = AWARENESS_LEVELS.filter(rank => unit.sourceStats?.[`a${rank}_lv80`]);
  return {
    sourcedLevels: levels,
    hasSourcedStats: levels.length > 0,
    note: levels.length
      ? 'Uses sourced rank-specific base stats when no manual value is entered, plus the awareness conditions already implemented for this character. Imported skill coefficients stay unchanged; unsupported perks and skill-level upgrades are not invented.'
      : 'This packaged kit has no sourced A0–A6 progression. The rank is saved and passed to the engine as a profile setting; no unsupported stat or ability bonuses are added.'
  };
}

/** Upgrade stored profiles without replacing explicitly entered stat values. */
export function migrateAwarenessLoadout(unit, defaults = {}, prior = {}, upgraded = prior) {
  const merged = { ...defaults, ...upgraded };
  if (prior.baseStats && typeof prior.baseStats === 'object' && !Array.isArray(prior.baseStats)) {
    merged.baseStats = { ...(upgraded.baseStats || {}), ...prior.baseStats };
  }
  setLoadoutAwareness(unit, merged, resolveAwareness(unit, prior));
  return merged;
}
