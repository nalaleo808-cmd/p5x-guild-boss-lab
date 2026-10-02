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

test('Yatsufusa MLD tracks Berserk to 3, stops after six Attack Turns, and scores (Foe Defense Points + 125,000) x 8', () => {
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
  assert.equal(engine.isDreamscapePreview(), false);
  const breakdown = engine.state.result.scoreBreakdown;
  assert.equal(breakdown.turnsSurvivedBonus, 125_000);
  assert.equal(breakdown.difficultyBonus, 8);
  assert.equal(engine.state.result.score, (breakdown.foeDefensePoints + 125_000) * 8);
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

test('Yatsufusa All-Out Attack stage bonus reaches Cosmic Yui Veg-Out, which the engine scores as All-Out damage', () => {
  const engine = new BattleEngine({
    seed: 55, bossId: 'yatsufusa', modeId: 'multidimensional', teamIds: ['wonder'],
    loadouts: { wonder: { baseStats: { maxHp: 100_000 } } }
  });
  assert.deepEqual(engine.stageDamageBonuses(engine.actor, 'nuclear', 'cosmic_all_out_attack'), [['stage_all_out_attack_damage', 0.15]]);
  assert.deepEqual(engine.stageDamageBonuses(engine.actor, 'nuclear', 'resonance_follow_up'), []);
});

test('an attribute-targeted party buff reaches only allies of that attribute; Wonder uses his first Persona', () => {
  const nuclear = { id: 'test-nuclear', name: 'Nuclear Ally', codename: 'Nuclear', role: 'Assassin', element: 'nuclear', attack: 1000, maxHp: 10_000, maxSp: 100, crit: 0, critMult: 1.5, actionLimit: 1, skills: [] };
  const fire = { ...nuclear, id: 'test-fire', name: 'Fire Ally', codename: 'Fire', element: 'fire' };
  const engine = new BattleEngine({
    seed: 55, bossId: 'yatsufusa', modeId: 'multidimensional', teamIds: ['wonder', nuclear.id, fire.id],
    characterDefinitions: [nuclear, fire], loadouts: { wonder: { baseStats: { maxHp: 100_000 } } }
  });
  const wonder = engine.state.party.find(unit => unit.id === 'wonder');
  const skill = { id: 'attribute-buff', name: 'Attribute buff', slot: 'S1', element: 'nuclear', power: 0, cost: 0, target: 'boss',
    buff: { id: 'attribute_attack', name: 'ATTRIBUTE ATK', stat: 'attack', value: 0.22, duration: 2 },
    buffTarget: 'party_attribute', buffAttribute: 'nuclear' };
  engine.resolveSkill(wonder, skill, engine.state.boss.id, 'persona_skill');
  const has = id => engine.state.party.find(unit => unit.id === id).buffs.some(buff => buff.id === 'attribute_attack');
  assert.equal(has(nuclear.id), true);
  assert.equal(has(fire.id), false);
  assert.equal(has('wonder'), engine.unitAttribute(wonder) === 'nuclear');
});
