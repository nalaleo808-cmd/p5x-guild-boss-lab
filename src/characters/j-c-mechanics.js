const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const signatureStaticAttack = [.30, .30, .39, .39, .48, .48, .57];
const signatureDesireBonus = [.10, .13, .13, .16, .16, .19, .19];
const signatureFacadePartyBonus = [.13, .17, .17, .21, .21, .25, .25];

function weaponOptions(engine, unit) {
  const loadout = engine.config?.loadouts?.[unit.id] || {};
  const configured = loadout.characterWeapon ?? loadout.characterResearch;
  if (typeof configured === 'string') return { weapon: configured };
  return configured || {};
}

export const characterMechanics = {
  slug: 'j-c',

  initialize(engine, unit) {
    if (unit.jcWeapon) return;
    const options = weaponOptions(engine, unit);
    const weapon = options.weapon || 'none';
    if (!['none', 'four-star', 'signature'].includes(weapon)) throw new RangeError('Unknown J&C weapon');
    const refinement = options.refinement ?? 0;
    if (!Number.isInteger(refinement) || refinement < 0 || refinement > 6) throw new RangeError('refinement must be 0..6');
    unit.jcWeapon = { weapon, refinement };
    const staticWeaponStatsIncluded = options.staticWeaponStatsIncluded ?? unit.statsMode === 'equipped';
    if (weapon === 'signature' && !staticWeaponStatsIncluded) {
      engine.applyUnitBuff(unit, {
        id: 'jc_wardens_judgement_attack', name: "WARDEN'S JUDGEMENT",
        stat: 'attack', value: signatureStaticAttack[refinement], duration: null
      }, 'equipment');
    }
    if (weapon === 'signature' && unit.facades.length) {
      engine.applyJcWeaponFacadeGain(unit, unit.facades.length, 'equipment');
    }
  }
};

export const legacyMethods = {
  isJc(unit) {
    return unit?.slug === 'j-c';
  },

  grantJcFacade(actor, facade) {
    if (!facade || actor.facades.includes(facade)) return;
    actor.facades.push(facade);
    this.applyJcFacadeAwareness(actor, facade);
    this.applyJcWeaponFacadeGain(actor, 1, 'equipment');
    this.emit('resource', `${actor.codename} gained Facade of ${facade}.`, { actorId: actor.id, resource: 'facade', facade, tone: 'buff' });
  },

  jcEffectiveDesire(actor, twoMasks = false) {
    const weapon = actor?.jcWeapon;
    const bonus = twoMasks && weapon?.weapon === 'signature'
      ? signatureDesireBonus[weapon.refinement]
      : 0;
    return Number(actor?.desireLevel || 0) + bonus * 100;
  },

  applyJcWeaponFacadeGain(actor, amount = 1, sourceType = 'equipment') {
    const weapon = actor?.jcWeapon;
    if (weapon?.weapon !== 'signature' || amount <= 0) return;
    const perStack = signatureFacadePartyBonus[weapon.refinement];
    for (const unit of this.state.party) {
      const existing = unit.buffs.find(effect => effect.id === 'jc_one_winged_butterfly_damage');
      const stacks = clamp(Number(existing?.stacks || 0) + amount, 0, 2);
      this.applyUnitBuff(unit, {
        id: 'jc_one_winged_butterfly_damage', name: 'ONE-WINGED BUTTERFLY',
        stat: 'damage', value: perStack * stacks, duration: 2, stacks
      }, sourceType);
      this.applyUnitBuff(unit, {
        id: 'jc_one_winged_butterfly_crit_damage', name: 'ONE-WINGED BUTTERFLY',
        stat: 'critDamage', value: perStack * stacks, duration: 2, stacks
      }, sourceType);
    }
  },

  applyJcFacadeAwareness(actor, facade) {
    if (actor.awareness < 2) return;
    if (facade === 'mischief') {
      for (const unit of this.state.party) this.applyUnitBuff(unit, { id: 'jc_a2_mischief', name: 'FACADE ATK', stat: 'attack', value: 0.3, duration: 2 }, 'awareness');
    } else if (facade === 'absurdity') {
      const target = this.state.party.filter(unit => unit.id !== actor.id && ['Sweeper', 'Assassin'].includes(unit.role)).sort((a, b) => b.attack - a.attack)[0];
      if (target) this.applyUnitBuff(target, { id: 'jc_a2_absurdity', name: 'FACADE CRIT DMG', stat: 'critDamage', value: 0.2, duration: 2 }, 'awareness');
    } else if (facade === 'luck') {
      this.applyUnitBuff(actor, { id: 'jc_a2_luck', name: 'FACADE SKILL DMG', stat: 'damage', value: 0.1, duration: 2 }, 'awareness');
    }
  }
};
