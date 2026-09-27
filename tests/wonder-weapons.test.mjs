import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../src/engine.js';
import {
  CURSED_TIES_LIVE_PROFILE_ID,
  CURSED_TIES_WEAPON_ID,
  WONDER_WEAPON_DATAMINE_SOURCE,
  WONDER_WEAPON_RANK6_CALIBRATION,
  getDefaultWonderWeaponProfileId,
  getWonderWeaponDefinition,
  getWonderWeaponProfile,
  listWonderWeaponDefinitions
} from '../src/wonder-weapons.js';
import {
  createWonderWeaponEffectState,
  wonderWeaponBattleStart,
  wonderWeaponOnDamage,
  wonderWeaponOnTurnEnd,
  wonderWeaponPassiveEffects,
  wonderWeaponThresholdEffects
} from '../src/wonder-weapon-effects.js';

test('Wonder weapon catalog contains all 18 protagonist weapons from the Steam datamine', () => {
  const weapons = listWonderWeaponDefinitions();

  assert.equal(weapons.length, 18);
  assert.deepEqual(weapons.map(weapon => weapon.datamineId), Array.from({ length: 18 }, (_, index) => 200101 + index));
  assert.equal(weapons[0].name, 'Damascus Knife');
  assert.equal(weapons.at(-1).name, 'Event Horizon');
  assert.equal(WONDER_WEAPON_DATAMINE_SOURCE.steamBuildId, 22780114);
});

test('every Wonder weapon retains its audited source identity, stats, passive, formulas, and rank 6 provenance', () => {
  const expected = [
    ['damascus-knife', 200101, 'Damascus Knife', 2, [1189, 330, 220], 'Soaring Spirit', ['f500211']],
    ['fatal-knife', 200102, 'Fatal Knife', 3, [1427, 396, 264], 'Unravel', ['f500312']],
    ['midnight-sun', 200103, 'Midnight Sun', 4, [1902, 528, 352], 'Upward Shift', ['f500412', 'f500411']],
    ['sennight-inferno', 200104, 'Sennight Inferno', 5, [2140, 594, 396], 'Corroding Lava', ['f500514', 'f500512', 'f500513']],
    ['all-in', 200105, 'All In', 5, [2140, 594, 396], 'Protecting Light', ['f500613', 'f500611', 'f500612']],
    ['arc-knife', 200106, 'Arc Knife', 5, [1926, 654, 396], 'Power of Creation', ['f500721', 'f500731', 'f500741', 'f500751']],
    ['ex-machina', 200107, 'Ex Machina', 5, [2051, 654, 356], 'Overboost', ['f500811', 'f500812', 'f500813', 'f500814']],
    ['glimmer', 200108, 'Glimmer', 5, [1926, 654, 396], 'Holy Resonance', ['f500911', 'f500914', 'f500912', 'f500913']],
    ['eye-of-obsequies', 200109, 'Eye of Obsequies', 5, [1926, 654, 396], 'Eye of the Abyss', ['f590011', 'f590012', 'f590016', 'f590013', 'f590014']],
    ['starry-compass', 200110, 'Starry Compass', 5, [2051, 654, 356], 'Read the Stars', ['f590111', 'f590112', 'f590113', 'f590114']],
    ['abyss-fang', 200111, 'Abyss Fang', 5, [1926, 689, 356], "Hunter's Instinct", ['f590230', 'f590237', 'f590231', 'f590232', 'f590235', 'f590236']],
    ['purgatory', 200112, 'Purgatory', 5, [2051, 654, 356], 'Inferno of Nothingness', ['f590311', 'f590312', 'f590313', 'f590314', 'f590315', 'f590316']],
    ['plasma-blade', 200113, 'Plasma Blade', 5, [2051, 654, 356], 'Harmonic Element', ['f590411', 'f590431', 'f590432', 'f590435']],
    ['pheromone-sting', 200114, 'Pheromone Sting', 5, [1926, 654, 396], 'Infestation', ['f590521', 'f590531', 'f590532', 'f590542', 'f590544']],
    ['cyclotron', 200115, 'Cyclotron', 5, [2051, 654, 356], 'Magnetized Plasma', ['f590621', 'f590631', 'f590641', 'f590642']],
    ['cursed-ties', 200116, 'Cursed Ties', 5, [1926, 654, 396], 'Evil Eye', ['f590721', 'f590731', 'f590744', 'f590743']],
    ['ice-age', 200117, 'Ice Age', 5, [2051, 654, 356], 'Ancient Frost', ['f590821', 'f590832', 'f590841', 'f590842']],
    ['event-horizon', 200118, 'Event Horizon', 5, [2051, 654, 356], 'Spaghettification', ['f590921', 'f590932', 'f590941', 'f590942']]
  ];
  for (const [id, datamineId, name, rarity, stats, passive, formulaIds] of expected) {
    const weapon = getWonderWeaponDefinition(id);
    const profile = getWonderWeaponProfile(id);
    assert.equal(weapon.datamineId, datamineId);
    assert.equal(weapon.name, name);
    assert.equal(weapon.rarity, rarity);
    assert.equal(weapon.skillName, passive);
    assert.deepEqual(weapon.formulaIds, formulaIds);
    assert.deepEqual(Object.values(profile.weaponStats), stats);
    assert.ok(profile.forge.rank6Description);
    assert.match(profile.forge.rank6FormulaStatus, /self_contained_local_a6_formula|lufel_a6_cross_check_with_local_formula/);
    assert.match(profile.forge.rank6DescriptionProvenance, /steam_datamine_2026-09-19|user_lufel_live_interactive_2026-09-21/);
  }
});

test('datamined Wonder profiles expose level 80 rank 6 component stats', () => {
  const iceAge = getWonderWeaponDefinition('ice-age');
  const profile = getWonderWeaponProfile('ice-age', getDefaultWonderWeaponProfileId('ice-age'));

  assert.equal(iceAge.datamineId, 200117);
  assert.equal(iceAge.skillName, 'Ancient Frost');
  assert.deepEqual(profile.configuration, { level: 80, userRank: 6 });
  assert.deepEqual(profile.weaponStats, { maxHp: 2051, attack: 654, defense: 356 });
  assert.equal(profile.forge.runtimeImplemented, true);
  assert.equal(profile.forge.runtimeStatus, 'partial');
});

test('Cursed Ties keeps its verified live profile and combat adapter data', () => {
  const profile = getWonderWeaponProfile(CURSED_TIES_WEAPON_ID, CURSED_TIES_LIVE_PROFILE_ID);

  assert.equal(getDefaultWonderWeaponProfileId(CURSED_TIES_WEAPON_ID), CURSED_TIES_LIVE_PROFILE_ID);
  assert.equal(profile.forge.runtimeImplemented, true);
  assert.equal(profile.forge.runtimeStatus, 'partial');
  assert.equal(profile.forge.evilEye.defenseDown, 0.25);
  assert.equal(profile.forge.evilEye.curseDamageTaken, 0.16);
  assert.equal(profile.forge.conflictingPriorObservation.values.defenseDown, 0.229);
});

test('A6 calibration separates self-contained formulas from Lufel cross-check values', () => {
  assert.deepEqual(WONDER_WEAPON_RANK6_CALIBRATION.localFormulaRuntimeVariables, ['f86', 'f87', 'f88']);
  assert.equal(WONDER_WEAPON_RANK6_CALIBRATION.localFormulaRuntimeVariableMapping, 'unresolved_in_steam_export');
  assert.equal(WONDER_WEAPON_RANK6_CALIBRATION.refinementInput, 6);
  assert.equal(getWonderWeaponProfile('damascus-knife').forge.rank6Description, 'Attack +21.5%.');
  assert.match(getWonderWeaponProfile('cyclotron').forge.rank6Description, /critical rate \+19.0%/);
  assert.match(getWonderWeaponProfile('sennight-inferno').forge.rank6Description, /Defense -30.0%/);
});

test('Starry Compass pure adapter starts, gains, thresholds, and drains Guidance', () => {
  let result = wonderWeaponBattleStart(createWonderWeaponEffectState('starry-compass'));
  assert.equal(result.state.guidance, 10);
  result = wonderWeaponOnDamage(result.state, { actorId: 'miyu', partyIds: ['wonder', 'miyu'] });
  assert.equal(result.state.guidance, 11);
  assert.equal(wonderWeaponThresholdEffects(result.state).length, 2);
  result = wonderWeaponOnTurnEnd(result.state, { actorId: 'wonder' });
  assert.equal(result.state.guidance, 6);
});

test('Cursed Ties pure adapter requires an explicit successful roll', () => {
  const state = createWonderWeaponEffectState(CURSED_TIES_WEAPON_ID);
  assert.equal(wonderWeaponOnDamage(state, { actorId: 'miyu', actorSide: 'ally', targetId: 'boss', element: 'curse', roll: 0.7 }).effects.length, 0);
  const result = wonderWeaponOnDamage(state, { actorId: 'miyu', actorSide: 'ally', targetId: 'boss', element: 'curse', roll: 0.699 });
  assert.deepEqual(result.effects[0].changes, { defenseDown: 0.25, curseDamageTakenBonus: 0.16 });
});

test('Event Horizon grants and caps team stacks through Nuclear skill damage', () => {
  let result = wonderWeaponBattleStart(createWonderWeaponEffectState('event-horizon'), { partyIds: ['wonder', 'miyu'] });
  result = wonderWeaponOnDamage(result.state, { actorId: 'miyu', actorSide: 'ally', element: 'nuclear', isSkillDamage: true, partyIds: ['wonder', 'miyu'] });
  assert.deepEqual(result.state.spaghettificationStacks, { wonder: 2, miyu: 2 });
});

test('enemy damage cannot trigger ally-owned Wonder weapon passives', () => {
  const starry = wonderWeaponOnDamage(wonderWeaponBattleStart(createWonderWeaponEffectState('starry-compass')).state, { actorId: 'boss', actorSide: 'enemy' });
  assert.equal(starry.state.guidance, 10);
  const purgatory = wonderWeaponOnDamage(createWonderWeaponEffectState('purgatory'), { actorId: 'boss', actorSide: 'enemy', element: 'fire', isSkillDamage: true });
  assert.equal(purgatory.state.trialByFire, 0);
  const cyclotron = wonderWeaponOnDamage(createWonderWeaponEffectState('cyclotron'), { actorId: 'boss', actorSide: 'enemy', element: 'electric' });
  assert.equal(cyclotron.effects.length, 0);
  const cursed = wonderWeaponOnDamage(createWonderWeaponEffectState('cursed-ties'), { actorId: 'boss', actorSide: 'enemy', targetId: 'wonder', element: 'curse', roll: 0 });
  assert.equal(cursed.effects.length, 0);
  const horizon = wonderWeaponOnDamage(wonderWeaponBattleStart(createWonderWeaponEffectState('event-horizon'), { partyIds: ['wonder'] }).state, { actorId: 'boss', actorSide: 'enemy', element: 'nuclear', isSkillDamage: true, partyIds: ['wonder'] });
  assert.deepEqual(horizon.state.spaghettificationStacks, { wonder: 2 });
});

test('public adapter states and effect payloads are deeply immutable', () => {
  const state = createWonderWeaponEffectState('event-horizon');
  assert.throws(() => state.infestationTargetIds.push('foe'), TypeError);
  const result = wonderWeaponOnDamage(createWonderWeaponEffectState('cursed-ties'), { actorId: 'miyu', actorSide: 'ally', targetId: 'foe', element: 'curse', roll: 0 });
  assert.throws(() => { result.effects[0].changes.defenseDown = 0; }, TypeError);
});

test('every weapon has a pure passive descriptor and stateful families expose their conditions', () => {
  for (const weapon of listWonderWeaponDefinitions()) {
    assert.ok(wonderWeaponPassiveEffects(createWonderWeaponEffectState(weapon.id)).length > 0, weapon.name);
  }
  const hunter = wonderWeaponOnDamage(createWonderWeaponEffectState('abyss-fang'), { actorId: 'wonder', actorSide: 'ally', isSkillDamage: true });
  assert.equal(wonderWeaponPassiveEffects(hunter.state).some(item => item.id === 'abyss-fang-three-stack-critical'), true);
  const fire = wonderWeaponBattleStart(createWonderWeaponEffectState('purgatory'));
  assert.equal(wonderWeaponPassiveEffects(fire.state).some(item => item.id === 'purgatory-one-stack'), true);
  const plasma = wonderWeaponBattleStart(createWonderWeaponEffectState('plasma-blade'));
  assert.equal(wonderWeaponPassiveEffects(plasma.state, { activeFlamesOfDesire: 2 }).some(item => item.id === 'plasma-blade-harmonic-two'), true);
  assert.deepEqual(wonderWeaponPassiveEffects(createWonderWeaponEffectState('event-horizon')).at(-1).changes,
    { attackFlatBonusPerAffectedAlly: 100, spaghettificationAttackBonus: 0.11, nuclearCriticalDamageBonus: 0.1 });
  assert.equal(wonderWeaponPassiveEffects(createWonderWeaponEffectState('purgatory'))[0].source,
    'user_lufel_live_interactive_2026-09-21');
  assert.equal(wonderWeaponPassiveEffects(createWonderWeaponEffectState('cyclotron'))[0].source,
    'steam_datamine_2026-09-19');
});

test('BattleEngine carries a selected catalog Wonder weapon with its configured component-stat policy', () => {
  const weaponId = 'starry-compass';
  const weaponProfileId = getDefaultWonderWeaponProfileId(weaponId);
  const engine = new BattleEngine({
    seed: 19,
    loadouts: { wonder: { weaponId, weaponProfileId } }
  });
  const wonder = engine.state.party.find(unit => unit.id === 'wonder');

  assert.equal(wonder.wonderWeapon.weaponId, weaponId);
  assert.equal(wonder.wonderWeapon.profileId, weaponProfileId);
  assert.deepEqual(wonder.wonderWeapon.weaponStats, { maxHp: 2051, attack: 654, defense: 356 });
  assert.equal(wonder.wonderWeapon.componentStatsApplied, true);
  assert.equal(wonder.wonderWeapon.forge.runtimeImplemented, true);
  assert.equal(wonder.wonderWeapon.forge.runtimeStatus, 'partial');
});
