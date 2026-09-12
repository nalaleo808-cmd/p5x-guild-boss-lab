import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine, CURRENT_MECHANICS_PROFILE } from '../src/engine.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';

const character = slug => structuredClone(lufelCatalog.characters.find(unit => unit.slug === slug));

function fixture(slugs = ['berry'], extra = {}) {
  const definitions = slugs.map(character);
  return new BattleEngine({
    seed: 55, bossId: 'hachiman', mechanicsProfile: CURRENT_MECHANICS_PROFILE,
    teamIds: definitions.map(unit => unit.id), characterDefinitions: definitions,
    navigatorDefinition: character('miku'), jcMaskPair: ['mischief', 'service'], ...extra
  });
}

function castBerryS1(engine, target = engine.state.boss.summons[0]) {
  const skill = engine.skillsFor().find(candidate => candidate.slot === 'S1');
  return engine.step({ type: 'skill', skillId: skill.id, targetId: target.id });
}

function killAllIdols(engine, { curseWeak = true } = {}) {
  for (const idol of engine.state.boss.summons) {
    idol.hp = 1;
    if (!curseWeak) idol.weakness = 'fire';
  }
}

test('Berry S1 kill resets earn one normal or weakness charge per actual cast without extra SP, cooldown, or turn use', () => {
  const engine = fixture();
  const berry = engine.actor;
  berry.skills.find(candidate => candidate.slot === 'S1').cooldown = 3;
  const skill = engine.skillsFor().find(candidate => candidate.slot === 'S1');
  killAllIdols(engine, { curseWeak: false });
  const before = { sp: berry.sp, actionNumber: engine.state.actionNumber };

  const result = castBerryS1(engine);

  const context = engine.getHighlightState().actionContext;
  assert.equal(engine.state.sharedCombat.highlight, 89);
  // Solo Berry's counted action wraps straight into her next turn, whose
  // guide-sourced base 10 SP recovery is the only SP gain; the repeats add none.
  const spEvents = result.events.filter(event => event.type === 'resource' && event.resource === 'sp');
  assert.deepEqual(spEvents.map(event => [event.sourceType, event.amount]), [['turn_start_recovery', 10]]);
  assert.equal(berry.sp, before.sp - skill.cost + 10);
  assert.equal(engine.state.actionNumber, before.actionNumber + 1);
  assert.equal(berry.skillCooldowns[skill.id], skill.cooldown - 1);
  assert.deepEqual(context.contributions.map(entry => entry.requestedGain), [17, 17, 17, 17, 21]);
  assert.equal(context.casts.filter(cast => cast.repeatReason === 'berry_s1_kill_reset').length, 4);
  assert.equal(context.unresolved.includes('additional repeat contribution is unconfirmed'), false);
  assert.equal(engine.getHighlightState().limitations.some(item => item.missing === 'additional repeat contribution is unconfirmed'), false);
});

test('Berry S1 reset diagnostics retain each cast gain and overflow at 100, including fast mode', () => {
  for (const fastMode of [false, true]) {
    const engine = fixture(['berry'], { fastMode });
    killAllIdols(engine);
    const result = castBerryS1(engine);
    const context = engine.getHighlightState().actionContext;

    assert.equal(engine.state.sharedCombat.highlight, 100, `fast=${fastMode}`);
    assert.deepEqual(context.contributions.map(entry => entry.requestedGain), [21, 21, 21, 21, 21]);
    if (fastMode) {
      assert.deepEqual(result.events, []);
      continue;
    }
    const gains = result.events.filter(event => event.type === 'resource' && event.resource === 'sharedHighlight');
    assert.equal(gains.length, 5);
    assert.deepEqual(gains.map(event => event.castGain), [21, 21, 21, 21, 21]);
    assert.equal(gains.at(-1).appliedGain, 16);
    assert.equal(gains.at(-1).overflow, 5);
    assert.equal(gains.at(-1).evidence, 'user_correction_berry_s1_kill_reset_2026-09-05');
  }
});

test('Berry S1 kill-reset charges use the existing Concert 2x rates', () => {
  const engine = fixture();
  const [first, ...others] = engine.state.boss.summons;
  first.hp = 1;
  for (const idol of others) idol.alive = false;
  engine.state.navigator.virtualConcert.active = true;
  engine.state.navigator.virtualConcert.roundsRemaining = 2;

  castBerryS1(engine, first);

  const context = engine.getHighlightState().actionContext;
  assert.equal(engine.state.sharedCombat.highlight, 84);
  assert.deepEqual(context.contributions.map(entry => entry.requestedGain), [42, 42]);
  assert.equal(context.contributions[1].repeatReason, 'berry_s1_kill_reset');
});

test('DOUBLE BERRY and automatic J&C S3 remain unconfirmed repeat sources', () => {
  const berryEngine = fixture();
  berryEngine.actor.chainsOfLove = 3;
  const alt = berryEngine.getBerryAltActions().find(action => action.skill.slot === 'S2');
  berryEngine.step({ type: 'berry_alt', skillId: alt.skillId, targetId: berryEngine.state.boss.id });
  const berryContext = berryEngine.getHighlightState().actionContext;
  assert.equal(berryContext.casts.at(-1).repeatReason, 'berry_alt_repeat');
  assert.ok(berryEngine.getHighlightState().limitations.some(item => item.missing === 'additional repeat contribution is unconfirmed'));

  const jcEngine = fixture(['j-c']);
  jcEngine.actor.facades = ['mischief'];
  const service = jcEngine.getAvailableActions().find(action => action.skill?.slot === 'S2');
  jcEngine.step({ type: service.type, skillId: service.skillId, targetId: jcEngine.state.boss.id });
  const jcContext = jcEngine.getHighlightState().actionContext;
  assert.equal(jcContext.casts.at(-1).sourceType, 'awareness_follow_up');
  assert.equal(jcContext.casts.at(-1).automatic, true);
  assert.ok(jcEngine.getHighlightState().limitations.some(item => item.missing === 'automatic follow-up contribution is unconfirmed'));
});

test('explicit scalar override remains one legacy action charge across Berry kill resets', () => {
  const engine = fixture(['berry'], { sharedHighlightGain: 17 });
  killAllIdols(engine);

  castBerryS1(engine);

  const context = engine.getHighlightState().actionContext;
  assert.equal(engine.state.sharedCombat.highlight, 17);
  assert.equal(context.ruleId, 'explicit_replay_scalar_override');
  assert.equal(context.contributions.length, 1);
  assert.equal(context.contributions[0].requestedGain, 17);
});
