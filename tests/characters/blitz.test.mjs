import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../../src/engine.js';
import { adaptRegisteredCharacter } from '../../src/characters/registry.js';
import { lufelCatalog } from '../../src/generated/lufel-catalog.js';
import { characterMechanics } from '../../src/characters/blitz-mechanics.js';

function engine(options = {}) {
  const enemy = { id: 'boss', name: 'Boss', alive: true, hp: 1e9, downMax: 6, downPoints: 5, downed: false, debuffs: [] };
  const blitz = { id: 'blitz', slug: 'blitz', hp: 100, speed: 100, awareness: options.awareness ?? 2, buffs: [] };
  const state = { party: [blitz], boss: enemy, mechanicsLimitations: [], navigator: {} };
  return { config: { characterOptions: { blitz: options } }, state, enemies: [enemy],
    applyUnitBuff(unit, effect) { const old = unit.buffs.find(x => x.id === effect.id); old ? Object.assign(old, effect) : unit.buffs.push(effect); return effect; },
    applyEnemyStatus(target, key, effect) { const old = target[key].find(x => x.id === effect.id); old ? Object.assign(old, effect) : target[key].push(effect); return effect; },
    queueDownActions() {} };
}

test('Blitz S3 reduces Down points, inflicts Detention, and triggers A1/A2 on a knockdown', () => {
  const e = engine(); const u = e.state.party[0]; characterMechanics.initialize(e, u);
  u.blitz.lightningLegsAvailable = true;
  const skill = characterMechanics.beforeSkill(e, u, { id: 's3', slot: 'S3', element: 'electric' }, 'boss', 'character_skill');
  const packet = { actor: u, skill: characterMechanics.beforeDamage(e, u, u, skill, e.state.boss, 'character_skill'), target: e.state.boss, actualDamage: 1, sourceType: 'character_skill' };
  characterMechanics.onDamage(e, u, packet);
  assert.equal(e.state.boss.downed, true); assert.equal(e.state.boss.downMax, 5);
  assert.ok(e.state.boss.debuffs.some(effect => effect.blitzDetention));
  assert.equal(u.buffs.find(effect => effect.id === 'blitz_a2_party_attack').value, .1);
});

test('Blitz S1 creates the reviewed speed-scaled Hard Knocks statuses', () => {
  const e = engine({ awareness: 0 }); const u = e.state.party[0]; u.speed = 100; characterMechanics.initialize(e, u);
  const skill = characterMechanics.beforeSkill(e, u, { id: 's1', slot: 'S1' }, 'boss', 'character_skill');
  characterMechanics.afterSkill(e, u, skill, 'boss', 'character_skill');
  assert.equal(u.blitz.lightningLegsAvailable, true);
  assert.equal(e.state.boss.debuffs.find(effect => effect.id === 'blitz_hard_knocks_blitz').value, .336);
});

test('Blitz S1 and S2 share Hard Knocks without replacing an active cast from the other skill', () => {
  const e = engine({ awareness: 0 }); const u = e.state.party[0]; characterMechanics.initialize(e, u);
  const cast = slot => characterMechanics.afterSkill(e, u,
    characterMechanics.beforeSkill(e, u, { id: slot.toLowerCase(), slot }, 'boss', 'character_skill'),
    'boss', 'character_skill');
  cast('S1');
  const first = e.state.boss.debuffs.map(effect => ({ id: effect.id, value: effect.value, duration: effect.duration }));
  u.speed = 140;
  cast('S2');
  assert.deepEqual(e.state.boss.debuffs.map(effect => ({ id: effect.id, value: effect.value, duration: effect.duration })), first);
  cast('S1');
  assert.ok(e.state.boss.debuffs.find(effect => effect.id === 'blitz_hard_knocks_blitz').value > first[0].value);
  e.state.boss.debuffs.length = 0;
  cast('S2');
  const second = e.state.boss.debuffs.map(effect => ({ id: effect.id, value: effect.value, duration: effect.duration }));
  cast('S1');
  assert.deepEqual(e.state.boss.debuffs.map(effect => ({ id: effect.id, value: effect.value, duration: effect.duration })), second);
});

test('Blitz S2 and S3 share Detention without changing its first active value', () => {
  const e = engine({ awareness: 0 }); const u = e.state.party[0]; characterMechanics.initialize(e, u);
  u.blitz.lightningLegsTurns = 1;
  const hit = slot => characterMechanics.onDamage(e, u, {
    actor: u, target: e.state.boss, actualDamage: 1, sourceType: 'character_skill',
    skill: { slot, blitzLightningLegs: slot === 'S2', blitzWasDown: false }
  });
  hit('S2');
  const first = { ...e.state.boss.debuffs.find(effect => effect.blitzDetention) };
  u.speed = 140;
  hit('S3');
  const current = e.state.boss.debuffs.find(effect => effect.blitzDetention);
  assert.equal(current.value, first.value);
  assert.equal(current.duration, first.duration);
  assert.equal(current.blitzSkillSlot, 'S2');
  e.state.boss.debuffs.length = 0;
  hit('S3');
  assert.ok(e.state.boss.debuffs.find(effect => effect.blitzDetention).value > first.value);
});

test('Blitz base A0 applies after S3 damage at higher awareness too', () => {
  const e = engine({ awareness: 6 }); const u = e.state.party[0]; characterMechanics.initialize(e, u);
  characterMechanics.afterSkill(e, u, { characterPrepared: 'blitz', slot: 'S3' }, 'boss', 'character_skill', { packets: [{ actualDamage: 1 }] });
  assert.equal(u.buffs.find(effect => effect.id === 'blitz_hard_knocks_a0').value, .1);
});

function registeredEngine(downPoints, downed = false) {
  const raw = structuredClone(lufelCatalog.characters.find(unit => unit.slug === 'blitz'));
  const definition = adaptRegisteredCharacter(raw);
  const boss = { id: 'blitz-hook-boss', name: 'Blitz Hook Boss', defense: 385, maxHp: 1e12, finiteHp: false,
    scoreAttack: true, weakness: 'electric', turnLimit: 8, actionScale: 0, phases: [{ threshold: 1, defense: 385 }], summons: [], downMax: 6 };
  const e = new BattleEngine({ bossDefinition: boss, characterDefinitions: [definition], teamIds: [definition.id], seed: 1,
    characterOptions: { blitz: { sourceTier: 3 } }, loadouts: { [definition.id]: { awareness: 2, baseStats: { maxHp: 100000, maxSp: 1000, attack: 1000 } } } });
  e.random = () => .5; e.state.boss.downPoints = downPoints; e.state.boss.downed = downed;
  return e;
}

test('registered Blitz S2/S3 replace, rather than add to, normal weakness Down reduction', () => {
  const s2Engine = registeredEngine(2); const s2 = s2Engine.actor.skills.find(skill => skill.slot === 'S2');
  s2Engine.resolveSkill(s2Engine.actor, s2, s2Engine.state.boss.id, 'character_skill');
  assert.equal(s2Engine.state.boss.downPoints, 1, 'S2 applied its sourced one point exactly once');
  const s3Engine = registeredEngine(6); s3Engine.actor.blitz.lightningLegsAvailable = true;
  const s3 = s3Engine.actor.skills.find(skill => skill.slot === 'S3');
  s3Engine.resolveSkill(s3Engine.actor, s3, s3Engine.state.boss.id, 'character_skill');
  assert.equal(s3Engine.state.boss.downPoints, 1, 'S3 applied its sourced five points exactly once');
});

test('registered Blitz retains S1 Hard Knocks through a later S2 cast', () => {
  const e = registeredEngine(6);
  const s1 = e.actor.skills.find(skill => skill.slot === 'S1');
  const s2 = e.actor.skills.find(skill => skill.slot === 'S2');
  e.resolveSkill(e.actor, s1, e.state.boss.id, 'character_skill');
  const before = e.state.boss.debuffs.filter(effect => effect.id.startsWith('blitz_hard_knocks_'))
    .map(effect => ({ id: effect.id, value: effect.value, duration: effect.duration }));
  e.resolveSkill(e.actor, s2, e.state.boss.id, 'character_skill');
  assert.deepEqual(e.state.boss.debuffs.filter(effect => effect.id.startsWith('blitz_hard_knocks_'))
    .map(effect => ({ id: effect.id, value: effect.value, duration: effect.duration })), before);
});

test('registered Blitz does not re-trigger knockdown effects on an already Down target', () => {
  const e = registeredEngine(0, true); e.actor.blitz.lightningLegsAvailable = true;
  const s3 = e.actor.skills.find(skill => skill.slot === 'S3'); e.resolveSkill(e.actor, s3, e.state.boss.id, 'character_skill');
  assert.equal(e.state.boss.downMax, 6); assert.equal(e.actor.blitz.a2Knockdowns, 0);
});
