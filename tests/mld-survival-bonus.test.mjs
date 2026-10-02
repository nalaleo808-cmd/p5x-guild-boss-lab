import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../src/engine.js';
import { bosses } from '../src/data.js';
import { MLD_RESULT_SCREENS, MLD_SURVIVAL_BONUS_TIMES_DIFFICULTY, calculateDreamscapeResult, resolveDreamscapeSurvivalBonus } from '../src/mode-scoring.js';

const guard = engine => {
  const action = engine.getAvailableActions().find(item => item.type === 'guard' && item.enabled);
  engine.step({ type: 'guard', skillId: action.skillId, targetId: 'self' });
};

test('every recorded MLD result screen fits one formula and bonus x difficulty = 1,000,000', () => {
  for (const screen of MLD_RESULT_SCREENS) {
    assert.equal(calculateDreamscapeResult(screen), screen.finalScore, screen.bossId);
    assert.equal(screen.turnsSurvivedBonus * screen.difficultyBonus, MLD_SURVIVAL_BONUS_TIMES_DIFFICULTY, screen.bossId);
    assert.equal(bosses.find(boss => boss.id === screen.bossId).turnsSurvivedBonus, screen.turnsSurvivedBonus, screen.bossId);
  }
});

test('the survival bonus resolver prefers a result screen, then derives it, else stays a preview', () => {
  assert.deepEqual(resolveDreamscapeSurvivalBonus({ defaultMode: 'multidimensional', difficultyBonus: 8, turnsSurvivedBonus: 125_000 }), { bonus: 125_000, source: 'result_screen' });
  assert.deepEqual(resolveDreamscapeSurvivalBonus({ defaultMode: 'multidimensional', difficultyBonus: 4 }), { bonus: 250_000, source: 'derived_from_difficulty' });
  assert.deepEqual(resolveDreamscapeSurvivalBonus({ supportedModes: ['multidimensional'], difficultyBonus: 8 }), { bonus: 125_000, source: 'derived_from_difficulty' });
  assert.equal(resolveDreamscapeSurvivalBonus({ defaultMode: 'multidimensional', difficultyBonus: 3 }).bonus, null);
  assert.equal(resolveDreamscapeSurvivalBonus({ defaultMode: 'multidimensional' }).bonus, null);
  assert.equal(resolveDreamscapeSurvivalBonus({ defaultMode: 'nexus', difficultyBonus: 4 }).bonus, null);
  assert.equal(resolveDreamscapeSurvivalBonus({ defaultMode: 'multidimensional', difficultyBonus: 8, dreamscapeScoreVerified: false }).bonus, null);
});

test('a new MLD boss without a result screen scores with the derived bonus and says so', () => {
  const futureBoss = { ...structuredClone(bosses.find(boss => boss.id === 'yatsufusa')), id: 'future-mld-boss', name: 'Future Boss' };
  delete futureBoss.turnsSurvivedBonus;
  delete futureBoss.dreamscapeScoreVerified;
  const engine = new BattleEngine({
    seed: 55, bossId: futureBoss.id, bossDefinition: futureBoss, modeId: 'multidimensional', teamIds: ['wonder'],
    loadouts: { wonder: { baseStats: { maxHp: 100_000 } } }
  });
  assert.equal(engine.isDreamscapePreview(), false);
  assert.ok(engine.state.mechanicsLimitations.some(text => /Future Boss MLD: Turns Survived Bonus 125,000 is derived/.test(text)));
  while (engine.state.phase === 'battle') guard(engine);
  const breakdown = engine.state.result.scoreBreakdown;
  assert.equal(breakdown.turnsSurvivedBonus, 125_000);
  assert.equal(breakdown.turnsSurvivedBonusSource, 'derived_from_difficulty');
  assert.equal(engine.state.result.score, (breakdown.foeDefensePoints + 125_000) * 8);
});
