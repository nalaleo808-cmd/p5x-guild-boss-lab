import test from 'node:test';
import assert from 'node:assert/strict';
import { characterMechanics } from '../../src/characters/crow-mechanics.js';

function engine(options = {}) {
  const crow = { id: 'crow', slug: 'crow', hp: 100, attack: 500, awareness: options.awareness ?? 0, buffs: [] };
  const carry = { id: 'carry', hp: 100, attack: 900, role: 'Sweeper', buffs: [] };
  const enemies = [{ id: 'a', alive: true, debuffs: [] }, { id: 'b', alive: true, debuffs: [] }];
  return { config: { characterOptions: { crow: options } }, state: { party: [crow, carry], mechanicsLimitations: [], navigator: {} }, enemies,
    applyUnitBuff(unit, effect) { unit.buffs.push(effect); return effect; }, applyEnemyStatus(target, key, effect) { target[key].push(effect); return effect; }, grantBlessing() {}, healUnit() {} };
}

test('Crow records Mastermind all-target damage as an average', () => {
  const e = engine(); const [crow, carry] = e.state.party; characterMechanics.initialize(e, crow);
  characterMechanics.onDamage(e, crow, { actor: carry, skill: { target: 'all_enemies' }, target: e.enemies[0], actualDamage: 200, sourceType: 'character_skill' });
  characterMechanics.onDamage(e, crow, { actor: carry, skill: { target: 'all_enemies' }, target: e.enemies[1], actualDamage: 100, sourceType: 'character_skill' });
  assert.equal(crow.crow.mastermindId, carry.id); assert.equal(crow.crow.recordedDamage, 150);
});

test('Crow Highlight preserves independent Bless and Curse packets and four-star Almighty applies at damage time', () => {
  const e = engine({ weapon: 'four-star', refinement: 6 }); const crow = e.state.party[0]; characterMechanics.initialize(e, crow);
  const highlight = characterMechanics.beforeSkill(e, crow, { id: 'hl', slot: 'HL' }, 'a', 'highlight');
  assert.equal(highlight.element, 'bless'); assert.equal(highlight.additionalHits[0].element, 'curse');
  const prepared = characterMechanics.beforeDamage(e, crow, crow, { element: 'almighty' }, e.enemies[0], 'character_skill');
  assert.equal(prepared.actionDamageBonus, .192);
});
