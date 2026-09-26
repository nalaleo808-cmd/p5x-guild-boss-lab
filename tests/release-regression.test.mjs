import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { BattleEngine } from '../src/engine.js';
import { runBaselineRoute,signature } from './helpers/regression.js';
const baseline=JSON.parse(await readFile(new URL('./fixtures/release-baseline.json',import.meta.url),'utf8'));
for(const c of baseline.cases)test(`Unchanged release route: ${c.config.mechanicsProfile} ${c.config.bossId} seed ${c.config.seed}`,()=>{
 const e=runBaselineRoute(BattleEngine,c.config,c.steps);assert.equal(signature(e),c.expectedSHA256);
 const fast=runBaselineRoute(BattleEngine,{...c.config,fastMode:true},c.steps);assert.equal(signature(fast),c.expectedSHA256);
});
test('Generated source catalog is unchanged',async()=>{
 const content=await readFile(new URL('../src/generated/lufel-catalog.js',import.meta.url));
 assert.equal(createHash('sha256').update(content).digest('hex'),baseline.catalogSHA256);
});
