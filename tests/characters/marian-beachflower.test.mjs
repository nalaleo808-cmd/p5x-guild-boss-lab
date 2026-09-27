import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../../src/engine.js';
import { legacyMethods } from '../../src/characters/marian-beachflower-mechanics.js';

test('Marian is installed as a legacy mixin without character hooks', () => {
  assert.deepEqual(Object.keys(legacyMethods), ['isMarian', 'marian', 'marianScalingCriticalMultiplier', 'applyMarianHighlightEffect']);
  assert.equal(legacyMethods.characterMechanics, undefined);
  for (const name of ['isMarian', 'marian', 'marianScalingCriticalMultiplier', 'applyMarianHighlightEffect']) assert.equal(BattleEngine.prototype[name], legacyMethods[name]);
});
