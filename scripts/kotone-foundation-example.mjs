/** Reproducible engineering example. NOT a Kotone balance/gameplay demonstration. */
import { fixtureEngine,castFixtureBuff,fixturePolicy } from '../tests/helpers/fixture.js';
import { createGoForBrokeBudget,spendGoForBrokeUse } from '../src/characters/kotone-shiomi-mechanics.js';
function run(name,{copy=false,componentAttack=0,staticAttackRatio=0}={}){
 const e=fixtureEngine();
 const stats=e.setSupportEquipmentStats('fixture-source',{mode:'base',baseAttack:500,componentAttack,staticAttackRatio,selectedWeaponId:name});
 const original=castFixtureBuff(e,'fixture-source','fixture-other',stats.attack/5000);
 if(copy)e.copySupportEffects([original],fixturePolicy());
 e.queueSupportAction({actorId:'fixture-recipient',skillId:'fixture-extra-skill',targetId:e.state.boss.id,kind:'extra_skill',ignoreCost:false,idempotencyKey:'demonstration',triggeringActorId:'fixture-other'});
 const result=e.resolveNextSupportAction();
 return {name,sourceAttack:stats.attack,copiedAttackRatio:e.state.party[2].buffs[0]?.value||0,damage:result.reward,normalActionNumber:e.state.actionNumber};
}
const budget=createGoForBrokeBudget(6);
const output={
 scope:'SYNTHETIC ENGINEERING FIXTURES ONLY. These are not Kotone skills or published weapon arrays.',
 values:'Fixture copy multiplier 1.7; source buff = fixture Attack / 5000; weapon component/passive values below are arbitrary test inputs.',
 cases:[run('baseline'),run('copy-only',{copy:true}),run('synthetic-equipment-A',{copy:true,componentAttack:31,staticAttackRatio:.07}),run('synthetic-equipment-B',{copy:true,componentAttack:61,staticAttackRatio:.12})],
 A6UseCountOnly:[spendGoForBrokeUse(budget,'first'),spendGoForBrokeUse(budget,'second'),spendGoForBrokeUse(budget,'third')],
 missing:'Full Kotone source-dependent kit, awareness eligibility, Arcana Link, bonds, Fortune, Cold, weapons and automatic activations remain pending.'
};
console.log(JSON.stringify(output,null,2));
