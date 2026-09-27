import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../../src/engine.js';
import { legacyMethods } from '../../src/characters/puppet-wavecatcher-mechanics.js';

test('Wavecatcher is installed as a legacy mixin without character hooks', () => {
  assert.deepEqual(Object.keys(legacyMethods), ['isWavecatcher', 'cleanseWavecatcher', 'surfAdjustedStatus']);
  assert.equal(legacyMethods.characterMechanics, undefined);
  for (const name of ['isWavecatcher', 'cleanseWavecatcher', 'surfAdjustedStatus']) assert.equal(BattleEngine.prototype[name], legacyMethods[name]);
});
