import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDreamscapeResult,
  DREAMSCAPE_RESULT_FORMULA_EVIDENCE,
  DREAMSCAPE_SURVIVAL_HUD_OBSERVATIONS,
  getObservedDreamscapeMultiplier,
  reconcileDreamscapeResult
} from '../src/mode-scoring.js';
import {
  bosses,
  multidimensionalDreamscapeEvidence,
  recordedNightmareBenchmark
} from '../src/data.js';

test('observed Hachiman Dreamscape result reconciles exactly', () => {
  const observation = multidimensionalDreamscapeEvidence.observedRun.result;
  assert.equal(calculateDreamscapeResult(observation), 2_065_787_456);
  assert.deepEqual(reconcileDreamscapeResult(observation), {
    calculatedFinalScore: 2_065_787_456,
    observedFinalScore: 2_065_787_456,
    difference: 0,
    matches: true,
    formulaEvidence: DREAMSCAPE_RESULT_FORMULA_EVIDENCE
  });
});

test('reconciliation reports mismatches without changing the verified formula', () => {
  const reconciliation = reconcileDreamscapeResult({
    foeDefensePoints: 100,
    turnsSurvivedBonus: 25,
    difficultyBonus: 2,
    finalScore: 249
  });
  assert.equal(reconciliation.calculatedFinalScore, 250);
  assert.equal(reconciliation.difference, -1);
  assert.equal(reconciliation.matches, false);
});

test('result calculator rejects values that were not displayed non-negative integers', () => {
  assert.throws(() => calculateDreamscapeResult({ foeDefensePoints: -1 }), /foeDefensePoints/);
  assert.throws(() => calculateDreamscapeResult({ foeDefensePoints: 1.5 }), /foeDefensePoints/);
  assert.throws(() => calculateDreamscapeResult({ foeDefensePoints: '1' }), /foeDefensePoints/);
  assert.throws(() => calculateDreamscapeResult({ foeDefensePoints: null }), /foeDefensePoints/);
  assert.throws(() => calculateDreamscapeResult({ foeDefensePoints: Number.MAX_SAFE_INTEGER, turnsSurvivedBonus: 1 }), /safe integer range/);
  assert.throws(() => reconcileDreamscapeResult({ finalScore: undefined }), /finalScore/);
});

test('HUD multiplier lookup exposes observations and does not extrapolate a rule', () => {
  assert.deepEqual(DREAMSCAPE_SURVIVAL_HUD_OBSERVATIONS.map(item => [item.attackTurnsLeft, item.displayedMultiplier]), [
    [5, 0.5], [4, 1], [3, 1.5], [2, 2], [1, 2], [0, 2]
  ]);
  assert.equal(getObservedDreamscapeMultiplier(5), 0.5);
  assert.equal(getObservedDreamscapeMultiplier(0), 2);
  assert.equal(getObservedDreamscapeMultiplier(6), null);
  assert.equal(getObservedDreamscapeMultiplier(-1), null);
  assert.equal(getObservedDreamscapeMultiplier(2.5), null);
  assert.equal(getObservedDreamscapeMultiplier('5'), null);
  assert.equal(getObservedDreamscapeMultiplier(null), null);
});

test('Dreamscape data separates verified composition from unresolved accumulation', () => {
  assert.equal(multidimensionalDreamscapeEvidence.modeId, 'multidimensional');
  assert.equal(multidimensionalDreamscapeEvidence.resultFormula.status, 'verified_observed_result_composition');
  assert.equal(multidimensionalDreamscapeEvidence.accumulation.foeDefensePoints, 'unknown');
  assert.equal(multidimensionalDreamscapeEvidence.accumulation.turnsSurvivedBonus, 'unknown');
  assert.equal(multidimensionalDreamscapeEvidence.endTrigger.status, 'unknown');
  assert.equal(multidimensionalDreamscapeEvidence.observedRun.postZeroPlayableAction, 40);
});

test('Hachiman live fields are evidence-scoped and Nexus calibration remains unchanged', () => {
  const hachiman = bosses.find(boss => boss.id === 'hachiman');
  assert.equal(hachiman.level, 82);
  assert.equal(hachiman.defaultMode, 'multidimensional');
  assert.equal(hachiman.scoreModel, 'multidimensional_dreamscape_observed');
  assert.equal(hachiman.finiteHp, false);
  assert.equal(hachiman.previewAttackTurns, 6);
  assert.match(hachiman.previewLimitNote, /preview stop, not a verified game-end trigger/);
  assert.deepEqual(hachiman.resistances, ['fire', 'ice', 'electric', 'nuclear']);
  assert.equal(hachiman.weakness, 'curse');
  assert.deepEqual(hachiman.immunities, ['instant_kill', 'spiritual_ailment', 'control_ailment']);
  assert.equal(hachiman.scoreMultiplier, 1);
  assert.equal(hachiman.roleScoreMultiplier, undefined);
  assert.equal(recordedNightmareBenchmark.finalScore, 3_642_530_108);
  assert.equal(recordedNightmareBenchmark.difficultyBonus, 4);
  assert.equal(recordedNightmareBenchmark.baseDamagePoints, 827_135);
  assert.equal(recordedNightmareBenchmark.weakenedDamagePoints, 909_555_392);
  assert.equal(recordedNightmareBenchmark.bossAttackPoints, 250_000);
});
