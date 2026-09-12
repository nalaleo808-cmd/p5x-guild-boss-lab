import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BattleEngine } from '../src/engine.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';

const artworkDirectory = fileURLToPath(new URL('../assets/characters/', import.meta.url));

test('generated Lufelnet catalog contains the imported Persona and Revelation records', () => {
  assert.equal(lufelCatalog.counts.personas, 57);
  assert.equal(lufelCatalog.counts.personaSkills, 337);
  assert.equal(lufelCatalog.counts.transferablePersonaSkills, 458);
  assert.equal(lufelCatalog.counts.characters, 20);
  assert.equal(lufelCatalog.counts.revelationMains, 18);
  assert.equal(lufelCatalog.counts.revelationSets, 32);
  assert.match(lufelCatalog.source.commit, /^[0-9a-f]{40}$/);
  assert.ok(lufelCatalog.personas.some(persona => persona.name === 'Alice'));
  assert.deepEqual(lufelCatalog.characters.slice(0, 3).map(character => character.codename), ['BLITZ', 'BERRY', 'PUPPET·Wavecatcher']);
  assert.equal(lufelCatalog.characters.at(-1).codename, 'NOIR');
  assert.equal(lufelCatalog.source.characterPage.spoilers, false);
  assert.ok(lufelCatalog.characters.every(character => character.artwork?.startsWith('/assets/characters/')));
  assert.ok(lufelCatalog.characters.every(character => existsSync(join(artworkDirectory, `${character.slug}.webp`))));
});

test('Rebellion is a transferable executable buff that can be equipped by Dionysus', () => {
  const dionysus = lufelCatalog.personas.find(persona => persona.name === 'Dionysus');
  const rebellion = [...lufelCatalog.personaSkills, ...lufelCatalog.personas.flatMap(persona => persona.skills)]
    .find(skill => skill.name === 'Rebellion' && skill.combat.executable);
  assert.ok(dionysus);
  assert.equal(dionysus.recommendedSkills.find(skill => skill.name === 'Rebellion')?.skillId, rebellion.id);
  assert.deepEqual(dionysus.recommendedSkills.slice(0, 3).map(skill => skill.name), ['Universal Theoria', 'Rebellion', 'Tarukaja']);
  assert.ok(dionysus.recommendedSkills.slice(0, 3).every(skill => skill.skillId));
  assert.equal(rebellion.combat.buff.stat, 'critRate');

  const persona = {
    id: dionysus.id, name: dionysus.name, element: dionysus.element, arcana: dionysus.position,
    trait: dionysus.passive[0]?.name,
    skills: [{ id: rebellion.id, slot: 'S1', name: rebellion.name, element: rebellion.element, cost: rebellion.cost,
      power: 0, target: rebellion.target, buff: rebellion.combat.buff, note: rebellion.description }]
  };
  const engine = new BattleEngine({ seed: 808, personaDefinitions: [persona], personaIds: [persona.id] });
  engine.step({ type: 'skill', skillId: rebellion.id, targetId: 'joker' });
  const joker = engine.state.party.find(unit => unit.id === 'joker');
  assert.ok(joker.buffs.some(buff => buff.id === 'crit_rate_up' && buff.sourceType === 'persona_skill'));
});

test('the newest non-spoiler character records use their English Lufelnet skills', () => {
  const blitz = lufelCatalog.characters.find(character => character.codename === 'BLITZ');
  assert.equal(blitz.formulaStatus, 'source-described');
  assert.deepEqual(blitz.skills.map(skill => skill.name), ['Discharge Sprocket', 'Thunderbolt Outrage', 'Secret Technique: Lightning Legs']);
  assert.equal(blitz.skills[0].target, 'all_enemies');
  assert.equal(blitz.recommendedRevelations.main[0], 'Hope');

  const engine = new BattleEngine({
    seed: 808, characterDefinitions: [blitz],
    teamIds: [blitz.id, 'wonder', 'joker', 'mona']
  });
  const action = engine.getAvailableActions().find(candidate => candidate.name === 'Discharge Sprocket');
  assert.ok(action?.enabled);
  const result = engine.step({ type: 'skill', skillId: action.skillId, targetId: 'boss' });
  assert.ok(result.reward > 0);
  assert.equal(engine.state.party[0].sp, blitz.maxSp - 22);
});

test('A6 characters use the fourth source coefficient at Level 13', () => {
  const miyu = lufelCatalog.characters.find(character => character.slug === 'puppet-wavecatcher');
  const marian = lufelCatalog.characters.find(character => character.slug === 'marian-beachflower');
  const twins = lufelCatalog.characters.find(character => character.slug === 'j-c');

  assert.deepEqual(miyu.skills.find(skill => skill.name === 'Jellyfish Splash').powerTiers.map(value => Number(value.toFixed(3))), [1.007, 1.11, 1.069, 1.172]);
  assert.equal(miyu.skills.find(skill => skill.name === 'Aerial Tide').power, 2.08);
  assert.equal(marian.skills.find(skill => skill.name === 'Beach Basket').power, 0.75);
  assert.equal(twins.skills.find(skill => skill.name === 'Mask of Mischief & Innocence').power, 0.867);
  assert.equal(Number(twins.skills.find(skill => skill.name === 'Two Masks as One').power.toFixed(3)), 1.477);
  for (const character of lufelCatalog.characters) {
    assert.equal(character.awareness, 6, `${character.codename} awareness`);
    assert.equal(character.skillLevel, 13, `${character.codename} skill level`);
    assert.equal(character.attack, Math.round(character.sourceStats.a6_lv80.attack / 4.6), `${character.codename} A6 Attack`);
    for (const skill of [...character.skills, character.highlightSkill].filter(Boolean)) {
      if (!skill.powerTiers?.length) continue;
      assert.equal(skill.power, skill.powerTiers.at(-1), `${character.codename} ${skill.name} Level 13 coefficient`);
    }
  }
});

test('ANGE uses independent actions while MIKU starts with a shared four-action lock', () => {
  const ange = lufelCatalog.characters.find(character => character.codename === 'ANGE');
  const miku = lufelCatalog.characters.find(character => character.codename === 'MIKU');
  assert.equal(ange.role, 'Elucidator');
  assert.equal(miku.role, 'Elucidator');
  assert.deepEqual(ange.skills.map(skill => skill.cooldown), [4, 8, 4]);
  assert.deepEqual(miku.skills.map(skill => skill.cooldown), [4, 4, 6]);
  assert.equal(miku.skills.find(skill => skill.name === 'Clear Sound').heal, 0.3);

  const navigatorDefinition = {
    ...ange, id: 'navigator-ange',
    skills: ange.skills.map((skill, index) => ({ ...skill, id: `navigator-ange-${index + 1}`, power: 0 }))
  };
  const engine = new BattleEngine({ seed: 808, navigatorDefinition });
  const before = engine.getObservation();
  const action = before.navigatorActions.find(candidate => candidate.name === 'Winged Canon');
  const result = engine.stepNavigator(action.id);
  assert.equal(result.consumedAction, false);
  assert.equal(result.nextState.currentActorId, before.currentActorId);
  assert.equal(result.nextState.navigator.codename, 'ANGE');
  assert.equal(result.nextState.navigator.cooldowns[action.id], 4);
  assert.ok(result.nextState.party.every(unit => unit.buffs.some(buff => buff.id === 'damage_up')));

  const mikuEngine = new BattleEngine({
    seed: 808,
    navigatorDefinition: { ...miku, id: 'navigator-miku', skills: miku.skills }
  });
  const feel = mikuEngine.getNavigatorActions().find(candidate => candidate.name === 'Feel the Beat');
  const clear = mikuEngine.getNavigatorActions().find(candidate => candidate.name === 'Clear Sound');
  const showstopper = mikuEngine.getNavigatorActions().find(candidate => candidate.name === 'Showstopper');
  assert.equal(feel.remaining, 4);
  assert.equal(clear.remaining, 4);
  assert.equal(feel.enabled, false);
  assert.equal(clear.enabled, false);
  assert.equal(showstopper.enabled, false);
  assert.match(showstopper.unavailableReason, /three Track types/);
});

test('custom character definitions and their selected order become the battle queue', () => {
  const custom = {
    id: 'custom-skull', name: 'Ryuji Sakamoto', codename: 'Skull', role: 'Assassin', element: 'physical',
    maxHp: 900, maxSp: 170, attack: 240, crit: .18, portrait: 'S', accent: '#f0d63b', actionLimit: 1,
    skills: [{ id: 'skull-smash', slot: 'S1', name: 'Skull Smash', element: 'physical', cost: 18, power: 1.6, target: 'boss', note: 'Test kit.' }]
  };
  const engine = new BattleEngine({ seed: 808, characterDefinitions: [custom], teamIds: ['custom-skull', 'mona', 'wonder', 'joker'] });
  assert.deepEqual(engine.state.party.map(unit => unit.id), ['custom-skull', 'mona', 'wonder', 'joker']);
  assert.equal(engine.getObservation().currentActorId, 'custom-skull');
});

test('an imported Persona loadout becomes Wonder’s legal move list', () => {
  const source = lufelCatalog.personas.find(persona => persona.name === 'Alice');
  const skills = source.skills.filter(skill => skill.combat.executable).slice(0, 3).map((skill, index) => ({
    id: skill.id,
    slot: `S${index + 1}`,
    name: skill.name,
    element: skill.element,
    cost: skill.cost,
    power: skill.combat.power || 0,
    target: skill.target,
    debuff: skill.combat.debuff
  }));
  const persona = { id: source.id, name: source.name, element: source.element, arcana: source.position, trait: source.passive[0]?.name, skills };
  const engine = new BattleEngine({ seed: 808, personaDefinitions: [persona], personaIds: [persona.id] });
  const legalSkillIds = engine.getAvailableActions().filter(action => action.type === 'skill').map(action => action.skillId);
  assert.deepEqual(legalSkillIds, skills.map(skill => skill.id));
  assert.equal(engine.activePersona.name, 'Alice');
});

test('structured Revelation attack and HP bonuses alter initial combat state', () => {
  const baseline = new BattleEngine({ seed: 808 });
  const boosted = new BattleEngine({
    seed: 808,
    loadouts: { joker: { revelationName: 'Test set', revelationCombat: { attackPercent: 0.12, hpPercent: 0.12 } } }
  });
  const baseJoker = baseline.state.party.find(unit => unit.id === 'joker');
  const boostedJoker = boosted.state.party.find(unit => unit.id === 'joker');
  assert.equal(boostedJoker.attack, Math.round(baseJoker.attack * 1.12));
  assert.equal(boostedJoker.maxHp, Math.round(baseJoker.maxHp * 1.12));
  assert.equal(boostedJoker.hp, boostedJoker.maxHp);
  assert.equal(boostedJoker.revelationName, 'Test set');
});

test('hard base-stat inputs replace character defaults before Revelation bonuses', () => {
  const engine = new BattleEngine({
    seed: 808,
    loadouts: { joker: { baseStats: { maxHp: 12345, maxSp: 222, attack: 333, defense: 444, speed: 155, critRate: 42, critMult: 210 }, revelationCombat: { attackPercent: .12, hpPercent: .12 } } }
  });
  const joker = engine.state.party.find(unit => unit.id === 'joker');
  assert.equal(joker.maxHp, Math.round(12345 * 1.12));
  assert.equal(joker.maxSp, 222);
  assert.equal(joker.attack, Math.round(333 * 1.12));
  assert.equal(joker.defense, 444);
  assert.equal(joker.speed, 155);
  assert.equal(joker.crit, .42);
  assert.equal(joker.critMult, 2.1);
});

test('Marian Beach Basket scales from max HP and applies scaled Bewitching Blossoms', () => {
  const marian = lufelCatalog.characters.find(character => character.codename === 'MARIAN·Beachflower');
  const basket = marian.skills.find(skill => skill.name === 'Beach Basket');
  assert.equal(basket.scalingStat, 'maxHp');
  assert.equal(basket.debuff.id, 'bewitching_blossoms');

  const engine = new BattleEngine({
    seed: 808, characterDefinitions: [marian], teamIds: [marian.id, 'wonder', 'joker', 'mona'],
    loadouts: { [marian.id]: { baseStats: { maxHp: 13200 } } }
  });
  const result = engine.step({ type: 'skill', skillId: basket.id, targetId: 'boss' });
  const blossoms = engine.state.boss.debuffs.find(effect => effect.id === 'bewitching_blossoms');
  assert.ok(result.reward > 0);
  assert.equal(blossoms.damageTaken, true);
  assert.ok(Math.abs(blossoms.value - .554) < 1e-9);
  assert.equal(blossoms.duration, 3);
});

test('Gentle Sea Breeze grants two medicines and stays unavailable for two following Marian turns', () => {
  const marian = lufelCatalog.characters.find(character => character.codename === 'MARIAN·Beachflower');
  const breeze = marian.skills.find(skill => skill.name === 'Gentle Sea Breeze');
  assert.deepEqual(breeze.medicinePrescription, { amount: 2, max: 2 });
  assert.equal(breeze.cooldown, 2);
  const engine = new BattleEngine({
    seed: 808, characterDefinitions: [marian], teamIds: [marian.id, 'wonder', 'joker', 'mona'],
    loadouts: { [marian.id]: { baseStats: { maxHp: 12000, critMult: 200 } } }
  });
  const joker = engine.state.party.find(unit => unit.id === 'joker');
  joker.hp -= 800;
  assert.equal(engine.getAvailableActions().find(action => action.skillId === breeze.id).enabled, true);
  engine.step({ type: 'skill', skillId: breeze.id, targetId: joker.id });
  assert.equal(engine.state.party[0].midsummerPrescription, 2);
  assert.equal(engine.getMedicineActions().length, 0);
  engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });
  engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });
  engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });
  assert.equal(engine.actor.id, marian.id);
  assert.equal(engine.getAvailableActions().find(action => action.skillId === breeze.id).cooldownRemaining, 2);
  assert.equal(engine.getAvailableActions().find(action => action.skillId === breeze.id).enabled, false);
  assert.deepEqual(engine.getMedicineActions().map(action => action.name), [
    'Attacker Tablet', 'Defender Tonic', 'Fighter Salve', 'DOT-Up',
    'Reso-Up', '1More-Up', 'HL-Up', 'Technica-Up'
  ]);
  const before = { actorIndex: engine.state.actorIndex, actions: engine.state.turnActionsUsed, hp: joker.hp };
  const result = engine.stepMedicine('reso_up', joker.id);
  assert.equal(result.consumedAction, false);
  assert.equal(engine.state.actorIndex, before.actorIndex);
  assert.equal(engine.state.turnActionsUsed, before.actions);
  assert.equal(engine.state.party[0].midsummerPrescription, 1);
  assert.ok(joker.hp > before.hp);
  assert.ok(joker.buffs.some(buff => buff.id === 'medicine_resonance_damage' && buff.duration === 3 && buff.sourceType === 'medicine'));
  assert.equal(engine.getMedicineActions().length, 0);
  assert.throws(() => engine.stepMedicine('fighter_salve', joker.id), /unavailable/i);
  assert.ok(result.events.some(event => event.type === 'medicine'));

  engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });
  engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });
  engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });
  engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });
  assert.equal(engine.actor.id, marian.id);
  assert.equal(engine.getAvailableActions().find(action => action.skillId === breeze.id).cooldownRemaining, 1);
  assert.equal(engine.getAvailableActions().find(action => action.skillId === breeze.id).enabled, false);
  engine.stepMedicine('fighter_salve', joker.id);
  assert.equal(engine.state.party[0].midsummerPrescription, 0);
  assert.ok(joker.buffs.some(buff => buff.id === 'medicine_damage' && buff.duration === 3 && buff.sourceType === 'medicine'));
  for (let action = 0; action < 4; action += 1) engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });
  assert.equal(engine.actor.id, marian.id);
  assert.equal(engine.getAvailableActions().find(action => action.skillId === breeze.id).cooldownRemaining, 0);
  assert.equal(engine.getAvailableActions().find(action => action.skillId === breeze.id).enabled, true);
});

test('Paddle Out enters Surf and Catch a Wave follows an ally turn for free', () => {
  const wavecatcher = lufelCatalog.characters.find(character => character.slug === 'puppet-wavecatcher');
  const paddleOut = wavecatcher.skills.find(skill => skill.name === 'Paddle Out');
  const engine = new BattleEngine({
    seed: 808,
    bossId: 'hachiman',
    characterDefinitions: [{ ...wavecatcher, awareness: 0 }],
    teamIds: [wavecatcher.id, 'wonder', 'joker', 'mona']
  });
  const wavecatcherState = engine.state.party[0];
  const startingSp = wavecatcherState.sp;
  const damageBefore = engine.state.totalDamage;
  const paddleResult = engine.step({ type: 'skill', skillId: paddleOut.id, targetId: 'boss' });

  assert.equal(paddleResult.reward, 0);
  assert.equal(engine.state.totalDamage, damageBefore);
  assert.equal(wavecatcherState.surfActive, true);
  assert.equal(wavecatcherState.sp, startingSp - 60);
  assert.equal(engine.state.actionNumber, 2);

  for (const enemy of engine.enemies) enemy.weakness = 'ice';
  const downPoints = engine.enemies.map(enemy => [enemy.id, enemy.downPoints]);
  const allyResult = engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });

  assert.equal(engine.state.actionNumber, 3);
  assert.equal(wavecatcherState.sp, startingSp - 90);
  assert.equal(wavecatcherState.offshoreStacks, 1);
  assert.ok(engine.state.totalDamage > damageBefore);
  assert.ok(allyResult.events.some(event => event.type === 'follow_up' && event.sourceType === 'resonance_follow_up'));
  assert.ok(allyResult.events.some(event => event.type === 'damage' && event.sourceType === 'resonance_follow_up'));
  for (const [id, points] of downPoints) assert.equal(engine.findEnemy(id)?.downPoints, points);
});

test('A6 Miyu begins battle in Surf state', () => {
  const wavecatcher = lufelCatalog.characters.find(character => character.slug === 'puppet-wavecatcher');
  const engine = new BattleEngine({
    seed: 808,
    characterDefinitions: [{ ...wavecatcher, awareness: 6 }],
    teamIds: [wavecatcher.id, 'wonder', 'joker', 'mona']
  });

  const miyu = engine.state.party[0];
  assert.equal(miyu.awareness, 6);
  assert.equal(miyu.surfActive, true);
});

test('Jellyfish Splash can bank SP above Miyu’s normal maximum', () => {
  const wavecatcher = lufelCatalog.characters.find(character => character.slug === 'puppet-wavecatcher');
  const jellyfish = wavecatcher.skills.find(skill => skill.name === 'Jellyfish Splash');
  const engine = new BattleEngine({
    seed: 808,
    characterDefinitions: [wavecatcher],
    teamIds: [wavecatcher.id, 'wonder', 'joker', 'mona']
  });
  const miyu = engine.state.party[0];
  assert.equal(miyu.sp, miyu.maxSp);

  engine.step({ type: 'skill', skillId: jellyfish.id, targetId: 'boss' });

  assert.equal(miyu.spRecovery, 188.5);
  assert.equal(miyu.sp, miyu.maxSp + 75);
  assert.equal(engine.spCap(miyu), miyu.maxSp * 2);
});

test('Slaughter Drive Auto respects A6 Miyu starting in Surf', () => {
  const wavecatcher = lufelCatalog.characters.find(character => character.slug === 'puppet-wavecatcher');
  const engine = new BattleEngine({
    seed: 808,
    bossId: 'slaughter_drive',
    characterDefinitions: [wavecatcher],
    teamIds: [wavecatcher.id, 'wonder', 'joker', 'mona']
  });

  assert.equal(engine.recommend().name, 'Jellyfish Splash');
  engine.state.attackTurn = 7;
  assert.equal(engine.recommend().name, 'Jellyfish Splash');
  engine.state.attackTurn = 8;
  engine.actor.offshoreStacks = 3;
  assert.equal(engine.recommend().name, 'Aerial Tide');
});

test('Miyu Hang Ten scales Attack from SP Recovery and caps at 280 percent', () => {
  const wavecatcher = lufelCatalog.characters.find(character => character.slug === 'puppet-wavecatcher');
  const baseline = new BattleEngine({
    seed: 808, characterDefinitions: [wavecatcher], teamIds: [wavecatcher.id, 'wonder', 'joker', 'mona']
  });
  const capped = new BattleEngine({
    seed: 808, characterDefinitions: [wavecatcher], teamIds: [wavecatcher.id, 'wonder', 'joker', 'mona'],
    loadouts: { [wavecatcher.id]: { baseStats: { spRecovery: 400 } } }
  });
  const baselineBuff = baseline.state.party[0].buffs.find(buff => buff.id === 'miyu_hang_ten_attack');
  const cappedBuff = capped.state.party[0].buffs.find(buff => buff.id === 'miyu_hang_ten_attack');

  assert.ok(Math.abs(baselineBuff.value - 0.65975) < 1e-9);
  assert.equal(capped.state.party[0].spRecovery, 400);
  assert.equal(cappedBuff.value, 0.98);
});

test('Surf extends incoming status duration and rejects spiritual control ailments', () => {
  const wavecatcher = lufelCatalog.characters.find(character => character.slug === 'puppet-wavecatcher');
  const paddleOut = wavecatcher.skills.find(skill => skill.name === 'Paddle Out');
  const engine = new BattleEngine({
    seed: 808, characterDefinitions: [wavecatcher], teamIds: [wavecatcher.id, 'wonder', 'joker', 'mona']
  });
  const miyu = engine.state.party[0];

  engine.applyUnitBuff(miyu, { id: 'test_buff', name: 'TEST BUFF', stat: 'damage', value: 0.1, duration: 3 }, 'test');
  assert.equal(miyu.buffs.find(buff => buff.id === 'test_buff').duration, 4);
  assert.equal(engine.applyUnitDebuff(miyu, { id: 'fear', name: 'FEAR', duration: 2 }, 'test'), null);
  assert.equal(miyu.debuffs.length, 0);

  miyu.surfActive = false;
  engine.applyUnitDebuff(miyu, { id: 'fear', name: 'FEAR', duration: 2 }, 'test');
  engine.step({ type: 'skill', skillId: paddleOut.id, targetId: 'party' });
  assert.equal(miyu.surfActive, true);
  assert.equal(miyu.debuffs.length, 0);
});

test('Marian passives grant party Attack and Summer Garden damage scales continuously with max HP up to 13,632', () => {
  const marian = lufelCatalog.characters.find(character => character.slug === 'marian-beachflower');
  const garden = marian.skills.find(skill => skill.name === 'Summer Garden');
  // Live Summer Garden is 9.1% + 3.2% per 1,200 max HP without flooring; the
  // 13,632 HP cap yields the sourced 45.452%.
  for (const [maxHp, expectedValue] of [[13632, 0.45452], [20000, 0.45452], [1000, 0.091 + (1000 / 1200) * 0.032]]) {
    const engine = new BattleEngine({
      seed: 808, characterDefinitions: [marian], teamIds: [marian.id, 'wonder', 'joker', 'mona'],
      loadouts: { [marian.id]: { baseStats: { maxHp } } }
    });

    assert.ok(engine.state.party.every(unit => unit.buffs.some(buff => buff.id === 'marian_blossoms_attack' && buff.value === 0.12)));
    for (const unit of engine.state.party) engine.applyUnitDebuff(unit, { id: `test_${unit.id}`, name: 'TEST DEBUFF', duration: 2 }, 'test');
    engine.step({ type: 'skill', skillId: garden.id, targetId: 'party' });

    for (const unit of engine.state.party) {
      const gardenBuff = unit.buffs.find(buff => buff.id === 'damage_up');
      const blessingBuff = unit.buffs.find(buff => buff.id === 'marian_blessing_damage');
      assert.equal(unit.blessingStacks, 2);
      assert.ok(Math.abs(gardenBuff.value - expectedValue) < 1e-9, `maxHp ${maxHp}: ${gardenBuff.value}`);
      assert.equal(blessingBuff.value, 0.12);
      assert.equal(unit.debuffs.length, 0);
    }
  }
});

test('Marian Breeze, Highlight, and Potent Medicine use A6 critical and item formulas', () => {
  const marian = lufelCatalog.characters.find(character => character.slug === 'marian-beachflower');
  const breeze = marian.skills.find(skill => skill.name === 'Gentle Sea Breeze');
  const engine = new BattleEngine({
    seed: 808, characterDefinitions: [marian], teamIds: [marian.id, 'wonder', 'joker', 'mona'],
    loadouts: { [marian.id]: { baseStats: { critMult: 246.4 } } }
  });
  const target = engine.state.party.find(unit => unit.id === 'joker');

  engine.step({ type: 'skill', skillId: breeze.id, targetId: target.id });
  assert.equal(target.blessingStacks, 1);
  assert.ok(Math.abs(target.buffs.find(buff => buff.id === 'marian_breeze_crit_damage').value - 0.488) < 1e-9);

  while (engine.actor.id !== marian.id) engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });
  // Live Highlight is one shared party meter rather than a personal gauge.
  engine.state.sharedCombat.highlight = 100;
  const highlight = engine.getHighlightActions().find(action => action.actorId === marian.id);
  assert.equal(highlight.target, 'ally');
  engine.stepHighlight(highlight.skillId, target.id);
  assert.equal(target.blessingStacks, 2);
  assert.equal(target.buffs.find(buff => buff.id === 'marian_highlight_damage').duration, 3);
  assert.ok(Math.abs(target.buffs.find(buff => buff.id === 'marian_highlight_crit_damage').value - 0.244) < 1e-9);
  assert.equal(engine.state.party[0].nextMedicineEffectBonus, 0.164);

  engine.stepMedicine('attack_tablet', target.id);
  assert.ok(Math.abs(target.buffs.find(buff => buff.id === 'medicine_attack').value - 0.4092) < 1e-9);
  assert.equal(engine.potentMedicineAttackBonus(target), 0.15);
  assert.ok(Math.abs(target.buffs.find(buff => buff.id === 'medicine_crit_damage').value - 0.244) < 1e-9);
  assert.equal(target.buffs.find(buff => buff.id === 'marian_a6_refresh').value, 0.15);
  assert.equal(engine.state.party[0].nextMedicineEffectBonus, 0);
});

test('all J&C Oxymoron mask pairs apply their complete passive bonuses', () => {
  const twins = lufelCatalog.characters.find(character => character.slug === 'j-c');
  const create = masks => new BattleEngine({
    seed: 808, bossId: 'hachiman', characterDefinitions: [{ ...twins, awareness: 0 }],
    teamIds: [twins.id, 'wonder'], jcMaskPair: masks
  });

  const mischiefService = create(['mischief', 'service']);
  assert.equal(mischiefService.state.party[0].healingBonus, 0.21);
  assert.ok(mischiefService.state.party.every(unit => unit.buffs.some(buff => buff.id === 'jc_oxymoron_damage' && buff.value === 0.24)));

  const mischiefAbsurdity = create(['mischief', 'absurdity']);
  assert.equal(mischiefAbsurdity.state.party[0].speed, twins.speed + 5);
  assert.ok(mischiefAbsurdity.state.party.every(unit => unit.buffs.some(buff => buff.id === 'jc_oxymoron_attack' && buff.value === 0.3)));

  assert.equal(create(['mischief', 'luck']).state.party[0].buffs.find(buff => buff.id === 'jc_oxymoron_crit').value, 0.15);
  assert.equal(create(['service', 'absurdity']).state.party[0].shieldBonus, 0.21);

  const serviceLuck = create(['service', 'luck']);
  assert.equal(serviceLuck.state.party[0].speed, twins.speed + 5);
  assert.ok(serviceLuck.enemies.every(enemy => enemy.debuffs.some(debuff => debuff.id === 'jc_oxymoron_exposure' && debuff.value === 0.24)));
  assert.equal(create(['absurdity', 'luck']).state.party[0].buffs.find(buff => buff.id === 'jc_oxymoron_crit_damage').value, 0.3);
});

test('J&C Service healing, reduction, and shield pair honor Oxymoron', () => {
  const twins = lufelCatalog.characters.find(character => character.slug === 'j-c');
  const serviceEngine = new BattleEngine({
    seed: 808, characterDefinitions: [{ ...twins, awareness: 0 }], teamIds: [twins.id, 'wonder'], jcMaskPair: ['mischief', 'service']
  });
  const jc = serviceEngine.state.party[0];
  for (const unit of serviceEngine.state.party) {
    unit.maxHp = 10000;
    unit.hp = 1;
  }
  const service = jc.skills.find(skill => skill.name === 'Mask of Service & Admonition');
  serviceEngine.resolveSkill(jc, service, serviceEngine.state.boss.id);
  const expectedHeal = Math.round((jc.attack * 0.404 + 3480) * 1.21);
  assert.ok(serviceEngine.state.party.every(unit => unit.hp === 1 + expectedHeal));
  const expectedReduction = 0.114 * (1 + jc.desireLevel / 100);
  assert.ok(serviceEngine.state.party.every(unit => Math.abs(unit.buffs.find(buff => buff.id === 'jc_service_reduction').value - expectedReduction) < 1e-9));

  const shieldEngine = new BattleEngine({
    seed: 808, characterDefinitions: [{ ...twins, awareness: 0 }], teamIds: [twins.id, 'wonder'], jcMaskPair: ['service', 'absurdity']
  });
  const shieldJc = shieldEngine.state.party[0];
  shieldEngine.applyJcTwoMaskEffects(shieldJc, ['service', 'absurdity'], false);
  const expectedShield = Math.round((shieldJc.attack * 0.486 + 4184) * 1.21);
  assert.ok(shieldEngine.state.party.every(unit => unit.buffs.find(buff => buff.id === 'jc_two_masks_shield').value === expectedShield));
  assert.ok(shieldEngine.state.party.every(unit => unit.downPoints === 1));
});

test('A6 J&C carries True Desire past opening Two Masks and spends it on the next completed pair', () => {
  const twins = lufelCatalog.characters.find(character => character.slug === 'j-c');
  const engine = new BattleEngine({
    seed: 808,
    characterDefinitions: [{ ...twins, awareness: 6 }],
    teamIds: [twins.id, 'wonder', 'joker', 'mona'],
    jcMaskPair: ['mischief', 'absurdity']
  });
  const jc = engine.state.party[0];
  assert.equal(jc.desireLevel, 64);
  assert.equal(jc.trueDesireStacks, 1);
  assert.equal(jc.trueDesirePrimed, false);
  assert.deepEqual(jc.facades, []);
  assert.equal(engine.state.log.filter(event => event.type === 'follow_up' && event.message.includes('automatically activated Two Masks')).length, 1);
  assert.deepEqual(engine.getAvailableActions().filter(action => action.type === 'skill').map(action => action.name), [
    'Mask of Mischief & Innocence', 'Mask of Absurdity & Nonsense'
  ]);
  assert.equal(engine.getAvailableActions().some(action => action.name === 'Two Masks as One'), false);
  assert.equal(engine.getAvailableActions().find(action => action.name === 'Mask of Absurdity & Nonsense').enabled, true);
  assert.equal(engine.getAvailableActions().find(action => action.name === 'Mask of Mischief & Innocence').enabled, true);

  const openingS1 = engine.getAvailableActions().find(action => action.skill?.slot === 'S1');
  engine.step({ type: 'skill', skillId: openingS1.skillId, targetId: engine.state.boss.id });
  assert.equal(jc.trueDesireStacks, 1);
  assert.equal(jc.trueDesirePrimed, false);
  assert.deepEqual(jc.facades, ['mischief']);
  assert.equal(jc.jcNextMaskSlot, 'S2');

  for (let index = 0; index < 3; index += 1) engine.step({ type: 'guard', skillId: 'guard', targetId: 'self' });
  assert.equal(engine.actor.id, jc.id);
  const beforeToggle = {
    actionNumber: engine.state.actionNumber,
    actorIndex: engine.state.actorIndex,
    actionsUsed: engine.state.turnActionsUsed,
    sp: jc.sp,
    facades: [...jc.facades]
  };
  const toggledOn = engine.setTrueDesire(true);
  assert.equal(toggledOn.consumedAction, false);
  assert.equal(jc.trueDesirePrimed, true);
  assert.equal(jc.trueDesireStacks, 0);
  assert.throws(() => engine.setTrueDesire(false), /unavailable|cancel|primed|activated/i);
  assert.equal(jc.trueDesirePrimed, true);
  assert.equal(jc.trueDesireStacks, 0);
  assert.deepEqual({
    actionNumber: engine.state.actionNumber,
    actorIndex: engine.state.actorIndex,
    actionsUsed: engine.state.turnActionsUsed,
    sp: jc.sp,
    facades: [...jc.facades]
  }, beforeToggle);

  const secondMask = engine.getAvailableActions().find(action => action.skill?.slot === 'S2');
  engine.step({ type: 'skill', skillId: secondMask.skillId, targetId: engine.state.boss.id });
  const trueDesireHits = engine.state.log.filter(event => event.type === 'damage' && event.sourceType === 'awareness_follow_up');
  const elementalHits = trueDesireHits.filter(event => ['fire', 'ice', 'electric', 'wind', 'psychic', 'nuclear', 'bless', 'curse'].includes(event.element));
  assert.equal(jc.trueDesireStacks, 0);
  assert.equal(jc.trueDesirePrimed, false);
  assert.ok(trueDesireHits.length >= 8);
  assert.equal(elementalHits.length, 8);
  assert.ok(elementalHits.every(event => event.targetId === engine.state.boss.id));
  assert.ok(engine.state.log.some(event => event.message.includes('every Facade effect')));
  assert.ok(engine.state.boss.debuffs.some(effect => effect.id === 'jc_two_masks_def_down'));
  assert.deepEqual(jc.facades, []);
  assert.equal(jc.jcNextMaskSlot, 'S1');
});

test('J&C allows either opening mask, then requires the opposite mask and auto-fires Two Masks', () => {
  const twins = lufelCatalog.characters.find(character => character.slug === 'j-c');
  for (const firstSlot of ['S1', 'S2']) {
    const engine = new BattleEngine({
      seed: 808,
      bossId: 'slaughter_drive',
      characterDefinitions: [{ ...twins, awareness: 6 }],
      teamIds: [twins.id],
      jcMaskPair: ['mischief', 'service']
    });
    const jc = engine.state.party[0];
    const autoCount = () => engine.state.log.filter(event => event.type === 'follow_up' && event.message.includes('automatically activated Two Masks')).length;
    const skills = () => engine.getAvailableActions().filter(action => action.type === 'skill');

    assert.deepEqual(jc.selectedMasks, ['mischief', 'service']);
    assert.deepEqual(jc.facades, []);
    assert.ok(skills().find(action => action.skill.slot === 'S1').enabled);
    assert.ok(skills().find(action => action.skill.slot === 'S2').enabled);
    assert.equal(autoCount(), 1);
    assert.equal(engine.recommend().name, 'Mask of Service & Admonition');

    const first = skills().find(action => action.skill.slot === firstSlot);
    engine.step({ type: 'skill', skillId: first.skillId, targetId: engine.state.boss.id });
    const oppositeSlot = firstSlot === 'S1' ? 'S2' : 'S1';
    assert.equal(autoCount(), 1);
    assert.deepEqual(jc.facades, [firstSlot === 'S1' ? 'mischief' : 'service']);
    assert.equal(jc.jcNextMaskSlot, oppositeSlot);
    assert.equal(skills().find(action => action.skill.slot === firstSlot).enabled, false);
    assert.equal(skills().find(action => action.skill.slot === oppositeSlot).enabled, true);

    const second = skills().find(action => action.skill.slot === oppositeSlot);
    const actionNumberBeforeSecond = engine.state.actionNumber;
    let automaticActionNumber = null;
    const resolveAutomatic = engine.resolveJcAutoTwoMasks.bind(engine);
    engine.resolveJcAutoTwoMasks = (actor, timing) => {
      if (timing === 'facades_ready') automaticActionNumber = engine.state.actionNumber;
      return resolveAutomatic(actor, timing);
    };
    const result = engine.step({ type: 'skill', skillId: second.skillId, targetId: engine.state.boss.id });
    assert.deepEqual(jc.facades, []);
    assert.equal(autoCount(), 2);
    assert.equal(automaticActionNumber, actionNumberBeforeSecond);
    assert.equal(engine.state.actionNumber, actionNumberBeforeSecond + 1);
    assert.equal(result.consumedAction, true);
    assert.ok(result.events.some(event => event.type === 'follow_up' && event.message.includes('the moment both Facades became ready')));
  }
});

test('Wonder never receives Revelation effects', () => {
  const baseline = new BattleEngine({ seed: 808 });
  const attempted = new BattleEngine({
    seed: 808,
    loadouts: { wonder: { revelationName: 'Invalid set', revelationCombat: { attackPercent: 0.5, hpPercent: 0.5, damageBonus: 0.5 } } }
  });
  const baseWonder = baseline.state.party.find(unit => unit.id === 'wonder');
  const attemptedWonder = attempted.state.party.find(unit => unit.id === 'wonder');
  assert.equal(attemptedWonder.attack, baseWonder.attack);
  assert.equal(attemptedWonder.maxHp, baseWonder.maxHp);
  assert.equal(attemptedWonder.damageBonus, 0);
  assert.equal(attemptedWonder.revelationName, null);
});
