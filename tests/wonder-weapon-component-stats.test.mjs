import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../src/engine.js';
import { getDefaultWonderWeaponProfileId } from '../src/wonder-weapons.js';

function engineWithWeapon(weaponId, loadout = {}) {
  return new BattleEngine({
    seed: 21,
    teamIds: ['wonder'],
    loadouts: {
      wonder: {
        ...loadout,
        ...(weaponId ? {
          weaponId,
          weaponProfileId: getDefaultWonderWeaponProfileId(weaponId)
        } : {})
      }
    }
  });
}

test('automatic Wonder stats include selected weapon components in combat totals', () => {
  const baseline = engineWithWeapon(null).actor;
  const wonder = engineWithWeapon('ice-age').actor;

  assert.equal(wonder.maxHp, baseline.maxHp + 2051);
  assert.equal(wonder.hp, wonder.maxHp);
  assert.equal(wonder.attack, baseline.attack + 654);
  assert.equal(wonder.defense, Number(baseline.defense || 0) + 356);
  assert.equal(wonder.mechanicAttack, baseline.mechanicAttack + 654);
  assert.equal(wonder.mechanicMaxHp, baseline.mechanicMaxHp + 2051);
  assert.equal(wonder.wonderWeapon.componentStatsApplied, true);
});

test('base-stat Wonder loads add weapon components to entered bases', () => {
  const wonder = engineWithWeapon('ice-age', {
    baseStats: { maxHp: 10_000, attack: 5_000, defense: 2_000 }
  }).actor;

  assert.equal(wonder.maxHp, 12_051);
  assert.equal(wonder.hp, 12_051);
  assert.equal(wonder.attack, 5_654);
  assert.equal(wonder.defense, 2_356);
  assert.equal(wonder.mechanicAttack, 5_654);
  assert.equal(wonder.mechanicMaxHp, 12_051);
  assert.equal(wonder.wonderWeapon.componentStatsApplied, true);
});

test('equipped Wonder totals do not add weapon components again', () => {
  const wonder = engineWithWeapon('ice-age', {
    statsMode: 'equipped',
    baseStats: { maxHp: 10_000, attack: 5_000, defense: 2_000 }
  }).actor;

  assert.equal(wonder.maxHp, 10_000);
  assert.equal(wonder.hp, 10_000);
  assert.equal(wonder.attack, 5_000);
  assert.equal(wonder.defense, 2_000);
  assert.equal(wonder.mechanicAttack, 5_000);
  assert.equal(wonder.mechanicMaxHp, 10_000);
  assert.equal(wonder.wonderWeapon.componentStatsApplied, false);
});

test('Wonder without a weapon keeps unmodified automatic stats', () => {
  const wonder = engineWithWeapon(null).actor;

  assert.equal(wonder.maxHp, 920);
  assert.equal(wonder.hp, 920);
  assert.equal(wonder.attack, 225);
  assert.equal(wonder.defense, undefined);
  assert.equal(wonder.mechanicAttack, 225);
  assert.equal(wonder.mechanicMaxHp, 920);
  assert.equal(wonder.wonderWeapon, undefined);
});

test('switching Wonder weapons replaces the applied component totals and profile', () => {
  const iceAge = engineWithWeapon('ice-age').actor;
  const abyssFang = engineWithWeapon('abyss-fang').actor;

  assert.equal(iceAge.maxHp - abyssFang.maxHp, 125);
  assert.equal(abyssFang.attack - iceAge.attack, 35);
  assert.equal(iceAge.defense, abyssFang.defense);
  assert.equal(iceAge.wonderWeapon.weaponId, 'ice-age');
  assert.equal(abyssFang.wonderWeapon.weaponId, 'abyss-fang');
  assert.notEqual(iceAge.wonderWeapon.profileId, abyssFang.wonderWeapon.profileId);
  assert.equal(iceAge.wonderWeapon.componentStatsApplied, true);
  assert.equal(abyssFang.wonderWeapon.componentStatsApplied, true);
});

test('applied Wonder weapon Attack increases combat damage', () => {
  const baseline = engineWithWeapon(null);
  const armed = engineWithWeapon('ice-age');
  const skill = {
    id: 'weapon-component-test', name: 'Weapon Component Test', element: 'almighty',
    target: 'boss', power: 1, cost: 0, canCrit: false
  };
  baseline.random = () => 0.5;
  armed.random = () => 0.5;

  const baselineDamage = baseline.calculateDamage(baseline.actor, skill, baseline.state.boss, 'character_skill').amount;
  const armedDamage = armed.calculateDamage(armed.actor, skill, armed.state.boss, 'character_skill').amount;

  assert.ok(armedDamage > baselineDamage);
});
