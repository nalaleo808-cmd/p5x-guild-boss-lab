const clone = value => structuredClone(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const fourStarStaticAttack = [.12, .12, .16, .16, .20, .20, .24];
const fourStarSurfAttack = [.22, .29, .29, .36, .36, .43, .43];
const signatureCritDamage = [.363, .363, .472, .472, .581, .581, .69];
const signatureResonanceCritRate = [.164, .214, .214, .264, .264, .314, .314];
const signatureSpendDamage = [.068, .088, .088, .108, .108, .128, .128];

function weaponOptions(engine, unit) {
  const loadout = engine.config?.loadouts?.[unit.id] || {};
  const configured = loadout.characterWeapon ?? loadout.characterResearch;
  if (typeof configured === 'string') return { weapon: configured };
  return configured || {};
}

function applySpendStacks(engine, unit, stacks, sourceType) {
  unit.wavecatcherWeapon.spendStacks = clamp(stacks, 0, 5);
  engine.applyUnitBuff(unit, {
    id: 'miyu_mermaid_dreamer_spend_damage',
    name: `MERMAID DREAMER x${unit.wavecatcherWeapon.spendStacks}`,
    stat: 'damage',
    value: signatureSpendDamage[unit.wavecatcherWeapon.refinement] * unit.wavecatcherWeapon.spendStacks,
    duration: null,
    stacks: unit.wavecatcherWeapon.spendStacks
  }, sourceType);
}

export const characterMechanics = {
  slug: 'puppet-wavecatcher',

  initialize(engine, unit) {
    if (unit.wavecatcherWeapon) return;
    const options = weaponOptions(engine, unit);
    const weapon = options.weapon || 'none';
    if (!['none', 'four-star', 'signature'].includes(weapon)) throw new RangeError('Unknown Wavecatcher weapon');
    const refinement = options.refinement ?? 0;
    if (!Number.isInteger(refinement) || refinement < 0 || refinement > 6) throw new RangeError('refinement must be 0..6');
    unit.wavecatcherWeapon = { weapon, refinement, spendStacks: 0 };
    const staticWeaponStatsIncluded = options.staticWeaponStatsIncluded ?? unit.statsMode === 'equipped';
    if (staticWeaponStatsIncluded || weapon === 'none') return;
    if (weapon === 'four-star') {
      engine.applyUnitBuff(unit, { id: 'miyu_jellie_voyager_static', name: 'JELLIE VOYAGER',
        stat: 'attack', value: fourStarStaticAttack[refinement], duration: null }, 'equipment');
    } else {
      engine.applyUnitBuff(unit, { id: 'miyu_mermaid_dreamer_static', name: 'MERMAID DREAMER',
        stat: 'critDamage', value: signatureCritDamage[refinement], duration: null }, 'equipment');
    }
  },

  beforeSkill(engine, unit, skill, targetId, sourceType) {
    if (unit.wavecatcherWeapon?.weapon === 'signature' && Number(skill.cost || 0) > 0 && unit.sp >= Number(skill.cost || 0)) {
      applySpendStacks(engine, unit, unit.wavecatcherWeapon.spendStacks + 1, sourceType);
    }
    return skill;
  },

  beforeDamage(engine, unit, actor, original, target, sourceType) {
    if (actor.id !== unit.id) return original;
    const resonance = original.damageClass === 'resonance_follow_up'
      || sourceType === 'resonance_follow_up' || original.name === 'Aerial Tide';
    const prepared = { ...original };
    if (unit.awareness >= 2 && unit.surfActive) {
      prepared.temporaryCritDamage = Number(prepared.temporaryCritDamage || 0) + 0.20;
    }
    if (unit.wavecatcherWeapon?.weapon === 'signature' && resonance) {
      prepared.critBonus = Number(prepared.critBonus || 0)
        + signatureResonanceCritRate[unit.wavecatcherWeapon.refinement];
    }
    if (unit.wavecatcherWeapon?.weapon === 'four-star' && unit.surfActive) {
      prepared.temporaryAttackBonus = Number(prepared.temporaryAttackBonus || 0)
        + fourStarSurfAttack[unit.wavecatcherWeapon.refinement];
    }
    return prepared;
  },

  afterSkill(engine, unit, skill, targetId, sourceType) {
    if (sourceType !== 'highlight' || unit.awareness < 4) return;
    engine.applyUnitBuff(unit, {
      id: 'miyu_highlight_resonance_damage', name: 'REFRESHING BEACH RESORT',
      stat: 'resonanceDamage', value: 0.30, duration: 2
    }, 'awareness');
  }
};

export const legacyMethods = {
  isWavecatcher(unit) {
    return unit?.slug === 'puppet-wavecatcher';
  },

  cleanseWavecatcher(unit) {
    const before = unit.debuffs.length;
    unit.debuffs = unit.debuffs.filter(status => !this.isSpiritualOrControlStatus(status));
    return before - unit.debuffs.length;
  },

  surfAdjustedStatus(unit, status) {
    const adjusted = clone(status);
    if (this.isWavecatcher(unit) && unit.surfActive && Number.isFinite(adjusted.duration) && adjusted.duration < 900) {
      adjusted.duration += 1;
    }
    return adjusted;
  }
};
