import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../../src/engine.js';
import { legacyMethods } from '../../src/characters/berry-mechanics.js';

test('Berry is installed as a legacy mixin without character hooks', () => {
  assert.deepEqual(Object.keys(legacyMethods), ['berrySkill', 'berryTierValue', 'refreshBerryPassives', 'gainBerryChain']);
  assert.equal(legacyMethods.characterMechanics, undefined);
  for (const name of ['berrySkill', 'berryTierValue', 'refreshBerryPassives', 'gainBerryChain']) assert.equal(BattleEngine.prototype[name], legacyMethods[name]);
});
