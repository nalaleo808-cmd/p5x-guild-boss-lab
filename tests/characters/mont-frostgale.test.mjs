import test from 'node:test';
import assert from 'node:assert/strict';
import { characterMechanics } from '../../src/characters/mont-frostgale-mechanics.js';

test('Frostgale Spring preserves three individual S1 hits', () => {
  const actor = { id: 'kotone', slug: 'mont-frostgale', frostgale: { mode: 'spring', windBonus: false, iceBonus: false, edge: null } };
  const engine = { config: { loadouts: { kotone: { characterResearch: { sourceTier: 3 } } } } };
  const prepared = characterMechanics.beforeSkill(engine, actor, { slot: 'S1', power: 1 }, 'boss', 'character_skill');
  assert.equal(prepared.element, 'wind');
  assert.equal(prepared.power, .859);
  assert.deepEqual(prepared.additionalHits, [{ power: .859 }, { power: .859 }]);
});
