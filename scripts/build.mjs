// Dependency-free static build for the uploaded runtime-only beta archive.
// The upstream build/import scripts were not in that archive; this is a new build.
import {verifyCharacterIntegrations} from './verify-character-integrations.mjs';
await verifyCharacterIntegrations();
import { cp, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('../', import.meta.url));
for (const item of ['index.html', 'manifest.webmanifest', 'src/app.js', 'assets/characters/kotone-shiomi.webp']) await access(join(root, item));
const output = join(root, 'dist');
await mkdir(output, { recursive: true });
for (const item of ['index.html', 'manifest.webmanifest', 'src', 'assets', 'data']) {
  await cp(join(root, item), join(output, item), { recursive: true });
}
const hash = async path => createHash('sha256').update(await readFile(join(root,path))).digest('hex');
await writeFile(join(output,'kotone-checkpoint-build.json'), JSON.stringify({
  baseRelease:'v2.0.0-beta', status:'playable-experimental-global-tooltip-profile',
  sourceCatalogSHA256:await hash('src/generated/lufel-catalog.js'),
  assetSHA256:await hash('assets/characters/kotone-shiomi.webp')
},null,2)+'\n');
console.log('Static build ready in dist/. Kotone is playable with explicitly documented source limitations.');
