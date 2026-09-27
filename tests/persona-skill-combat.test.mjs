import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine, CURRENT_MECHANICS_PROFILE } from '../src/engine.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';
import { shadowRuinTestBoss } from './fixtures/test-bosses.mjs';

const approx = (actual, expected, tolerance = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
};

function transferable(name, predicate = () => true) {
  const skill = lufelCatalog.personaSkills.find(item => item.name === name && predicate(item));
  assert.ok(skill, `${name} should exist in the transferable catalog`);
  return structuredClone(skill);
}

function combatSkill(source, override = {}) {
  const combat = source.combat || {};
  return {
    id: source.id, slot: 'S1', name: source.name, element: source.element,
    cost: Number(source.cost || 0), hpCost: Number(source.hpCost || 0),
    power: Number(combat.power || 0), target: source.target,
    critBonus: combat.critBonus, accuracyModifier: combat.accuracyModifier,
    hitCount: combat.hitCount,
    hitCountRange: combat.hitCountRange ? structuredClone(combat.hitCountRange) : undefined,
    ignoreDefense: combat.ignoreDefense,
    technical: combat.technical ? structuredClone(combat.technical) : undefined,
    buff: combat.buff ? structuredClone(combat.buff) : undefined,
    buffs: combat.buffs ? structuredClone(combat.buffs) : undefined,
    buffTarget: combat.buffTarget,
    debuff: combat.debuff ? structuredClone(combat.debuff) : undefined,
    debuffs: combat.debuffs ? structuredClone(combat.debuffs) : undefined,
    heal: combat.heal, healAttack: combat.healAttack, healFlat: combat.healFlat,
    healTarget: combat.healTarget,
    note: source.description,
    ...override
  };
}

function engineForSkill(source, override = {}, seed = 113) {
  const skill = combatSkill(source, override);
  const persona = { id: `test-${source.id}`, name: 'Test Persona', element: source.element, skills: [skill] };
  return new BattleEngine({
    mechanicsProfile: CURRENT_MECHANICS_PROFILE, bossId: 'shadow_ruin', bossDefinitions: [shadowRuinTestBoss], seed,
    teamIds: ['wonder'], personaDefinitions: [persona], personaIds: [persona.id]
  });
}

function useOnlySkill(engine, targetId = engine.state.boss.id) {
  const action = engine.getAvailableActions().find(item => item.type === 'skill');
  assert.ok(action, 'the imported Persona skill should be available');
  return engine.step({ type: 'skill', skillId: action.skillId, targetId });
}

test('verified Lufel Persona coefficients and effect metadata survive import', () => {
  const psio = transferable('Psio');
  approx(psio.combat.power, 1.318);
  assert.equal(psio.element, 'psychic');
  assert.equal(psio.combat.technical.activation, 'compatible_ailment');
  approx(psio.combat.technical.damageMultiplier, 1.4);

  approx(transferable('Psiodyne').combat.power, 1.423);
  approx(transferable('Maziodyne').combat.power, 0.669);
  approx(transferable('Maeigaon').combat.power, 0.749);

  const luckyPunch = transferable('Lucky Punch');
  approx(luckyPunch.combat.power, 1.191);
  approx(luckyPunch.combat.critBonus, 0.2);
  approx(luckyPunch.combat.accuracyModifier, -0.2);

  const tripleDown = transferable('Triple Down');
  approx(tripleDown.combat.power, 0.164);
  assert.equal(tripleDown.combat.hitCount, 3);
  approx(tripleDown.combat.critBonus, 0.16);

  const tempest = transferable('Tempest Slash', item => item.combat?.power === 0.406);
  assert.deepEqual(tempest.combat.hitCountRange, [3, 5]);
  assert.equal(transferable('Tempest Slash', item => item.combat?.power === 0.624).combat.executable, false);
});

test('datamined Persona costs, healing, buffs, debuffs, and ailments are structured', () => {
  const dia = transferable('Dia');
  assert.equal(dia.cost, 23);
  assert.equal(dia.costType, 'sp_fixed');
  approx(dia.combat.healAttack, 0.364);
  assert.equal(dia.combat.healFlat, 1495);
  assert.equal(dia.combat.healTarget, 'ally');

  const tripleDown = transferable('Triple Down');
  assert.equal(tripleDown.costType, 'hp_percent');
  assert.equal(tripleDown.hpCost, 9);

  const tarukaja = transferable('Tarukaja');
  approx(tarukaja.combat.buff.value, 0.17);
  assert.equal(tarukaja.combat.buff.scaling.stat, 'attack');
  assert.equal(tarukaja.combat.buff.scaling.per, 500);
  approx(tarukaja.combat.buff.scaling.base, 0.17);
  approx(tarukaja.combat.buff.scaling.step, 0.014);
  approx(tarukaja.combat.buff.scaling.maxBonus, 0.114);

  const rakunda = transferable('Rakunda');
  approx(rakunda.combat.debuff.value, 0.427);
  assert.equal(rakunda.combat.debuff.duration, 3);

  const dormina = transferable('Dormina');
  approx(dormina.combat.debuff.chance, 0.48);
  assert.equal(dormina.combat.debuff.id, 'sleep');
  assert.equal(dormina.combat.debuff.duration, 2);
});

test('fixed multi-hit Persona skills emit one packet per sourced hit', () => {
  const engine = engineForSkill(transferable('Triple Down'), { target: 'boss', hpCost: 0 });
  const result = useOnlySkill(engine);
  assert.equal(result.events.filter(event => event.type === 'damage').length, 3);
});

test('Persona ailment chance gates status application', () => {
  const dormina = transferable('Dormina');
  const guaranteed = engineForSkill(dormina, {
    debuff: { ...dormina.combat.debuff, chance: 1 },
    debuffs: [{ ...dormina.combat.debuff, chance: 1 }]
  });
  useOnlySkill(guaranteed);
  assert.ok(guaranteed.state.boss.debuffs.some(effect => effect.id === 'sleep'));

  const impossible = engineForSkill(dormina, {
    debuff: { ...dormina.combat.debuff, chance: 0 },
    debuffs: [{ ...dormina.combat.debuff, chance: 0 }]
  });
  const result = useOnlySkill(impossible);
  assert.equal(impossible.state.boss.debuffs.some(effect => effect.id === 'sleep'), false);
  assert.ok(result.events.some(event => event.type === 'debuff_miss'));
});

test('Persona support scaling and Defense Down reach combat state', () => {
  const tarukaja = engineForSkill(transferable('Tarukaja'));
  tarukaja.actor.attack = 9000;
  useOnlySkill(tarukaja, tarukaja.actor.id);
  approx(tarukaja.actor.buffs.find(effect => effect.id === 'attack_up').value, 0.284);

  const rakunda = engineForSkill(transferable('Rakunda'));
  useOnlySkill(rakunda);
  approx(rakunda.state.boss.debuffs.find(effect => effect.id === 'def_down').value, 0.427);
});

test('Persona healing and Technical damage reach engine consumers', () => {
  const dia = engineForSkill(transferable('Dia'));
  dia.actor.maxHp = 20000;
  dia.actor.hp = 1;
  const healResult = useOnlySkill(dia, dia.actor.id);
  const healEvent = healResult.events.find(event => event.type === 'heal');
  assert.ok(healEvent?.amount > 1495);

  const psio = transferable('Psio');
  const ordinary = engineForSkill(psio, {}, 919);
  const technical = engineForSkill(psio, {}, 919);
  technical.state.boss.debuffs.push({ id: 'sleep', name: 'SLEEP', duration: 2, spiritualAilment: true });
  const ordinaryDamage = ordinary.calculateDamage(ordinary.actor, combatSkill(psio), ordinary.state.boss, 'persona_skill').amount;
  const technicalDamage = technical.calculateDamage(technical.actor, combatSkill(psio), technical.state.boss, 'persona_skill').amount;
  approx(technicalDamage / ordinaryDamage, 1.4, 0.001);
});
