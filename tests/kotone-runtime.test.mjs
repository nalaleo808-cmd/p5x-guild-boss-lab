import test from 'node:test';
import assert from 'node:assert/strict';
import { engine,get,act,advanceToKotone,cast,originalBuff,copies,finishFortune,finishCold,near,K,unit } from './helpers/kotone.js';
import { kotoneShiomi,kotoneAwareness,kotoneWeapons,kotoneWeaponProfile,kotoneCoefficients as C,kotoneCoefficientsFor,kotoneSkillTables as T } from '../src/characters/kotone-shiomi-data.js';
import { normalizeKotoneLoadout, normalizeKotoneDraft, eligibleKotoneCopySources, saveKotoneDraft,loadKotoneDraft } from '../src/characters/kotone-shiomi-mechanics.js';
import { withLocalCharacters } from '../src/characters/kotone-overlay.js';
import { lufelCatalog } from '../src/generated/lufel-catalog.js';

for(let awareness=0;awareness<=6;awareness++)test(`Runtime A${awareness}: initial link, resources and actual Go for Broke gate`,()=>{
 const e=engine({awareness}),m=e.kotoneMechanics;
 assert.equal(m.linked.id,'test-dps');assert.equal(m.state.lunarBond,awareness?5:0);assert.equal(m.countPowerful(),awareness?1:0);
 assert.equal(m.state.goForBroke.limit,awareness===6?2:1);
 const before=get(e).sp;act(e,'kotone_assist');assert.equal(get(e).sp,before);
 assert.equal(m.state.ultimateActivationIds.includes('gfb-1-own'),awareness>=1);
 finishFortune(e);assert.equal(m.state.cold,2);assert.equal(m.state.goForBroke.used,1);assert.equal(m.state.extraActions,2);
 finishCold(e);assert.equal(e.getAvailableActions().find(a=>a.type==='kotone_assist').enabled,awareness===6);
});
test('A3 raises Skill 1 and A5 raises Skills 2 and 3 to LV13; Highlight stays LV10; Mindscape picks the +M5 column',()=>{
 for(const tier of kotoneAwareness)assert.equal(tier.implemented,true);
 const col=(awareness,mindscape,slot)=>{const c=kotoneCoefficientsFor({awareness,mindscape});return {c,levels:c.skillLevels};};
 for(const mindscape of [0,5])for(let awareness=0;awareness<=6;awareness++){
  const {c,levels}=col(awareness,mindscape);const m5=mindscape===5?1:0;
  const s1=(awareness>=3?2:0)+m5,s23=(awareness>=5?2:0)+m5;
  assert.equal(levels.S1,awareness>=3?13:10);assert.equal(levels.S2,awareness>=5?13:10);assert.equal(levels.HL,10);
  assert.equal(c.s1Crit,T.s1Crit[s1]);assert.equal(c.powerfulAttack,T.powerfulAttack[s1]);assert.equal(c.powerfulFinal,T.powerfulFinal[s1]);
  assert.equal(c.s2Hit,T.s2Hit[s23]);assert.equal(c.s2FortuneAddedPower,T.s2FortuneAddedPower[s23]);assert.equal(c.s3Attack,T.s3Attack[s23]);
  assert.equal(c.highlightCrit,T.highlightCrit[m5]);assert.equal(c.highlightAttack,T.highlightAttack[m5]);
  assert.equal(c.attackCaps.S1,T.attackCap[s1]);assert.equal(c.attackCaps.S2,T.attackCap[s23]);assert.equal(c.attackCaps.HL,T.attackCap[m5]);
 }
 assert.equal(kotoneCoefficientsFor({awareness:6,mindscape:5}).s1Crit,.227);assert.equal(kotoneCoefficientsFor({awareness:0,mindscape:0}).s2Hit,.539);
 assert.throws(()=>kotoneCoefficientsFor({mindscape:3}),/0 or 5/);assert.throws(()=>engine({mindscape:3}),/0 or 5/);
 assert.equal(get(engine()).kotone.build.mindscape,5);
 near(get(engine({awareness:5})).kotone.coefficients.s3Attack,.341);near(get(engine({awareness:5,mindscape:0})).kotone.coefficients.s3Attack,.311);
 assert.match(kotoneShiomi.status,/experimental/);assert.equal(kotoneShiomi.mindscapeCore,false);
 for(const ruleset of ['sync-mindscape','cn'])assert.throws(()=>engine({ruleset}),/ordinary Global/);
 assert.throws(()=>engine({mindscapeCore:true}),/ordinary Global/);
});
test('Initial Arcana Link selects strongest eligible Sweeper/Assassin, not strongest support',()=>{
 const e=engine({}, {teamIds:[K,'wonder','test-weak','test-strong'],characterDefinitions:[unit('test-weak','Sweeper',50),unit('test-strong','Assassin',80)],loadouts:{wonder:{baseStats:{attack:99999}}}});
 assert.equal(e.kotoneMechanics.linked.id,'test-strong');
});
test('Reselection resets Lunar Bond, moves permanent A1 Bond, costs no turn and still allows GFB',()=>{
 const e=engine({awareness:6}),m=e.kotoneMechanics;m.state.lunarBond=10;
 const action=e.state.actionNumber,sp=get(e).sp;
 act(e,'kotone_link','wonder');assert.equal(e.state.actionNumber,action);assert.equal(get(e).sp,sp);
 assert.equal(m.linked.id,'wonder');assert.equal(m.state.lunarBond,5);assert.equal(m.countPowerful('test-dps'),0);assert.equal(m.countPowerful('wonder'),1);
 assert.throws(()=>act(e,'kotone_link','test-support'),/No kotone_link/);
 act(e,'kotone_assist');assert.equal(m.state.fortune,true);
 assert.throws(()=>m.selectLink('test-support'),/normal turn/);
});
test('A6 two complete Go for Broke cycles, a blocked third use, and normal action accounting',()=>{
 const e=engine({awareness:6}),m=e.kotoneMechanics;
 for(let n=0;n<2;n++) {
  const startAction=e.state.actionNumber, starts=get(e).characterTurnsStarted;
  act(e,'kotone_assist');act(e,'S3','test-support');
  assert.equal(e.actor.id,K);assert.equal(e.state.actionNumber,startAction);assert.equal(get(e).skillCooldowns[`${K}-s3`],2);
  act(e,'S1');assert.equal(e.state.actionNumber,startAction);assert.equal(get(e).characterTurnsStarted,starts);
  act(e,'S2');assert.equal(e.state.actionNumber,startAction+1);assert.equal(m.state.cold,2);
  assert.equal(get(e).skillCooldowns[`${K}-s3`],2);
  advanceToKotone(e);assert.equal(get(e).skillCooldowns[`${K}-s3`],1);assert.deepEqual(e.getAvailableActions().map(a=>a.type),['kotone_cold']);
  act(e,'kotone_cold');advanceToKotone(e);assert.equal(get(e).skillCooldowns[`${K}-s3`],0);act(e,'kotone_cold');advanceToKotone(e);
 }
 assert.equal(m.state.goForBroke.used,2);assert.equal(m.state.extraActions,4);assert.equal(m.state.normalTurnsCompleted,6);
 const third=e.getAvailableActions().find(a=>a.type==='kotone_assist');assert.equal(third.enabled,false);
 assert.throws(()=>e.step(third),/Unavailable/);assert.throws(()=>m.activateGoForBroke(),/battle use limit/);
});
test('Cold suppresses skills and paid Highlight; GFB automatic ultimates spend no gauge or SP',()=>{
 const e=engine({awareness:6}),m=e.kotoneMechanics;e.state.sharedCombat.highlight=100;
 const sp=get(e).sp,starts=get(e).characterTurnsStarted,cd=structuredClone(get(e).highlightCooldowns);
 act(e,'kotone_assist');assert.equal(e.state.sharedCombat.highlight,100);assert.equal(get(e).sp,sp);assert.deepEqual(get(e).highlightCooldowns,cd);assert.equal(get(e).characterTurnsStarted,starts);
 finishFortune(e);advanceToKotone(e);assert.equal(e.getHighlightActions().some(a=>a.actorId===K),false);
 assert.throws(()=>cast(e,'S1'),/Cold/);
});
test('Automatic activation IDs are idempotent',()=>{
 const e=engine({awareness:6}),m=e.kotoneMechanics;const target=m.linked;
 m.automaticUltimate(target,'once');const damage=e.state.totalDamage,buffs=structuredClone(target.buffs);
 m.automaticUltimate(target,'once');assert.equal(e.state.totalDamage,damage);assert.deepEqual(target.buffs,buffs);
});
test('S1 spends 20 SP, caps separate critical and Powerful Bond stacks, activates A1 at three Bonds',()=>{
 const e=engine({awareness:1}),m=e.kotoneMechanics;const sp=get(e).sp;
 for(let i=0;i<5;i++)cast(e,'S1');assert.equal(get(e).sp,sp-100);
 const buffs=m.linked.buffs;assert.equal(buffs.filter(b=>/^kotone-s1-crit-\d$/.test(b.id)).length,3);assert.equal(m.countPowerful(),3);
 assert.ok(buffs.some(b=>b.id==='kotone-a1-crit'&&b.value===.3));assert.ok(buffs.some(b=>b.id==='kotone-passive-pierce'&&b.value===.12));
 assert.ok(buffs.some(b=>b.id==='kotone-passive-atk'&&b.value===.09));
 assert.equal(m.state.powerfulBonds[m.linked.id].filter(b=>b.permanent).length,1);
});
test('S1 applied off-link grants no Powerful or Lunar Bond',()=>{
 const e=engine();cast(e,'S1','wonder');assert.equal(e.kotoneMechanics.countPowerful('wonder'),0);assert.equal(e.kotoneMechanics.state.lunarBond,0);
});
test('Attack-based support scales to its skill-level cap (5164 at A0 with Mindscape 5) and clamps above it',()=>{
 for(const attack of [2582,5164,10328]){
  const e=engine({baseStats:{attack,maxHp:100000,maxSp:1000}});cast(e,'S1');
  near(e.kotoneMechanics.linked.buffs.find(b=>b.id==='kotone-s1-crit-0').value,C.s1Crit*Math.min(1,attack/C.attackCaps.S1));
 }
});
test('Lunar Bond skill triggers are once per cast, never per hit, and cap at ten',()=>{
 const e=engine({awareness:1}),m=e.kotoneMechanics;
 cast(e,'S2',e.state.boss.id);assert.equal(m.state.lunarBond,5);
 for(let i=0;i<12;i++)cast(e,'S1');assert.equal(m.state.lunarBond,10);
 assert.ok(m.linked.buffs.some(b=>b.id==='kotone-lunar-crit'&&b.value===.5));
});
test('S2 resolves three Fire packets; single-enemy bonus and Fortune additive coefficient policy',()=>{
 const a=engine(),b=engine();const initial=a.state.boss.downPoints;
 cast(a,'S2',a.state.boss.id);const normal=a.state.lastEvents.filter(x=>x.type==='damage'&&x.actorId===K);
 assert.equal(normal.length,3);const damageA=a.state.totalDamage;
 act(b,'kotone_assist');cast(b,'S2',b.state.boss.id);const damageB=b.state.totalDamage;
 assert.ok(damageB>damageA*5);assert.equal(b.state.boss.downPoints,initial-2);
 const before=b.kotoneMechanics.state.lunarBond;assert.equal(before,0);
});
test('S2 three-Powerful-Bond debuff is applied after damage and not copied as an ally buff',()=>{
 const e=engine({awareness:1}),m=e.kotoneMechanics;cast(e,'S1');cast(e,'S1');assert.equal(m.countPowerful(),3);
 cast(e,'S2',e.state.boss.id);const debuff=e.state.boss.debuffs.find(b=>b.id==='kotone-s2-damage-taken');assert.ok(debuff);assert.equal(debuff.duration,1);
 assert.equal(m.linked.buffs.some(b=>b.id===debuff.id),false);
});
test('A4 adds party damage to automatic Highlight; A2 extends Fortune buffs',()=>{
 for(const awareness of [0,1,2,4]){
  const e=engine({awareness});act(e,'kotone_assist');cast(e,'HL');
  const recipient=e.kotoneMechanics.linked;
  assert.equal(recipient.buffs.find(b=>b.id==='kotone-hl-crit').duration,awareness>=2?5:4);
  assert.equal(recipient.buffs.some(b=>b.id==='kotone-a4-damage'),awareness>=4);
 }
});
for(const awareness of [0,2,5,6])for(const selectedId of [K,'wonder','test-dps','test-support'])test(`S3 A${awareness} caster matrix selected=${selectedId}`,()=>{
 const e=engine({awareness}),m=e.kotoneMechanics;
 for(const source of ['wonder','test-support','test-dps'])originalBuff(e,source);
 const expected=eligibleKotoneCopySources({selectedId,linkedId:m.linked.id,awareness,wonderPresent:true});
 cast(e,'S3',selectedId);const copied=copies(e);
 assert.deepEqual(copied.map(b=>b.provenance.originalCasterId).sort(),expected.sort());
 assert.equal(get(e,'wonder').buffs.some(b=>b.provenance?.isCopy),false);
 for(const effect of copied)near(effect.value,.2*(awareness>=2?.375:.3));
});
test('A6 with Wonder already linked never adds Wonder as an additional copy source',()=>{
 const e=engine({awareness:6});act(e,'kotone_link','wonder');
 originalBuff(e,'wonder','wonder');originalBuff(e,'test-support','wonder');
 cast(e,'S3','test-support');assert.deepEqual(copies(e).map(b=>b.provenance.originalCasterId),['test-support']);
});
test('S3 reads buffs on linked RECIPIENT, not buffs received by selected SOURCE',()=>{
 const e=engine({awareness:6});originalBuff(e,'test-support','wonder',.9);originalBuff(e,'wonder','test-dps',.2);
 cast(e,'S3','test-support');assert.deepEqual(copies(e).map(b=>b.provenance.originalCasterId),['wonder']);
});
test('Original and copied effect coexist; duplicate same batch is rejected, later cast refreshes rather than stacks',()=>{
 const e=engine({awareness:6}),m=e.kotoneMechanics;const original=originalBuff(e);
 const r=m.copyBuffs('wonder','copy-once');assert.equal(r.filter(x=>x.applied).length,1);assert.equal(copies(e).length,1);
 assert.equal(m.copyBuffs('wonder','copy-once').filter(x=>x.applied).length,0);
 m.copyBuffs('wonder','copy-next');assert.equal(copies(e).length,1);
 assert.ok(m.linked.buffs.includes(original));assert.equal(m.linked.buffs.filter(b=>b.provenance?.originalCasterId==='wonder').length,2);
});
test('No recursive copy; unknown origin, permanent, negative, special and enemy effects are rejected',()=>{
 const e=engine({awareness:6}),m=e.kotoneMechanics;originalBuff(e);m.copyBuffs('wonder','first');
 for(const [i,extra]of [{specialMechanic:true},{duration:999},{value:-.2},{stat:'skillAmplification'}].entries()){
  e.applyUnitBuff(m.linked,{id:`reject-${i}`,stat:'attack',value:.3,duration:2,...extra},'persona_skill',{casterId:'wonder',skillId:`unsupported-${i}`,castId:`u-${i}`});
 }
 e.applyUnitBuff(m.linked,{id:'unknown',stat:'attack',value:.2,duration:2},'passive');
 const enemy={id:'enemy',damageTaken:true,value:.3,duration:2};e.applyEnemyStatus(e.state.boss,'debuffs',enemy,'persona_skill','wonder');
 const results=m.copyBuffs('wonder','second');assert.equal(copies(e).length,1);assert.ok(results.some(x=>!x.applied));
 assert.equal(copies(e)[0].provenance.isCopy,true);assert.ok(copies(e)[0].provenance.parentInstanceId);
});
test('A2 explicit ratio, Fortune duration, Skill Amplification applied exactly once to additional copy',()=>{
 const e=engine({awareness:6,weaponId:'vetri-vel-muruga',enhancement:6,a2CopyRatio:.5});originalBuff(e);act(e,'kotone_assist');cast(e,'S3','wonder');
 const effect=copies(e)[0];near(effect.value,.2*.5*1.19);assert.equal(effect.duration,3);
 assert.ok(effect.provenance.isCopy);
});
test('Copy expiry advances only on recipient normal ends, not Kotone extra actions or interrupts',()=>{
 const e=engine({awareness:6});originalBuff(e);cast(e,'S3','wonder');assert.equal(copies(e)[0].duration,1);
 for(const kind of ['extra_action','interrupt'])e.advanceSupportTiming('test-dps',kind);
 assert.equal(copies(e)[0].duration,1);e.advanceSupportTiming(K,'normal_turn_end');assert.equal(copies(e)[0].duration,1);
 e.advanceSupportTiming('test-dps','normal_turn_end');assert.equal(copies(e).length,0);
 assert.ok(e.kotoneMechanics.linked.buffs.some(b=>b.provenance?.originalCasterId==='wonder'&&!b.provenance.isCopy));
});
test('Temporary Powerful Bonds expire; the A1 permanent Bond remains and weapon crit updates',()=>{
 const e=engine({awareness:1,weaponId:'vetri-vel-muruga'}),m=e.kotoneMechanics;cast(e,'S1');cast(e,'S1');
 near(m.linked.buffs.find(b=>b.id==='kotone-weapon-pb-crit').value,.18);
 for(let i=0;i<3;i++)m.normalTurnEnd(m.linked.id);
 assert.equal(m.countPowerful(),1);near(m.linked.buffs.find(b=>b.id==='kotone-weapon-pb-crit').value,.06);
 assert.equal(m.linked.buffs.some(b=>b.id==='kotone-pb-final'),false);
});
for(let enhancement=0;enhancement<=6;enhancement++)test(`Vetri Vel Muruga +${enhancement}: component/stat, Lunar threshold, stack-based crit in runtime`,()=>{
 const staticA=[.30,.30,.39,.39,.48,.48,.57],amp=[.10,.13,.13,.16,.16,.19,.19],crit=[.06,.078,.078,.096,.096,.114,.114];
 const e=engine({weaponId:'vetri-vel-muruga',enhancement}),m=e.kotoneMechanics;
 near(get(e).attack,(2500+713.51)*(1+staticA[enhancement]));assert.equal(get(e).maxHp,102259);near(get(e).defense,718.4);
 near(e.skillAmplificationFor(get(e)),0);m.state.lunarBond=5;m.refreshAuras();near(e.skillAmplificationFor(get(e)),amp[enhancement]);
 cast(e,'S1');near(m.linked.buffs.find(b=>b.id==='kotone-weapon-pb-crit').value,crit[enhancement]);
 cast(e,'S1');cast(e,'S1');near(m.linked.buffs.find(b=>b.id==='kotone-weapon-pb-crit').value,3*crit[enhancement]);
 const pb=m.linked.buffs.find(b=>b.id==='kotone-pb-atk');near(pb.value,C.powerfulAttack*(1+amp[enhancement]));
});
test('Ame-no-Nuboko +0: static and stacking Attack, one trigger per buff cast, three-stack cap and expiry',()=>{
 const e=engine({weaponId:'ame-no-nuboko'}),m=e.kotoneMechanics;near(get(e).attack,(2500+570.52)*1.12);assert.equal(get(e).maxHp,101808);
 assert.equal(m.state.weaponStacks.length,0);originalBuff(e);assert.equal(m.state.weaponStacks.length,0);
 cast(e,'S1');assert.equal(m.state.weaponStacks.length,1);near(get(e).buffs.find(b=>b.id==='kotone-weapon-grant-atk').value,.073);
 cast(e,'S3','wonder');assert.equal(m.state.weaponStacks.length,2);assert.equal(copies(e).length,1);
 cast(e,'HL');cast(e,'S1');assert.equal(m.state.weaponStacks.length,3);near(get(e).buffs.find(b=>b.id==='kotone-weapon-grant-atk').value,.219);
 cast(e,'S2',e.state.boss.id);assert.equal(m.state.weaponStacks.length,3);
 get(e).characterTurnsStarted++;for(let i=0;i<3;i++)m.normalTurnEnd(K);assert.equal(m.state.weaponStacks.length,0);
});
for(let enhancement=0;enhancement<=6;enhancement++)test(`Ame-no-Nuboko +${enhancement}: sourced static and per-stack Attack`,()=>{
 const staticA=[.12,.12,.16,.16,.20,.20,.24],grant=[.073,.096,.096,.119,.119,.142,.142];
 const profile=kotoneWeaponProfile('ame-no-nuboko',enhancement);near(profile.staticAttack,staticA[enhancement]);near(profile.grantAttack,grant[enhancement]);
 const e=engine({weaponId:'ame-no-nuboko',enhancement});near(get(e).attack,(2500+570.52)*(1+staticA[enhancement]));
 cast(e,'S1');near(get(e).buffs.find(b=>b.id==='kotone-weapon-grant-atk').value,grant[enhancement]);
});
test('Equipped totals never re-add weapon components or static Attack; reset weapon changes support scaling',()=>{
 const e=engine({weaponId:'vetri-vel-muruga',enhancement:6,statsMode:'equipped',baseStats:{attack:4000,maxHp:6000,maxSp:1000,defense:500}});
 near(get(e).attack,4000);assert.equal(get(e).maxHp,6000);assert.equal(get(e).defense,500);
 assert.throws(()=>normalizeKotoneLoadout({...get(e).kotone.build,enhancement:5}),/fresh equipped totals/);
 const a=engine(),m=a.kotoneMechanics;const before=m.scale();m.configureEquipment({weaponId:'ame-no-nuboko',awareness:0});assert.ok(m.scale()>before);
 near(get(a).attack,(2500+570.52)*1.12);m.configureEquipment({weaponId:'none'});near(get(a).attack,2500);
 act(a,'S1');assert.throws(()=>m.configureEquipment({weaponId:'none'}),/locked/);
});
test('Normal saved loadout and separate draft survive JSON/storage round trips',()=>{
 const build=normalizeKotoneLoadout({awareness:6,weaponId:'vetri-vel-muruga',enhancement:4,a2CopyRatio:.5,statsMode:'equipped',baseStats:{attack:5000,maxHp:6000,defense:700}});
 assert.deepEqual(normalizeKotoneLoadout(JSON.parse(JSON.stringify(build))),build);
 let saved;const storage={getItem:()=>saved,setItem:(_key,val)=>{saved=val;}};const draft=saveKotoneDraft(storage,build);assert.deepEqual(loadKotoneDraft(storage),draft);
 const a=engine(build),b=engine(JSON.parse(JSON.stringify(build)));assert.deepEqual(get(a).kotone,get(b).kotone);
});
test('Local catalog regeneration overlay retains one Shiomi and never replaces Montagne',()=>{
 const result=withLocalCharacters([{id:'mont',slug:'mont'},{id:'frost',slug:'mont-frostgale'},{id:'upstream-kotone',slug:'kotone'}]);
 assert.equal(result.filter(c=>c.id===K).length,1);assert.deepEqual(result.slice(0,2).map(c=>c.id),['mont','frost']);assert.equal(result.length,3);
});
for(const weaponId of ['none','ame-no-nuboko','vetri-vel-muruga'])test(`Real A6 run ${weaponId}: deterministic full/fast parity including two Fortune activations and copy state`,()=>{
 function run(fastMode){const e=engine({awareness:6,weaponId},{fastMode});originalBuff(e,'wonder');originalBuff(e,'test-support');
  for(let i=0;i<2;i++){act(e,'kotone_assist');finishFortune(e,['S3','S1','S2']);finishCold(e);}
  return {damage:e.state.totalDamage,score:e.state.score,rng:e.state.rng,party:e.state.party,action:e.state.actionNumber,clock:e.state.supportRuntime?.clock};}
 assert.deepEqual(run(false),run(true));
});
for(const slug of ['makoto','yukari','akihiko'])test(`Forced ${slug} Theurgy adapter: executes actual damage, preserves gauge/SP/normal turns and applies kit resource`,()=>{
 const actor=lufelCatalog.characters.find(c=>c.slug===slug);assert.ok(actor);
 const e=engine({awareness:6},{teamIds:[K,'wonder',actor.id,'test-support'],characterDefinitions:[actor,unit('test-support')]});const m=e.kotoneMechanics,u=get(e,actor.id);
 if(m.linked?.id!==u.id)act(e,'kotone_link',u.id);
 const gauge=e.state.sharedCombat.highlight,sp=u.sp,starts=u.characterTurnsStarted,action=e.state.actionNumber;
 m.automaticUltimate(u,'force-test');assert.ok(e.state.totalDamage>0);assert.equal(e.state.sharedCombat.highlight,gauge);assert.equal(u.sp,sp);assert.equal(u.characterTurnsStarted,starts);assert.equal(e.state.actionNumber,action);assert.equal(u.forcedTheurgyUses,1);
 const packets=e.state.lastEvents.filter(x=>x.type==='damage'&&x.actorId===u.id&&x.sourceType==='theurgy');assert.equal(packets.length,slug==='makoto'?4:1);
 if(slug==='makoto'){assert.ok(u.fullMoonStacks>0);assert.ok(get(e).buffs.some(b=>b.id==='makoto-onsite-leader'&&b.value===.7));}
 if(slug==='yukari')assert.ok(get(e).buffs.some(b=>b.id==='yukari-cyclone-damage'));
 if(slug==='akihiko'){assert.equal(packets[0].critical,true);assert.ok(u.buffs.some(b=>b.id==='akihiko_rough_combo'));}
});
for(const id of ['joker','mona','wonder'])test(`Existing beta ${id} automatic Highlight fallback is not silently blocked`,()=>{
 const e=engine({awareness:6},{teamIds:[K,'wonder','joker','mona']}),m=e.kotoneMechanics;
 if(m.linked?.id!==id)act(e,'kotone_link',id);
 const before=e.state.totalDamage;m.automaticUltimate(get(e,id),`fallback-${id}`);
 assert.ok(e.state.totalDamage>before);assert.equal(m.state.unresolvedUltimate,undefined);
});
test('Non-weapon inputs plus weapon and Revelation modifiers applied once; equipped totals bypass both',()=>{
 const revelationCombat={attackPercent:.2,hpPercent:.1};
 const e=engine({weaponId:'vetri-vel-muruga',revelationCombat});near(get(e).attack,(2500+713.51)*1.3*1.2);assert.equal(get(e).maxHp,Math.round((100000+2259.46)*1.1));
 const a=engine({weaponId:'vetri-vel-muruga',revelationCombat,statsMode:'equipped'});near(get(a).attack,2500);assert.equal(get(a).maxHp,100000);
});
test('Invalid numeric stats, awareness and enhancement are rejected by combat normalization',()=>{
 for(const build of [{awareness:9},{enhancement:9},{baseStats:{attack:-1}},{baseStats:{maxHp:0}},{weaponId:'invented'}])assert.throws(()=>engine(build));
});
test('Copy provenance follows actual source skill context on a linked unit, excluding navigator/unknown passive origin',()=>{
 const e=engine({awareness:6});const original=originalBuff(e,'wonder');assert.equal(original.provenance.originalCasterId,'wonder');
 assert.equal(original.provenance.recipientId,'test-dps');assert.equal(e.supportCastContext,null);
 cast(e,'S3','test-support');assert.equal(copies(e).length,1);assert.equal(copies(e)[0].provenance.appliedById,K);
});
test('Paid Highlight interrupt does not consume Kotone normal-turn opening or Go for Broke availability',()=>{
 const e=engine({awareness:6});e.state.sharedCombat.highlight=100;const before=e.state.actionNumber;
 e.stepHighlight(K);assert.equal(e.state.actionNumber,before);assert.equal(e.getAvailableActions().find(a=>a.type==='kotone_assist').enabled,true);
 act(e,'kotone_assist');assert.equal(e.kotoneMechanics.state.fortune,true);
});
test('Public simulate/recommend policy completes with Kotone and full/fast runs agree',async()=>{
 const {simulate}=await import('../src/engine.js');
 const base=engine({awareness:6,weaponId:'vetri-vel-muruga'},{teamIds:[K,'wonder','joker','mona']});
 const config={...base.config,bossDefinition:base.bossDefinition,characterDefinitions:base.characterDefinitions};
 const a=simulate({...config,fastMode:false}),b=simulate({...config,fastMode:true});
 assert.equal(a.phase,'results');assert.equal(a.totalDamage,b.totalDamage);assert.equal(a.rng,b.rng);
 assert.deepEqual(a.party,b.party);assert.equal(a.party.find(u=>u.id===K).kotone.goForBroke.used,2);
});
test('Kotone Concert extra turns do not advance her normal counter, skill cooldown, SP recovery, or Cold',()=>{
 const e=engine({awareness:6}),k=get(e),m=e.kotoneMechanics;
 const original=e.isVirtualConcertActive;e.isVirtualConcertActive=()=>true;
 k.skillCooldowns[`${K}-s3`]=2;k.sp=100;const starts=k.characterTurnsStarted;
 e.beginActorTurn();assert.equal(k.characterTurnsStarted,starts);assert.equal(k.skillCooldowns[`${K}-s3`],2);assert.equal(k.sp,100);
 assert.equal(e.getAvailableActions().some(a=>a.type==='kotone_link'),false);
 // 2026-09-26 DOD rotation: Go for Broke can open a Concert turn.
 assert.equal(e.getAvailableActions().find(a=>a.type==='kotone_assist').enabled,true);
 e.isVirtualConcertActive=original;
});

// User, 2026-09-28 and the 2026-09-26 DOD rotation: in Concert round 2 Kotone
// is in Cold, does not act, and that turn counts toward Cold's two turns.
test('Cold blocks Concert turns and each one counts toward Cold',()=>{
 const e=engine({awareness:6}),m=e.kotoneMechanics;
 const original=e.isVirtualConcertActive;e.isVirtualConcertActive=()=>true;
 m.state.cold=2;e.beginActorTurn();
 const actions=e.getAvailableActions();
 assert.deepEqual(actions.map(a=>a.type),['kotone_cold']);
 act(e,'kotone_cold');assert.equal(m.state.cold,1);
 e.isVirtualConcertActive=original;
});

test('A Go for Broke opened on a Concert turn has three extra actions and no normal action',()=>{
 const e=engine({awareness:6}),k=get(e),m=e.kotoneMechanics;k.sp=1000;
 const original=e.isVirtualConcertActive;e.isVirtualConcertActive=()=>true;
 e.state.navigator.virtualConcert={active:true,roundsRemaining:2,damageByTarget:{},totalRecordedDamage:0,savedTurn:null};
 e.beginActorTurn();act(e,'kotone_assist');
 for(let i=0;i<3;i++)act(e,'S2');
 assert.equal(m.state.normalActions,0);assert.equal(m.state.extraActions,3);assert.equal(m.state.cold,2);
 e.isVirtualConcertActive=original;
});

// User, 2026-09-28: Go for Broke, two actions, Go for Broke again before the
// third action, then three more actions = five actions in one turn.
test('A6 Go for Broke can be chained on the last Fortune action for five actions in one turn',()=>{
 const e=engine({awareness:6}),k=get(e),m=e.kotoneMechanics;k.sp=1000;
 const chainOffered=()=>e.getAvailableActions().find(a=>a.type==='kotone_assist').enabled;
 act(e,'kotone_assist');
 for(let i=0;i<2;i++){assert.equal(e.actor.id,K);assert.equal(chainOffered(),false);act(e,'S2');}
 assert.equal(chainOffered(),true);
 assert.equal(m.state.fortuneActionsLeft,1);
 act(e,'kotone_assist');assert.equal(m.state.goForBroke.used,2);assert.equal(m.state.fortuneActionsLeft,3);
 for(let i=0;i<3;i++){assert.equal(e.actor.id,K);act(e,'S2');}
 assert.equal(m.state.fortune,false);assert.equal(m.state.cold,2);assert.notEqual(e.actor.id,K);
 assert.equal(m.state.normalActions,1);assert.equal(m.state.extraActions,4);
});

test('Owned Strategist aura counts the selected main Wonder Persona, including imported Korean role metadata',()=>{
 for(const metadata of [{role:'Strategist'},{position:'우월'}]) {
  const e=engine({}, {personaIds:['test-main'],personaDefinitions:[{id:'test-main',name:'Role fixture',skills:[],...metadata}]});
  near(get(e,'test-dps').buffs.find(b=>b.id==='kotone-account-final').value,.03);
 }
 const e=engine({}, {personaIds:['test-main'],personaDefinitions:[{id:'test-main',name:'Non-Strategist fixture',role:'Assassin',skills:[]}]});
 near(get(e,'test-dps').buffs.find(b=>b.id==='kotone-account-final').value,.02);
});
test('Pre-battle equipment accounting updates the exposed stat basis without double adding components',()=>{
 const e=engine(),m=e.kotoneMechanics;
 m.configureEquipment({weaponId:'vetri-vel-muruga',statsMode:'equipped',baseStats:{attack:4500,maxHp:6000,defense:400}});
 assert.equal(get(e).statsMode,'equipped');near(get(e).attack,4500);near(m.scale(),4500/C.attackCaps.S1);
});
