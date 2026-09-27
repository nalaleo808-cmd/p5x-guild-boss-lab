import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../../src/engine.js';
import { legacyMethods } from '../../src/characters/j-c-mechanics.js';

test('J&C is installed as a legacy mixin without character hooks', () => {
  const methodNames = ['isJc', 'grantJcFacade', 'jcEffectiveDesire', 'applyJcWeaponFacadeGain', 'applyJcFacadeAwareness'];
  assert.deepEqual(Object.keys(legacyMethods), methodNames);
  assert.equal(legacyMethods.characterMechanics, undefined);
  for (const name of methodNames) assert.equal(BattleEngine.prototype[name], legacyMethods[name]);
});
