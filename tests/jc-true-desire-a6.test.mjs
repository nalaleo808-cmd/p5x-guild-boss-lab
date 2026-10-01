import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine, CURRENT_MECHANICS_PROFILE, RECORDED_MECHANICS_PROFILE } from '../src/engine.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';

const twins = lufelCatalog.characters.find(character => character.slug === 'j-c');
const miku = lufelCatalog.characters.find(character => character.slug === 'miku');

function createJcEngine(mechanicsProfile = CURRENT_MECHANICS_PROFILE, jcMaskPair = ['mischief', 'service'], extra = {}) {
  return new BattleEngine({
    seed: 808,
    mechanicsProfile,
    characterDefinitions: [{ ...twins, awareness: 6 }],
    teamIds: [twins.id, 'wonder', 'joker', 'mona'],
    jcMaskPair,
    ...extra
  });
}

function advanceToJc(engine, jc) {
  while (engine.actor.id !== jc.id) engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });
}

function advanceToWonder(engine) {
  while (engine.actor.id !== 'wonder') engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });
}

function wonderAction(engine, type, targetId = engine.state.boss.id) {
  advanceToWonder(engine);
  const action = engine.getAvailableActions().find(candidate => candidate.type === type && candidate.enabled);
  assert.ok(action, `Wonder ${type} must be available`);
  return engine.step({ type, skillId: action.skillId, targetId });
}

function maskAction(engine, slot) {
  return engine.getAvailableActions().find(action => action.type === 'skill' && action.skill.slot === slot);
}

test('live A6 spends True Desire immediately and does not debit the stored enhancement again at S3 resolution', () => {
  const engine = createJcEngine();
  const jc = engine.state.party[0];
  const before = { actionNumber: engine.state.actionNumber, sp: jc.sp, actions: engine.state.turnActionsUsed };

  const stored = engine.setTrueDesire(true);
  assert.equal(stored.consumedAction, false);
  assert.equal(jc.trueDesireStacks, 0);
  assert.equal(jc.trueDesirePrimed, true);
  assert.equal(engine.state.actionNumber, before.actionNumber);
  assert.equal(jc.sp, before.sp);
  assert.equal(engine.state.turnActionsUsed, before.actions);
  assert.match(stored.events[0].message, /spent 1 True Desire.*next Two Masks as One/i);

  const firstMask = maskAction(engine, 'S1');
  engine.step({ type: 'skill', skillId: firstMask.skillId, targetId: engine.state.boss.id });
  advanceToJc(engine, jc);
  const secondMask = maskAction(engine, 'S2');
  engine.step({ type: 'skill', skillId: secondMask.skillId, targetId: engine.state.boss.id });

  assert.equal(jc.trueDesireStacks, 0);
  assert.equal(jc.trueDesirePrimed, false);
});

// A6: "regain True Desire every 8 actions if it has been spent". User,
// 2026-10-01: pressed at T9, Alt back at T11, where T10 and T11 are MIKU's
// Concert rounds; every party member's counted action advances the clock.
test('live A6 regains True Desire after 8 counted party actions once it has been spent', () => {
  const engine = createJcEngine(CURRENT_MECHANICS_PROFILE, ['mischief', 'service'], {
    bossDefinition: {
      id: 'a6-recharge-target', name: 'A6 Recharge Target', maxHp: 1_000_000_000,
      finiteHp: false, attack: 0, defense: 385, turnLimit: 50, summons: [],
      phases: [{ threshold: 1, name: 'Stable', defense: 385 }]
    },
    turnLimit: 50
  });
  const jc = engine.state.party[0];
  assert.equal(jc.trueDesireRechargeOwner, 'party');
  assert.equal(jc.trueDesireRecharging, false);

  // Unspent: party actions do not build a reserve.
  for (let count = 0; count < 12; count += 1) wonderAction(engine, 'guard');
  assert.equal(jc.trueDesireStacks, 1);
  assert.equal(jc.trueDesireRechargeActions, 0);

  advanceToJc(engine, jc);
  engine.setTrueDesire(true);
  assert.equal(jc.trueDesireStacks, 0);
  assert.equal(jc.trueDesireRecharging, true);
  for (let count = 0; count < 7; count += 1) {
    const guard = engine.getAvailableActions().find(action => action.type === 'guard' && action.enabled);
    engine.step({ type: 'guard', skillId: guard.skillId, targetId: 'self' });
  }
  assert.equal(jc.trueDesireRechargeProgress, 7);
  assert.equal(jc.trueDesireStacks, 0);
  const guard = engine.getAvailableActions().find(action => action.type === 'guard' && action.enabled);
  engine.step({ type: 'guard', skillId: guard.skillId, targetId: 'self' });
  assert.equal(jc.trueDesireStacks, 1);
  assert.equal(jc.trueDesireRecharging, false);
  assert.ok(engine.state.log.some(event => event.resource === 'trueDesire' && event.rechargeOwner === 'party'));
  // The first enhancement is still stored (J&C only guarded), which blocks a
  // second press until a Two Masks as One spends it.
  assert.equal(jc.trueDesirePrimed, true);
});

test('Concert actions advance the True Desire clock', () => {
  const engine = createJcEngine(CURRENT_MECHANICS_PROFILE, ['mischief', 'service'], {
    bossId: 'hachiman', modeId: 'multidimensional', navigatorDefinition: miku
  });
  const jc = engine.state.party[0];
  engine.state.attackTurnsLeft = 50;
  engine.state.boss.turnLimit = 50;
  engine.state.boss.previewAttackTurns = 50;
  advanceToJc(engine, jc);
  engine.setTrueDesire(true);
  advanceToWonder(engine);
  const before = jc.trueDesireRechargeActions;
  engine.state.navigator.tracks = ['Break', 'Critical', 'Expert'];
  const showstopper = engine.getNavigatorActions().find(action => action.name === 'Showstopper');
  engine.stepNavigator(showstopper.id);
  assert.equal(engine.isVirtualConcertActive(), true);
  let concertActions = 0;
  while (engine.isVirtualConcertActive() && jc.trueDesireRecharging) {
    const guard = engine.getAvailableActions().find(action => action.type === 'guard' && action.enabled);
    engine.step({ type: 'guard', skillId: guard.skillId, targetId: 'self' });
    concertActions += 1;
  }
  assert.ok(concertActions > 0);
  assert.equal(jc.trueDesireRecharging ? jc.trueDesireRechargeActions : 8, Math.min(8, before + concertActions));
});

test('recorded profile retains its deferred True Desire debit at S3 resolution', () => {
  const engine = createJcEngine(RECORDED_MECHANICS_PROFILE);
  const jc = engine.state.party[0];

  jc.trueDesireStacks = 0;
  jc.jcTurnsStarted = 8;
  engine.beginActorTurn();
  assert.equal(jc.trueDesireStacks, 1);
  assert.equal(jc.trueDesireWonderActions, undefined);

  engine.setTrueDesire(true);
  assert.equal(jc.trueDesireStacks, 1);
  assert.equal(jc.trueDesirePrimed, true);

  const gun = engine.getAvailableActions().find(action => action.type === 'gun');
  engine.step({ type: 'gun', skillId: gun.skillId, targetId: engine.state.boss.id });
  assert.equal(jc.trueDesireStacks, 0);
  assert.equal(jc.trueDesirePrimed, false);
});

test('enhanced S3 applies every Facade effect, hits every foe, and confines Luck-Service ailments to the main target', () => {
  const engine = createJcEngine(CURRENT_MECHANICS_PROFILE, ['luck', 'service']);
  const jc = engine.state.party[0];
  const mainTarget = engine.state.boss.summons[0];

  // The automatic opening S3 is a separate Luck-Service resolution.
  for (const enemy of engine.enemies) enemy.debuffs = [];
  engine.setTrueDesire(true);
  const firstMask = maskAction(engine, 'S1');
  engine.step({ type: 'skill', skillId: firstMask.skillId, targetId: engine.state.boss.id });
  advanceToJc(engine, jc);
  const secondMask = maskAction(engine, 'S2');
  engine.step({ type: 'skill', skillId: secondMask.skillId, targetId: mainTarget.id });

  const elementalHits = engine.state.log.filter(event => event.type === 'damage'
    && event.sourceType === 'awareness_follow_up'
    && ['fire', 'ice', 'electric', 'wind', 'psychic', 'nuclear', 'bless', 'curse'].includes(event.element));
  assert.equal(elementalHits.length, 8);
  assert.ok(elementalHits.every(event => event.targetId === mainTarget.id));
  assert.ok(engine.enemies.every(enemy => enemy.debuffs.some(effect => effect.id === 'jc_two_masks_def_down')));
  assert.ok(['jc_shock', 'jc_windswept', 'jc_curse_stacks'].every(id => mainTarget.debuffs.some(effect => effect.id === id)));
  assert.ok(engine.enemies.filter(enemy => enemy.id !== mainTarget.id).every(enemy => ['jc_shock', 'jc_windswept', 'jc_curse_stacks'].every(id => !enemy.debuffs.some(effect => effect.id === id))));
  assert.ok(jc.buffs.some(effect => effect.id === 'jc_rebel_surveillance'));
  assert.ok(engine.state.party.every(unit => unit.buffs.some(effect => effect.id === 'jc_two_masks_damage')));
  assert.ok(engine.state.mechanicsLimitations.some(text => /Rebel Surveillance Effects Share stat effect/i.test(text)));
});

test('live Wonder level bonus can be configured while A6 J&C is off-party without inventing coefficients', () => {
  const live = new BattleEngine({ teamIds: ['wonder'], jcA6Unlocked: true });
  const recorded = new BattleEngine({ mechanicsProfile: RECORDED_MECHANICS_PROFILE, teamIds: ['wonder'], jcA6Unlocked: true });

  assert.equal(live.state.wonderLevelBonus, 1);
  assert.ok(live.skillsFor(live.state.party[0]).every(skill => skill.skillLevelBonus === 1));
  assert.ok(live.state.mechanicsLimitations.some(text => /Skill Level and \+1 Thief Tactics Level.*no numeric multiplier/i.test(text)));
  assert.equal(recorded.state.wonderLevelBonus, 0);
});
