import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine, CURRENT_MECHANICS_PROFILE, RECORDED_MECHANICS_PROFILE } from '../src/engine.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';

const character = slug => structuredClone(lufelCatalog.characters.find(unit => unit.slug === slug));
const engine = (extra = {}) => new BattleEngine({
  seed: 55, bossId: 'slaughter_drive', mechanicsProfile: CURRENT_MECHANICS_PROFILE,
  teamIds: ['wonder'], navigatorDefinition: character('miku'), ...extra
});

// Lufel MIKU A0: MIKU can change the battle scenery and song during allies' turns.
test('MIKU song is a free player choice during ally turns', () => {
  const e = engine();
  const before = { actor: e.actor.id, actions: e.state.turnActionsUsed, turn: e.state.attackTurn };
  assert.deepEqual(e.getObservation().mikuSongs, ['Heaven', 'Spring Storm', 'Play-With-Fire']);
  assert.equal(e.getObservation().canSelectMikuSong, true);
  e.selectMikuSong('Play-With-Fire');
  assert.equal(e.state.navigator.currentSong, 'Play-With-Fire');
  assert.equal(e.state.navigator.songIndex, 2);
  assert.deepEqual({ actor: e.actor.id, actions: e.state.turnActionsUsed, turn: e.state.attackTurn }, before);
  assert.throws(() => e.selectMikuSong('Ghost Rule'), /Unknown MIKU song/);
});

test('MIKU song cannot change during Virtual Concert or in the recorded profile', () => {
  const e = engine();
  e.state.navigator.virtualConcert = { active: true, roundsRemaining: 2, damageByTarget: {}, totalRecordedDamage: 0, savedTurn: null };
  assert.equal(e.canSelectMikuSong(), false);
  assert.throws(() => e.selectMikuSong('Heaven'));
  const recorded = engine({ mechanicsProfile: RECORDED_MECHANICS_PROFILE });
  assert.equal(recorded.canSelectMikuSong(), false);
});
