import { characterResearch } from './akihiko-data.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const owns = unit => unit?.slug === 'akihiko';
const fourStarConditional = [.22,.29,.29,.36,.36,.43,.43];
const signatureCritRate = [.082,.107,.107,.132,.132,.157,.157];
const signatureCriticalDamage = [.34,.44,.44,.54,.54,.64,.64];

function weaponOptions(engine, unit) {
  const loadout = engine.config?.loadouts?.[unit.id] || {};
  const configured = loadout.characterWeapon ?? loadout.characterResearch;
  if (typeof configured === 'string') return { weapon: configured };
  return configured || {};
}

function applySignatureCrit(engine, unit, stacks, sourceType = 'equipment') {
  unit.akihikoWeapon.criticalStacks = clamp(stacks, 0, 2);
  engine.applyUnitBuff(unit, {
    id: 'akihiko_sabazios_crit', name: `SABAZIOS CRIT x${unit.akihikoWeapon.criticalStacks}`,
    stat: 'critRate', value: signatureCritRate[unit.akihikoWeapon.refinement] * unit.akihikoWeapon.criticalStacks,
    duration: 2, stacks: unit.akihikoWeapon.criticalStacks
  }, sourceType);
}

export const characterMechanics = {
  slug: 'akihiko',
  initialize(engine, unit) {
    if (!owns(unit) || unit.akihikoWeapon) return;
    const options = weaponOptions(engine, unit);
    const weapon = options.weapon || 'none';
    if (!['none','four-star','signature'].includes(weapon)) throw new RangeError('Unknown Akihiko weapon');
    const refinement = options.refinement ?? 0;
    if (!Number.isInteger(refinement) || refinement < 0 || refinement > 6) throw new RangeError('refinement must be 0..6');
    unit.akihikoWeapon = { weapon, refinement, criticalStacks: 0 };
    const staticWeaponStatsIncluded = options.staticWeaponStatsIncluded ?? unit.statsMode === 'equipped';
    if (weapon !== 'none' && !staticWeaponStatsIncluded) {
      const rule = characterResearch.weaponRules[weapon];
      engine.applyUnitBuff(unit, { id: `akihiko_${weapon}_static`, name: weapon === 'signature' ? 'SABAZIOS' : 'WICKED CESTUS',
        stat: rule.stat, value: rule.values[refinement], duration: null }, 'equipment');
    }
    if (weapon === 'signature' && unit.mettleStacks > 0) {
      // A0 and A6 are separate opening gains, so A6 opens at the two-stack cap.
      applySignatureCrit(engine, unit, unit.awareness >= 6 ? 2 : 1);
    }
  },
  afterMettleGain(engine, unit, gained, sourceType) {
    if (!owns(unit) || gained <= 0 || unit.akihikoWeapon?.weapon !== 'signature') return;
    applySignatureCrit(engine, unit, unit.akihikoWeapon.criticalStacks + 1, sourceType);
  },
  beforeDamage(engine, owner, actor, original, target, sourceType) {
    if (!owns(owner) || actor.id !== owner.id || owner.akihikoWeapon?.weapon !== 'four-star'
      || owner.gritStacks < 2) return original;
    return { ...original, temporaryAttackBonus: Number(original.temporaryAttackBonus || 0)
      + fourStarConditional[owner.akihikoWeapon.refinement] };
  },
  criticalHitDamageMultiplier(engine, unit, skill, target, sourceType) {
    if (!owns(unit) || unit.akihikoWeapon?.weapon !== 'signature'
      || !['character_skill','highlight','theurgy','resonance','resonance_follow_up'].includes(sourceType)) return 1;
    return 1 + signatureCriticalDamage[unit.akihikoWeapon.refinement];
  }
};

export const legacyMethods = {
  isAkihiko(unit) { return this.usesLiveMechanics() && unit?.slug === 'akihiko'; },

  gainAkihikoGrit(actor, amount = 1, sourceType = 'character_skill') {
    if (!this.isAkihiko(actor) || amount <= 0) return 0;
    const before = actor.gritStacks;
    actor.gritStacks = clamp(before + amount, 0, actor.gritMax);
    const gained = actor.gritStacks - before;
    if (gained) this.emit('resource', `${actor.codename} gained ${gained} Grit.`, {
      actorId: actor.id, resource: 'gritStacks', amount: actor.gritStacks, sourceType, tone: 'buff'
    });
    return gained;
  },

  gainAkihikoMettle(actor, amount = 1, sourceType = 'character_skill') {
    if (!this.isAkihiko(actor) || amount <= 0) return 0;
    const before = actor.mettleStacks;
    actor.mettleStacks = clamp(before + amount, 0, actor.mettleMax);
    const gained = actor.mettleStacks - before;
    if (gained) this.emit('resource', `${actor.codename} gained ${gained} Mettle.`, {
      actorId: actor.id, resource: 'mettleStacks', amount: actor.mettleStacks, sourceType, tone: 'buff'
    });
    if (gained) characterMechanics.afterMettleGain(this, actor, gained, sourceType);
    return gained;
  }
};
