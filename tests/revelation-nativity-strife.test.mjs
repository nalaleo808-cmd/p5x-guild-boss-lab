import test from 'node:test';
import assert from 'node:assert/strict';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';
import { withRevelationMainOverlay, withRevelationSetOverlay } from '../src/revelation-overlay.js';
import { engine, get, act, K, near } from './helpers/kotone.js';

const critBuff = (unit, wearer = K) => unit.buffs.find(buff => buff.id === `revelation_nativity_strife_crit_${wearer}`);
const nativityStrife = { revelationMain: 'Nativity', revelationSet: 'Strife' };

test('Revelation overlay adds Strife under Nativity and the Strife 4-set values, without touching the catalog', () => {
  const mains = withRevelationMainOverlay(lufelCatalog.revelationMains);
  const sets = withRevelationSetOverlay(lufelCatalog.revelationSets);
  assert.deepEqual(mains.find(main => main.name === 'Nativity').compatibleSubs, ['Power', 'Strife']);
  const strife = sets.find(set => set.name === 'Strife');
  assert.deepEqual(strife.combat.elementBonus, { element: 'fire', value: 0.1 });
  assert.equal(strife.combat.attackPercent, 0.15);
  assert.deepEqual(strife.combat.weakElementAttack, { element: 'fire', value: 0.15 });
  assert.ok(strife.compatibleMains.includes('Nativity'));
  assert.deepEqual(lufelCatalog.revelationMains.find(main => main.name === 'Nativity').compatibleSubs, ['Power']);
});

test('Strife 4-set adds 15% Attack only against a Fire-weak target, live profile only', () => {
  const e = engine({ revelationCombat: { weakElementAttack: { element: 'fire', value: 0.15 } } });
  const kotone = get(e);
  assert.equal(e.revelationWeakElementAttackBonus(kotone, { weakness: 'fire' }), 0.15);
  assert.equal(e.revelationWeakElementAttackBonus(kotone, { weakness: 'ice' }), 0);
  assert.equal(e.revelationWeakElementAttackBonus(kotone, { weaknesses: ['wind', 'fire'] }), 0.15);
  assert.equal(e.revelationWeakElementAttackBonus(get(e, 'wonder'), { weakness: 'fire' }), 0);
});

test('Nativity + Strife: one stack at battle start, a second at an extra action, capped at two, party-wide and permanent', () => {
  const e = engine(nativityStrife);
  for (const unit of e.state.party) {
    const buff = critBuff(unit);
    assert.ok(buff, `${unit.id} missing Nativity + Strife`);
    near(buff.value, 0.1); assert.equal(buff.duration, null);
  }
  e.notifyExtraActionStart(get(e), 'test extra action');
  for (const unit of e.state.party) near(critBuff(unit).value, 0.2);
  e.notifyExtraActionStart(get(e), 'test extra action');
  for (const unit of e.state.party) near(critBuff(unit).value, 0.2);
  assert.equal(get(e).nativityStrifeStacks, 2);
  assert.equal(e.state.party.reduce((n, unit) => n + unit.buffs.filter(buff => buff.id.startsWith('revelation_nativity_strife')).length, 0), e.state.party.length);
});

test('Nativity + Strife needs both pieces and the live profile', () => {
  assert.equal(critBuff(get(engine({ revelationMain: 'Nativity', revelationSet: 'Power' }))), undefined);
  assert.equal(critBuff(get(engine({ revelationMain: 'Acceptance', revelationSet: 'Strife' }))), undefined);
  const e = engine(nativityStrife);
  e.notifyExtraActionStart(get(e, 'wonder'), 'not the wearer');
  near(critBuff(get(e)).value, 0.1);
});

test('Kotone Fortune extra actions count as extra actions for Nativity + Strife', () => {
  const e = engine(nativityStrife);
  near(critBuff(get(e)).value, 0.1);
  act(e, 'kotone_assist');
  near(critBuff(get(e)).value, 0.1);
  act(e, 'S1'); // Fortune normal action; the next action is an extra action
  near(critBuff(get(e)).value, 0.2);
  act(e, 'S1');
  near(critBuff(get(e)).value, 0.2);
});

test('Kotone A1+ starts the battle linked at Lunar Bond 5 (A6 included)', () => {
  for (const awareness of [0, 1, 6]) {
    const m = engine({ awareness }).kotoneMechanics;
    assert.equal(m.state.linkedId, 'test-dps');
    assert.equal(m.state.lunarBond, awareness >= 1 ? 5 : 0, `A${awareness}`);
    assert.equal(m.state.goForBroke.limit, awareness === 6 ? 2 : 1);
  }
});
