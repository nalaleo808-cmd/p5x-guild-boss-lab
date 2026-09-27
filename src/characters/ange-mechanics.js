import { characterResearch } from './ange-data.js';
const own = unit => unit?.slug === characterResearch.slug;
function options(engine, unit) { return engine.config?.loadouts?.[unit.id]?.characterResearch || {}; }
function tier(engine, unit) {
  const value = options(engine, unit).sourceTier ?? 3;
  if (!Number.isInteger(value) || value < 0 || value > 3) throw new RangeError('sourceTier must be 0..3');
  return value;
}
function clean(original) {
  const skill = { ...original };
  for (const key of ['buff','buffTarget','debuff','heal','healAttack','healFlat','healTarget','spRestore','actionBonus']) delete skill[key];
  return skill;
}
function buff(engine, unit, id, stat, value, duration = null, source = 'character_passive', metadata = {}) {
  engine.applyUnitBuff(unit, { id: characterResearch.slug + '_' + id, name: id, stat, value, duration, ...metadata }, source);
}
function initializeBase(engine, unit) {
  if (!own(unit) || unit.researchedCharacter) return false;
  tier(engine, unit);
  unit.researchedCharacter = { slug: characterResearch.slug };
  unit.buffs ||= [];
  const o = options(engine, unit);
  const weapon = o.weapon === 'signature' ? 'weapon5-1' : o.weapon === 'four-star' ? 'weapon4-1' : null;
  if (o.weapon && !['none','signature','four-star'].includes(o.weapon)) throw new RangeError('Unknown weapon');
  const refinement = o.refinement ?? 0;
  if (!Number.isInteger(refinement) || refinement < 0 || refinement > 6) throw new RangeError('refinement must be 0..6');
  if (weapon && !o.staticWeaponStatsIncluded) {
    const description = characterResearch.weapons[weapon].description;
    const first = description.split('\n')[0];
    const values = first.match(/[\d.]+(?=%)/g).slice(0,7).map(Number);
    const stat = first.startsWith('Increase critical damage') ? 'critDamage'
      : first.startsWith('Increase ailment accuracy') ? 'ailmentAccuracy' : 'attack';
    // The first seven refinement numbers were reviewed separately from conditional effects.
    buff(engine, unit, 'weapon_static', stat, values[refinement] / 100, null, 'equipment');
  }
  return true;
}
function accuracy(unit) {
  return Math.max(0, Number(unit.ailmentAccuracy || 0) + (unit.buffs || []).filter(b => b.stat === 'ailmentAccuracy').reduce((s,b) => s + b.value, 0));
}
function deny(reason) { if (reason) throw new Error(reason); }

function attack(unit) {
  const base = Number(unit.mechanicAttack ?? unit.attack);
  return base * (1 + (unit.buffs || []).filter(b=>b.stat==='attack').reduce((s,b)=>s+b.value,0))
    + (unit.buffs || []).filter(b=>b.stat==='flatAttack').reduce((s,b)=>s+b.value,0);
}
function heal(engine,unit,manual) {
  const t = tier(engine,unit), amount = ([.10,.10,.112,.112][t]*attack(unit)+[681,816,989,1124][t])*(manual?1.5:1);
  for (const ally of engine.state.party.filter(u=>u.hp>0)) {
    engine.healUnit(unit,ally,amount);
    if (manual && ally.debuffs?.length) ally.debuffs.shift();
  }
}
export function gainMusicalNotes(engine,unit,count,{overflow=false}={}) {
  if (!own(unit) || !unit.ange) throw new Error('Ange not initialized');
  if (!Number.isInteger(count) || count < 0) throw new RangeError('Musical Notes must be a nonnegative integer');
  const prior = unit.ange.totalNotes;
  const cap = overflow ? 14 : 12;
  const gained = Math.max(0, Math.min(count,cap-unit.ange.notes));
  unit.ange.notes += gained;
  unit.ange.totalNotes += gained;
  if (gained && unit.ange.weapon === 'signature') {
    const stacks = Math.min(12, (unit.ange.angelicChorus || 0) + gained);
    unit.ange.angelicChorus = stacks;
    const t = unit.ange.refinement;
    for (const ally of engine.state.party.filter(u=>u.hp>0)) {
      buff(engine, ally, 'angelic_chorus', 'damage', stacks * [.007,.009,.009,.011,.011,.013,.013][t], null, 'equipment', { stacks });
      if (stacks === 12) buff(engine, ally, 'angelic_chorus_crit', 'critDamage', [.153,.199,.199,.245,.245,.291,.291][t], null, 'equipment');
    }
  }
  for (const ally of engine.state.party.filter(u=>u.hp>0)) buff(engine,ally,'heavenly_voice','pierce',Math.min(12,unit.ange.totalNotes)*.01);
  const heals = Math.floor(unit.ange.totalNotes/12)-Math.floor(prior/12);
  for (let i=0;i<heals;i++) heal(engine,unit,false);
  return gained;
}
function reason(engine,unit,skill,sourceType) {
  if (!own(unit)) return null;
  if (/Stat Buff/.test(skill.name || '')) return 'Stat Buff is Ange\'s passive navigator stat share, not an active Highlight.';
  if (skill.angeDaCapo && unit.ange.daCapoUses <= 0) return 'No Da Capo uses remaining.';
  if (skill.angeDaCapo && (unit.ange.daCapoTargetId || unit.ange.daCapoActive)) return 'Da Capo is already active on an ally.';
  return null;
}
function removeBuff(unit, id) {
  unit.buffs = (unit.buffs || []).filter(effect => effect.id !== id);
}
function snapshot(unit) {
  return structuredClone({
    hp: unit.hp, sp: unit.sp, buffs: unit.buffs || [], debuffs: unit.debuffs || [],
    skillCooldowns: unit.skillCooldowns || {}, highlightCooldowns: unit.highlightCooldowns || {},
    highlightCooldownGrace: unit.highlightCooldownGrace || {}
  });
}
function restore(unit, saved) {
  unit.hp = saved.hp;
  unit.sp = saved.sp;
  unit.buffs = structuredClone(saved.buffs);
  unit.debuffs = structuredClone(saved.debuffs);
  unit.skillCooldowns = structuredClone(saved.skillCooldowns);
  unit.highlightCooldowns = structuredClone(saved.highlightCooldowns);
  unit.highlightCooldownGrace = structuredClone(saved.highlightCooldownGrace);
}
export const characterMechanics = {
  slug: 'ange',
  initialize(engine,unit) {
    if (!initializeBase(engine,unit)) return;
    const o=options(engine,unit), weapon=o.weapon==='signature'?'signature':o.weapon==='four-star'?'four-star':'none', refinement=o.refinement??0;
    unit.ange = { notes:0,totalNotes:0,weapon,refinement,angelicChorus:0,
      daCapoUses: unit.awareness >= 6 ? 2 : 1, daCapoRechargeProgress: 0,
      daCapoRecharged: false, daCapoTargetId: null, daCapoSnapshot: null,
      daCapoPending: false, daCapoActive: false, revivalUsed: false };
    unit.cooldowns ||= {};
    for (const skill of unit.skills || []) unit.cooldowns[skill.id] = Math.max(0,({S1:4,S2:8,S3:4}[skill.slot] ?? skill.cooldown ?? 0)-(unit.awareness>=1?4:0));
    if (unit.awareness>=1) gainMusicalNotes(engine,unit,12);
    if (unit.awareness>=4) gainMusicalNotes(engine,unit,2,{overflow:true});
    // Navigator stat sharing in P5X applies the three core combat stats.
    for (const ally of engine.state.party) {
      const hpShare = Math.round(Number(unit.maxHp || 0) * .20);
      const defenseShare = Number(unit.defense || 0) * .20;
      const attackShare = Number(unit.attack || 0) * .20;
      ally.maxHp += hpShare;
      ally.hp += hpShare;
      ally.attack = Number(ally.attack || 0) + attackShare;
      ally.defense = Number(ally.defense || 0) + defenseShare;
      if (Number.isFinite(Number(ally.mechanicMaxHp))) ally.mechanicMaxHp += hpShare;
      if (Number.isFinite(Number(ally.mechanicAttack))) ally.mechanicAttack += attackShare;
      buff(engine, ally, 'stat_share', 'navigatorStatShare', .20, null, 'navigator', {
        attackShare, defenseShare, hpShare
      });
    }
  },
  actionUnavailableReason: reason,
  getAdditionalNavigatorActions(engine, unit) {
    if (!own(unit) || !unit.ange) return [];
    return [{ id: 'ange-da-capo', slot: 'EX', name: 'Da Capo', target: 'current_ally',
      cooldown: 0, power: 0, angeDaCapo: true, navigatorIndependent: true,
      unavailableStatusLabel: unit.ange.daCapoUses <= 0 ? 'EMPTY' : 'ACTIVE',
      note: `Cleanse the current ally, preserve their pre-action state, then rewind it and grant a special additional action. Uses: ${unit.ange.daCapoUses}.` }];
  },
  beforeNavigatorSkill(engine,unit,original) {
    if (!own(unit)) return original;
    deny(reason(engine,unit,original,'navigator'));
    const skill=clean(original);
    if (skill.angeDaCapo) return skill;
    skill.cooldown={S1:4,S2:8,S3:4}[skill.slot] ?? skill.cooldown;
    if (skill.slot==='S2' && unit.ange.notes) {
      const spent=Math.min(4,unit.ange.notes);
      skill.angePrayerNotesSpent=spent;
      skill.cooldown=Math.max(0,skill.cooldown-spent);
    }
    return skill;
  },
  afterNavigatorSkill(engine,unit,skill) {
    if (!own(unit)) return;
    const t=tier(engine,unit), a=attack(unit), allies=engine.state.party.filter(u=>u.hp>0);
    if (skill.angeDaCapo) {
      const target = engine.actor;
      unit.ange.daCapoUses -= 1;
      if (target.debuffs?.length) target.debuffs.shift();
      buff(engine,target,'da_capo_attack','attack',.375,null,'navigator');
      unit.ange.daCapoTargetId = target.id;
      unit.ange.daCapoSnapshot = snapshot(target);
      unit.ange.daCapoPending = false;
      engine.emit('buff', `Da Capo is ready on ${target.codename}.`, {
        actorId: unit.id, targetId: target.id, sourceType: 'navigator', tone: 'buff'
      });
      return;
    }
    if (skill.slot==='S1') {
      for(const ally of allies) engine.applyUnitBuff(ally,{id:'damage_up',name:'Winged Canon',stat:'damage',value:[.070,.077,.078,.085][t]+Math.min(a/164*.01,[.280,.308,.314,.342][t]),duration:2},'navigator');
      gainMusicalNotes(engine,unit,4);
    }
    if (skill.slot==='S2') { heal(engine,unit,true); unit.ange.notes=Math.max(0,unit.ange.notes-Number(skill.angePrayerNotesSpent||0)); }
    if (skill.slot==='S3') {
      const capped=Math.min(a,[4600,5060,5980,6440][t]), notes=unit.ange.notes;
      for (const ally of allies) {
        buff(engine,ally,'melody_flat','flatAttack',.11*capped+[128,140,143,156][t],2,'navigator');
        buff(engine,ally,'melody_attack','attack',notes*capped/460*.001,2,'navigator');
        buff(engine,ally,'melody_pierce','pierce',notes*capped/460*.001,2,'navigator');
        if(unit.awareness>=1) buff(engine,ally,'allegro','critRate',.12,2,'navigator');
      }
      unit.ange.notes=0;
    }
    if (unit.ange.weapon==='four-star' && ['S1','S2','S3'].includes(skill.slot)) {
      const prior=unit.buffs.find(effect=>effect.id==='ange_divine_muse');
      const stacks=Math.min(2,Number(prior?.stacks||0)+1);
      buff(engine,unit,'divine_muse','attack',stacks*[.11,.145,.145,.18,.18,.215,.215][unit.ange.refinement],null,'equipment',{stacks});
    }
  },
  onAllyActionEnd(engine, unit, actor, context = {}) {
    if (!own(unit) || !unit.ange || actor.hp <= 0) return;
    gainMusicalNotes(engine, unit, 1);
    if (unit.ange.daCapoUses < (unit.awareness >= 6 ? 2 : 1) && !unit.ange.daCapoRecharged
      && actor.id === 'wonder' && context.isExtraAction !== true && context.wasConcertAction !== true) {
      unit.ange.daCapoRechargeProgress += 1;
      if (unit.ange.daCapoRechargeProgress >= 7) {
        unit.ange.daCapoUses += 1;
        unit.ange.daCapoRecharged = true;
        engine.emit('resource', `${unit.codename} restored 1 Da Capo use.`, {
          actorId: unit.id, resource: 'daCapoUses', amount: unit.ange.daCapoUses,
          sourceType: 'awareness', tone: 'buff'
        });
      }
    }
    if (actor.id !== unit.ange.daCapoTargetId) return;
    if (context.isExtraAction === true) {
      removeBuff(actor, 'ange_da_capo_attack');
      removeBuff(actor, 'ange_da_capo_extra_damage');
      Object.assign(unit.ange, { daCapoTargetId: null, daCapoSnapshot: null,
        daCapoPending: false, daCapoActive: false });
    } else {
      unit.ange.daCapoPending = true;
    }
  },
  getAllyExtraActionRequest(engine, unit, actor) {
    if (!own(unit) || !unit.ange?.daCapoPending || unit.ange.daCapoActive
      || unit.ange.daCapoTargetId !== actor.id) return null;
    return { reason: 'ange_da_capo', controllerId: unit.id };
  },
  onAllyExtraActionStart(engine, unit, actor) {
    if (!own(unit) || !unit.ange?.daCapoPending || unit.ange.daCapoTargetId !== actor.id
      || !unit.ange.daCapoSnapshot) return false;
    restore(actor, unit.ange.daCapoSnapshot);
    unit.ange.daCapoPending = false;
    unit.ange.daCapoActive = true;
    if (unit.awareness >= 2) buff(engine,actor,'da_capo_extra_damage','finalDamage',.12,null,'awareness');
    engine.emit('rewind', `Da Capo restored ${actor.codename}'s pre-action state.`, {
      actorId: unit.id, targetId: actor.id, sourceType: 'character_extra_action', tone: 'phase'
    });
    return true;
  },
  onAllySpecialAction(engine, unit, actor, context = {}) {
    if (!own(unit) || !unit.ange || unit.awareness < 4) return;
    if (['highlight','theurgy'].includes(context.actionType)) gainMusicalNotes(engine,unit,2,{overflow:true});
  },
  onAllyKnockout(engine, unit, target) {
    if (!own(unit) || !unit.ange || unit.awareness < 2 || unit.ange.revivalUsed || target.hp > 0) return;
    unit.ange.revivalUsed = true;
    target.hp = Math.min(target.maxHp, Math.max(1, Math.round(attack(unit) * .20 + 2000)));
    engine.emit('revive', `${unit.codename} revived ${target.codename} with ${target.hp.toLocaleString()} HP.`, {
      actorId: unit.id, targetId: target.id, amount: target.hp, sourceType: 'awareness', tone: 'heal'
    });
  }
};
