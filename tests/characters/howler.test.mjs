import test from 'node:test';
import assert from 'node:assert/strict';
import { characterMechanics } from '../../src/characters/howler-mechanics.js';

test('Howler A6 dual stance prepares both sourced Blaze packets', () => {
  const actor = { id: 'runa', slug: 'howler', awareness: 6, howler: { bigWelcome: 2, furrocious: 2 }, buffs: [] };
  const engine = { config: { loadouts: { runa: { characterResearch: { sourceTier: 3 } } } } };
  const prepared = characterMechanics.beforeSkill(engine, actor, { slot: 'S3', power: 1, target: 'boss' }, 'boss', 'character_skill');
  assert.equal(prepared.power, 1.166);
  assert.deepEqual(prepared.additionalHits, [{ power: 2.331, targetId: 'boss', damageClass: 'resonance_follow_up' }]);
  assert.equal(characterMechanics.actionUnavailableReason(engine, actor, prepared, 'character_skill'), null);
});
