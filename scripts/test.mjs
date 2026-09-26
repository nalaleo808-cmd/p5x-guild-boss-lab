// Portable discovery: works on Windows without shell glob expansion and fails
// when no actual test files exist (rather than reporting a misleading success).
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
async function discover(dir){
 const found=[];
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=join(dir,entry.name);
  if(entry.isDirectory())found.push(...await discover(path));
  else if(entry.isFile()&&/\.test\.(mjs|js|cjs)$/.test(entry.name))found.push(path);
 }
 return found.sort();
}
const tests=await discover(join(root,'tests'));
if(!tests.length){console.error('No test files found. Refusing a zero-test success.');process.exit(1);}
const result=spawnSync(process.execPath,['--test',...tests],{cwd:root,stdio:'inherit'});
if(result.error)console.error(result.error.message);
process.exit(result.status??1);
