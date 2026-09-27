import { characterResearch } from './howler-data.js';

const own = unit => unit?.slug === characterResearch.slug;
const options = (engine, unit) => engine.config?.loadouts?.[unit.id]?.characterResearch || {};
const tier = (engine, unit) => {
  const value = options(engine, unit).sourceTier ?? 3;
  if (!Number.isInteger(value) || value < 0 || value > 3) throw new RangeError('sourceTier must be 0..3');
  return value;
};
const data = { s1Cap: [.264, .291, .280, .307], s2Base: [.146, .146, .155, .155], s2Cap: [.537, .592, .570, .625], blazeWelcome: [1.098, 1.098, 1.166, 1.166], blazeFurrocious: [2.196, 2.196, 2.331, 2.331], welcomeTaken: [.410, .452, .435, .477], furrociousTaken: [.586, .646, .622, .682], welcomeExposure: [.205, .226, .218, .239], furrociousExposure: [.390, .430, .414, .454], weapon4Accuracy: [.220, .285, .285, .350, .350, .415, .415], signatureAccuracy: [.230, .280, .280, .330, .330, .380, .380], signatureWelcomeDef: [.166, .216, .216, .266, .266, .316, .316], signatureFurrociousDef: [.333, .433, .433, .533, .533, .633, .633] };
const clean = original => {
  const skill = { ...original };
  for (const key of ['buff', 'buffTarget', 'debuff', 'heal', 'healAttack', 'healFlat', 'healTarget', 'spRestore', 'actionBonus']) delete skill[key];
  return skill;
};
const buff = (engine, unit, id, stat, value, duration = null, sourceType = 'character_passive', extra = {}) => engine.applyUnitBuff(unit, { id: `howler_${id}`, name: id, stat, value, duration, ...extra }, sourceType);
function accuracy(unit) { return Math.max(0, Number(unit.ailmentAccuracy || 0) + unit.buffs.filter(effect => effect.stat === 'ailmentAccuracy').reduce((sum, effect) => sum + Number(effect.value || 0), 0)); }
function refreshPeppy(engine, unit) { buff(engine, unit, 'peppy_guard_dog', 'attack', .60 * accuracy(unit)); }
function initializeBase(engine, unit) {
  if (!own(unit) || unit.researchedCharacter) return false;
  tier(engine, unit);
  const o = options(engine, unit), weapon = o.weapon === 'signature' ? 'weapon5-1' : o.weapon === 'four-star' ? 'weapon4-1' : null;
  if (o.weapon && !['none', 'signature', 'four-star'].includes(o.weapon)) throw new RangeError('Unknown weapon');
  const refinement = o.refinement ?? 0;
  if (!Number.isInteger(refinement) || refinement < 0 || refinement > 6) throw new RangeError('refinement must be 0..6');
  unit.researchedCharacter = { slug: characterResearch.slug };
  unit.buffs ||= [];
  unit.howler = { bigWelcome: unit.awareness >= 6 ? 2 : 0, furrocious: unit.awareness >= 6 ? 2 : 0, weapon, refinement, packetKeys: new Set() };
  if (weapon && !o.staticWeaponStatsIncluded) {
    const first = characterResearch.weapons[weapon].description.split('\n')[0];
    const values = first.match(/[\d.]+(?=%)/g)?.slice(0, 7).map(Number);
    if (!values || values.length !== 7) throw new Error('Howler weapon static values could not be parsed');
    const stat = weapon === 'weapon5-1' ? 'ailmentAccuracy' : 'attack';
    buff(engine, unit, 'weapon_static', stat, values[refinement] / 100, null, 'equipment');
  }
  refreshPeppy(engine, unit);
  return true;
}
function unavailable(unit, skill, sourceType) {
  if (!own(unit) || sourceType !== 'character_skill' || skill.slot !== 'S3') return null;
  return !unit.howler?.bigWelcome && !unit.howler?.furrocious ? 'Woof Woof Blaze requires Big Welcome or Furrocious Follow-Up.' : null;
}
function targetList(engine, skill, targetId, context = {}) {
  return (context.targets || (skill.target === 'all_enemies' ? engine.enemies : [engine.findEnemy(targetId)])).map(target => typeof target === 'string' ? engine.findEnemy(target) : target).filter(target => target?.alive !== false);
}

export const characterMechanics = {
  slug: 'howler',
  initialize(engine, unit) { initializeBase(engine, unit); },
  actionUnavailableReason(engine, unit, skill, sourceType) { return unavailable(unit, skill, sourceType); },
  beforeSkill(engine, actor, original, targetId, sourceType) {
    if (!own(actor) || sourceType !== 'character_skill') return original;
    const blocked = unavailable(actor, original, sourceType);
    if (blocked) throw new Error(blocked);
    const skill = clean(original), t = tier(engine, actor), a = accuracy(actor);
    if (skill.slot === 'S1' || skill.slot === 'S2') skill.debuff = { id: `howler_defense_${actor.id}`, name: 'HOWLER Defense reduction', stat: 'defenseDown', value: skill.slot === 'S1' ? Math.min(.154 * a, data.s1Cap[t]) : data.s2Base[t] + Math.min(.314 * a, data.s2Cap[t]), duration: actor.awareness >= 6 ? 3 : 2 };
    if (skill.slot === 'S3') {
      const welcome = actor.howler.bigWelcome > 0, furrocious = actor.howler.furrocious > 0;
      skill.howlerBranch = welcome ? 'welcome' : 'furrocious';
      skill.howlerDual = actor.awareness >= 6 && welcome && furrocious;
      skill.target = welcome ? 'all_enemies' : 'boss';
      skill.power = (welcome ? data.blazeWelcome : data.blazeFurrocious)[t];
      skill.damageClass = 'resonance_follow_up';
      if (skill.howlerDual) skill.additionalHits = [{ power: data.blazeFurrocious[t], targetId, damageClass: 'resonance_follow_up' }];
    }
    return skill;
  },
  afterSkill(engine, actor, skill, targetId, sourceType, context = {}) {
    if (!own(actor) || !['character_skill', 'highlight'].includes(sourceType) || !actor.howler) return;
    const state = actor.howler, t = tier(engine, actor);
    if (sourceType === 'highlight') {
      const stacks = actor.awareness >= 4 ? 4 : 2;
      for (const target of targetList(engine, skill, targetId, context)) engine.applyEnemyStatus(target, 'debuffs', {
        id: `howler_fuse_${actor.id}`, name: 'ENTHUSIASTIC FUSE', howlerFuseOwner: actor.id,
        stacks, value: Math.min(.229 * accuracy(actor), data.s2Cap[t]), duration: null
      }, sourceType, actor.id);
      return;
    }
    if (skill.slot === 'S1') state.bigWelcome = 2;
    if (skill.slot === 'S2') state.furrocious = 2;
    if (['S1', 'S2'].includes(skill.slot)) {
      for (const target of targetList(engine, skill, targetId, context)) engine.applyEnemyStatus(target, 'debuffs', { id: `howler_branch_${actor.id}`, name: 'HOWLER Defense branch', howlerOwner: actor.id, howlerBranch: skill.slot, duration: actor.awareness >= 6 ? 3 : 2, value: 0 }, sourceType, actor.id);
      buff(engine, actor, 'faithful_dog', 'attack', .33, 1, 'passive');
      if (state.weapon === 'four-star') { buff(engine, actor, 'weapon4_stance_accuracy', 'ailmentAccuracy', data.weapon4Accuracy[state.refinement], 2, 'equipment'); refreshPeppy(engine, actor); }
    }
    if (skill.slot !== 'S3') return;
    const welcome = skill.howlerBranch === 'welcome', dual = skill.howlerDual, duration = actor.awareness >= 6 ? 3 : 2;
    const allTargets = targetList(engine, skill, targetId, context), main = engine.findEnemy(targetId) || engine.state.boss;
    for (const target of allTargets) {
      const general = welcome ? Math.min(.24 * accuracy(actor), data.welcomeTaken[t]) : Math.min(.343 * accuracy(actor), data.furrociousTaken[t]);
      engine.applyEnemyStatus(target, 'debuffs', { id: `howler_blaze_${actor.id}`, name: 'Woof Woof Blaze', howlerOwner: actor.id, damageTaken: true, value: general, duration }, sourceType, actor.id);
      engine.applyEnemyStatus(target, 'debuffs', { id: `howler_blaze_elements_${actor.id}`, name: 'Woof Woof Blaze elemental exposure', howlerOwner: actor.id, howlerExposure: 'elements', exposureValue: data.welcomeExposure[t] + (actor.awareness >= 1 ? .36 : 0) + (dual ? .30 : 0), duration, value: 0 }, sourceType, actor.id);
      if (state.weapon === 'weapon5-1') engine.applyEnemyStatus(target, 'debuffs', { id: `howler_weapon_blaze_def_${actor.id}`, name: 'Cerberus Claws', stat: 'defenseDown', value: data.signatureWelcomeDef[state.refinement], duration: 3 }, 'equipment', actor.id);
    }
    if (!welcome || dual) {
      engine.applyEnemyStatus(main, 'debuffs', { id: `howler_blaze_resonance_${actor.id}`, name: 'Woof Woof Blaze Resonance exposure', howlerOwner: actor.id, howlerExposure: 'resonance', exposureValue: data.furrociousExposure[t] + (actor.awareness >= 1 ? .50 : 0) + (dual ? .60 : 0), duration, value: 0 }, sourceType, actor.id);
      if (state.weapon === 'weapon5-1') engine.applyEnemyStatus(main, 'debuffs', { id: `howler_weapon_blaze_def_${actor.id}`, name: 'Cerberus Claws', stat: 'defenseDown', value: data.signatureFurrociousDef[state.refinement], duration: 3 }, 'equipment', actor.id);
    }
    state.bigWelcome = 0; state.furrocious = 0;
  },
  beforeDamage(engine, owner, actor, original, target, sourceType) {
    if (!own(owner) || owner.hp <= 0) return original;
    const skill = { ...original }, statuses = (target.debuffs || []).filter(status => status.howlerOwner === owner.id), elemental = ['fire', 'ice', 'electric', 'wind'].includes(skill.element), resonance = (skill.damageClass || sourceType) === 'resonance_follow_up';
    if (elemental && ['character_skill', 'persona_skill', 'highlight', 'theurgy', 'resonance_follow_up'].includes(sourceType) && statuses.some(status => status.howlerBranch === 'S1')) skill.temporaryDefenseDown = Number(skill.temporaryDefenseDown || 0) + [.264, .264, .280, .280][tier(engine, owner)];
    for (const status of statuses) if ((status.howlerExposure === 'elements' && elemental) || (status.howlerExposure === 'resonance' && resonance)) skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + status.exposureValue;
    if (owner.awareness >= 2 && statuses.length) skill.temporaryCritDamage = Number(skill.temporaryCritDamage || 0) + .36;
    const fuse = (target.debuffs || []).find(status => status.howlerFuseOwner === owner.id && status.stacks > 0);
    if (fuse && (elemental || resonance)) skill.actionDamageBonus = Number(skill.actionDamageBonus || 0) + fuse.value;
    return skill;
  },
  onDamage(engine, owner, packet) {
    if (!own(owner) || packet.actualDamage <= 0) return;
    const state = owner.howler, key = `${engine.state.attackTurn}:${packet.actor.id}:${packet.skill.id}:${packet.sourceType}`;
    if (!state.packetKeys.has(key) && (['fire', 'ice', 'electric', 'wind'].includes(packet.skill.element) || (packet.skill.damageClass || packet.sourceType) === 'resonance_follow_up')) {
      state.packetKeys.add(key); if (state.packetKeys.size > 80) state.packetKeys.clear();
      buff(engine, packet.actor, `faithful_dog_${owner.id}`, 'attack', .33, 1, 'passive');
      if (state.weapon === 'weapon5-1') { buff(engine, owner, 'weapon5_ally_accuracy', 'ailmentAccuracy', data.signatureAccuracy[state.refinement], 2, 'equipment'); refreshPeppy(engine, owner); }
    }
    const fuse = (packet.target.debuffs || []).find(status => status.howlerFuseOwner === owner.id && status.stacks > 0);
    if (fuse && packet.actor.id !== owner.id && (['fire', 'ice', 'electric', 'wind'].includes(packet.skill.element) || (packet.skill.damageClass || packet.sourceType) === 'resonance_follow_up')) fuse.stacks -= 1;
  },
  onTurnEnd(engine, unit) {
    if (!own(unit) || !unit.howler) return;
    unit.howler.bigWelcome = Math.max(0, unit.howler.bigWelcome - 1);
    unit.howler.furrocious = Math.max(0, unit.howler.furrocious - 1);
  }
};
