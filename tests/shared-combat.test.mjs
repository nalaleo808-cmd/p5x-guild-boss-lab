import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../src/engine.js';
import { bosses } from '../src/data.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';

// These explicit rules are fixtures for the runtime contract, not claimed game formulas.
const sourceUrl = 'test:shared-combat-fixture';
const strike = { id: 'fixture-strike', name: 'Fixture strike', slot: 'S1', element: 'curse',
  target: 'boss', power: 0.1, cost: 10, canCrit: false };
const unit = id => ({ id, name: id, codename: id, role: 'Assassin', element: 'curse',
  awareness: 0, maxHp: 100_000, maxSp: 100, attack: 100, defense: 100,
  crit: 0, critMult: 1.5, speed: 100, actionLimit: 1, skills: [strike] });
function fixture(extra = {}) {
  return new BattleEngine({ seed: 91, bossId: 'hachiman', teamIds: ['fixture-a', 'fixture-b'],
    bossDefinition: { ...structuredClone(bosses.find(boss => boss.id === 'hachiman')), summons: [] },
    characterDefinitions: [unit('fixture-a'), unit('fixture-b')], ...extra });
}
const dot = extra => ({ id: 'fixture-dot', name: 'Fixture DoT', sourceUrl, element: 'curse',
  powerPerStack: 0.1, duration: 2, timing: 'target_turn_end', stacking: 'add',
  stacks: 1, maxStacks: 3, canCrit: false, ...extra });
const reaction = (type, extra = {}) => ({ sourceUrl,
  trigger: type === 'one_more' ? 'enemy_downed' : 'all_living_enemies_downed',
  timing: 'after_counted_action', consumesCountedAction: false,
  damageActor: 'triggering_actor', grantsHighlight: false, maxPerOwnerTurn: 1, consumeDown: false,
  skill: { name: type, power: 0.2, cost: 0, canCrit: false,
    element: 'almighty', scalingStat: 'attack', target: type === 'one_more' ? 'boss' : 'all_enemies' }, ...extra });
const cast = engine => engine.step({ type: 'skill', skillId: strike.id, targetId: engine.state.boss.id });

test('owned DoTs stack, refresh, expire and retain independent sources', () => {
  const engine = fixture();
  const [first, second] = engine.state.party;
  const target = engine.state.boss;
  for (let i = 0; i < 4; i++) engine.applyContinuousDamage(first, target, dot());
  engine.applyContinuousDamage(second, target, dot());
  assert.deepEqual(target.debuffs.filter(effect => effect.sharedDot).map(effect => effect.stacks), [3, 1]);
  engine.tickEnemyStatuses(target);
  assert.ok(first.damageDone > second.damageDone * 2);
  assert.ok(target.debuffs.filter(effect => effect.sharedDot).every(effect => effect.duration === 1));
  engine.applyContinuousDamage(first, target, dot({ stacking: 'refresh' }));
  const refreshed = target.debuffs.find(effect => effect.sourceActorId === first.id);
  assert.equal(refreshed.duration, 2);
  assert.equal(refreshed.stacks, 3);
  engine.tickEnemyStatuses(target);
  assert.equal(target.debuffs.filter(effect => effect.sharedDot).length, 1);
  engine.tickEnemyStatuses(target);
  assert.equal(target.debuffs.filter(effect => effect.sharedDot).length, 0);
});

test('skill DoT application uses the same owned runtime and medicine damage category', () => {
  const engine = fixture();
  engine.random = () => 0.5;
  const actor = engine.actor;
  const skill = { ...strike, power: 0, continuousDamage: dot({ stacking: 'replace' }) };
  engine.resolveSkill(actor, skill, engine.state.boss.id);
  const first = engine.triggerContinuousDamage(engine.state.boss);
  actor.buffs.push({ id: 'fixture-dot-up', stat: 'dotDamage', value: 0.5, duration: 3 });
  const boosted = engine.triggerContinuousDamage(engine.state.boss);
  // Hachiman Dreamscape grants allies a permanent +30% continuous damage in
  // the same additive category as medicine `dotDamage`, so the 50% buff moves
  // the tick from 1.3x to 1.8x of its base rather than multiplying by 1.5.
  assert.equal(engine.isHachimanDreamscape(), true);
  const dreamscapeContinuousDamageBonus = 0.3;
  assert.ok(Math.abs(boosted - first * (1 + dreamscapeContinuousDamageBonus + 0.5) / (1 + dreamscapeContinuousDamageBonus)) <= 1);
  assert.ok(boosted > first);
  assert.equal(engine.state.boss.debuffs.find(effect => effect.sharedDot).sourceActorId, actor.id);
});

test('missing DoT fields produce a deduplicated limitation without damage or guessed status', () => {
  const engine = fixture();
  const before = engine.state.rng;
  for (let i = 0; i < 2; i++) engine.applyContinuousDamage(engine.actor, engine.state.boss, { id: 'unknown-dot' });
  assert.equal(engine.state.boss.debuffs.length, 0);
  assert.equal(engine.state.totalDamage, 0);
  assert.equal(engine.state.rng, before);
  const events = engine.state.log.filter(event => event.type === 'unmodeled_mechanic');
  assert.equal(events.length, 1);
  assert.ok(events[0].missing.includes('damage coefficient'));
  assert.ok(events[0].missing.includes('supported tick timing'));
});

test('a supplied target-turn DoT waits while Concert freezes the target turns', () => {
  const engine = fixture({ navigatorDefinition: lufelCatalog.characters.find(unit => unit.slug === 'miku') });
  engine.applyContinuousDamage(engine.actor, engine.state.boss, dot());
  engine.state.navigator.tracks = ['Break', 'Critical', 'Expert'];
  engine.stepNavigator(engine.getNavigatorActions().find(action => action.name === 'Showstopper').id);
  engine.step({ type: 'guard', skillId: 'guard' });
  engine.step({ type: 'guard', skillId: 'guard' });
  assert.equal(engine.state.navigator.virtualConcert.roundsRemaining, 1);
  assert.equal(engine.state.boss.debuffs.find(effect => effect.sharedDot).duration, 2);
  assert.equal(engine.state.totalDamage, 0);
});

test('ONE MORE and All-Out Attack defer turn completion and use their damage category', () => {
  const engine = fixture({ sharedMechanics: { one_more: reaction('one_more'), all_out_attack: reaction('all_out_attack') } });
  const actor = engine.actor;
  engine.state.boss.downPoints = 0;
  const before = engine.state.actionNumber;
  cast(engine);
  assert.equal(engine.actor.id, actor.id);
  assert.equal(actor.sp, 90);
  assert.equal(engine.state.actionNumber, before + 1);
  assert.equal(engine.state.turnActionsUsed, 0);
  assert.deepEqual(engine.getAvailableActions().map(action => action.type), ['one_more', 'all_out_attack', 'skip_extra_actions']);
  actor.buffs.push({ id: 'fixture-one-more-up', stat: 'oneMoreDamage', value: 0.5, duration: 2 });
  const first = engine.step({ type: 'one_more', skillId: 'shared:one_more' });
  assert.equal(first.consumedAction, false);
  assert.equal(engine.actor.id, actor.id);
  assert.ok(first.events.some(event => event.type === 'damage' && event.sourceType === 'one_more'));
  const second = engine.step({ type: 'all_out_attack', skillId: 'shared:all_out_attack' });
  assert.equal(second.consumedAction, false);
  assert.equal(engine.actor.id, 'fixture-b');
  assert.equal(actor.sp, 90);
  assert.equal(engine.state.actionNumber, before + 1);
  assert.equal(engine.state.sharedCombat.pendingActions.length, 0);
  assert.ok(second.events.some(event => event.type === 'damage' && event.sourceType === 'all_out_attack'));
  assert.throws(() => engine.step({ type: 'one_more', skillId: 'shared:one_more' }), /unavailable/i);
});

test('extra actions obey explicit Down consumption and can be skipped without stalling', () => {
  const engine = fixture({ sharedMechanics: { one_more: reaction('one_more', { consumeDown: true }), all_out_attack: reaction('all_out_attack') } });
  engine.state.boss.downPoints = 0;
  cast(engine);
  engine.step({ type: 'one_more', skillId: 'shared:one_more' });
  assert.equal(engine.state.boss.downed, false);
  assert.equal(engine.state.boss.downPoints, engine.state.boss.downMax);
  assert.equal(engine.actor.id, 'fixture-b');
  assert.equal(engine.getAvailableActions().some(action => action.type === 'all_out_attack'), false);
  const skipEngine = fixture({ sharedMechanics: { one_more: reaction('one_more') } });
  skipEngine.state.boss.downPoints = 0;
  cast(skipEngine);
  const damage = skipEngine.state.totalDamage;
  skipEngine.step({ type: 'skip_extra_actions', skillId: 'shared:skip' });
  assert.equal(skipEngine.state.totalDamage, damage);
  assert.equal(skipEngine.actor.id, 'fixture-b');
});

test('missing extra-action rules report limitations and preserve ordinary turn completion', () => {
  const engine = fixture();
  engine.state.boss.downPoints = 0;
  cast(engine);
  assert.equal(engine.actor.id, 'fixture-b');
  assert.equal(engine.state.sharedCombat.pendingActions.length, 0);
  assert.deepEqual(engine.state.sharedCombat.limitations.map(item => item.system), ['one_more', 'all_out_attack']);
});

test('Technical needs a compatible ailment and applies explicit damage and consumption rules', () => {
  const engine = fixture();
  engine.random = () => 0.5;
  const actor = engine.actor;
  const target = engine.state.boss;
  const technical = { ...strike, technical: { sourceUrl, ailmentIds: ['fixture-ailment'], chance: 1,
    damageMultiplier: 2, canCrit: false, consumeAilment: true } };
  const plain = engine.calculateDamage(actor, strike, target, 'character_skill').amount;
  assert.equal(engine.calculateDamage(actor, technical, target, 'character_skill').amount, plain);
  target.debuffs.push({ id: 'fixture-ailment', duration: 2 });
  const before = engine.state.totalDamage;
  engine.resolveSkill(actor, technical, target.id);
  assert.ok(Math.abs(engine.state.totalDamage - before - plain * 2) <= 1);
  assert.equal(target.debuffs.some(effect => effect.id === 'fixture-ailment'), false);
  assert.equal(engine.state.log.filter(event => event.type === 'technical').length, 1);
});

test('Technical Precision without a supplied scaling rule is reported instead of guessed', () => {
  const engine = fixture();
  engine.actor.buffs.push({ id: 'fixture-precision', stat: 'technicalPrecision', value: 600, duration: 2 });
  engine.state.boss.debuffs.push({ id: 'fixture-ailment', duration: 2 });
  engine.resolveSkill(engine.actor, { ...strike, technical: { sourceUrl, ailmentIds: ['fixture-ailment'],
    chance: 0.5, damageMultiplier: 2, canCrit: false, consumeAilment: false } }, engine.state.boss.id);
  assert.ok(engine.state.sharedCombat.limitations.some(item => item.missing.includes('Technical Precision scaling')));
  assert.equal(engine.state.log.some(event => event.type === 'technical'), false);
});

test('source-defined shared systems retain seeded fast/full damage and resource parity', () => {
  const run = fastMode => {
    const engine = fixture({ fastMode, sharedMechanics: { one_more: reaction('one_more') } });
    engine.state.boss.downPoints = 0;
    engine.applyContinuousDamage(engine.actor, engine.state.boss, dot());
    cast(engine);
    engine.step({ type: 'one_more', skillId: 'shared:one_more' });
    engine.tickEnemyStatuses(engine.state.boss);
    return { damage: engine.state.totalDamage, rng: engine.state.rng, party: engine.state.party,
      sharedCombat: engine.state.sharedCombat, score: engine.state.score };
  };
  assert.deepEqual(run(true), run(false));
  assert.deepEqual(run(false), run(false));
});
