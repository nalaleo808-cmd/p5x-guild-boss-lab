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

// Every MLD result screen recorded so far fits one formula, and its Turns
// Survived Bonus times the Difficulty Bonus is always 1,000,000:
//   Hachiman  (258,098,432 + 125,000) x 8 = 2,065,787,456
//   Surt      (1,729,515,136 + 250,000) x 4 = 6,919,060,544
//   Yatsufusa (723,875,072 + 125,000) x 8 = 5,792,000,576
// A new MLD boss uses this default until its own result screen is recorded.
export const MLD_SURVIVAL_BONUS_TIMES_DIFFICULTY = 1_000_000;

export const MLD_RESULT_SCREENS = Object.freeze([
  Object.freeze({ bossId: 'hachiman', foeDefensePoints: 258_098_432, turnsSurvivedBonus: 125_000, difficultyBonus: 8, finalScore: 2_065_787_456 }),
  Object.freeze({ bossId: 'surt', foeDefensePoints: 1_729_515_136, turnsSurvivedBonus: 250_000, difficultyBonus: 4, finalScore: 6_919_060_544 }),
  Object.freeze({ bossId: 'yatsufusa', foeDefensePoints: 723_875_072, turnsSurvivedBonus: 125_000, difficultyBonus: 8, finalScore: 5_792_000_576 })
]);

// Resolves how an MLD boss is scored. A recorded turnsSurvivedBonus wins; an
// MLD boss without one derives it from its Difficulty Bonus; a boss marked
// dreamscapeScoreVerified: false, or without a Difficulty Bonus, stays a
// damage-only preview.
export function resolveDreamscapeSurvivalBonus(boss = {}) {
  if (boss.dreamscapeScoreVerified === false) return { bonus: null, source: 'preview_opt_out' };
  const recorded = Number(boss.turnsSurvivedBonus);
  if (Number.isSafeInteger(recorded) && recorded >= 0 && boss.turnsSurvivedBonus !== null && boss.turnsSurvivedBonus !== undefined) {
    return { bonus: recorded, source: 'result_screen' };
  }
  const isMldBoss = boss.defaultMode === 'multidimensional' || (boss.supportedModes || []).includes('multidimensional');
  const difficulty = Number(boss.difficultyBonus);
  if (!isMldBoss || !Number.isInteger(difficulty) || difficulty < 1 || MLD_SURVIVAL_BONUS_TIMES_DIFFICULTY % difficulty !== 0) {
    return { bonus: null, source: 'unknown' };
  }
  return { bonus: MLD_SURVIVAL_BONUS_TIMES_DIFFICULTY / difficulty, source: 'derived_from_difficulty' };
}

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
