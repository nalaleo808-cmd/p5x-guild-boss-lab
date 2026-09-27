// Plain multi-phase boss kept only as a test target. It was removed from the
// app's boss list on 2026-09-27; tests pass it through bossDefinitions.
export const shadowRuinTestBoss = Object.freeze({
  id: 'shadow_ruin', name: 'Shadow of Ruin', subtitle: 'Test fixture', level: 90,
  maxHp: 3250000, defense: 385, weakness: 'curse', resistance: 'physical', turnLimit: 8, scoreMultiplier: 1.12,
  phases: [
    { threshold: 1, name: 'Phase I · Iron Will', defense: 385 },
    { threshold: 0.65, name: 'Phase II · Fracture', defense: 340 },
    { threshold: 0.3, name: 'Phase III · Desperation', defense: 300 }
  ]
});
