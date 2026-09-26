import {writeFile,mkdir} from 'node:fs/promises';
import {engine,get,act,cast,originalBuff,copies,finishFortune,finishCold} from '../tests/helpers/kotone.js';
// Controlled trainer has very high HP so the uploaded beta's HP floor does not
// mask weapon differences. All settings and policy are identical across rows.
function run({awareness=6,weaponId='none',enhancement=0}={}) {
 const e=engine({awareness,weaponId,enhancement});
 originalBuff(e,'test-support');originalBuff(e,'wonder');
 act(e,'kotone_assist');act(e,'S3','test-support');
 const copied=copies(e).map(b=>({caster:b.provenance.originalCasterId,recipient:b.provenance.recipientId,value:b.value,duration:b.duration}));
 act(e,'S1');act(e,'S2');const burstDamage=e.state.totalDamage;
 finishCold(e);
 let secondUse=false;
 if(e.getAvailableActions().some(a=>a.type==='kotone_assist'&&a.enabled)) {act(e,'kotone_assist');finishFortune(e);finishCold(e);secondUse=true;}
 const thirdAllowed=e.getAvailableActions().some(a=>a.type==='kotone_assist'&&a.enabled);
 return {awareness,weaponId,enhancement,permanentAttack:get(e).attack,copied,firstFortuneDamage:burstDamage,
  totalDamage:e.state.totalDamage,secondUse,thirdAllowed,budget:get(e).kotone.goForBroke,
  extraActions:get(e).kotone.extraActions,normalTurnsCompleted:get(e).kotone.normalTurnsCompleted};
}
const cases=[{awareness:5},{awareness:6},{awareness:6,weaponId:'ame-no-nuboko'},...Array.from({length:7},(_,enhancement)=>({awareness:6,weaponId:'vetri-vel-muruga',enhancement}))];
const results=cases.map(run);
const report={profile:'global-ordinary-tooltip-2026-09-26',seed:17,trainingFixture:'tests/helpers/kotone.js',
 note:'EXPERIMENTAL fixed tooltip coefficients and explicit provisional A2=0.375; not calibrated game damage. Synthetic external 20% buffs are test inputs, not new character mechanics.',results};
console.table(results.map(({awareness,weaponId,enhancement,permanentAttack,copied,firstFortuneDamage,totalDamage,secondUse,thirdAllowed})=>({awareness,weaponId,enhancement,permanentAttack,copies:copied.length,firstFortuneDamage,totalDamage,secondUse,thirdAllowed})));
await mkdir(new URL('../verification/',import.meta.url),{recursive:true});
await writeFile(new URL('../verification/kotone-battle-example.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
