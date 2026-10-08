import test from 'node:test';
import assert from 'node:assert/strict';
import { HachimanRecordedEngine, character, navigatorDefinition } from '../src/hachiman-recorded-team.js';
import { CURRENT_MECHANICS_PROFILE } from '../src/engine.js';
import { KOTONE_SHIOMI_ID as K } from '../src/characters/kotone-shiomi-data.js';

// User, 2026-10-08: Kotone's Lunar Phaseshift can copy Marian's medicine effects.
test('Lunar Phaseshift naming Marian copies her Flower Basket Pharmacy medicines on the linked ally', () => {
  const marian = character('marian-beachflower');
  const miyu = character('puppet-wavecatcher');
  const e = new HachimanRecordedEngine({
    seed: 1, bossId: 'surt', modeId: 'devourer', mechanicsProfile: CURRENT_MECHANICS_PROFILE, fastMode: true,
    teamIds: [marian.id, 'wonder', K, miyu.id], characterDefinitions: [marian, miyu], navigatorDefinition: navigatorDefinition(),
    loadouts: { [K]: { awareness: 6, mindscape: 5, weaponId: 'vetri-vel-muruga', enhancement: 6 } }
  });
  assert.equal(e.actor.id, marian.id);
  assert.equal(e.kotoneMechanics.linked.id, miyu.id);
  const linked = e.state.party.find(unit => unit.id === miyu.id);
  const marianUnit = e.state.party.find(unit => unit.id === marian.id);
  for (const id of ['attack_tablet', 'reso_up', 'one_more_up']) {
    marianUnit.lastMedicineCharacterTurn = -1;
    marianUnit.midsummerPrescription = 5;
    e.stepMedicine(id, miyu.id);
  }
  const tablet = linked.buffs.find(buff => buff.id === 'medicine_attack');
  assert.equal(tablet.provenance.originalCasterId, marian.id);
  const copied = e.kotoneMechanics.copyBuffs(marian.id, 'medicine-copy-test').filter(result => result.applied).map(result => result.effect);
  const ratio = e.kotoneMechanics.copyMultiplier() * (1 + e.skillAmplificationFor(e.state.party.find(unit => unit.id === K)));
  assert.deepEqual(copied.map(effect => effect.stat).sort(), ['attack', 'critDamage', 'oneMoreDamage', 'resonanceDamage']);
  const attackCopy = copied.find(effect => effect.stat === 'attack');
  assert.ok(Math.abs(attackCopy.value - tablet.value * ratio) < 1e-9);
  assert.ok(!copied.some(effect => effect.stat === 'finalDamage'), 'the A6 Summertime Refresh is not a medicine effect');
});

test('dream items Marian uses are not her medicines and are not copied', () => {
  const marian = character('marian-beachflower');
  const miyu = character('puppet-wavecatcher');
  const e = new HachimanRecordedEngine({
    seed: 1, bossId: 'surt', modeId: 'devourer', mechanicsProfile: CURRENT_MECHANICS_PROFILE, fastMode: true,
    teamIds: [marian.id, 'wonder', K, miyu.id], characterDefinitions: [marian, miyu], navigatorDefinition: navigatorDefinition(),
    loadouts: { [K]: { awareness: 6, mindscape: 5, weaponId: 'vetri-vel-muruga', enhancement: 6 } }
  });
  e.state.itemInventory.fighter_salve = 1;
  e.state.itemUsesRemaining = Math.max(1, Number(e.state.itemUsesRemaining || 0));
  e.stepItem('fighter_salve', miyu.id);
  const linked = e.state.party.find(unit => unit.id === miyu.id);
  assert.equal(linked.buffs.find(buff => buff.id === 'medicine_damage').provenance.originalCasterId, null);
});
