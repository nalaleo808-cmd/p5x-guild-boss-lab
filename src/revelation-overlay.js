// Revelation data published after the generated Lufel catalog snapshot.
// The generated catalog stays read-only; this overlay is applied on top of it.
// Source: Lufel revelation page (Strife and Nativity cards), captured 2026-09-26.
//
// Strife 2-set: Fire damage +10% (already structured in the catalog).
// Strife 4-set: Attack +15%; a further +15% Attack against a Fire-weak enemy.
// Nativity + Strife: at battle start or at the start of an extra action, party
//   critical damage +10%; permanent, stacks up to 2 times (engine: triggerNativityStrife).
// Nativity + Power (Justine & Caroline Desire Level +5%) is listed for reference only.

export const revelationMainSubAdditions = Object.freeze({ Nativity: Object.freeze(['Strife']) });

export const revelationSetCombatAdditions = Object.freeze({
  Strife: Object.freeze({ attackPercent: 0.15, weakElementAttack: Object.freeze({ element: 'fire', value: 0.15 }) })
});

export const revelationCombinationNotes = Object.freeze({
  'Nativity+Strife': 'Battle start or start of an extra action: party critical damage +10%, permanent, up to 2 stacks.',
  'Nativity+Power': 'When equipped by Justine & Caroline: Desire Level +5% (reference only).'
});

export function withRevelationMainOverlay(mains) {
  return mains.map(main => {
    const extra = revelationMainSubAdditions[main.name];
    return extra ? { ...main, compatibleSubs: [...new Set([...main.compatibleSubs, ...extra])] } : main;
  });
}

export function withRevelationSetOverlay(sets) {
  return sets.map(set => {
    const combat = revelationSetCombatAdditions[set.name];
    const mains = Object.entries(revelationMainSubAdditions).filter(([, subs]) => subs.includes(set.name)).map(([main]) => main);
    if (!combat && !mains.length) return set;
    return { ...set, combat: { ...(set.combat || {}), ...(combat || {}) },
      compatibleMains: [...new Set([...(set.compatibleMains || []), ...mains])] };
  });
}
