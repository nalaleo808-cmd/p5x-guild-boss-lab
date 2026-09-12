import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../src/engine.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';

const character = slug => structuredClone(lufelCatalog.characters.find(unit => unit.slug === slug));
const fixture = slugs => {
  const definitions = slugs.map(character);
  return new BattleEngine({ seed: 91, bossId: 'hachiman', teamIds: definitions.map(unit => unit.id), characterDefinitions: definitions });
};

test('RIN Orange Blossom Blade is a free stance that replaces Attack with Yanhua Slash once', () => {
  const engine = fixture(['rin-firecracker']);
  const rin = engine.actor;
  const stance = engine.getAvailableActions().find(action => action.type === 'rin_stance');
  assert.ok(stance?.enabled);
  const before = engine.state.actionNumber;
  const result = engine.step({ type: stance.type, skillId: stance.skillId, targetId: engine.state.boss.id });
  assert.equal(result.consumedAction, false);
  assert.equal(engine.state.actionNumber, before);
  assert.equal(engine.actor.id, rin.id);
  assert.equal(rin.rinFlamingSwordDance, true);
  assert.equal(rin.skillCooldowns[stance.skillId], 1);

  const yanhua = engine.getAvailableActions().find(action => action.type === 'rin_yanhua');
  assert.ok(yanhua?.enabled);
  engine.step({ type: yanhua.type, skillId: yanhua.skillId, targetId: engine.state.boss.id });
  assert.equal(rin.rinFlamingSwordDance, false);
  assert.ok(engine.state.mechanicsLimitations.some(text => text.startsWith('Technical is not resolved:')));
});

test('RIN records sourced Year-End Flames stacks but omits ticks whose timing is not evidenced', () => {
  const engine = fixture(['rin-firecracker']);
  const rin = engine.actor;
  engine.random = () => 0;
  const finale = engine.skillsFor(rin).find(skill => skill.name === 'Firework Finale');
  engine.resolveSkill(rin, finale, engine.state.boss.id);
  const flames = engine.state.boss.debuffs.find(effect => effect.id === 'rin_year_end_flames');
  assert.equal(flames.stacks, 1);
  assert.equal(flames.powerPerStack, 0.738);
  assert.equal(flames.damageOmitted, true);
  assert.ok(engine.state.boss.debuffs.some(effect => effect.id === 'rin_burn'));
  assert.ok(engine.state.mechanicsLimitations.some(text => text.startsWith('DoT is not resolved:')));
});

test('MATOI gates Guidance with Extinguish and converts a recorded Burn state to Scald', () => {
  const engine = fixture(['rin-firecracker', 'matoi']);
  const rin = engine.actor;
  const matoi = engine.state.party[1];
  engine.random = () => 0;
  const finale = engine.skillsFor(rin).find(skill => skill.name === 'Firework Finale');
  engine.resolveSkill(rin, finale, engine.state.boss.id);
  assert.ok(engine.state.boss.debuffs.some(effect => effect.id === 'rin_burn'));

  const torrent = engine.skillsFor(matoi).find(skill => skill.name === 'Sub-Zero Torrent');
  engine.resolveSkill(matoi, torrent, engine.state.boss.id);
  assert.equal(matoi.extinguishStacks, 1);
  assert.equal(engine.state.boss.debuffs.some(effect => effect.id === 'rin_burn'), false);
  assert.ok(engine.state.boss.debuffs.some(effect => effect.id === 'matoi_scald'));
  assert.ok(engine.state.boss.debuffs.some(effect => effect.id === 'matoi_torrent_def'));

  const guidance = engine.skillsFor(matoi).find(skill => skill.name === 'Extinguishing Guidance');
  assert.equal(guidance.matoiExtinguishCost, 2);
  engine.state.actorIndex = 1;
  assert.equal(engine.getAvailableActions().find(action => action.skillId === guidance.id).enabled, false);
  engine.resolveSkill(matoi, torrent, engine.state.boss.id);
  assert.equal(matoi.extinguishStacks, 2);
  assert.equal(engine.getAvailableActions().find(action => action.skillId === guidance.id).enabled, true);
});

test('MATOI Technical branches report missing evidence instead of creating a result tier', () => {
  const engine = fixture(['matoi']);
  const matoi = engine.actor;
  engine.random = () => 0;
  const torrent = engine.skillsFor(matoi).find(skill => skill.name === 'Sub-Zero Torrent');
  const prison = engine.skillsFor(matoi).find(skill => skill.name === 'Freezing Prison');
  engine.resolveSkill(matoi, torrent, engine.state.boss.id);
  assert.ok(engine.state.boss.debuffs.some(effect => effect.id === 'matoi_freeze'));
  engine.resolveSkill(matoi, prison, engine.state.boss.id);
  assert.equal(engine.state.boss.debuffs.some(effect => effect.id === 'matoi_icebound'), false);
  assert.ok(engine.state.mechanicsLimitations.some(text => text.startsWith('Technical is not resolved:')));
});
