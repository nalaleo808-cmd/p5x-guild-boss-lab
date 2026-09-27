const requireNonNegativeInteger = (value, field) => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${field} must be a non-negative safe integer`);
  }
  return value;
};

export const DREAMSCAPE_RESULT_FORMULA_EVIDENCE = Object.freeze({
  id: 'hachiman-nightmare-result-2026-09-04',
  status: 'verified_observed_result_composition',
  expression: '(foeDefensePoints + turnsSurvivedBonus) * difficultyBonus',
  scope: 'One Hachiman NIGHTMaRe Multidimensional Dreamscape result screen',
  source: 'LIVE-BATTLE-CHECK-2026-09-04.md',
  limitation: 'This does not define how Foe Defense Points or Turns Survived Bonus accumulate.'
});

export const DREAMSCAPE_SURVIVAL_HUD_OBSERVATIONS = Object.freeze([
  Object.freeze({ attackTurnsLeft: 5, displayedMultiplier: 0.5 }),
  Object.freeze({ attackTurnsLeft: 4, displayedMultiplier: 1 }),
  Object.freeze({ attackTurnsLeft: 3, displayedMultiplier: 1.5 }),
  Object.freeze({ attackTurnsLeft: 2, displayedMultiplier: 2 }),
  Object.freeze({ attackTurnsLeft: 1, displayedMultiplier: 2 }),
  Object.freeze({ attackTurnsLeft: 0, displayedMultiplier: 2 })
]);

export const MULTIDIMENSIONAL_DREAMSCAPE_TURN_SCORE_MULTIPLIERS = Object.freeze([
  Object.freeze({ normalTurn: 1, multiplier: 0.5 }),
  Object.freeze({ normalTurn: 2, multiplier: 1 }),
  Object.freeze({ normalTurn: 3, multiplier: 1.5 }),
  Object.freeze({ normalTurn: 4, multiplier: 2, continuesFromNormalTurn: 4 })
]);

export function getMultidimensionalDreamscapeTurnScoreMultiplier(normalTurn) {
  if (typeof normalTurn !== 'number' || !Number.isInteger(normalTurn) || normalTurn < 1) return null;
  if (normalTurn === 1) return 0.5;
  if (normalTurn === 2) return 1;
  if (normalTurn === 3) return 1.5;
  return 2;
}

// Backward-compatible alias for callers that used the original Hachiman-only name.
export const HACHIMAN_DREAMSCAPE_TURN_SCORE_MULTIPLIERS = MULTIDIMENSIONAL_DREAMSCAPE_TURN_SCORE_MULTIPLIERS;
export const getHachimanDreamscapeTurnScoreMultiplier = getMultidimensionalDreamscapeTurnScoreMultiplier;

export function calculateDreamscapeResult({
  foeDefensePoints = 0,
  turnsSurvivedBonus = 0,
  difficultyBonus = 1
} = {}) {
  const foePoints = requireNonNegativeInteger(foeDefensePoints, 'foeDefensePoints');
  const survivedBonus = requireNonNegativeInteger(turnsSurvivedBonus, 'turnsSurvivedBonus');
  const difficulty = requireNonNegativeInteger(difficultyBonus, 'difficultyBonus');
  const result = (foePoints + survivedBonus) * difficulty;
  if (!Number.isSafeInteger(result)) throw new RangeError('Dreamscape result exceeds the safe integer range');
  return result;
}

export function reconcileDreamscapeResult(observation = {}) {
  const calculatedFinalScore = calculateDreamscapeResult(observation);
  const observedFinalScore = requireNonNegativeInteger(observation.finalScore, 'finalScore');
  const difference = observedFinalScore - calculatedFinalScore;
  return Object.freeze({
    calculatedFinalScore,
    observedFinalScore,
    difference,
    matches: difference === 0,
    formulaEvidence: DREAMSCAPE_RESULT_FORMULA_EVIDENCE
  });
}

export function getObservedDreamscapeMultiplier(attackTurnsLeft) {
  if (typeof attackTurnsLeft !== 'number' || !Number.isInteger(attackTurnsLeft)) return null;
  return DREAMSCAPE_SURVIVAL_HUD_OBSERVATIONS
    .find(observation => observation.attackTurnsLeft === attackTurnsLeft)?.displayedMultiplier ?? null;
}
