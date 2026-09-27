import test from 'node:test';
import assert from 'node:assert/strict';
import { characterMechanics } from '../../src/characters/violet-mechanics.js';

function engine(options = {}) {
  const violet = { id: 'violet', slug: 'violet', hp: 100, awareness: 0, buffs: [] };
  return { config: { characterOptions: { violet: options } }, state: { party: [violet], mechanicsLimitations: [], navigator: {} }, enemies: [],
    applyUnitBuff(unit, effect) { unit.buffs.push(effect); return effect; } };
}

test('Violet conditional damage is applied to damage packets, including non-skill Bless damage', () => {
  const e = engine({ weapon: 'four-star', refinement: 6 }); const u = e.state.party[0]; characterMechanics.initialize(e, u); u.violet.leadSteps = 2;
  const bless = characterMechanics.beforeDamage(e, u, u, { element: 'bless' }); const physical = characterMechanics.beforeDamage(e, u, u, { element: 'physical' });
  assert.equal(bless.actionDamageBonus, .75); assert.equal(physical.actionDamageBonus, .45);
});
