import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../src/engine.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';
import { bosses } from '../src/data.js';

const character = slug => structuredClone(lufelCatalog.characters.find(unit => unit.slug === slug));
const guard = engine => engine.step({ type: 'guard', skillId: 'guard' });

// Hachiman with its result screen removed: the damage-only preview mode still
// applies to any MLD boss whose Turns Survived Bonus is not yet recorded.
const unscoredHachiman = { ...structuredClone(bosses.find(boss => boss.id === 'hachiman')), dreamscapeScoreVerified: false };

function previewFixture(extra = {}) {
  return new BattleEngine({
    seed: 55, bossId: 'hachiman', bossDefinition: unscoredHachiman, modeId: 'multidimensional', teamIds: ['wonder'],
    loadouts: { wonder: { baseStats: { maxHp: 100_000 } } }, ...extra
  });
}

test('Dreamscape credits raw simulated damage and reports turn-weighted Foe Defense Points with an unknown survival bonus', () => {
  const engine = previewFixture();
  assert.equal(engine.isDreamscapePreview(), true);
  assert.equal(engine.state.boss.difficultyBonus, 8);
  assert.equal(engine.state.attackTurn, 1);
  engine.step({ type: 'attack', skillId: 'basic_attack', targetId: engine.state.boss.id });
  const damage = engine.state.totalDamage;
  assert.ok(damage > 0);
  assert.equal(engine.state.score, damage);
  assert.equal(engine.state.scoreBreakdown.damagePreview, damage);
  // Turn 1 damage is weighted x0.5 (T2 x1, T3 x1.5, T4+ x2) and rounded once
  // into Foe Defense Points; Turns Survived Bonus accumulation stays unknown.
  assert.deepEqual(engine.state.scoreBreakdown.turnScoreBuckets, [
    { normalTurn: 1, rawDamage: damage, multiplier: 0.5, weightedPoints: damage * 0.5 }
  ]);
  assert.equal(engine.state.scoreBreakdown.turnWeightedDamagePoints, damage * 0.5);
  assert.equal(engine.state.scoreBreakdown.foeDefensePoints, Math.round(damage * 0.5));
  assert.equal(engine.state.scoreBreakdown.turnsSurvivedBonus, null);
  assert.equal(engine.state.scoreBreakdown.difficultyBonus, 8);
  assert.equal(engine.state.scoreBreakdown.baseDamagePoints, undefined);
  assert.equal(engine.state.scoreBreakdown.weakenedDamagePoints, undefined);
  while (engine.state.phase === 'battle') guard(engine);
  assert.equal(engine.state.result.score, engine.state.totalDamage);
  assert.equal(engine.state.result.scoreStatus, 'damage_preview_only');
  assert.equal(engine.state.result.scoreBreakdown.foeDefensePoints, Math.round(damage * 0.5));
  assert.equal(engine.state.result.scoreBreakdown.turnsSurvivedBonus, null);
  assert.equal(engine.state.result.scoreBreakdown.difficultyBonus, 8);
});

test('all MLD bosses use the shared turn score multiplier', () => {
  const engine = new BattleEngine({
    seed: 55, bossId: 'surt', modeId: 'multidimensional', teamIds: ['wonder'],
    loadouts: { wonder: { baseStats: { maxHp: 100_000 } } }
  });
  engine.step({ type: 'attack', skillId: 'basic_attack', targetId: engine.state.boss.id });
  const damage = engine.state.totalDamage;
  assert.equal(engine.state.scoreBreakdown.turnScoreBuckets[0].multiplier, 0.5);
  assert.equal(engine.state.scoreBreakdown.turnWeightedDamagePoints, damage * 0.5);
  assert.equal(engine.isDreamscapePreview(), false);
  assert.equal(engine.state.score, Math.round(damage * 0.5));
});

test('Surt MLD converts Foe Defense Points into the verified six-turn result', () => {
  const engine = new BattleEngine({
    seed: 55, bossId: 'surt', modeId: 'multidimensional', teamIds: ['wonder'],
    loadouts: { wonder: { baseStats: { maxHp: 100_000 } } }
  });
  while (engine.state.phase === 'battle') guard(engine);
  const breakdown = engine.state.result.scoreBreakdown;
  assert.equal(engine.state.result.outcome, 'timeout');
  assert.equal(engine.state.result.attackTurns, 6);
  assert.equal(breakdown.turnsSurvivedBonus, 250_000);
  assert.equal(breakdown.difficultyBonus, 4);
  assert.equal(engine.state.result.score, (breakdown.foeDefensePoints + 250_000) * 4);
  assert.equal(engine.state.result.scoreStatus, 'simulated_score');
});

test('NOD uses the shared turn score multiplier for Surt', () => {
  for (const modeId of ['nexus']) {
    const engine = new BattleEngine({
      seed: 55, bossId: 'surt', modeId, teamIds: ['wonder'],
      loadouts: { wonder: { baseStats: { maxHp: 100_000 } } }
    });
    engine.step({ type: 'attack', skillId: 'basic_attack', targetId: engine.state.boss.id });
    assert.equal(engine.state.score, Math.round(engine.state.totalDamage * 0.5));
  }
});

test('live MLD, NOD, and DOD score bosses share the source-scale damage formula', () => {
  for (const modeId of ['multidimensional', 'nexus', 'devourer']) {
    const engine = new BattleEngine({
      seed: 55, bossId: 'surt', modeId, teamIds: ['wonder'],
      loadouts: { wonder: { statsMode: 'equipped', baseStats: { attack: 10_000, maxHp: 100_000 } } }
    });
    const result = engine.calculateDamage(engine.actor, {
      id: 'source-scale-check', name: 'Source scale check', element: 'almighty', power: 1, canCrit: false
    }, engine.state.boss, 'character_skill');
    assert.equal(engine.usesSourceScaleDamageFormula(), true);
    assert.equal(result.damageFormula.normalization, 1);
    assert.match(result.damageFormula.model, /source_scale/);
    assert.ok(result.amount < 20_000, `${modeId}: ${result.amount}`);
  }
});

test('Dreamscape remains playable at zero and stops at the configured six-round preview limit', () => {
  const engine = previewFixture();
  assert.equal(engine.state.boss.previewAttackTurns, 6);
  while (engine.state.attackTurn < 6 && engine.state.phase === 'battle') guard(engine);
  assert.equal(engine.state.attackTurn, 6);
  assert.equal(engine.state.attackTurnsLeft, 0);
  assert.equal(engine.state.phase, 'battle');
  assert.ok(engine.getAvailableActions().some(action => action.enabled));
  while (engine.state.phase === 'battle') guard(engine);
  assert.equal(engine.state.attackTurnsLeft, 0);
  assert.equal(engine.state.result.outcome, 'preview_complete');
  assert.equal(engine.state.result.rounds, 6);
  assert.equal(engine.state.result.preview, true);
  assert.ok(engine.state.result.mechanicsLimitations.some(text => /actual ending trigger.*unverified/i.test(text)));
});

test('Dreamscape never enters a Nexus Weakened scoring window during its preview', () => {
  const engine = previewFixture();
  do {
    const observation = engine.getObservation();
    assert.equal(observation.weakened, false);
    assert.equal(observation.weakenedTurnsLeft, 0);
    assert.equal(engine.canBreakBoss(), false);
    if (engine.state.phase === 'battle') guard(engine);
    else break;
  } while (true);
  assert.equal(engine.state.result.outcome, 'preview_complete');
  assert.equal(engine.state.log.some(event => event.type === 'break'), false);
});

test('Hachiman retains all four listed resistances with a Medic party', () => {
  const engine = previewFixture({ teamIds: ['mona'] });
  const target = engine.state.boss;
  const neutral = { ...target, resistance: 'none', resistances: [], finalDamageTakenMultiplier: 1 };
  for (const element of ['fire', 'ice', 'electric', 'nuclear', 'wind']) {
    const baseline = engine.statusMultiplier(engine.actor, element, neutral, 'basic_attack');
    const actual = engine.statusMultiplier(engine.actor, element, target, 'basic_attack');
    const expected = element === 'wind' ? 1 : 0.7;
    assert.ok(Math.abs(actual / baseline - expected) < 1e-12, `${element} multiplier`);
  }
});

test('Hachiman rejects spiritual and control ailments while accepting ordinary defense debuffs', () => {
  const engine = previewFixture();
  const target = engine.state.boss;
  for (const status of [
    { id: 'fixture_spiritual', name: 'Spiritual fixture', spiritualAilment: true, duration: 2 },
    { id: 'fixture_control', name: 'Control fixture', controlAilment: true, duration: 2 }
  ]) {
    assert.equal(engine.applyEnemyStatus(target, 'debuffs', status), null);
    assert.equal(target.debuffs.some(effect => effect.id === status.id), false);
  }
  const defense = { id: 'def_down', name: 'Defense down', value: 0.2, duration: 2 };
  assert.ok(engine.applyEnemyStatus(target, 'debuffs', defense));
  assert.equal(target.debuffs.find(effect => effect.id === 'def_down').value, 0.2);
  assert.equal(engine.state.log.filter(event => event.type === 'immune').length, 2);
});

test('Hachiman final damage dealt modifier follows the confirmed Guardian or Medic party condition', () => {
  for (const attack of [engine => engine.bossAction(), engine => engine.resolveEnemyAttack(engine.state.boss)]) {
    const withoutRole = previewFixture();
    const withMedic = previewFixture();
    withoutRole.random = withMedic.random = () => 0.5;
    withMedic.actor.role = 'Medic';
    const withoutStart = withoutRole.actor.hp;
    const withStart = withMedic.actor.hp;
    attack(withoutRole);
    attack(withMedic);
    const withoutDamage = withoutStart - withoutRole.actor.hp;
    const withDamage = withStart - withMedic.actor.hp;
    assert.ok(Math.abs(withDamage - withoutDamage * 0.25) <= 1);
  }
});

test('unsupported Assist and Theurgy cannot spend resources or advance an action', () => {
  for (const slug of ['akihiko', 'yukari', 'makoto']) {
    const unit = character(slug);
    const engine = previewFixture({ teamIds: [unit.id], characterDefinitions: [unit] });
    // Live Highlight is one shared party meter rather than a personal gauge.
    engine.state.sharedCombat.highlight = 100;
    const resources = () => ({
      sp: engine.actor.sp, hp: engine.actor.hp, highlight: engine.state.sharedCombat.highlight,
      actionNumber: engine.state.actionNumber, turnActionsUsed: engine.state.turnActionsUsed,
      rng: engine.state.rng, damage: engine.state.totalDamage
    });
    const before = resources();
    const assist = engine.getAvailableActions().find(action => action.name === 'Assist');
    assert.ok(assist, `${slug} keeps an explained unavailable Assist`);
    assert.equal(assist.enabled, false);
    assert.match(assist.unavailableReason, /not.*implemented/i);
    assert.throws(() => engine.step({ type: 'skill', skillId: assist.skillId }), /unavailable/i);
    const theurgy = engine.getHighlightActions().find(action => action.actorId === unit.id);
    assert.ok(theurgy, `${slug} keeps an explained unavailable Theurgy`);
    assert.equal(theurgy.enabled, false);
    assert.match(theurgy.unavailableReason, /Theurgy/i);
    assert.throws(() => engine.stepHighlight(theurgy.skillId), /unavailable/i);
    assert.notEqual(engine.recommend()?.skillId, assist.skillId);
    assert.deepEqual(resources(), before);
  }
});

// Result screens: Hachiman (258,098,432 + 125,000) x 8, Surt (1,729,515,136 +
// 250,000) x 4, Yatsufusa (723,875,072 + 125,000) x 8. One formula for all MLD.
test('Hachiman MLD now scores (Foe Defense Points + 125,000) x 8 like Yatsufusa', () => {
  const engine = new BattleEngine({
    seed: 55, bossId: 'hachiman', modeId: 'multidimensional', teamIds: ['wonder'],
    loadouts: { wonder: { baseStats: { maxHp: 100_000 } } }
  });
  assert.equal(engine.isDreamscapePreview(), false);
  while (engine.state.phase === 'battle') guard(engine);
  const breakdown = engine.state.result.scoreBreakdown;
  assert.equal(engine.state.result.attackTurns, 6);
  assert.equal(breakdown.turnsSurvivedBonus, 125_000);
  assert.equal(engine.state.result.score, (breakdown.foeDefensePoints + 125_000) * 8);
});
