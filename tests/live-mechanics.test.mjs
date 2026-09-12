import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine, CURRENT_MECHANICS_PROFILE, RECORDED_MECHANICS_PROFILE, simulate } from '../src/engine.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';

const character = slug => structuredClone(lufelCatalog.characters.find(unit => unit.slug === slug));
function fixture(slugs = ['j-c', 'marian-beachflower', 'berry'], extra = {}) {
  const definitions = slugs.map(character);
  const miku = character('miku');
  return new BattleEngine({ seed: 55, bossId: 'hachiman',
    teamIds: definitions.map(unit => unit.id), characterDefinitions: definitions,
    navigatorDefinition: miku, jcMaskPair: ['mischief', 'service'], ...extra });
}
function guard(engine) { return engine.step({ type: 'guard', skillId: 'guard' }); }
function reach(engine, slug) {
  let count = 0;
  while (engine.actor.slug !== slug && count++ < 15) guard(engine);
  assert.equal(engine.actor.slug, slug);
}
function cast(engine, slot, type = 'skill') {
  const action = engine.getAvailableActions().find(row => row.type === type && row.skill?.slot === slot);
  assert.ok(action?.enabled, `${type} ${slot} must be legal`);
  return engine.step({ type, skillId: action.skillId, targetId: engine.state.boss.id });
}

test('corrected mechanics are default and archived behavior requires a named profile', () => {
  const live = fixture();
  assert.equal(live.config.mechanicsProfile, CURRENT_MECHANICS_PROFILE);
  assert.equal(live.getObservation().mechanicsProfile, CURRENT_MECHANICS_PROFILE);
  assert.throws(() => fixture([], { mechanicsProfile: 'unknown' }), /profile/);
  const archived = fixture(['j-c'], { mechanicsProfile: RECORDED_MECHANICS_PROFILE });
  archived.setTrueDesire(true);
  archived.setTrueDesire(false);
  assert.equal(archived.actor.trueDesirePrimed, false);
});

test('J&C masks have independent Highlight clocks and same-owner-turn grace is explicit', () => {
  const engine = fixture();
  const jc = engine.actor;
  engine.state.sharedCombat.highlight = 100;
  const actionNumber = engine.state.actionNumber;
  engine.stepHighlight('highlight:j-c:mischief');
  assert.equal(engine.state.actionNumber, actionNumber);
  assert.deepEqual(jc.highlightCooldowns, { mischief: 4, service: 0 });
  engine.state.sharedCombat.highlight = 100;
  const options = engine.getHighlightActions().filter(row => row.actorId === jc.id);
  assert.equal(options.find(row => row.skill.jcHighlightMask === 'mischief').enabled, false);
  assert.equal(options.find(row => row.skill.jcHighlightMask === 'service').enabled, true);
  assert.throws(() => engine.stepHighlight('highlight:j-c:mischief'), /unavailable/);
  engine.stepHighlight('highlight:j-c:service');
  guard(engine);
  assert.deepEqual(jc.highlightCooldowns, { mischief: 4, service: 4 });
  reach(engine, 'j-c');
  assert.deepEqual(jc.highlightCooldowns, { mischief: 4, service: 4 });
  guard(engine);
  assert.deepEqual(jc.highlightCooldowns, { mischief: 3, service: 3 });
  assert.ok(engine.state.mechanicsLimitations.some(text => text.includes('grace')));
});

test('MIKU A1 resets every Highlight clock immediately and Concert owner actions decrement it', () => {
  const engine = fixture();
  const jc = engine.actor;
  const berry = engine.state.party.find(unit => unit.slug === 'berry');
  jc.highlightCooldowns = { mischief: 3, service: 2 };
  berry.highlightCooldowns.HL = 4;
  engine.state.navigator.tracks = ['Break', 'Critical', 'Expert'];
  const showstopper = engine.getNavigatorActions().find(row => row.name === 'Showstopper');
  engine.stepNavigator(showstopper.id);
  assert.deepEqual(jc.highlightCooldowns, { mischief: 0, service: 0 });
  assert.equal(berry.highlightCooldowns.HL, 0);
  jc.highlightCooldowns.mischief = 4;
  const number = engine.state.actionNumber;
  guard(engine);
  assert.equal(jc.highlightCooldowns.mischief, 3);
  assert.equal(engine.state.actionNumber, number);
  guard(engine);
  assert.equal(jc.highlightCooldowns.mischief, 3);
});

test('live J&C Alt stores an irreversible enhancement without spending the action until the next automatic S3', () => {
  const engine = fixture();
  const jc = engine.actor;
  const actionNumber = engine.state.actionNumber;
  assert.equal(engine.setTrueDesire(true).consumedAction, false);
  assert.equal(jc.trueDesireStacks, 0);
  assert.equal(engine.canToggleTrueDesire(), false);
  assert.equal(jc.trueDesirePrimed, true);
  assert.throws(() => engine.setTrueDesire(false), /canceled/);
  assert.equal(engine.state.actionNumber, actionNumber);
  cast(engine, 'S1');
  assert.equal(jc.trueDesirePrimed, true);
  reach(engine, 'j-c');
  cast(engine, 'S2');
  assert.equal(jc.trueDesirePrimed, false);
  assert.equal(jc.trueDesireStacks, 0);
});

test('Gentle Sea Breeze follows cast, next CD2, next CD1, ready including Concert turns', () => {
  const engine = fixture(['marian-beachflower', 'berry']);
  const marian = engine.actor;
  const breeze = engine.skillsFor().find(skill => skill.name === 'Gentle Sea Breeze');
  const ally = engine.state.party.find(unit => unit.id !== marian.id);
  const beforeBreeze = { actionNumber: engine.state.actionNumber, actorIndex: engine.state.actorIndex };
  const breezeResult = engine.step({ type: 'skill', skillId: breeze.id, targetId: ally.id });
  assert.equal(breezeResult.consumedAction, true);
  assert.equal(engine.state.actionNumber, beforeBreeze.actionNumber + 1);
  assert.notEqual(engine.state.actorIndex, beforeBreeze.actorIndex);
  reach(engine, 'marian-beachflower');
  assert.equal(marian.skillCooldowns[breeze.id], 2);
  guard(engine);
  reach(engine, 'marian-beachflower');
  assert.equal(marian.skillCooldowns[breeze.id], 1);
  guard(engine);
  reach(engine, 'marian-beachflower');
  assert.equal(marian.skillCooldowns[breeze.id], 0);
  const concert = fixture(['marian-beachflower', 'berry']);
  concert.state.navigator.tracks = ['Break', 'Critical', 'Expert'];
  concert.stepNavigator(concert.getNavigatorActions().find(row => row.name === 'Showstopper').id);
  const concertBreeze = concert.skillsFor().find(skill => skill.name === 'Gentle Sea Breeze');
  concert.step({ type: 'skill', skillId: concertBreeze.id, targetId: concert.actor.id });
  reach(concert, 'marian-beachflower');
  assert.equal(concert.actor.skillCooldowns[concertBreeze.id], 2);
});

test('medicine exposes observed bases, sourced A1 magnitude and A0/A6 durations without inventing 1.58', () => {
  for (const [id, base] of [['attack_tablet', 0.3], ['defender_tonic', 0.45], ['fighter_salve', 0.25], ['dot_up', 0.1]]) {
    const engine = fixture(['marian-beachflower']);
    const marian = engine.actor;
    marian.midsummerPrescription = 2;
    const action = engine.getMedicineActions().find(row => row.id === id);
    assert.equal(action.baseValue, base);
    assert.equal(action.baseDuration, 1);
    assert.equal(action.effectiveDuration, 3);
    assert.equal(action.effectiveValue, base * 1.2);
    const number = engine.state.actionNumber;
    const result = engine.stepMedicine(id, marian.id);
    const buff = marian.buffs.find(effect => effect.id === action.buff.id);
    assert.equal(buff.duration, 3);
    assert.equal(buff.value, base * 1.2);
    assert.equal(result.consumedAction, false);
    assert.equal(engine.state.actionNumber, number);
    assert.equal(engine.getMedicineActions().length, 0);
  }
});

test('A0 medicine grants one prescription and two turns while A6 grants two and three turns', () => {
  const marian = character('marian-beachflower');
  marian.awareness = 0;
  const engine = fixture(['marian-beachflower', 'berry'], { characterDefinitions: [marian, character('berry')] });
  const breeze = engine.skillsFor().find(skill => skill.name === 'Gentle Sea Breeze');
  engine.step({ type: 'skill', skillId: breeze.id, targetId: marian.id });
  reach(engine, 'marian-beachflower');
  assert.equal(engine.actor.midsummerPrescription, 1);
  const medicine = engine.getMedicineActions()[0];
  assert.equal(medicine.effectiveDuration, 2);
  assert.equal(medicine.effectiveValue, medicine.baseValue);
});

test('Berry S1 high-HP bonus is a conditional per-hit bucket term and creates no permanent damage buff', () => {
  const engine = fixture(['berry']);
  const berry = engine.actor;
  const target = engine.state.boss;
  const skill = engine.skillsFor().find(row => row.slot === 'S1');
  engine.random = () => 0.5;
  target.hp = target.maxHp;
  const highResult = engine.calculateDamage(berry, skill, target, 'character_skill');
  // An infinite-HP score target always counts as above 70% HP (confirmed in game on
  // 2026-09-06), so the low-HP case needs a finite target.
  const highOnInfiniteTarget = engine.calculateDamage(berry, skill, { ...target, hp: target.maxHp * 0.1 }, 'character_skill');
  assert.equal(highOnInfiniteTarget.damageFormula.bonuses.some(entry => entry.id === 'vorpal_butterfly_high_hp'), true);
  target.hp = target.maxHp * 0.7;
  const lowResult = engine.calculateDamage(berry, skill, { ...target, finiteHp: true, scoreAttack: false }, 'character_skill');
  // Hachiman path (2026-09-06): the sourced "+200% skill damage" clause adds
  // into the single damage bucket instead of tripling the skill power.
  const highBonus = highResult.damageFormula.bonuses.find(entry => entry.id === 'vorpal_butterfly_high_hp');
  assert.equal(highBonus?.value, 2);
  assert.equal(lowResult.damageFormula.bonuses.some(entry => entry.id === 'vorpal_butterfly_high_hp'), false);
  const lowBucket = lowResult.damageFormula.damageBonusMultiplier;
  assert.ok(Math.abs(highResult.amount / lowResult.amount - (lowBucket + 2) / lowBucket) < 0.01);
  assert.ok(highResult.amount > lowResult.amount);
  assert.equal(skill.buff, undefined);
  cast(engine, 'S1');
  assert.equal(berry.chainsOfLove, 2);
  assert.equal(engine.lovesickStacks(target, berry), 3);
  assert.equal(berry.buffs.some(effect => effect.id === 'damage_up'), false);
});

test('Berry S1 retriggers through living Hachiman minions after a minion defeat without a second turn or SP cost', () => {
  const engine = fixture(['berry', 'j-c']);
  const berry = engine.actor;
  const [first, second] = engine.state.boss.summons;
  first.hp = 1;
  second.hp = 1;
  const s1 = engine.skillsFor().find(skill => skill.slot === 'S1');
  const before = { sp: berry.sp, action: engine.state.actionNumber };

  const result = engine.step({ type: 'skill', skillId: s1.id, targetId: first.id });
  const hits = result.events.filter(event => event.type === 'damage' && ['character_skill', 'berry_repeat'].includes(event.sourceType));

  assert.deepEqual(hits.slice(0, 3).map(event => [event.sourceType, event.targetId]), [
    ['character_skill', first.id],
    ['berry_repeat', second.id],
    ['berry_repeat', 'idol_right_a']
  ]);
  assert.equal(first.alive, false);
  assert.equal(second.alive, false);
  assert.equal(berry.sp, before.sp - s1.cost);
  assert.equal(engine.state.actionNumber, before.action + 1);
});

test('live Berry S1 transfers five A1 Lovesick applications through Hachiman idols without a generic respawn', () => {
  const engine = fixture(['berry']);
  const berry = engine.actor;
  const [first] = engine.state.boss.summons;
  for (const idol of engine.state.boss.summons) idol.hp = 1;
  const s1 = engine.skillsFor().find(skill => skill.slot === 'S1');
  const before = { sp: berry.sp, action: engine.state.actionNumber };

  const result = engine.step({ type: 'skill', skillId: s1.id, targetId: first.id });
  const hits = result.events.filter(event => event.type === 'damage' && ['character_skill', 'berry_repeat'].includes(event.sourceType));

  assert.equal(hits.length, 5);
  assert.equal(hits.at(-1).targetId, engine.state.boss.id);
  assert.equal(engine.lovesickStacks(engine.state.boss, berry), 15);
  // Solo Berry's counted action wraps into her next turn; its guide-sourced
  // base 10 SP recovery is the only SP gain, so the repeats cost and add none.
  const spEvents = result.events.filter(event => event.type === 'resource' && event.resource === 'sp');
  assert.deepEqual(spEvents.map(event => [event.sourceType, event.amount]), [['turn_start_recovery', 10]]);
  assert.equal(berry.sp, before.sp - s1.cost + 10);
  assert.equal(engine.state.actionNumber, before.action + 1);
  assert.ok(engine.state.boss.summons.every(idol => idol.alive === false));
  assert.equal(engine.state.boss.summonWave, 1);
});

test('DOUBLE BERRY thresholds reject early casts and each repeat charges SP once without spending Chains', () => {
  const engine = fixture(['berry', 'j-c']);
  const berry = engine.actor;
  assert.equal(berry.chainsOfLove, 1);
  const locked = engine.getBerryAltActions().find(row => row.skill.slot === 'S2');
  assert.equal(locked.enabled, false);
  assert.throws(() => engine.step({ type: 'berry_alt', skillId: locked.skillId }), /Unavailable/);
  cast(engine, 'S1');
  reach(engine, 'berry');
  const before = berry.sp;
  const result = cast(engine, 'S2', 'berry_alt');
  assert.equal(result.consumedAction, true);
  assert.equal(berry.sp, before - 20);
  assert.equal(berry.chainsOfLove, 2);
  assert.equal(berry.doubleBerryUsed.S2, true);
  assert.equal(engine.lovesickStacks(engine.state.boss, berry), 13);
  reach(engine, 'berry');
  assert.equal(engine.getBerryAltActions().find(row => row.skill.slot === 'S2').enabled, false);
  assert.equal(engine.getBerryAltActions().find(row => row.skill.slot === 'S3').enabled, false);
});

test('Berry S3 scales with pre-cast Lovesick and separately hits its ten-stack bonus', () => {
  const engine = fixture(['berry', 'j-c']);
  const berry = engine.actor;
  engine.addLovesick(berry, engine.state.boss, 10);
  berry.chainsOfLove = 3;
  engine.refreshBerryPassives(berry);
  const before = berry.sp;
  const result = cast(engine, 'S3', 'berry_alt');
  assert.equal(berry.sp, before - 22);
  assert.equal(berry.chainsOfLove, 3);
  const hits = result.events.filter(event => event.type === 'damage' && ['character_skill', 'berry_repeat'].includes(event.sourceType));
  assert.equal(hits.length, 4);
  assert.ok(result.events.some(event => event.type === 'status_refresh'));
});

test('ordinary Berry Highlight gains Chains, starts cooldown and deals three sourced Lovesick activations', () => {
  const engine = fixture(['berry', 'j-c']);
  const berry = engine.actor;
  engine.state.sharedCombat.highlight = 100;
  engine.addLovesick(berry, engine.state.boss, 5);
  const result = engine.stepHighlight(berry.id);
  assert.equal(berry.chainsOfLove, 2);
  assert.equal(berry.highlightCooldowns.HL, 4);
  assert.equal(engine.state.sharedCombat.highlight, 0);
  // The Highlight triggers every DoT once and then two extra Lovesick
  // activations; Lovesick now has a sourced level-based coefficient.
  const lovesickTicks = result.events.filter(event => event.type === 'damage' && event.sourceType === 'dot');
  assert.equal(lovesickTicks.length, 3);
  assert.ok(lovesickTicks.every(event => event.targetId === engine.state.boss.id && event.amount > 0));
  assert.equal(result.events.filter(event => event.type === 'unmodeled_dot').length, 0);
  const lovesick = engine.lovesickStatus(engine.state.boss, berry);
  assert.equal(lovesick.durationKnown, true);
  assert.equal(lovesick.duration, 4);
  assert.equal(lovesick.powerPerStack, 0.18);
  assert.equal(engine.state.mechanicsLimitations.some(text => text.includes('DoT coefficient')), false);
  assert.ok(engine.state.mechanicsLimitations.some(text => text.includes('Lovesick uses sourced level-based damage')));
});

test('fourth DOUBLE BERRY option is free, once per battle, and bypasses but preserves cooldown', () => {
  const engine = fixture(['berry', 'j-c']);
  const berry = engine.actor;
  berry.chainsOfLove = 4;
  engine.state.sharedCombat.highlight = 23;
  berry.highlightCooldowns.HL = 4;
  const number = engine.state.actionNumber;
  const result = cast(engine, 'HL', 'berry_alt');
  assert.equal(result.consumedAction, false);
  assert.equal(engine.actor.id, berry.id);
  assert.equal(engine.state.actionNumber, number);
  assert.equal(engine.state.sharedCombat.highlight, 23);
  assert.equal(berry.highlightCooldowns.HL, 4);
  assert.equal(berry.chainsOfLove, 5);
  assert.equal(engine.getBerryAltActions().find(row => row.skill.slot === 'HL').enabled, false);
});

test('explicit Lovesick definition enables deterministic DoT and owner duration refresh', () => {
  const berry = character('berry');
  const config = { loadouts: { [berry.id]: { lovesickDefinition: { powerPerStack: 0.1, duration: 3, sourceUrl: 'test:fixture-only' } } } };
  const a = fixture(['berry'], config);
  const b = fixture(['berry'], config);
  for (const engine of [a, b]) {
    engine.addLovesick(engine.actor, engine.state.boss, 5);
    engine.triggerContinuousDamage(engine.state.boss);
  }
  assert.equal(a.state.totalDamage, b.state.totalDamage);
  assert.ok(a.state.totalDamage > 0);
  a.tickEnemyStatuses(a.state.boss);
  assert.equal(a.lovesickStatus(a.state.boss, a.actor).duration, 2);
  a.resolveSkill(a.actor, a.skillsFor().find(skill => skill.slot === 'S3'), a.state.boss.id);
  assert.equal(a.lovesickStatus(a.state.boss, a.actor).duration, 3);
});

test('Berry Power of Love survives fatal damage once and expires after four ally turns', () => {
  const engine = fixture(['berry', 'j-c']);
  const berry = engine.actor;
  berry.chainsOfLove = 5;
  engine.applyPartyDamage(berry, berry.maxHp * 10);
  assert.equal(berry.hp, 1);
  assert.equal(berry.powerOfLove, 4);
  engine.applyPartyDamage(berry, 10);
  assert.equal(berry.hp, 1);
  for (let i = 0; i < 4; i += 1) guard(engine);
  assert.equal(berry.hp, 0);
  assert.equal(berry.powerOfLove, 0);
});

test('Auto uses legal DOUBLE BERRY actions and complete replay is deterministic', () => {
  const engine = fixture(['berry']);
  engine.actor.chainsOfLove = 3;
  assert.equal(engine.recommend().type, 'berry_alt');
  const config = { seed: 445, bossId: 'hachiman', teamIds: [character('berry').id], characterDefinitions: [character('berry')] };
  const left = simulate(config);
  const right = simulate(config);
  assert.deepEqual(left.result, right.result);
  assert.equal(left.phase, 'results');
  assert.equal(left.result.mechanicsProfile, CURRENT_MECHANICS_PROFILE);
});

test('Akihiko stacks the A0 and A6 opening Mettle and Flash Blow is a free optional Resonance action', () => {
  const engine = fixture(['akihiko']);
  const akihiko = engine.actor;
  assert.equal(akihiko.mettleStacks, 8);
  assert.equal(akihiko.gritStacks, 0);
  const flash = engine.getAvailableActions().find(action => action.type === 'akihiko_flash');
  assert.ok(flash?.enabled);
  const actionNumber = engine.state.actionNumber;
  const result = engine.step({ type: flash.type, skillId: flash.skillId, targetId: engine.state.boss.id });
  assert.equal(result.consumedAction, false);
  assert.equal(engine.state.actionNumber, actionNumber);
  assert.equal(akihiko.mettleStacks, 2);
  assert.equal(akihiko.gritStacks, 1);
  assert.equal(engine.getAvailableActions().some(action => action.type === 'akihiko_flash'), false);
  assert.equal(akihiko.buffs.find(effect => effect.id === 'akihiko_flash_damage')?.value, 0.3);
  assert.ok(result.events.some(event => event.sourceType === 'resonance_follow_up'));
});

test('Akihiko builds Grit and Mettle, spends Grit on Lightning Fist, and gains one Rough Combo stack per action', () => {
  const engine = fixture(['akihiko']);
  const akihiko = engine.actor;
  akihiko.mettleStacks = 0;
  engine.random = () => 0.99;
  cast(engine, 'S2');
  assert.equal(akihiko.gritStacks, 1);
  assert.equal(akihiko.mettleStacks, 3);
  reach(engine, 'akihiko');
  cast(engine, 'S1');
  assert.equal(akihiko.gritStacks, 2);
  assert.equal(akihiko.mettleStacks, 4);
  reach(engine, 'akihiko');
  const result = cast(engine, 'S3');
  assert.equal(akihiko.gritStacks, 1);
  assert.equal(akihiko.buffs.find(effect => effect.id === 'akihiko_rough_combo')?.stacks, 1);
  const finishing = result.events.filter(event => event.sourceType === 'resonance_follow_up' && event.type === 'damage');
  assert.ok(finishing.length >= 1);
  assert.ok(finishing.every(event => event.critical === true));
});

test('Akihiko applies sourced Grit pierce and separate downed-target passive multipliers', () => {
  const engine = fixture(['akihiko']);
  const akihiko = engine.actor;
  const target = engine.state.boss;
  akihiko.gritStacks = 0;
  engine.random = () => 0.5;
  target.downed = false;
  const standing = engine.calculateDamage(akihiko, { power: 1, element: 'almighty', canCrit: false }, target, 'character_skill').amount;
  engine.random = () => 0.5;
  target.downed = true;
  const downed = engine.calculateDamage(akihiko, { power: 1, element: 'almighty', canCrit: false }, target, 'character_skill').amount;
  assert.ok(Math.abs(downed / standing - 1.54) < 0.02);
  target.downed = false;
  akihiko.gritStacks = 4;
  engine.random = () => 0.5;
  const grit = engine.calculateDamage(akihiko, { power: 1, element: 'almighty', canCrit: false }, target, 'character_skill');
  assert.ok(grit.defense < engine.state.boss.defense);
  assert.ok(grit.amount > standing);
});

test('Yukari starts with A1 resources, applies exclusive Erosion, and triggers support once per cycle', () => {
  const engine = fixture(['yukari', 'akihiko']);
  const yukari = engine.actor;
  const akihiko = engine.state.party.find(unit => unit.slug === 'akihiko');
  assert.equal(yukari.whisperwindStacks, 2);
  assert.equal(yukari.theurgyGauge, 70);
  assert.equal(yukari.buffs.some(effect => effect.id === 'yukari_tailwinds_air'), true);
  yukari.whisperwindStacks = 0;
  yukari.hp = Math.max(1, yukari.hp - 2000);
  cast(engine, 'S1');
  assert.equal(engine.state.boss.debuffs.some(effect => effect.id === 'windswept'), true);
  assert.equal(engine.state.boss.debuffs.some(effect => effect.id === 'yukari_erosion'), true);
  const hpBefore = yukari.hp;
  engine.resolveSkill(akihiko, akihiko.skills.find(skill => skill.name === 'Blitzkrieg'), engine.state.boss.id, 'character_skill', { ignoreCost: true });
  assert.ok(yukari.hp > hpBefore);
  assert.equal(yukari.whisperwindStacks, 1);
  assert.equal(yukari.erosionTriggeredSinceTurn, true);
  engine.resolveSkill(akihiko, akihiko.skills.find(skill => skill.name === 'Blitzkrieg'), engine.state.boss.id, 'character_skill', { ignoreCost: true });
  assert.equal(yukari.whisperwindStacks, 1);
});

test('Yukari transfers exclusive Erosion on defeat and Arrow preserves gauge overflow separately', () => {
  const engine = fixture(['yukari', 'akihiko']);
  const yukari = engine.actor;
  const akihiko = engine.state.party.find(unit => unit.slug === 'akihiko');
  const summon = engine.state.boss.summons[0];
  engine.applyYukariErosion(summon);
  summon.hp = 1;
  guard(engine);
  engine.random = () => 0.99;
  cast(engine, 'S1');
  assert.equal(summon.alive, false);
  assert.equal(engine.enemies.filter(enemy => enemy.debuffs.some(effect => effect.id === 'yukari_erosion')).length, 1);

  const arrow = fixture(['yukari', 'akihiko']);
  const arrowYukari = arrow.actor;
  const arrowAkihiko = arrow.state.party.find(unit => unit.slug === 'akihiko');
  arrowYukari.whisperwindStacks = 2;
  arrowAkihiko.theurgyGauge = 130;
  const action = arrow.getAvailableActions().find(row => row.skill?.name === 'Arrow of Life');
  arrow.step({ type: 'skill', skillId: action.skillId, targetId: arrowAkihiko.id });
  assert.equal(arrowAkihiko.theurgyGauge, 140);
  assert.equal(arrowAkihiko.theurgyReserve, 25);
  assert.equal(arrowAkihiko.theurgyReserveTurns, 2);
  assert.equal(arrowYukari.whisperwindStacks, 0);
  assert.equal(arrowAkihiko.yukariPendingTheurgyAttackStacks, 2);
});

test('Yukari Tailwind uses source-scaled main-target buffs and party mitigation', () => {
  const engine = fixture(['yukari', 'makoto']);
  const yukari = engine.actor;
  const makoto = engine.state.party.find(unit => unit.slug === 'makoto');
  const maxBefore = yukari.maxHp;
  assert.ok(maxBefore > character('yukari').maxHp);
  const action = engine.getAvailableActions().find(row => row.skill?.name === "Tailwind's Breath");
  engine.step({ type: 'skill', skillId: action.skillId, targetId: makoto.id });
  assert.equal(makoto.buffs.find(effect => effect.id === 'yukari_tailwind_reduction')?.value, 0.341);
  assert.equal(makoto.buffs.find(effect => effect.id === 'yukari_tailwind_pierce')?.value, 0.2);
  assert.equal(makoto.buffs.find(effect => effect.id === 'yukari_tailwind_attack')?.value,
    Math.min(0.364, 0.091 + Math.floor(yukari.mechanicAttack / 100) * 0.0078));
  assert.equal(makoto.entrustedHopeStacks, 1);
});

test('Makoto gates Scarlet Hades, preserves Moon Phase duration grace, and emits one packet per spent stack', () => {
  const engine = fixture(['makoto']);
  const makoto = engine.actor;
  const locked = engine.getAvailableActions().find(action => action.skill?.name === 'Scarlet Hades');
  assert.equal(locked.enabled, false);
  assert.match(locked.unavailableReason, /2 Moon Phase/);
  engine.random = () => 0.99;
  cast(engine, 'S1');
  assert.equal(makoto.moonPhaseStacks, 2);
  assert.equal(makoto.moonPhaseDuration, 2);
  assert.equal(makoto.scarletHadesMultiplierBonus, 0.378);
  reach(engine, 'makoto');
  const result = cast(engine, 'S3');
  assert.equal(result.events.filter(event => event.type === 'damage').length, 2);
  assert.equal(makoto.moonPhaseStacks, 0);
  assert.equal(makoto.fullMoonStacks, 0);
});

test('Makoto auto-casts Nocturne at four Moon Phase and Entrusted Hope stacks once per eligible receipt', () => {
  const auto = fixture(['makoto', 'akihiko']);
  const makoto = auto.actor;
  auto.gainMakotoMoonPhase(makoto, 4);
  guard(auto);
  guard(auto);
  assert.equal(makoto.moonPhaseStacks, 4);
  assert.equal(makoto.nocturneAutoCooldown, 1);
  assert.equal(makoto.buffs.find(effect => effect.id === 'makoto_nocturne_attack')?.value, 0.227);
  assert.equal(auto.state.party.every(unit => unit.buffs.some(effect => effect.id === 'makoto_nocturne_pierce')), true);

  const entrusted = fixture(['marian-beachflower', 'makoto']);
  const marian = entrusted.actor;
  const entrustedMakoto = entrusted.state.party.find(unit => unit.slug === 'makoto');
  const summer = entrusted.skillsFor().find(skill => skill.name === 'Summer Garden');
  entrusted.resolveSkill(marian, summer, 'party', 'character_skill', { ignoreCost: true });
  entrusted.resolveSkill(marian, summer, 'party', 'character_skill', { ignoreCost: true });
  assert.equal(entrustedMakoto.entrustedHopeStacks, 2);
  assert.equal(entrustedMakoto.buffs.find(effect => effect.id === 'makoto_entrusted_hope')?.value, 0.144);
  assert.equal(entrustedMakoto.moonPhaseStacks, 1);
});

test('SEES Theurgy and Assist actions remain disabled without shared activation evidence', () => {
  for (const slug of ['akihiko', 'yukari', 'makoto']) {
    const engine = fixture([slug]);
    const assist = engine.getAvailableActions().find(action => action.skill?.name === 'Assist');
    assert.equal(assist.enabled, false);
    assert.match(assist.unavailableReason, /Assist timing/);
    engine.state.sharedCombat.highlight = 100;
    const theurgy = engine.getHighlightActions().find(action => action.actorId === engine.actor.id);
    assert.equal(theurgy.enabled, false);
    assert.match(theurgy.unavailableReason, /Theurgy gauge/);
  }
});
