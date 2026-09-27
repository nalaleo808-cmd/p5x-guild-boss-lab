import { sourceTier } from './okyann-data.js';

const owns = unit => unit?.slug === 'okyann';
const attack = unit => Number(unit.attack || 0) * (1 + (unit.buffs || []).filter(buff => buff.stat === 'attack')
  .reduce((sum, buff) => sum + buff.value, 0)) + (unit.buffs || []).filter(buff => buff.stat === 'flatAttack')
  .reduce((sum, buff) => sum + buff.value, 0);
const buffParty = (engine, id, name, stat, value, duration) => {
  for (const ally of engine.state.party.filter(unit => unit.hp > 0)) engine.applyUnitBuff(ally, { id, name, stat, value, duration }, 'navigator');
};
function grantBeats(engine, unit, amount) {
  unit.okyann.beats += amount;
  while (unit.okyann.beats >= 4) {
    unit.okyann.beats -= 4;
    const level = unit.level ?? 80;
    const strength = level >= 70 ? .2 : level >= 50 ? .15 : .1;
    for (const ally of engine.state.party.filter(member => member.hp > 0)) {
      const previous = ally.buffs.find(buff => buff.id === 'okyann_rhythm_attack');
      const stacks = Math.min(3, (previous?.rhythmStacks || 0) + 1);
      for (const [stat, value] of [['attack', strength], ['defense', strength], ['ailmentAccuracy', strength / 2]]) {
        engine.applyUnitBuff(ally, { id: `okyann_rhythm_${stat}`, name: 'Pulsating Rhythm', stat,
          value: value * stacks, rhythmStacks: stacks, duration: 2 }, 'navigator');
      }
    }
    if (unit.awareness >= 2 && engine.random() < .2) unit.okyann.beats += 1;
  }
}

export const characterMechanics = {
  slug: 'okyann',
  initialize(engine, unit) {
    if (!owns(unit) || unit.okyann) return;
    sourceTier(engine, unit);
    unit.okyann = { beats: unit.awareness >= 1 ? 2 : 0 };
    unit.cooldowns ??= {};
    for (const skill of unit.skills) unit.cooldowns[skill.id] = skill.initialCooldown ?? skill.cooldown;
    if (unit.awareness >= 1) buffParty(engine, 'okyann_opening_accuracy', 'Finish with a Smile', 'ailmentAccuracy', .35, 1);
  },
  beforeNavigatorSkill(engine, unit, action) {
    if (!owns(unit) || !unit.okyann || !action.characterAction?.startsWith('okyann:')) return action;
    const tier = sourceTier(engine, unit);
    const prepared = { ...action, okyannAttack: Math.min(attack(unit), [4500, 4950, 5400, 5850][tier]), okyannTier: tier };
    // Generic navigator path restores SP once; the after hook only grants Beats.
    if (action.characterAction === 'okyann:S2') prepared.spRestore = [22, 27, 26, 31][tier];
    return prepared;
  },
  afterNavigatorSkill(engine, unit, action) {
    if (!owns(unit) || !unit.okyann) return;
    const tier = action.okyannTier;
    if (!Number.isInteger(tier)) return;
    if (action.characterAction === 'okyann:S1') {
      buffParty(engine, 'okyann_club_attack', 'Club Okyann', 'flatAttack', .12 * action.okyannAttack, 1);
      buffParty(engine, 'okyann_club_accuracy', 'Club Okyann', 'ailmentAccuracy', [.35, .385, .378, .413][tier], 1);
      grantBeats(engine, unit, 1);
    }
    if (action.characterAction === 'okyann:S2') grantBeats(engine, unit, 3);
    if (action.characterAction === 'okyann:S3') {
      buffParty(engine, 'okyann_retro_damage', 'Retro Dance Number', 'damage',
        [.10, .11, .108, .118][tier] + action.okyannAttack / 225 * .01, 3);
      grantBeats(engine, unit, 2);
    }
  }
};
