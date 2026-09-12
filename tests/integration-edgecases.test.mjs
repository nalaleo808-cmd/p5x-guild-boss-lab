import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../src/engine.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';

const character = slug => structuredClone(lufelCatalog.characters.find(unit => unit.slug === slug));

function battleFixture(slugs = ['berry', 'j-c']) {
  const definitions = slugs.map(character);
  const engine = new BattleEngine({
    seed: 55,
    bossId: 'hachiman',
    teamIds: definitions.map(unit => unit.id),
    characterDefinitions: definitions,
    navigatorDefinition: character('miku')
  });
  return engine;
}

function startConcert(engine) {
  engine.state.navigator.tracks = ['Break', 'Critical', 'Expert'];
  const showstopper = engine.getNavigatorActions().find(action => action.name === 'Showstopper');
  assert.ok(showstopper.enabled);
  engine.stepNavigator(showstopper.id);
}

function concertFixture(slugs = ['berry', 'j-c']) {
  const engine = battleFixture(slugs);
  const berry = engine.state.party.find(unit => unit.slug === 'berry');
  Object.assign(berry, { hp: 1, chainsOfLove: 5, powerOfLoveUsed: true, powerOfLove: 1 });
  startConcert(engine);
  return { engine, berry };
}

const guard = engine => engine.step({ type: 'guard', skillId: 'guard' });

test('Concert round two skips Berry after Power of Love expires in round one', () => {
  const { engine, berry } = concertFixture();
  guard(engine);
  assert.equal(berry.hp, 0);
  assert.equal(berry.powerOfLove, 0);
  assert.equal(engine.actor.slug, 'j-c');
  guard(engine);
  assert.equal(engine.isVirtualConcertActive(), true);
  assert.equal(engine.state.navigator.virtualConcert.roundsRemaining, 1);
  assert.equal(engine.actor.slug, 'j-c');
  assert.ok(engine.actor.hp > 0);
  assert.equal(engine.getAvailableActions().some(action => action.enabled && action.actorId === berry.id), false);
});

test('a stale owner selection cannot execute actions for expired Berry', () => {
  const { engine, berry } = concertFixture();
  guard(engine);
  assert.equal(berry.hp, 0);
  // An interrupted owner context must not bypass the engine's action boundary.
  engine.state.actorIndex = engine.state.party.findIndex(unit => unit.id === berry.id);
  const damageBefore = engine.state.totalDamage;
  assert.equal(engine.getAvailableActions().some(action => action.enabled), false);
  assert.throws(() => guard(engine), /unavailable|dead|defeated|cannot act/i);
  assert.equal(engine.state.totalDamage, damageBefore);
});

test('Power of Love party wipe ends Concert without granting a dead actor another turn', () => {
  const { engine, berry } = concertFixture(['berry']);
  const result = guard(engine);
  assert.equal(berry.hp, 0);
  assert.equal(berry.powerOfLove, 0);
  assert.equal(result.done, true);
  assert.equal(engine.state.phase, 'results');
  assert.equal(engine.state.result.outcome, 'defeat');
  assert.equal(engine.getAvailableActions().some(action => action.enabled), false);
  assert.equal(engine.getHighlightActions().some(action => action.enabled), false);
});

test('Concert entry and ordinary round entry skip an already defeated first owner', () => {
  for (const enterConcert of [false, true]) {
    const engine = battleFixture();
    engine.state.party[0].hp = 0;
    engine.state.actorIndex = 1;
    if (enterConcert) startConcert(engine);
    else guard(engine);
    assert.equal(engine.actor.slug, 'j-c');
    assert.ok(engine.actor.hp > 0);
    assert.equal(engine.state.phase, 'battle');
    assert.equal(engine.isVirtualConcertActive(), enterConcert);
    assert.equal(engine.state.attackTurn, enterConcert ? 1 : 2);
  }
});

test('Concert exit advances past a saved owner who expired during the extra turns', () => {
  const { engine, berry } = concertFixture();
  guard(engine);
  guard(engine);
  guard(engine);
  assert.equal(berry.hp, 0);
  assert.equal(engine.isVirtualConcertActive(), false);
  assert.equal(engine.actor.slug, 'j-c');
  assert.equal(engine.state.attackTurn, 1);
  assert.equal(engine.state.turnActionsUsed, 0);
});

test('Concert exit resolves the ordinary round boundary when its saved last owner expired', () => {
  const engine = battleFixture(['j-c', 'berry']);
  guard(engine);
  assert.equal(engine.actor.slug, 'berry');
  const berry = engine.actor;
  Object.assign(berry, { hp: 1, chainsOfLove: 5, powerOfLoveUsed: true, powerOfLove: 1 });
  const bossActionsBefore = engine.state.log.filter(event => event.type === 'boss_move').length;
  startConcert(engine);
  guard(engine);
  assert.equal(berry.hp, 0);
  guard(engine);
  assert.equal(engine.isVirtualConcertActive(), false);
  assert.equal(engine.actor.slug, 'j-c');
  assert.equal(engine.state.attackTurn, 2);
  assert.equal(engine.state.turnActionsUsed, 0);
  assert.equal(engine.state.log.filter(event => event.type === 'boss_move').length, bossActionsBefore + 1);
});

test('ordinary healing restores living allies without reviving defeated allies', () => {
  const engine = battleFixture(['berry', 'marian-beachflower']);
  const [berry, marian] = engine.state.party;
  berry.hp = 0;
  marian.hp = marian.maxHp - 100;
  assert.equal(engine.healUnit(marian, berry, 100), 0);
  assert.equal(berry.hp, 0);
  engine.resolveSkill(marian, {
    id: 'fixture_party_heal', name: 'Fixture party heal', power: 0, cost: 0,
    heal: 0.25, target: 'party'
  }, 'party');
  assert.equal(berry.hp, 0);
  assert.ok(marian.hp > marian.maxHp - 100);
});
