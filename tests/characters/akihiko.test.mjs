import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../../src/engine.js';
import { characterMechanics, legacyMethods } from '../../src/characters/akihiko-mechanics.js';
import { characterModuleFor } from '../../src/characters/registry.js';

test('Akihiko keeps its legacy engine methods and registers first-class character hooks', () => {
  assert.deepEqual(Object.keys(legacyMethods), ['isAkihiko', 'gainAkihikoGrit', 'gainAkihikoMettle']);
  for (const name of ['isAkihiko', 'gainAkihikoGrit', 'gainAkihikoMettle']) assert.equal(BattleEngine.prototype[name], legacyMethods[name]);
  assert.equal(characterModuleFor({ slug: 'akihiko' }).mechanics, characterMechanics);
});
