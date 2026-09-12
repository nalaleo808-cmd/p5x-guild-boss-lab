import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine, CURRENT_MECHANICS_PROFILE, RECORDED_MECHANICS_PROFILE } from '../src/engine.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';

function createOpeningEngine(mechanicsProfile, { seed = 808, bossId, bossDefinition } = {}) {
  const twins = lufelCatalog.characters.find(character => character.slug === 'j-c');
  return new BattleEngine({
    seed,
    mechanicsProfile,
    ...(bossId ? { bossId } : {}),
    ...(bossDefinition ? { bossDefinition } : {}),
    characterDefinitions: [{ ...twins, awareness: 6 }],
    teamIds: [twins.id, 'wonder', 'joker', 'mona'],
    jcMaskPair: ['mischief', 'service']
  });
}

function automaticTwoMasks(engine) {
  return engine.state.log.filter(event => event.type === 'follow_up'
    && event.message.includes('automatically activated Two Masks'));
}

test('live J&C opening resolves Two Masks before the first command without spending a turn, SP, or True Desire', () => {
  const engine = createOpeningEngine(CURRENT_MECHANICS_PROFILE);
  const jc = engine.state.party[0];
  const automatic = automaticTwoMasks(engine);

  assert.equal(automatic.length, 1);
  assert.match(automatic[0].message, /at turn start/);
  assert.equal(automatic[0].targetRule, 'seeded_random');
  assert.ok(engine.enemies.some(enemy => enemy.id === automatic[0].targetId));
  assert.equal(jc.sp, jc.maxSp);
  assert.equal(jc.trueDesireStacks, 1);
  assert.equal(jc.trueDesirePrimed, false);
  assert.deepEqual(jc.facades, []);
  assert.equal(engine.state.actionNumber, 1);
  assert.equal(engine.state.turnActionsUsed, 0);
  assert.equal(engine.state.actorIndex, 0);

  const masks = engine.getAvailableActions().filter(action => action.type === 'skill');
  assert.deepEqual(masks.map(action => action.skill.slot), ['S1', 'S2']);
  assert.ok(masks.every(action => action.enabled));

  engine.state.sharedCombat.highlight = 100;
  engine.stepHighlight('highlight:j-c:mischief', engine.state.boss.id);
  assert.equal(automaticTwoMasks(engine).length, 1);

  const gun = engine.getAvailableActions().find(action => action.type === 'gun');
  const ammoBeforeGun = jc.ammo;
  engine.step({ type: 'gun', skillId: gun.skillId, targetId: engine.state.boss.id });
  assert.equal(automaticTwoMasks(engine).length, 1);
  assert.equal(jc.ammo, ammoBeforeGun - 1);
  assert.equal(jc.jcLastSkillAttackTargetId, null);
});

test('live J&C automatic S3 prioritizes a valid previous mask target without an extra RNG draw', () => {
  const engine = createOpeningEngine(CURRENT_MECHANICS_PROFILE);
  const jc = engine.state.party[0];
  const target = engine.state.boss.summons[2];
  jc.facades = ['mischief', 'service'];
  jc.jcLastSkillAttackTargetId = target.id;
  let draws = 0;
  engine.random = () => { draws += 1; return 0.5; };

  engine.resolveJcAutoTwoMasks(jc, 'turn_start');
  const automatic = automaticTwoMasks(engine).at(-1);
  const damage = engine.state.log.filter(event => event.type === 'damage' && event.sourceType === 'awareness_follow_up').at(-1);

  assert.equal(automatic.targetId, target.id);
  assert.equal(automatic.targetRule, 'previous_skill_attack');
  assert.equal(damage.targetId, target.id);
  assert.equal(draws, 2);
});

test('live J&C opening seeded fallback can select an idol instead of the boss', () => {
  const engine = createOpeningEngine(CURRENT_MECHANICS_PROFILE, { seed: 3200, bossId: 'hachiman' });
  const automatic = automaticTwoMasks(engine).at(-1);

  assert.equal(automatic.targetRule, 'seeded_random');
  assert.equal(automatic.targetId, 'idol_left_a');
  assert.notEqual(automatic.targetId, engine.state.boss.id);
});

test('live J&C opening S3 reconciles a finite-boss phase before commands become available', () => {
  const engine = createOpeningEngine(CURRENT_MECHANICS_PROFILE, {
    bossDefinition: {
      id: 'opening-phase-boss', name: 'Opening Phase Boss', maxHp: 1000000, finiteHp: true,
      defense: 385, turnLimit: 5, summons: [], phases: [
        { threshold: 1, name: 'Phase One', defense: 385 },
        { threshold: 0.9999999, name: 'Phase Two', defense: 350 }
      ]
    }
  });

  assert.equal(engine.state.phase, 'battle');
  assert.equal(engine.state.boss.phaseIndex, 1);
  assert.ok(engine.getAvailableActions().length > 0);
});

test('live J&C opening S3 finishes a finite boss before commands become available', () => {
  const engine = createOpeningEngine(CURRENT_MECHANICS_PROFILE, {
    bossDefinition: {
      id: 'opening-victory-boss', name: 'Opening Victory Boss', maxHp: 1, finiteHp: true,
      defense: 385, turnLimit: 5, summons: [], phases: [{ threshold: 1, name: 'Only Phase', defense: 385 }]
    }
  });

  assert.equal(engine.state.phase, 'results');
  assert.equal(engine.state.result.outcome, 'victory');
  assert.equal(engine.getAvailableActions().length, 0);
});

test('live J&C records the second mask target before its Facade-triggered S3', () => {
  const engine = createOpeningEngine(CURRENT_MECHANICS_PROFILE);
  const jc = engine.state.party[0];
  const firstMask = engine.getAvailableActions().find(action => action.type === 'skill' && action.skill.slot === 'S1');
  engine.step({ type: 'skill', skillId: firstMask.skillId, targetId: engine.state.boss.id });
  while (engine.actor.id !== jc.id) engine.step({ type: 'guard', skillId: 'guard' });

  const target = engine.state.boss.summons[1];
  const secondMask = engine.getAvailableActions().find(action => action.type === 'skill' && action.skill.slot === 'S2');
  engine.step({ type: 'skill', skillId: secondMask.skillId, targetId: target.id });
  const automatic = automaticTwoMasks(engine).at(-1);

  assert.equal(jc.jcLastSkillAttackTargetId, target.id);
  assert.equal(automatic.targetId, target.id);
  assert.equal(automatic.targetRule, 'previous_skill_attack');
});

test('live J&C automatic S3 uses a deterministic random fallback when the previous target is dead', () => {
  const resolveFallback = seed => {
    const engine = createOpeningEngine(CURRENT_MECHANICS_PROFILE);
    engine.state.rng = seed;
    const jc = engine.state.party[0];
    const deadTarget = engine.state.boss.summons[0];
    deadTarget.alive = false;
    deadTarget.hp = 0;
    jc.facades = ['mischief', 'service'];
    jc.jcLastSkillAttackTargetId = deadTarget.id;
    engine.resolveJcAutoTwoMasks(jc, 'turn_start');
    return automaticTwoMasks(engine).at(-1);
  };
  const first = resolveFallback(17);
  const second = resolveFallback(17);

  assert.equal(first.targetRule, 'seeded_random');
  assert.equal(first.targetId, second.targetId);
  assert.notEqual(first.targetId, 'idol_left_a');
});

test('live J&C automatic S3 excludes a defeated finite boss from fallback targets', () => {
  const engine = createOpeningEngine(CURRENT_MECHANICS_PROFILE, {
    bossDefinition: {
      id: 'defeated-boss', name: 'Defeated Boss', maxHp: 1000000, finiteHp: true,
      defense: 385, turnLimit: 5,
      summons: [{ id: 'surviving-summon', name: 'Surviving Summon', maxHp: 1000000, defense: 385 }],
      phases: [{ threshold: 1, name: 'Only Phase', defense: 385 }]
    }
  });
  const jc = engine.state.party[0];
  engine.state.boss.hp = 0;
  jc.facades = ['mischief', 'service'];
  jc.jcLastSkillAttackTargetId = engine.state.boss.id;

  engine.resolveJcAutoTwoMasks(jc, 'turn_start');
  const automatic = automaticTwoMasks(engine).at(-1);

  assert.equal(automatic.targetRule, 'seeded_random');
  assert.equal(automatic.targetId, 'surviving-summon');
});

test('recorded profile retains deferred opening S3 timing for archived Nexus replays', () => {
  const engine = createOpeningEngine(RECORDED_MECHANICS_PROFILE);
  const jc = engine.state.party[0];

  assert.equal(automaticTwoMasks(engine).length, 0);
  assert.deepEqual(jc.facades, ['mischief', 'service']);

  const gun = engine.getAvailableActions().find(action => action.type === 'gun');
  engine.step({ type: 'gun', skillId: gun.skillId, targetId: engine.state.boss.id });
  assert.equal(automaticTwoMasks(engine).length, 1);
  assert.match(automaticTwoMasks(engine)[0].message, /at turn start/);
  assert.equal(automaticTwoMasks(engine)[0].targetId, engine.state.boss.id);
  assert.equal(automaticTwoMasks(engine)[0].targetRule, 'recorded_boss_target');
});

test('live J&C skips automatic S3 without RNG or resource spend when no target remains', () => {
  const engine = createOpeningEngine(CURRENT_MECHANICS_PROFILE, {
    bossDefinition: {
      id: 'empty-target-boss', name: 'Empty Target Boss', maxHp: 1000000, finiteHp: true,
      defense: 385, turnLimit: 5, summons: [], phases: [{ threshold: 1, name: 'Only Phase', defense: 385 }]
    }
  });
  const jc = engine.state.party[0];
  engine.state.boss.hp = 0;
  engine.state.rng = 123456;
  jc.facades = ['mischief', 'service'];
  jc.trueDesirePrimed = true;
  const logCount = engine.state.log.length;

  assert.equal(engine.resolveJcAutoTwoMasks(jc, 'facades_ready'), 0);
  assert.equal(engine.state.rng, 123456);
  assert.deepEqual(jc.facades, ['mischief', 'service']);
  assert.equal(jc.trueDesirePrimed, true);
  assert.equal(engine.state.log.length, logCount);
});
