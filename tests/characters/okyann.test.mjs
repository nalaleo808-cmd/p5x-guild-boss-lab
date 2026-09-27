import test from 'node:test';
import assert from 'node:assert/strict';
import { characterDefinition } from '../../src/characters/okyann-data.js';
import { characterMechanics } from '../../src/characters/okyann-mechanics.js';

test('Okyann navigator uses nested source tier and converts four Beats into capped party rhythm', () => {
  const ally = { id: 'ally', hp: 100, buffs: [] };
  const okyann = { id: 'okyann', slug: 'okyann', hp: 100, attack: 1000, level: 80, awareness: 0, sourceTier: 3, skills: characterDefinition.skills, buffs: [] };
  const engine = { config: { loadouts: { okyann: { sourceTier: 2, characterResearch: { sourceTier: 1 } } } }, state: { party: [ally] }, random: () => 1,
    applyUnitBuff: (unit, buff) => { const index = unit.buffs.findIndex(item => item.id === buff.id); if (index >= 0) unit.buffs[index] = buff; else unit.buffs.push(buff); } };
  characterMechanics.initialize(engine, okyann);
  const intermission = characterDefinition.skills.find(skill => skill.characterAction === 'okyann:S2');
  const club = characterDefinition.skills.find(skill => skill.characterAction === 'okyann:S1');
  const prepared = characterMechanics.beforeNavigatorSkill(engine, okyann, intermission);
  assert.equal(prepared.okyannTier, 1);
  assert.equal(prepared.spRestore, 27);
  characterMechanics.afterNavigatorSkill(engine, okyann, prepared);
  assert.equal(okyann.okyann.beats, 3);
  characterMechanics.afterNavigatorSkill(engine, okyann, characterMechanics.beforeNavigatorSkill(engine, okyann, club));
  assert.equal(okyann.okyann.beats, 0);
  assert.equal(ally.buffs.find(buff => buff.id === 'okyann_rhythm_attack')?.value, .2);
});
