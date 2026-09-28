import assert from 'node:assert/strict';
import { BattleEngine } from '../../src/engine.js';
import { KOTONE_SHIOMI_ID as K } from '../../src/characters/kotone-shiomi-data.js';
export { K };
export const unit = (id,role='Strategist',attack=1000) => ({id,name:id,codename:id,role,element:'fire',maxHp:100000,maxSp:1000,attack,crit:0,critMult:1.5,actionLimit:1,
 skills:[{id:`${id}-buff`,name:'Fixture support',slot:'S1',element:'support',target:'ally',power:0,cost:0,buff:{id:`${id}-atk`,stat:'attack',value:.2,duration:5}}],
 highlightSkill:{id:`${id}-hl`,name:'Fixture Highlight',slot:'HL',element:'fire',power:1,target:'boss',cost:0}});
export function engine(build={}, options={}) {
 const config={seed:17,teamIds:[K,'wonder','test-dps','test-support'],characterDefinitions:[unit('test-dps','Sweeper',2000),unit('test-support')],
  bossDefinition:{id:'training-boss',name:'Training boss',maxHp:1e10,finiteHp:false,defense:150,weakness:'none',resistance:'none',turnLimit:30,downMax:30,defaultMode:'nexus',scoreMultiplier:1,scoreAttack:true,phases:[{threshold:1,name:'Training',defense:150}],summons:[]},
  // Live Nexus stops at 6 Attack Turns; these long runs ask for the training boss's 30.
  turnLimit:30, sharedHighlightStart:0, ...options,
  loadouts:{wonder:{baseStats:{maxHp:100000,maxSp:1000,attack:1000}},...options.loadouts,[K]:{awareness:0,weaponId:'none',statsMode:'base',baseStats:{attack:2500,maxHp:100000,maxSp:1000,defense:300},...build}}
 };
 return new BattleEngine(config);
}
export const get = (e,id=K) => e.state.party.find(u=>u.id===id);
export function act(e, slot, targetId) {
 const a=e.getAvailableActions().find(a=>a.enabled&&(a.skill?.kotoneSkill===slot||a.type===slot));
 assert.ok(a, `No ${slot} for ${e.actor?.id}: ${e.getAvailableActions().map(a=>a.type+':'+a.name+':'+a.enabled).join(', ')}`);
 return e.step({...a,targetId:targetId||(['S1','S3'].includes(slot)?e.kotoneMechanics.linked.id:e.state.boss.id)});
}
export function advanceToKotone(e) {
 for(let n=0;n<50&&e.state.phase==='battle';n++) {
  if(e.actor?.id===K&&!e.state.sharedCombat.pendingTurnCompletion) return;
  const actions=e.getAvailableActions().filter(a=>a.enabled);
  const a=actions.find(a=>a.type==='skip_extra_actions')||actions.find(a=>a.type==='guard')||actions[0];
  assert.ok(a,'No way to advance'); e.step({...a,targetId:e.state.boss.id});
 }
 throw new Error('Kotone next turn not reached');
}
export function cast(e,slot,targetId=e.kotoneMechanics.linked.id) {
 const k=get(e),s=slot==='HL'?k.highlightSkill:k.skills.find(s=>s.kotoneSkill===slot);
 return e.resolveSkill(k,s,targetId,slot==='HL'?'highlight':'character_skill');
}
export function originalBuff(e,caster='wonder',recipient=e.kotoneMechanics.linked.id,value=.2,extra={}) {
 const target=get(e,recipient);
 const skill={id:`source-${caster}`,slot:'S1',name:'Source buff fixture',element:'support',target:'ally',power:0,cost:0,
 buff:{id:'source-atk',stat:'attack',value,duration:5,...extra}};
 e.resolveSkill(get(e,caster),skill,target.id,caster==='wonder'?'persona_skill':'character_skill');
 return target.buffs.find(b=>b.provenance?.originalCasterId===caster&&b.provenance?.originalSkillId===skill.id&&!b.provenance.isCopy);
}
export const copies = e => e.kotoneMechanics.linked.buffs.filter(b=>b.provenance?.isCopy);
export function finishFortune(e,slots=['S1','S1','S2']) {for(const s of slots) act(e,s);}
export function finishCold(e) {for(let n=0;n<2;n++){advanceToKotone(e);act(e,'kotone_cold');}advanceToKotone(e);}
export const near=(a,b,eps=1e-9)=>assert.ok(Math.abs(a-b)<eps,`${a} differs from ${b}`);
