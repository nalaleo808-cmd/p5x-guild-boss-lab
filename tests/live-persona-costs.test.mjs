import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine, CURRENT_MECHANICS_PROFILE, RECORDED_MECHANICS_PROFILE } from '../src/engine.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';

const clone = value => structuredClone(value);
const persona = name => clone(lufelCatalog.personas.find(item => item.name === name));
const transferable = name => clone(lufelCatalog.personaSkills.find(item => item.name === name));
const berry = () => clone(lufelCatalog.characters.find(item => item.slug === 'berry'));

function personaWithEquipment(name, equipment = []) {
  const definition = persona(name);
  definition.skills = [...definition.skills, ...equipment.map(transferable)];
  return definition;
}

function engineFor(personaName, profile = CURRENT_MECHANICS_PROFILE) {
  const dionysus = personaWithEquipment('Dionysus', ['Universal Theoria', 'Tarukaja']);
  const vasuki = personaWithEquipment('Vasuki', ['Media', 'Rakunda']);
  const janosik = personaWithEquipment('Janosik', ['Rakunda', 'Tarukaja']);
  const selected = { Dionysus: dionysus, Vasuki: vasuki, Janosik: janosik }[personaName];
  const berryDefinition = berry();
  return new BattleEngine({
    mechanicsProfile: profile, bossId: 'hachiman',
    teamIds: ['wonder', berryDefinition.id], characterDefinitions: [berryDefinition],
    personaDefinitions: [selected, dionysus, vasuki, janosik], personaIds: [selected.id]
  });
}

function action(engine, name) {
  const found = engine.getAvailableActions().find(item => item.type === 'skill' && item.name === name);
  assert.ok(found, `${name} should be available`);
  return found;
}

test('live fixes only the directly observed Dionysus, Vasuki, and Janosik Persona SP costs', () => {
  const cases = [
    ['Dionysus', 'Revolution', 22], ['Dionysus', 'Universal Theoria', 24], ['Dionysus', 'Tarukaja', 22],
    ['Vasuki', 'Venomous Spiral', 24], ['Vasuki', 'Media', 23], ['Vasuki', 'Rakunda', 22],
    ['Janosik', 'Rakunda', 22], ['Janosik', 'Tarukaja', 22]
  ];
  for (const [personaName, skillName, cost] of cases) assert.equal(action(engineFor(personaName), skillName).skill.cost, cost);

  const tatra = action(engineFor('Janosik'), 'Tatra Shot').skill;
  assert.equal(tatra.cost, 0);
  assert.equal(tatra.hpCost, undefined);
});

test('recorded profile retains imported Persona costs without live overrides', () => {
  const recorded = engineFor('Dionysus', RECORDED_MECHANICS_PROFILE);
  assert.equal(action(recorded, 'Revolution').skill.cost, 0);
  assert.equal(action(recorded, 'Universal Theoria').target, 'party');
});

test('live Universal Theoria charges 24 SP, buffs party Attack, and buffs only its selected ally damage', () => {
  const engine = engineFor('Dionysus');
  const berryUnit = engine.state.party.find(unit => unit.slug === 'berry');
  const theoria = action(engine, 'Universal Theoria');
  const beforeSp = engine.actor.sp;
  assert.equal(theoria.target, 'ally');

  engine.step({ type: theoria.type, skillId: theoria.skillId, targetId: berryUnit.id });

  assert.equal(engine.state.party[0].sp, beforeSp - 24);
  for (const unit of engine.state.party) {
    assert.equal(unit.buffs.find(buff => buff.id === 'attack_up')?.value, 0.33);
    assert.equal(unit.buffs.find(buff => buff.id === 'attack_up')?.duration, 2);
  }
  const selectedBuff = berryUnit.buffs.find(buff => buff.id === 'universal_theoria_damage');
  assert.equal(selectedBuff?.stat, 'finalDamage');
  assert.equal(selectedBuff?.value, 0.22);
  assert.equal(selectedBuff?.duration, 2);
  assert.ok(Math.abs(engine.liveDamageFactors(berryUnit, 'almighty', engine.state.boss, 'character_skill').finalDamageMultiplier - 1.22) < 1e-9);
  assert.equal(engine.state.party.find(unit => unit.id === 'wonder').buffs.some(buff => buff.id === 'universal_theoria_damage'), false);
});

test('live recommendation selects the strongest legal Universal Theoria ally and does not force a repeat', () => {
  const engine = engineFor('Dionysus');
  const wonder = engine.state.party.find(unit => unit.id === 'wonder');
  const berryUnit = engine.state.party.find(unit => unit.slug === 'berry');
  berryUnit.attack = wonder.attack + 1000;
  wonder.buffs.push({ id: 'crit_rate_up', stat: 'critRate', value: 0.072, duration: 2 });

  const recommendation = engine.recommend();
  assert.equal(recommendation.name, 'Universal Theoria');
  assert.equal(recommendation.targetId, berryUnit.id);
  engine.step({ type: recommendation.type, skillId: recommendation.skillId, targetId: recommendation.targetId });
  assert.equal(berryUnit.buffs.find(buff => buff.id === 'universal_theoria_damage')?.value, 0.22);

  assert.notEqual(engine.recommend().name, 'Universal Theoria');
});
