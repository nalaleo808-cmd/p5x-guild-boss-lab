import test from 'node:test';
import assert from 'node:assert/strict';
import { characterMechanics } from '../../src/characters/luce-mechanics.js';
import { characterResearch } from '../../src/characters/luce-data.js';

function engine(options = {}) {
  const luce = { id: 'luce', slug: 'luce', hp: 100, attack: 1000, mechanicAttack: 1000, awareness: 0, buffs: [] };
  const ally = { id: 'ally', hp: 100, buffs: [] };
  return { config: { characterOptions: { luce: options } }, state: { party: [luce, ally], mechanicsLimitations: [], navigator: {} }, enemies: [],
    applyUnitBuff(unit, effect) { unit.buffs.push(effect); return effect; }, grantBlessing() {} };
}

test('Luce omits flat Attack grants without the required explicit conversion scale', () => {
  const e = engine(); const [u] = e.state.party; characterMechanics.initialize(e, u); u.luce.improv = 'fire';
  const skill = characterMechanics.beforeSkill(e, u, { id: 's3', slot: 'S3' }, 'ally', 'character_skill'); characterMechanics.afterSkill(e, u, skill, 'ally', 'character_skill');
  assert.ok(!e.state.party.some(unit => unit.buffs.some(effect => effect.stat === 'flatAttack')));
  assert.match(characterResearch.limitations.join(' '), /flatAttackScale/);
});
