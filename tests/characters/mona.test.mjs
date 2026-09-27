import test from 'node:test';
import assert from 'node:assert/strict';
import { characterDefinition } from '../../src/characters/mona-data.js';
import { characterMechanics } from '../../src/characters/mona-mechanics.js';

test('Mona uses nested source tier and heals/cleanses through the post-cast hook', () => {
  const mona = { id: 'mona', slug: 'mona', hp: 50, maxHp: 200, attack: 100, crit: 0, awareness: 0, sourceTier: 3,
    buffs: [], debuffs: [{ id: 'burn', elementalAilment: true }] };
  const engine = { config: { loadouts: { mona: { sourceTier: 2, characterResearch: { sourceTier: 1 } } } }, enemies: [],
    state: { party: [mona] }, random: () => 1, emit: () => {},
    healUnit: (actor, ally, amount) => { const healed = Math.min(amount, ally.maxHp - ally.hp); ally.hp += healed; return healed; }, applyEnemyStatus: () => {} };
  characterMechanics.initialize(engine, mona);
  const breeze = characterDefinition.skills.find(skill => skill.characterAction === 'mona:S2');
  const prepared = characterMechanics.beforeSkill(engine, mona, breeze, mona.id, 'character_skill');
  assert.equal(prepared.power, breeze.powerTiers[1]);
  assert.equal(prepared.monaHealing, 100 * .376 + 1300);
  characterMechanics.afterSkill(engine, mona, prepared, mona.id, 'character_skill');
  assert.equal(mona.hp, 200);
  assert.equal(mona.debuffs.length, 0);
  assert.equal(mona.mona.chivalry, 2);
});
