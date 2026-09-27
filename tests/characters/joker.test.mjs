import test from 'node:test';
import assert from 'node:assert/strict';
import { characterDefinition } from '../../src/characters/joker-data.js';
import { characterMechanics } from '../../src/characters/joker-mechanics.js';

const engine = { config: { loadouts: { joker: { sourceTier: 2, characterResearch: { sourceTier: 1 } } } }, enemies: [], applyUnitBuff: () => {} };

test('Joker honors nested source tier, conditional damage, and an explicit extra-action request', () => {
  const joker = { id: 'joker', slug: 'joker', hp: 100, awareness: 1, sourceTier: 3, buffs: [] };
  const target = { id: 'boss', debuffs: [{ id: 'test_debuff' }] };
  engine.enemies = [target];
  characterMechanics.initialize(engine, joker);
  const s1 = characterDefinition.skills.find(skill => skill.characterAction === 'joker:S1');
  const s3 = characterDefinition.skills.find(skill => skill.characterAction === 'joker:S3');
  const prepared = characterMechanics.beforeSkill(engine, joker, s3, target.id, 'character_skill');
  assert.equal(prepared.power, s3.powerTiers[1]);
  const conditional = characterMechanics.beforeDamage(engine, joker, joker, prepared, target, 'character_skill');
  assert.equal(conditional.actionDamageBonus, .55, 'A1 main-target and S3 debuff bonuses');
  joker.joker.extraActionActive = true;
  const extra = characterMechanics.beforeDamage(engine, joker, joker, { ...prepared, jokerExtraAction: true }, target, 'character_skill');
  assert.equal(extra.actionDamageBonus, 1.52, 'A1, Adverse Resolve, S3 extra-action, and debuff bonuses');
  joker.joker.extraActionActive = false;
  for (let index = 0; index < 3; index += 1) characterMechanics.afterSkill(engine, joker, s1, target.id, 'character_skill');
  assert.deepEqual(joker.joker.extraActionRequest, { reason: 'joker_will_of_rebellion', preserveTimedEffects: true, spendWillOnEnd: 3 });
  assert.deepEqual(characterMechanics.getExtraActionRequest(engine, joker), joker.joker.extraActionRequest);
  assert.equal(characterMechanics.onExtraActionStart(engine, joker), true);
  assert.equal(characterMechanics.getExtraActionRequest(engine, joker), null);
  assert.equal(characterMechanics.onExtraActionEnd(engine, joker), true);
  assert.equal(joker.joker.will, 0);
});
