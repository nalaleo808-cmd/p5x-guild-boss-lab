import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyRecordedDefaultStats, berrySpPreset, ichigoStatsPreset, marianRevelationPreset, marianSpPreset, wonderWeaponPreset
} from '../src/default-presets.js';

test('Ichigo defaults match the fifteen screenshot values in display units except the instructed 180 max SP', () => {
  const loadout = applyRecordedDefaultStats('lufel-recent-berry');
  assert.equal(loadout.statsMode, 'equipped');
  assert.equal(ichigoStatsPreset.baseStats.maxSp, 100);
  assert.equal(loadout.spPresetId, berrySpPreset.id);
  assert.deepEqual(loadout.baseStats, {
    attack: 4927, defense: 1494, maxHp: 8634, maxSp: 180, speed: 96,
    critRate: 54.2, critMult: 235.5, spRecovery: 0, technicalPrecision: 0,
    pierceRate: 7.5, downPoints: 0, ailmentAccuracy: 3.1,
    ailmentResistance: 0, damageBonus: 55.9, damageReduction: 0
  });
});

test('older Ichigo saves get the requested stats once and retain equipment and later edits', () => {
  const old = { baseStats: { attack: 100 }, revelationMain: 'Resolve', revelationSet: 'Control' };
  const upgraded = applyRecordedDefaultStats(ichigoStatsPreset.characterId, old);
  assert.equal(upgraded.baseStats.attack, 4927);
  assert.equal(upgraded.revelationMain, 'Resolve');
  assert.equal(upgraded.revelationSet, 'Control');
  assert.equal(old.baseStats.attack, 100);
  const editedSave = JSON.parse(JSON.stringify(upgraded));
  editedSave.baseStats.attack = 5100;
  assert.equal(applyRecordedDefaultStats(ichigoStatsPreset.characterId, editedSave).baseStats.attack, 5100);
  assert.equal(applyRecordedDefaultStats(ichigoStatsPreset.characterId).baseStats.attack, 4927);
});

test('Marian and Wonder presets apply once while characters without presets keep their saves', () => {
  const saved = { baseStats: { maxHp: 12345 }, revelationSet: 'Peace' };
  assert.equal(applyRecordedDefaultStats('lufel-recent-j-c', saved), saved);
  assert.equal(applyRecordedDefaultStats('joker', saved), saved);

  // Marian receives the instructed 180 max SP and the confirmed Trust +
  // Prosperity loadout once; existing stats survive and later edits persist.
  const marian = applyRecordedDefaultStats('lufel-recent-marian-beachflower', saved);
  assert.deepEqual(marian, {
    baseStats: { maxHp: 12345, maxSp: 180 }, spPresetId: marianSpPreset.id,
    revelationMain: 'Trust', revelationSet: 'Prosperity', revelationPresetId: marianRevelationPreset.id
  });
  assert.deepEqual(saved, { baseStats: { maxHp: 12345 }, revelationSet: 'Peace' });
  assert.equal(applyRecordedDefaultStats('lufel-recent-marian-beachflower', marian), marian);
  const edited = { ...marian, revelationSet: 'Peace', baseStats: { ...marian.baseStats, maxSp: 150 } };
  assert.equal(applyRecordedDefaultStats('lufel-recent-marian-beachflower', edited), edited);

  const wonder = applyRecordedDefaultStats('wonder', saved);
  assert.deepEqual(wonder, {
    ...saved, weaponId: wonderWeaponPreset.weaponId, weaponProfileId: wonderWeaponPreset.weaponProfileId,
    weaponProcGranularity: null, weaponPresetId: wonderWeaponPreset.id
  });
  assert.equal(applyRecordedDefaultStats('wonder', wonder), wonder);
});
