import test from 'node:test';
import assert from 'node:assert/strict';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';
import { buildPersonaLoadoutCatalog, defaultPersonaSkillIds, legalTransferableSkillsForPersona, PERSONA_EQUIP_SLOT_COUNT } from '../src/persona-loadout.js';
import { PERSONA_RECOMMENDATIONS, PERSONA_SKILL_NAME_ALIASES, withPersonaRecommendations } from '../src/persona-recommendations.js';
import { PERSONA_SKILL_ADAPTERS } from '../src/hachiman-recorded-team.js';
import { BattleEngine } from '../src/engine.js';
import { withPersonaAdditions } from '../src/persona-additions.js';

const norm = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const transferable = buildPersonaLoadoutCatalog(lufelCatalog, []).transferableSkills;
const byId = new Map(transferable.map(skill => [skill.id, skill]));
const catalogPersonas = withPersonaAdditions(lufelCatalog.personas);
const overlaid = withPersonaRecommendations(catalogPersonas, transferable);
const find = (list, name) => list.find(persona => norm(persona.name) === norm(name));
// Same rule the app uses to list a Persona in Wonder's slots.
const pickable = persona => persona.skills.some(skill => skill.kind === 'unique' && (skill.combat.executable || PERSONA_SKILL_ADAPTERS[skill.name]));

test('the list covers 11 S-tier and 17 A-tier Personas with 161 recommendation rows', () => {
  const entries = Object.values(PERSONA_RECOMMENDATIONS);
  assert.equal(entries.filter(entry => entry.tier === 'S').length, 11);
  assert.equal(entries.filter(entry => entry.tier === 'A').length, 17);
  assert.equal(entries.reduce((n, entry) => n + entry.skills.length, 0), 161);
});

test('every listed Persona is in the catalog and can be equipped by Wonder', () => {
  for (const name of Object.keys(PERSONA_RECOMMENDATIONS)) {
    const persona = find(catalogPersonas, name);
    assert.ok(persona, `${name} missing from the catalog`);
    assert.ok(pickable(persona), `${name} cannot be equipped (unique skill not executable)`);
  }
});

test('every recommended skill resolves to a transferable skill (Warrior\'s Unity is the catalog\'s Spirit Harmony)', () => {
  assert.equal(PERSONA_SKILL_NAME_ALIASES["Warrior's Unity"], 'Spirit Harmony');
  for (const [name, entry] of Object.entries(PERSONA_RECOMMENDATIONS)) {
    for (const rec of find(overlaid, name).recommendedSkills || []) assert.ok(rec.skillId, `${name}: ${rec.listedName} unresolved`);
    if (entry.skills.length) assert.equal(find(overlaid, name).recommendedSkills.length, entry.skills.length);
  }
});

test('listed Personas default to exactly the list, in priority order, up to six slots, with no innate filler', () => {
  for (const [name, entry] of Object.entries(PERSONA_RECOMMENDATIONS)) {
    if (!entry.skills.length) continue;
    const persona = find(overlaid, name);
    const defaults = defaultPersonaSkillIds(persona, transferable).filter(Boolean).map(id => byId.get(id).name);
    const expected = [...new Set(entry.skills.map(skill => PERSONA_SKILL_NAME_ALIASES[skill.name] || skill.name))]
      .map(skillName => transferable.find(skill => norm(skill.name) === norm(skillName)).name)
      .filter(skillName => legalTransferableSkillsForPersona(persona, transferable).some(skill => skill.name === skillName))
      .slice(0, PERSONA_EQUIP_SLOT_COUNT);
    assert.deepEqual(defaults, expected, name);
  }
  const janosik = defaultPersonaSkillIds(find(overlaid, 'Janosik'), transferable).filter(Boolean).map(id => byId.get(id).name);
  assert.deepEqual(janosik, ['Rakunda', 'Rebellion', 'Apt Pupil', 'Tarukaja', 'Regenerate', 'Reduction Boost']);
  const raphael = defaultPersonaSkillIds(find(overlaid, 'Raphael'), transferable).filter(Boolean).map(id => byId.get(id).name);
  assert.deepEqual(raphael, ['Yggdrasil Evolution', 'Cohesion', 'Tarukaja']);
});

test('Kohryu (no published recommendations) and unlisted Personas keep their previous defaults', () => {
  assert.equal(find(overlaid, 'Kohryu').recommendationsOnly, undefined);
  for (const persona of catalogPersonas.filter(p => !Object.keys(PERSONA_RECOMMENDATIONS).some(name => norm(name) === norm(p.name)))) {
    assert.deepEqual(defaultPersonaSkillIds(find(overlaid, persona.name), transferable), defaultPersonaSkillIds(persona, transferable), persona.name);
  }
});

test('Elec Break / Fire Break remove that element\'s resistance while active', () => {
  const e = new BattleEngine({ seed: 17 });
  const target = { resistance: 'fire', resistances: ['electric'], debuffs: [] };
  assert.equal(e.resistsElement(target, 'fire'), true);
  assert.equal(e.resistsElement(target, 'electric'), true);
  target.debuffs.push({ ...PERSONA_SKILL_ADAPTERS['Fire Break'].debuff });
  assert.equal(e.resistsElement(target, 'fire'), false);
  assert.equal(e.resistsElement(target, 'electric'), true);
  target.debuffs.push({ ...PERSONA_SKILL_ADAPTERS['Elec Break'].debuff });
  assert.equal(e.resistsElement(target, 'electric'), false);
  target.debuffs = [{ ...PERSONA_SKILL_ADAPTERS['Fire Break'].debuff, duration: 0 }];
  assert.equal(e.resistsElement(target, 'fire'), true);
});

test("Spirit Harmony is shown as Warrior's Unity and the list still resolves after renaming", async () => {
  const { applyCurrentSkillNames } = await import('../src/persona-recommendations.js');
  const fresh = buildPersonaLoadoutCatalog(lufelCatalog, []);
  applyCurrentSkillNames([...new Set([...fresh.transferableSkills, ...fresh.skillById.values()])]);
  const renamed = fresh.transferableSkills.find(skill => skill.catalogName === 'Spirit Harmony');
  assert.equal(renamed.name, "Warrior's Unity");
  assert.equal(fresh.transferableSkills.some(skill => skill.name === 'Spirit Harmony'), false);
  const macabre = find(withPersonaRecommendations(catalogPersonas, fresh.transferableSkills), 'Macabre');
  assert.equal(macabre.recommendedSkills.find(rec => rec.listedName === "Warrior's Unity").skillId, renamed.id);
});
