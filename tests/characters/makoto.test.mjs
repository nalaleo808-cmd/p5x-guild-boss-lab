import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../../src/engine.js';
import { legacyMethods } from '../../src/characters/makoto-mechanics.js';

test('Makoto is installed as a legacy mixin without character hooks', () => {
  assert.deepEqual(Object.keys(legacyMethods), ['isMakoto', 'gainMakotoMoonPhase', 'triggerMakotoEntrustedHope']);
  assert.equal(legacyMethods.characterMechanics, undefined);
  for (const name of ['isMakoto', 'gainMakotoMoonPhase', 'triggerMakotoEntrustedHope']) assert.equal(BattleEngine.prototype[name], legacyMethods[name]);
});
