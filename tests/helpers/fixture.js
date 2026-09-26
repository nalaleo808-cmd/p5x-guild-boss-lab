// Synthetic fixtures ONLY. These are not Kotone's skills, weapon stats or rules.
import { BattleEngine } from '../../src/engine.js';
export const directBuff = (id='fixture-buff',value=.2) => ({id,slot:'S1',name:'Synthetic support buff',element:'support',cost:7,power:0,target:'ally',buff:{id:'fixture-attack',name:'Fixture Attack',stat:'attack',value,duration:4}});
export const extraSkill = {id:'fixture-extra-skill',slot:'S2',name:'Synthetic extra skill',element:'fire',cost:11,power:1,target:'boss',supportExecutable:true};
export const highlightSkill = {id:'fixture-hl',slot:'HL',name:'Synthetic Highlight',element:'fire',cost:0,power:1,target:'boss',supportExecutable:true};
export const theurgySkill = {id:'fixture-theurgy',slot:'THEURGY',name:'Synthetic Theurgy',element:'fire',cost:0,power:1,target:'boss',supportExecutable:true,supportActionKind:'theurgy'};
export function fixtureEngine(overrides={}) {
  const unit = id => ({id,name:id,codename:id,element:'fire',role:'Test fixture',maxHp:10000,maxSp:1000,attack:500,crit:0,critMult:1.5,skills:[directBuff(),extraSkill,theurgySkill],highlightSkill});
  return new BattleEngine({seed:808,teamIds:['wonder','fixture-source','fixture-recipient','fixture-other'],characterDefinitions:['fixture-source','fixture-recipient','fixture-other'].map(unit),...overrides});
}
export function castFixtureBuff(engine,casterId='fixture-source',recipientId='fixture-other',value=.2,skillId='fixture-buff') {
  const caster=engine.state.party.find(unit=>unit.id===casterId);
  engine.resolveSkill(caster,directBuff(skillId,value),recipientId,casterId==='wonder'?'persona_skill':'character_skill');
  return engine.state.party.find(unit=>unit.id===recipientId).buffs.at(-1);
}
export function fixturePolicy(overrides={}) {
  return {sourceCasterIds:['fixture-source'],recipientId:'fixture-recipient',copyingActorId:'fixture-other',copySkillId:'fixture-copy',batchId:'fixture-batch-1',multiplier:1.7,amplification:0,duration:2,clock:'recipient_normal_turn_end',countsAsGrant:false,...overrides};
}
export function coreState(engine) {
  const state=structuredClone(engine.state);
  for(const key of ['log','history','lastEvents','supportRuntime']) delete state[key];
  const strip = value => {
    if (!value || typeof value !== 'object') return;
    delete value.provenance;
    for (const child of Object.values(value)) strip(child);
  };
  strip(state);
  return state;
}
