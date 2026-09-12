import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../src/engine.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';

const strike = { id: 'equipped-strike', name: 'Equipped Strike', slot: 'S1', element: 'curse',
  target: 'boss', power: 1, cost: 0, canCrit: false };
const fighter = id => ({ id, name: id, codename: id, role: 'Assassin', element: 'curse', awareness: 0,
  maxHp: 1000, maxSp: 100, attack: 100, defense: 100, speed: 100, crit: 0.1, critMult: 1.5,
  actionLimit: 1, skills: [strike] });
const fixture = (loadout = {}) => new BattleEngine({
  seed: 91, teamIds: ['equipped-fixture'], characterDefinitions: [fighter('equipped-fixture')],
  loadouts: { 'equipped-fixture': loadout }
});

test('equipped screenshot stats are exact totals while non-overlapping Revelation effects remain', () => {
  const berry = lufelCatalog.characters.find(character => character.slug === 'berry');
  const engine = new BattleEngine({
    seed: 808,
    teamIds: [berry.id],
    characterDefinitions: [berry],
    loadouts: {
      [berry.id]: {
        statsMode: 'equipped',
        baseStats: {
          maxHp: 8634, maxSp: 100, attack: 4927, defense: 1494, speed: 96,
          critRate: 54.2, critMult: 235.5, spRecovery: 0, technicalPrecision: 0,
          pierceRate: 7.5, downPoints: 0, ailmentAccuracy: 3.1, ailmentResistance: 0,
          damageBonus: 55.9, damageReduction: 0
        },
        revelationCombat: {
          attackPercent: 0.12, hpPercent: 0.12, critRate: 0.075, damageBonus: 0.1,
          elementBonus: { element: 'curse', value: 0.2 }, highlightStart: 20
        }
      }
    }
  });
  const unit = engine.state.party[0];

  assert.equal(unit.statsMode, 'equipped');
  assert.deepEqual({ maxHp: unit.maxHp, hp: unit.hp, maxSp: unit.maxSp, attack: unit.attack,
    defense: unit.defense, speed: unit.speed, crit: unit.crit, critMult: unit.critMult }, {
    maxHp: 8634, hp: 8634, maxSp: 100, attack: 4927, defense: 1494, speed: 96, crit: 0.542, critMult: 2.355
  });
  assert.deepEqual({ spRecovery: unit.spRecovery, technicalPrecision: unit.technicalPrecision,
    pierceRate: unit.pierceRate, downPoints: unit.downPoints, ailmentAccuracy: unit.ailmentAccuracy,
    ailmentResistance: unit.ailmentResistance, damageBonus: unit.damageBonus, damageReduction: unit.damageReduction }, {
    spRecovery: 0, technicalPrecision: 0, pierceRate: 0.075, downPoints: 0, ailmentAccuracy: 0.031,
    ailmentResistance: 0, damageBonus: 55.9 / 100, damageReduction: 0
  });
  // Live Highlight is one shared party meter that opens at the Revelation
  // start bonus; personal gauges stay at zero.
  assert.equal(unit.highlight, 0);
  assert.equal(unit.highlightStart, 20);
  assert.equal(engine.state.sharedCombat.highlight, 20);
  assert.equal(engine.getHighlightState().start, 20);
  assert.deepEqual(unit.elementBonus, { element: 'curse', value: 0.2 });
});

test('ordinary base-stat loads add Revelation bonuses on top of every base stat', () => {
  const engine = fixture({
    baseStats: { maxHp: 2000, attack: 200, critRate: 50, damageBonus: 50 },
    revelationCombat: { hpPercent: 0.5, attackPercent: 0.5, critRate: 0.1, damageBonus: 0.2 }
  });
  const unit = engine.actor;

  assert.equal(unit.maxHp, 3000);
  assert.equal(unit.attack, 300);
  assert.equal(unit.crit, 0.6);
  // Only equipped screenshot totals suppress the overlapping Revelation bonus;
  // an ordinary 50% base damage bonus plus the 20% Revelation bonus is 70%.
  assert.equal(unit.damageBonus, 0.7);
  assert.equal(unit.statsMode, null);
});

test('equipped damage bonus and pierce increase outgoing damage', () => {
  const baseline = fixture();
  const boosted = fixture({ statsMode: 'equipped', baseStats: { damageBonus: 10, pierceRate: 10 } });
  baseline.random = () => 0.5;
  boosted.random = () => 0.5;

  const plain = baseline.calculateDamage(baseline.actor, strike, baseline.state.boss, 'character_skill').amount;
  const equipped = boosted.calculateDamage(boosted.actor, strike, boosted.state.boss, 'character_skill').amount;

  assert.ok(equipped > plain);
});

test('equipped damage reduction lowers incoming boss and timeline-enemy damage', () => {
  for (const resolve of [
    engine => engine.bossAction(),
    engine => engine.resolveEnemyAttack({ ...engine.state.boss, id: 'fixture-enemy', actionScale: 1 })
  ]) {
    const baseline = fixture();
    const protectedEngine = fixture({ statsMode: 'equipped', baseStats: { damageReduction: 20 } });
    baseline.random = () => 0.5;
    protectedEngine.random = () => 0.5;
    const baselineHp = baseline.actor.hp;
    const protectedHp = protectedEngine.actor.hp;

    resolve(baseline);
    resolve(protectedEngine);

    assert.ok(protectedHp - protectedEngine.actor.hp < baselineHp - baseline.actor.hp);
  }
});

test('base Technical Precision uses an explicit supplied scaling rule', () => {
  const engine = fixture({ statsMode: 'equipped', baseStats: { technicalPrecision: 600 } });
  engine.random = () => 0.5;
  engine.state.boss.debuffs.push({ id: 'fixture-ailment', duration: 2 });
  const result = engine.calculateDamage(engine.actor, {
    ...strike,
    technical: {
      sourceUrl: 'test:equipped-stats', ailmentIds: ['fixture-ailment'], chance: 0.2,
      chancePerPrecision: 0.001, damageMultiplier: 2, consumeAilment: false, canCrit: false
    }
  }, engine.state.boss, 'character_skill');

  assert.equal(result.technical.activated, true);
});

test('an explicit zero SP Recovery does not fall back to 100 percent', () => {
  const splash = { ...strike, id: 'jellyfish-splash', name: 'Jellyfish Splash' };
  const swimmer = { ...fighter('swimmer'), skills: [splash] };
  const engine = new BattleEngine({
    seed: 91, teamIds: [swimmer.id], characterDefinitions: [swimmer],
    loadouts: { [swimmer.id]: { statsMode: 'equipped', baseStats: { spRecovery: 0 } } }
  });
  engine.actor.sp = 0;

  engine.resolveSkill(engine.actor, splash, engine.state.boss.id, 'character_skill', { ignoreCost: true });

  assert.equal(engine.actor.sp, 0);
});
