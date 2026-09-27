import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../../src/engine.js';
import { legacyMethods } from '../../src/characters/yukari-mechanics.js';

test('Yukari is installed as a legacy mixin without character hooks', () => {
  assert.deepEqual(Object.keys(legacyMethods), ['isYukari', 'applyYukariErosion', 'triggerYukariErosionSupport']);
  assert.equal(legacyMethods.characterMechanics, undefined);
  for (const name of ['isYukari', 'applyYukariErosion', 'triggerYukariErosionSupport']) assert.equal(BattleEngine.prototype[name], legacyMethods[name]);
});
