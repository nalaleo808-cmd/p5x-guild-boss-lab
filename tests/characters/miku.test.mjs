import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../../src/engine.js';
import { legacyMethods } from '../../src/characters/miku-mechanics.js';

test('MIKU is installed as a legacy mixin without character hooks', () => {
  assert.deepEqual(Object.keys(legacyMethods), ['isMikuNavigator', 'isVirtualConcertActive', 'applyMikuSongEffect', 'applyMikuTrackSkill']);
  assert.equal(legacyMethods.characterMechanics, undefined);
  for (const name of ['isMikuNavigator', 'isVirtualConcertActive', 'applyMikuSongEffect', 'applyMikuTrackSkill']) assert.equal(BattleEngine.prototype[name], legacyMethods[name]);
});
