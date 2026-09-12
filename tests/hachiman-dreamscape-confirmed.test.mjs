import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine, CURRENT_MECHANICS_PROFILE } from '../src/engine.js';

const clone = value => structuredClone(value);

const hachiman = {
  id: 'hachiman', name: 'Hachiman', maxHp: 9_999_999, finiteHp: false,
  defense: 0, weakness: 'none', resistance: 'none', turnLimit: 8,
  defaultMode: 'multidimensional', scoreModel: 'multidimensional_dreamscape_observed',
  finalDamageTakenMultiplier: 1.2, finalDamageDealtMultiplier: 0.4,
  phases: [{ threshold: 1, name: 'Score', defense: 0 }],
  summons: [{ id: 'idol', name: 'Idol', maxHp: 9_999_999, defense: 0, weakness: 'none', resistance: 'none', downMax: 1 }]
};

const unit = (id, role = 'Wildcard') => ({
  id, name: id, codename: id, role, element: 'almighty', maxHp: 10_000,
  maxSp: 100, attack: 1_000, defense: 500, speed: 100, crit: 0,
  critMult: 2, skills: [], maxAmmo: 8
});

function fixture(roles = ['Wildcard'], extra = {}) {
  const definitions = roles.map((role, index) => unit(`fixture-${index}`, role));
  return new BattleEngine({
    mechanicsProfile: CURRENT_MECHANICS_PROFILE, seed: 818, bossDefinition: clone(hachiman),
    modeId: 'multidimensional', teamIds: definitions.map(member => member.id),
    characterDefinitions: definitions, ...extra
  });
}

const skill = { id: 'fixture-skill', name: 'Fixture Skill', element: 'almighty', power: 1, target: 'boss', canCrit: true };

function fixedDamage(rate, sourceType = 'character_skill') {
  const engine = fixture();
  engine.actor.crit = rate;
  engine.random = () => 0.99;
  return engine.calculateDamage(engine.actor, skill, engine.state.boss, sourceType);
}

test('Hachiman Dreamscape Skill and Resonance use the sourced crit-rate final-damage bonus without changing crit rolls', () => {
  const zero = fixedDamage(0);
  const half = fixedDamage(0.5);
  const full = fixedDamage(1);
  const resonance = fixedDamage(0.5, 'resonance_follow_up');
  assert.equal(half.critical, false, 'the retained 95% roll cap can still miss at a 0.99 roll');
  assert.equal(full.critical, false, 'the final-damage formula does not force a critical proc');
  assert.ok(Math.abs(half.amount / zero.amount - 1.5) < 0.002);
  assert.ok(Math.abs(full.amount / zero.amount - 2) < 0.002);
  assert.equal(resonance.amount, half.amount);

  const jc = unit('jc-fixture', 'Sweeper');
  jc.slug = 'j-c';
  jc.awareness = 6;
  const jcEngine = new BattleEngine({
    mechanicsProfile: CURRENT_MECHANICS_PROFILE, bossDefinition: clone(hachiman), modeId: 'multidimensional',
    teamIds: [jc.id], characterDefinitions: [jc]
  });
  jcEngine.actor.crit = 0.5;
  jcEngine.random = () => 0.99;
  const jcAutomatic = jcEngine.calculateDamage(jcEngine.actor, skill, jcEngine.state.boss, 'awareness_follow_up');
  const jcSkillEngine = new BattleEngine({
    mechanicsProfile: CURRENT_MECHANICS_PROFILE, bossDefinition: clone(hachiman), modeId: 'multidimensional',
    teamIds: [jc.id], characterDefinitions: [jc]
  });
  jcSkillEngine.actor.crit = 0.5;
  jcSkillEngine.random = () => 0.99;
  assert.equal(jcAutomatic.amount, jcSkillEngine.calculateDamage(jcSkillEngine.actor, skill, jcSkillEngine.state.boss, 'character_skill').amount);

  const skillEngine = fixture();
  const gunEngine = fixture();
  skillEngine.actor.crit = gunEngine.actor.crit = 0.5;
  const skillResult = skillEngine.calculateDamage(skillEngine.actor, skill, skillEngine.state.boss, 'character_skill');
  const gunResult = gunEngine.calculateDamage(gunEngine.actor, skill, gunEngine.state.boss, 'gun');
  assert.equal(skillResult.critical, gunResult.critical);
  assert.equal(skillEngine.state.rng, gunEngine.state.rng, 'the formula preserves the two seeded random draws');
});

test('Hachiman Dreamscape leaves Gun and basic attack on ordinary critical damage', () => {
  const gunZero = fixedDamage(0, 'gun');
  const gunHalf = fixedDamage(0.5, 'gun');
  const basicZero = fixedDamage(0, 'basic_attack');
  const basicHalf = fixedDamage(0.5, 'basic_attack');
  assert.equal(gunHalf.amount, gunZero.amount);
  assert.equal(basicHalf.amount, basicZero.amount);
  assert.equal(gunHalf.amount, basicHalf.amount);
});

test('Dreamscape retains a 100% stored crit rate for its Skill formula', () => {
  const member = unit('crit-cap');
  member.crit = 0.99;
  const engine = new BattleEngine({
    mechanicsProfile: CURRENT_MECHANICS_PROFILE, bossDefinition: clone(hachiman), modeId: 'multidimensional',
    teamIds: [member.id], characterDefinitions: [member],
    loadouts: { [member.id]: { revelationCombat: { critRate: 0.2 } } }
  });
  assert.equal(engine.actor.crit, 1);
});

test('Dreamscape applies the confirmed role, Curse, and continuous-damage modifiers to every foe', () => {
  const withoutRole = fixture(['Wildcard']);
  const withMedic = fixture(['Medic']);
  const noRoleBoss = withoutRole.state.boss;
  const noRoleIdol = withoutRole.state.boss.summons[0];
  const medicBoss = withMedic.state.boss;
  const medicIdol = withMedic.state.boss.summons[0];

  assert.equal(withoutRole.statusMultiplier(withoutRole.actor, 'almighty', noRoleBoss, 'character_skill'), 1);
  assert.equal(withoutRole.statusMultiplier(withoutRole.actor, 'almighty', noRoleIdol, 'character_skill'), 1);
  assert.equal(withMedic.statusMultiplier(withMedic.actor, 'almighty', medicBoss, 'character_skill'), 1.2);
  assert.equal(withMedic.statusMultiplier(withMedic.actor, 'almighty', medicIdol, 'character_skill'), 1.2);
  assert.ok(Math.abs(withoutRole.statusMultiplier(withoutRole.actor, 'curse', noRoleBoss, 'dot') - 1.56) < 1e-12);
  assert.ok(Math.abs(withMedic.statusMultiplier(withMedic.actor, 'curse', medicBoss, 'dot') - 1.872) < 1e-12);
  assert.equal(withoutRole.dreamscapeDamageDealtMultiplier(noRoleBoss), 1.6);
  assert.equal(withoutRole.dreamscapeDamageDealtMultiplier(noRoleIdol), 1.6);
  assert.equal(withMedic.dreamscapeDamageDealtMultiplier(medicBoss), 0.4);
  assert.equal(withMedic.dreamscapeDamageDealtMultiplier(medicIdol), 0.4);
});

test('Dreamscape adds its continuous-damage bonus once to Berry’s confirmed Chain conversion', () => {
  const berry = unit('berry-fixture', 'Assassin');
  berry.slug = 'berry';
  berry.awareness = 6;
  const engine = new BattleEngine({
    mechanicsProfile: CURRENT_MECHANICS_PROFILE, bossDefinition: clone(hachiman), modeId: 'multidimensional',
    teamIds: [berry.id], characterDefinitions: [berry]
  });
  engine.actor.chainsOfLove = 2;
  engine.actor.buffs = [{ id: 'fixture-dot', stat: 'dotDamage', value: 0.15, duration: 99 }];
  assert.ok(Math.abs(engine.statusMultiplier(engine.actor, 'almighty', engine.state.boss, 'character_skill') - 1.45) < 1e-12);
});

test('Dreamscape excludes the preset Daisoujou idols from preview score while retaining combat damage', () => {
  const engine = new BattleEngine({
    mechanicsProfile: CURRENT_MECHANICS_PROFILE, bossId: 'hachiman', modeId: 'multidimensional', teamIds: ['wonder']
  });
  const daisoujou = engine.state.boss.summons.filter(target => target.species === 'daisoujou');
  assert.equal(daisoujou.length, 4);
  engine.actor.crit = 0;
  engine.random = () => 0.5;
  const beforeDaisoujou = daisoujou.map(target => target.hp);
  engine.resolveSkill(engine.actor, { ...skill, id: 'all-foes', target: 'all_enemies' }, 'all_enemies', 'character_skill', { ignoreCost: true });
  const daisoujouDamage = daisoujou.reduce((sum, target, index) => sum + beforeDaisoujou[index] - target.hp, 0);
  assert.ok(daisoujouDamage > 0);
  assert.equal(engine.state.scoreBreakdown.damagePreview, engine.state.totalDamage - daisoujouDamage);
  assert.ok(engine.state.scoreBreakdown.damagePreview > 0, 'boss damage remains score eligible');
});
