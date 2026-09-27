import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine, RECORDED_MECHANICS_PROFILE } from '../src/engine.js';
import { characterModules, adaptRegisteredCharacter } from '../src/characters/registry.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';

test('character hooks receive real counted boundaries and do not run in recorded replays', () => {
  const events = [];
  const module = { research: { slug: 'hook-fixture', limitations: ['Test boundary.'] }, mechanics: {
    initialize: () => events.push('initialize'),
    onTurnStart: () => events.push('turnStart'),
    beforeSkill: (engine, actor, skill) => { events.push('beforeSkill'); return { ...skill, power: 0 }; },
    afterSkill: () => { events.push('afterSkill'); },
    onActionEnd: () => events.push('actionEnd'),
    onAllyActionEnd: () => events.push('allyActionEnd'),
    onTurnEnd: () => events.push('turnEnd')
  } };
  characterModules.push(module);
  try {
    const definition = { id: 'hook-fixture', slug: 'hook-fixture', name: 'Fixture', codename: 'Fixture',
      maxHp: 100000, maxSp: 100, attack: 10, crit: 0, actionLimit: 2,
      skills: [{ id: 'hook-skill', name: 'Hook Skill', slot: 'S1', power: 1, cost: 0, element: 'physical', target: 'boss' }] };
    const config = { characterDefinitions: [definition], teamIds: [definition.id] };
    const engine = new BattleEngine(config);
    assert.deepEqual(events, ['initialize', 'turnStart']);
    engine.resolveSkill(engine.actor, definition.skills[0], engine.state.boss.id);
    assert.equal(engine.state.totalDamage, 0);
    assert.deepEqual(events.slice(2), ['beforeSkill', 'afterSkill']);
    events.length = 0;
    engine.step({ type: 'guard', skillId: 'guard' });
    assert.deepEqual(events, ['actionEnd', 'allyActionEnd']);
    events.length = 0;
    engine.step({ type: 'guard', skillId: 'guard' });
    assert.deepEqual(events, ['actionEnd', 'allyActionEnd', 'turnEnd', 'turnStart']);
    events.length = 0;
    const recorded = new BattleEngine({ ...config, mechanicsProfile: RECORDED_MECHANICS_PROFILE });
    recorded.step({ type: 'guard', skillId: 'guard' });
    assert.deepEqual(events, []);
  } finally {
    characterModules.splice(characterModules.indexOf(module), 1);
  }
});

test('registered source kits complete seeded real actions with identical fast/full results', () => {
  const boss = { id: 'module-smoke-boss', name: 'Module Boss', defense: 385, maxHp: 1e12, finiteHp: false,
    scoreAttack: true, weakness: 'none', turnLimit: 20, actionScale: 0,
    phases: [{ threshold: 1, defense: 385 }], summons: [] };
  for (const module of characterModules.filter(item => item.mechanics && !['ange', 'okyann'].includes(item.research.slug))) {
    const raw = module.definition || lufelCatalog.characters.find(unit => unit.slug === module.research.slug);
    if (!raw) continue;
    const definition = adaptRegisteredCharacter(raw);
    const run = fastMode => {
      const ally = { id: 'module-smoke-ally', name: 'Ally', codename: 'Ally', maxHp: 100000, maxSp: 100, attack: 1000, skills: [] };
      const engine = new BattleEngine({ bossDefinition: boss, characterDefinitions: [definition, ally], teamIds: [definition.id, ally.id],
        fastMode, seed: 42, loadouts: { [definition.id]: { awareness: 0, baseStats: { maxHp: 100000, maxSp: 1000, attack: 1000 } } } });
      for (let step = 0; step < 6 && engine.state.phase === 'battle'; step++) {
        const skills = engine.getAvailableActions().filter(action => action.enabled && action.type === 'skill');
        const action = skills[step % Math.max(1, skills.length)] || { type: 'guard', skillId: 'guard' };
        engine.step({ ...action, targetId: action.target === 'ally' ? ally.id : action.target === 'self' ? engine.actor.id : engine.state.boss.id });
      }
      assert.ok(Number.isFinite(engine.state.totalDamage), `${definition.slug}: finite damage`);
      assert.equal(engine.state.totalDamage, engine.state.party.reduce((sum, unit) => sum + unit.damageDone, 0), `${definition.slug}: damage accounting`);
      return { damage: engine.state.totalDamage, party: engine.state.party, action: engine.state.actionNumber };
    };
    assert.deepEqual(run(true), run(false), `${definition.slug}: fast/full parity`);
  }
});

test('a module extra action preserves owner timing and returns to the next actor exactly once', () => {
  const contexts = [];
  const module = { research: { slug: 'extra-fixture', limitations: [] }, mechanics: {
    initialize: (engine, owner) => { owner.extraAvailable = true; },
    getExtraActionRequest: (engine, owner) => owner.extraAvailable ? { reason: 'test-extra' } : null,
    onExtraActionStart: (engine, owner) => { owner.extraAvailable = false; return true; },
    onActionEnd: (engine, owner, context) => contexts.push(context.isExtraAction)
  } };
  characterModules.push(module);
  try {
    const units = ['extra-fixture', 'next-fixture'].map(id => ({ id, name: id, codename: id,
      maxHp: 100000, maxSp: 100, attack: 100, actionLimit: 1, skills: [] }));
    const engine = new BattleEngine({ characterDefinitions: units, teamIds: units.map(unit => unit.id) });
    const owner = engine.actor;
    owner.sp = 40;
    owner.highlightCooldowns.HL = 3;
    engine.step({ type: 'guard', skillId: 'guard' });
    assert.equal(engine.actor.id, owner.id);
    assert.equal(owner.characterTurnsStarted, 1);
    assert.equal(owner.highlightCooldowns.HL, 2);
    assert.equal(owner.sp, 52, 'guard restores its own 12 SP, without another turn-start recovery');
    engine.step({ type: 'guard', skillId: 'guard' });
    assert.equal(engine.actor.id, 'next-fixture');
    assert.equal(owner.highlightCooldowns.HL, 2);
    assert.equal(owner.characterTurnsStarted, 1);
    assert.deepEqual(contexts, [false, true]);
    assert.equal(engine.state.characterExtraAction, null);
  } finally {
    characterModules.splice(characterModules.indexOf(module), 1);
  }
});

test('damage hooks run per target, keep typed defense changes local and report real applied damage', () => {
  const packets = [];
  const module = { research: { slug: 'damage-hook-fixture', limitations: [] }, mechanics: {
    beforeDamage: (engine, owner, actor, skill, target) => target.id === 'hook-add'
      ? { ...skill, temporaryDefenseDown: .3 } : skill,
    onDamage: (engine, owner, packet) => packets.push(packet)
  } };
  characterModules.push(module);
  try {
    const actor = { id: 'damage-hook-fixture', name: 'Damage Fixture', codename: 'Fixture', maxHp: 10000,
      maxSp: 100, attack: 100, crit: 0, skills: [] };
    const boss = { id: 'hook-boss', name: 'Hook Boss', defense: 385, maxHp: 1e9, finiteHp: false,
      scoreAttack: true, weakness: 'ice', turnLimit: 8, phases: [{ threshold: 1, defense: 385 }],
      summons: [{ id: 'hook-add', name: 'Hook Add', defense: 385, maxHp: 1e9, finiteHp: false, scoreAttack: true, weakness: 'ice', downMax: 6 }] };
    const engine = new BattleEngine({ characterDefinitions: [actor], teamIds: [actor.id], bossDefinition: boss });
    engine.random = () => .5;
    const skill = { id: 'hook-aoe', name: 'Area hit', power: 1, element: 'fire', target: 'all_enemies' };
    engine.calculateDamage(engine.actor, skill, engine.state.boss, 'character_skill');
    assert.equal(packets.length, 0, 'preview cannot emit applied-damage hooks');
    const damage = engine.resolveSkill(engine.actor, skill, engine.state.boss.id);
    assert.equal(packets.length, 2);
    assert.ok(packets[1].actualDamage > packets[0].actualDamage);
    assert.equal(packets.reduce((sum, packet) => sum + packet.actualDamage, 0), damage);
    assert.equal(engine.state.totalDamage, damage);
    assert.equal(skill.temporaryDefenseDown, undefined);
    assert.equal(engine.state.boss.debuffs.length, 0);
    assert.equal(engine.state.boss.summons[0].debuffs.length, 0);
  } finally {
    characterModules.splice(characterModules.indexOf(module), 1);
  }
});
