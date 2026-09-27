import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine, CURRENT_MECHANICS_PROFILE } from '../src/engine.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';
import { highestRankPersonaPassive } from '../src/persona-loadout.js';

const skill = {
  id: 'passive-test-strike', slot: 'S1', name: 'Passive Test Strike',
  element: 'gun', power: 1, target: 'boss', cost: 0, canCrit: false
};

function runtimePersona(id, passive = null) {
  return { id, name: id, element: 'gun', passive, skills: [structuredClone(skill)] };
}

function engineFor(personas) {
  return new BattleEngine({
    mechanicsProfile: CURRENT_MECHANICS_PROFILE,
    bossId: 'shadow_ruin', seed: 417, teamIds: ['wonder'],
    personaDefinitions: personas, personaIds: personas.map(persona => persona.id)
  });
}

test('max-rank sourced Attack passive applies to Wonder combat', () => {
  const source = lufelCatalog.personas.find(persona => persona.name === 'Janosik');
  const passive = highestRankPersonaPassive(source);
  assert.equal(passive.name, 'Hunting IV');

  const baseline = engineFor([runtimePersona('baseline')]);
  const boosted = engineFor([runtimePersona('janosik-runtime', passive)]);
  const applied = boosted.actor.buffs.find(effect => effect.personaPassivePersistent);
  assert.equal(applied.sourcePassiveName, 'Hunting IV');
  assert.equal(applied.stat, 'attack');
  assert.ok(Math.abs(applied.value - 0.291) < 1e-12);

  const ordinaryDamage = baseline.calculateDamage(baseline.actor, skill, baseline.state.boss, 'persona_skill').amount;
  const boostedDamage = boosted.calculateDamage(boosted.actor, skill, boosted.state.boss, 'persona_skill').amount;
  assert.ok(boostedDamage > ordinaryDamage * 1.28 && boostedDamage < ordinaryDamage * 1.3);
});

test('switching Personas replaces static passive effects and preserves limitations', () => {
  const attackPassive = {
    name: 'Static Attack', combat: {
      effects: [{ id: 'static_attack', stat: 'attack', value: 0.2, scope: 'self', timing: 'while_active', runtimeSupported: true }],
      limitations: ['Conditional clauses are reference-only.']
    }
  };
  const defensePassive = {
    name: 'Static Defense', combat: {
      effects: [{ id: 'static_defense', stat: 'defense', value: 0.3, scope: 'self', timing: 'while_active', runtimeSupported: true }],
      limitations: []
    }
  };
  const engine = engineFor([
    runtimePersona('attack-persona', attackPassive),
    runtimePersona('defense-persona', defensePassive)
  ]);
  assert.ok(engine.actor.buffs.some(effect => effect.stat === 'attack' && effect.personaPassivePersistent));
  assert.ok(engine.state.mechanicsLimitations.some(item => item.includes('Conditional clauses are reference-only.')));

  engine.selectPersona('defense-persona');
  const passiveBuffs = engine.actor.buffs.filter(effect => effect.personaPassivePersistent);
  assert.deepEqual(passiveBuffs.map(effect => effect.stat), ['defense']);
});
