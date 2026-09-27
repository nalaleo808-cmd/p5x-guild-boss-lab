import test from 'node:test';
import assert from 'node:assert/strict';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';
import {
  PERSONA_EQUIP_SLOT_COUNT,
  battleSkillsForPersona,
  buildPersonaLoadoutCatalog,
  fixedPersonaSkills,
  highestRankPersonaPassive,
  legalTransferableSkillsForPersona,
  sanitizePersonaSkillIds
} from '../src/persona-loadout.js';

const catalog = buildPersonaLoadoutCatalog(lufelCatalog);
const persona = name => lufelCatalog.personas.find(item => item.name === name);
const transferable = name => catalog.transferableSkills.find(item => item.name === name);

test('highest sourced Persona passive rank is selected by default', () => {
  const selected = highestRankPersonaPassive({ passive: [
    { name: 'Example III', rank: 'III', sourceIndex: 2 },
    { name: 'Example I', rank: 'I', sourceIndex: 0 },
    { name: 'Example IV', rank: 'IV', sourceIndex: 1 }
  ] });
  assert.equal(selected.name, 'Example IV');

  const janosik = persona('Janosik');
  assert.equal(janosik.maxRankPassive.name, 'Hunting IV');
  assert.equal(janosik.maxRankPassive.rankValue, 4);
  assert.equal(highestRankPersonaPassive(janosik).name, 'Hunting IV');
  assert.ok(janosik.maxRankPassive.combat.limitations.some(item => item.includes('Battle-start')));
  assert.ok(janosik.maxRankPassive.combat.limitations.some(item => item.includes('Conditional')));

  const sakiMitama = persona('Saki Mitama');
  const maxHp = highestRankPersonaPassive(sakiMitama);
  assert.equal(maxHp.combat.effects[0].stat, 'maxHp');
  assert.equal(maxHp.combat.effects[0].runtimeSupported, false);
  assert.ok(maxHp.combat.limitations.some(item => item.includes('switch')));
});

test('the screenshot Persona loadouts resolve all transferable equipment skills', () => {
  const examples = {
    Dionysus: ['Auto-Mataru IV', 'Counter II', 'Universal Theoria', 'Auto-Maraku III', 'Agility Master II', 'Tarukaja'],
    Vasuki: ['Trigger Happy IV', 'Accuracy Boost IV', 'Media', 'Rakunda'],
    Janosik: ['Attack Boost I', 'Apt Pupil III', 'Rakunda', 'Agility Master III', 'Tarukaja']
  };

  for (const [personaName, names] of Object.entries(examples)) {
    const legal = legalTransferableSkillsForPersona(persona(personaName), catalog.transferableSkills);
    for (const name of names) assert.ok(legal.some(skill => skill.name === name), `${personaName} can equip ${name}`);
  }
});

test('unique and Thief Tactics skills stay fixed outside the six equipment slots', () => {
  assert.deepEqual(fixedPersonaSkills(persona('Dionysus')).map(skill => skill.name), ['Revolution', 'Highlight']);
  assert.deepEqual(fixedPersonaSkills(persona('Vasuki')).map(skill => skill.name), ['Venomous Spiral', 'Highlight']);
  assert.deepEqual(fixedPersonaSkills(persona('Janosik')).map(skill => skill.name), ['Tatra Shot', 'Highlight']);
  assert.equal(PERSONA_EQUIP_SLOT_COUNT, 6);
});

test('loadout validation removes foreign unique skills, duplicate skills, and unknown IDs', () => {
  const dionysus = persona('Dionysus');
  const tarukaja = transferable('Tarukaja');
  const foreignUnique = persona('Janosik').skills.find(skill => skill.kind === 'unique');
  const result = sanitizePersonaSkillIds(dionysus, [tarukaja.id, tarukaja.id, foreignUnique.id, 'unknown-skill'], catalog.transferableSkills);
  assert.deepEqual(result, [tarukaja.id, '', '', '', '', '']);
});

test('reference-only equipment is retained in the build but never becomes a battle action', () => {
  const dionysus = persona('Dionysus');
  const autoMataru = transferable('Auto-Mataru IV');
  const counter = transferable('Counter II');
  const universalTheoria = transferable('Universal Theoria');
  assert.equal(autoMataru.combat.executable, false);
  assert.equal(counter.combat.executable, false);

  const skillIds = sanitizePersonaSkillIds(dionysus, [autoMataru.id, counter.id, universalTheoria.id], catalog.transferableSkills);
  assert.equal(skillIds[0], autoMataru.id);
  const battleSkills = battleSkillsForPersona(dionysus, skillIds, catalog.skillById, catalog.transferableSkills);
  assert.deepEqual(battleSkills.map(skill => skill.name), ['Revolution', 'Universal Theoria']);
});

test('a Persona cannot equip its own fixed unique skill through the transferable clone', () => {
  const janosik = persona('Janosik');
  const transferableTatra = transferable('Tatra Shot');
  const legal = legalTransferableSkillsForPersona(janosik, catalog.transferableSkills);
  assert.ok(!legal.some(skill => skill.id === transferableTatra.id));
});
