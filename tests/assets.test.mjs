import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { kotoneShiomi } from '../src/characters/kotone-shiomi-data.js';
const manifest=JSON.parse(await readFile(new URL('../assets/characters/kotone-shiomi-asset-manifest.json',import.meta.url),'utf8'));
test('Local identity art paths resolve to manifest assets',()=>{
 assert.equal(manifest.characterId,kotoneShiomi.id);
 assert.equal(manifest.canvas.width,724);assert.equal(manifest.canvas.height,724);
 assert.equal(manifest.canvas.contentBoxMax,674);
 for(const path of [kotoneShiomi.artwork,kotoneShiomi.avatar])assert.ok(manifest.assets.some(a=>`/${a.asset}`===path));
});
for(const asset of manifest.assets)test(`Asset bytes match inspected RGBA normalization: ${asset.asset}`,async()=>{
 const bytes=await readFile(new URL(`../${asset.asset}`,import.meta.url));
 assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
 assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);
 assert.deepEqual(asset.size,[724,724]);assert.equal(asset.mode,'RGBA');
 const [x,y,right,bottom]=asset.alphaBounds;assert.ok(x>=25&&y>=25&&right<=699&&bottom<=699);
});
