import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine, CURRENT_MECHANICS_PROFILE, RECORDED_MECHANICS_PROFILE } from '../src/engine.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';

const character = slug => structuredClone(lufelCatalog.characters.find(unit => unit.slug === slug));

function helper() {
  return {
    id: 'highlight-helper', slug: 'highlight-helper', codename: 'Helper', name: 'Highlight Helper',
    role: 'Support', element: 'support', awareness: 0, maxHp: 12000, maxSp: 100, attack: 1800,
    defense: 900, speed: 110, crit: 0.05, critMult: 1.5, maxAmmo: 8,
    skills: [{ id: 'helper-support', slot: 'S1', name: 'Helper Support', element: 'support', power: 0, target: 'party', cost: 0,
      buff: { id: 'helper-support-buff', name: 'HELPER SUPPORT', stat: 'damage', value: 0.1, duration: 1 } }],
    highlightSkill: { id: 'helper-highlight', slot: 'HL', name: 'Helper Highlight', element: 'bless', power: 1, target: 'boss', cost: 0 }
  };
}

function fixture(extra = {}) {
  const twins = character('j-c');
  const miku = character('miku');
  const support = helper();
  return new BattleEngine({
    seed: 55, bossId: 'hachiman', mechanicsProfile: CURRENT_MECHANICS_PROFILE,
    teamIds: [twins.id, support.id], characterDefinitions: [twins, support], navigatorDefinition: miku,
    jcMaskPair: ['mischief', 'service'], ...extra
  });
}

function gun(engine) {
  const action = engine.getAvailableActions().find(row => row.type === 'gun');
  return engine.step({ type: action.type, skillId: action.skillId, targetId: engine.state.boss.id });
}

test('live Highlight is one party meter with an explicit observed-replay override', () => {
  const engine = fixture({ sharedHighlightStart: 25, sharedHighlightGain: 17, sharedHighlightEvidence: 'live_t1_observation' });
  const initial = engine.getObservation().highlight;

  const { mode, current, max, gain, start, evidence, members } = initial;
  assert.deepEqual({ mode, current, max, gain, start, evidence, members }, {
    mode: 'shared', current: 25, max: 100, gain: 17, start: 25,
    evidence: 'live_t1_observation', members: engine.state.party.map(unit => unit.id)
  });
  assert.ok(engine.state.party.every(unit => unit.highlight === 0));
  // Reset's automatic Two Masks resolves before commands but is not a counted action.
  assert.equal(engine.state.sharedCombat.highlight, 25);

  gun(engine);
  assert.equal(engine.state.sharedCombat.highlight, 42);
  const support = engine.getAvailableActions().find(row => row.skillId === 'helper-support');
  engine.step({ type: support.type, skillId: support.skillId, targetId: engine.state.boss.id });
  assert.equal(engine.state.sharedCombat.highlight, 59);

  const jc = engine.state.party.find(unit => unit.slug === 'j-c');
  jc.facades = ['mischief', 'service'];
  engine.resolveJcAutoTwoMasks(jc, 'turn_start');
  assert.equal(engine.state.sharedCombat.highlight, 59);
});

test('confirmed ordinary action charge is 17, or 21 on weakness, including fast mode', () => {
  for (const fastMode of [false, true]) {
    for (const [element, target, expectedGain] of [['support', 'party', 17], ['curse', 'boss', 21], ['curse', 'all_enemies', 21]]) {
      const support = helper();
      support.skills[0] = {
        id: 'confirmed-charge-action', slot: 'S1', name: 'Confirmed Charge Action',
        element, target, power: element === 'support' ? 0 : 0.1, cost: 0
      };
      const engine = new BattleEngine({
        bossId: 'hachiman', modeId: 'multidimensional', mechanicsProfile: CURRENT_MECHANICS_PROFILE,
        seed: 55, fastMode, teamIds: [support.id], characterDefinitions: [support]
      });
      engine.step({ type: 'skill', skillId: 'confirmed-charge-action', targetId: engine.state.boss.id });
      assert.equal(engine.getHighlightState().current, expectedGain, `${element}/${target}, fast=${fastMode}`);
    }
  }
});

test('live shared Highlight makes every living normal Highlight available and resets once', () => {
  const engine = fixture({ sharedHighlightStart: 100 });
  const ready = engine.getHighlightActions().filter(action => action.enabled);
  assert.ok(ready.some(action => action.actorId === engine.state.party[0].id));
  assert.ok(ready.some(action => action.actorId === 'highlight-helper'));

  engine.stepHighlight('highlight:highlight-helper', engine.state.boss.id);
  assert.equal(engine.state.sharedCombat.highlight, 0);
  assert.equal(engine.getHighlightActions().length, 0);
});

test('Miku navigation does not charge the live meter and Showstopper preserves it while resetting Highlight cooldowns', () => {
  const engine = fixture({ sharedHighlightStart: 25, sharedHighlightGain: 17 });
  const trackId = engine.state.navigator.skills.find(action => action.name === 'Feel the Beat').id;
  engine.state.navigator.cooldowns[trackId] = 0;
  const track = engine.getNavigatorActions().find(action => action.id === trackId);
  engine.stepNavigator(track.id);
  assert.equal(engine.state.sharedCombat.highlight, 25);

  // The recorded live T5 Showstopper left the shared gauge unchanged (0% before
  // and after) while every party Highlight cooldown reset immediately.
  const concertEngine = fixture({ sharedHighlightStart: 25, sharedHighlightGain: 17 });
  for (const unit of concertEngine.state.party) for (const key of Object.keys(unit.highlightCooldowns)) unit.highlightCooldowns[key] = 3;
  concertEngine.state.navigator.tracks = ['Break', 'Critical', 'Expert'];
  const showstopper = concertEngine.getNavigatorActions().find(action => action.name === 'Showstopper');
  const result = concertEngine.stepNavigator(showstopper.id);
  assert.equal(concertEngine.state.sharedCombat.highlight, 25);
  assert.equal(result.events.filter(event => event.type === 'resource' && event.resource === 'sharedHighlight').length, 0);
  assert.deepEqual(
    result.events.filter(event => event.type === 'cooldown_reset').map(event => [event.actorId, event.sourceType]),
    concertEngine.state.party.map(unit => [unit.id, 'virtual_concert'])
  );
  assert.ok(concertEngine.state.party.every(unit => Object.values(unit.highlightCooldowns).every(value => value === 0)));
});

test('recorded profile retains personal Highlight meters', () => {
  const twins = character('j-c');
  const engine = new BattleEngine({
    seed: 55, bossId: 'hachiman', mechanicsProfile: RECORDED_MECHANICS_PROFILE,
    teamIds: [twins.id], characterDefinitions: [twins]
  });

  assert.equal(engine.getHighlightState().mode, 'personal');
  assert.equal(engine.state.sharedCombat.highlight, null);
  assert.equal(engine.state.party[0].highlight, 35);
});

test('fast-mode live counted actions update shared Highlight without writing an event array', () => {
  const engine = fixture({ fastMode: true, sharedHighlightStart: 25, sharedHighlightGain: 17 });
  assert.doesNotThrow(() => gun(engine));
  assert.equal(engine.state.sharedCombat.highlight, 42);
  assert.deepEqual(engine.state.lastEvents, []);
});

test('replay frames snapshot the shared Highlight state at their own action boundary', () => {
  const engine = fixture({ sharedHighlightStart: 25, sharedHighlightGain: 17 });
  gun(engine);
  const frame = engine.state.history.at(-1);
  assert.equal(frame.highlight.current, 42);
  engine.state.sharedCombat.highlight = 100;
  assert.equal(frame.highlight.current, 42);
});
