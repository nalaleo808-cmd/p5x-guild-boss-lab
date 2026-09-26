import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleEngine, RECORDED_MECHANICS_PROFILE } from '../src/engine.js';
import { copyIneligibleReason, prepareSupportCopy, createSupportRuntime, effectProvenance } from '../src/combat/support-effects.js';
import { enhancementValue, equippedAttack, grantStack } from '../src/combat/weapon-stats.js';
import { normalizeKotoneDraft, createGoForBrokeBudget, spendGoForBrokeUse, loadKotoneDraft, saveKotoneDraft } from '../src/characters/kotone-shiomi-mechanics.js';
import { kotoneShiomi } from '../src/characters/kotone-shiomi-data.js';
import { fixtureEngine, fixturePolicy, castFixtureBuff, directBuff, coreState } from './helpers/fixture.js';
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);

test('Identity is Shiomi, not Montagne; experimental ordinary profile is playable',()=>{
 assert.equal(kotoneShiomi.id,'kotone-shiomi');assert.equal(kotoneShiomi.playable,true);
 assert.equal(kotoneShiomi.mindscapeCore,false);
 assert.ok(new BattleEngine({teamIds:['wonder',kotoneShiomi.id]}).kotoneMechanics.active);
 assert.throws(()=>new BattleEngine({teamIds:['wonder',kotoneShiomi.id], mechanicsProfile:RECORDED_MECHANICS_PROFILE}),/archived recorded/);
});
for(let awareness=0;awareness<=6;awareness++) test(`User-specified Go for Broke use-count gate A${awareness} (not complete skill)`,()=>{
 const budget=createGoForBrokeBudget(awareness);
 assert.equal(spendGoForBrokeUse(budget,'first').ok,true);
 assert.equal(spendGoForBrokeUse(budget,'first').reason,'duplicate activation');
 assert.equal(spendGoForBrokeUse(budget,'second').ok,awareness===6);
 assert.equal(spendGoForBrokeUse(budget,'third').ok,false);
 assert.equal(budget.used,awareness===6?2:1);
 const reloaded=JSON.parse(JSON.stringify(budget));assert.equal(spendGoForBrokeUse(reloaded,'fourth').ok,false);
});
test('Direct runtime buff provenance follows its original caster, not active Wonder or recipient',()=>{
 const e=fixtureEngine();const buff=castFixtureBuff(e);
 assert.equal(e.actor.id,'wonder');assert.equal(buff.provenance.originalCasterId,'fixture-source');
 assert.equal(buff.provenance.recipientId,'fixture-other');assert.equal(buff.provenance.originalSkillId,'fixture-buff');
 assert.equal(e.supportCastContext,null);
});
test('Unknown legacy-passive ownership is excluded rather than guessed',()=>{
 const e=fixtureEngine();const buff=e.applyUnitBuff(e.state.party[2],{id:'unknown',stat:'attack',value:.2,duration:2},'passive');
 assert.match(copyIneligibleReason(buff,['wonder']),/unknown original caster/);
});
test('Nested casts restore outer caster; exception cleanup restores the source context',()=>{
 const e=fixtureEngine(), original=e.resolveSkillBody.bind(e);let nested=false;
 e.resolveSkillBody=(actor,skill,target,type,opts)=>{
  if(!nested){nested=true;castFixtureBuff(e,'fixture-other','fixture-recipient',.3,'inner');}
  return original(actor,skill,target,type,opts);
 };
 const outer=castFixtureBuff(e);assert.equal(outer.provenance.originalCasterId,'fixture-source');
 assert.equal(e.state.party[2].buffs[0].provenance.originalCasterId,'fixture-other');
 e.resolveSkillBody=()=>{throw new Error('fixture failure');};
 assert.throws(()=>castFixtureBuff(e),/fixture failure/);assert.equal(e.supportCastContext,null);
});
test('Identical skill ids cast by different allies coexist; same caster refreshes',()=>{
 const e=fixtureEngine();castFixtureBuff(e,'fixture-source','fixture-recipient');castFixtureBuff(e,'fixture-other','fixture-recipient');
 assert.equal(e.state.party[2].buffs.length,2);castFixtureBuff(e,'fixture-source','fixture-recipient',.4);
 assert.equal(e.state.party[2].buffs.length,2);close(e.state.party[2].buffs.find(b=>b.provenance.originalCasterId==='fixture-source').value,.4);
});
test('Explicit source list treats Wonder as additional SOURCE, never implicit recipient (synthetic policy)',()=>{
 const e=fixtureEngine();const a=castFixtureBuff(e),w=castFixtureBuff(e,'wonder');
 const before=e.state.party[0].buffs.length;
 const result=e.copySupportEffects([a,w],fixturePolicy({sourceCasterIds:['fixture-source','wonder']}));
 assert.equal(result.filter(r=>r.applied).length,2);assert.equal(e.state.party[0].buffs.length,before);
 assert.deepEqual(e.state.party[2].buffs.map(b=>b.provenance.originalCasterId),['fixture-source','wonder']);
});
test('Unlisted original caster is rejected even if buff recipient is an eligible source',()=>{
 const e=fixtureEngine();const buff=castFixtureBuff(e,'fixture-other','fixture-source');
 assert.equal(e.copySupportEffects([buff],fixturePolicy())[0].applied,false);
});
test('Copy policy has no guessed defaults for multiplier, duration, clock, amplification or weapon trigger',()=>{
 const e=fixtureEngine(),buff=castFixtureBuff(e);
 for(const key of ['multiplier','duration','clock','amplification','countsAsGrant']){
  const policy=fixturePolicy();delete policy[key];assert.throws(()=>prepareSupportCopy(buff,policy));
 }
});
for(const [name,changes] of [
 ['enemy debuff',{provenance:{kind:'debuff'}}],['negative debuff',{value:-.2}],
 ['unknown special effect',{specialEffect:'free-theurgy'}],['control effect',{unableToAct:true}],
 ['unknown stat',{stat:'unimplemented'}],['permanent buff',{duration:null}],
 ['expired buff',{duration:0}],['explicit exclusion',{copyEligible:false}]
]) test(`Copy excludes ${name}`,()=>{
 const e=fixtureEngine(),buff=castFixtureBuff(e);
 const altered={...buff,...changes,provenance:{...buff.provenance,...(changes.provenance||{})}};
 assert.equal(prepareSupportCopy(altered,fixturePolicy()).eligible,false);
});
test('Copy duplicate and recursive guards work in live runtime, with original AoE suppression',()=>{
 const e=fixtureEngine(),buff=castFixtureBuff(e),policy=fixturePolicy();
 assert.equal(e.copySupportEffects([buff],policy)[0].applied,true);
 assert.equal(e.copySupportEffects([buff],policy)[0].applied,false);
 const copied=e.state.party[2].buffs[0];assert.equal(e.copySupportEffects([copied],fixturePolicy({batchId:'other'}))[0].applied,false);
 assert.equal(e.copySupportEffects([buff],fixturePolicy({recipientId:'fixture-other',batchId:'aoe'}))[0].applied,false);
 assert.equal(e.state.party[2].buffs.length,1);
});
test('Separate activation refreshes, not stacks; source-specific effects stay separate',()=>{
 const e=fixtureEngine();const b=castFixtureBuff(e);e.copySupportEffects([b],fixturePolicy());
 e.advanceSupportTiming('fixture-recipient','normal_turn_end');
 e.copySupportEffects([b],fixturePolicy({batchId:'second'}));assert.equal(e.state.party[2].buffs.length,1);
 assert.equal(e.state.party[2].buffs[0].duration,2);
 const other=castFixtureBuff(e,'wonder');e.copySupportEffects([other],fixturePolicy({batchId:'third',sourceCasterIds:['wonder']}));
 assert.equal(e.state.party[2].buffs.length,2);
});
test('Resolved source amplification and explicit copy amplification apply once, not twice (synthetic)',()=>{
 const e=fixtureEngine({bossId:'hachiman',modeId:'devourer'});
 e.applyUnitBuff(e.state.party[0],{id:'wrong-owner-amp',stat:'skillAmplification',value:1,duration:4},'passive');
 e.applyUnitBuff(e.state.party[1],{id:'source-amp',stat:'skillAmplification',value:.1,duration:4},'passive');
 const buff=castFixtureBuff(e);close(buff.value,.22);
 const result=e.copySupportEffects([buff],fixturePolicy({amplification:.2}))[0];close(result.effect.value,.22*1.7*1.2);
 const again=e.amplifiedSkillStatus(result.effect,'character_skill',e.actor);close(again.value,result.effect.value);
 assert.equal(result.effect.copy.triggerOwnerId,null);
});
test('Explicit copied-grant ownership is carried separately from original caster',()=>{
 const e=fixtureEngine();const result=e.copySupportEffects([castFixtureBuff(e)],fixturePolicy({countsAsGrant:true}))[0];
 assert.equal(result.effect.provenance.originalCasterId,'fixture-source');assert.equal(result.effect.copy.triggerOwnerId,'fixture-other');
});
test('Copied effect expires only on selected owner normal turn ends; extra/interrupt/round clocks hold',()=>{
 const e=fixtureEngine();e.copySupportEffects([castFixtureBuff(e)],fixturePolicy());
 e.advanceSupportTiming('fixture-recipient','extra_action');e.advanceSupportTiming('fixture-recipient','interrupt');
 e.advanceSupportTiming('wonder','normal_turn_end');
 e.state.party[2].buffs=e.tickStatusList(e.state.party[2].buffs);
 assert.equal(e.state.party[2].buffs[0].duration,2);
 e.advanceSupportTiming('fixture-recipient','normal_turn_end');assert.equal(e.state.party[2].buffs[0].duration,1);
 e.advanceSupportTiming('fixture-recipient','normal_turn_end');assert.equal(e.state.party[2].buffs.length,0);
 assert.ok(e.state.log.some(event=>event.type==='status_expired'));
});
test('Caster-based copied duration follows its explicit owner',()=>{
 const e=fixtureEngine();e.copySupportEffects([castFixtureBuff(e)],fixturePolicy({clock:'caster_normal_turn_end',duration:1}));
 e.advanceSupportTiming('fixture-recipient','normal_turn_end');assert.equal(e.state.party[2].buffs.length,1);
 e.advanceSupportTiming('fixture-other','normal_turn_end');assert.equal(e.state.party[2].buffs.length,0);
});
test('Normal engine action completion advances the copied clock without a separate manual tick',()=>{
 const e=fixtureEngine();e.copySupportEffects([castFixtureBuff(e)],fixturePolicy({recipientId:'wonder',duration:1}));
 e.step({type:'guard',skillId:'guard'});assert.equal(e.state.party[0].buffs.length,0);
});
for(const [kind,skillId] of [['extra_skill','fixture-extra-skill'],['automatic_highlight','fixture-hl'],['automatic_theurgy','fixture-theurgy']]) test(`Executable ${kind} fixture resolves without consuming normal turn, gauge or cooldown`,()=>{
 const e=fixtureEngine();const owner=e.state.party[1];owner.skillCooldowns={'fixture-extra-skill':3};owner.theurgyGauge=73;
 const before={actorIndex:e.state.actorIndex,actionNumber:e.state.actionNumber,used:e.state.turnActionsUsed,turns:owner.characterTurnsStarted,sp:owner.sp,highlight:e.state.sharedCombat.highlightGauge,gauge:owner.theurgyGauge};
 const action={actorId:owner.id,skillId,targetId:e.state.boss.id,kind,ignoreCost:kind!=='extra_skill',idempotencyKey:'first',triggeringActorId:'fixture-other'};
 assert.equal(e.queueSupportAction(action),true);assert.equal(e.queueSupportAction(action),false);
 const available=e.getAvailableActions()[0];assert.equal(available.type,'support_extra');
 const result=e.step(available);assert.ok(result.reward>0);assert.equal(result.consumedAction,false);
 assert.equal(e.state.actorIndex,before.actorIndex);assert.equal(e.state.actionNumber,before.actionNumber);
 assert.equal(e.state.turnActionsUsed,before.used);assert.equal(owner.characterTurnsStarted,before.turns);
 assert.equal(owner.skillCooldowns['fixture-extra-skill'],3);assert.equal(owner.theurgyGauge,before.gauge);
 assert.equal(e.state.sharedCombat.highlightGauge,before.highlight);assert.equal(owner.sp,before.sp-(kind==='extra_skill'?11:0));
 assert.equal(e.queueSupportAction(action),false);assert.equal(e.state.supportRuntime.actions.length,0);
});
test('Unimplemented Theurgy fails visibly; it is not downgraded to generic Assist/Highlight',()=>{
 const e=fixtureEngine();assert.throws(()=>e.queueSupportAction({actorId:'fixture-source',skillId:'missing',kind:'automatic_theurgy'}),/explicitly implemented/);
});
test('Insufficient SP does not drop a queued skill or consume turn; defeated owner cancels with a log',()=>{
 const e=fixtureEngine();const owner=e.state.party[1];
 e.queueSupportAction({actorId:owner.id,skillId:'fixture-extra-skill',targetId:e.state.boss.id,kind:'extra_skill',ignoreCost:false,idempotencyKey:'low-sp',triggeringActorId:'fixture-other'});
 owner.sp=0;assert.throws(()=>e.resolveNextSupportAction(),/insufficient SP/);assert.equal(e.state.supportRuntime.actions.length,1);
 owner.hp=0;const result=e.resolveNextSupportAction();assert.equal(result.reward,0);assert.equal(e.state.supportRuntime.actions.length,0);
 assert.ok(e.state.log.some(event=>event.type==='support_cancelled'));
});
test('Recorded replay profile rejects foundation-only support operations',()=>{
 const e=fixtureEngine({mechanicsProfile:RECORDED_MECHANICS_PROFILE});assert.equal(e.state.supportRuntime,undefined);
 assert.throws(()=>e.copySupportEffects([],fixturePolicy()),/recorded/);
 assert.throws(()=>e.queueSupportAction({}),/recorded/);
});
for(const family of ['synthetic-alpha','synthetic-beta']) for(let n=0;n<=6;n++) test(`SYNTHETIC ${family} stat table +${n}: base/equipped and actual Attack scaling`,()=>{
 const components=[11,13,17,19,23,29,31];const ratios=family==='synthetic-alpha'?[.01,.02,.03,.04,.05,.06,.07]:[.015,.025,.035,.045,.055,.065,.075];
 const spec={mode:'base',baseAttack:500,componentAttack:enhancementValue(components,n),staticAttackRatio:enhancementValue(ratios,n),selectedWeaponId:family,temporaryAttackRatio:.05};
 const e=fixtureEngine();const stats=e.setSupportEquipmentStats('fixture-source',spec);close(stats.attack,(500+components[n])*(1+ratios[n])*1.05);
 close(e.state.party[1].mechanicAttack,stats.attack);
 const scaling=e.resolveStatus({id:'fixture-scaling',scaling:{stat:'mechanicAttack',per:1,base:0,step:.001}},e.state.party[1]);close(scaling.value,Math.floor(stats.attack)*.001);
 const equipped=equippedAttack({mode:'equipped',totalAttack:stats.permanentAttack,selectedWeaponId:family,totalIncludesWeaponId:family,componentAttack:9999,staticAttackRatio:9,temporaryAttackRatio:.05});
 close(equipped.attack,stats.attack);assert.equal(equipped.componentAdded,0);assert.equal(equipped.staticPassiveAdded,0);
});
test('Equipment recomputes from base; switches do not accumulate previous component/passive',()=>{
 const e=fixtureEngine();const spec={mode:'base',baseAttack:500,componentAttack:20,staticAttackRatio:.1,selectedWeaponId:'synthetic'};
 e.setSupportEquipmentStats('fixture-source',spec);e.setSupportEquipmentStats('fixture-source',spec);close(e.state.party[1].attack,572);
 e.setSupportEquipmentStats('fixture-source',{...spec,componentAttack:0,staticAttackRatio:0,selectedWeaponId:'none'});close(e.state.party[1].attack,500);
 assert.throws(()=>equippedAttack({mode:'equipped',totalAttack:572,selectedWeaponId:'changed',totalIncludesWeaponId:'old'}),/Weapon changed/);
});
test('Enhancement input rejects missing, mixed, unknown or extra array coefficients',()=>{
 for(const array of [[],[0,1,2,3,4,5],[0,1,2,3,4,5,null],[0,1,2,3,4,5,'6'],[0,1,2,3,4,5,6,7]]) assert.throws(()=>enhancementValue(array,0));
 for(const n of [-1,7,1.2,'2']) assert.throws(()=>enhancementValue([0,1,2,3,4,5,6],n));
});
test('Synthetic buff-grant stacks enforce owner, one per cast, cap, expiry and explicit copy policy',()=>{
 const base={stacks:[],ownerId:'holder',now:0,cap:2,duration:2,copiedBuffsCount:false};
 const grant={casterId:'holder',kind:'buff',castId:'cast-1',isCopy:false};
 assert.equal(grantStack({...base,grant:{...grant,casterId:'other'}}).length,0);
 assert.equal(grantStack({...base,grant:{...grant,kind:'debuff'}}).length,0);
 assert.equal(grantStack({...base,grant:{...grant,isCopy:true}}).length,0);
 let stacks=grantStack({...base,grant});assert.equal(grantStack({...base,stacks,grant}).length,1);
 stacks=grantStack({...base,stacks,grant:{...grant,castId:'cast-2'}});assert.equal(stacks.length,2);
 assert.equal(grantStack({...base,stacks,grant:{...grant,castId:'cast-3'}}).length,2);
 assert.equal(grantStack({...base,stacks,now:2,grant:{...grant,casterId:'other'}}).length,0);
 assert.equal(grantStack({...base,grant:{...grant,isCopy:true},copiedBuffsCount:true}).length,1);
});
test('Draft save/reload preserves every awareness, weapon and enhancement and excludes Mindscape',()=>{
 const data=new Map();const storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
 for(let a=0;a<=6;a++)for(const weaponId of ['none','ame-no-nuboko','vetri-vel-muruga'])for(let n=0;n<=6;n++){
  const saved=saveKotoneDraft(storage,{awareness:a,weaponId,enhancement:n,statsMode:'equipped',ruleset:'sync-mindscape',mindscapeCore:true});
  assert.deepEqual(loadKotoneDraft(storage),saved);assert.equal(saved.ruleset,'global-ordinary');assert.equal(saved.mindscapeCore,false);
  assert.equal(saved.enhancement,weaponId==='none'?0:n);
 }
 assert.equal(normalizeKotoneDraft({characterId:'mont-frostgale',awareness:100,weaponId:'invalid'}).characterId,'kotone-shiomi');
 assert.deepEqual(loadKotoneDraft({getItem:()=>'{bad'}),normalizeKotoneDraft());
});
test('Fast/full runtime parity for explicit fixture copies and extra actions',()=>{
 const run=fastMode=>{
  const e=fixtureEngine({fastMode});e.copySupportEffects([castFixtureBuff(e)],fixturePolicy());
  e.queueSupportAction({actorId:'fixture-recipient',skillId:'fixture-extra-skill',targetId:e.state.boss.id,kind:'extra_skill',ignoreCost:false,idempotencyKey:'extra',triggeringActorId:'fixture-other'});
  e.step(e.getAvailableActions()[0]);e.step({type:'guard',skillId:'guard'});return e;
 };
 const full=run(false),fast=run(true);const a=coreState(full),b=coreState(fast);delete a.result;delete b.result;
 assert.deepEqual(a,b);assert.deepEqual(full.state.supportRuntime,fast.state.supportRuntime);
});

test('Engine cannot copy an enemy-held or fabricated effect even with forged ally-looking provenance',()=>{
 const e=fixtureEngine(),buff=castFixtureBuff(e);
 const fabricated={...structuredClone(buff),provenance:{...buff.provenance,instanceId:'not-registered'},value:99};
 e.state.boss.debuffs.push(fabricated);
 assert.equal(e.copySupportEffects([fabricated],fixturePolicy())[0].applied,false);
 const altered={...structuredClone(buff),value:99};
 const result=e.copySupportEffects([altered],fixturePolicy())[0];close(result.effect.value,.2*1.7);
});
test('Support action API refuses actions after the encounter ends',()=>{
 const e=fixtureEngine();e.state.phase='result';
 assert.throws(()=>e.queueSupportAction({actorId:'fixture-source'}),/Encounter is over/);
 assert.throws(()=>e.resolveNextSupportAction(),/Encounter is over/);
});
