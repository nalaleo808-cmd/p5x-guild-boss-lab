import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../src/engine.js';
import { getDefaultWonderWeaponProfileId } from '../src/wonder-weapons.js';

function engineWithWeapon(weaponId, options = {}) {
  const wonderLoadout = {
    statsMode: 'equipped',
    baseStats: { maxHp: 10_000, maxSp: 500, attack: 5_000, defense: 2_000 },
    ...(weaponId ? { weaponId, weaponProfileId: getDefaultWonderWeaponProfileId(weaponId) } : {})
  };
  return new BattleEngine({
    seed: 31,
    teamIds: options.teamIds || ['wonder', 'mona'],
    personaIds: options.personaIds || ['alice', 'trumpeter', 'yoshitsune'],
    loadouts: { wonder: wonderLoadout, ...(options.loadouts || {}) }
  });
}

const buffValue = (unit, stat, predicate = () => true) => unit.buffs
  .filter(effect => effect.stat === stat && predicate(effect))
  .reduce((sum, effect) => sum + Number(effect.value || 0), 0);

test('all audited Wonder weapons initialize their high confidence static combat values', () => {
  const checks = [
    ['damascus-knife', engine => assert.equal(buffValue(engine.actor, 'attack'), 0.215)],
    ['fatal-knife', engine => assert.equal(buffValue(engine.actor, 'attack'), 0.28500000000000003)],
    ['midnight-sun', engine => assert.equal(buffValue(engine.actor, 'attack'), 0.24)],
    ['sennight-inferno', engine => {
      assert.equal(buffValue(engine.actor, 'attack'), 0.56);
      assert.equal(buffValue(engine.actor, 'damage'), 0.36);
    }],
    ['all-in', engine => {
      assert.equal(buffValue(engine.actor, 'healing'), 0.4);
      assert.equal(buffValue(engine.actor, 'shieldPotency'), 0.4);
      assert.equal(buffValue(engine.state.party[1], 'defense'), 0.3);
    }],
    ['arc-knife', engine => {
      assert.equal(buffValue(engine.actor, 'attack'), 0.56);
      assert.equal(buffValue(engine.actor, 'elementalAilmentAccuracy'), 0.3);
    }],
    ['ex-machina', engine => {
      assert.equal(buffValue(engine.actor, 'attack'), 0.56);
      assert.equal(buffValue(engine.state.party[1], 'flatAttack'), 240);
      assert.equal(buffValue(engine.actor, 'elementDamage', effect => effect.element === 'curse'), 0.34);
      assert.equal(buffValue(engine.state.party[1], 'elementDamage', effect => effect.element === 'curse'), 0.136);
    }],
    ['glimmer', engine => {
      assert.equal(buffValue(engine.actor, 'attack'), 0.56);
      assert.equal(buffValue(engine.actor, 'elementDamage', effect => effect.element === 'bless'), 0.22);
      assert.equal(buffValue(engine.actor, 'healing'), 0.22);
    }],
    ['eye-of-obsequies', engine => assert.equal(buffValue(engine.actor, 'attack'), 0.56)],
    ['starry-compass', engine => {
      assert.equal(engine.actor.wonderWeapon.effectState.guidance, 10);
      assert.equal(buffValue(engine.actor, 'attack'), 0.56);
      assert.equal(buffValue(engine.actor, 'ailmentAccuracy'), 0.18);
      assert.equal(engine.state.boss.debuffs.find(effect => effect.stat === 'defenseDown')?.value, 0.22);
    }],
    ['abyss-fang', engine => assert.equal(buffValue(engine.actor, 'attack'), 0.56)],
    ['purgatory', engine => {
      assert.equal(engine.actor.wonderWeapon.effectState.trialByFire, 2);
      assert.equal(buffValue(engine.actor, 'attack'), 0.607);
      assert.equal(buffValue(engine.actor, 'flatAttack'), 360);
      assert.equal(buffValue(engine.state.party[1], 'flatAttack'), 300);
      assert.equal(buffValue(engine.actor, 'damage'), 0.16);
      assert.equal(buffValue(engine.state.party[1], 'damage'), 0.06);
    }],
    ['plasma-blade', engine => assert.equal(buffValue(engine.actor, 'attack'), 0.607)],
    ['pheromone-sting', engine => {
      assert.equal(buffValue(engine.actor, 'ailmentAccuracy'), 0.68);
      assert.equal(buffValue(engine.actor, 'ailmentChance'), 0.25);
    }],
    ['cyclotron', engine => {
      assert.equal(buffValue(engine.actor, 'attack'), 0.56);
      assert.equal(buffValue(engine.actor, 'critRate'), 0.19);
    }],
    ['cursed-ties', engine => assert.equal(buffValue(engine.actor, 'ailmentAccuracy'), 0.68)],
    ['ice-age', engine => assert.equal(buffValue(engine.actor, 'attack'), 0.56)],
    ['event-horizon', engine => {
      assert.deepEqual(engine.actor.wonderWeapon.effectState.spaghettificationStacks, { wonder: 2, mona: 2 });
      assert.equal(buffValue(engine.actor, 'attack'), 0.78);
      assert.equal(buffValue(engine.actor, 'flatAttack'), 200);
      assert.equal(buffValue(engine.state.party[1], 'elementCritDamage', effect => effect.element === 'nuclear'), 0.2);
    }]
  ];

  for (const [weaponId, check] of checks) check(engineWithWeapon(weaponId));
});

test('static Attack and element passives change BattleEngine damage', () => {
  const baseline = engineWithWeapon(null);
  const damascus = engineWithWeapon('damascus-knife');
  const exMachina = engineWithWeapon('ex-machina');
  const curseSkill = { id: 'curse-test', name: 'Curse Test', element: 'curse', target: 'boss', power: 1, cost: 0, canCrit: false };
  for (const engine of [baseline, damascus, exMachina]) engine.random = () => 0.5;
  const baseDamage = baseline.calculateDamage(baseline.actor, curseSkill, baseline.state.boss, 'persona_skill').amount;
  const damascusDamage = damascus.calculateDamage(damascus.actor, curseSkill, damascus.state.boss, 'persona_skill').amount;
  const exMachinaDamage = exMachina.calculateDamage(exMachina.actor, curseSkill, exMachina.state.boss, 'persona_skill').amount;
  assert.ok(damascusDamage > baseDamage);
  assert.ok(exMachinaDamage > damascusDamage);
});

test('All In healing, shield, and Defense bonuses reach combat consumers', () => {
  const baseline = engineWithWeapon(null);
  const allIn = engineWithWeapon('all-in');
  assert.equal(allIn.healingMultiplier(allIn.actor), 1.4);
  assert.equal(allIn.shieldMultiplier(allIn.actor), 1.4);

  baseline.random = () => 0;
  allIn.random = () => 0;
  const baselineHp = baseline.actor.hp;
  const allInHp = allIn.actor.hp;
  baseline.resolveEnemyAttack(baseline.state.boss);
  allIn.resolveEnemyAttack(allIn.state.boss);
  assert.ok(allInHp - allIn.actor.hp < baselineHp - baseline.actor.hp);
});

test('damage packets update Starry, Abyss, Purgatory, Cyclotron, and Event Horizon', () => {
  const neutralSkill = { id: 'packet', name: 'Packet', element: 'almighty', target: 'boss', power: 0.01, cost: 0, canCrit: false };

  const starry = engineWithWeapon('starry-compass');
  starry.resolveSkill(starry.actor, neutralSkill, starry.state.boss.id, 'persona_skill');
  assert.equal(starry.actor.wonderWeapon.effectState.guidance, 11);

  const abyss = engineWithWeapon('abyss-fang');
  abyss.resolveSkill(abyss.actor, { ...neutralSkill, additionalHits: [{ power: 0.01 }] }, abyss.state.boss.id, 'persona_skill');
  assert.equal(abyss.actor.wonderWeapon.effectState.hunterInstinct, 5);
  assert.equal(buffValue(abyss.actor, 'critRate'), 0.18);

  const purgatory = engineWithWeapon('purgatory');
  const ally = purgatory.state.party[1];
  purgatory.resolveSkill(ally, { ...neutralSkill, element: 'fire' }, purgatory.state.boss.id, 'character_skill');
  assert.equal(purgatory.actor.wonderWeapon.effectState.trialByFire, 3);
  assert.equal(buffValue(ally, 'elementDamage', effect => effect.element === 'fire'), 0.24);

  const cyclotron = engineWithWeapon('cyclotron');
  cyclotron.resolveSkill(cyclotron.state.party[1], { ...neutralSkill, element: 'electric' }, cyclotron.state.boss.id, 'character_skill');
  assert.equal(buffValue(cyclotron.state.party[1], 'damage'), 0.18);
  assert.equal(buffValue(cyclotron.actor, 'elementCritDamage', effect => effect.element === 'electric'), 0.18);

  const horizon = engineWithWeapon('event-horizon');
  horizon.actor.wonderWeapon.effectState.spaghettificationStacks = { wonder: 1, mona: 1 };
  horizon.syncWonderWeaponStaticEffects();
  horizon.resolveSkill(horizon.state.party[1], { ...neutralSkill, element: 'nuclear' }, horizon.state.boss.id, 'character_skill');
  assert.deepEqual(horizon.actor.wonderWeapon.effectState.spaghettificationStacks, { wonder: 2, mona: 2 });
});

test('Starry Compass loses 5 Guidance only at the end of Wonder turn', () => {
  const engine = engineWithWeapon('starry-compass');
  engine.resolveWonderWeaponDamagePacket(engine.state.party[1], { element: 'fire' }, engine.state.boss, 1, 'character_skill');
  assert.equal(engine.actor.wonderWeapon.effectState.guidance, 11);

  engine.resolveWonderWeaponTurnEnd(engine.actor);
  assert.equal(engine.actor.wonderWeapon.effectState.guidance, 6);
  assert.equal(engine.state.boss.debuffs.find(effect => effect.stat === 'defenseDown')?.value, 0.22);

  engine.resolveWonderWeaponTurnEnd(engine.state.party[1]);
  assert.equal(engine.actor.wonderWeapon.effectState.guidance, 6);
});

test('Persona change, knockdown, ally heal, and explicit Ancient Frost hooks alter combat state', () => {
  const midnight = engineWithWeapon('midnight-sun');
  midnight.selectPersona('trumpeter');
  assert.equal(buffValue(midnight.actor, 'attack'), 0.484);

  const sennight = engineWithWeapon('sennight-inferno');
  sennight.state.boss.downPoints = 0;
  sennight.updateDownState(sennight.state.boss, { weakness: true, critical: false }, { element: 'ice' }, sennight.actor, 'persona_skill');
  assert.equal(sennight.state.boss.debuffs.find(effect => effect.sourceWeaponId === 'sennight-inferno')?.value, 0.3);

  const supportSkill = { id: 'ally-support', name: 'Ally Support', element: 'support', target: 'ally', power: 0, cost: 0 };
  const allIn = engineWithWeapon('all-in');
  const allInTarget = allIn.state.party[1];
  allInTarget.hp = 1;
  allIn.resolveSkill(allIn.actor, supportSkill, allInTarget.id, 'persona_skill');
  assert.equal(allInTarget.hp, 1 + Math.round(allInTarget.maxHp * 0.2 * 1.4));

  const iceAge = engineWithWeapon('ice-age');
  const frostTarget = iceAge.state.party[1];
  iceAge.resolveSkill(iceAge.actor, supportSkill, frostTarget.id, 'persona_skill');
  assert.equal(buffValue(frostTarget, 'damage'), 0.16);
  assert.equal(buffValue(frostTarget, 'elementDamage', effect => effect.element === 'ice'), 0.22);
  assert.equal(buffValue(iceAge.actor, 'damage'), 0.35);
});

test('selected unresolved weapon mechanics are emitted as limitations', () => {
  const plasma = engineWithWeapon('plasma-blade');
  assert.ok(plasma.state.mechanicsLimitations.some(message => message.includes('Flames of Desire')));
  const iceAge = engineWithWeapon('ice-age');
  assert.ok(iceAge.state.mechanicsLimitations.some(message => message.includes('target-selection policy')));
});
