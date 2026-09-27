import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../../src/engine.js';
import { legacyMethods } from '../../src/characters/rin-firecracker-mechanics.js';

test('Firecracker Rin is installed as a legacy mixin without character hooks', () => {
  assert.deepEqual(Object.keys(legacyMethods), ['isRin', 'endRinFlamingSwordDance', 'addRinYearEndFlames']);
  assert.equal(legacyMethods.characterMechanics, undefined);
  for (const name of ['isRin', 'endRinFlamingSwordDance', 'addRinYearEndFlames']) assert.equal(BattleEngine.prototype[name], legacyMethods[name]);
});
