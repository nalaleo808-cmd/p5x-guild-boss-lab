import { createHash } from 'node:crypto';
import { coreState } from './fixture.js';
export function runBaselineRoute(Engine,config,steps=16){
 const e=new Engine(config);
 for(let i=0;i<steps&&e.state.phase==='battle';i++){
  const action=e.recommend();
  if(!action)break;
  e.step({type:action.type,skillId:action.skillId,targetId:action.targetId||action.target});
 }
 return e;
}
export function signature(engine){return createHash('sha256').update(JSON.stringify(coreState(engine))).digest('hex');}
