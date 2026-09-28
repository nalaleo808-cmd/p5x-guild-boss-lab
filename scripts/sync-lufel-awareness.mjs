// Downloads Lufelnet Awareness (ritual.js), weapon (weapon.js) and skill text
// for every character in data/lufel-live-recent.json. The existing skill
// snapshot and generated catalog are left untouched; this writes a separate
// reference file named after the Lufel version the site serves.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { get, assignedObject } from './lib/lufel-source.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const site = 'https://lufel.net';

// Lufel's ?v= query is only a cache-buster, so read the version the site
// actually serves and name the output after it.
const manifest = await get(`${site}/assets/js/version-manifest.js`);
const version = manifest.match(/APP_VERSION\s*=\s*'([^']+)'/)?.[1];
if (!version) throw new Error('Lufel APP_VERSION not found in version-manifest.js');

const snapshot = JSON.parse(await readFile(resolve(root, 'data/lufel-live-recent.json'), 'utf8'));
const records = [];
for (const { slug, sourceKey, codename } of snapshot.characters) {
  const base = `${site}/data/characters/${encodeURIComponent(sourceKey)}`;
  const urls = { ritual: `${base}/ritual.js?v=${version}`, weapon: `${base}/weapon.js?v=${version}`, skill: `${base}/skill.js?v=${version}` };
  const [ritualSource, weaponSource, skillSource] = await Promise.all(Object.values(urls).map(get));
  const awarenessEn = assignedObject(ritualSource, `window.enCharacterRitualData["${sourceKey}"]`, { optional: true });
  const weaponsEn = assignedObject(weaponSource, `window.enCharacterWeaponData["${sourceKey}"]`, { optional: true });
  records.push({
    slug, sourceKey, codename, urls,
    awareness: awarenessEn,
    awarenessKr: awarenessEn ? null : assignedObject(ritualSource, `window.ritualData["${sourceKey}"]`, { optional: true }),
    weapons: weaponsEn,
    weaponsKr: assignedObject(weaponSource, `window.WeaponData["${sourceKey}"]`, { optional: true }),
    skills: assignedObject(skillSource, `window.enCharacterSkillsData["${sourceKey}"]`, { optional: true })
  });
  console.log(`Synced ${records.length}/${snapshot.characters.length}: ${codename}`);
}

await writeFile(resolve(root, `data/lufel-awareness-weapons-${version}.json`), `${JSON.stringify({
  schemaVersion: '1.0', generatedAt: new Date().toISOString(),
  source: { name: 'Lufelnet', url: `${site}/en/character/`, version,
    note: 'Tooltip text only. Numbers here are sourced; timing and trigger order are not combat-script verified.' },
  characters: records
}, null, 2)}\n`);
console.log(`Saved data/lufel-awareness-weapons-${version}.json`);
