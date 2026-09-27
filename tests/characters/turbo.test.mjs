import test from 'node:test';
import assert from 'node:assert/strict';
import { characterMechanics } from '../../src/characters/turbo-mechanics.js';

function engine(options = {}) {
  const turbo = { id: 'turbo', slug: 'turbo', hp: 100, speed: 100, awareness: 0, buffs: [] };
  const ally = { id: 'ally', hp: 100, buffs: [] }; const enemy = { id: 'boss', alive: true, downed: false, downPoints: 3, debuffs: [] };
  return { config: { characterOptions: { turbo: options } }, state: { party: [turbo, ally], mechanicsLimitations: [], navigator: {} }, enemies: [enemy],
    applyUnitBuff(unit, effect) { const old = unit.buffs.find(x => x.id === effect.id); old ? Object.assign(old, effect) : unit.buffs.push(effect); return effect; } };
}

test('Turbo signature scales its party damage buff from lifetime Velocity', () => {
  const e = engine({ weapon: 'signature', refinement: 6 }); const u = e.state.party[0]; characterMechanics.initialize(e, u); u.turbo.totalVelocity = 200;
  const skill = characterMechanics.beforeSkill(e, u, { id: 's1', slot: 'S1' }, 'boss', 'character_skill'); characterMechanics.afterSkill(e, u, skill, 'boss', 'character_skill');
  assert.equal(e.state.party[1].buffs.find(x => x.id === 'turbo_weapon_velocity').value, .32);
});

test('Turbo Highlight consumes its next recipient direct-damage Down reduction', () => {
  const e = engine(); const [u, ally] = e.state.party; characterMechanics.initialize(e, u);
  const skill = characterMechanics.beforeSkill(e, u, { id: 'hl', slot: 'HL' }, ally.id, 'highlight'); characterMechanics.afterSkill(e, u, skill, ally.id, 'highlight');
  characterMechanics.onDamage(e, u, { actor: ally, target: e.enemies[0], actualDamage: 1, sourceType: 'character_skill' });
  assert.equal(e.enemies[0].downPoints, 2); assert.equal(u.turbo.highlightDownRecipientId, null);
});
