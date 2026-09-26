import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../src/engine.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';

const W = 'lufel-recent-puppet-wavecatcher';
const baseDefinitions = lufelCatalog.characters.filter(c => ['puppet-wavecatcher', 'berry', 'marian-beachflower'].includes(c.slug));
function setup(awareness, extra = {}) {
  const engine = new BattleEngine({ seed: 8, teamIds: [W, 'wonder', 'lufel-recent-berry', 'lufel-recent-marian-beachflower'],
    // Awareness is set on both the definition and the saved build so either engine generation reads it.
    characterDefinitions: baseDefinitions.map(unit => unit.id === W ? { ...unit, awareness } : unit),
    loadouts: { [W]: { awareness } }, ...extra });
  const miyu = engine.state.party.find(unit => unit.id === W);
  miyu.sp = 300;
  return { engine, miyu };
}
// Counted from the battle log so the test works on every engine generation.
const waves = engine => engine.state.log.filter(entry => entry.type === 'follow_up' && entry.skillId === 'catch_a_wave').length;
const use = (engine, name) => {
  const action = engine.getAvailableActions().find(item => item.skill?.name === name);
  assert.ok(action?.enabled, `${name} unavailable`);
  return engine.step({ type: action.type, skillId: action.skillId, targetId: engine.state.boss.id });
};

test('Paddle Out ON ends her turn and triggers two Catch a Waves (entry + turn end)', () => {
  const { engine, miyu } = setup(0);
  assert.equal(miyu.surfActive, false);
  const result = use(engine, 'Paddle Out');
  assert.equal(miyu.surfActive, true);
  assert.equal(result.consumedAction, true);
  assert.notEqual(engine.actor.id, W, 'her turn should end');
  assert.equal(waves(engine), 2);
  assert.equal(miyu.offshoreStacks, 2);
});

test('Paddle Out OFF does not end the turn; Surf cannot be re-entered that turn, other skills can be used', () => {
  const { engine, miyu } = setup(6);
  assert.equal(miyu.surfActive, true, 'A6 starts in Surf');
  const actionsBefore = engine.state.turnActionsUsed;
  const result = use(engine, 'Paddle Out');
  assert.equal(miyu.surfActive, false);
  assert.equal(result.consumedAction, false);
  assert.equal(engine.actor.id, W, 'still her turn');
  assert.equal(engine.state.turnActionsUsed, actionsBefore);
  const actions = engine.getAvailableActions();
  assert.equal(actions.find(action => action.skill?.name === 'Paddle Out').enabled, false);
  assert.ok(actions.some(action => action.enabled && action.skill?.name === 'Jellyfish Splash'));
  use(engine, 'Jellyfish Splash');
  assert.notEqual(engine.actor.id, W, 'the next skill ends her turn');
});

test('Catch a Wave on entry still needs SP; without enough SP only what she can pay for fires', () => {
  const { engine, miyu } = setup(0);
  miyu.sp = 60 + 30; // Paddle Out plus exactly one Catch a Wave at 0 Offshore
  use(engine, 'Paddle Out');
  assert.equal(waves(engine), 1);
});

test('the recorded profile keeps its archived Paddle Out behaviour', () => {
  const { engine, miyu } = setup(0, { mechanicsProfile: 'recorded-2026-08-29' });
  use(engine, 'Paddle Out');
  assert.equal(miyu.surfActive, true);
  assert.ok(waves(engine) <= 1);
});
