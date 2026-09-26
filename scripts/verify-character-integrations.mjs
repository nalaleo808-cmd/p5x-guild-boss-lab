// Verify the editable import overlay without rewriting any synced source data.
import {readFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {withLocalCharacters,characterMechanicsRegistry} from '../src/characters/registry.js';
import {lufelCatalog} from '../src/generated/lufel-catalog.js';
export async function verifyCharacterIntegrations() {
 const root=new URL('../',import.meta.url);
 const manifest=JSON.parse(await readFile(new URL('config/character-integrations.json',root),'utf8'));
 const characters=withLocalCharacters(lufelCatalog.characters);
 for(const entry of manifest.characters){
  for(const path of [entry.dataModule,entry.mechanicsModule,entry.registryModule])await access(new URL(path,root));
  const matches=characters.filter(c=>c.id===entry.id);
  if(matches.length!==1||!characterMechanicsRegistry[entry.id])throw Error(`Incomplete integration: ${entry.id}`);
  if(matches[0].profileId!==entry.profileId||matches[0].ruleset!==entry.ruleset||matches[0].mindscapeCore!==false)throw Error(`Profile mismatch: ${entry.id}`);
 }
 console.log(`Verified ${manifest.characters.length} local character integration; generated catalog unchanged.`);
 return characters;
}
if(process.argv[1]===fileURLToPath(import.meta.url))await verifyCharacterIntegrations();
