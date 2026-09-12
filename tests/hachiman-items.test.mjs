import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine, CURRENT_MECHANICS_PROFILE, RECORDED_MECHANICS_PROFILE } from '../src/engine.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';

const character = slug => structuredClone(lufelCatalog.characters.find(unit => unit.slug === slug));

function fixture(extra = {}) {
  const marian = character('marian-beachflower');
  const berry = character('berry');
  return new BattleEngine({
    mechanicsProfile: CURRENT_MECHANICS_PROFILE, bossId: 'hachiman', modeId: 'multidimensional',
    teamIds: [marian.id, berry.id], characterDefinitions: [marian, berry],
    sharedHighlightGain: 17, ...extra
  });
}

test('live Hachiman exposes the four observed ordinary items with bounded inventory', () => {
  // Attacker Tablet and Fighter Salve from the Dreamscape recording; DOT-Up and
  // HL-Up from Sleepy's DOD rotation (2026-09-09).
  const engine = fixture();
  assert.deepEqual(engine.state.itemInventory, { attack_tablet: 1, fighter_salve: 1, dot_up: 1, highlight_up: 1 });
  // A6 Summer Marian does not consume medicine (Joker, 2026-09-11): unlimited uses, one per turn.
  assert.equal(engine.state.itemMaxUses, Infinity);
  assert.equal(engine.state.itemUsesRemaining, Infinity);
  assert.deepEqual(engine.getItemActions().map(action => [action.type, action.itemId, action.skillId, action.remaining, action.usesRemaining]), [
    ['item', 'attack_tablet', 'attack_tablet', 1, Infinity],
    ['item', 'fighter_salve', 'fighter_salve', 1, Infinity],
    ['item', 'dot_up', 'dot_up', 1, Infinity],
    ['item', 'highlight_up', 'highlight_up', 1, Infinity]
  ]);
  const attack = engine.getItemActions().find(action => action.itemId === 'attack_tablet');
  assert.equal(attack.baseValue, 0.3);
  assert.equal(attack.baseDuration, 1);
  assert.equal(attack.effectiveValue, 0.36);
  assert.equal(attack.effectiveDuration, 3);
  assert.equal(fixture({ itemInventory: { attack_tablet: 12 } }).state.itemInventory.attack_tablet, 10);
});

test('Flower Basket use preserves inventory and shared Highlight while ordinary item counts one turn once', () => {
  const engine = fixture();
  const marian = engine.actor;
  const berry = engine.state.party.find(unit => unit.slug === 'berry');
  marian.midsummerPrescription = 2;
  marian.lastMedicineCharacterTurn = -1;
  engine.state.sharedCombat.highlight = 76;
  berry.hp = Math.floor(berry.maxHp / 2);
  const hpBefore = berry.hp;

  const freeFighter = engine.getMedicineActions().find(action => action.id === 'fighter_salve');
  const freeResult = engine.stepMedicine(freeFighter.id, berry.id);
  assert.equal(freeResult.consumedAction, false);
  assert.equal(engine.actor.id, marian.id);
  assert.equal(marian.midsummerPrescription, 1);
  assert.equal(engine.state.itemInventory.fighter_salve, 1);
  assert.equal(engine.state.sharedCombat.highlight, 76);

  const ordinaryAttack = engine.getAvailableActions().find(action => action.type === 'item' && action.itemId === 'attack_tablet');
  const ordinaryResult = engine.step({ type: 'item', skillId: ordinaryAttack.skillId, targetId: berry.id });
  assert.equal(ordinaryResult.consumedAction, true);
  assert.equal(engine.actor.id, berry.id);
  assert.equal(engine.state.itemInventory.attack_tablet, 0);
  assert.equal(engine.state.itemUsesRemaining, Infinity);
  assert.equal(marian.midsummerPrescription, 1);
  assert.equal(engine.state.sharedCombat.highlight, 93);
  assert.ok(berry.hp > hpBefore, 'Marian’s sourced medicine heal remains formula-driven for either path');
  assert.equal(berry.buffs.find(buff => buff.id === 'medicine_attack')?.value, 0.36);
  assert.equal(berry.buffs.find(buff => buff.id === 'medicine_attack')?.duration, 3);
});

test('items stay manual-only and obey direct pending-action and Concert completion rules', () => {
  const engine = fixture();
  const berry = engine.state.party.find(unit => unit.slug === 'berry');
  const inventoryBefore = structuredClone(engine.state.itemInventory);
  assert.notEqual(engine.recommend()?.type, 'item');
  assert.deepEqual(engine.state.itemInventory, inventoryBefore);

  engine.state.sharedCombat.pendingTurnCompletion = true;
  assert.deepEqual(engine.getItemActions(), []);
  assert.throws(() => engine.stepItem('attack_tablet', berry.id), /unavailable/i);
  engine.state.sharedCombat.pendingTurnCompletion = false;
  engine.state.navigator.codename = 'MIKU';
  engine.state.navigator.virtualConcert = { active: true, roundsRemaining: 2, savedTurn: null };
  engine.state.sharedCombat.highlight = 0;
  const actionNumber = engine.state.actionNumber;
  engine.step({ type: 'item', skillId: 'attack_tablet', targetId: berry.id });
  assert.equal(engine.state.sharedCombat.highlight, 34);
  assert.equal(engine.state.actionNumber, actionNumber);
  assert.equal(engine.state.itemInventory.attack_tablet, 0);
});

test('ordinary items are unavailable outside the exact live Hachiman Dreamscape profile', () => {
  const liveOtherMode = new BattleEngine({ mechanicsProfile: CURRENT_MECHANICS_PROFILE, bossId: 'hachiman', modeId: 'nexus' });
  const recorded = new BattleEngine({ mechanicsProfile: RECORDED_MECHANICS_PROFILE, bossId: 'hachiman', modeId: 'multidimensional' });
  assert.deepEqual(liveOtherMode.getItemActions(), []);
  assert.deepEqual(recorded.getItemActions(), []);
  assert.equal(liveOtherMode.state.itemMaxUses, 0);
  assert.equal(recorded.state.itemUsesRemaining, 0);
});

test('recorded Flower Basket keeps its legacy duration, A6, crit, and heal behavior', () => {
  const marian = character('marian-beachflower');
  const berry = character('berry');
  const engine = new BattleEngine({
    mechanicsProfile: RECORDED_MECHANICS_PROFILE, bossId: 'slaughter_drive',
    characterDefinitions: [marian, berry], teamIds: [marian.id, berry.id],
    loadouts: { [marian.id]: { baseStats: { critMult: 246.4 } } }
  });
  const target = engine.state.party.find(unit => unit.id === berry.id);
  target.hp = Math.floor(target.maxHp / 2);
  const hpBefore = target.hp;
  engine.actor.midsummerPrescription = 1;
  const tablet = engine.getMedicineActions().find(action => action.id === 'attack_tablet');

  assert.equal(tablet.buff.duration, 2);
  assert.equal(tablet.effectiveDuration, undefined);
  engine.stepMedicine(tablet.id, target.id);

  assert.equal(target.buffs.find(buff => buff.id === 'medicine_attack')?.value, 0.36);
  assert.equal(target.buffs.find(buff => buff.id === 'medicine_attack')?.duration, 2);
  assert.ok(target.buffs.some(buff => buff.id === 'medicine_crit_damage'));
  assert.ok(target.buffs.some(buff => buff.id === 'marian_a6_refresh'));
  assert.ok(target.hp > hpBefore);
});
