import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine, calculateNightmareScore, simulate } from '../src/engine.js';
import { bosses } from '../src/data.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';
import { createSlaughterBenchmarkEngine, runOptimizedSlaughter, runSlaughterBenchmark } from '../scripts/benchmark-slaughter.mjs';

test('recorded Nightmare result uses the exact point bucket formula', () => {
  const score = calculateNightmareScore({
    baseDamagePoints: 827135,
    weakenedDamagePoints: 909555392,
    bossAttackPoints: 250000,
    difficultyBonus: 4
  });
  assert.equal(score, 3642530108);
});

test('Slaughter Drive is an eight turn Electric weak recorded benchmark', () => {
  const boss = bosses.find(item => item.id === 'slaughter_drive');
  const linkedEnemies = [boss, ...boss.summons];
  assert.equal(boss.weakness, 'electric');
  assert.equal(boss.level, 78);
  assert.equal(boss.maxHp, 209244);
  assert.equal(boss.finiteHp, true);
  assert.equal(boss.turnLimit, 8);
  assert.equal(boss.weakenedTurns, 2);
  assert.equal(boss.difficultyBonus, 4);
  assert.equal(boss.scoreModel, 'recorded_nightmare');
  assert.equal(boss.encounter.soulLink, true);
  assert.equal(boss.encounter.lifeSustainment, true);
  assert.equal(boss.summons.length, 4);
  assert.ok(boss.summons.every(enemy => enemy.name.startsWith('Scarlet Turret')));
  assert.ok(boss.summons.every(enemy => enemy.maxHp === 154474));
  assert.ok(boss.summons.every(enemy => enemy.finiteHp === true && enemy.soulLinked === true));
  assert.ok(boss.summons.every(enemy => enemy.weakness === 'electric'));
  assert.ok(boss.summons.every(enemy => enemy.downedDamageTaken === 0.8));
  assert.equal(linkedEnemies.reduce((sum, enemy) => sum + enemy.maxHp, 0), 827140);
  assert.equal(linkedEnemies.reduce((sum, enemy) => sum + enemy.maxHp - 1, 0), 827135);
  assert.equal(boss.hpLockDamage, 827135);
  const engine = new BattleEngine({ seed: 808, bossId: 'slaughter_drive' });
  assert.equal(engine.enemies.length, 5);
  assert.deepEqual(engine.enemies.map(enemy => enemy.id), [
    'slaughter_drive', 'crimson_turret_1', 'crimson_turret_2', 'crimson_turret_3', 'crimson_turret_4'
  ]);
});

test('Slaughter Drive Soul Link reproduces the recorded shared HP percentage', () => {
  const engine = new BattleEngine({ seed: 808, bossId: 'slaughter_drive' });

  const actual = engine.applyEnemyDamage(engine.state.boss, 71269);

  assert.equal(actual, 71269);
  assert.equal(engine.state.boss.hp, 191215);
  assert.deepEqual(engine.state.boss.summons.map(enemy => enemy.hp), [141164, 141164, 141164, 141164]);
});

test('Slaughter Drive AOE grants Highlight once while Life Sustainment preserves the linked field', () => {
  const engine = createSlaughterBenchmarkEngine({ seed: 808 });
  const wonder = engine.actor;
  const highlightBefore = wonder.highlight;
  engine.applyEnemyDamage(engine.state.boss, 9999999);
  const action = engine.getAvailableActions().find(candidate => candidate.name === 'One-Fathom Fang');

  engine.step({ type: action.type, skillId: action.skillId, targetId: 'all_enemies' });

  assert.equal(wonder.highlight - highlightBefore, 18);
  assert.deepEqual(engine.soulLinkedEnemies().map(enemy => enemy.hp), [1, 1, 1, 1, 1]);
  assert.ok(engine.state.boss.summons.every(enemy => enemy.alive));
  assert.equal(engine.state.log.some(event => event.type === 'defeat_enemy'), false);
});

test('Slaughter Drive requires the seventh qualifying hit for Down and then takes 80 percent more damage', () => {
  const engine = new BattleEngine({ seed: 808, bossId: 'slaughter_drive' });
  const target = engine.state.boss.summons[0];
  const qualifying = { weakness: true, critical: false };
  const skill = { element: 'electric' };

  for (let hit = 0; hit < 6; hit += 1) engine.updateDownState(target, qualifying, skill);
  assert.equal(target.downPoints, 0);
  assert.equal(target.downed, false);
  engine.updateDownState(target, qualifying, skill);
  assert.equal(target.downed, true);

  const actor = engine.state.party[0];
  target.downed = false;
  const normal = engine.statusMultiplier(actor, 'almighty', target);
  target.downed = true;
  const downed = engine.statusMultiplier(actor, 'almighty', target);
  assert.ok(Math.abs(downed / normal - 1.8) < 1e-12);
});

test('recorded Miyu and MIKU rotation reproduces the Nexus score and Catch a Wave events', () => {
  const enabled = runSlaughterBenchmark({ wavecatcherFollowUps: true });
  const disabled = runSlaughterBenchmark({ wavecatcherFollowUps: false });

  assert.equal(enabled.metrics.score, 3642530108);
  assert.equal(enabled.metrics.scoreBreakdown.baseRawDamage, 827135);
  assert.equal(enabled.metrics.scoreBreakdown.weakenedRawDamage, 247778121);
  assert.equal(enabled.metrics.scoreBreakdown.weakenedDamagePoints, 909555392);
  assert.equal(enabled.metrics.scoreBreakdown.baseDamagePoints, 827135);
  assert.equal(enabled.metrics.scoreBreakdown.bossAttackPoints, 250000);
  assert.ok(enabled.metrics.followUpHits > 0);
  assert.ok(enabled.metrics.followUpDamage > 0);
  assert.equal(enabled.result.boss.breakTurn, 7);
  assert.equal(enabled.result.actionQueue, null);
  assert.equal(enabled.result.log.filter(event => event.type === 'boss_weakened').length, 2);
  assert.ok(disabled.metrics.score < enabled.metrics.score);
  assert.equal(disabled.metrics.followUpHits, 0);
});

test('archived Nexus auto policy preserves its score and turn-seven break', () => {
  const optimized = runOptimizedSlaughter({ mechanicsProfile: 'recorded-2026-08-29' });

  assert.equal(optimized.result.boss.breakTurn, 7);
  assert.equal(optimized.metrics.score, 8734831636);
  assert.equal(optimized.metrics.totalDamage, 595412310);
  assert.deepEqual(optimized.metrics.scoreBreakdown, {
    baseRawDamage: 827135,
    weakenedRawDamage: 594585175,
    baseDamagePoints: 827135,
    weakenedDamagePoints: 2182630774,
    bossAttackPoints: 250000,
    difficultyBonus: 4
  });
});

test('Nexus HP lock waits for the player-controlled break turn', () => {
  const engine = new BattleEngine({ seed: 808, bossId: 'slaughter_drive' });
  engine.state.scoreBreakdown.baseRawDamage = engine.state.boss.hpLockDamage;
  engine.state.boss.breakPending = true;
  engine.state.actorIndex = engine.state.party.length - 1;
  engine.state.turnActionsUsed = 0;
  engine.state.turnActionsTotal = 1;
  engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });

  assert.equal(engine.state.attackTurn, 2);
  assert.equal(engine.isBossWeakened(), false);
  assert.equal(engine.canBreakBoss(), true);
  const result = engine.stepBreak();
  assert.equal(result.consumedAction, false);
  assert.equal(engine.isBossWeakened(), true);
  assert.equal(engine.weakenedTurnsLeft(), 2);
});

test('Nexus forces the 1 HP floor and only scores new damage after the manual break', () => {
  const engine = new BattleEngine({ seed: 808, bossId: 'slaughter_drive', modeId: 'nexus', lifeSustainment: false });
  const actor = engine.actor;

  assert.equal(engine.state.boss.lifeSustainment, true);
  const floorDamage = engine.applyEnemyDamage(engine.state.boss, 9999999);
  engine.addDamageScore(floorDamage, actor);

  assert.equal(floorDamage, 827135);
  assert.deepEqual(engine.soulLinkedEnemies().map(enemy => enemy.hp), [1, 1, 1, 1, 1]);
  assert.equal(engine.state.scoreBreakdown.baseRawDamage, 827135);
  assert.equal(engine.state.scoreBreakdown.baseDamagePoints, 827135);
  assert.equal(engine.state.boss.breakPending, true);
  assert.equal(engine.canBreakBoss(), true);

  const blockedDamage = engine.applyEnemyDamage(engine.state.boss, 25000);
  engine.addDamageScore(blockedDamage, actor);
  assert.equal(blockedDamage, 0);
  assert.equal(engine.state.scoreBreakdown.baseRawDamage, 827135);

  const breakResult = engine.stepBreak();
  assert.equal(breakResult.consumedAction, false);
  assert.equal(engine.isBossWeakened(), true);
  const weakenedDamage = engine.applyEnemyDamage(engine.state.boss, 25000);
  engine.addDamageScore(weakenedDamage, actor);
  assert.equal(weakenedDamage, 25000);
  assert.equal(engine.state.scoreBreakdown.weakenedRawDamage, 25000);
  assert.deepEqual(engine.soulLinkedEnemies().map(enemy => enemy.hp), [1, 1, 1, 1, 1]);
});

test('Devourer Life Sustainment toggles the linked field from a 1 HP floor into Weakened', () => {
  const engine = new BattleEngine({ seed: 808, bossId: 'slaughter_drive', modeId: 'devourer', lifeSustainment: true });
  const actor = engine.actor;

  assert.equal(engine.state.boss.lifeSustainment, true);
  assert.equal(engine.canToggleLifeSustainment(), true);
  const floorDamage = engine.applyEnemyDamage(engine.state.boss, 9999999);
  engine.addDamageScore(floorDamage, actor);
  assert.equal(floorDamage, 827135);
  assert.deepEqual(engine.soulLinkedEnemies().map(enemy => enemy.hp), [1, 1, 1, 1, 1]);
  assert.equal(engine.allEnemiesDefeated(), false);

  const toggleResult = engine.setLifeSustainment(false);
  assert.equal(toggleResult.consumedAction, false);
  assert.equal(engine.state.boss.lifeSustainment, false);
  const triggerDamage = engine.applyEnemyDamage(engine.state.boss, 5);
  engine.addDamageScore(triggerDamage, actor);
  assert.equal(triggerDamage, 5);
  assert.equal(engine.state.boss.hp, 0);
  assert.equal(engine.state.scoreBreakdown.baseRawDamage, 827140);
  assert.equal(engine.state.scoreBreakdown.weakenedRawDamage, 0);
  assert.equal(engine.isBossWeakened(), true);
  assert.equal(engine.weakenedTurnsLeft(), 2);
  assert.equal(engine.state.phase, 'battle');
  assert.equal(engine.allEnemiesDefeated(), false);
  assert.equal(engine.enemies.length, 5);
  assert.ok(engine.state.boss.summons.every(enemy => enemy.alive));
  assert.deepEqual(engine.soulLinkedEnemies().map(enemy => enemy.hp), [0, 0, 0, 0, 0]);
});

test('Devourer with Life Sustainment off opens exactly two boss turns of unlimited Weakened scoring', () => {
  const devourer = new BattleEngine({ seed: 808, bossId: 'slaughter_drive', modeId: 'devourer' });
  const actor = devourer.actor;
  assert.equal(devourer.state.boss.lifeSustainment, false);
  const triggerDamage = devourer.applyEnemyDamage(devourer.state.boss, 9999999);
  devourer.addDamageScore(triggerDamage, actor);
  assert.equal(triggerDamage, 827140);
  assert.equal(devourer.state.scoreBreakdown.baseRawDamage, 827140);
  assert.equal(devourer.state.scoreBreakdown.baseDamagePoints, 827140);
  assert.equal(devourer.state.scoreBreakdown.weakenedRawDamage, 0);
  assert.equal(devourer.isBossWeakened(), true);
  assert.equal(devourer.weakenedTurnsLeft(), 2);
  assert.equal(devourer.state.phase, 'battle');
  const weakenedTargets = devourer.soulLinkedEnemies();
  assert.deepEqual(weakenedTargets.map(enemy => enemy.id), [
    'slaughter_drive',
    'crimson_turret_1',
    'crimson_turret_2',
    'crimson_turret_3',
    'crimson_turret_4',
  ]);
  assert.deepEqual(weakenedTargets.map(enemy => enemy.hp), [0, 0, 0, 0, 0]);
  assert.ok(devourer.state.boss.summons.every(enemy => enemy.alive));
  assert.ok(weakenedTargets.every(enemy => devourer.findEnemy(enemy.id) === enemy));

  for (const target of weakenedTargets) {
    const firstTurnDamage = devourer.applyEnemyDamage(target, 1000000);
    devourer.addDamageScore(firstTurnDamage, actor);
    assert.equal(firstTurnDamage, 1000000);
  }
  assert.deepEqual(weakenedTargets.map(enemy => enemy.hp), [0, 0, 0, 0, 0]);
  assert.equal(devourer.state.scoreBreakdown.weakenedRawDamage, 5000000);
  assert.equal(devourer.state.scoreBreakdown.weakenedDamagePoints, 15000000);
  const skippedBefore = devourer.state.log.filter(event => event.type === 'boss_weakened').length;
  devourer.endAttackTurn();
  assert.equal(devourer.state.phase, 'battle');
  assert.equal(devourer.weakenedTurnsLeft(), 1);
  assert.equal(devourer.state.log.filter(event => event.type === 'boss_weakened').length, skippedBefore + 1);

  for (const target of weakenedTargets) {
    const secondTurnDamage = devourer.applyEnemyDamage(target, 2000000);
    devourer.addDamageScore(secondTurnDamage, actor);
    assert.equal(secondTurnDamage, 2000000);
  }
  assert.deepEqual(weakenedTargets.map(enemy => enemy.hp), [0, 0, 0, 0, 0]);
  assert.equal(devourer.state.scoreBreakdown.weakenedRawDamage, 15000000);
  assert.equal(devourer.state.scoreBreakdown.weakenedDamagePoints, 45000000);
  devourer.endAttackTurn();
  assert.equal(devourer.state.phase, 'results');
  assert.equal(devourer.weakenedTurnsLeft(), 0);
  assert.equal(devourer.state.log.filter(event => event.type === 'boss_weakened').length, skippedBefore + 2);
  assert.ok(['break_window_complete', 'weakened_window_complete'].includes(devourer.state.result.outcome));
});

test('late Nexus and Devourer triggers preserve both Weakened boss action slots', () => {
  for (const modeId of ['nexus', 'devourer']) {
    const engine = new BattleEngine({ seed: 808, bossId: 'slaughter_drive', modeId });
    const actor = engine.actor;
    engine.state.attackTurn = engine.state.boss.turnLimit;
    engine.state.round = engine.state.attackTurn;
    engine.state.attackTurnsLeft = 1;

    const triggerDamage = engine.applyEnemyDamage(engine.state.boss, 9999999);
    engine.addDamageScore(triggerDamage, actor);
    if (modeId === 'nexus') {
      assert.equal(engine.state.boss.breakPending, true);
      engine.stepBreak();
    }

    assert.equal(engine.isBossWeakened(), true, `${modeId} did not enter Weakened`);
    assert.equal(engine.weakenedTurnsLeft(), 2);
    assert.equal(engine.state.attackTurnsLeft, 2);
    const skippedBefore = engine.state.log.filter(event => event.type === 'boss_weakened').length;

    const firstTurnDamage = engine.applyEnemyDamage(engine.state.boss, 1000000);
    engine.addDamageScore(firstTurnDamage, actor);
    assert.equal(firstTurnDamage, 1000000);
    engine.endAttackTurn();
    assert.equal(engine.state.phase, 'battle', `${modeId} timed out after the first Weakened slot`);
    assert.equal(engine.weakenedTurnsLeft(), 1);
    assert.equal(engine.state.attackTurnsLeft, 1);
    assert.equal(engine.state.log.filter(event => event.type === 'boss_weakened').length, skippedBefore + 1);

    const secondTurnDamage = engine.applyEnemyDamage(engine.state.boss, 1000000);
    engine.addDamageScore(secondTurnDamage, actor);
    assert.equal(secondTurnDamage, 1000000);
    engine.endAttackTurn();
    assert.equal(engine.state.phase, 'results');
    assert.equal(engine.weakenedTurnsLeft(), 0);
    assert.equal(engine.state.log.filter(event => event.type === 'boss_weakened').length, skippedBefore + 2);
    assert.equal(engine.state.result.outcome, 'break_window_complete');
  }
});

test('Devourer and Multidimensional do not enter Weakened before their trigger', () => {
  for (const modeId of ['devourer', 'multidimensional']) {
    const engine = new BattleEngine({ seed: 808, bossId: 'slaughter_drive', modeId });
    for (const attackTurn of [7, 8]) {
      engine.state.attackTurn = attackTurn;
      assert.equal(engine.isBossWeakened(), false, `${modeId} incorrectly entered Weakened on Attack Turn ${attackTurn}`);
      assert.equal(engine.weakenedTurnsLeft(), 0);
    }
  }
});

test('same seed and policy produce the same complete result', () => {
  const first = simulate({ seed: 808, bossId: 'shadow_ruin' });
  const second = simulate({ seed: 808, bossId: 'shadow_ruin' });
  assert.deepEqual(first.result, second.result);
  assert.equal(first.totalDamage, second.totalDamage);
});

test('Wonder takes one counted action before the queue advances', () => {
  const engine = new BattleEngine({ seed: 808 });
  const before = engine.getObservation();
  const action = before.availableActions.find(item => item.skillId === 'maeigaon');
  const first = engine.step({ type: action.type, skillId: action.skillId, targetId: 'boss' });
  assert.ok(first.reward > 0);
  assert.equal(first.nextState.actorIndex, 1);
  assert.equal(first.nextState.turnActionsUsed, 0);
  assert.equal(first.nextState.turnActionsTotal, 1);
  assert.ok(first.nextState.boss.hp < before.boss.hp);
  assert.ok(first.events.some(event => event.type === 'damage'));
});

test('persona selection is free and changes Wonder move list without advancing', () => {
  const engine = new BattleEngine({ seed: 808 });
  const switchAction = engine.getAvailableActions().find(item => item.skillId === 'switch:trumpeter');
  const result = engine.step({ type: 'switch', skillId: switchAction.skillId, targetId: 'self' });
  assert.equal(result.nextState.activePersonaId, 'trumpeter');
  assert.equal(result.nextState.actorIndex, 0);
  assert.equal(result.nextState.turnActionsUsed, 0);
  assert.equal(result.consumedAction, false);
  assert.ok(result.events.some(event => event.type === 'switch'));
  assert.ok(result.nextState.availableActions.some(action => action.skillId === 'debilitate'));
});

test('navigator action resolves without consuming the current actor turn', () => {
  const engine = new BattleEngine({ seed: 808 });
  const before = engine.getObservation();
  const result = engine.stepNavigator('opening_act');
  assert.equal(result.nextState.actorIndex, before.actorIndex);
  assert.equal(result.nextState.actionNumber, before.actionNumber);
  assert.equal(result.nextState.turnActionsUsed, before.turnActionsUsed);
  assert.equal(result.nextState.turnActionsTotal, before.turnActionsTotal + 1);
  assert.equal(result.consumedAction, false);
  assert.equal(result.nextState.navigator.cooldowns.opening_act, 3);
  assert.ok(result.nextState.party.every(unit => unit.buffs.some(buff => buff.id === 'nav_amp')));
});

test('navigator cooldown advances once per counted ally action', () => {
  const engine = new BattleEngine({ seed: 808 });
  engine.stepNavigator('opening_act');
  assert.equal(engine.state.navigator.cooldowns.opening_act, 3);

  engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });
  assert.equal(engine.state.navigator.cooldowns.opening_act, 2);
  engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });
  assert.equal(engine.state.navigator.cooldowns.opening_act, 1);
  engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });
  assert.equal(engine.state.navigator.cooldowns.opening_act, 0);
});

test('only one navigator skill can be used in an Attack Turn', () => {
  const engine = new BattleEngine({ seed: 808 });
  engine.stepNavigator('opening_act');
  assert.ok(engine.getNavigatorActions().every(action => !action.enabled));
  assert.throws(() => engine.stepNavigator('encore'), /unavailable/i);
});

function createMikuTestEngine() {
  const miku = lufelCatalog.characters.find(character => character.codename === 'MIKU');
  const navigatorDefinition = {
    ...miku,
    id: 'navigator-miku-test',
    skills: miku.skills.map((skill, index) => ({ ...skill, id: `navigator-miku-test-${index + 1}`, power: 0 }))
  };
  const engine = new BattleEngine({ seed: 808, bossId: 'slaughter_drive', navigatorDefinition });
  for (const unit of engine.state.party) {
    unit.maxHp = 999999;
    unit.hp = unit.maxHp;
  }
  return engine;
}

function guardCurrentPartyRound(engine) {
  const startingTurn = engine.state.attackTurn;
  while (engine.state.phase === 'battle' && engine.state.attackTurn === startingTurn) {
    engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });
  }
}

const timingStriker = {
  id: 'timing-striker', name: 'Timing Striker', codename: 'Clock', role: 'Saboteur', element: 'almighty',
  maxHp: 999999, maxSp: 99, attack: 1, defense: 9999, speed: 120, crit: 0, critMult: 1.5,
  portrait: 'T', accent: '#888888', actionLimit: 1, maxAmmo: 1, gunPower: 0.001,
  skills: [{
    id: 'timing-wave', slot: 'S1', name: 'Timing Wave', element: 'almighty', cost: 0,
    power: 0.001, target: 'all_enemies', note: 'Deterministic one-damage timing fixture.'
  }]
};

const timingVishnuBoss = {
  id: 'timing-vishnu', name: 'Timing Vishnu', subtitle: 'Regression fixture', level: 90,
  maxHp: 10000, defense: 385, weakness: 'none', resistance: 'none', turnLimit: 4,
  scoreMultiplier: 1, scoreAttack: true, defaultMode: 'nexus', downMax: 5,
  enemyTimingModel: 'anchored_enemy_turns',
  encounter: {
    kind: 'threshold_clones',
    initialEnemyAnchor: 'before_last_party',
    cloneDefinitions: [2, 3, 4, 5].map(index => ({
      id: `timing_vishnu_copy_${index}`, name: `Timing Vishnu ${index}`,
      maxHp: 10000, defense: 385, weakness: 'none', resistance: 'none', downMax: 5
    })),
    cloneThresholds: [
      { id: 'three_targets', hpRatio: 0.8, cloneIds: ['timing_vishnu_copy_2', 'timing_vishnu_copy_3'] },
      { id: 'five_targets', hpRatio: 0.4, cloneIds: ['timing_vishnu_copy_4', 'timing_vishnu_copy_5'] }
    ]
  },
  phases: [{ threshold: 1, name: 'Timing phase', defense: 385 }]
};

function createEnemyTimingEngine() {
  return new BattleEngine({
    seed: 808,
    bossId: timingVishnuBoss.id,
    bossDefinition: timingVishnuBoss,
    characterDefinitions: [timingStriker],
    teamIds: [timingStriker.id, 'wonder', 'joker']
  });
}

function timingMark(engine, enemy, duration = 2) {
  return engine.applyEnemyStatus(enemy, 'debuffs', {
    id: 'timing_mark', name: 'TIMING MARK', value: 0.1, duration
  }, 'test', timingStriker.id);
}

test('Vishnu thresholds grow one to three to five and anchor new clones before the triggering actor', () => {
  const engine = createEnemyTimingEngine();
  const actor = engine.actor;

  assert.equal(engine.enemies.length, 1);
  const initialQueue = engine.getObservation().actionQueue;
  const initialEnemyEntry = initialQueue.find(entry => entry.actorType === 'enemy');
  assert.deepEqual({
    actorType: initialEnemyEntry.actorType,
    actorId: initialEnemyEntry.actorId,
    done: initialEnemyEntry.done,
    current: initialEnemyEntry.current
  }, { actorType: 'enemy', actorId: timingVishnuBoss.id, done: false, current: false });

  engine.state.boss.hp = 8001;
  let logStart = engine.state.log.length;
  engine.resolveSkill(actor, actor.skills[0], engine.state.boss.id, 'test');

  const firstCloneIds = ['timing_vishnu_copy_2', 'timing_vishnu_copy_3'];
  assert.deepEqual(engine.enemies.map(enemy => enemy.id), [timingVishnuBoss.id, ...firstCloneIds]);
  assert.deepEqual(
    engine.state.log.slice(logStart).filter(event => event.type === 'damage').map(event => event.targetId),
    [timingVishnuBoss.id]
  );
  for (const cloneId of firstCloneIds) {
    const clone = engine.findEnemy(cloneId);
    assert.equal(clone.hp, clone.maxHp, `${cloneId} was not retroactively hit by the spawning AoE`);
    assert.equal(clone.actsBeforeActorId, actor.id);
    assert.ok(clone.eligibleAttackTurn >= engine.state.attackTurn);
    assert.equal(clone.lastActedAttackTurn, 0);
  }
  let queue = engine.getObservation().actionQueue;
  let actorQueueIndex = queue.findIndex(entry => entry.actorType === 'party' && entry.actorId === actor.id);
  assert.deepEqual(queue.slice(actorQueueIndex - 2, actorQueueIndex).map(entry => entry.actorId), firstCloneIds);

  engine.state.boss.hp = 4001;
  logStart = engine.state.log.length;
  engine.resolveSkill(actor, actor.skills[0], engine.state.boss.id, 'test');

  const secondCloneIds = ['timing_vishnu_copy_4', 'timing_vishnu_copy_5'];
  assert.deepEqual(engine.enemies.map(enemy => enemy.id), [timingVishnuBoss.id, ...firstCloneIds, ...secondCloneIds]);
  assert.deepEqual(
    engine.state.log.slice(logStart).filter(event => event.type === 'damage').map(event => event.targetId),
    [timingVishnuBoss.id, ...firstCloneIds]
  );
  for (const cloneId of secondCloneIds) {
    const clone = engine.findEnemy(cloneId);
    assert.equal(clone.hp, clone.maxHp, `${cloneId} was not retroactively hit by the spawning AoE`);
    assert.equal(clone.actsBeforeActorId, actor.id);
    assert.ok(clone.eligibleAttackTurn >= engine.state.attackTurn);
    assert.equal(clone.lastActedAttackTurn, 0);
  }
  queue = engine.getObservation().actionQueue;
  actorQueueIndex = queue.findIndex(entry => entry.actorType === 'party' && entry.actorId === actor.id);
  assert.deepEqual(queue.slice(actorQueueIndex - 2, actorQueueIndex).map(entry => entry.actorId), secondCloneIds);
  assert.deepEqual(engine.state.boss.encounterState.processedThresholdIds, ['three_targets', 'five_targets']);
});

test('each Vishnu action ticks only statuses owned by that enemy', () => {
  const engine = createEnemyTimingEngine();
  const actor = engine.actor;
  engine.state.boss.hp = 8000;
  engine.processEncounterDamageTriggers(actor, engine.state.boss, 8001, 8000);

  for (const enemy of engine.enemies) {
    const applied = timingMark(engine, enemy, 3);
    assert.equal(applied.ownerId, enemy.id);
    assert.equal(applied.sourceActorId, timingStriker.id);
    assert.equal(applied.durationClock, 'owner_action');
  }

  engine.state.attackTurn = 2;
  engine.state.round = 2;
  const logStart = engine.state.log.length;
  engine.runEnemiesBefore(actor.id);

  const [boss, second, third] = engine.enemies;
  assert.equal(boss.debuffs.find(effect => effect.id === 'timing_mark').duration, 3);
  assert.equal(second.debuffs.find(effect => effect.id === 'timing_mark').duration, 2);
  assert.equal(third.debuffs.find(effect => effect.id === 'timing_mark').duration, 2);
  assert.equal(boss.lastActedAttackTurn, 0);
  assert.equal(second.lastActedAttackTurn, 2);
  assert.equal(third.lastActedAttackTurn, 2);

  engine.runEnemiesBefore(engine.state.party.at(-1).id);
  assert.equal(boss.debuffs.find(effect => effect.id === 'timing_mark').duration, 2);
  assert.deepEqual(
    engine.state.log.slice(logStart).filter(event => event.type === 'boss_move').map(event => event.actorId),
    [second.id, third.id, boss.id]
  );
});

test('Weakened Vishnus skip independently without ticking statuses or resetting Down', () => {
  const engine = createEnemyTimingEngine();
  const actor = engine.actor;
  engine.state.boss.hp = 8000;
  engine.processEncounterDamageTriggers(actor, engine.state.boss, 8001, 8000);

  for (const enemy of engine.enemies) {
    timingMark(engine, enemy, 2);
    enemy.downed = true;
    enemy.downPoints = 0;
  }
  engine.state.boss.weakenedActive = true;
  engine.state.boss.weakenedTurnsLeft = 2;

  engine.state.attackTurn = 2;
  engine.state.round = 2;
  const logStart = engine.state.log.length;
  engine.runEnemiesBefore(actor.id);
  engine.runEnemiesBefore(engine.state.party.at(-1).id);

  for (const enemy of engine.enemies) {
    assert.equal(enemy.debuffs.find(effect => effect.id === 'timing_mark').duration, 2);
    assert.equal(enemy.downed, true);
    assert.equal(enemy.downPoints, 0);
    assert.equal(enemy.lastActedAttackTurn, 2);
  }
  assert.equal(engine.state.log.slice(logStart).filter(event => event.type === 'boss_move').length, 0);
  assert.deepEqual(
    engine.state.log.slice(logStart).filter(event => event.type === 'boss_weakened').map(event => event.actorId),
    ['timing_vishnu_copy_2', 'timing_vishnu_copy_3', timingVishnuBoss.id]
  );
});

test('Virtual Concert ticks enemy statuses while Vishnu action slots stay frozen', () => {
  const miku = lufelCatalog.characters.find(character => character.codename === 'MIKU');
  const navigatorDefinition = {
    ...miku,
    id: 'navigator-miku-vishnu-test',
    skills: miku.skills.map((skill, index) => ({
      ...skill,
      id: `navigator-miku-vishnu-test-${index + 1}`,
      power: 0
    }))
  };
  const engine = new BattleEngine({
    seed: 808,
    bossId: timingVishnuBoss.id,
    bossDefinition: timingVishnuBoss,
    characterDefinitions: [timingStriker],
    teamIds: [timingStriker.id, 'wonder', 'joker'],
    navigatorDefinition
  });

  for (const unit of engine.state.party) {
    unit.maxHp = 999999;
    unit.hp = unit.maxHp;
  }

  engine.state.boss.hp = 8000;
  engine.processEncounterDamageTriggers(engine.actor, engine.state.boss, 8001, 8000);
  engine.state.attackTurn = 2;
  engine.state.round = 2;
  engine.runEnemiesBefore(engine.actor.id);
  for (const enemy of engine.enemies) timingMark(engine, enemy, 3);

  engine.state.boss.weakenedActive = true;
  engine.state.boss.weakenedTurnsLeft = 2;
  engine.state.navigator.tracks = ['Break', 'Critical', 'Expert'];

  const showstopper = engine.getNavigatorActions().find(action => action.name === 'Showstopper');
  const enemySlots = () => engine.getObservation().actionQueue
    .filter(entry => entry.actorType === 'enemy')
    .map(({ actorId, done, pending }) => ({ actorId, done, pending }));
  const durations = () => engine.enemies.map(enemy =>
    enemy.debuffs.find(effect => effect.id === 'timing_mark')?.duration
  );
  const slotsBefore = enemySlots();
  const lastActedBefore = engine.enemies.map(enemy => [enemy.id, enemy.lastActedAttackTurn]);
  const actedIdsBefore = [...engine.state.enemyTimeline.actedEnemyIds];
  const actionNumberBefore = engine.state.actionNumber;
  const attackTurnBefore = engine.state.attackTurn;
  const weakenedBefore = engine.state.boss.weakenedTurnsLeft;
  const movesBefore = engine.state.log.filter(event => event.type === 'boss_move').length;
  const skipsBefore = engine.state.log.filter(event => event.type === 'boss_weakened').length;

  assert.deepEqual(slotsBefore.map(({ actorId, done }) => ({ actorId, done })), [
    { actorId: 'timing_vishnu_copy_2', done: true },
    { actorId: 'timing_vishnu_copy_3', done: true },
    { actorId: timingVishnuBoss.id, done: false }
  ]);

  const finishConcertPartyTurn = () => {
    const remaining = engine.state.navigator.virtualConcert.roundsRemaining;
    while (engine.isVirtualConcertActive()
      && engine.state.navigator.virtualConcert.roundsRemaining === remaining) {
      engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });
    }
  };
  const assertTimelineFrozen = () => {
    assert.deepEqual(
      engine.enemies.map(enemy => [enemy.id, enemy.lastActedAttackTurn]),
      lastActedBefore
    );
    assert.deepEqual(engine.state.enemyTimeline.actedEnemyIds, actedIdsBefore);
    assert.equal(engine.state.actionNumber, actionNumberBefore);
    assert.equal(engine.state.attackTurn, attackTurnBefore);
    assert.equal(engine.state.boss.weakenedTurnsLeft, weakenedBefore);
    assert.equal(engine.state.log.filter(event => event.type === 'boss_move').length, movesBefore);
    assert.equal(engine.state.log.filter(event => event.type === 'boss_weakened').length, skipsBefore);
  };

  engine.stepNavigator(showstopper.id);
  finishConcertPartyTurn();
  assert.deepEqual(durations(), [2, 2, 2]);
  assertTimelineFrozen();
  assert.ok(engine.getObservation().actionQueue.every(entry => entry.actorType === 'party'));

  finishConcertPartyTurn();
  assert.deepEqual(durations(), [1, 1, 1]);
  assert.equal(engine.isVirtualConcertActive(), false);
  assert.deepEqual(enemySlots(), slotsBefore);
  assertTimelineFrozen();
});

test('Vishnu target-count phases add actions without inferred enemy damage scaling', () => {
  const oneTarget = createEnemyTimingEngine();
  const fiveTargets = createEnemyTimingEngine();
  fiveTargets.state.boss.phaseIndex = 2;

  oneTarget.resolveEnemyAttack(oneTarget.state.boss);
  fiveTargets.resolveEnemyAttack(fiveTargets.state.boss);

  const oneTargetHit = oneTarget.state.log.find(event => event.type === 'party_damage');
  const fiveTargetHit = fiveTargets.state.log.find(event => event.type === 'party_damage');
  assert.equal(fiveTargetHit.targetId, oneTargetHit.targetId);
  assert.equal(fiveTargetHit.amount, oneTargetHit.amount);
});

test('MIKU follows the recorded Heaven, Spring Storm, Play-With-Fire Track sequence', () => {
  const engine = createMikuTestEngine();
  const actionsByName = name => engine.getNavigatorActions().find(action => action.name === name);

  assert.equal(actionsByName('Feel the Beat').remaining, 4);
  assert.equal(actionsByName('Clear Sound').remaining, 4);
  assert.equal(engine.state.navigator.currentSong, 'Heaven');
  guardCurrentPartyRound(engine);

  engine.stepNavigator(actionsByName('Feel the Beat').id);
  assert.deepEqual(engine.state.navigator.tracks, ['Break']);
  assert.ok(engine.state.party.every(unit => unit.buffs.some(buff => buff.id === 'miku_setlist_break' && buff.value === 0.12)));
  assert.equal(actionsByName('Feel the Beat').remaining, 4);
  assert.equal(actionsByName('Clear Sound').remaining, 4);
  guardCurrentPartyRound(engine);
  assert.equal(engine.state.navigator.currentSong, 'Spring Storm');

  engine.stepNavigator(actionsByName('Clear Sound').id);
  assert.deepEqual(engine.state.navigator.tracks, ['Break', 'Critical']);
  guardCurrentPartyRound(engine);
  assert.equal(engine.state.navigator.currentSong, 'Play-With-Fire');

  engine.stepNavigator(actionsByName('Feel the Beat').id);
  assert.deepEqual(engine.state.navigator.tracks, ['Break', 'Critical', 'Expert']);
  guardCurrentPartyRound(engine);
  assert.equal(actionsByName('Showstopper').enabled, true);
});

test('MIKU only grants a song effect when its matching Track is newly gained', () => {
  const engine = createMikuTestEngine();
  const clear = () => engine.getNavigatorActions().find(action => action.name === 'Clear Sound');
  for (const skill of engine.state.navigator.skills) engine.state.navigator.cooldowns[skill.id] = 0;
  const target = engine.state.party[0];
  target.hp -= 1000;

  engine.stepNavigator(clear().id);
  assert.ok(target.hp > target.maxHp - 1000);
  assert.deepEqual(engine.state.navigator.tracks, ['Break']);

  target.hp -= 1000;
  const before = target.hp;
  engine.state.navigator.lastUsedAttackTurn = 0;
  for (const skill of engine.state.navigator.skills) engine.state.navigator.cooldowns[skill.id] = 0;
  engine.stepNavigator(clear().id);
  assert.equal(target.hp, before);
  assert.deepEqual(engine.state.navigator.tracks, ['Break']);
});

test('Virtual Concert records two uncounted rounds and A6 repeats each target damage exactly', () => {
  const engine = createMikuTestEngine();
  const actionsByName = name => engine.getNavigatorActions().find(action => action.name === name);
  guardCurrentPartyRound(engine);
  engine.stepNavigator(actionsByName('Feel the Beat').id);
  guardCurrentPartyRound(engine);
  engine.stepNavigator(actionsByName('Clear Sound').id);
  guardCurrentPartyRound(engine);
  engine.stepNavigator(actionsByName('Feel the Beat').id);
  guardCurrentPartyRound(engine);

  engine.state.boss.weakenedActive = true;
  engine.state.boss.weakenedTurnsLeft = 2;
  const showstopper = actionsByName('Showstopper');
  const actionNumber = engine.state.actionNumber;
  const attackTurn = engine.state.attackTurn;
  const totalDamageBefore = engine.state.totalDamage;
  const bossMovesBefore = engine.state.log.filter(event => event.type === 'boss_move').length;
  engine.stepNavigator(showstopper.id);

  assert.equal(engine.isVirtualConcertActive(), true);
  assert.equal(engine.state.navigator.currentSong, 'Ghost Rule');
  assert.equal(engine.state.navigator.tracks.length, 0);
  assert.equal(engine.state.navigator.cooldowns[showstopper.id], 6);
  assert.ok(engine.getNavigatorActions().every(action => !action.enabled));
  assert.ok(engine.state.party.every(unit => unit.buffs.some(buff => buff.id === 'miku_concert_fan_favorite' && buff.value === 0.24)));

  let concertActions = 0;
  while (engine.isVirtualConcertActive()) {
    const action = engine.getAvailableActions().find(candidate => candidate.enabled && (candidate.skill?.power || 0) > 0)
      || engine.getAvailableActions().find(candidate => candidate.enabled && candidate.type === 'attack')
      || engine.getAvailableActions().find(candidate => candidate.enabled && candidate.type === 'guard');
    engine.step({ type: action.type, skillId: action.skillId, targetId: engine.state.boss.id });
    concertActions += 1;
  }

  const echo = engine.state.log.find(event => event.sourceType === 'miku_a6_echo' && event.type === 'damage');
  const concertEnd = engine.state.log.find(event => event.type === 'concert_end');
  assert.equal(concertActions, engine.state.party.length * 2);
  assert.equal(engine.state.actionNumber, actionNumber);
  assert.equal(engine.state.attackTurn, attackTurn);
  assert.equal(engine.state.boss.weakenedTurnsLeft, 2);
  assert.equal(engine.state.log.filter(event => event.type === 'boss_move').length, bossMovesBefore);
  assert.ok(concertEnd.recordedDamage > 0);
  assert.equal(echo.amount, concertEnd.recordedDamage);
  assert.equal(engine.state.totalDamage - totalDamageBefore, concertEnd.recordedDamage * 2);
  assert.equal(engine.state.navigator.cooldowns[showstopper.id], 6);
});

test('Hachiman exposes a boss and four targetable summons', () => {
  const engine = new BattleEngine({ seed: 808, bossId: 'hachiman' });
  const state = engine.getObservation();
  assert.equal(state.attackTurnsLeft, 5);
  assert.equal(state.enemies.length, 5);
  assert.equal(state.boss.summons.length, 4);
  assert.ok(state.boss.summons.every(enemy => enemy.alive && enemy.downPoints === 3));
});

test('qualifying hits remove Down points before the following hit knocks the target Down', () => {
  const engine = new BattleEngine({ seed: 808, bossId: 'hachiman' });
  const target = engine.state.boss.summons[0];
  target.weakness = 'curse';
  target.maxHp = 9_999_999;
  target.hp = target.maxHp;
  target.downPoints = 1;

  engine.step({ type: 'skill', skillId: 'maeigaon', targetId: target.id });
  assert.equal(target.downPoints, 0);
  assert.equal(target.downed, false);

  const result = engine.step({ type: 'skill', skillId: 'eiha', targetId: target.id });
  assert.equal(target.downed, true);
  assert.ok(result.events.some(event => event.type === 'down'));
});

test('gun actions consume ammo and sourced skill effects remain identifiable', () => {
  const engine = new BattleEngine({ seed: 808, bossId: 'hachiman' });
  engine.step({ type: 'skill', skillId: 'curse_amp', targetId: engine.state.boss.id });
  const debuff = engine.state.boss.debuffs.find(effect => effect.id === 'curse_vuln');
  assert.equal(debuff.sourceType, 'persona_skill');

  const ammoBefore = engine.actor.ammo;
  const gunResult = engine.step({ type: 'gun', skillId: 'gun_attack', targetId: engine.state.boss.summons[0].id });
  assert.equal(engine.state.party[1].ammo, ammoBefore - 1);
  assert.ok(gunResult.events.some(event => event.sourceType === 'gun'));
});

test('Highlights interrupt without consuming the current action counter', () => {
  const engine = new BattleEngine({ seed: 808, bossId: 'hachiman' });
  // Live Highlight is one shared party meter rather than a personal gauge.
  engine.state.sharedCombat.highlight = 100;
  const before = engine.getObservation();
  const result = engine.stepHighlight('joker');
  assert.equal(result.nextState.actorIndex, before.actorIndex);
  assert.equal(result.nextState.turnActionsUsed, before.turnActionsUsed);
  assert.equal(result.nextState.turnActionsTotal, before.turnActionsTotal);
  assert.equal(result.consumedAction, false);
  assert.ok(result.events.some(event => event.sourceType === 'highlight'));
});

test('clearing a summon wave opens the sourced encounter damage window', () => {
  const engine = new BattleEngine({ seed: 808, bossId: 'hachiman' });
  for (const summon of engine.state.boss.summons) engine.defeatSummon(summon);
  const bonus = engine.state.boss.debuffs.find(effect => effect.id === 'minion_break');
  assert.equal(bonus.value, 0.4);
  assert.equal(bonus.sourceType, 'encounter');
});

test('unavailable SP action is rejected by the legal-action boundary', () => {
  const engine = new BattleEngine({ seed: 808 });
  engine.state.party[0].sp = 0;
  const action = engine.getAvailableActions().find(item => item.skillId === 'maeigaon');
  assert.equal(action.enabled, false);
  assert.throws(() => engine.step({ type: 'skill', skillId: 'maeigaon', targetId: 'boss' }), /Unavailable action/);
});

test('battle terminates at the configured Attack Turn limit and preserves replay frames', () => {
  const result = simulate({ seed: 912, bossId: 'shadow_ruin' }, engine => engine.getAvailableActions().find(item => item.type === 'guard'));
  assert.equal(result.phase, 'results');
  assert.equal(result.result.outcome, 'timeout');
  assert.ok(result.history.length > 20);
  assert.ok(result.log.some(event => event.type === 'boss_move'));
});

test('the stateful SEES trio completes a deterministic Dreamscape preview through the public action boundary', () => {
  const definitions = ['akihiko', 'yukari', 'makoto'].map(slug => structuredClone(lufelCatalog.characters.find(unit => unit.slug === slug)));
  const config = {
    seed: 730, bossId: 'hachiman',
    teamIds: definitions.map(unit => unit.id), characterDefinitions: definitions
  };
  const policy = engine => {
    const actions = engine.getAvailableActions().filter(action => action.enabled);
    const action = actions.find(candidate => candidate.type === 'akihiko_flash')
      || actions.find(candidate => candidate.skill?.name === 'Scarlet Hades')
      || actions.find(candidate => candidate.type === 'skill')
      || actions.find(candidate => candidate.type === 'guard');
    const targetId = action.target === 'ally'
      ? engine.state.party.find(unit => unit.id !== engine.actor.id && unit.hp > 0)?.id || engine.actor.id
      : action.target === 'all_enemies' ? engine.state.boss.id : engine.state.boss.id;
    return { ...action, targetId };
  };
  const left = simulate(config, policy);
  const right = simulate(config, policy);
  assert.equal(left.phase, 'results');
  assert.equal(left.result.outcome, 'preview_complete');
  assert.equal(left.result.scoreStatus, 'damage_preview_only');
  assert.equal(left.result.score, right.result.score);
  assert.deepEqual(left.result.damageByActor, right.result.damageByActor);
  assert.equal(left.history.length, right.history.length);
  assert.ok(left.log.some(event => event.type === 'resource' && event.resource === 'gritStacks'));
  assert.ok(left.log.some(event => event.type === 'resource' && event.resource === 'moonPhaseStacks'));
});
