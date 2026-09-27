import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine } from '../../src/engine.js';
import { lufelCatalog } from '../../src/generated/lufel-catalog.js';
import { characterMechanics } from '../../src/characters/ange-mechanics.js';

test('Ange Prayer Refrain converts up to four held notes into cooldown reduction', () => {
  const unit = { id: 'ange', slug: 'ange', ange: { notes: 7 } };
  const engine = { config: { loadouts: { ange: { characterResearch: { sourceTier: 3 } } } } };
  const prepared = characterMechanics.beforeNavigatorSkill(engine, unit, { slot: 'S2', name: 'Prayer Refrain', cooldown: 8 });
  assert.equal(prepared.angePrayerNotesSpent, 4);
  assert.equal(prepared.cooldown, 4);
});

const character = slug => structuredClone(lufelCatalog.characters.find(unit => unit.slug === slug));
const angeEngine = () => {
  const ange = character('ange');
  return new BattleEngine({ seed: 17, bossId: 'slaughter_drive', teamIds: ['wonder'],
    navigatorDefinition: { ...ange, id: 'navigator-ange' } });
};

test('Ange exposes Da Capo in battle and rewinds the current ally into one special action', () => {
  const engine = angeEngine();
  const ange = engine.state.navigator;
  const wonder = engine.actor;
  wonder.maxHp = 999999;
  wonder.hp = wonder.maxHp;
  const daCapo = engine.getNavigatorActions().find(action => action.name === 'Da Capo');
  assert.ok(daCapo?.enabled);
  wonder.debuffs.push({ id: 'test_debuff', duration: 2 });
  wonder.sp = 70;
  engine.stepNavigator(daCapo.id);
  assert.equal(wonder.debuffs.length, 0);
  assert.equal(ange.ange.daCapoUses, 1);
  assert.equal(engine.getNavigatorActions().find(action => action.name === 'Da Capo')?.statusLabel, 'ACTIVE');
  assert.equal(engine.getNavigatorActions().find(action => action.name === 'Winged Canon')?.enabled, true);
  const savedHp = wonder.hp;
  wonder.hp -= 500;
  wonder.sp = 5;
  wonder.buffs.push({ id: 'after_snapshot', stat: 'attack', value: 9, duration: 1 });

  engine.step({ type: 'guard', skillId: 'guard' });
  assert.equal(engine.actor.id, wonder.id);
  assert.equal(engine.state.characterExtraAction?.reason, 'ange_da_capo');
  assert.equal(wonder.hp, savedHp);
  assert.equal(wonder.sp, 70);
  assert.equal(wonder.buffs.some(buff => buff.id === 'after_snapshot'), false);
  assert.equal(wonder.buffs.some(buff => buff.id === 'ange_da_capo_extra_damage'), true);

  engine.step({ type: 'guard', skillId: 'guard' });
  assert.equal(engine.state.characterExtraAction, null);
  assert.equal(wonder.buffs.some(buff => buff.id.startsWith('ange_da_capo')), false);
  assert.equal(ange.ange.daCapoTargetId, null);
  for (let action = 0; action < 6; action += 1) engine.step({ type: 'guard', skillId: 'guard' });
  assert.equal(ange.ange.daCapoUses, 2);
  assert.equal(ange.ange.daCapoRecharged, true);
});

test('Ange gains action and Highlight notes, shares core stats, and revives once at A2+', () => {
  const engine = angeEngine();
  const ange = engine.state.navigator;
  const wonder = engine.actor;
  assert.ok(wonder.buffs.some(buff => buff.id === 'ange_stat_share'));
  ange.ange.notes = 0;
  ange.ange.totalNotes = 0;
  engine.state.sharedCombat.highlight = 100;
  engine.stepHighlight('wonder');
  assert.equal(ange.ange.notes, 2);
  engine.step({ type: 'guard', skillId: 'guard' });
  assert.equal(ange.ange.notes, 3);

  engine.applyPartyDamage(wonder, wonder.hp + 999999);
  assert.ok(wonder.hp > 0);
  assert.equal(ange.ange.revivalUsed, true);
  engine.applyPartyDamage(wonder, wonder.hp + 999999);
  assert.equal(wonder.hp, 0);
});
