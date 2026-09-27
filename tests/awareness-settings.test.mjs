import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine, simulate } from '../src/engine.js';
import { roster, navigator } from '../src/data.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';
import {
  AWARENESS_LEVELS, awarenessCoverage, awarenessStatDefaults, loadoutForUnit,
  normalizeAwareness, migrateAwarenessLoadout, resolveAwareness, setLoadoutAwareness
} from '../src/awareness.js';

const navSlugs = new Set(['miku', 'ange']);
const combatants = [...roster, ...lufelCatalog.characters.filter(unit => !navSlugs.has(unit.slug))];
const navigators = [navigator, ...lufelCatalog.characters.filter(unit => navSlugs.has(unit.slug)).map(unit => ({
  ...unit, id: `navigator-${unit.slug}`, sourceCharacterId: unit.id,
  skills: unit.skills.map((skill, index) => ({ ...skill, id: `navigator-${unit.slug}-${index + 1}`, power: 0, cooldown: skill.cooldown || 4 }))
}))];
const definition = slug => lufelCatalog.characters.find(unit => unit.slug === slug);
const create = (unit, awareness, extra = {}) => new BattleEngine({
  seed: 42, characterDefinitions: [unit], teamIds: [unit.id],
  loadouts: { [unit.id]: { awareness } }, ...extra
});

test('all 26 existing entries are represented without adding characters', () => {
  assert.equal(combatants.length, 23);
  assert.equal(navigators.length, 3);
  assert.equal(new Set([...combatants, ...navigators].map(unit => unit.id)).size, 26);
});

for (const unit of combatants) {
  test(`${unit.codename}: all seven ranks reach combat and survive reset`, () => {
    for (const rank of AWARENESS_LEVELS) {
      const engine = create(unit, rank);
      assert.equal(engine.state.party[0].awareness, rank, `${unit.id} A${rank}`);
      engine.reset();
      assert.equal(engine.state.party[0].awareness, rank);
      assert.equal(engine.config.loadouts[unit.id].awareness, rank);
    }
  });
}
for (const unit of navigators) {
  test(`${unit.codename} navigator: all seven ranks reach navigator state and survive reset`, () => {
    for (const rank of AWARENESS_LEVELS) {
      const engine = new BattleEngine({ seed: 42, teamIds: ['wonder'], navigatorDefinition: unit,
        loadouts: { [unit.id]: { awareness: rank } } });
      assert.equal(engine.state.navigator.awareness, rank);
      engine.reset();
      assert.equal(engine.state.navigator.awareness, rank);
    }
  });
}

test('zero, numeric strings, invalid values and rank bounds are normalized safely', () => {
  assert.equal(normalizeAwareness(0), 0);
  assert.equal(normalizeAwareness('0'), 0);
  assert.equal(normalizeAwareness(6.9), 6);
  assert.equal(normalizeAwareness(-10), 0);
  assert.equal(normalizeAwareness('3.9'), 3);
  for (const value of [null, undefined, '', ' ', true, false, NaN, Infinity, {}, [], 'A5']) {
    assert.equal(normalizeAwareness(value), 6, String(value));
    assert.equal(normalizeAwareness(value, 2), 2);
  }
});

test('canonical A0 overrides both an A6 definition and old Cosmic A6 settings', () => {
  const unit = definition('bui-cosmic');
  const loadout = { awareness: 0, cosmicYui: { awareness: 6 } };
  assert.equal(resolveAwareness(unit, loadout), 0);
  const engine = create(unit, 0, { loadouts: { [unit.id]: loadout } });
  assert.equal(engine.actor.awareness, 0);
  assert.equal(engine.actor.cosmicYui.permanentHarvest, false);
  assert.equal(engine.actor.cosmicYui.seedPotato, 0);
});

test('legacy Cosmic awareness migrates without resetting the selected rank', () => {
  const unit = definition('bui-cosmic');
  for (const rank of AWARENESS_LEVELS) {
    const loadout = { cosmicYui: { awareness: rank, weapon: 'signature', refinement: 4 } };
    assert.equal(resolveAwareness(unit, loadout), rank);
    setLoadoutAwareness(unit, loadout, rank);
    assert.equal(loadout.awareness, rank);
    assert.equal(loadout.cosmicYui.awareness, rank);
    assert.equal(loadout.cosmicYui.weapon, 'signature');
    assert.equal(loadout.cosmicYui.refinement, 4);
  }
});

test('navigator source-character IDs remain supported for imported loadouts', () => {
  const miku = navigators.find(unit => unit.slug === 'miku');
  const loadouts = { [miku.sourceCharacterId]: { awareness: 2 } };
  assert.equal(loadoutForUnit(loadouts, miku).awareness, 2);
  const engine = new BattleEngine({ navigatorDefinition: miku, loadouts });
  assert.equal(engine.state.navigator.awareness, 2);
  loadouts[miku.id] = { awareness: 0 };
  assert.equal(new BattleEngine({ navigatorDefinition: miku, loadouts }).state.navigator.awareness, 0);
});

test('all 147 imported rank/stat combinations use the exact source row in source scale', () => {
  for (const unit of lufelCatalog.characters) for (const rank of AWARENESS_LEVELS) {
    const source = unit.sourceStats[`a${rank}_lv80`];
    const actual = awarenessStatDefaults(unit, rank, { sourceScale: true });
    assert.equal(actual.attack, source.attack);
    assert.equal(actual.maxHp, source.HP);
    assert.equal(actual.defense, source.defense);
  }
});

test('archived encounter scale keeps imported A6 defaults and uses sourced lower-rank ratios', () => {
  for (const unit of lufelCatalog.characters) {
    const a6 = awarenessStatDefaults(unit, 6);
    assert.equal(a6.attack, unit.attack);
    assert.equal(a6.maxHp, unit.maxHp);
    assert.equal(a6.defense, unit.defense);
    const a0 = awarenessStatDefaults(unit, 0);
    const source = unit.sourceStats;
    assert.equal(a0.attack, Math.round(unit.attack * source.a0_lv80.attack / source.a6_lv80.attack));
    assert.ok(a0.attack < a6.attack, unit.slug);
    assert.ok(a0.maxHp < a6.maxHp, unit.slug);
  }
});

test('each sourced combatant actually receives lower-rank default stats in combat', () => {
  for (const unit of combatants.filter(unit => unit.sourceStats)) {
    const a0 = create(unit, 0).state.party[0];
    const a6 = create(unit, 6).state.party[0];
    assert.ok(a0.attack < a6.attack, unit.id);
    assert.ok(a0.maxHp < a6.maxHp, unit.id);
  }
});

test('Hachiman source-scale encounters select the actual rank-specific source stats', () => {
  const unit = definition('noir');
  for (const rank of AWARENESS_LEVELS) for (const modeId of ['devourer', 'multidimensional']) {
    const engine = create(unit, rank, { bossId: 'hachiman', modeId });
    assert.equal(engine.actor.attack, Math.round(unit.sourceStats[`a${rank}_lv80`].attack));
    assert.equal(engine.actor.maxHp, Math.round(unit.sourceStats[`a${rank}_lv80`].HP));
  }
});

test('manual equipped totals are never rewritten when awareness changes', () => {
  const unit = definition('berry');
  const baseStats = { attack: 4927, maxHp: 8634, defense: 1494, critRate: 54.2, critMult: 235.5, maxSp: 100 };
  for (const rank of AWARENESS_LEVELS) {
    const engine = create(unit, rank, { loadouts: { [unit.id]: { awareness: rank, statsMode: 'equipped', baseStats } } });
    assert.equal(engine.actor.attack, 4927);
    assert.equal(engine.actor.maxHp, 8634);
    assert.equal(engine.actor.defense, 1494);
    assert.equal(engine.actor.crit, .542);
  }
  assert.deepEqual(baseStats, { attack: 4927, maxHp: 8634, defense: 1494, critRate: 54.2, critMult: 235.5, maxSp: 100 });
});

test('built-in kits without progression data never acquire fabricated bonuses', () => {
  for (const unit of [...roster, navigator]) {
    assert.equal(awarenessCoverage(unit).hasSourcedStats, false);
    assert.deepEqual(awarenessStatDefaults(unit, 0), awarenessStatDefaults(unit, 6));
  }
});

test('J&C A6 abilities and the derived Wonder bonus are not granted to A0', () => {
  const jc = definition('j-c');
  const a0 = create(jc, 0, { teamIds: [jc.id, 'wonder'] });
  const a6 = create(jc, 6, { teamIds: [jc.id, 'wonder'] });
  assert.equal(a0.state.party[0].trueDesireStacks, 0);
  assert.equal(a6.state.party[0].trueDesireStacks, 1);
  assert.equal(a0.state.mechanicsLimitations.some(message => message.includes('J&C A6 grants Wonder')), false);
  assert.equal(a6.state.mechanicsLimitations.some(message => message.includes('J&C A6 grants Wonder')), true);
});

test('Berry, Wavecatcher and Akihiko rank-gated starting resources follow the profile', () => {
  assert.equal(create(definition('berry'), 0).actor.chainsOfLove, 0);
  assert.equal(create(definition('berry'), 2).actor.chainsOfLove, 1);
  assert.equal(create(definition('puppet-wavecatcher'), 0).actor.surfActive, false);
  assert.equal(create(definition('puppet-wavecatcher'), 6).actor.surfActive, true);
  assert.equal(create(definition('akihiko'), 0).actor.gritMax, 3);
  assert.equal(create(definition('akihiko'), 6).actor.gritMax, 4);
});

test('independent party and navigator selections survive result reporting', () => {
  const units = ['j-c', 'marian-beachflower', 'berry'].map(definition);
  const miku = navigators.find(unit => unit.slug === 'miku');
  const loadouts = Object.fromEntries(units.map((unit, index) => [unit.id, { awareness: index }]));
  loadouts.wonder = { awareness: 4 };
  loadouts[miku.id] = { awareness: 5 };
  const engine = new BattleEngine({ seed: 42, teamIds: ['wonder', ...units.map(unit => unit.id)],
    characterDefinitions: units, navigatorDefinition: miku, loadouts });
  assert.deepEqual(engine.state.party.map(unit => unit.awareness), [4, 0, 1, 2]);
  assert.equal(engine.state.navigator.awareness, 5);
  engine.finish('timeout');
  assert.deepEqual(engine.state.result.awarenessProfiles, { wonder: 4, [units[0].id]: 0,
    [units[1].id]: 1, [units[2].id]: 2, [miku.id]: 5 });
});

test('a running engine retains its rank snapshot when external loadouts are edited', () => {
  const unit = definition('berry');
  const loadouts = { [unit.id]: { awareness: 0 } };
  const engine = create(unit, 0, { loadouts });
  loadouts[unit.id].awareness = 6;
  assert.equal(engine.config.loadouts[unit.id].awareness, 0);
  engine.reset();
  assert.equal(engine.actor.awareness, 0);
});

test('rank changes and repeated simulations do not mutate source character definitions', () => {
  const before = JSON.stringify([roster, lufelCatalog.characters, navigator]);
  const unit = definition('bui-cosmic');
  const config = { seed: 123, characterDefinitions: [unit], teamIds: [unit.id, 'wonder'], loadouts: { [unit.id]: { awareness: 0 } } };
  const first = simulate(config), second = simulate(config);
  assert.equal(first.result.totalDamage, second.result.totalDamage);
  assert.deepEqual(first.result.awarenessProfiles, second.result.awarenessProfiles);
  assert.equal(JSON.stringify([roster, lufelCatalog.characters, navigator]), before);
});


test('stored-build migration preserves explicit stats even when an older preset is upgraded', () => {
  const unit = definition('berry');
  const prior = { awareness: 0, baseStats: { attack: 6543, maxHp: 12345 } };
  const merged = migrateAwarenessLoadout(unit, { awareness: 6 }, prior,
    { ...prior, statsPresetId: 'new-preset', baseStats: { attack: 4927, maxHp: 8634, maxSp: 100 } });
  assert.equal(merged.awareness, 0);
  assert.deepEqual(merged.baseStats, { attack: 6543, maxHp: 12345, maxSp: 100 });
  assert.equal(merged.statsPresetId, 'new-preset');
});
