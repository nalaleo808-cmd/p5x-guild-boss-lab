import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../../src/engine.js';
import { legacyMethods } from '../../src/characters/matoi-mechanics.js';

test('Matoi is installed as a legacy mixin without character hooks', () => {
  assert.deepEqual(Object.keys(legacyMethods), ['isMatoi', 'matoiSkill', 'applyMatoiTorrentEffects']);
  assert.equal(legacyMethods.characterMechanics, undefined);
  for (const name of ['isMatoi', 'matoiSkill', 'applyMatoiTorrentEffects']) assert.equal(BattleEngine.prototype[name], legacyMethods[name]);
});
