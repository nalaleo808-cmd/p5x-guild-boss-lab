import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../src/engine.js';
import { bosses } from '../src/data.js';

const guard = engine => {
  const action = engine.getAvailableActions().find(item => item.type === 'guard' && item.enabled);
  engine.step({ type: 'guard', skillId: action.skillId, targetId: 'self' });
};

test('Yatsufusa uses the Lufel Defense calc row and the stage-select values', () => {
  const boss = bosses.find(item => item.id === 'yatsufusa');
  assert.equal(boss.baseDefense, 1280);
  assert.equal(boss.defenseCoefficient, 3.059);
  assert.ok(Math.abs(boss.defense - 1280 * 3.059) < 1e-9);
  assert.equal(boss.weakness, 'nuclear');
  assert.deepEqual(boss.resistances, []);
  assert.equal(boss.level, 82);
  assert.equal(boss.difficultyBonus, 8);
});

test('Yatsufusa MLD tracks Berserk to 3, stops after six Attack Turns, and reports damage only', () => {
  const engine = new BattleEngine({
    seed: 55, bossId: 'yatsufusa', modeId: 'multidimensional', teamIds: ['wonder'],
    loadouts: { wonder: { baseStats: { maxHp: 100_000 } } }
  });
  assert.equal(engine.state.boss.berserkStacks, 0);
  assert.ok(engine.state.mechanicsLimitations.some(text => /Yatsufusa Berserk/.test(text)));
  assert.ok(engine.state.mechanicsLimitations.some(text => /ally damage stack is not applied/.test(text)));
  assert.ok(engine.state.mechanicsLimitations.some(text => /All-Out Attack damage \+15%/.test(text)));
  guard(engine);
  assert.equal(engine.state.boss.berserkStacks, 1);
  while (engine.state.phase === 'battle') guard(engine);
  assert.equal(engine.state.boss.berserkStacks, 3);
  assert.equal(engine.state.result.attackTurns, 6);
  assert.equal(engine.isDreamscapePreview(), true);
});

test('Yatsufusa applies the Guardian/Medic composition and the All-Out Attack stage bonus', () => {
  const make = role => new BattleEngine({
    seed: 55, bossId: 'yatsufusa', modeId: 'multidimensional', teamIds: ['wonder'],
    loadouts: { wonder: { baseStats: { maxHp: 100_000 } } }
  });
  const without = make();
  assert.equal(without.hasDreamscapeGuardianOrMedic(), false);
  assert.equal(without.dreamscapeDamageTakenMultiplier(without.state.boss), 1);
  assert.equal(without.dreamscapeDamageDealtMultiplier(without.state.boss), 1.6);
  const withGuardian = make();
  withGuardian.state.party[0].combatRole = 'Guardian';
  assert.equal(withGuardian.dreamscapeDamageTakenMultiplier(withGuardian.state.boss), 1.2);
  assert.equal(withGuardian.dreamscapeDamageDealtMultiplier(withGuardian.state.boss), 0.4);
  const bonuses = without.stageDamageBonuses(without.actor, 'almighty', 'all_out_attack');
  assert.deepEqual(bonuses, [['stage_all_out_attack_damage', 0.15]]);
  assert.deepEqual(without.stageDamageBonuses(without.actor, 'almighty', 'character_skill'), []);
});
