/**
 * Source-independent support-effect primitives. No Kotone coefficients live here.
 * Callers must supply copy eligibility, multiplier, duration and amplification.
 * Unknown effects fail closed; incoming descriptions are never executable code.
 */
export const COPYABLE_SUPPORT_STATS = Object.freeze([
  'attack', 'damage', 'critRate', 'critDamage', 'pierce', 'defense',
  'dotDamage', 'weaknessDamage', 'highlightDamage', 'finalDamage',
  // Marian medicine stats (Reso-Up, 1More-Up, Technica-Up).
  'resonanceDamage', 'oneMoreDamage', 'technicalPrecision'
]);
export const SUPPORT_CLOCKS = Object.freeze(['recipient_normal_turn_end', 'caster_normal_turn_end']);
const knownFields = new Set([
  'id', 'name', 'stat', 'value', 'duration', 'sourceType', 'sourceSkillId', 'sourceActorId',
  'baseValue', 'amplifiedBySkillAmplification', 'provenance', 'copy', 'supportClock',
  'copyEligible', 'ownerId', 'durationKnown', 'durationClock',
  // Marian medicine bookkeeping; a copy keeps only stat, value and duration.
  'potentMedicineType', 'baseDuration', 'effectiveValue', 'effectiveDuration', 'magnitudeSource'
]);
const finiteNonnegative = (value, label) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new TypeError(`${label} must be a finite nonnegative number`);
  return value;
};
export function createSupportRuntime() {
  return { castSequence: 0, effectSequence: 0, copyBatches: [], actions: [], completedActionKeys: [], normalTurnEnds: {}, extraActions: 0, interrupts: 0 };
}
export function effectProvenance(runtime, effect, { casterId = null, skillId = null, castId = null, recipientId, kind = 'buff', sourceType = 'unknown' } = {}) {
  if (!recipientId || !['buff', 'debuff'].includes(kind)) throw new TypeError('Effect recipient and kind are required');
  const instanceId = `effect-${++runtime.effectSequence}`;
  return {
    ...structuredClone(effect),
    provenance: {
      instanceId, originalCasterId: casterId, originalSkillId: skillId,
      originalCastId: castId, recipientId, kind, sourceType,
      // AoE applications of one effect share a root; receiving it is not casting it.
      rootId: casterId && skillId && castId ? `${casterId}/${skillId}/${castId}/${effect.id}` : null,
      appliedById: casterId, isCopy: false
    }
  };
}
export function copyIneligibleReason(effect, sourceCasterIds) {
  if (!effect || typeof effect !== 'object') return 'missing effect';
  const p = effect.provenance;
  if (!p?.rootId || !p.originalCasterId || !p.originalSkillId || !p.originalCastId) return 'unknown original caster or cast';
  if (p.kind !== 'buff') return 'not an ally buff';
  if (p.isCopy || effect.copy) return 'recursive copies are excluded';
  if (!sourceCasterIds.includes(p.originalCasterId)) return 'original caster is not eligible';
  if (effect.copyEligible === false) return 'explicitly excluded';
  if (!COPYABLE_SUPPORT_STATS.includes(effect.stat)) return 'unsupported stat or special effect';
  if (Object.keys(effect).some(key => !knownFields.has(key))) return 'unsupported special-effect fields';
  if (typeof effect.value !== 'number' || !Number.isFinite(effect.value) || effect.value <= 0) return 'not a positive numeric buff';
  if (!Number.isInteger(effect.duration) || effect.duration <= 0 || effect.duration >= 900) return 'unknown, expired or permanent duration';
  return null;
}
/** Pure preparation: no clock advance, RNG draws, resource cost or trigger firing. */
export function prepareSupportCopy(effect, policy) {
  const { sourceCasterIds, recipientId, copyingActorId, copySkillId, batchId, multiplier,
    amplification, duration, clock, countsAsGrant, allowOriginalOnRecipient = false } = policy || {};
  if (!Array.isArray(sourceCasterIds) || !sourceCasterIds.length || sourceCasterIds.some(id => typeof id !== 'string' || !id)) throw new TypeError('Explicit sourceCasterIds required');
  if (![recipientId, copyingActorId, copySkillId, batchId].every(id => typeof id === 'string' && id)) throw new TypeError('Explicit copy identity required');
  finiteNonnegative(multiplier, 'Copy multiplier');
  finiteNonnegative(amplification, 'Copy amplification');
  if (!Number.isInteger(duration) || duration < 1 || duration > 100) throw new TypeError('Explicit finite copied duration required');
  if (!SUPPORT_CLOCKS.includes(clock)) throw new TypeError('Explicit supported copy clock required');
  if (typeof allowOriginalOnRecipient !== 'boolean') throw new TypeError('Copy recipient policy must be explicit boolean');
  if (typeof countsAsGrant !== 'boolean') throw new TypeError('Explicit copied-buff trigger ownership required');
  const reason = copyIneligibleReason(effect, sourceCasterIds);
  if (reason) return { eligible: false, reason };
  const original = effect.provenance;
  const key = `support-copy/${copyingActorId}/${copySkillId}/${recipientId}/${original.originalCasterId}/${original.originalSkillId}/${effect.id}`;
  const sourceValue = effect.value; // Already includes the original caster amplification.
  return { eligible: true, effect: {
    id: key, name: `${effect.name || effect.id} (copy)`, stat: effect.stat,
    value: sourceValue * multiplier * (1 + amplification), duration,
    sourceSkillId: copySkillId, sourceActorId: original.originalCasterId,
    // A copied value is already resolved; generic skill amplification must not run again.
    amplifiedBySkillAmplification: true,
    provenance: { ...structuredClone(original), recipientId, isCopy: true,
      appliedById: copyingActorId, parentInstanceId: original.instanceId, instanceId: `${batchId}/${key}` },
    copy: { batchId, key, sourceValue, multiplier, amplification, countsAsGrant, allowOriginalOnRecipient,
      triggerOwnerId: countsAsGrant ? copyingActorId : null },
    supportClock: { clock, ownerId: clock === 'recipient_normal_turn_end' ? recipientId : copyingActorId }
  } };
}
/** Upsert by source identity, not display label. Separate casters do not overwrite. */
export function commitSupportCopy(runtime, recipient, prepared) {
  if (!prepared?.eligible || !recipient || recipient.id !== prepared.effect.provenance.recipientId) return { applied: false, reason: 'ineligible recipient or effect' };
  const effect = structuredClone(prepared.effect);
  const token = `${effect.copy.batchId}/${effect.provenance.rootId}/${recipient.id}`;
  if (runtime.copyBatches.includes(token)) return { applied: false, reason: 'duplicate copy in this activation' };
  // An original AoE buff already on the recipient must not be copied onto itself.
  if (!effect.copy.allowOriginalOnRecipient && recipient.buffs.some(buff => !buff.provenance?.isCopy && buff.provenance?.rootId === effect.provenance.rootId)) return { applied: false, reason: 'recipient already has the original application' };
  const existing = recipient.buffs.find(buff => buff.copy?.key === effect.copy.key);
  if (existing) Object.assign(existing, effect);
  else recipient.buffs.push(effect);
  runtime.copyBatches.push(token);
  return { applied: true, refreshed: Boolean(existing), effect };
}
export function advanceSupportClocks(runtime, party, { actorId, kind }) {
  if (!['normal_turn_end', 'extra_action', 'interrupt'].includes(kind)) throw new TypeError('Unknown support timing event');
  if (!party.some(unit => unit.id === actorId)) throw new TypeError('Unknown clock owner');
  if (kind === 'extra_action') { runtime.extraActions += 1; return []; }
  if (kind === 'interrupt') { runtime.interrupts += 1; return []; }
  runtime.normalTurnEnds[actorId] = (runtime.normalTurnEnds[actorId] || 0) + 1;
  const expired = [];
  for (const unit of party) {
    unit.buffs = unit.buffs.filter(effect => {
      if (!effect.supportClock || effect.supportClock.ownerId !== actorId) return true;
      if (effect.supportClock.skipOwnerEnd != null && effect.supportClock.skipOwnerEnd === party.find(member => member.id === actorId)?.characterTurnsStarted) return true;
      effect.duration -= 1;
      if (effect.duration > 0) return true;
      expired.push({ recipientId: unit.id, effect: structuredClone(effect) });
      return false;
    });
  }
  return expired;
}
