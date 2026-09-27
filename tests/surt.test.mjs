import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../src/engine.js';
import { bosses } from '../src/data.js';

const fixture = (extra = {}) => new BattleEngine({
  seed: 919, bossId: 'surt', modeId: 'multidimensional', teamIds: ['wonder'], ...extra
});

test('Surt is available for MLD, NOD, and DOD with the screenshot-confirmed field', () => {
  const surt = bosses.find(boss => boss.id === 'surt');
  assert.ok(surt);
  assert.deepEqual(surt.supportedModes, ['multidimensional', 'nexus', 'devourer']);
  assert.equal(surt.level, 82);
  assert.equal(surt.difficultyBonus, 4);
  assert.equal(surt.dreamscapeScoreVerified, true);
  assert.equal(surt.turnsSurvivedBonus, 250000);
  assert.equal(surt.encounterEvidence.result.foeDefensePoints, 1_729_515_136);
  assert.equal(surt.encounterEvidence.result.finalScore, 6_919_060_544);
  assert.equal(surt.weakness, 'ice');
  assert.deepEqual(surt.resistances, ['physical', 'gun', 'fire', 'nuclear']);
  assert.deepEqual(surt.immunities, ['instant_kill']);
  assert.deepEqual({
    partyIceDamageBonus: surt.encounter.partyIceDamageBonus,
    partyAttackBonus: surt.encounter.partyAttackBonus,
    resonanceCritDamageBonus: surt.encounter.resonanceCritDamageBonus
  }, { partyIceDamageBonus: 0.2, partyAttackBonus: 0.25, resonanceCritDamageBonus: 0.25 });
  assert.deepEqual(surt.encounterEvidence.liveTrace.runtimePanels, {
    wonder: { displayName: 'Shunichi Kudo', level: 64, hp: 13944, maxHp: 13944, sp: 100, maxSp: 100 },
    marian: { displayName: 'Beachflower Minami', level: 80, hp: 17711, maxHp: 17711, sp: 100, maxSp: 100, partySlot: 3 }
  });
  assert.equal(surt.baseDefense, 821);
  assert.equal(surt.defenseCoefficient, 2.584);
  assert.equal(surt.defense, 821 * 2.584);
  assert.ok(Math.abs(1400 / (1400 + surt.defense) - 0.398) < 0.001);
  assert.equal(surt.downMax, 4);
  assert.equal(surt.summons.length, 4);
  assert.ok(surt.summons.every(summon => summon.name === "Jack-o'-Lantern"));
  assert.ok(surt.summons.every(summon => summon.baseDefense === 364));
  assert.ok(surt.summons.every(summon => summon.defenseCoefficient === 2.584));
  assert.ok(surt.summons.every(summon => summon.defense === 364 * 2.584));
  assert.ok(surt.summons.every(summon => Math.abs(1400 / (1400 + summon.defense) - 0.598) < 0.001));
  assert.ok(surt.summons.every(summon => summon.downMax === 4));
  assert.deepEqual(surt.summons[0].weaknesses, ['physical', 'gun', 'ice', 'wind']);
  for (const modeId of surt.supportedModes) {
    const engine = fixture({ modeId });
    assert.equal(engine.state.boss.id, 'surt');
    assert.equal(engine.state.boss.modeId, modeId);
    assert.equal(engine.isSurtLive(), true);
  }
});

test('Surt score modes expose the shared Dreamscape item system', () => {
  for (const modeId of ['multidimensional', 'nexus', 'devourer']) {
    const engine = fixture({ modeId });
    assert.equal(engine.canUseDreamscapeItems(), true);
    assert.ok(engine.getItemActions().some(action => action.itemId === 'highlight_up' && action.enabled));
  }
});

test('Surt applies Ice damage and Jack-o-Lantern multi-weakness affinities', () => {
  const engine = fixture();
  const actor = engine.actor;
  const boss = engine.state.boss;
  const jack = boss.summons[0];
  const neutralBoss = { ...boss, weakness: 'none', resistances: [], finalDamageTakenMultiplier: 1 };
  const neutralJack = { ...jack, weakness: 'none', weaknesses: [], resistance: 'none', resistances: [] };
  const neutralIce = engine.statusMultiplier(actor, 'ice', neutralBoss, 'character_skill');
  const neutralAlmighty = engine.statusMultiplier(actor, 'almighty', neutralBoss, 'character_skill');
  const surtIce = engine.statusMultiplier(actor, 'ice', boss, 'character_skill');
  assert.ok(Math.abs(neutralIce / neutralAlmighty - (1.3 / 1.1)) < 1e-12);
  assert.ok(Math.abs(surtIce / neutralIce - 1.25) < 1e-12);
  for (const element of ['physical', 'gun', 'ice', 'wind']) {
    const baseline = engine.statusMultiplier(actor, element, neutralJack, 'character_skill');
    const actual = engine.statusMultiplier(actor, element, jack, 'character_skill');
    assert.ok(Math.abs(actual / baseline - 1.25) < 1e-12, element);
  }
  const fireBaseline = engine.statusMultiplier(actor, 'fire', neutralJack, 'character_skill');
  const fireActual = engine.statusMultiplier(actor, 'fire', jack, 'character_skill');
  assert.ok(Math.abs(fireActual / fireBaseline - 0.7) < 1e-12);
  const neutralGunTarget = { ...boss, weakness: 'none', resistances: [], resistance: 'none' };
  const surtGun = engine.statusMultiplier(actor, 'gun', neutralGunTarget, 'gun');
  assert.ok(Math.abs(surtGun - 1.4) < 1e-12);
});

test('Surt applies the confirmed composition, Attack, and Resonance critical-damage effects', () => {
  const withoutRole = fixture();
  const withMedic = fixture();
  withMedic.actor.role = 'Medic';
  assert.equal(withoutRole.dreamscapeDamageTakenMultiplier(withoutRole.state.boss), 1);
  assert.equal(withoutRole.dreamscapeDamageDealtMultiplier(withoutRole.state.boss), 1.6 * 1.1);
  assert.equal(withMedic.dreamscapeDamageTakenMultiplier(withMedic.state.boss), 1.2);
  assert.equal(withMedic.dreamscapeDamageDealtMultiplier(withMedic.state.boss), 0.4 * 1.1);

  const regular = fixture();
  const resonance = fixture();
  regular.random = resonance.random = () => 0.5;
  const skill = { id: 'surt-fixture', name: 'Surt fixture', element: 'almighty', power: 1, guaranteedCritical: true };
  regular.actor.critMult = resonance.actor.critMult = 1.5;
  const regularResult = regular.calculateDamage(regular.actor, skill, regular.state.boss, 'character_skill');
  const resonanceResult = resonance.calculateDamage(resonance.actor, skill, resonance.state.boss, 'resonance_follow_up');
  const regularDamage = regularResult.amount;
  const resonanceDamage = resonanceResult.amount;
  const regularCritBonus = regularResult.damageFormula.rawCritRate
    * (regularResult.damageFormula.criticalMultiplier - 1);
  const resonanceCritBonus = resonanceResult.damageFormula.rawCritRate
    * (resonanceResult.damageFormula.criticalMultiplier - 1);
  assert.ok(Math.abs(regularResult.damageFormula.dreamscapeSkillCritBonus - regularCritBonus) < 1e-12);
  assert.ok(Math.abs(resonanceResult.damageFormula.dreamscapeSkillCritBonus - resonanceCritBonus) < 1e-12);
  assert.ok(Math.abs(resonanceDamage / regularDamage - ((1 + resonanceCritBonus) / (1 + regularCritBonus))) < 0.01);
  const expectedBase = regular.actor.attack * 1.25 * skill.power * 1400 / (1400 + regular.state.boss.defense);
  assert.ok(Math.abs(regularDamage / expectedBase - 1.1 * (1 + regularCritBonus)) < 0.01);
});

test('current-profile bosses share one additive ordinary damage bucket', () => {
  const create = bossId => new BattleEngine({
    seed: 919, bossId, modeId: 'multidimensional', teamIds: ['wonder']
  });
  for (const engine of [create('surt'), create('hachiman')]) {
    engine.actor.damageBonus = 0;
    engine.actor.buffs = [
      { id: 'first_damage_bonus', stat: 'damage', value: 0.5, duration: 9 },
      { id: 'second_damage_bonus', stat: 'damage', value: 0.25, duration: 9 }
    ];
    const target = { ...engine.state.boss, weakness: 'none', weaknesses: [], resistance: 'none', resistances: [], debuffs: [], downed: false };
    const factors = engine.liveDamageFactors(engine.actor, 'almighty', target, 'character_skill');
    const expected = engine.state.boss.id === 'surt' ? 1.85 : 1.75;
    assert.equal(factors.damageBonusMultiplier, expected);
  }
});

test('Surt uses the shared Stable Domain expected-critical conversion', () => {
  const engine = fixture();
  engine.random = () => 0.99;
  engine.actor.crit = 0.485;
  engine.actor.critMult = 3.081;
  const skill = { id: 'dreamscape-crit-fixture', name: 'Dreamscape crit fixture', element: 'almighty', power: 1 };
  const result = engine.calculateDamage(engine.actor, skill, engine.state.boss, 'character_skill');
  assert.equal(result.critical, false);
  assert.ok(Math.abs(result.damageFormula.dreamscapeSkillCritBonus - 1.009285) < 1e-12);
  assert.ok(Math.abs(result.damageFormula.critDamageMultiplier - 2.009285) < 1e-12);
});

test('Surt and all four Jack-o-Lanterns use the shared Hachiman Down-gauge sequence', () => {
  const engine = fixture();
  const qualifying = { weakness: true, critical: false };
  const skill = { element: 'ice' };
  assert.equal(engine.enemies.length, 5);
  for (const target of engine.enemies) {
    assert.equal(target.downPoints, 4);
    for (let hit = 0; hit < 4; hit += 1) engine.updateDownState(target, qualifying, skill);
    assert.equal(target.downPoints, 0);
    assert.equal(target.downed, false);
    engine.updateDownState(target, qualifying, skill);
    assert.equal(target.downed, true);
  }
});

test('Surt field starts everyone at Ragnarok x2 and adds two each Attack Turn', () => {
  const engine = fixture();
  const [surt, jack] = engine.enemies;
  assert.equal(engine.actor.ragnarokStacks, 2);
  assert.deepEqual([surt.ragnarokStacks, jack.ragnarokStacks], [2, 2]);
  const factors = engine.liveDamageFactors(engine.actor, 'almighty', engine.state.boss, 'character_skill');
  assert.ok(factors.bonuses.some(entry => entry.id === 'surt_ragnarok_damage' && entry.value === 0.1));
  engine.advanceSurtEncounterStacks();
  assert.deepEqual([surt.berserkStacks, surt.ragnarokStacks], [1, 4]);
  assert.deepEqual([jack.berserkStacks, jack.ragnarokStacks], [1, 4]);
  assert.equal(engine.actor.ragnarokStacks, 4);
  assert.equal(engine.dreamscapeDamageDealtMultiplier(surt), 1.6 * 1.2);
  for (let turn = 0; turn < 10; turn += 1) engine.advanceSurtEncounterStacks();
  assert.deepEqual([surt.berserkStacks, surt.ragnarokStacks], [3, 10]);
  assert.deepEqual([jack.berserkStacks, jack.ragnarokStacks], [3, 10]);
});
