import test from 'node:test';
import assert from 'node:assert/strict';
import { characterMechanics } from '../../src/characters/wind-tempest-mechanics.js';

test('Wind Tempest S3 spends the current SP instead of its catalog range', () => {
  const actor = { id: 'riko', slug: 'wind-tempest', sp: 137 };
  const prepared = characterMechanics.beforeSkill({ config: { loadouts: { riko: { characterResearch: { sourceTier: 3 } } } } }, actor, { slot: 'S3', power: 1, target: 'ally', cost: 50 }, 'ally', 'character_skill');
  assert.equal(prepared.cost, 137);
  assert.equal(prepared.windTempestSpent, 137);
  assert.equal(prepared.power, 0);
});
