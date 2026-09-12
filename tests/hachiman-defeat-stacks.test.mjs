import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine, CURRENT_MECHANICS_PROFILE } from '../src/engine.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';

const berryDefinition = () => structuredClone(lufelCatalog.characters.find(unit => unit.slug === 'berry'));

function fixture() {
  const berry = berryDefinition();
  return new BattleEngine({
    seed: 505, bossId: 'hachiman', modeId: 'multidimensional', mechanicsProfile: CURRENT_MECHANICS_PROFILE,
    teamIds: [berry.id], characterDefinitions: [berry]
  });
}

function nearlyEqual(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 1e-12, `${message}: expected ${expected}, got ${actual}`);
}

test('each live Daisoujou defeat adds one aggregate 10% boss damage-taken stack through the cap', () => {
  const engine = fixture();
  const boss = engine.state.boss;
  const baseBossMultiplier = engine.statusMultiplier(engine.actor, 'almighty', boss, 'character_skill');
  const remainingIdol = boss.summons.at(-1);
  const baseMinionMultiplier = engine.statusMultiplier(engine.actor, 'almighty', remainingIdol, 'character_skill');

  for (const [index, idol] of boss.summons.entries()) {
    engine.defeatSummon(idol);
    const stacks = index + 1;
    const bonus = boss.debuffs.find(effect => effect.id === 'minion_break');
    assert.equal(boss.daisoujouDefeatStacks, stacks);
    assert.equal(bonus.stacks, stacks);
    nearlyEqual(bonus.value, stacks * 0.1, `stack ${stacks} stores the aggregate bonus`);
    nearlyEqual(
      engine.statusMultiplier(engine.actor, 'almighty', boss, 'character_skill') / baseBossMultiplier,
      1 + stacks * 0.1,
      `stack ${stacks} scales boss damage once`
    );
    if (remainingIdol.alive) {
      nearlyEqual(
        engine.statusMultiplier(engine.actor, 'almighty', remainingIdol, 'character_skill'),
        baseMinionMultiplier,
        'the boss-only bonus does not affect an idol'
      );
    }
  }

  engine.defeatSummon({ id: 'extra-idol', species: 'daisoujou', name: 'Extra Idol', alive: true, hp: 1, debuffs: [] });
  const bonus = boss.debuffs.find(effect => effect.id === 'minion_break');
  assert.equal(boss.daisoujouDefeatStacks, 4);
  assert.equal(bonus.value, 0.4);
  assert.equal(bonus.duration, null);
  assert.equal(bonus.durationKnown, false);
  assert.equal(engine.tickStatusList([bonus]).length, 1, 'unknown-duration stored stacks do not get an invented expiry');
  const limitation = engine.state.sharedCombat.limitations.find(item => item.system === 'hachiman_minion_break');
  assert.deepEqual(limitation.missing, ['stack_duration']);
});

test('Berry S1 applies the fourth defeat stack before its boss kill-reset recast', () => {
  const chain = fixture();
  chain.random = () => 0.5;
  chain.actor.crit = 0;
  for (const idol of chain.state.boss.summons) idol.hp = 1;
  const skill = chain.skillsFor().find(candidate => candidate.slot === 'S1');

  const result = chain.step({ type: 'skill', skillId: skill.id, targetId: chain.state.boss.summons[0].id });
  const stackEvents = result.events.filter(event => event.resource === 'daisoujouDefeatStacks');
  const bossDamageIndex = result.events.findIndex(event => event.type === 'damage' && event.targetId === chain.state.boss.id);

  assert.equal(stackEvents.length, 4);
  assert.equal(chain.state.boss.daisoujouDefeatStacks, 4);
  assert.ok(bossDamageIndex > result.events.indexOf(stackEvents.at(-1)), 'the fourth stack lands before the recursive boss cast');
  assert.equal(chain.state.boss.debuffs.find(effect => effect.id === 'minion_break').value, 0.4);
});
