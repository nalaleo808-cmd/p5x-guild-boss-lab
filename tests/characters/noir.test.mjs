import test from 'node:test';
import assert from 'node:assert/strict';
import { characterMechanics } from '../../src/characters/noir-mechanics.js';

test('Noir S1 is available and retains two sourced packets', () => {
  const actor = { id: 'haru', slug: 'noir', noir: { thoughtfulRounds: [], targetAudience: 0, weapon: null }, buffs: [] };
  const engine = { config: { loadouts: { haru: { characterResearch: { sourceTier: 3 } } } }, enemies: [] };
  const prepared = characterMechanics.beforeSkill(engine, actor, { slot: 'S1', power: 1, target: 'all_enemies' }, 'boss', 'character_skill');
  assert.equal(prepared.power, .883);
  assert.deepEqual(prepared.additionalHits, [{ power: .883 }]);
});
